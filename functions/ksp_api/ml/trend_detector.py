import json
import os
from datetime import datetime, timedelta

def identify_emerging_trends(records):
    # Reference date (July 15, 2026)
    ref_date = datetime(2026, 7, 15)
    
    # Define time ranges
    last_30_start = ref_date - timedelta(days=30)
    prev_90_start = ref_date - timedelta(days=120) # 90 days before last_30_start
    
    # Format strings for comparison
    ref_str = ref_date.strftime("%Y-%m-%d")
    last_30_start_str = last_30_start.strftime("%Y-%m-%d")
    prev_90_start_str = prev_90_start.strftime("%Y-%m-%d")
    
    # Dictionary structures to store counts: {(crime_type, district): count}
    current_counts = {}
    historical_counts = {}
    
    for r in records:
        date_str = r["date_of_incident"]
        key = (r["crime_type"], r["victim_district"])
        
        # Last 30 days
        if last_30_start_str <= date_str <= ref_str:
            current_counts[key] = current_counts.get(key, 0) + 1
        # Previous 90 days
        elif prev_90_start_str <= date_str < last_30_start_str:
            historical_counts[key] = historical_counts.get(key, 0) + 1
            
    trends = []
    
    # Process all unique keys
    all_keys = set(current_counts.keys()).union(set(historical_counts.keys()))
    
    for key in all_keys:
        crime_type, district = key
        current_val = current_counts.get(key, 0)
        hist_total = historical_counts.get(key, 0)
        
        # Historical average rate per 30 days
        hist_avg = hist_total / 3.0
        
        # Rule: current_rate > 1.4 * historical_average
        is_spike = False
        spike_pct = 0
        
        if hist_avg > 0:
            if current_val > 1.4 * hist_avg:
                is_spike = True
                spike_pct = int(((current_val - hist_avg) / hist_avg) * 100)
        elif current_val >= 2: # Spike if historically 0 but now has at least 2 cases
            is_spike = True
            spike_pct = current_val * 100 # Represent new activity
            
        if is_spike:
            trends.append({
                "crime_type": crime_type,
                "district": district,
                "spike_percentage": spike_pct,
                "alert_text": f"{crime_type} in {district} UP {spike_pct}% vs 90-day avg"
            })
            
    # Sort trends by spike percentage descending (highest spikes first)
    trends.sort(key=lambda x: x["spike_percentage"], reverse=True)
    return trends

if __name__ == "__main__":
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    records_file = os.path.join(parent_dir, "cybercrime_records.json")
    if os.path.exists(records_file):
        with open(records_file, "r") as f:
            records = json.load(f)
        trends = identify_emerging_trends(records)
        print(f"Detected {len(trends)} emerging trend alerts. First 3 results:")
        print(trends[:3])
