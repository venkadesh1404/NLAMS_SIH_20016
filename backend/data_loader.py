"""
NLAMS (National Land Acquisition Management System) - Data Loader & Query Engine
Loads and indexes dataset from dataset/json/ directory.
"""

import json
import os
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
            "parcels": "land_parcels.json",
            "notifications": "notifications.json",
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

    def get_all(self, collection: str) -> List[Dict[str, Any]]:
        return self._data.get(collection, [])

    def get_by_id(self, collection: str, item_id: str) -> Optional[Dict[str, Any]]:
        items = self.get_all(collection)
        for item in items:
            if item.get("id") == item_id:
                return item
        return None

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
        """Filter projects by multiple criteria."""
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
        """Get full project details with all linked child records."""
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
        """Compute high-level executive analytics and KPI metrics across all projects."""
        projects = self.get_all("projects")
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

        # Risk breakdown
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
