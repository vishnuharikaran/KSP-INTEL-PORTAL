import json
import random
import uuid
from datetime import datetime, timedelta

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

BANKS = ["SBI", "HDFC Bank", "ICICI Bank", "Canara Bank", "Axis Bank", "PNB", "Bank of Baroda", "Union Bank"]

# Generate repeating syndicates (phone numbers and bank accounts) for clustering
COMMON_PHONES = [f"+91 {random.randint(7000000000, 9999999999)}" for _ in range(25)]
COMMON_BANKS = [
    f"{random.choice(BANKS)} (Acct: {random.randint(1000000000, 9999999999)})" 
    for _ in range(20)
]

def generate_phone():
    if random.random() < 0.25:  # 25% chance of repeating offender phone
        return random.choice(COMMON_PHONES)
    return f"+91 {random.randint(7000000000, 9999999999)}"

def generate_bank():
    if random.random() < 0.25:  # 25% chance of repeating money-mule account
        return random.choice(COMMON_BANKS)
    return f"{random.choice(BANKS)} (Acct: {random.randint(1000000000, 9999999999)})"

def generate_district():
    # Bengaluru Urban has high concentration (~35%), Mysuru, Belagavi, Mangaluru (Dakshina Kannada) have ~5% each.
    # Rest are distributed evenly.
    r = random.random()
    if r < 0.35:
        return "Bengaluru Urban"
    elif r < 0.40:
        return "Mysuru"
    elif r < 0.45:
        return "Dakshina Kannada"
    elif r < 0.50:
        return "Belagavi"
    elif r < 0.53:
        return "Dharwad"
    return random.choice(DISTRICTS)

def generate_crime_type_and_loss_platform():
    # Certain platforms are associated with certain crime types
    crime = random.choice(CRIME_TYPES)
    if crime == "Job Fraud":
        platform = random.choice(["Telegram", "WhatsApp"])
        loss = random.randint(50000, 800000)
    elif crime == "OLX Scam":
        platform = "OLX"
        loss = random.randint(5000, 75000)
    elif crime == "Sextortion":
        platform = random.choice(["WhatsApp", "Instagram"])
        loss = random.randint(10000, 150000)
    elif crime == "Romance Scam":
        platform = random.choice(["Instagram", "Facebook"])
        loss = random.randint(100000, 1000000)
    elif crime == "UPI Fraud":
        platform = random.choice(["WhatsApp", "Telegram"])
        loss = random.randint(1000, 100000)
    elif crime == "Phishing":
        platform = random.choice(["WhatsApp", "Telegram", "Facebook"])
        loss = random.randint(20000, 500000)
    else:  # Social Media Abuse
        platform = random.choice(["Instagram", "Facebook", "WhatsApp"])
        loss = random.randint(0, 5000)  # often low monetary loss, high abuse
        
    return crime, loss, platform

def generate_records(count=5000):
    records = []
    start_date = datetime(2023, 1, 1)
    # date range over 2023 to 2026
    total_days = 4 * 365 # ~4 years
    
    for i in range(count):
        crime_type, loss_amount_inr, platform = generate_crime_type_and_loss_platform()
        
        # Incident date
        days_offset = random.randint(0, total_days)
        incident_date = start_date + timedelta(days=days_offset)
        
        status = random.choice(STATUSES)
        # If loss is very high, status is slightly more likely to be FIR Filed or Under Investigation
        if loss_amount_inr > 500000 and random.random() < 0.5:
            status = random.choice(["Under Investigation", "FIR Filed"])
            
        record = {
            "id": f"KSP-{2023 + (days_offset // 365)}-{100000 + i}",
            "victim_district": generate_district(),
            "accused_phone": generate_phone(),
            "accused_bank": generate_bank(),
            "crime_type": crime_type,
            "loss_amount_inr": loss_amount_inr,
            "platform": platform,
            "date_of_incident": incident_date.strftime("%Y-%m-%d"),
            "status": status
        }
        records.append(record)
        
    # Sort records by date of incident
    records.sort(key=lambda x: x["date_of_incident"])
    return records

if __name__ == "__main__":
    records = generate_records(5000)
    with open("cybercrime_records.json", "w") as f:
        json.dump(records, f, indent=2)
    print(f"Successfully generated {len(records)} cybercrime records and saved to cybercrime_records.json")
