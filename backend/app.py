"""
NLAMS (National Land Acquisition Management System) - FastAPI Application
Provides enterprise OpenAPI/Swagger documentation, Pydantic schemas, and REST endpoints.
"""

from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from data_loader import loader
from ml_engine import predict_project_risk

app = FastAPI(
    title="NLAMS REST API",
    description="National Land Acquisition & Management System - Real-Time Decision Support & Workflow API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Request Models ---
class RiskPredictionRequest(BaseModel):
    land_acquisition_percentage: float = Field(..., ge=0, le=100)
    pending_parcels: int = Field(..., ge=0)
    disputed_parcels: int = Field(..., ge=0)
    compensation_pending_percentage: float = Field(..., ge=0, le=100)
    approval_delay_days: int = Field(..., ge=0)
    possession_delay_days: int = Field(..., ge=0)
    rr_pending_percentage: float = Field(..., ge=0, le=100)

class LoginRequest(BaseModel):
    email: str
    password: str

class ProposalCreateRequest(BaseModel):
    projectName: str
    department: Optional[str] = "Infrastructure Engineering Cell"
    agency: Optional[str] = "PWD"
    projectType: Optional[str] = "Highways"
    state: str
    district: str
    landRequired: float
    estimatedCost: float
    purpose: Optional[str] = ""
    targetDate: Optional[str] = "2028-12-31"
    isSubmit: Optional[bool] = False
    documents: Optional[List[Dict[str, Any]]] = []
    submittedByEmail: Optional[str] = None

class ProposalActionRequest(BaseModel):
    reason: Optional[str] = None
    notes: Optional[str] = None

class ProjectCreateRequest(BaseModel):
    name: str
    agency: Optional[str] = "PWD"
    state: str
    district: str
    type: Optional[str] = "Highways"
    landRequired: float
    landAcquired: Optional[float] = 0.0
    estimatedCost: float
    targetDate: Optional[str] = "2028-12-31"
    description: Optional[str] = ""

class DocumentUploadRequest(BaseModel):
    projectId: str
    projectName: Optional[str] = "General Project"
    category: str
    fileName: str
    size: Optional[str] = "2.5 MB"
    version: Optional[str] = "v1.0"

class AuditLogRequest(BaseModel):
    user: str
    role: str
    action: str
    module: str
    recordId: str
    description: str

# --- Endpoints ---

@app.get("/")
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "NLAMS Backend API (FastAPI)",
        "version": "1.0.0",
        "dataset_projects": len(loader.get_all("projects")),
        "dataset_proposals": len(loader.get_all("proposals")),
        "dataset_parcels": len(loader.get_all("parcels")),
    }

@app.get("/api/analytics")
def get_analytics():
    return loader.get_analytics()

# Proposals
@app.get("/api/proposals")
def get_proposals(
    status: Optional[str] = None,
    role: Optional[str] = None,
    userEmail: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    search: Optional[str] = None
):
    return loader.get_proposals(status, role, userEmail, state, district, search)

@app.get("/api/proposals/{proposal_id}")
def get_proposal_by_id(proposal_id: str):
    p = loader.get_by_id("proposals", proposal_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Proposal '{proposal_id}' not found")
    return p

@app.post("/api/proposals", status_code=201)
def create_proposal(
    req: ProposalCreateRequest,
    x_user_name: Optional[str] = Header(default="PWD Officer"),
    x_user_role: Optional[str] = Header(default="pwd_agency")
):
    return loader.create_proposal(req.dict(), x_user_name, x_user_role)

@app.put("/api/proposals/{proposal_id}")
def update_proposal(
    proposal_id: str,
    payload: Dict[str, Any],
    x_user_name: Optional[str] = Header(default="PWD Officer"),
    x_user_role: Optional[str] = Header(default="pwd_agency")
):
    p = loader.update_proposal(proposal_id, payload, x_user_name, x_user_role)
    if not p:
        raise HTTPException(status_code=404, detail=f"Proposal '{proposal_id}' not found")
    return p

@app.post("/api/proposals/{proposal_id}/submit")
def submit_proposal(
    proposal_id: str,
    req: Optional[ProposalActionRequest] = None,
    x_user_name: Optional[str] = Header(default="PWD Officer"),
    x_user_role: Optional[str] = Header(default="pwd_agency")
):
    notes = req.notes if req else ""
    p = loader.submit_proposal(proposal_id, x_user_name, x_user_role, notes or "")
    if not p:
        raise HTTPException(status_code=404, detail=f"Proposal '{proposal_id}' not found")
    return p

@app.post("/api/proposals/{proposal_id}/verify")
def verify_proposal(
    proposal_id: str,
    req: Optional[ProposalActionRequest] = None,
    x_user_name: Optional[str] = Header(default="District Authority"),
    x_user_role: Optional[str] = Header(default="district_authority")
):
    notes = req.notes if req else ""
    p = loader.verify_proposal(proposal_id, x_user_name, x_user_role, notes or "")
    if not p:
        raise HTTPException(status_code=404, detail=f"Proposal '{proposal_id}' not found")
    return p

@app.post("/api/proposals/{proposal_id}/send-back")
def send_back_proposal(
    proposal_id: str,
    req: ProposalActionRequest,
    x_user_name: Optional[str] = Header(default="District Authority"),
    x_user_role: Optional[str] = Header(default="district_authority")
):
    if not req.reason or not req.reason.strip():
        raise HTTPException(status_code=400, detail="Send back reason is mandatory.")
    p = loader.send_back_proposal(proposal_id, x_user_name, x_user_role, req.reason.strip())
    if not p:
        raise HTTPException(status_code=404, detail=f"Proposal '{proposal_id}' not found")
    return p

@app.post("/api/proposals/{proposal_id}/reject")
def reject_proposal(
    proposal_id: str,
    req: ProposalActionRequest,
    x_user_name: Optional[str] = Header(default="Authority"),
    x_user_role: Optional[str] = Header(default="district_authority")
):
    if not req.reason or not req.reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is mandatory.")
    p = loader.reject_proposal(proposal_id, x_user_name, x_user_role, req.reason.strip())
    if not p:
        raise HTTPException(status_code=404, detail=f"Proposal '{proposal_id}' not found")
    return p

@app.post("/api/proposals/{proposal_id}/approve")
def approve_proposal(
    proposal_id: str,
    req: Optional[ProposalActionRequest] = None,
    x_user_name: Optional[str] = Header(default="State Secretary"),
    x_user_role: Optional[str] = Header(default="state_gov")
):
    notes = req.notes if req else ""
    p = loader.approve_proposal(proposal_id, x_user_name, x_user_role, notes or "")
    if not p:
        raise HTTPException(status_code=404, detail=f"Proposal '{proposal_id}' not found")
    return p

# Projects
@app.get("/api/projects")
def get_projects(
    state: Optional[str] = None,
    district: Optional[str] = None,
    type: Optional[str] = None,
    stage: Optional[str] = None,
    status: Optional[str] = None,
    risk: Optional[str] = None,
    search: Optional[str] = None,
):
    return loader.filter_projects(state, district, type, stage, status, risk, search)

@app.get("/api/projects/{project_id}")
def get_project_details(project_id: str):
    p = loader.get_project_details(project_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return p

@app.post("/api/projects", status_code=201)
def create_project(
    req: ProjectCreateRequest,
    x_user_name: Optional[str] = Header(default="PWD Engineer"),
    x_user_role: Optional[str] = Header(default="pwd_agency")
):
    return loader.create_project(req.dict(), x_user_name, x_user_role)

# Notifications
@app.get("/api/notifications/system")
@app.get("/api/system-notifications")
def get_system_notifications(role: Optional[str] = None, email: Optional[str] = None):
    return loader.get_notifications_for_user(role, email)

@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    n = loader.mark_notification_read(notification_id)
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success", "notification": n}

@app.post("/api/notifications/read-all")
def mark_all_notifications_read(payload: Dict[str, Any] = {}):
    return loader.mark_all_notifications_read(payload.get("role"), payload.get("email"))

# Documents
@app.post("/api/documents", status_code=201)
def upload_document(
    req: DocumentUploadRequest,
    x_user_name: Optional[str] = Header(default="Officer"),
    x_user_role: Optional[str] = Header(default="pwd_agency")
):
    return loader.create_document(req.dict(), x_user_name, x_user_role)

# Audit
@app.get("/api/audit")
def get_audit_logs():
    return loader.get_all("audit")

@app.post("/api/audit", status_code=201)
def create_audit_log(req: AuditLogRequest):
    return loader.add_audit_log(req.user, req.role, req.action, req.module, req.recordId, req.description)

# Standard Collections
@app.get("/api/parcels")
def get_parcels(projectId: Optional[str] = None):
    items = loader.get_all("parcels")
    if projectId:
        return [i for i in items if i.get("projectId") == projectId]
    return items

@app.get("/api/notifications")
def get_statutory_notifications(projectId: Optional[str] = None):
    items = loader.get_all("notifications")
    if projectId:
        return [i for i in items if i.get("projectId") == projectId]
    return items

@app.get("/api/awards")
def get_awards(projectId: Optional[str] = None):
    items = loader.get_all("awards")
    if projectId:
        return [i for i in items if i.get("projectId") == projectId]
    return items

@app.get("/api/compensation")
def get_compensation(projectId: Optional[str] = None):
    items = loader.get_all("compensation")
    if projectId:
        return [i for i in items if i.get("projectId") == projectId]
    return items

@app.get("/api/families")
def get_families(projectId: Optional[str] = None):
    items = loader.get_all("families")
    if projectId:
        return [i for i in items if i.get("projectId") == projectId]
    return items

@app.get("/api/milestones")
def get_milestones(projectId: Optional[str] = None):
    items = loader.get_all("milestones")
    if projectId:
        return [i for i in items if i.get("projectId") == projectId]
    return items

@app.get("/api/alerts")
def get_alerts():
    return loader.get_all("alerts")

@app.get("/api/workflow")
def get_workflow():
    return loader.get_all("workflow")

@app.get("/api/documents")
def get_documents(projectId: Optional[str] = None):
    items = loader.get_all("documents")
    if projectId:
        return [i for i in items if i.get("projectId") == projectId]
    return items

@app.get("/api/sync")
def get_sync():
    return loader.get_all("sync")

@app.get("/api/users")
def get_users():
    return loader.get_all("users")

# ML & Auth
@app.post("/api/predict-risk")
def predict_risk(req: RiskPredictionRequest):
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
    users = loader.get_all("users")
    user = next((u for u in users if u.get("email", "").lower() == req.email.lower().strip()), None)
    if user:
        return {
            "token": f"nlams-jwt-{user.get('id')}-{user.get('role')}",
            "user": user
        }
    raise HTTPException(status_code=401, detail="Invalid email or password")
