# 🛡️ KSP INTEL — AI-Driven Crime Analytics & Visualization Platform

<div align="center">

![KSP Intel Banner](https://img.shields.io/badge/KSP-INTEL-00e5ff?style=for-the-badge&logo=shield&logoColor=black)
![Status](https://img.shields.io/badge/STATUS-ACTIVE-00ff88?style=for-the-badge)
![Platform](https://img.shields.io/badge/PLATFORM-ZOHO%20CATALYST-blue?style=for-the-badge)
![License](https://img.shields.io/badge/LICENSE-RESTRICTED-ff2d55?style=for-the-badge)

**State-Wide Crime Intelligence & Syndicate Analysis Platform**  
*Built for the Karnataka State Police Datathon 2026*

[Live Demo](#live-demo) · [Features](#features) · [Tech Stack](#tech-stack) · [Setup](#setup) · [API Docs](#api-reference) · [Screenshots](#screenshots)

</div>

---

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Role-Based Access](#role-based-access)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [Team](#team)

---

## 🎯 Problem Statement

The Karnataka State Police (KSP) maintains extensive crime records capturing incidents, offenders, and victims. The current analytical ecosystem faces significant hurdles:

| Problem | Impact |
|---|---|
| **Data Silos** | Records managed independently per station with no cross-district visibility |
| **Manual Excel Reporting** | Monthly crime review compiled manually — 36 districts email Excel files to SCRB |
| **30–45 Day Data Lag** | SCRB receives data weeks after crimes occur |
| **No AI Analytics** | Behavioral patterns, criminal networks, and anomalies go undetected |
| **Reactive Policing** | No tools for proactive resource deployment or predictive intelligence |
| **Fragmented SCRB Reporting** | DO letters take 7–10 days to escalate critical cases |

### The Traditional Process

```
Police Station (handwritten registers)
        ↓ manual Excel compilation (3–7 days)
District SP Office
        ↓ email attachment / pen drive
SCRB Bengaluru
        ↓ manual consolidation of 36 Excels (7–15 days)
State Crime Review Published
        ↓ (30–45 days after month end)
NCRB Annual Report (18 months later)
```

**Our platform collapses this entire chain into real-time.**

---

## 💡 Solution Overview

KSP INTEL is a state-of-the-art crime intelligence platform that replaces fragmented Excel workflows with a live, AI-powered dashboard accessible to officers across all hierarchy levels.

```
Police Station Case Entry
        ↓ real-time
KSP INTEL Platform (Zoho Catalyst)
        ↓ instant
SCRB Command View → AI Alerts → Predictive Maps → Network Graphs
```

### Key Improvements Over Current System

| Traditional | KSP INTEL |
|---|---|
| Monthly Excel to SCRB | Real-time live dashboard |
| 30–45 day data lag | Zero lag — immediate visibility |
| 36 separate email files | Single unified data store |
| No cross-district linking | Network graph links same offender across all 31 districts |
| Manual anomaly spotting | IsolationForest AI flags anomalies automatically |
| DO letter escalation (7–10 days) | One-click SCRB escalation — instant |
| Annual crime report (18 months) | Live crime briefing generated anytime |

---

## ✨ Features

### 🗺️ Analytics
| Feature | Description |
|---|---|
| **Overview Dashboard** | State-wide stat cards, monthly trends, 24×7 spatiotemporal heatmap |
| **Crime Map** | Interactive Karnataka map with pulsing risk zones, socio-economic overlay, and hotspot clusters |
| **District Statistics** | 8-section deep dive per district — temporal analysis, offender profiles, station performance |

### 🧠 Intelligence
| Feature | Description |
|---|---|
| **Network Analysis** | D3.js force graph linking suspects, victims, locations — searchable by Offender ID, Case ID, Mobile, Vehicle |
| **Predictive Intelligence** | RandomForest ML model scores all 31 districts 0–100 risk with emerging trend alerts |
| **Anomaly Detection** | IsolationForest flags statistically deviant cases with behavioral scatter plot visualization |
| **Live Intel Feed** | Simulated real-time stream of incoming cases with severity classification |

### ⚙️ Operations
| Feature | Description |
|---|---|
| **FIR Assistant** | Auto-generates FIR drafts with IPC/BNS section mapping — print-ready output |
| **Suspect Search** | Full criminal dossier with MO timeline, jurisdiction map, and case pattern analysis |
| **Case Tracker** | 6-stage case lifecycle (FIR → Investigation → Arrest → Chargesheet → Court → Verdict) |
| **Resource Deployment** | AI-driven officer reallocation suggestions per district risk score |

### 🤝 Victim & Evidence
| Feature | Description |
|---|---|
| **Missing Persons Tracker** | Real-time tracking with Amber Alert overlay and SCRB escalation |
| **Victim Registry** | Compensation tracking, support services checklist, follow-up scheduler |
| **Evidence Locker** | Full chain of custody with integrity verification and court admissibility flags |

### 📊 Reports
| Feature | Description |
|---|---|
| **Crime Briefing** | Auto-generated daily intelligence briefing — exports as professional A4 PDF |
| **District Report** | Per-district export with station tables, offender lists, prime time intelligence |
| **FIR Print** | Official FIR document with KSP letterhead and signature blocks |
| **Case File Export** | Complete case timeline export for court submission |

---

## 🛠️ Tech Stack

### Frontend
```
React 18          — UI framework
Vite              — Build tool and dev server
React Router v6   — Client-side routing
Recharts          — Charts (line, bar, pie, scatter, area)
Leaflet.js        — Interactive Karnataka maps
D3.js             — Force-directed network graphs
Lucide React      — Icon library
JetBrains Mono    — Monospace font (data display)
Inter             — UI font
```

### Backend
```
FastAPI           — Python REST API framework
Mangum            — ASGI adapter for serverless deployment
Scikit-learn      — ML models (RandomForest, IsolationForest)
Pandas            — Data processing and analytics
NumPy             — Numerical operations
```

### Platform
```
Zoho Catalyst     — Cloud deployment
  ├── Static Hosting     → React frontend (client/dist/)
  ├── Advanced I/O       → FastAPI serverless functions
  ├── Data Store         → ZCQL relational database
  └── Auth               → Officer authentication
```

### Dev Tools
```
ngrok             — Local tunnel for demo/testing
Python 3.9+       — Backend runtime
Node.js 18+       — Frontend build environment
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ZOHO CATALYST CLOUD                   │
│                                                          │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │  STATIC HOSTING  │    │   ADVANCED I/O FUNCTION  │   │
│  │  React + Vite    │◄──►│   FastAPI + Mangum       │   │
│  │  client/dist/    │    │   functions/ksp_api/     │   │
│  └──────────────────┘    └──────────┬───────────────┘   │
│                                     │                    │
│  ┌──────────────────┐    ┌──────────▼───────────────┐   │
│  │  CATALYST AUTH   │    │   CATALYST DATA STORE    │   │
│  │  Officer Login   │    │   ZCQL Queries           │   │
│  │  Role Management │    │   Complaints Table       │   │
│  └──────────────────┘    └──────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              ML INTELLIGENCE LAYER              │    │
│  │  RandomForestRegressor  → District Risk Scores  │    │
│  │  IsolationForest        → Anomaly Detection     │    │
│  │  Statistical Analysis   → Trend Detection       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

Officers Access via Browser
  Level 4 (Admin)    → Full system access
  Level 3 (SP)       → State-wide + SCRB dashboard
  Level 2 (DSP)      → District-level operations
```

---

## 📁 Project Structure

```
ksp-intelligence-portal/
│
├── client/                          # React frontend
│   ├── public/
│   ├── src/
│   │   ├── context/
│   │   │   └── ThemeContext.jsx     # Dark/Light mode
│   │   ├── hooks/
│   │   │   └── useRole.js           # Role-based access
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── StatCard.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Overview.jsx
│   │   │   ├── OverviewOfficial.jsx
│   │   │   ├── CrimeMap.jsx
│   │   │   ├── DistrictStatistics.jsx
│   │   │   ├── NetworkAnalysis.jsx
│   │   │   ├── PredictiveIntelligence.jsx
│   │   │   ├── AnomalyDetection.jsx
│   │   │   ├── LiveIntelFeed.jsx
│   │   │   ├── FIRAssistant.jsx
│   │   │   ├── SuspectSearch.jsx
│   │   │   ├── CaseTracker.jsx
│   │   │   ├── ResourceDeployment.jsx
│   │   │   ├── MissingPersons.jsx
│   │   │   ├── VictimRegistry.jsx
│   │   │   ├── EvidenceLocker.jsx
│   │   │   └── CrimeBriefing.jsx
│   │   ├── utils/
│   │   │   └── printExport.js       # A4 print system
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                # Global theme vars
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── functions/
│   └── ksp_api/                     # FastAPI backend
│       ├── main.py                  # Entry point + Mangum
│       ├── data/
│       │   └── seed.py              # 8000 record generator
│       ├── routes/
│       │   ├── overview.py
│       │   ├── map.py
│       │   ├── network.py
│       │   ├── predictive.py
│       │   ├── anomaly.py
│       │   ├── fir.py
│       │   ├── suspects.py
│       │   ├── cases.py
│       │   ├── deployment.py
│       │   ├── missing.py
│       │   ├── victims.py
│       │   ├── evidence.py
│       │   └── briefing.py
│       ├── ml/
│       │   ├── risk_model.py        # RandomForest
│       │   ├── anomaly_detector.py  # IsolationForest
│       │   └── trend_detector.py    # Spike detection
│       └── requirements.txt
│
├── app-config.json                  # Catalyst config
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites

```bash
Node.js  >= 18.0.0
Python   >= 3.9.0
npm      >= 9.0.0
pip      >= 23.0
```

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ksp-intelligence-portal.git
cd ksp-intelligence-portal
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

### 3. Install Backend Dependencies

```bash
cd functions/ksp_api
pip install -r requirements.txt --break-system-packages
```

**requirements.txt contents:**
```
fastapi
mangum
zcatalyst-sdk
scikit-learn
pandas
numpy
uvicorn
```

### 4. Seed the Database

```bash
cd functions/ksp_api
python data/seed.py
```

This generates **8,000 synthetic Karnataka crime records** and loads them into Catalyst Data Store.

### 5. Run Locally

**Terminal 1 — Backend:**
```bash
cd functions/ksp_api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

**Terminal 3 — Expose backend (for demo):**
```bash
ngrok config add-authtoken YOUR_TOKEN
ngrok http 8000
```

**Terminal 4 — Expose frontend (for demo):**
```bash
ngrok http 5173
```

Open `http://localhost:5173` in your browser.

---

## 🌐 Deployment

### Zoho Catalyst Deployment

**Step 1 — Install Catalyst CLI:**
```bash
npm install -g zcatalyst-cli
catalyst login
```

**Step 2 — Build Frontend:**
```bash
cd client
npm run build
# Output: client/dist/
```

**Step 3 — Deploy:**
```bash
cd ..
catalyst deploy
```

**Step 4 — Verify Deployment:**
```bash
# Health check
curl https://YOUR-APP.catalystserverless.com/api/health

# Expected response:
# {"status":"online","platform":"KSP Intelligence Portal","records":8000}
```

### app-config.json

```json
{
  "project_name": "ksp-intelligence-portal",
  "web": {
    "build_path": "client/dist"
  },
  "functions": [
    {
      "name": "ksp_api",
      "type": "Advanced IO",
      "handler": "main.handler",
      "runtime": "python3.9",
      "timeout": 30
    }
  ],
  "datastore": {
    "tables": [
      {
        "table_name": "Complaints",
        "columns": [
          {"column_name": "CaseID",          "data_type": "text"},
          {"column_name": "District",         "data_type": "text"},
          {"column_name": "PoliceStation",    "data_type": "text"},
          {"column_name": "CrimeType",        "data_type": "text"},
          {"column_name": "OffenderID",       "data_type": "text"},
          {"column_name": "VictimID",         "data_type": "text"},
          {"column_name": "Latitude",         "data_type": "double"},
          {"column_name": "Longitude",        "data_type": "double"},
          {"column_name": "DateOfIncident",   "data_type": "text"},
          {"column_name": "TimeOfDay",        "data_type": "number"},
          {"column_name": "DayOfWeek",        "data_type": "text"},
          {"column_name": "MO",               "data_type": "text"},
          {"column_name": "Status",           "data_type": "text"},
          {"column_name": "PriorConvictions", "data_type": "number"},
          {"column_name": "SocioEconomicZone","data_type": "text"},
          {"column_name": "LossAmountINR",    "data_type": "double"},
          {"column_name": "AccusedPhone",     "data_type": "text"},
          {"column_name": "VehicleNumber",    "data_type": "text"}
        ]
      }
    ]
  }
}
```

---

## 🔌 API Reference

Base URL: `https://YOUR-APP.catalystserverless.com`  
Local: `http://localhost:8000`

### Health

```
GET /api/health
Response: { status, platform, records, model }
```

### Overview

```
GET /api/overview/stats
Response: { total_cases, arrests, pending, repeat_offenders }

GET /api/overview/monthly-trend?district=All+Karnataka
Response: [{ month, year, count, crime_type }]

GET /api/overview/spatiotemporal
Response: [{ hour, day, count }]
```

### Crime Map

```
GET /api/map/districts
Response: [{ district, lat, lng, total_crimes, 
             top_crime, yoy_change, risk_level }]

GET /api/map/hotspots?district=X&crime_type=Y
Response: [{ lat, lng, case_id, crime_type, date, mo }]
```

### Network Analysis

```
GET /api/network?offender_id=X
GET /api/network?case_id=X
GET /api/network?mobile=X
GET /api/network?vehicle=X
Response: { nodes: [], links: [], profile: {} }
```

### Predictive Intelligence

```
GET /api/predictive/risk-scores
Response: [{ district, risk_score, risk_level, 
             top_contributing_factor, predicted_trend }]

GET /api/trends/emerging
Response: [{ crime_type, district, spike_percentage, alert_text }]
```

### Anomaly Detection

```
GET /api/anomaly/flagged
Response: [{ case_id, district, crime_type, time_of_day,
             offender_age, anomaly_score, reason, alert_level }]
```

### FIR Assistant

```
POST /api/fir/generate
Body: { complainant, date, time, district, station,
        crime_type, description, accused, evidence[] }
Response: { fir_text, fir_number, ipc_sections[] }
```

### Suspect Search

```
GET /api/suspects/search?q=QUERY
Response: [{ offender_id, crime_type, mo, district,
             prior_convictions, risk_level }]

POST /api/suspects/pattern
Body: { crime_types[], districts[], date_from, date_to,
        time_from, time_to, days[], mo_keyword }
Response: { cases[], insights, network_nodes[], network_links[] }
```

### District Statistics

```
GET /api/district-stats?district=DISTRICT_NAME
Response: { total_cases, resolved, active, repeat_offenders,
            avg_loss, peak_hour, peak_day, peak_crime,
            stations[], offenders[], monthly_trend[] }
```

### Resource Deployment

```
GET /api/deployment
Response: [{ district, officers_deployed, patrol_units,
             investigation_units, avg_response_time,
             cases_per_officer, status }]
```

### Missing Persons

```
GET /api/missing
Response: [{ missing_id, name, age, gender, district,
             last_seen_date, missing_days, status }]
```

### Evidence Locker

```
GET /api/evidence
GET /api/evidence?case_id=X
Response: [{ evidence_id, case_id, type, collected_by,
             collection_date, analysis_status, 
             integrity_status, court_admissible,
             chain_of_custody[] }]
```

---

## 🔐 Role-Based Access

### Demo Credentials

| Officer ID | Password | Level | Access |
|---|---|---|---|
| `SP-Ramesh` | `demo1234` | Level 3 — TOP SECRET | State-wide + SCRB escalation |
| `DSP-Kumar` | `demo1234` | Level 2 — RESTRICTED | District-level operations |
| `admin` | `demo1234` | Level 4 — ADMIN | Full system + user management |

### Access Matrix

| Feature | admin (L4) | SP-Ramesh (L3) | DSP-Kumar (L2) |
|---|:---:|:---:|:---:|
| All 31 districts | ✅ | ✅ | ❌ Own only |
| SCRB Escalation | ✅ | ✅ | ❌ |
| Higher Official Dashboard | ✅ | ✅ | ❌ |
| Generate FIR | ✅ | ❌ | ✅ |
| Approve Deployment | ✅ | ✅ | ❌ |
| Crime Briefing Export | ✅ | ✅ | ❌ |
| Amber Alert | ✅ | ❌ | ✅ |
| Transfer Evidence | ✅ | ❌ | ✅ |
| Network — Vehicle Tab | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |

---

## 🗄️ Database Schema

### Complaints Table (Primary — 8,000 records)

```sql
CaseID           TEXT    -- KSP/BLR/2024/00001
District         TEXT    -- One of 31 Karnataka districts
PoliceStation    TEXT    -- Station name
CrimeType        TEXT    -- Murder/Robbery/Theft/Assault/
                         -- Cybercrime/Kidnapping/Fraud/
                         -- Drug Trafficking/Domestic Violence/
                         -- Vehicle Theft
OffenderID       TEXT    -- OFF-XXXXX
VictimID         TEXT    -- VIC-XXXXX
Latitude         DOUBLE  -- Karnataka coordinates
Longitude        DOUBLE  -- Karnataka coordinates
DateOfIncident   TEXT    -- ISO 8601 date
TimeOfDay        NUMBER  -- 0-23 (hour)
DayOfWeek        TEXT    -- Monday-Sunday
MO               TEXT    -- Modus operandi description
Status           TEXT    -- Under Investigation/FIR Filed/
                         -- Arrested/Court/Closed
OffenderAge      NUMBER  -- Age at time of incident
PriorConvictions NUMBER  -- Count of previous convictions
SocioEconomicZone TEXT   -- Low/Medium/High
LossAmountINR    DOUBLE  -- Financial loss (fraud/cyber cases)
AccusedPhone     TEXT    -- Phone number
VehicleNumber    TEXT    -- KA-format (20% of records)
```

### Supporting Tables

```
MissingPersons   — 50 records
  MissingID, Name, Age, Gender, LastSeenDistrict,
  LastSeenLocation, LastSeenDate, Status,
  ReportingOfficer

Victims          — 200 records
  VictimID, CaseID, Age, Gender, District,
  CrimeType, InjurySeverity, CompensationStatus,
  CounsellingRequired, LegalAidAssigned,
  FollowUpDate

Evidence         — 150 records
  EvidenceID, CaseID, EvidenceType, CollectedBy,
  CollectionDate, StorageLocation, AnalysisStatus,
  IntegrityStatus, CourtAdmissible,
  ChainOfCustody (JSON array)

Deployment       — 31 records (one per district)
  District, OfficersDeployed, PatrolUnits,
  InvestigationUnits, AvgResponseTimeMinutes
```

---

## 🤖 ML Models

### 1. Predictive Risk Scoring (RandomForestRegressor)

```python
Features:
  - crime_count_last_6_months
  - repeat_offender_ratio
  - avg_prior_convictions
  - socioeconomic_zone_encoded
  - crime_severity_score
    (Murder=10, Robbery=8, Assault=7,
     Fraud=6, Cybercrime=5, Theft=4)

Output:
  - district_risk_score: 0–100
  - risk_level: LOW / MEDIUM / HIGH / CRITICAL
  - predicted_trend: ↑/↓ % next 30 days
```

### 2. Anomaly Detection (IsolationForest)

```python
Features:
  - crime_type_encoded
  - time_of_day
  - day_of_week
  - offender_age
  - prior_convictions

Threshold: anomaly_score < -0.3

Output:
  - alert_level: CRITICAL / HIGH / MEDIUM
  - reason: human-readable explanation
  - anomaly_score: -1.0 to 0.0
```

### 3. Trend Detection (Statistical)

```python
Method:
  Compare 30-day rolling average
  vs 90-day historical baseline

Threshold: current_rate > 1.4 × historical_avg

Output:
  - spike_percentage
  - affected district + crime type
  - alert_text for SCRB
```

---

## 📤 Export & Print System

All exports use the custom `printExport.js` utility that opens a **clean A4 white window** — no sidebar, no dark background.

| Export | Format | Contents |
|---|---|---|
| Crime Briefing | A4 PDF | Stats, district table, alerts, recommendations |
| District Report | A4 PDF | Station performance, offenders, prime time |
| FIR Document | A4 PDF | Official FIR with KSP letterhead + signatures |
| Case File | A4 PDF | Case timeline, evidence list, documents |

---

## 🌓 Theme System

The portal supports full **Dark / Light mode** with animated transitions.

```
Dark Mode  → Deep navy (#020409) + cyan (#00e5ff) accents
Light Mode → White (#ffffff) + navy (#0077cc) accents
```

Theme preference is persisted in `localStorage` under key `ksp_theme`.

All 400+ color values use CSS custom properties so switching themes animates every element simultaneously over 400ms.

---

## 🔗 Live Demo

```
Frontend : https://YOUR-NGROK-URL.ngrok-free.app
API Health: https://YOUR-NGROK-URL.ngrok-free.app/api/health

Demo Login:
  Officer ID : SP-Ramesh
  Access Code: demo1234
```

---

## 📊 Data Sources

| Source | Description |
|---|---|
| `CRIME_REVIEW_JAN_2025.xlsx` | Real KSP monthly crime review (provided by KSP) |
| Synthetic Dataset | 8,000 generated records matching KSP schema |
| Karnataka Districts | All 31 official districts with coordinates |
| Socio-economic data | Synthetic zones (Low/Medium/High) per district |

---

## 📁 Key Files Reference

| File | Purpose |
|---|---|
| `client/src/index.css` | Complete CSS variable system for both themes |
| `client/src/context/ThemeContext.jsx` | Theme provider and toggle logic |
| `client/src/hooks/useRole.js` | Role-based access control hook |
| `client/src/utils/printExport.js` | A4 print window generator |
| `functions/ksp_api/main.py` | FastAPI app entry point |
| `functions/ksp_api/ml/risk_model.py` | RandomForest risk scoring |
| `functions/ksp_api/ml/anomaly_detector.py` | IsolationForest anomaly detection |
| `functions/ksp_api/ml/trend_detector.py` | Statistical spike detection |
| `functions/ksp_api/data/seed.py` | 8000-record synthetic data generator |
| `app-config.json` | Zoho Catalyst deployment configuration |

---

## 🏆 Competition Context

**Event:** Karnataka State Police Datathon 2026  
**Organiser:** Hack2skill × Karnataka State Police  
**Problem Statement:** AI-Driven Crime Analytics & Visualization Platform  
**Platform:** Zoho Catalyst (Advanced I/O Functions + Data Store)  

**What makes this submission stand out:**

1. **Pulsing red zones** — exactly as specified in the PS
2. **Socio-economic overlay** — "the why behind the where"
3. **Bilingual intelligence** — Kannada district names recognised
4. **Real KSP data format** — built on actual January 2025 crime review Excel
5. **End-to-end lifecycle** — FIR → Investigation → Verdict in one platform
6. **SCRB real-time pipeline** — replaces the 30–45 day Excel submission lag
7. **Role hierarchy** — SP / DSP / Admin with appropriate access gates
8. **Chain of custody** — evidence integrity for court proceedings
9. **Victim support tracking** — compensation and counselling pipeline
10. **Professional A4 exports** — print-ready documents for court and SCRB

---

## 👥 Team

| Name | Role |
|---|---|
| **Vishnu Harikaran** | Full Stack Developer |

**Built with:** React · FastAPI · Scikit-learn · D3.js · Zoho Catalyst

---

## 📄 License

```
RESTRICTED — Law Enforcement Use Only

This platform is developed under the Smart Policing Initiative
in partnership with the Karnataka State Police (KSP)
Cyber Crime Wing.

Unauthorized access is punishable under IT Act 2000 / BNS.
All sessions are monitored and logged.
```

---

<div align="center">

**Karnataka State Police • KSETP • Classified System**

*Developed for KSP Datathon 2026 — Hack2skill*

</div>
