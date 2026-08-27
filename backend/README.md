# NLAMS Python Backend API (SIH 20016)

Python REST API server serving the **National Land Acquisition Management System (NLAMS)** dataset, ML risk prediction, and executive analytics.

---

## 1. Quick Start

### Option A: Standalone Zero-Dependency Python Server (Recommended - Runs instantly)
```powershell
python backend/server.py 8000
```
Or double-click `backend/run_backend.bat` / run `backend/run_backend.ps1`.

### Option B: FastAPI with Swagger OpenAPI Docs
```powershell
pip install -r backend/requirements.txt
python backend/app.py
```
Open interactive Swagger UI at: `http://localhost:8000/docs`

---

## 2. API Endpoints

### 2.1 System & Analytics
- `GET /api/health` — System status and loaded dataset statistics
- `GET /api/analytics` — Executive dashboard KPIs, state breakdowns, SLA risk counts

### 2.2 Projects & Cadastral Records
- `GET /api/projects` — Filter projects (query params: `state`, `district`, `type`, `stage`, `status`, `risk`, `search`)
- `GET /api/projects/{id}` — Full project details with linked parcels, awards, milestones, documents, and PAFs
- `GET /api/parcels` — Spatial land parcel dataset with coordinates (`?projectId=PRJ-001`)
- `GET /api/notifications` — Statutory gazette notices (`?projectId=PRJ-001`)
- `GET /api/awards` — LAO award declarations (`?projectId=PRJ-001`)
- `GET /api/compensation` — Direct beneficiary disbursement records (`?projectId=PRJ-001`)
- `GET /api/families` — R&R socio-economic census records (`?projectId=PRJ-001`)
- `GET /api/milestones` — Project milestones & delay metrics (`?projectId=PRJ-001`)
- `GET /api/alerts` — SLA bottleneck alerts (`?projectId=PRJ-001`)
- `GET /api/workflow` — Inter-departmental workflow tasks (`?projectId=PRJ-001`)
- `GET /api/documents` — DMS document metadata (`?projectId=PRJ-001`)
- `GET /api/audit` — Compliance audit logs
- `GET /api/sync` — Offline PWA sync transaction queue
- `GET /api/users` — Administrative user directory

### 2.3 Machine Learning & Predictive Risk
- `POST /api/predict-risk` — Computes composite risk score ($0-100$), risk classification (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and recommendations.

**Request Payload:**
```json
{
  "land_acquisition_percentage": 49.9,
  "pending_parcels": 4,
  "disputed_parcels": 1,
  "compensation_pending_percentage": 65.1,
  "approval_delay_days": 35,
  "possession_delay_days": 20,
  "rr_pending_percentage": 85.0
}
```

**Response:**
```json
{
  "riskScore": 69,
  "riskLevel": "HIGH",
  "recommendation": "Prioritize compensation sanction bottlenecks and district-level joint revenue verification...",
  "factors": [
    { "name": "Compensation Pending", "value": "65.1%", "weight": 25 },
    { "name": "Land Disputes", "value": "1 parcels", "weight": 2 },
    { "name": "Possession Delay", "value": "20 days", "weight": 4 },
    { "name": "R&R Pending", "value": "85.0%", "weight": 15 },
    { "name": "Approval Delays", "value": "35 days", "weight": 11 }
  ]
}
```

### 2.4 Authentication
- `POST /api/auth/login` — Sign in with registered credentials (e.g. `central@nlams.gov.in` / `demo@123`)

---

## 3. Python Integration Example

```python
import requests

# Fetch projects in Tamil Nadu
res = requests.get("http://localhost:8000/api/projects?state=Tamil Nadu")
projects = res.json()
print(f"Found {len(projects)} projects in Tamil Nadu")

# Fetch specific project details
details = requests.get("http://localhost:8000/api/projects/PRJ-003").json()
print("Linked parcels:", len(details["linked_parcels"]))
```
