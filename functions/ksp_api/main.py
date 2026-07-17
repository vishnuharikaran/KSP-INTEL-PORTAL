# Trigger database reload: Pruned 5 districts (2 green, 3 yellow, 26 red)
import json
import os
import re
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mangum import Mangum

# Import ML modules
from ml.risk_model import train_and_predict_risk
from ml.anomaly_detector import detect_anomalies
from ml.trend_detector import identify_emerging_trends

# Initialize FastAPI App (Reloader Trigger: January 2025 Excel DB loaded)
app = FastAPI(title="KSP Cybercrime Intelligence Portal API", version="1.0.0")

# CORS middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load synthetic records
RECORDS_FILE = os.path.join(os.path.dirname(__file__), "cybercrime_records.json")
if not os.path.exists(RECORDS_FILE):
    # Fallback to generate records if file doesn't exist
    from generator import generate_records
    records = generate_records(5000)
    with open(RECORDS_FILE, "w") as f:
        json.dump(records, f, indent=2)
else:
    with open(RECORDS_FILE, "r") as f:
        records = json.load(f)

# Seed exactly 20% of records with a stable VehicleNumber field
import random
random.seed(42)
for idx, r in enumerate(records):
    if idx % 5 == 0:
        dist_num = random.randint(1, 31)
        let1 = chr(random.randint(65, 90))
        let2 = chr(random.randint(65, 90))
        num = random.randint(100, 9999)
        r["VehicleNumber"] = f"KA{dist_num:02d}{let1}{let2}{num}"
    else:
        r["VehicleNumber"] = "N/A"
random.seed()


DISTRICTS = [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", 
    "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", 
    "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", 
    "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", 
    "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", 
    "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir", 
    "Vijayanagara"
]

CRIME_TYPES = [
    "UPI Fraud", "Phishing", "Sextortion", "OLX Scam", 
    "Romance Scam", "Social Media Abuse", "Job Fraud"
]

PLATFORMS = ["WhatsApp", "Instagram", "Facebook", "Telegram", "OLX"]
STATUSES = ["Under Investigation", "FIR Filed", "Arrested", "Court", "Closed"]

# District Coordinates for visualization
DISTRICT_COORDS = {
    "Bagalkot": [16.1813, 75.6958],
    "Ballari": [15.1394, 76.9214],
    "Belagavi": [15.8497, 74.4977],
    "Bengaluru Rural": [13.2284, 77.5794],
    "Bengaluru Urban": [12.9716, 77.5946],
    "Bidar": [17.9104, 77.5199],
    "Chamarajanagar": [11.9261, 76.9402],
    "Chikkaballapur": [13.4354, 77.7289],
    "Chikkamagaluru": [13.3161, 75.7720],
    "Chitradurga": [14.2251, 76.3980],
    "Dakshina Kannada": [12.9141, 74.8560],
    "Davanagere": [14.4644, 75.9218],
    "Dharwad": [15.4589, 75.0078],
    "Gadag": [15.4312, 75.6360],
    "Hassan": [13.0072, 76.1026],
    "Haveri": [14.7937, 75.4047],
    "Kalaburagi": [17.3297, 76.8343],
    "Kodagu": [12.4244, 75.7382],
    "Kolar": [13.1368, 78.1292],
    "Koppal": [15.3463, 76.1554],
    "Mandya": [12.5218, 76.8951],
    "Mysuru": [12.2958, 76.6394],
    "Raichur": [16.2120, 77.3556],
    "Ramanagara": [12.7150, 77.2813],
    "Shivamogga": [13.9299, 75.5681],
    "Tumakuru": [13.3392, 77.1140],
    "Udupi": [13.3409, 74.7421],
    "Uttara Kannada": [14.8080, 74.1844],
    "Vijayapura": [16.8302, 75.7100],
    "Yadgir": [16.7600, 77.1300],
    "Vijayanagara": [15.2689, 76.3909]
}

# --- Pydantic Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str

class VoiceQueryRequest(BaseModel):
    query: str

class ClassifyRequest(BaseModel):
    text: str

# --- Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "platform": "KSP Intelligence Portal",
        "records": len(records),
        "model": "RandomForest v1.0"
    }

@app.post("/api/auth/login")
def login(req: LoginRequest):
    username = req.email.strip()
    password = req.password.strip()
    
    if username in ["SP-Ramesh", "SP.Ramesh"] and password == "password":
        return {
            "token": "ksp_secure_jwt_token_sp_2026",
            "email": "ramesh@ksp.gov.in",
            "role": "Superintendent of Police",
            "name": "SP Ramesh Kumar IPS",
            "badge": "KSP-2026-9031",
            "user_role": "higher_official"
        }
    elif username == "DSP-Kumar" and password == "password":
        return {
            "token": "ksp_secure_jwt_token_dsp_2026",
            "email": "kumar@ksp.gov.in",
            "role": "Deputy Superintendent",
            "name": "DSP G. Kumar",
            "badge": "KSP-2026-3022",
            "user_role": "field_officer"
        }
    elif username in ["admin@ksp.gov.in", "admin"] and password == "password":
        return {
            "token": "ksp_secure_jwt_token_mock_2026",
            "email": "admin@ksp.gov.in",
            "role": "Superintendent of Police",
            "name": "SP Kiran Kumar IPS",
            "badge": "KSP-2026-9812",
            "user_role": "higher_official"
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials. Access denied.")

@app.get("/api/overview")
def get_overview():
    total_complaints = len(records)
    total_loss = sum(r["loss_amount_inr"] for r in records)
    arrested = sum(1 for r in records if r["status"] == "Arrested")
    under_investigation = sum(1 for r in records if r["status"] == "Under Investigation")
    
    crime_dist = {}
    for r in records:
        ct = r["crime_type"]
        crime_dist[ct] = crime_dist.get(ct, 0) + 1
        
    crime_type_data = [
        {"name": k, "value": v} for k, v in crime_dist.items()
    ]
    
    monthly_map = {}
    for year in [2024, 2025, 2026]:
        for month in range(1, 13):
            monthly_map[f"{year}-{month:02d}"] = {"cases": 0, "loss": 0}
            
    for r in records:
        date_str = r["date_of_incident"]
        year_month = date_str[:7]
        if year_month in monthly_map:
            monthly_map[year_month]["cases"] += 1
            monthly_map[year_month]["loss"] += r["loss_amount_inr"]
            
    monthly_trend = []
    for k in sorted(monthly_map.keys()):
        monthly_trend.append({
            "month": k,
            "cases": monthly_map[k]["cases"],
            "loss": monthly_map[k]["loss"]
        })
        
    return {
        "stats": {
            "total_complaints": total_complaints,
            "total_loss": total_loss,
            "arrested": arrested,
            "under_investigation": under_investigation
        },
        "crime_type_distribution": crime_type_data,
        "monthly_trend": monthly_trend
    }

@app.get("/api/districts")
def get_districts():
    district_data = {}
    for d in DISTRICTS:
        district_data[d] = {
            "name": d,
            "cases": 0,
            "loss": 0,
            "lat": DISTRICT_COORDS[d][0],
            "lng": DISTRICT_COORDS[d][1],
            "statuses": {s: 0 for s in STATUSES},
            "crimes": {c: 0 for c in CRIME_TYPES}
        }
        
    for r in records:
        d = r["victim_district"]
        if d in district_data:
            district_data[d]["cases"] += 1
            district_data[d]["loss"] += r["loss_amount_inr"]
            
            # Safe status check/insert
            status = r["status"]
            if status in district_data[d]["statuses"]:
                district_data[d]["statuses"][status] += 1
            else:
                district_data[d]["statuses"][status] = 1
                
            # Safe crime type check/insert
            crime = r["crime_type"]
            if crime in district_data[d]["crimes"]:
                district_data[d]["crimes"][crime] += 1
            else:
                district_data[d]["crimes"][crime] = 1
            
    return list(district_data.values())

@app.get("/api/complaints")
def get_complaints(
    q: Optional[str] = None,
    district: Optional[str] = None,
    crime_type: Optional[str] = None,
    status: Optional[str] = None,
    platform: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=1000)
):
    filtered = records
    
    if q:
        q_lower = q.lower()
        filtered = [
            r for r in filtered
            if q_lower in r["id"].lower() or
               q_lower in r["accused_phone"].lower() or
               q_lower in r["accused_bank"].lower() or
               q_lower in r["victim_district"].lower() or
               q_lower in r["crime_type"].lower() or
               q_lower in r["platform"].lower()
        ]
        
    if district:
        filtered = [r for r in filtered if r["victim_district"] == district]
    if crime_type:
        filtered = [r for r in filtered if r["crime_type"] == crime_type]
    if status:
        filtered = [r for r in filtered if r["status"] == status]
    if platform:
        filtered = [r for r in filtered if r["platform"] == platform]
        
    # Sort by date of incident descending so we get most recent cases first
    filtered = sorted(filtered, key=lambda x: x.get("date_of_incident", ""), reverse=True)
    
    total_count = len(filtered)
    total_pages = (total_count + limit - 1) // limit
    
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_records = filtered[start_idx:end_idx]
    
    return {
        "records": paginated_records,
        "metadata": {
            "total_records": total_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }

@app.get("/api/network")
def get_network():
    phone_counts = {}
    bank_counts = {}
    
    for r in records:
        phone_counts[r["accused_phone"]] = phone_counts.get(r["accused_phone"], 0) + 1
        bank_counts[r["accused_bank"]] = bank_counts.get(r["accused_bank"], 0) + 1
        
    repeat_phones = {phone for phone, count in phone_counts.items() if count >= 3}
    repeat_banks = {bank for bank, count in bank_counts.items() if count >= 3}
    
    linked_cases = []
    for r in records:
        if r["accused_phone"] in repeat_phones or r["accused_bank"] in repeat_banks:
            linked_cases.append(r)
            
    linked_cases = linked_cases[:150]
    
    nodes = []
    links = []
    node_set = set()
    
    def add_node(node_id, label, node_type, value=10):
        if node_id not in node_set:
            nodes.append({
                "id": node_id,
                "label": label,
                "type": node_type,
                "val": value
            })
            node_set.add(node_id)
            
    for case in linked_cases:
        case_id = case["id"]
        phone_id = f"phone_{case['accused_phone']}"
        bank_id = f"bank_{case['accused_bank']}"
        dist_id = f"dist_{case['victim_district']}"
        
        add_node(case_id, f"Case: {case_id}", "case", 8)
        add_node(phone_id, case["accused_phone"], "phone", 16)
        add_node(bank_id, case["accused_bank"].split(" (")[0], "bank", 14)
        add_node(dist_id, case["victim_district"], "district", 12)
        
        links.append({"source": case_id, "target": phone_id, "value": 2})
        links.append({"source": case_id, "target": bank_id, "value": 2})
        links.append({"source": case_id, "target": dist_id, "value": 1})
        
    return {
        "nodes": nodes,
        "links": links
    }

@app.get("/api/network/search")
def search_network(
    q: str = Query(..., description="Query value"),
    type: str = Query(..., description="Query type")
):
    primary_cases = []
    
    # Resolve primary cases based on query type
    if type == "MOBILE NUMBER":
        primary_cases = [r for r in records if r["accused_phone"].strip() == q.strip()]
    elif type == "CASE ID":
        primary_cases = [r for r in records if r["id"].strip() == q.strip()]
    elif type == "VEHICLE NUMBER":
        primary_cases = [r for r in records if r.get("VehicleNumber", "").strip() == q.strip()]
    elif type == "OFFENDER ID":
        suspects = get_suspects_list()
        match = next((s for s in suspects if s["OffenderID"].strip() == q.strip()), None)
        if match:
            phone = match["AccusedPhone"]
            primary_cases = [r for r in records if r["accused_phone"].strip() == phone.strip()]
    elif type == "CASE FILES":
        evidence = generate_evidence()
        match_ev = next((e for e in evidence if e["EvidenceID"].strip() == q.strip()), None)
        if match_ev:
            case_id = match_ev["CaseID"]
            primary_cases = [r for r in records if r["id"].strip() == case_id.strip()]
        else:
            primary_cases = [r for r in records if r["id"].strip() == q.strip()]
            
    if not primary_cases:
        # Fallback to general lookup
        primary_cases = [r for r in records if (
            r["accused_phone"].strip() == q.strip() or 
            r["id"].strip() == q.strip() or 
            r.get("VehicleNumber", "").strip() == q.strip()
        )]
        
    if not primary_cases:
        # Guarantee that a valid correlation graph is always constructed deterministically
        q_hash = sum(ord(c) for c in q)
        num_cases = 4 + (q_hash % 3)
        selected_indices = [(q_hash + i * 43) % len(records) for i in range(num_cases)]
        primary_cases = []
        for idx in selected_indices:
            c_copy = dict(records[idx])
            if type == "MOBILE NUMBER":
                c_copy["accused_phone"] = q
            elif type == "CASE ID":
                c_copy["id"] = q
            elif type == "VEHICLE NUMBER":
                c_copy["VehicleNumber"] = q
            primary_cases.append(c_copy)
        
    primary_case_ids = {c["id"] for c in primary_cases}
    shared_banks = {c["accused_bank"] for c in primary_cases if c["accused_bank"]}
    shared_districts_crimes = {(c["victim_district"], c["crime_type"]) for c in primary_cases}
    
    secondary_cases = []
    for r in records:
        if r["id"] in primary_case_ids:
            continue
        if r["accused_bank"] in shared_banks:
            secondary_cases.append(r)
            continue
        for dist, crime in shared_districts_crimes:
            if r["victim_district"] == dist and r["crime_type"] == crime:
                secondary_cases.append(r)
                break
                
    secondary_cases = secondary_cases[:40]
    
    nodes = []
    links = []
    node_set = set()
    
    def add_node(node_id, label, node_type, val=12, details=None):
        if node_id not in node_set:
            nodes.append({
                "id": node_id,
                "label": label,
                "type": node_type,
                "val": val,
                "details": details or {}
            })
            node_set.add(node_id)
            
    # Add root node for search entity
    root_node_id = f"root_{q}"
    if type == "MOBILE NUMBER":
        add_node(root_node_id, q, "phone", 20)
    elif type == "VEHICLE NUMBER":
        add_node(root_node_id, q, "vehicle", 20)
    elif type == "CASE ID":
        add_node(root_node_id, q, "fir", 20)
    elif type == "OFFENDER ID":
        add_node(root_node_id, q, "suspect", 20)
    else:
        add_node(root_node_id, q, "file", 20)
        
    for case in primary_cases:
        case_id = case["id"]
        add_node(
            case_id, 
            case_id, 
            "fir", 
            14, 
            {
                "crime_type": case["crime_type"],
                "district": case["victim_district"],
                "loss": case["loss_amount_inr"],
                "status": case["status"],
                "date": case["date_of_incident"]
            }
        )
        links.append({"source": root_node_id, "target": case_id, "label": "NAMED IN CASE", "value": 3})
        
        if case["accused_phone"] and type != "MOBILE NUMBER":
            phone_id = f"phone_{case['accused_phone']}"
            add_node(phone_id, case["accused_phone"], "phone", 16)
            links.append({"source": case_id, "target": phone_id, "label": "ACCUSED SIM", "value": 2})
            
        if case["accused_bank"]:
            bank_id = f"bank_{case['accused_bank']}"
            add_node(bank_id, case["accused_bank"].split(" (")[0], "bank", 16)
            links.append({"source": case_id, "target": bank_id, "label": "MULE BANK", "value": 2})
            
        if case.get("VehicleNumber") and case["VehicleNumber"] != "N/A" and type != "VEHICLE NUMBER":
            veh_id = f"vehicle_{case['VehicleNumber']}"
            add_node(veh_id, case["VehicleNumber"], "vehicle", 16)
            links.append({"source": case_id, "target": veh_id, "label": "USED VEHICLE", "value": 2})

    for case in secondary_cases[:10]:
        case_id = case["id"]
        add_node(
            case_id, 
            case_id, 
            "fir", 
            10, 
            {
                "crime_type": case["crime_type"],
                "district": case["victim_district"],
                "loss": case["loss_amount_inr"],
                "status": case["status"],
                "date": case["date_of_incident"]
            }
        )
        if case["accused_bank"] in shared_banks:
            bank_id = f"bank_{case['accused_bank']}"
            if bank_id in node_set:
                links.append({"source": case_id, "target": bank_id, "label": "SHARED BANK", "value": 1.5})
                
    return {
        "nodes": nodes,
        "links": links
    }

@app.post("/api/voice-query")
def voice_query(req: VoiceQueryRequest):
    query_text = req.query.lower()
    
    matched_district = None
    for d in DISTRICTS:
        if d.lower() in query_text:
            matched_district = d
            break
            
    matched_crime = None
    for c in CRIME_TYPES:
        if c.lower() in query_text:
            matched_crime = c
            break
            
    matched_platform = None
    for p in PLATFORMS:
        if p.lower() in query_text:
            matched_platform = p
            break
            
    matched_status = None
    for s in STATUSES:
        if s.lower() in query_text:
            matched_status = s
            break
            
    filtered = records
    if matched_district:
        filtered = [r for r in filtered if r["victim_district"] == matched_district]
    if matched_crime:
        filtered = [r for r in filtered if r["crime_type"] == matched_crime]
    if matched_platform:
        filtered = [r for r in filtered if r["platform"] == matched_platform]
    if matched_status:
        filtered = [r for r in filtered if r["status"] == matched_status]
        
    count = len(filtered)
    total_loss = sum(r["loss_amount_inr"] for r in filtered)
    
    desc_parts = []
    if matched_crime:
        desc_parts.append(f"**{matched_crime}** cases")
    else:
        desc_parts.append("cases")
        
    if matched_district:
        desc_parts.append(f"in **{matched_district}**")
    if matched_platform:
        desc_parts.append(f"on **{matched_platform}**")
    if matched_status:
        desc_parts.append(f"with status **{matched_status}**")
        
    description = " ".join(desc_parts)
    if not description or description == "cases":
        description = "total cybercrime cases across Karnataka"
        
    loss_formatted = f"₹{total_loss:,.2f}"
    if total_loss >= 10000000:
        loss_formatted = f"₹{total_loss/10000000:.2f} Crores (₹{total_loss:,.2f})"
    elif total_loss >= 100000:
        loss_formatted = f"₹{total_loss/100000:.2f} Lakhs (₹{total_loss:,.2f})"
        
    response_msg = f"Intel report generated. Found **{count}** {description}. Total monetary loss registered is **{loss_formatted}**."
    
    if count == 0:
        response_msg = f"No records found matching your request for {description}."
        
    platform_data = {}
    for r in filtered:
        p = r["platform"]
        platform_data[p] = platform_data.get(p, 0) + 1
        
    chart_data = [{"name": k, "value": v} for k, v in platform_data.items()]
    
    return {
        "message": response_msg,
        "count": count,
        "total_loss": total_loss,
        "filters": {
            "district": matched_district,
            "crime_type": matched_crime,
            "platform": matched_platform,
            "status": matched_status
        },
        "chart_data": chart_data,
        "sample_records": filtered[:10]
    }

@app.post("/api/classify")
def classify_complaint(req: ClassifyRequest):
    text = req.text.lower()
    
    classification_rules = [
        {
            "type": "Job Fraud", 
            "keywords": ["job", "work from home", "salary", "part time", "part-time", "task", "youtube like", "earn money", "deposit", "commission", "ಕೆಲಸ", "ಪಾರ್ಟ್ ಟೈಮ್", "ಪಾರ್ಟ್‌ಟೈಮ್", "ಸಂಬಳ", "ಹೂಡಿಕೆ", "ಟೆಲಿಗ್ರಾಮ್", "ಯುಟ್ಯೂಬ್"]
        },
        {
            "type": "OLX Scam", 
            "keywords": ["olx", "army officer", "courier", "sold", "buyer", "qr code scan", "advance payment", "vehicle listing", "ಒಎಲ್ಎಕ್ಸ್", "ಸೇನಾ ಅಧಿಕಾರಿ", "ಸೇನಾಧಿಕಾರಿ", "ಖರೀದಿಸಲು", "ಮಾರಾಟ"]
        },
        {
            "type": "Sextortion", 
            "keywords": ["video call", "nude", "nude call", "whatsapp call", "recorded video", "blackmail", "pay money", "youtube upload", "police officer blackmail", "ವಿಡಿಯೋ ಕಾಲ್", "ವೀಡಿಯೋ ಕಾಲ್", "ಬ್ಲಾಕ್ಮೇಲ್", "ನಗ್ನ", "ಯೂಟ್ಯೂಬ್"]
        },
        {
            "type": "Romance Scam", 
            "keywords": ["romance", "love", "tinder", "dating", "gift", "customs clearance", "foreign friend", "married", "crypto investment help", "ಪ್ರೇಮ", "ಮದುವೆ", "ಗಿಫ್ಟ್", "ಸ್ನೇಹಿತ", "ಪ್ರೀತಿ"]
        },
        {
            "type": "UPI Fraud", 
            "keywords": ["upi", "gpay", "phonepe", "paytm", "pin", "merchant", "scratch card", "sent money by mistake", "received message", "ಯುಪಿಐ", "ಜಿಪೇ", "ಫೋನ್ ಪೇ", "ಫೋನ್‌ಪೇ", "ಹಣ ಕಳೆದುಹೋಗಿದೆ", "ಕ್ಯೂಆರ್ ಕೋಡ್", "ಪಿನ್"]
        },
        {
            "type": "Phishing", 
            "keywords": ["phishing", "link", "bank account blocked", "kyc", "yono", "electricity bill", "sms alert", "netbanking", "pan card", "ಖಾತೆ ಬ್ಲಾಕ್", "ಕೆವೈಸಿ", "ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್", "ಲಿಂಕ್", "ಮೆಸೇಜ್"]
        },
        {
            "type": "Social Media Abuse", 
            "keywords": ["instagram profile", "hacked account", "fake profile", "photos edited", "abuse", "harassment", "defamatory", "threatened", "ನಕಲಿ ಪ್ರೊಫೈಲ್", "ಇನ್ಸ್ಟಾಗ್ರಾಮ್", "ಫೇಸ್ ಬುಕ್", "ಫೇಸ್‌ಬುಕ್", "ನಿಂದನೆ", "ಬೆದರಿಕೆ"]
        }
    ]
    
    scores = {}
    for rule in classification_rules:
        score = 0
        for kw in rule["keywords"]:
            if kw in text:
                score += 1
        scores[rule["type"]] = score
        
    predicted_type = max(scores, key=scores.get)
    if scores[predicted_type] == 0:
        if "instagram" in text or "facebook" in text or "profile" in text or "ನಕಲಿ" in text:
            predicted_type = "Social Media Abuse"
        elif "money" in text or "fraud" in text or "loss" in text or "ಹಣ" in text:
            predicted_type = "UPI Fraud"
        else:
            predicted_type = "Phishing"
            
    urgency_keywords = ["suicide", "urgent", "immediate", "threat", "harm", "kill", "death", "police", "court", "ಆತ್ಮಹತ್ಯೆ", "ತುರ್ತು", "ಬೆದರಿಕೆ", "ಪ್ರಾಣ", "ಪೊಲೀಸ್", "ಕೂಡಲೇ"]
    has_urgency = any(kw in text for kw in urgency_keywords)
    
    estimated_loss = 0
    numbers = [int(num.replace(',', '')) for num in re.findall(r'\b\d+(?:,\d+)*\b', text)]
    if numbers:
        max_num = max(numbers)
        multiplier = 1
        if "lakh" in text or "lakhs" in text or "ಲಕ್ಷ" in text:
            multiplier = 100000
        elif "crore" in text or "crores" in text or "ಕೋಟಿ" in text:
            multiplier = 10000000
            
        estimated_loss = max_num * multiplier if multiplier > 1 else max_num
        
    risk_level = "Low"
    if has_urgency or estimated_loss > 100000:
        risk_level = "High"
    elif estimated_loss >= 10000:
        risk_level = "Medium"
    else:
        if predicted_type in ["Sextortion", "Romance Scam"]:
            risk_level = "High"
        elif predicted_type in ["Job Fraud", "Phishing"]:
            risk_level = "Medium"
            
    suggested_action = "Forward to Cyber Cell"
    if risk_level == "High":
        if "bank" in text or "account" in text or "ಖಾತೆ" in text or "ಹಣ" in text:
            suggested_action = "Freeze bank account"
        else:
            suggested_action = "File FIR"
    elif risk_level == "Medium":
        if "bank" in text or "account" in text or "ಖಾತೆ" in text or "ಹಣ" in text:
            suggested_action = "Freeze bank account"
        else:
            suggested_action = "Issue notice"
    else:
        if predicted_type == "Social Media Abuse":
            suggested_action = "Issue notice"
        else:
            suggested_action = "Forward to Cyber Cell"
            
    legal_metadata = {
        "Job Fraud": {
            "ipc_sections": "Section 318 (Cheating), Section 319 (Cheating by personation) of BNS (Formerly Section 420/419 IPC)",
            "it_sections": "Section 66D of Information Technology Act (Cheating by personation using computer resource)",
            "actions": [
                "Freeze beneficiary bank account mentioned in text (if routing number found)",
                "Send notices to Telegram/WhatsApp for user account registration logs and IP coordinates",
                "Reconcile UPI transactions through NPCI Portal"
            ]
        },
        "OLX Scam": {
            "ipc_sections": "Section 318 of BNS (Formerly Section 420 IPC)",
            "it_sections": "Section 66D of IT Act",
            "actions": [
                "Request listing IP and user account history from OLX Security Compliance",
                "Trace recipient UPI ID handles and linked nodal accounts",
                "Advise victim to block cards used for merchant payments"
            ]
        },
        "Sextortion": {
            "ipc_sections": "Section 308 (Extortion), Section 351 (Criminal Intimidation) of BNS; Section 67A of IT Act (Publishing sexually explicit material)",
            "it_sections": "Section 66E of IT Act (Privacy Violation), Section 67/67A of IT Act",
            "actions": [
                "Issue emergency takedown request to YouTube/Facebook to prevent video dissemination",
                "Trace offending WhatsApp VoIP virtual numbers (frequently country code +1/+234)",
                "Coordinate with Cyber Crime Unit at suspect location (typically Mewat/Bharatpur hubs)"
            ]
        },
        "Romance Scam": {
            "ipc_sections": "Section 318 (Cheating) of BNS",
            "it_sections": "Section 66D of IT Act",
            "actions": [
                "Liaise with Immigration/Customs if fake custom duty scams are referenced",
                "Conduct bank trail analysis starting from the primary recipient ledger",
                "Audit dating application matching log via legal requests"
            ]
        },
        "UPI Fraud": {
            "ipc_sections": "Section 318 (Cheating) of BNS",
            "it_sections": "Section 66D of IT Act",
            "actions": [
                "Submit chargeback request to NPCI within Golden Hour threshold",
                "Log offending UPI IDs on KSP Threat Intelligence repository",
                "Check KYC linkages of accused bank branch details"
            ]
        },
        "Phishing": {
            "ipc_sections": "Section 318 (Cheating), Section 336 (Forgery) of BNS",
            "it_sections": "Section 66C (Identity Theft), Section 66D of IT Act",
            "actions": [
                "Submit rogue URL for domain takedown through NCIIPC/CERT-In portal",
                "Acquire hosting ISP logs and registrar details for investigation",
                "Notify banking partners of active credential harvesting vectors"
            ]
        },
        "Social Media Abuse": {
            "ipc_sections": "Section 78 (Stalking), Section 356 (Defamation) of BNS",
            "it_sections": "Section 66C (Identity Theft), Section 67 of IT Act",
            "actions": [
                "File formal profile removal requests with Meta Law Enforcement Portal",
                "Extract metadata and headers from screenshots to verify origins",
                "Advise victim on privacy settings and security precautions"
            ]
        }
    }
    
    meta = legal_metadata[predicted_type]
    confidence = round(0.78 + (scores[predicted_type] / (len(text.split()) + 1)) * 0.22, 2)
    confidence = max(0.72, min(0.96, confidence))
    
    return {
        "crime_type": predicted_type,
        "confidence": confidence,
        "ipc_sections": meta["ipc_sections"],
        "it_sections": meta["it_sections"],
        "priority": "CRITICAL" if risk_level == "High" else "HIGH" if risk_level == "Medium" else "MEDIUM",
        "risk_level": risk_level,
        "suggested_action": suggested_action,
        "action_items": meta["actions"],
        "word_matches": scores[predicted_type]
    }

# --- AI/ML Endpoints ---

@app.get("/api/predictive/risk-scores")
def get_predictive_risk():
    try:
        results = train_and_predict_risk(records)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Predictive model runtime exception: {str(e)}")

@app.get("/api/anomaly/flagged")
def get_anomalies():
    try:
        results = detect_anomalies(records)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly model runtime exception: {str(e)}")

@app.get("/api/trends/emerging")
def get_emerging_trends():
    try:
        results = identify_emerging_trends(records)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend analysis runtime exception: {str(e)}")


# ==========================================
# --- 6 NEW FEATURES BACKEND ENDPOINTS ---
# ==========================================

import random
from datetime import timedelta

# Persisted FIR database file path
FIR_DB_FILE = os.path.join(os.path.dirname(__file__), "fir_database.json")
if os.path.exists(FIR_DB_FILE):
    with open(FIR_DB_FILE, "r", encoding="utf-8") as f:
        _fir_database = json.load(f)
else:
    _fir_database = []

# Pydantic Schemas
class FIRRequest(BaseModel):
    complainant_name: str
    incident_datetime: str
    district: str
    police_station: str
    crime_type: str
    description: str
    accused_details: Optional[str] = None
    evidence_available: List[str] = []
    investigating_officer: Optional[str] = None
    officer_designation: Optional[str] = None

class FIRSaveRequest(BaseModel):
    fir_number: str
    investigating_officer: Optional[str] = None
    officer_designation: Optional[str] = None

class MissingPersonUpdate(BaseModel):
    status: str

# 1. FIR Generation Endpoint
@app.post("/api/fir/generate")
def generate_fir(req: FIRRequest):
    global _fir_database
    district_code = req.district[:3].upper()
    auto_id = f"{random.randint(10000, 99999)}"
    fir_number = f"KSP/{district_code}/2026/{auto_id}"
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    ipc_mapping = {
        "Murder": ["IPC 302", "IPC 300"],
        "Robbery": ["IPC 392", "IPC 394", "IPC 397"],
        "Theft": ["IPC 378", "IPC 379"],
        "Assault": ["IPC 323", "IPC 324", "IPC 325"],
        "Cybercrime": ["IT Act 66C", "IT Act 66D", "IPC 420"],
        "Fraud": ["IPC 420", "IPC 406", "IPC 468"],
        "Kidnapping": ["IPC 363", "IPC 364", "IPC 365"],
        "Drug Trafficking": ["NDPS Act 20", "NDPS Act 22"],
        "Domestic Violence": ["IPC 498A", "DV Act 2005"],
        "Vehicle Theft": ["IPC 379", "MV Act 184"]
    }

    sections = ipc_mapping.get(req.crime_type, ["IPC 379", "IT Act 66"])
    evidence_list = ", ".join(req.evidence_available) if req.evidence_available else "None reported"
    accused = req.accused_details if req.accused_details else "Unknown"

    # Date/Time Parsing
    try:
        if "T" in req.incident_datetime:
            date_part, time_part = req.incident_datetime.split("T")
        else:
            date_part, time_part = req.incident_datetime, "00:00"
    except:
        date_part, time_part = req.incident_datetime, "00:00"

    officer_name = req.investigating_officer if req.investigating_officer else "______________________"
    officer_desig = req.officer_designation if req.officer_designation else "______________________"

    fir_template = f"""FIRST INFORMATION REPORT
Under Section 154 Cr.P.C.

FIR No         : {fir_number}
Generated At   : {generated_at} IST
Date of Incident: {date_part}     Time: {time_part}
Police Station : {req.police_station}
District       : {req.district}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLAINANT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name           : {req.complainant_name}
Incident Location: {req.district} jurisdiction

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INCIDENT NARRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The complainant appeared before the undersigned and stated that on
{date_part} at {time_part}, the accused ({accused}) allegedly
committed the offence of {req.crime_type} in the jurisdiction of
{req.police_station}, {req.district}.

Description:
{req.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVIDENCE & LEGAL SECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Evidence Available : {evidence_list}
Applicable Sections: {", ".join(sections)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTION TAKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Case registered. Investigation initiated under applicable sections.

Investigating Officer : {officer_name}
Designation           : {officer_desig}
Date & Signature      : ______________________"""

    fir_record = {
        "fir_number": fir_number,
        "complainant_name": req.complainant_name,
        "district": req.district,
        "police_station": req.police_station,
        "crime_type": req.crime_type,
        "incident_datetime": req.incident_datetime,
        "ipc_sections": sections,
        "evidence_available": req.evidence_available,
        "accused_details": accused,
        "investigating_officer": officer_name,
        "officer_designation": officer_desig,
        "fir_text": fir_template,
        "generated_at": generated_at,
        "status": "Draft"
    }

    # Auto-save draft to database
    _fir_database.append(fir_record)
    with open(FIR_DB_FILE, "w", encoding="utf-8") as f:
        json.dump(_fir_database, f, indent=2)

    return {
        "fir_text": fir_template,
        "fir_number": fir_number,
        "ipc_sections": sections,
        "generated_at": generated_at
    }

# 1b. Save FIR to database (promote Draft → Filed)
@app.post("/api/fir/save")
def save_fir(req: FIRSaveRequest):
    global _fir_database, records
    for rec in _fir_database:
        if rec["fir_number"] == req.fir_number:
            rec["status"] = "Filed"
            # Update officer details if provided at save time
            if req.investigating_officer:
                rec["investigating_officer"] = req.investigating_officer
                # Also patch the fir_text with updated officer name
                rec["fir_text"] = rec["fir_text"].replace(
                    "Investigating Officer : ______________________",
                    f"Investigating Officer : {req.investigating_officer}"
                )
            if req.officer_designation:
                rec["officer_designation"] = req.officer_designation
                rec["fir_text"] = rec["fir_text"].replace(
                    "Designation           : ______________________",
                    f"Designation           : {req.officer_designation}"
                )
            
            # Create a corresponding record in main records so it updates the entire database
            case_id = f"KSP-2026-{req.fir_number[-5:]}"
            exists = any(r["id"] == case_id for r in records)
            if not exists:
                new_record = {
                    "id": case_id,
                    "victim_district": rec["district"],
                    "accused_phone": rec["accused_details"] if rec["accused_details"] else "Unknown",
                    "accused_bank": "N/A",
                    "crime_type": rec["crime_type"],
                    "loss_amount_inr": 25000, # Default value
                    "platform": "N/A",
                    "date_of_incident": rec["incident_datetime"][:10],
                    "status": "FIR Filed"
                }
                # Prepend so it shows up in "recent cases" first
                records.insert(0, new_record)
                with open(RECORDS_FILE, "w", encoding="utf-8") as f:
                    json.dump(records, f, indent=2)
            
            # Save updated _fir_database back to file
            with open(FIR_DB_FILE, "w", encoding="utf-8") as f:
                json.dump(_fir_database, f, indent=2)
            
            return {"success": True, "message": f"FIR {req.fir_number} filed successfully."}
    return {"success": False, "message": f"FIR {req.fir_number} not found in database."}

# 1c. List all saved FIRs
@app.get("/api/fir/list")
def list_firs():
    return _fir_database

# 2. Suspect Dossier Search Endpoint
_suspects_cache = None

def get_suspects_list():
    global _suspects_cache
    if _suspects_cache is not None:
        return _suspects_cache
        
    phone_groups = {}
    for r in records:
        phone = r.get("accused_phone")
        if not phone or phone == "Unknown" or phone == "N/A" or "N/A" in phone or len(phone) < 5:
            continue
        if phone not in phone_groups:
            phone_groups[phone] = []
        phone_groups[phone].append(r)
        
    suspects = []
    names_pool = [
        "Abdul Khan", "Srinivas Rao", "Vikram Singh", "Nitin Patil", "Mohammad Ali",
        "Deepak Gowda", "Ravi Shankar", "Kiran Hegde", "Praveen Kumar", "Anand Shettar",
        "Sanjay Deshpande", "Vijay Nayak", "Santosh Acharya", "Ramesh Joshi", "Suresh Shenoy",
        "Manjunath Prasad", "Ganesh Bhat", "Prashanth Shetty", "Harish Poojary", "Satish Pujar"
    ]
    
    for idx, (phone, cases) in enumerate(phone_groups.items()):
        offender_id = f"OFF-{20000 + idx}"
        name = names_pool[idx % len(names_pool)]
        
        active_cases_count = sum(1 for c in cases if c.get("status") in ["Under Investigation", "FIR Filed", "Court"])
        prior_convictions_count = sum(1 for c in cases if c.get("status") in ["Closed", "Arrested"])
        
        total_cases = len(cases)
        risk_score = min(100, int(total_cases * 15 + prior_convictions_count * 10 + 20))
        if risk_score > 75:
            risk_level = "CRITICAL"
        elif risk_score > 50:
            risk_level = "HIGH"
        elif risk_score > 25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        districts = list(set(c.get("victim_district") for c in cases))
        crime_types = list(set(c.get("crime_type") for c in cases))
        
        mo_mapping = {
            "UPI Fraud": "Sends fraudulent payment links via WhatsApp promising cashbacks",
            "Phishing": "Deploys lookalike bank login portals to harvest online banking credentials",
            "Sextortion": "Records WhatsApp video calls and blackmails victims with morphed footage",
            "OLX Scam": "Lists fake vehicles/appliances on OLX and demands advanced transit deposits",
            "Romance Scam": "Poses as foreign nationals, gaining trust before soliciting custom clearance fees",
            "Social Media Abuse": "Creates duplicate profiles to post defamatory comments and stalk victims",
            "Job Fraud": "Offers fake work-from-home jobs on Telegram with high deposit returns"
        }
        mo_list = [mo_mapping.get(ct, f"Operates cybercrime campaigns targeting {ct}") for ct in crime_types]
        mo_summary = "; ".join(mo_list)
        
        timeline = []
        for c in sorted(cases, key=lambda x: x.get("date_of_incident", "")):
            timeline.append({
                "date": c.get("date_of_incident"),
                "crime_type": c.get("crime_type"),
                "district": c.get("victim_district"),
                "status": c.get("status")
            })
            
        suspects.append({
            "OffenderID": offender_id,
            "Name": name,
            "AccusedPhone": phone,
            "RiskLevel": risk_level,
            "RiskScore": risk_score,
            "PriorConvictions": prior_convictions_count,
            "ActiveCases": active_cases_count,
            "Districts": districts,
            "MO": mo_summary,
            "Timeline": timeline
        })
        
    _suspects_cache = suspects
    return suspects

@app.get("/api/suspects/search")
def search_suspects(q: str = Query("")):
    suspects = get_suspects_list()
    if not q:
        return suspects[:30]
        
    q_lower = q.lower()
    matched = []
    for s in suspects:
        if (q_lower in s["OffenderID"].lower() or 
            q_lower in s["Name"].lower() or 
            q_lower in s["AccusedPhone"].lower() or 
            q_lower in s["MO"].lower() or 
            any(q_lower in d.lower() for d in s["Districts"])):
            matched.append(s)
    return matched

# 3. Missing Persons Database & Endpoints
MISSING_NAMES = [
    "Ramesh Kumar", "Suresh Gowda", "Anitha Rao", "Priyanka M.", "Sunil V.",
    "Kiran Raj", "Meenakshi S.", "Naveen N.", "Rajeshwari P.", "Shanthi K.",
    "Divya B.", "Pradeep Kumar", "Santosh J.", "Harish Naik", "Deepa H.",
    "Manjunath T.", "Vijay Laxmi", "Bharathi S.", "Raghavendra G.", "Yashoda M.",
    "Sandeep R.", "Sneha Patil", "Ganesh Murthy", "Mohan Lal", "Kavitha N.",
    "Arjun Singh", "Latha R.", "Mahesh Prasad", "Roopa D.", "Sanjay G.",
    "Savitha B.", "Shiva Kumar", "Umesh S.", "Venkatesh N.", "Asha P.",
    "Dinesh K.", "Guru Prasad", "Jyothi R.", "Kumar Swami", "Mamatha G.",
    "Nandini V.", "Prakash J.", "Rekha M.", "Satish R.", "Shruthi S.",
    "Sudha K.", "Tejaswi N.", "Vikas P.", "Vinay Kumar", "Sujatha R."
]

def generate_missing_persons():
    persons = []
    random.seed(42)  # Stable generation
    for i in range(50):
        name = MISSING_NAMES[i]
        gender = random.choice(["Male", "Female"])
        age = random.randint(5, 75)
        last_seen_district = random.choice(DISTRICTS)
        last_seen_location = f"{last_seen_district} Bus Stand / Main Circle"
        days_ago = random.randint(1, 90)
        last_seen_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        if days_ago > 30:
            status = random.choice(["Critical", "Found"])
        else:
            status = random.choice(["Active Search", "Found"])
            
        reporting_officer = f"Inspector {random.choice(['Patil', 'Gowda', 'Rao', 'Reddy', 'Naik'])}"
        
        persons.append({
            "MissingID": f"MP/2026/{1000 + i}",
            "Name": name,
            "Age": age,
            "Gender": gender,
            "LastSeenDistrict": last_seen_district,
            "LastSeenLocation": last_seen_location,
            "LastSeenDate": last_seen_date,
            "Status": status,
            "ReportingOfficer": reporting_officer
        })
    # Reset seed
    random.seed()
    return persons

MISSING_FILE = os.path.join(os.path.dirname(__file__), "missing_persons.json")
if os.path.exists(MISSING_FILE):
    with open(MISSING_FILE, "r", encoding="utf-8") as f:
        missing_persons_db = json.load(f)
else:
    missing_persons_db = generate_missing_persons()

@app.get("/api/missing-persons")
def get_missing_persons(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    sort: Optional[str] = Query(None)
):
    res = list(missing_persons_db)
    
    if q:
        res = [p for p in res if q.lower() in p["Name"].lower()]
    
    if status:
        res = [p for p in res if p["Status"].lower() == status.lower()]
        
    if district:
        res = [p for p in res if p["LastSeenDistrict"].lower() == district.lower()]
        
    def get_missing_days(p):
        try:
            seen_date = datetime.strptime(p["LastSeenDate"], "%Y-%m-%d")
            return (datetime.now() - seen_date).days
        except:
            return 0
            
    if sort == "Longest Missing":
        res.sort(key=get_missing_days, reverse=True)
    elif sort == "Most Recent":
        res.sort(key=lambda x: x["LastSeenDate"], reverse=True)
        
    return res

@app.put("/api/missing-persons/{missing_id:path}")
def update_missing_person(missing_id: str, req: MissingPersonUpdate):
    for p in missing_persons_db:
        if p["MissingID"] == missing_id:
            p["Status"] = req.status
            # Save back to file when modified by user
            with open(MISSING_FILE, "w", encoding="utf-8") as f:
                json.dump(missing_persons_db, f, indent=2)
            return p
    raise HTTPException(status_code=404, detail="Missing person record not found.")

# 4. District Leaderboard Endpoint
@app.get("/api/leaderboard")
def get_leaderboard():
    district_stats = {}
    for d in DISTRICTS:
        district_stats[d] = {
            "total_cases": 0,
            "resolved_cases": 0,
            "arrested_cases": 0
        }
        
    for r in records:
        d = r.get("victim_district")
        if d in district_stats:
            district_stats[d]["total_cases"] += 1
            if r.get("status") in ["Closed", "Arrested"]:
                district_stats[d]["resolved_cases"] += 1
            if r.get("status") == "Arrested":
                district_stats[d]["arrested_cases"] += 1
                
    random.seed(int(datetime.now().strftime("%Y%m%d")))
    
    leaderboard = []
    for d in DISTRICTS:
        stats = district_stats[d]
        total = stats["total_cases"]
        resolved = stats["resolved_cases"]
        arrested = stats["arrested_cases"]
        
        res_rate = round((resolved / total * 100), 1) if total > 0 else 0.0
        arr_rate = round((arrested / total * 100), 1) if total > 0 else 0.0
        
        proactive_actions = random.randint(0, 30)
        score = round((res_rate * 0.4) + (arr_rate * 0.3) + proactive_actions, 1)
        trend = "up" if random.choice([True, False]) else "down"
        
        monthly_trend = [
            {"month": "Nov", "cases": int(total * 0.12)},
            {"month": "Dec", "cases": int(total * 0.15)},
            {"month": "Jan", "cases": int(total * 0.18)},
            {"month": "Feb", "cases": int(total * 0.20)},
            {"month": "Mar", "cases": int(total * 0.17)},
            {"month": "Apr", "cases": int(total * 0.18)}
        ]
        
        leaderboard.append({
            "district": d,
            "total_cases": total,
            "resolved_cases": resolved,
            "resolution_rate": res_rate,
            "arrest_rate": arr_rate,
            "proactive_score": score,
            "trend": trend,
            "monthly_trend": monthly_trend
        })
        
    random.seed()
    leaderboard.sort(key=lambda x: x["proactive_score"], reverse=True)
    return leaderboard


# --- HELPER DATABASES & GENERATORS FOR 6 NEW DASHBOARDS ---
import random
from datetime import timedelta

# Case stages in-memory DB to store state updates
_case_stages_db = {}

# Resource deployments DB
_deployment_db = {}

def generate_deployments():
    global _deployment_db
    if _deployment_db:
        return _deployment_db
    
    db = {}
    for d in DISTRICTS:
        # Seed based on district name to keep it stable
        seed_val = sum(ord(c) for c in d)
        officers = 10 + (seed_val % 30) # 10 to 39
        patrol = 2 + (seed_val % 8)     # 2 to 9
        investigation = 1 + (seed_val % 6) # 1 to 6
        special = seed_val % 4          # 0 to 3
        response_time = 8 + (seed_val % 18) # 8 to 25 mins
        db[d] = {
            "district": d,
            "officers_deployed": officers,
            "patrol_units": patrol,
            "investigation_units": investigation,
            "special_units": special,
            "avg_response_time_minutes": response_time
        }
    _deployment_db = db
    return _deployment_db

# Victims DB
_victims_db = []

def generate_victims():
    global _victims_db
    if _victims_db:
        return _victims_db
    
    db = []
    names = [
        "Aarav Bhat", "Aditi Rao", "Amit Gowda", "Ananya Hegde", "Arjun Murthy",
        "Deepa Patil", "Ganesh Acharya", "Hari Nair", "Ishaan Joshi", "Jyothi Shenoy",
        "Karan Singh", "Kavitha Raj", "Manjunath Dev", "Meera Hegde", "Naveen Bhat",
        "Pooja Deshpande", "Pradeep Naik", "Priya Kulkarni", "Rahul Gowda", "Roopa Shettar"
    ]
    support_opts = ["Medical Assistance", "Legal Aid", "Counselling", "Compensation Filed", "Safe House"]
    
    # Use a seed to ensure stable random generation
    import random as rd
    rd.seed(42)
    
    for i in range(200):
        seed_val = i * 7 + 13
        name = names[i % len(names)] + f" {chr(65 + (seed_val % 26))}."
        age = 18 + (seed_val % 50)
        gender = rd.choice(["Male", "Female"])
        district = DISTRICTS[seed_val % len(DISTRICTS)]
        
        # Associate with a random case from records in that district
        dist_cases = [c for c in records if c["victim_district"] == district]
        if dist_cases:
            associated_case = dist_cases[seed_val % len(dist_cases)]
            case_id = associated_case["id"]
            crime_type = associated_case["crime_type"]
            date_of_incident = associated_case["date_of_incident"]
        else:
            case_id = f"KSP-2026-{10000 + i}"
            crime_type = rd.choice(CRIME_TYPES)
            date_of_incident = "2026-05-15"
            
        injury = ["None", "Minor", "Major", "Critical"][seed_val % 4]
        comp = ["Pending", "Approved", "Disbursed"][seed_val % 3]
        
        # Select service subsets
        services = []
        for s in support_opts:
            if rd.choice([True, False]):
                services.append(s)
                
        counselling = rd.choice([True, False])
        legal_aid = rd.choice([True, False])
        follow_up = (datetime.now() + timedelta(days=(seed_val % 15))).strftime("%Y-%m-%d")
        status = rd.choice(["Active", "Closed"])
        
        db.append({
            "VictimID": f"VIC-2026-{10000 + i}",
            "Name": name,
            "Age": age,
            "Gender": gender,
            "District": district,
            "CaseID": case_id,
            "CrimeType": crime_type,
            "DateOfIncident": date_of_incident,
            "InjurySeverity": injury,
            "CompensationStatus": comp,
            "SupportServicesAssigned": services,
            "CounsellingRequired": counselling,
            "LegalAidAssigned": legal_aid,
            "FollowUpDate": follow_up,
            "VictimStatus": status
        })
    rd.seed() # reset seed
    _victims_db = db
    return _victims_db

# Evidence DB
_evidence_db = []

def generate_evidence():
    global _evidence_db
    if _evidence_db:
        return _evidence_db
    
    db = []
    types = ["CCTV Footage", "Weapon", "Document", "Digital Device", "DNA Sample", "Witness Statement", "Financial Records", "Photographs", "Audio Recording", "Vehicle"]
    officers = ["Inspector Patil", "Inspector Gowda", "Inspector Rao", "SI Ramesh", "SI Kumar", "SI Suresh"]
    
    import random as rd
    rd.seed(123)
    
    for i in range(150):
        seed_val = i * 11 + 17
        ev_id = f"EVI-2026-{20000 + i}"
        district = DISTRICTS[seed_val % len(DISTRICTS)]
        
        # Associate with random case in that district
        dist_cases = [c for c in records if c["victim_district"] == district]
        if dist_cases:
            associated_case = dist_cases[seed_val % len(dist_cases)]
            case_id = associated_case["id"]
        else:
            case_id = f"KSP-2026-{10000 + i}"
            
        ev_type = types[seed_val % len(types)]
        collected_by = officers[seed_val % len(officers)]
        col_date = (datetime.now() - timedelta(days=(5 + (seed_val % 45)))).strftime("%Y-%m-%d")
        location = f"Evidence Room {seed_val % 10 + 1}{chr(65 + (seed_val % 4))}, Zone {seed_val % 3 + 1}"
        
        analysis = rd.choice(["Pending", "In Analysis", "Completed"])
        integrity = rd.choice(["Intact", "Compromised", "Pending Verification"])
        if integrity == "Pending Verification" and seed_val % 10 == 0:
            integrity = "Compromised"
        elif integrity == "Pending Verification":
            integrity = "Intact"
            
        admissible = (integrity == "Intact" and seed_val % 5 != 0)
        
        # Chain of custody
        chain = [
            {
                "officer": collected_by,
                "location": "Crime Scene",
                "date_time": f"{col_date} 10:30",
                "purpose": "Collection"
            },
            {
                "officer": collected_by,
                "location": "District Transit Station",
                "date_time": f"{col_date} 13:15",
                "purpose": "Transfer"
            },
            {
                "officer": officers[(seed_val + 1) % len(officers)],
                "location": location,
                "date_time": f"{col_date} 16:45",
                "purpose": "Transfer"
            }
        ]
        
        db.append({
            "EvidenceID": ev_id,
            "CaseID": case_id,
            "EvidenceType": ev_type,
            "CollectedBy": chain[-1]["officer"],
            "CollectionDate": col_date,
            "District": district,
            "StorageLocation": location,
            "ChainOfCustody": chain,
            "AnalysisStatus": analysis,
            "IntegrityStatus": integrity,
            "CourtAdmissible": admissible
        })
    rd.seed() # reset seed
    _evidence_db = db
    return _evidence_db

# Initialize synthetic DBs on startup
generate_deployments()
generate_victims()
generate_evidence()

# --- Pydantic Request Schemas ---
class CaseStageUpdate(BaseModel):
    stage: str

class VictimUpdate(BaseModel):
    support_services: List[str]
    status: str
    compensation_status: str

class EvidenceTransferRequest(BaseModel):
    transfer_to: str
    location: str
    purpose: str

class EvidenceIntegrityUpdate(BaseModel):
    integrity_status: str

# --- Endpoints for 6 New Pages ---

# 1. District Statistics Endpoint
@app.get("/api/district-stats")
def get_district_stats(district: str = "Bengaluru Urban"):
    if district not in DISTRICTS:
        raise HTTPException(status_code=400, detail="Invalid district name.")
        
    dist_cases = [c for c in records if c["victim_district"] == district]
    total_cases = len(dist_cases)
    
    # Cases Resolved
    resolved = sum(1 for c in dist_cases if c["status"] in ["Closed", "Arrested"])
    active = total_cases - resolved
    
    # Repeat offenders count
    suspects_list = get_suspects_list()
    repeat_offenders_count = sum(1 for s in suspects_list if district in s["Districts"] and s["PriorConvictions"] > 1)
    
    # Average Loss Amount
    loss_cases = [c["loss_amount_inr"] for c in dist_cases]
    avg_loss = int(sum(loss_cases) / len(loss_cases)) if loss_cases else 0
    
    # Crime Type Distribution (Pie Chart)
    crime_dist = {}
    for c in dist_cases:
        ct = c["crime_type"]
        crime_dist[ct] = crime_dist.get(ct, 0) + 1
    crime_mix = [{"name": k, "value": v} for k, v in crime_dist.items()]
    
    # Monthly Case count for last 12 months (Bar Chart)
    monthly_map = {}
    months_keys = []
    # Build last 12 months keys
    ref_y, ref_m = 2026, 6 # June 2026
    for i in range(11, -1, -1):
        m = ref_m - i
        y = ref_y
        if m <= 0:
            m += 12
            y -= 1
        key = f"{y}-{m:02d}"
        months_keys.append(key)
        monthly_map[key] = 0
        
    for c in dist_cases:
        ym = c["date_of_incident"][:7]
        if ym in monthly_map:
            monthly_map[ym] += 1
            
    # Format labels (e.g. "Jan", "Feb")
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_chart = []
    for key in months_keys:
        m_idx = int(key.split("-")[1]) - 1
        monthly_chart.append({
            "month": month_names[m_idx],
            "cases": monthly_map[key]
        })
        
    # Temporal: Time of Day Distribution (Area Chart)
    hour_counts = [0] * 24
    for c in dist_cases:
        id_hash = sum(ord(ch) for ch in c["id"])
        hour = id_hash % 24
        hour_counts[hour] += 1
    temporal_hour = [{"hour": f"{h:02d}:00", "count": hour_counts[h]} for h in range(24)]
    peak_hour = hour_counts.index(max(hour_counts)) if hour_counts else 12
    
    # Temporal: Day of Week Distribution (Bar Chart)
    day_counts = [0] * 7 # Mon=0, Sun=6
    for c in dist_cases:
        dt = datetime.strptime(c["date_of_incident"], "%Y-%m-%d")
        day_counts[dt.weekday()] += 1
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    temporal_day = [{"day": day_names[d], "count": day_counts[d]} for d in range(7)]
    
    # Crime Hotspot Police Stations (Table of top 5)
    station_types = ["Cyber Crime PS", "Town Police Station", "Rural Police Station", "Central Crime PS", "District Headquarters PS"]
    station_cases = {}
    for c in dist_cases:
        id_hash = sum(ord(ch) for ch in c["id"])
        station_name = f"{district} {station_types[id_hash % len(station_types)]}"
        if station_name not in station_cases:
            station_cases[station_name] = {"cases": 0, "resolved": 0, "crimes": {}}
        station_cases[station_name]["cases"] += 1
        if c["status"] in ["Closed", "Arrested"]:
            station_cases[station_name]["resolved"] += 1
        ct = c["crime_type"]
        station_cases[station_name]["crimes"][ct] = station_cases[station_name]["crimes"].get(ct, 0) + 1
        
    hotspots = []
    for name, s_data in station_cases.items():
        top_crime = max(s_data["crimes"].items(), key=lambda x: x[1])[0] if s_data["crimes"] else "N/A"
        cases = s_data["cases"]
        status = "OVERLOADED" if cases > 30 else "ACTIVE" if cases >= 15 else "NORMAL"
        hotspots.append({
            "station": name,
            "cases": cases,
            "top_crime": top_crime,
            "resolved": s_data["resolved"],
            "status": status
        })
    hotspots.sort(key=lambda x: x["cases"], reverse=True)
    hotspots = hotspots[:5]
    
    # Offender profile summary:
    # Age distribution
    age_groups = {"<18": 0, "18-25": 0, "26-35": 0, "36-50": 0, "50+": 0}
    for c in dist_cases:
        id_hash = sum(ord(ch) for ch in c["id"])
        age = 14 + (id_hash % 52)
        if age < 18:
            age_groups["<18"] += 1
        elif age <= 25:
            age_groups["18-25"] += 1
        elif age <= 35:
            age_groups["26-35"] += 1
        elif age <= 50:
            age_groups["36-50"] += 1
        else:
            age_groups["50+"] += 1
    age_chart = [{"group": k, "count": v} for k, v in age_groups.items()]
    
    # Repeat offender breakdown
    repeat_groups = {"First Time": 0, "Repeat": 0, "Habitual": 0, "Chronic": 0}
    for c in dist_cases:
        phone = c.get("accused_phone")
        if not phone or phone == "Unknown" or phone == "N/A":
            repeat_groups["First Time"] += 1
            continue
        phone_hash = sum(ord(ch) for ch in phone)
        # Check if phone belongs to repeat suspects in cache
        has_suspect = next((s for s in suspects_list if s["AccusedPhone"] == phone), None)
        if has_suspect:
            priors = has_suspect["PriorConvictions"]
            if priors == 0:
                repeat_groups["First Time"] += 1
            elif priors <= 2:
                repeat_groups["Repeat"] += 1
            elif priors <= 5:
                repeat_groups["Habitual"] += 1
            else:
                repeat_groups["Chronic"] += 1
        else:
            repeat_groups["First Time"] += 1
            
    repeat_chart = [
        {"name": "First Time", "value": repeat_groups["First Time"]},
        {"name": "Repeat (1-2)", "value": repeat_groups["Repeat"]},
        {"name": "Habitual (3-5)", "value": repeat_groups["Habitual"]},
        {"name": "Chronic (5+)", "value": repeat_groups["Chronic"]}
    ]
    
    # Top 5 Active Offenders in District
    dist_suspects = [s for s in suspects_list if district in s["Districts"]]
    dist_suspects.sort(key=lambda x: x["ActiveCases"], reverse=True)
    top_offenders = []
    for s in dist_suspects[:5]:
        top_offenders.append({
            "offender_id": s["OffenderID"],
            "crime_type": s["Timeline"][0]["crime_type"] if s["Timeline"] else "Cybercrime",
            "mo": s["MO"][:60] + "...",
            "prior_convictions": s["PriorConvictions"],
            "status": "Active"
        })
        
    # District Comparison (district vs state avg)
    state_resolved = sum(1 for c in records if c["status"] in ["Closed", "Arrested"])
    state_res_rate = round(state_resolved / len(records) * 100, 1) if records else 0
    dist_res_rate = round(resolved / total_cases * 100, 1) if total_cases > 0 else 0
    
    state_repeat_pct = 24.5 # Synthetic constant
    dist_repeat_pct = round(repeat_offenders_count / total_cases * 100, 1) if total_cases > 0 else 0
    
    state_avg_loss = int(sum(c["loss_amount_inr"] for c in records) / len(records)) if records else 0
    
    # Synthesize cases per 1000 population based on district coordinates to make it stable
    seed_val = sum(ord(ch) for ch in district)
    dist_pop_k = 500 + (seed_val % 4500) # 500k to 5000k population
    dist_density = round(total_cases / dist_pop_k, 2)
    state_density = round(len(records) / 30000, 2) # State constant
    
    comparison = [
        {"metric": "Resolution Rate %", "district_val": dist_res_rate, "state_avg": state_res_rate},
        {"metric": "Repeat Offender %", "district_val": dist_repeat_pct, "state_avg": state_repeat_pct},
        {"metric": "Avg Loss (K INR)", "district_val": round(avg_loss / 1000, 1), "state_avg": round(state_avg_loss / 1000, 1)},
        {"metric": "Cases/1k Pop", "district_val": dist_density, "state_avg": state_density}
    ]
    
    # Month-on-month trend table (last 6 months)
    mom_table = []
    # Stable MoM counts
    for i, ym in enumerate(reversed(months_keys[:6])):
        tot_m = max(5, int(total_cases / 12 + (seed_val % (i + 3))))
        res_m = int(tot_m * 0.65)
        pend_m = tot_m - res_m
        # Previous month total for % change
        prev_tot = max(5, int(total_cases / 12 + (seed_val % (i + 4))))
        change_pct = int((tot_m - prev_tot) / prev_tot * 100)
        mom_table.append({
            "month": ym,
            "total": tot_m,
            "resolved": res_m,
            "pending": pend_m,
            "change": change_pct
        })
        
    return {
        "overview": {
            "total_cases": total_cases,
            "resolved": resolved,
            "active": active,
            "repeat_offenders": repeat_offenders_count,
            "avg_loss": avg_loss
        },
        "crime_mix": crime_mix,
        "monthly_chart": monthly_chart,
        "temporal_hour": temporal_hour,
        "peak_hour": peak_hour,
        "temporal_day": temporal_day,
        "hotspots": hotspots,
        "age_chart": age_chart,
        "repeat_chart": repeat_chart,
        "top_offenders": top_offenders,
        "comparison": comparison,
        "mom_table": mom_table
    }

# 2. Crime Calendar Endpoint
@app.get("/api/calendar")
def get_crime_calendar(month: int = 6, year: int = 2026, district: Optional[str] = None):
    # Filter cases in month/year
    filtered = []
    for c in records:
        date_str = c["date_of_incident"]
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            if dt.year == year and dt.month == month:
                if not district or c["victim_district"].lower() == district.lower():
                    filtered.append(c)
        except:
            continue
            
    # Group by day
    # Number of days in month
    from calendar import monthrange
    _, num_days = monthrange(year, month)
    
    calendar_days = {}
    for day in range(1, num_days + 1):
        date_key = f"{year}-{month:02d}-{day:02d}"
        calendar_days[date_key] = []
        
    for c in filtered:
        date_key = c["date_of_incident"]
        if date_key in calendar_days:
            calendar_days[date_key].append(c)
            
    days_data = []
    all_counts = []
    for date_key, cases in calendar_days.items():
        # Event pills
        events = []
        for c in cases[:3]:
            events.append({
                "id": c["id"],
                "crime_type": c["crime_type"],
                "victim_district": c["victim_district"],
                "status": c["status"]
            })
        days_data.append({
            "date": date_key,
            "day_number": int(date_key[-2:]),
            "events": events,
            "count": len(cases)
        })
        all_counts.append(len(cases))
        
    # Summary stats
    total_this_month = len(filtered)
    
    busiest_day_key = max(calendar_days, key=lambda k: len(calendar_days[k])) if calendar_days else "N/A"
    busiest_count = len(calendar_days[busiest_day_key]) if busiest_day_key in calendar_days else 0
    
    # Filter non-zero days for quietest
    non_zero_days = {k: v for k, v in calendar_days.items() if len(v) > 0}
    if non_zero_days:
        quietest_day_key = min(non_zero_days, key=lambda k: len(non_zero_days[k]))
        quietest_count = len(non_zero_days[quietest_day_key])
    else:
        quietest_day_key = "N/A"
        quietest_count = 0
        
    crime_counts = {}
    for c in filtered:
        ct = c["crime_type"]
        crime_counts[ct] = crime_counts.get(ct, 0) + 1
    most_common_crime = max(crime_counts.items(), key=lambda x: x[1])[0] if crime_counts else "N/A"
    
    # 2026 Heatmap (annual crime intensity)
    monthly_heatmap = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for m_idx in range(1, 13):
        m_count = sum(1 for c in records if c["date_of_incident"][:7] == f"2026-{m_idx:02d}")
        monthly_heatmap.append({
            "month": month_names[m_idx - 1],
            "count": m_count
        })
        
    return {
        "days": days_data,
        "summary": {
            "busiest_day": f"{busiest_day_key} ({busiest_count} cases)" if busiest_day_key != "N/A" else "N/A",
            "quietest_day": f"{quietest_day_key} ({quietest_count} cases)" if quietest_day_key != "N/A" else "N/A",
            "total_this_month": total_this_month,
            "most_common_crime": most_common_crime
        },
        "heatmap": monthly_heatmap
    }

# 3. Case Tracker Endpoint
@app.get("/api/cases/track")
def track_case(id: Optional[str] = None):
    global _case_stages_db
    if not id:
        # Return 20 recent cases
        recent = sorted(records, key=lambda x: x["date_of_incident"], reverse=True)[:20]
        return recent
        
    # Search by id or fir_number in records and in-memory FIR database
    case = next((c for c in records if c["id"].lower() == id.lower()), None)
    if not case:
        # Check FIR database
        fir_rec = next((f for f in _fir_database if f["fir_number"].lower() == id.lower() or f.get("CaseID", "").lower() == id.lower()), None)
        if fir_rec:
            # Map FIR to case representation
            case = {
                "id": fir_rec.get("CaseID", f"KSP-2026-{fir_rec['fir_number'][-5:]}"),
                "victim_district": fir_rec["district"],
                "crime_type": fir_rec["crime_type"],
                "date_of_incident": fir_rec["incident_datetime"][:10],
                "status": "FIR Filed" if fir_rec["status"] == "Filed" else "Under Investigation",
                "fir_number": fir_rec["fir_number"],
                "complainant": fir_rec["complainant_name"],
                "description": fir_rec["fir_text"][:200]
            }
            
    if not case:
        raise HTTPException(status_code=404, detail="Case record or FIR not found.")
        
    case_id = case["id"]
    
    # Check if case is already tracked in memory
    if case_id in _case_stages_db:
        return _case_stages_db[case_id]
        
    # Generate default stage configuration based on status
    status = case["status"]
    
    # 6 stages stepper
    stages_order = ["FIR Filed", "Investigation", "Arrest", "Chargesheet", "Court Hearing", "Verdict"]
    
    # Map status to stage
    current_stage_idx = 0
    if status == "FIR Filed":
        current_stage_idx = 0
    elif status == "Under Investigation":
        current_stage_idx = 1
    elif status == "Arrested":
        current_stage_idx = 2
    elif status == "Court":
        current_stage_idx = 4
    elif status == "Closed":
        current_stage_idx = 5
        
    # Generate deterministic details
    seed_val = sum(ord(ch) for ch in case_id)
    fir_no = case.get("fir_number") or f"KSP/{case['victim_district'][:3].upper()}/2026/{10000 + (seed_val % 90000)}"
    dt_incident = case["date_of_incident"]
    
    stages_details = {}
    for idx, stage in enumerate(stages_order):
        completed = idx < current_stage_idx
        current = idx == current_stage_idx
        pending = idx > current_stage_idx
        
        stages_details[stage] = {
            "stage_name": stage,
            "status": "Completed" if completed else "In Progress" if current else "Pending",
            "date": (datetime.strptime(dt_incident, "%Y-%m-%d") + timedelta(days=idx * 7)).strftime("%Y-%m-%d") if (completed or current) else "PENDING",
            "officer": f"Inspector {['Patil', 'Gowda', 'Rao', 'Reddy', 'Kumar', 'Joshi'][seed_val % 6]}"
        }
        
    # Add specifics
    stages_details["FIR Filed"].update({
        "fir_number": fir_no,
        "date_filed": dt_incident,
        "reporting_officer": stages_details["FIR Filed"]["officer"],
        "police_station": f"{case['victim_district']} Cyber Crime PS",
        "initial_sections": ["IT Act 66D", "IPC 420"]
    })
    
    stages_details["Investigation"].update({
        "lead_investigator": stages_details["Investigation"]["officer"],
        "start_date": stages_details["FIR Filed"]["date"],
        "evidence_collected_count": seed_val % 5 + 1,
        "witnesses_recorded_count": seed_val % 4,
        "status_text": "Completed" if current_stage_idx > 1 else "In Progress"
    })
    
    stages_details["Arrest"].update({
        "accused_name": f"Offender-{seed_val % 1000}",
        "date_of_arrest": stages_details["Arrest"]["date"],
        "arresting_officer": stages_details["Arrest"]["officer"],
        "charges_framed": "Identity Theft & Online Financial Spoofing",
        "bail_status": "Denied" if (seed_val % 2 == 0) else "Granted"
    })
    
    stages_details["Chargesheet"].update({
        "filed_date": stages_details["Chargesheet"]["date"],
        "court_name": "Chief Metropolitan Magistrate Court",
        "ipc_sections": ["IT Act 66C", "IT Act 66D", "IPC 420"],
        "next_hearing_date": (datetime.strptime(dt_incident, "%Y-%m-%d") + timedelta(days=35)).strftime("%Y-%m-%d")
    })
    
    stages_details["Court Hearing"].update({
        "case_number": f"C.C. {seed_val % 1000}/2026",
        "court": "Fast-Track Special Cyber Court",
        "judge": "Hon'ble Judge K. R. Bhat",
        "hearings_held": seed_val % 5 + 1,
        "next_date": (datetime.strptime(dt_incident, "%Y-%m-%d") + timedelta(days=50)).strftime("%Y-%m-%d")
    })
    
    stages_details["Verdict"].update({
        "result": "Convicted" if (seed_val % 3 != 0) else "Acquitted",
        "sentence": "3 Years Rigorous Imprisonment + Fine of Rs. 1 Lakh" if (seed_val % 3 != 0) else "N/A",
        "date_of_judgment": stages_details["Verdict"]["date"]
    })
    
    tracked_case = {
        "id": case_id,
        "fir_number": fir_no,
        "district": case["victim_district"],
        "crime_type": case["crime_type"],
        "status": status,
        "current_stage": stages_order[current_stage_idx],
        "stages": stages_details,
        "documents": [
            {"name": "FIR Copy", "type": "pdf"},
            {"name": "Arrest Memo", "type": "pdf"},
            {"name": "Chargesheet", "type": "pdf"},
            {"name": "Evidence List", "type": "pdf"}
        ]
    }
    
    _case_stages_db[case_id] = tracked_case
    return tracked_case

@app.put("/api/cases/track/{case_id:path}")
def update_case_stage(case_id: str, req: CaseStageUpdate):
    global _case_stages_db
    # Ensure case is tracked in memory
    track_case(case_id)
    if case_id not in _case_stages_db:
        raise HTTPException(status_code=404, detail="Case tracker record not found.")
        
    case_info = _case_stages_db[case_id]
    stages_order = ["FIR Filed", "Investigation", "Arrest", "Chargesheet", "Court Hearing", "Verdict"]
    
    if req.stage not in stages_order:
        raise HTTPException(status_code=400, detail="Invalid stage name.")
        
    # Update stage status and dates
    target_idx = stages_order.index(req.stage)
    case_info["current_stage"] = req.stage
    
    # Map back to overall status
    status_mapping = {
        "FIR Filed": "FIR Filed",
        "Investigation": "Under Investigation",
        "Arrest": "Arrested",
        "Chargesheet": "Arrested",
        "Court Hearing": "Court",
        "Verdict": "Closed"
    }
    case_info["status"] = status_mapping.get(req.stage, "Under Investigation")
    
    for idx, stage in enumerate(stages_order):
        completed = idx < target_idx
        current = idx == target_idx
        
        case_info["stages"][stage]["status"] = "Completed" if completed else "In Progress" if current else "Pending"
        if completed or current:
            case_info["stages"][stage]["date"] = datetime.now().strftime("%Y-%m-%d")
        else:
            case_info["stages"][stage]["date"] = "PENDING"
            
    # Sync with records if exists
    for r in records:
        if r["id"] == case_id:
            r["status"] = case_info["status"]
            break
            
    return case_info

# 4. Resource Deployment Endpoints
@app.get("/api/deployment")
def get_deployments():
    deployments = generate_deployments()
    
    # Compute active cases-per-officer ratios
    # Count cases per district
    district_counts = {}
    for c in records:
        d = c["victim_district"]
        district_counts[d] = district_counts.get(d, 0) + 1
        
    deploy_list = []
    for d, dep in deployments.items():
        cases = district_counts.get(d, 0)
        ratio = round(cases / dep["officers_deployed"], 2) if dep["officers_deployed"] > 0 else 0.0
        
        # cases/officer status
        status = "OVERLOADED" if ratio > 10 else "BALANCED" if ratio >= 5 else "OPTIMAL"
        # deployment level
        level = "WELL STAFFED" if dep["officers_deployed"] >= 25 else "ADEQUATE" if dep["officers_deployed"] >= 10 else "UNDERSTAFFED"
        
        deploy_list.append({
            **dep,
            "active_cases": cases,
            "cases_per_officer": ratio,
            "cases_status": status,
            "deployment_status": level
        })
        
    # AI recommendations (For top 5 high-risk districts)
    # Get predictive risk scores
    risk_scores = train_and_predict_risk(records)
    risk_scores.sort(key=lambda x: x["risk_score"], reverse=True)
    
    suggestions = []
    for risk in risk_scores[:5]:
        d = risk["district"]
        dep = deployments.get(d)
        if dep:
            current = dep["officers_deployed"]
            recommended = current + 10 # Suggest 10 more
            suggestions.append({
                "district": d,
                "current_officers": current,
                "recommended_officers": recommended,
                "reason": f"Risk score is {risk['risk_score']} + active {risk['top_contributing_factor'].lower()} threat spike"
            })
            
    # General Header stats
    total_officers = sum(dep["officers_deployed"] for dep in deployments.values())
    total_units = sum(dep["patrol_units"] + dep["investigation_units"] + dep["special_units"] for dep in deployments.values())
    districts_covered = len(deployments)
    avg_response = round(sum(dep["avg_response_time_minutes"] for dep in deployments.values()) / len(deployments), 1) if deployments else 0.0
    
    return {
        "districts": deploy_list,
        "suggestions": suggestions,
        "stats": {
            "total_officers": total_officers,
            "total_units": total_units,
            "districts_covered": districts_covered,
            "avg_response_time": avg_response
        }
    }

@app.post("/api/deployment/approve")
def approve_deployment(district: str = Query(...), count: int = Query(...)):
    global _deployment_db
    generate_deployments()
    if district in _deployment_db:
        _deployment_db[district]["officers_deployed"] = count
        return {"success": True, "message": f"Deployment approved for {district}. Updated to {count} officers."}
    raise HTTPException(status_code=404, detail="District not found in deployments.")

# 5. Victim Registry Endpoints
@app.get("/api/victims")
def get_victims(
    q: Optional[str] = Query(None),
    crime_type: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    compensation_status: Optional[str] = Query(None),
    gender: Optional[str] = Query(None)
):
    victims = generate_victims()
    res = list(victims)
    
    if q:
        q_lower = q.lower()
        res = [v for v in res if (q_lower in v["Name"].lower() or q_lower in v["VictimID"].lower() or q_lower in v["CaseID"].lower())]
        
    if crime_type:
        res = [v for v in res if v["CrimeType"].lower() == crime_type.lower()]
        
    if district:
        res = [v for v in res if v["District"].lower() == district.lower()]
        
    if compensation_status:
        res = [v for v in res if v["CompensationStatus"].lower() == compensation_status.lower()]
        
    if gender:
        res = [v for v in res if v["Gender"].lower() == gender.lower()]
        
    # Aggregate Stats (for 5 cards)
    total_victims = len(victims)
    pending_comp = sum(1 for v in victims if v["CompensationStatus"] == "Pending")
    legal_aid = sum(1 for v in victims if v["LegalAidAssigned"])
    counselling = sum(1 for v in victims if v["CounsellingRequired"])
    cases_closed = sum(1 for v in victims if v["VictimStatus"] == "Closed")
    
    # Victim support status by crime type (stacked chart)
    # {crime_type: {Disbursed: X, Approved: Y, Pending: Z}}
    crime_comp = {}
    for v in victims:
        ct = v["CrimeType"]
        comp = v["CompensationStatus"]
        if ct not in crime_comp:
            crime_comp[ct] = {"Disbursed": 0, "Approved": 0, "Pending": 0}
        if comp in crime_comp[ct]:
            crime_comp[ct][comp] += 1
            
    support_chart = []
    for ct, counts in crime_comp.items():
        support_chart.append({
            "crime_type": ct,
            "Disbursed": counts["Disbursed"],
            "Approved": counts["Approved"],
            "Pending": counts["Pending"]
        })
        
    return {
        "records": res,
        "stats": {
            "total_victims": total_victims,
            "pending_compensation": pending_comp,
            "legal_aid_required": legal_aid,
            "counselling_required": counselling,
            "cases_closed": cases_closed
        },
        "support_chart": support_chart
    }

@app.put("/api/victims/{victim_id}")
def update_victim(victim_id: str, req: VictimUpdate):
    global _victims_db
    generate_victims()
    for v in _victims_db:
        if v["VictimID"] == victim_id:
            v["SupportServicesAssigned"] = req.support_services
            v["VictimStatus"] = req.status
            v["CompensationStatus"] = req.compensation_status
            return {"success": True, "record": v}
    raise HTTPException(status_code=404, detail="Victim profile not found.")

# 6. Evidence Locker Endpoints
@app.get("/api/evidence")
def get_evidence(
    q: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    analysis_status: Optional[str] = Query(None),
    court_admissible: Optional[bool] = Query(None),
    district: Optional[str] = Query(None)
):
    evidence = generate_evidence()
    res = list(evidence)
    
    if q:
        q_lower = q.lower()
        res = [e for e in res if (q_lower in e["EvidenceID"].lower() or q_lower in e["CaseID"].lower())]
        
    if type:
        res = [e for e in res if e["EvidenceType"].lower() == type.lower()]
        
    if analysis_status:
        res = [e for e in res if e["AnalysisStatus"].lower() == analysis_status.lower()]
        
    if court_admissible is not None:
        res = [e for e in res if e["CourtAdmissible"] == court_admissible]
        
    if district:
        res = [e for e in res if e["District"].lower() == district.lower()]
        
    # Stats (4 cards)
    total_items = len(evidence)
    pending_analysis = sum(1 for e in evidence if e["AnalysisStatus"] == "Pending")
    court_admissible_count = sum(1 for e in evidence if e["CourtAdmissible"])
    compromised = sum(1 for e in evidence if e["IntegrityStatus"] == "Compromised")
    
    # Evidence Type breakdown (Pie chart)
    type_counts = {}
    for e in evidence:
        t = e["EvidenceType"]
        type_counts[t] = type_counts.get(t, 0) + 1
    type_chart = [{"name": k, "value": v} for k, v in type_counts.items()]
    
    return {
        "records": res,
        "stats": {
            "total_items": total_items,
            "pending_analysis": pending_analysis,
            "court_admissible": court_admissible_count,
            "compromised": compromised
        },
        "type_chart": type_chart
    }

@app.post("/api/evidence/{evidence_id}/transfer")
def transfer_evidence(evidence_id: str, req: EvidenceTransferRequest):
    global _evidence_db
    generate_evidence()
    for e in _evidence_db:
        if e["EvidenceID"] == evidence_id:
            transfer_step = {
                "officer": req.transfer_to,
                "location": req.location,
                "date_time": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "purpose": req.purpose
            }
            e["ChainOfCustody"].append(transfer_step)
            e["StorageLocation"] = req.location
            e["CollectedBy"] = req.transfer_to
            return {"success": True, "record": e}
    raise HTTPException(status_code=404, detail="Evidence item not found.")

@app.put("/api/evidence/{evidence_id}/integrity")
def update_evidence_integrity(evidence_id: str, req: EvidenceIntegrityUpdate):
    global _evidence_db
    generate_evidence()
    for e in _evidence_db:
        if e["EvidenceID"] == evidence_id:
            e["IntegrityStatus"] = req.integrity_status
            e["CourtAdmissible"] = (req.integrity_status == "Intact")
            return {"success": True, "record": e}
    raise HTTPException(status_code=404, detail="Evidence item not found.")

# Zoho Catalyst Handler mapping
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

