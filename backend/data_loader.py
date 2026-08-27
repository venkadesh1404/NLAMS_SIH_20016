"""
NLAMS (National Land Acquisition Management System) - Data Loader & Engine
Handles in-memory state, file persistence, queries, proposals workflow, notifications, and audit logging.
"""

import json
import os
import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_JSON_DIR = BASE_DIR / "dataset" / "json"

class DataLoader:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or DATASET_JSON_DIR
        self._data: Dict[str, List[Dict[str, Any]]] = {}
        self.reload()

    def reload(self):
        """Load or reload all JSON datasets into memory."""
        files = {
            "projects": "projects.json",
            "proposals": "proposals.json",
            "parcels": "land_parcels.json",
            "notifications": "notifications.json",
            "system_notifications": "system_notifications.json",
            "awards": "awards.json",
            "compensation": "compensation_records.json",
            "families": "affected_families.json",
            "milestones": "milestones.json",
            "alerts": "alerts.json",
            "workflow": "workflow_tasks.json",
            "documents": "documents.json",
            "audit": "audit_logs.json",
            "sync": "sync_queue.json",
            "users": "users.json",
            "risk_predictions": "risk_predictions.json",
        }

        for key, filename in files.items():
            filepath = self.data_dir / filename
            if filepath.exists():
                try:
                    with open(filepath, "r", encoding="utf-8-sig") as f:
                        self._data[key] = json.load(f)
                except Exception as e:
                    print(f"Error loading {filepath}: {e}")
                    self._data[key] = []
            else:
                self._data[key] = []

    def _persist(self, collection: str, filename: str):
        """Persist a collection back to disk."""
        filepath = self.data_dir / filename
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(self._data[collection], f, indent=2)
        except Exception as e:
            print(f"Error saving {filepath}: {e}")

    def get_all(self, collection: str) -> List[Dict[str, Any]]:
        return self._data.get(collection, [])

    def get_by_id(self, collection: str, item_id: str) -> Optional[Dict[str, Any]]:
        items = self.get_all(collection)
        for item in items:
            if item.get("id") == item_id:
                return item
        return None

    # =========================================================================
    # Audit Logging Helper
    # =========================================================================
    def add_audit_log(self, user: str, role: str, action: str, module: str, record_id: str, description: str):
        now_str = datetime.datetime.now().strftime("%d-%b-%Y %H:%M")
        audit_list = self.get_all("audit")
        log_id = f"AUD-{(len(audit_list) + 1):05d}"
        entry = {
            "id": log_id,
            "timestamp": now_str,
            "user": user,
            "role": role,
            "module": module,
            "action": action,
            "recordId": record_id,
            "description": description,
            "origin": "ONLINE",
            "syncTimestamp": None
        }
        # Prepend to log list
        self._data["audit"].insert(0, entry)
        self._persist("audit", "audit_logs.json")
        return entry

    # =========================================================================
    # System Event Notifications
    # =========================================================================
    def add_notification(
        self,
        title: str,
        message: str,
        notif_type: str = "info",
        recipient_role: Optional[str] = None,
        recipient_email: Optional[str] = None,
        target_module: str = "proposals",
        target_id: Optional[str] = None
    ):
        notifs = self.get_all("system_notifications")
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        notif_id = f"SYS-NOTIF-{(len(notifs) + 1):03d}"
        notif = {
            "id": notif_id,
            "title": title,
            "message": message,
            "type": notif_type,
            "recipientRole": recipient_role or "all",
            "recipientEmail": recipient_email,
            "targetModule": target_module,
            "targetId": target_id,
            "isRead": False,
            "timestamp": now_str
        }
        self._data["system_notifications"].insert(0, notif)
        self._persist("system_notifications", "system_notifications.json")
        return notif

    def mark_notification_read(self, notif_id: str):
        notifs = self.get_all("system_notifications")
        for n in notifs:
            if n.get("id") == notif_id:
                n["isRead"] = True
                self._persist("system_notifications", "system_notifications.json")
                return n
        return None

    def mark_all_notifications_read(self, role: Optional[str] = None, email: Optional[str] = None):
        notifs = self.get_all("system_notifications")
        for n in notifs:
            if role and n.get("recipientRole") not in [role, "all"] and (not email or n.get("recipientEmail") != email):
                continue
            n["isRead"] = True
        self._persist("system_notifications", "system_notifications.json")
        return {"status": "success"}

    def get_notifications_for_user(self, role: Optional[str] = None, email: Optional[str] = None) -> List[Dict[str, Any]]:
        notifs = self.get_all("system_notifications")
        if not role and not email:
            return notifs
        results = []
        for n in notifs:
            r_role = n.get("recipientRole")
            r_email = n.get("recipientEmail")
            if r_role == "all" or r_role == role or (email and r_email == email):
                results.append(n)
        return results

    # =========================================================================
    # Proposals Workflow Engine
    # =========================================================================
    def get_proposals(
        self,
        status: Optional[str] = None,
        role: Optional[str] = None,
        user_email: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        proposals = self.get_all("proposals")
        results = []

        for p in proposals:
            if status and p.get("status", "").upper() != status.upper():
                continue
            if state and p.get("state", "").lower() != state.lower():
                continue
            if district and p.get("district", "").lower() != district.lower():
                continue
            if search:
                s = search.lower()
                name = p.get("projectName", "").lower()
                pid = p.get("id", "").lower()
                dept = p.get("department", "").lower()
                if s not in name and s not in pid and s not in dept:
                    continue

            # Role-specific queue filtering if requested
            if role == "district_authority" and status == "PENDING_ACTION":
                if p.get("status") not in ["SUBMITTED", "UNDER_VERIFICATION"]:
                    continue
            elif role == "state_gov" and status == "PENDING_ACTION":
                if p.get("status") not in ["VERIFIED", "UNDER_SCRUTINY"]:
                    continue
            elif role == "pwd_agency" and status == "MY_PROPOSALS":
                if user_email and p.get("submittedByEmail") and p.get("submittedByEmail").lower() != user_email.lower():
                    continue

            results.append(p)

        return results

    def create_proposal(self, payload: Dict[str, Any], actor_name: str = "PWD Officer", actor_role: str = "pwd_agency") -> Dict[str, Any]:
        proposals = self.get_all("proposals")
        next_num = len(proposals) + 1
        prop_id = f"NLAMS-PROP-2026-{next_num:03d}"
        now_date = datetime.datetime.now().strftime("%Y-%m-%d")
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        is_submit = payload.get("isSubmit", False)
        status = "SUBMITTED" if is_submit else "DRAFT"
        stage = "Scrutiny" if is_submit else "Proposal"
        assigned_auth = "District Collector & Magistrate" if is_submit else "Superintending Engineer (PWD)"
        assigned_role = "district_authority" if is_submit else "pwd_agency"

        proposal = {
            "id": prop_id,
            "projectName": payload.get("projectName", "Untitled Infrastructure Proposal"),
            "submittedBy": actor_name,
            "submittedByEmail": payload.get("submittedByEmail", "pwd@nlams.gov.in"),
            "department": payload.get("department", "Infrastructure Engineering Cell"),
            "agency": payload.get("agency", "PWD"),
            "projectType": payload.get("projectType", "Highways"),
            "state": payload.get("state", "Tamil Nadu"),
            "district": payload.get("district", "Coimbatore"),
            "landRequired": float(payload.get("landRequired", payload.get("totalLandRequired", 10.0))),
            "estimatedCost": float(payload.get("estimatedCost", 100.0)),
            "purpose": payload.get("purpose", ""),
            "targetDate": payload.get("targetDate", payload.get("expectedCompletion", "2028-12-31")),
            "documents": payload.get("documents", []),
            "createdDate": now_date,
            "updatedDate": now_date,
            "status": status,
            "currentStage": stage,
            "assignedAuthority": assigned_auth,
            "assignedRole": assigned_role,
            "remarks": payload.get("remarks", "Initial proposal created."),
            "timeline": [
                {
                    "action": "Proposal Created",
                    "by": actor_name,
                    "role": actor_role,
                    "timestamp": now_ts,
                    "notes": "Draft proposal initialized with attached preliminary documentation."
                }
            ]
        }

        if is_submit:
            proposal["timeline"].append({
                "action": "Proposal Submitted",
                "by": actor_name,
                "role": actor_role,
                "timestamp": now_ts,
                "notes": f"Submitted for district level verification to {proposal['district']} District Authority."
            })
            # Notify District Authority
            self.add_notification(
                title="New Land Acquisition Proposal",
                message=f"Proposal {prop_id} for '{proposal['projectName']}' ({proposal['landRequired']} ha) submitted by {actor_name}. Verification required.",
                notif_type="warning",
                recipient_role="district_authority",
                target_module="proposals",
                target_id=prop_id
            )
            # Create Audit Log
            self.add_audit_log(actor_name, actor_role, "SUBMIT", "Proposals", prop_id, f"Submitted acquisition proposal {prop_id}")
        else:
            self.add_audit_log(actor_name, actor_role, "CREATE", "Proposals", prop_id, f"Created draft proposal {prop_id}")

        self._data["proposals"].insert(0, proposal)
        self._persist("proposals", "proposals.json")
        return proposal

    def update_proposal(self, prop_id: str, payload: Dict[str, Any], actor_name: str = "PWD Officer", actor_role: str = "pwd_agency") -> Optional[Dict[str, Any]]:
        proposal = self.get_by_id("proposals", prop_id)
        if not proposal:
            return None

        now_date = datetime.datetime.now().strftime("%Y-%m-%d")
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        for key in ["projectName", "department", "agency", "projectType", "state", "district", "landRequired", "estimatedCost", "purpose", "targetDate", "documents"]:
            if key in payload:
                proposal[key] = payload[key]

        proposal["updatedDate"] = now_date

        # Resubmission after send-back or draft submission
        if payload.get("isSubmit", False):
            proposal["status"] = "SUBMITTED"
            proposal["currentStage"] = "Scrutiny"
            proposal["assignedAuthority"] = "District Collector & Magistrate"
            proposal["assignedRole"] = "district_authority"
            proposal["sendBackReason"] = None
            proposal["timeline"].append({
                "action": "Proposal Resubmitted",
                "by": actor_name,
                "role": actor_role,
                "timestamp": now_ts,
                "notes": payload.get("notes", "Resubmitted with revised revenue survey records and compliance documents.")
            })
            self.add_notification(
                title="Proposal Resubmitted",
                message=f"Proposal {prop_id} resubmitted by {actor_name} after addressing feedback. Please verify.",
                notif_type="warning",
                recipient_role="district_authority",
                target_module="proposals",
                target_id=prop_id
            )
            self.add_audit_log(actor_name, actor_role, "SUBMIT", "Proposals", prop_id, f"Resubmitted proposal {prop_id}")
        else:
            proposal["timeline"].append({
                "action": "Proposal Updated",
                "by": actor_name,
                "role": actor_role,
                "timestamp": now_ts,
                "notes": "Draft proposal details updated."
            })
            self.add_audit_log(actor_name, actor_role, "UPDATE", "Proposals", prop_id, f"Updated draft proposal {prop_id}")

        self._persist("proposals", "proposals.json")
        return proposal

    def submit_proposal(self, prop_id: str, actor_name: str, actor_role: str, notes: str = "") -> Optional[Dict[str, Any]]:
        proposal = self.get_by_id("proposals", prop_id)
        if not proposal:
            return None

        now_date = datetime.datetime.now().strftime("%Y-%m-%d")
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        proposal["status"] = "SUBMITTED"
        proposal["currentStage"] = "Scrutiny"
        proposal["assignedAuthority"] = "District Collector & Magistrate"
        proposal["assignedRole"] = "district_authority"
        proposal["updatedDate"] = now_date
        proposal["sendBackReason"] = None

        proposal["timeline"].append({
            "action": "Proposal Submitted",
            "by": actor_name,
            "role": actor_role,
            "timestamp": now_ts,
            "notes": notes or "Formal submission forwarded to District Authority."
        })

        self.add_notification(
            title="New Proposal Submitted",
            message=f"Proposal {prop_id} for '{proposal['projectName']}' submitted for District verification.",
            notif_type="warning",
            recipient_role="district_authority",
            target_module="proposals",
            target_id=prop_id
        )
        self.add_audit_log(actor_name, actor_role, "SUBMIT", "Proposals", prop_id, f"Submitted proposal {prop_id}")

        self._persist("proposals", "proposals.json")
        return proposal

    def verify_proposal(self, prop_id: str, actor_name: str, actor_role: str, notes: str = "") -> Optional[Dict[str, Any]]:
        proposal = self.get_by_id("proposals", prop_id)
        if not proposal:
            return None

        now_date = datetime.datetime.now().strftime("%Y-%m-%d")
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        proposal["status"] = "UNDER_SCRUTINY"
        proposal["currentStage"] = "Approval"
        proposal["assignedAuthority"] = "State Project Director (PWD)"
        proposal["assignedRole"] = "state_gov"
        proposal["updatedDate"] = now_date

        proposal["timeline"].append({
            "action": "Proposal Verified",
            "by": actor_name,
            "role": actor_role,
            "timestamp": now_ts,
            "notes": notes or "District level boundary and revenue verification completed. Recommended for State Approval."
        })

        # Notify State Government
        self.add_notification(
            title="Proposal Verified – Action Required",
            message=f"Proposal {prop_id} ({proposal['projectName']}) verified by District Authority {actor_name}. Ready for State approval.",
            notif_type="info",
            recipient_role="state_gov",
            target_module="proposals",
            target_id=prop_id
        )
        # Notify PWD creator
        self.add_notification(
            title="Proposal Verified by District",
            message=f"Your proposal {prop_id} has been verified by District Authority and forwarded to State Government.",
            notif_type="success",
            recipient_role="pwd_agency",
            recipient_email=proposal.get("submittedByEmail"),
            target_module="proposals",
            target_id=prop_id
        )
        self.add_audit_log(actor_name, actor_role, "VERIFY", "Proposals", prop_id, f"Verified proposal {prop_id} and forwarded to State Government")

        self._persist("proposals", "proposals.json")
        return proposal

    def send_back_proposal(self, prop_id: str, actor_name: str, actor_role: str, reason: str) -> Optional[Dict[str, Any]]:
        proposal = self.get_by_id("proposals", prop_id)
        if not proposal:
            return None

        now_date = datetime.datetime.now().strftime("%Y-%m-%d")
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        proposal["status"] = "SENT_BACK"
        proposal["currentStage"] = "Proposal"
        proposal["assignedAuthority"] = "Superintending Engineer (PWD)"
        proposal["assignedRole"] = "pwd_agency"
        proposal["sendBackReason"] = reason
        proposal["updatedDate"] = now_date

        proposal["timeline"].append({
            "action": "Proposal Sent Back",
            "by": actor_name,
            "role": actor_role,
            "timestamp": now_ts,
            "notes": reason
        })

        # Notify PWD creator
        self.add_notification(
            title="Proposal Sent Back for Clarification",
            message=f"Proposal {prop_id} was sent back by {actor_name} ({actor_role}): '{reason}'",
            notif_type="error",
            recipient_role="pwd_agency",
            recipient_email=proposal.get("submittedByEmail"),
            target_module="proposals",
            target_id=prop_id
        )
        self.add_audit_log(actor_name, actor_role, "SEND_BACK", "Proposals", prop_id, f"Sent back proposal {prop_id}. Reason: {reason}")

        self._persist("proposals", "proposals.json")
        return proposal

    def reject_proposal(self, prop_id: str, actor_name: str, actor_role: str, reason: str) -> Optional[Dict[str, Any]]:
        proposal = self.get_by_id("proposals", prop_id)
        if not proposal:
            return None

        now_date = datetime.datetime.now().strftime("%Y-%m-%d")
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        proposal["status"] = "REJECTED"
        proposal["rejectionReason"] = reason
        proposal["updatedDate"] = now_date

        proposal["timeline"].append({
            "action": "Proposal Rejected",
            "by": actor_name,
            "role": actor_role,
            "timestamp": now_ts,
            "notes": reason
        })

        # Notify PWD creator
        self.add_notification(
            title="Proposal Rejected",
            message=f"Proposal {prop_id} ({proposal['projectName']}) has been rejected by {actor_name}. Reason: '{reason}'",
            notif_type="error",
            recipient_role="pwd_agency",
            recipient_email=proposal.get("submittedByEmail"),
            target_module="proposals",
            target_id=prop_id
        )
        self.add_audit_log(actor_name, actor_role, "REJECT", "Proposals", prop_id, f"Rejected proposal {prop_id}. Reason: {reason}")

        self._persist("proposals", "proposals.json")
        return proposal

    def approve_proposal(self, prop_id: str, actor_name: str, actor_role: str, notes: str = "") -> Optional[Dict[str, Any]]:
        proposal = self.get_by_id("proposals", prop_id)
        if not proposal:
            return None

        now_date = datetime.datetime.now().strftime("%Y-%m-%d")
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        proposal["status"] = "APPROVED"
        proposal["currentStage"] = "Notification"
        proposal["updatedDate"] = now_date

        proposal["timeline"].append({
            "action": "Proposal Approved",
            "by": actor_name,
            "role": actor_role,
            "timestamp": now_ts,
            "notes": notes or "Administrative sanction & financial clearance granted. Land acquisition proceedings initiated."
        })

        # Automatically create or link active project
        projects = self.get_all("projects")
        proj_id = f"PRJ-{(len(projects) + 1):03d}"
        new_project = {
            "id": proj_id,
            "name": proposal["projectName"],
            "agency": proposal["agency"],
            "state": proposal["state"],
            "district": proposal["district"],
            "type": proposal["projectType"],
            "landRequired": proposal["landRequired"],
            "landAcquired": 0.0,
            "landNotified": proposal["landRequired"],
            "acquisitionPct": 0.0,
            "compensationPct": 0.0,
            "possessionPct": 0.0,
            "rrPct": 0.0,
            "status": "Notification Issued",
            "stage": "Notification",
            "targetDate": proposal["targetDate"],
            "estimatedCost": proposal["estimatedCost"],
            "risk": "LOW",
            "riskScore": 25,
            "lastUpdated": now_ts,
            "description": proposal["purpose"],
            "parcels": [],
            "affectedFamilies": max(10, int(proposal["landRequired"] * 2.5)),
            "displacedFamilies": int(proposal["landRequired"] * 0.8),
            "compensationAssessed": round(proposal["estimatedCost"] * 0.25, 2),
            "compensationDisbursed": 0.0
        }
        self._data["projects"].insert(0, new_project)
        self._persist("projects", "projects.json")

        proposal["projectId"] = proj_id

        # Notify PWD
        self.add_notification(
            title="Proposal Approved – Project Initialized",
            message=f"Proposal {prop_id} has been APPROVED by State Government. Project {proj_id} created for land acquisition.",
            notif_type="success",
            recipient_role="pwd_agency",
            recipient_email=proposal.get("submittedByEmail"),
            target_module="projects",
            target_id=proj_id
        )
        self.add_audit_log(actor_name, actor_role, "APPROVE", "Proposals", prop_id, f"Approved proposal {prop_id}, created project {proj_id}")

        self._persist("proposals", "proposals.json")
        return proposal

    # =========================================================================
    # Project & Document Creation
    # =========================================================================
    def create_project(self, payload: Dict[str, Any], actor_name: str = "PWD Engineer", actor_role: str = "pwd_agency") -> Dict[str, Any]:
        projects = self.get_all("projects")
        next_num = len(projects) + 1
        proj_id = payload.get("id") or f"PRJ-{next_num:03d}"
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        land_req = float(payload.get("landRequired", 50.0))
        land_acq = float(payload.get("landAcquired", 0.0))
        acq_pct = round((land_acq / land_req * 100) if land_req else 0.0, 1)

        project = {
            "id": proj_id,
            "name": payload.get("name", "New Infrastructure Project"),
            "agency": payload.get("agency", "PWD"),
            "state": payload.get("state", "Tamil Nadu"),
            "district": payload.get("district", "Coimbatore"),
            "type": payload.get("type", "Highways"),
            "landRequired": land_req,
            "landAcquired": land_acq,
            "landNotified": float(payload.get("landNotified", land_req)),
            "acquisitionPct": acq_pct,
            "compensationPct": float(payload.get("compensationPct", 0.0)),
            "possessionPct": float(payload.get("possessionPct", 0.0)),
            "rrPct": float(payload.get("rrPct", 0.0)),
            "status": payload.get("status", "Submitted"),
            "stage": payload.get("stage", "Proposal"),
            "targetDate": payload.get("targetDate", "2028-12-31"),
            "estimatedCost": float(payload.get("estimatedCost", 1000.0)),
            "risk": payload.get("risk", "LOW"),
            "riskScore": int(payload.get("riskScore", 20)),
            "lastUpdated": now_ts,
            "description": payload.get("description", ""),
            "parcels": payload.get("parcels", []),
            "affectedFamilies": int(payload.get("affectedFamilies", max(5, int(land_req * 2)))),
            "displacedFamilies": int(payload.get("displacedFamilies", int(land_req * 0.5))),
            "compensationAssessed": float(payload.get("compensationAssessed", 200.0)),
            "compensationDisbursed": float(payload.get("compensationDisbursed", 0.0)),
        }

        self._data["projects"].insert(0, project)
        self._persist("projects", "projects.json")

        self.add_audit_log(actor_name, actor_role, "CREATE", "Projects", proj_id, f"Created new project record {proj_id}")
        self.add_notification(
            title="New Project Registered",
            message=f"Project {proj_id} ({project['name']}) created in {project['district']}, {project['state']}.",
            notif_type="info",
            recipient_role="all",
            target_module="projects",
            target_id=proj_id
        )

        return project

    def create_document(self, payload: Dict[str, Any], actor_name: str = "Officer", actor_role: str = "pwd_agency") -> Dict[str, Any]:
        docs = self.get_all("documents")
        next_num = len(docs) + 1
        doc_id = f"DOC-{next_num:05d}"
        now_date = datetime.datetime.now().strftime("%Y-%m-%d")

        doc = {
            "id": doc_id,
            "projectId": payload.get("projectId", "PRJ-001"),
            "projectName": payload.get("projectName", "General Project"),
            "category": payload.get("category", "Land Records"),
            "fileName": payload.get("fileName", "Document.pdf"),
            "uploadedBy": actor_name,
            "uploadDate": now_date,
            "version": payload.get("version", "v1.0"),
            "status": "Verified",
            "size": payload.get("size", "2.4 MB")
        }

        self._data["documents"].insert(0, doc)
        self._persist("documents", "documents.json")
        self.add_audit_log(actor_name, actor_role, "UPLOAD", "Documents", doc_id, f"Uploaded document {doc['fileName']} for {doc['projectId']}")
        return doc

    # =========================================================================
    # Query & Analytics
    # =========================================================================
    def filter_projects(
        self,
        state: Optional[str] = None,
        district: Optional[str] = None,
        project_type: Optional[str] = None,
        stage: Optional[str] = None,
        status: Optional[str] = None,
        risk: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        projects = self.get_all("projects")
        results = []

        for p in projects:
            if state and p.get("state", "").lower() != state.lower():
                continue
            if district and p.get("district", "").lower() != district.lower():
                continue
            if project_type and p.get("type", "").lower() != project_type.lower():
                continue
            if stage and p.get("stage", "").lower() != stage.lower():
                continue
            if status and p.get("status", "").lower() != status.lower():
                continue
            if risk and p.get("risk", "").upper() != risk.upper():
                continue
            if search:
                s = search.lower()
                name = p.get("name", "").lower()
                p_id = p.get("id", "").lower()
                desc = p.get("description", "").lower()
                if s not in name and s not in p_id and s not in desc:
                    continue
            results.append(p)

        return results

    def get_project_details(self, project_id: str) -> Optional[Dict[str, Any]]:
        project = self.get_by_id("projects", project_id)
        if not project:
            return None

        details = dict(project)
        details["linked_parcels"] = [p for p in self.get_all("parcels") if p.get("projectId") == project_id]
        details["linked_notifications"] = [n for n in self.get_all("notifications") if n.get("projectId") == project_id]
        details["linked_awards"] = [a for a in self.get_all("awards") if a.get("projectId") == project_id]
        details["linked_compensation"] = [c for c in self.get_all("compensation") if c.get("projectId") == project_id]
        details["linked_families"] = [f for f in self.get_all("families") if f.get("projectId") == project_id]
        details["linked_milestones"] = [m for m in self.get_all("milestones") if m.get("projectId") == project_id]
        details["linked_alerts"] = [al for al in self.get_all("alerts") if al.get("projectId") == project_id]
        details["linked_workflow"] = [w for w in self.get_all("workflow") if w.get("projectId") == project_id]
        details["linked_documents"] = [d for d in self.get_all("documents") if d.get("projectId") == project_id]
        details["risk_prediction"] = next((r for r in self.get_all("risk_predictions") if r.get("projectId") == project_id), None)
        return details

    def get_analytics(self) -> Dict[str, Any]:
        projects = self.get_all("projects")
        proposals = self.get_all("proposals")
        total_projects = len(projects)
        if total_projects == 0:
            return {"totalProjects": 0}

        total_land_required = sum(p.get("landRequired", 0) for p in projects)
        total_land_acquired = sum(p.get("landAcquired", 0) for p in projects)
        total_cost = sum(p.get("estimatedCost", 0) for p in projects)
        total_comp_assessed = sum(p.get("compensationAssessed", 0) for p in projects)
        total_comp_disbursed = sum(p.get("compensationDisbursed", 0) for p in projects)
        total_affected_families = sum(p.get("affectedFamilies", 0) for p in projects)
        total_displaced_families = sum(p.get("displacedFamilies", 0) for p in projects)

        avg_acq_pct = round((total_land_acquired / total_land_required * 100) if total_land_required else 0, 1)
        avg_comp_pct = round((total_comp_disbursed / total_comp_assessed * 100) if total_comp_assessed else 0, 1)

        # Stage breakdown
        stages: Dict[str, int] = {}
        for p in projects:
            stg = p.get("stage", "Proposal")
            stages[stg] = stages.get(stg, 0) + 1

        # Status breakdown
        statuses: Dict[str, int] = {}
        for p in projects:
            st = p.get("status", "Submitted")
            statuses[st] = statuses.get(st, 0) + 1

        # Risk breakdown (0-30 LOW, 31-60 MEDIUM, 61-80 HIGH, 81-100 CRITICAL)
        risks: Dict[str, int] = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        for p in projects:
            r = p.get("risk", "LOW")
            risks[r] = risks.get(r, 0) + 1

        # State-wise metrics
        states_data: Dict[str, Dict[str, Any]] = {}
        for p in projects:
            st = p.get("state", "Unknown")
            if st not in states_data:
                states_data[st] = {
                    "state": st,
                    "projectCount": 0,
                    "landRequired": 0,
                    "landAcquired": 0,
                    "estimatedCost": 0,
                    "delayedCount": 0,
                }
            states_data[st]["projectCount"] += 1
            states_data[st]["landRequired"] += p.get("landRequired", 0)
            states_data[st]["landAcquired"] += p.get("landAcquired", 0)
            states_data[st]["estimatedCost"] += p.get("estimatedCost", 0)
            if p.get("status") == "Delayed":
                states_data[st]["delayedCount"] += 1

        for st in states_data:
            req = states_data[st]["landRequired"]
            acq = states_data[st]["landAcquired"]
            states_data[st]["acquisitionPct"] = round((acq / req * 100) if req else 0, 1)

        return {
            "totalProjects": total_projects,
            "totalProposals": len(proposals),
            "pendingProposalsCount": len([pr for pr in proposals if pr.get("status") in ["SUBMITTED", "UNDER_VERIFICATION", "UNDER_SCRUTINY"]]),
            "totalLandRequired": round(total_land_required, 2),
            "totalLandAcquired": round(total_land_acquired, 2),
            "overallAcquisitionPct": avg_acq_pct,
            "totalEstimatedCost": round(total_cost, 2),
            "totalCompensationAssessed": round(total_comp_assessed, 2),
            "totalCompensationDisbursed": round(total_comp_disbursed, 2),
            "compensationDisbursementPct": avg_comp_pct,
            "totalAffectedFamilies": total_affected_families,
            "totalDisplacedFamilies": total_displaced_families,
            "stages": stages,
            "statuses": statuses,
            "risks": risks,
            "stateBreakdown": list(states_data.values()),
            "alertsCount": len(self.get_all("alerts")),
            "pendingTasksCount": len([t for t in self.get_all("workflow") if t.get("status") == "Pending"]),
        }

# Global singleton loader instance
loader = DataLoader()
