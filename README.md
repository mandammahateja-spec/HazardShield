# HazardShield - AI-Powered Geospatial Hazard Zone & Carrying Capacity Platform
**Enterprise Disaster Governance Architecture**

HazardShield is an end-to-end geospatial intelligence and disaster governance system built for real-time hazard-zone identification, dynamic carrying capacity assessment (ECC), and role-gated relocation planning.

---

## 🏛️ System Architecture

```
                                  HAZARDSHIELD PLATFORM
                                 ═══════════════════════
       ┌────────────────────────────┐              ┌────────────────────────────┐
       │     COMMUNITY PORTAL       │              │      AUTHORITY PORTAL      │
       │    (Citizens / Public)     │              │  (Municipal → MHA Tiers)   │
       └──────────────┬─────────────┘              └──────────────┬─────────────┘
                      │                                           │
                      │ JWT (Role: community)                     │ JWT (Role: authority)
                      ▼                                           ▼
       ┌────────────────────────────────────────────────────────────────────────┐
       │                   NODE.JS / EXPRESS CONSOLIDATED API                   │
       │                              (Port 5000)                               │
       │                                                                        │
       │  • /api/auth/login (Dual-Role Login)                                   │
       │  • /api/community/* (Dashboard, Risk Status, Report Hazard, Alerts)   │
       │  • /api/authority/* (Dashboard, Verify, Score, Relocate, Alert, Export)│
       │  • /api/zones, /api/relocation-priority (Backward-Compatible REST API) │
       └──────────────┬───────────────────┬───────────────────────┬─────────────┘
                      │                   │                       │
      ISRO / InSAR    ▼                   ▼ HTTP /score-zone      ▼ Twilio & SendGrid
  ┌──────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
  │ SATELLITE & WEATHER  │    │  FASTAPI RISK ENGINE │    │    ALERT SERVICE    │
  │   TELEMETRY SYNC     │    │     (Port 8000)      │    │  SMS, Email & Push  │
  │ • OpenWeatherMap     │    │ • DRS Calculation    │    │ • Twilio SMS        │
  │ • ISRO Bhuvan InSAR  │    │ • Multi-Factor ECC   │    │ • SendGrid Email    │
  │ • Hourly node-cron   │    │ • OCI & RPI Engine   │    │ • Sandbox Fallback  │
  └──────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │   MONGODB DATABASE   │
                              │  • User              │
                              │  • Zone              │
                              │  • HazardReport      │
                              │  • RelocationPlan    │
                              │  • Alert             │
                              └──────────────────────┘
```

---

## 🔄 Strict State Machine Workflow

HazardShield enforces a closed-loop disaster risk governance sequence:

1. **Citizen Report Submission**:
   - Citizen submits a local hazard concern (`POST /api/community/report-hazard`).
   - Stored with `pending_review` status.
2. **Authority On-Ground Verification**:
   - Gated to **DistrictAdmin or higher** (`PATCH /api/authority/hazard-reports/:id/verify`).
   - Municipal attempts are rejected (HTTP 403).
3. **Automated Risk Engine Re-Scoring**:
   - Verification triggers FastAPI `/score-zone` microservice.
   - Computes **Dynamic Risk Score (DRS)** and **Environmental Carrying Capacity (ECC)** across 4 limiting factors:
     $$\text{DRS} = \text{MHI} \times \left[1 + \alpha \cdot \left(\frac{R_{\text{cum}} - R_{\text{thresh}}}{R_{\text{thresh}}}\right)\right]$$
     $$\text{ECC} = \min(C_{\text{drainage}}, C_{\text{slope}}, C_{\text{evac}}, C_{\text{water}})$$
   - Zone is dynamically reclassified (`red`, `yellow`, `green`).
4. **Relocation Plan Generation**:
   - If zone becomes `red` and population exceeds ECC ($OCI > 1.0$), a `pending_approval` relocation plan is created with TOPSIS-ranked shelter corridors.
5. **State/National Executive Approval**:
   - Gated strictly to **StateDMA or MHA** (`PATCH /api/authority/relocation/:id/approve`).
   - Prerequisites checked: Requires prior verified hazard status before approval.
6. **Multi-Channel Alert Broadcast**:
   - Authority triggers emergency broadcast (`POST /api/authority/alerts/dispatch`).
   - Alerts dispatched via Twilio SMS, SendGrid Email, and in-app feeds.
7. **Citizen Receiving**:
   - Citizens in affected zones immediately see the broadcast in `/api/community/alerts`.

---

## 🔑 Pre-Seeded Demonstration Credentials

| Role | Authority Level | Email | Password | Scope / Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Community** | N/A | `citizen@hazardshield.com` | `citizen123` | View assigned zone risk, submit hazard reports, receive alerts |
| **Authority** | `Municipal` | `municipal@hazardshield.com` | `muni123` | View dashboard, monitor ward reports |
| **Authority** | `DistrictAdmin` | `district@hazardshield.com` | `district123` | Verify citizen hazard reports, score zones, dispatch alerts |
| **Authority** | `StateDMA` | `state@hazardshield.com` | `state123` | Full state oversight + **Approve relocation plans** |
| **Authority** | `MHA` | `admin@hazardshield.com` | `admin123` | National command, cross-state relocation, DDMA PDF dossiers |

---

## 🚀 Running Locally

### 1. Prerequisites
- **Node.js**: v18+
- **Python**: v3.10+
- **MongoDB**: Local MongoDB or auto-fallback to `mongodb-memory-server`

### 2. Start the FastAPI Risk Engine
```bash
# In workspace root
pip install -r risk_engine/requirements.txt
python -m uvicorn risk_engine.main:app --host 127.0.0.1 --port 8000
```

### 3. Start the Node.js Express Backend
```bash
cd backend
npm install
npm start
# Runs on http://localhost:5000 with auto-seeded demo data
```

### 4. Start the Next.js Frontend
```bash
# In workspace root
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## 🧠 Machine Learning Prediction & Explainability Layer

HazardShield incorporates a dedicated, explainable Machine Learning (ML) prediction subsystem within the FastAPI service (`risk_engine/ml/`). 

### 1. Why ML Was Added
Static geological hazard boundaries and heuristic thresholds cannot capture complex, non-linear interactions (such as how slight terrain slope changes multiply the impact of extreme rainfall surges and saturated soil). The ML layer ingests live meteorological, topographic, and historical disaster indicators to forecast empirical hazard probability ($P \in [0.0, 1.0]$) before severe threshold breaches occur.

### 2. Primary Target & Hazard Focus
- **Target Hazard**: **Flood / Inundation Hazard Risk** (`flood_hazard_occurred`).
- **Target Definition**: Binary indicator (1 = flood breach/dangerous waterlogging within the sector, 0 = safe).
- **Prediction Horizon**: **72-hour forecasting window** from observation time.
- **Why Flood?**: Flooding is the most directly linked hazard to active meteorological and hydrological telemetry (`rainfall_mm`, soil moisture, drainage capacity, river proximity, and topography). The architecture is modular so other hazards (landslide, cloudburst) can be added as drop-in classifiers.

### 3. Model Architecture & Algorithm
- **Algorithm**: `RandomForestClassifier` (Scikit-Learn).
- **Why Random Forest?**:
  1. **Non-Linear Threshold Dynamics**: Tree splits accurately model physical step-functions (e.g., rainfall exceeding daily drainage clearance).
  2. **Scale Invariance**: Disparate physical units (elevation in meters, slope in degrees, moisture ratio 0-1) do not distort tree boundaries.
  3. **Class Balance**: Built-in `class_weight='balanced'` handles the natural class imbalance of rare disaster events.
  4. **Native Explainability**: Tree Gini importance and feature attribution provide transparent auditability required for government disaster governance.

### 4. Features & Engineering
| Feature | Type | Source / Physical Meaning |
| :--- | :--- | :--- |
| `rainfall_72h_mm` | Raw Float | Cumulative 72-hour precipitation (OpenWeatherMap / Rain gauges) |
| `rainfall_threshold_mm` | Raw Float | Local safe absorption threshold before surface runoff |
| `soil_saturation_ratio` | Raw Float | Antecedent soil pore moisture ratio ($0.0 - 1.0$) |
| `terrain_slope_degrees` | Raw Float | Ground slope (flat floodplains $\le 4^\circ$ vs. hills) |
| `drainage_capacity_mm_day` | Raw Float | Stormwater clearance capacity per 24 hours |
| `elevation_meters` | Raw Float | Mean elevation above sea level |
| `river_distance_meters` | Raw Float | Proximity to primary perennial drainage channel |
| `past_recurrence_count` | Raw Int | Documented historical inundation recurrence count |
| `vulnerability_svi` | Raw Float | Social & infrastructure vulnerability index ($0 - 100$) |
| `rainfall_to_threshold_ratio` | Engineered | Interaction ratio: $\frac{R_{\text{72h}}}{\max(1, R_{\text{thresh}})}$ |
| `drainage_deficit_ratio` | Engineered | Runoff vs. capacity: $\frac{R_{\text{72h}} / 3}{\max(1, \text{Drainage})}$ |

### 5. Training & Evaluation Metrics
The model is trained on a stratified 70% train / 15% validation / 15% test split with fixed seed reproducibility:
- **ROC-AUC Score**: **0.9397** (High class separation capability)
- **Precision**: **0.9303** (93.0% purity of hazard alerts)
- **Recall (Sensitivity)**: **0.8462** (84.6% of actual breaches detected)
- **F1-Score**: **0.8863** (Balanced harmonic mean)
- **Accuracy**: **0.8933**
- **Brier Score**: **0.0866** (Low probability calibration error)

### 6. Integration with Deterministic DRS & ECC Engine
The ML layer does **NOT** replace proven deterministic disaster physics. Instead, it forms a calibrated pipeline:
```
Weather & Geospatial Telemetry
              ↓
     Trained Random Forest
              ↓
   Hazard Probability (P_ML)
              ↓
Calibrated Hazard Intensity (Pillar 1) → Dynamic Risk Score (DRS)
                                                  ↓
                                      Multi-Factor ECC Minimization
                                                  ↓
                                     Overcapacity Index (OCI) & RPI
                                                  ↓
                                    Final Zone Classification (Red/Yellow/Green)
```
- **Pillar 1 Calibration**: When active, empirical ML probability calibrates the hazard intensity pillar: $\text{Pillar 1} = 0.5 \cdot H_{\text{sensor}} + 0.5 \cdot (P_{\text{ML}} \times 100)$.
- **Escalation Safeguard**: A critical ML breach probability ($P_{\text{ML}} \ge 0.85$) elevates an overcapacity zone to `red` status.
- **Graceful Fallback**: If the ML artifact is offline or disabled, `ml_status = "fallback_unavailable"` and the existing deterministic engine executes with zero interruption.

### 7. How to Train and Evaluate
```bash
# 1. (Optional) Re-generate synthetic development data
python risk_engine/data/generate_demo_data.py --samples 3000 --seed 42

# 2. Run reproducible model training
python risk_engine/ml/train.py --estimators 150 --depth 8 --seed 42

# 3. Evaluate against test partition
python risk_engine/ml/evaluate.py

# 4. Run Pytest ML test suite
pytest risk_engine/tests/ -v
```

### 8. API Endpoints

#### `POST /predict-hazard`
```bash
curl -X POST http://127.0.0.1:8000/predict-hazard \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": "zone_yamuna_01",
    "rainfall_72h_mm": 160.0,
    "rainfall_threshold_mm": 80.0,
    "soil_saturation_ratio": 0.85,
    "terrain_slope_degrees": 2.0,
    "drainage_capacity_mm_day": 40.0,
    "river_distance_meters": 250.0
  }'
```
**Response**:
```json
{
  "hazard_probability": 0.961,
  "prediction": "high",
  "risk_level": "critical",
  "top_factors": [
    "Precipitation Surge: 72h rainfall (160.0mm) exceeds safe terrain threshold (80.0mm) by +100%",
    "Drainage Saturation Deficit: Incoming daily water rate exceeds drainage clearance by +33%",
    "Low-Lying Flat Topography: Gentle slope (2.0 deg) promotes localized pooling and slow stormwater clearance"
  ],
  "model_version": "1.0.0",
  "hazard_type": "flood",
  "prediction_window_hours": 72,
  "status": "active"
}
```

### 9. Replacing Synthetic Demo Data with Real Historical Data
The current demo data in `demo_flood_hazard_data.csv` is explicitly synthetic. To train with real historical records:
1. Format your historical dataset to match the columns defined in [risk_engine/data/README.md](file:///d:/HazardShield/risk_engine/data/README.md).
2. Save to `risk_engine/data/real_flood_data.csv`.
3. Train: `python risk_engine/ml/train.py --data risk_engine/data/real_flood_data.csv`.
4. The serialized artifact at `risk_engine/ml/artifacts/flood_model.joblib` will automatically be loaded by the FastAPI service on next startup or reload without any API changes.

---

## 🧪 Automated Verification Suite

Run the Python ML test suite:
```bash
pytest risk_engine/tests/ -v
```
*(13 passed unit and integration tests covering preprocessing, training, feature explainability, fallback handling, `/predict-hazard`, and `/score-zone`)*

Run the full end-to-end integration test suite:
```bash
node backend/scratch/test_consolidated_workflow.js
```
*(20 passed tests covering citizen reporting, role-gated verification, FastAPI scoring, StateDMA relocation approvals, alert dispatch, and DDMA PDF dossier generation)*

---

## 🌐 Deployment Configuration

- **Render Blueprint**: `render.yaml` configures both the Express API and FastAPI microservice as coordinated services.
- **Vercel Config**: `vercel.json` configures the Next.js frontend with production API URL mapping.

---

## 📄 License & Compliance
Constituted in accordance with Section 25 & Section 34 of the **Disaster Management Act, 2005 (Act No. 53 of 2005)**, Government of India.

