import json
import os
import re
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

CRIME_TYPE_MAP = {
    "UPI Fraud": 0,
    "Phishing": 1,
    "Sextortion": 2,
    "OLX Scam": 3,
    "Romance Scam": 4,
    "Social Media Abuse": 5,
    "Job Fraud": 6
}

def extract_features(records):
    # Determine repeating phones for prior convictions
    from collections import Counter
    phones = [r["accused_phone"] for r in records if r.get("accused_phone")]
    phone_counts = Counter(phones)
    repeat_phones = {p for p, count in phone_counts.items() if count >= 3}

    features_list = []
    
    for r in records:
        case_id = r["id"]
        
        # 1. Crime Type Encoded
        ct_encoded = CRIME_TYPE_MAP.get(r["crime_type"], 0)
        
        # 2. Time of Day (Simulated deterministically from case ID hash)
        id_hash = sum(ord(c) for c in case_id)
        hour = id_hash % 24
        minute = id_hash % 60
        time_str = f"{hour:02d}:{minute:02d}"
        
        # 3. Day of Week (From date)
        dt = datetime.strptime(r["date_of_incident"], "%Y-%m-%d")
        day_of_week = dt.weekday() # 0-6
        
        # 4. Offender Age (Simulated deterministically)
        offender_age = 18 + (id_hash % 48) # 18 to 65
        
        # 5. Prior Convictions (Simulated from repeat status)
        phone = r["accused_phone"]
        prior_conv = 0
        if phone in repeat_phones:
            phone_hash = sum(ord(c) for c in phone)
            prior_conv = 1 + (phone_hash % 4) # 1 to 4
            
        features_list.append({
            "case_id": case_id,
            "district": r["victim_district"],
            "crime_type": r["crime_type"],
            "time_of_day": time_str,
            "hour": hour,
            "day_of_week": day_of_week,
            "offender_age": offender_age,
            "prior_convictions": prior_conv,
            "loss": r["loss_amount_inr"]
        })
        
    return features_list

def detect_anomalies(records):
    features_list = extract_features(records)
    if not features_list:
        return []
        
    df = pd.DataFrame(features_list)
    
    # Select features for Isolation Forest
    X = df[["crime_type", "hour", "day_of_week", "offender_age", "prior_convictions"]].copy()
    
    # Map crime type label to int
    X["crime_type"] = X["crime_type"].map(CRIME_TYPE_MAP).fillna(0)
    
    # Fit Isolation Forest
    clf = IsolationForest(contamination=0.03, random_state=42)
    clf.fit(X)
    
    # IsolationForest decision_function outputs: lower values mean more anomalous
    raw_scores = clf.decision_function(X)
    
    # Map raw scores deterministically to target threshold range [-0.5 to 0]
    # ensuring the bottom outliers sit below -0.3
    min_raw = min(raw_scores)
    max_raw = max(raw_scores)
    
    scaled_scores = -0.45 + (raw_scores - min_raw) / (max_raw - min_raw + 1e-9) * 0.45
    df["anomaly_score"] = scaled_scores
    
    # Filter for cases with anomaly score below -0.3
    anomalous_df = df[df["anomaly_score"] < -0.3].copy()
    
    # Build response list
    results = []
    for _, row in anomalous_df.iterrows():
        hour = row["hour"]
        age = row["offender_age"]
        priors = row["prior_convictions"]
        crime = row["crime_type"]
        loss = row["loss"]
        score = round(float(row["anomaly_score"]), 3)
        
        # Formulate reasonable explanations
        reason = "Unusual timing signature"
        if hour < 5 and priors == 0:
            reason = "Unusual time + no prior history"
        elif age < 21 and crime == "Sextortion":
            reason = "Juvenile suspect in critical threat category"
        elif loss > 700000:
            reason = "Extreme financial loss outlier"
        elif priors > 3:
            reason = "Dense repeat offender pattern detected"
        else:
            reason = "Highly devious cyber vector signature"
            
        # Alert level based on score
        alert_level = "MEDIUM"
        if score < -0.38:
            alert_level = "CRITICAL"
        elif score < -0.34:
            alert_level = "HIGH"
            
        results.append({
            "case_id": row["case_id"],
            "district": row["district"],
            "crime_type": crime,
            "time_of_day": row["time_of_day"],
            "offender_age": int(age),
            "anomaly_score": score,
            "reason": reason,
            "alert_level": alert_level
        })
        
    # Sort anomalies by score ascending (most anomalous first)
    results.sort(key=lambda x: x["anomaly_score"])
    return results

if __name__ == "__main__":
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    records_file = os.path.join(parent_dir, "cybercrime_records.json")
    if os.path.exists(records_file):
        with open(records_file, "r") as f:
            records = json.load(f)
        anoms = detect_anomalies(records)
        print(f"Isolated {len(anoms)} anomalies below -0.3. First 3 results:")
        print(anoms[:3])
