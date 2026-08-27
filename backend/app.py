"""
NLAMS (National Land Acquisition Management System) - FastAPI Application
Provides interactive Swagger / OpenAPI docs at http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from pathlib import Path
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from data_loader import loader
from ml_engine import predict_project_risk

app = FastAPI(
    title="NLAMS REST API",
    description="National Land Acquisition Management System Backend API for SIH 20016",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RiskPredictionRequest(BaseModel):
    land_acquisition_percentage: float = Field(..., ge=0, le=100)
    pending_parcels: int = Field(0, ge=0)
    disputed_parcels: int = Field(0, ge=0)
    compensation_pending_percentage: float = Field(0, ge=0, le=100)
    approval_delay_days: int = Field(0, ge=0)
    possession_delay_days: int = Field(0, ge=0)
    rr_pending_percentage: float = Field(0, ge=0, le=100)

class LoginRequest(BaseModel):
    email: str
    password: str

@app.get("/")
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "NLAMS FastAPI Backend",
        "version": "1.0.0",
        "dataset_projects": len(loader.get_all("projects")),
        "dataset_parcels": len(loader.get_all("parcels")),
    }

@app.get("/api/analytics")
def get_analytics():
    return loader.get_analytics()

@app.get("/api/projects")
def get_projects(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    risk: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    return loader.filter_projects(state, district, type, stage, status, risk, search)

@app.get("/api/projects/{project_id}")
def get_project_details(project_id: str):
    details = loader.get_project_details(project_id)
    if not details:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return details

@app.get("/api/parcels")
def get_parcels(projectId: Optional[str] = None):
    parcels = loader.get_all("parcels")
    if projectId:
        return [p for p in parcels if p.get("projectId") == projectId]
    return parcels

@app.get("/api/notifications")
def get_notifications(projectId: Optional[str] = None):
    notifs = loader.get_all("notifications")
    if projectId:
        return [n for n in notifs if n.get("projectId") == projectId]
    return notifs

@app.get("/api/awards")
def get_awards(projectId: Optional[str] = None):
    awards = loader.get_all("awards")
    if projectId:
        return [a for a in awards if a.get("projectId") == projectId]
    return awards

@app.get("/api/compensation")
def get_compensation(projectId: Optional[str] = None):
    comps = loader.get_all("compensation")
    if projectId:
        return [c for c in comps if c.get("projectId") == projectId]
    return comps

@app.get("/api/families")
def get_families(projectId: Optional[str] = None):
    fams = loader.get_all("families")
    if projectId:
        return [f for f in fams if f.get("projectId") == projectId]
    return fams

@app.get("/api/milestones")
def get_milestones(projectId: Optional[str] = None):
    ms = loader.get_all("milestones")
    if projectId:
        return [m for m in ms if m.get("projectId") == projectId]
    return ms

@app.get("/api/alerts")
def get_alerts(projectId: Optional[str] = None):
    alerts = loader.get_all("alerts")
    if projectId:
        return [al for al in alerts if al.get("projectId") == projectId]
    return alerts

@app.get("/api/workflow")
def get_workflow(projectId: Optional[str] = None):
    tasks = loader.get_all("workflow")
    if projectId:
        return [w for w in tasks if w.get("projectId") == projectId]
    return tasks

@app.get("/api/documents")
def get_documents(projectId: Optional[str] = None):
    docs = loader.get_all("documents")
    if projectId:
        return [d for d in docs if d.get("projectId") == projectId]
    return docs

@app.get("/api/audit")
def get_audit():
    return loader.get_all("audit")

@app.get("/api/sync")
def get_sync_queue():
    return loader.get_all("sync")

@app.get("/api/users")
def get_users():
    return loader.get_all("users")

@app.post("/api/predict-risk")
def predict_risk_endpoint(req: RiskPredictionRequest):
    return predict_project_risk(
        req.land_acquisition_percentage,
        req.pending_parcels,
        req.disputed_parcels,
        req.compensation_pending_percentage,
        req.approval_delay_days,
        req.possession_delay_days,
        req.rr_pending_percentage,
    )

@app.post("/api/auth/login")
def login(req: LoginRequest):
    email = req.email.strip().lower()
    users = loader.get_all("users")
    user = next((u for u in users if u.get("email", "").lower() == email), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email address or unauthorized credentials")
    return {
        "token": f"nlams-bearer-token-{user.get('id')}",
        "user": user,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
