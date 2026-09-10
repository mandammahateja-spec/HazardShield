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

## 🧪 Automated Verification Suite

Run the full end-to-end integration test suite verifying the dual-role architecture:
```bash
node backend/scratch/test_consolidated_workflow.js
```
*Result: 20 passed tests covering citizen reporting, role-gated verification, FastAPI scoring, StateDMA relocation approvals, alert dispatch, and DDMA PDF dossier generation.*

---

## 🌐 Deployment Configuration

- **Render Blueprint**: `render.yaml` configures both the Express API and FastAPI microservice as coordinated services.
- **Vercel Config**: `vercel.json` configures the Next.js frontend with production API URL mapping.

---

## 📄 License & Compliance
Constituted in accordance with Section 25 & Section 34 of the **Disaster Management Act, 2005 (Act No. 53 of 2005)**, Government of India.
