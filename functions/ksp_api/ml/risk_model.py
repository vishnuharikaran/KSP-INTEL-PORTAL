import json
import os
import random
import re
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

# Define districts and zones
DISTRICTS = [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", 
    "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", 
    "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", 
    "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", 
    "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", 
    "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir", 
    "Vijayanagara"
]

SE_ZONES = {
    "Bengaluru Urban": 4,
    "Mysuru": 3, "Dakshina Kannada": 3, "Belagavi": 3, "Dharwad": 3,
    "Davanagere": 2, "Shivamogga": 2, "Tumakuru": 2, "Udupi": 2, "Ballari": 2, "Kalaburagi": 2, "Kolar": 2,
}

CRIME_SEVERITY = {
    "Sextortion": 8,
    "Job Fraud": 6,
    "Phishing": 6,
    "Romance Scam": 6,
    "OLX Scam": 5,
    "UPI Fraud": 5,
    "Social Media Abuse": 4
}

def get_se_zone(district):
    return SE_ZONES.get(district, 1)

def compute_district_features(records):
    # Prepare repeat offender phone mappings (reused in multiple cases >= 3 times)
    from collections import Counter
    phones = [r["accused_phone"] for r in records if r.get("accused_phone")]
    phone_counts = Counter(phones)
    repeat_phones = {p for p, count in phone_counts.items() if count >= 3}

    district_features = {}
    for d in DISTRICTS:
        district_features[d] = {
            "cases": [],
            "cases_last_6_months": 0,
            "repeat_cases": 0,
            "total_prior_convictions": 0,
            "total_severity": 0
        }

    # Reference date for last 6 months (July 15, 2026)
    ref_date = "2026-07-15"
    six_months_ago = "2026-01-15"

    for r in records:
        d = r["victim_district"]
        if d not in district_features:
            continue
        
        df = district_features[d]
        df["cases"].append(r)
        
        # 6 months check
        if six_months_ago <= r["date_of_incident"] <= ref_date:
            df["cases_last_6_months"] += 1
            
        # Repeat offenders check
        phone = r["accused_phone"]
        if phone in repeat_phones:
            df["repeat_cases"] += 1
            # simulate 1 to 3 prior convictions for repeat offenders
            # use deterministic seed based on phone number to keep it consistent
            seed_val = sum(ord(c) for c in phone)
            random.seed(seed_val)
            df["total_prior_convictions"] += random.randint(1, 3)
            
        # Severity score
        severity = CRIME_SEVERITY.get(r["crime_type"], 5)
        df["total_severity"] += severity

    # Compile district feature rows
    rows = []
    for d in DISTRICTS:
        df = district_features[d]
        total_cases = len(df["cases"])
        if total_cases == 0:
            total_cases = 1 # Avoid division by zero
            
        crime_count_last_6_months = df["cases_last_6_months"]
        repeat_offender_ratio = df["repeat_cases"] / total_cases
        avg_prior_convictions = df["total_prior_convictions"] / total_cases
        socioeconomic_zone_encoded = get_se_zone(d)
        crime_severity_score = df["total_severity"] / total_cases

        # Calculate a deterministic predicted trend based on last 30 days vs previous 30 days
        last_30 = sum(1 for r in df["cases"] if "2026-06-15" <= r["date_of_incident"] <= ref_date)
        prev_30 = sum(1 for r in df["cases"] if "2026-05-15" <= r["date_of_incident"] < "2026-06-15")
        
        trend_val = 0
        if prev_30 > 0:
            trend_val = int(((last_30 - prev_30) / prev_30) * 100)
        else:
            trend_val = last_30 * 10 # dummy positive trend

        trend_text = f"↑ {abs(trend_val)}% next 30 days" if trend_val >= 0 else f"↓ {abs(trend_val)}% next 30 days"

        # Top contributing factor
        factors = [
            ("Repeat offenders", repeat_offender_ratio * 40),
            ("High severity cases", crime_severity_score * 5),
            ("Urban volume density", crime_count_last_6_months * 0.1),
            ("Socioeconomic density", socioeconomic_zone_encoded * 8)
        ]
        factors.sort(key=lambda x: x[1], reverse=True)
        top_factor = factors[0][0]

        rows.append({
            "district": d,
            "crime_count_last_6_months": crime_count_last_6_months,
            "repeat_offender_ratio": repeat_offender_ratio,
            "avg_prior_convictions": avg_prior_convictions,
            "socioeconomic_zone_encoded": socioeconomic_zone_encoded,
            "crime_severity_score": crime_severity_score,
            "top_factor": top_factor,
            "predicted_trend": trend_text
        })

    return rows

def train_and_predict_risk(records):
    # Compute features for actual districts
    district_rows = compute_district_features(records)
    
    # Generate synthetic training set to fit RandomForestRegressor
    # We want the model to learn a realistic relationship
    np.random.seed(42)
    n_samples = 150
    
    train_crime_6m = np.random.randint(5, 500, n_samples)
    train_repeat_ratio = np.random.uniform(0.05, 0.45, n_samples)
    train_prior_conv = train_repeat_ratio * np.random.uniform(1.5, 3.5, n_samples)
    train_zone = np.random.randint(1, 5, n_samples)
    train_severity = np.random.uniform(4.0, 7.5, n_samples)
    
    # target risk score (0-100) based on features
    train_risk = (
        0.05 * train_crime_6m + 
        80 * train_repeat_ratio + 
        4 * train_prior_conv + 
        6 * train_zone + 
        3 * train_severity + 
        np.random.normal(0, 3, n_samples)
    )
    # Clamp target between 15 and 95
    train_risk = np.clip(train_risk, 15, 95)
    
    X_train = pd.DataFrame({
        "crime_count_last_6_months": train_crime_6m,
        "repeat_offender_ratio": train_repeat_ratio,
        "avg_prior_convictions": train_prior_conv,
        "socioeconomic_zone_encoded": train_zone,
        "crime_severity_score": train_severity
    })
    y_train = train_risk
    
    # Fit RF Regressor
    model = RandomForestRegressor(n_estimators=40, random_state=42)
    model.fit(X_train, y_train)
    
    # Predict on actual districts
    results = []
    for row in district_rows:
        features_df = pd.DataFrame([{
            "crime_count_last_6_months": row["crime_count_last_6_months"],
            "repeat_offender_ratio": row["repeat_offender_ratio"],
            "avg_prior_convictions": row["avg_prior_convictions"],
            "socioeconomic_zone_encoded": row["socioeconomic_zone_encoded"],
            "crime_severity_score": row["crime_severity_score"]
        }])
        
        pred_score = int(model.predict(features_df)[0])
        # Ensure it fits KSP constraints
        pred_score = max(10, min(98, pred_score))
        
        # Risk level categorization
        risk_level = "LOW"
        if pred_score >= 70:
            risk_level = "HIGH"
        elif pred_score >= 40:
            risk_level = "MEDIUM"
            
        results.append({
            "district": row["district"],
            "risk_score": pred_score,
            "risk_level": risk_level,
            "top_contributing_factor": row["top_factor"],
            "predicted_trend": row["predicted_trend"]
        })
        
    return results

if __name__ == "__main__":
    # Test script loading data from records
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    records_file = os.path.join(parent_dir, "cybercrime_records.json")
    if os.path.exists(records_file):
        with open(records_file, "r") as f:
            records = json.load(f)
        scores = train_and_predict_risk(records)
        print("Trained RF Model successfully. First 3 results:")
        print(scores[:3])
