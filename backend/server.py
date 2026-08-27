"""
NLAMS (National Land Acquisition Management System) - Standalone Zero-Dependency Python REST Server
Provides full REST API endpoints without requiring external pip packages.
"""

import http.server
import json
import urllib.parse
from pathlib import Path
import sys

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from data_loader import loader
from ml_engine import predict_project_risk

PORT = 8000

class NLAMSRequestHandler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200, content_type="application/json"):
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Name, X-User-Role")
        self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS pre-flight requests."""
        self._set_headers(204)

    def _get_actor_info(self):
        actor_name = self.headers.get("X-User-Name", "Authorized Officer")
        actor_role = self.headers.get("X-User-Role", "pwd_agency")
        return actor_name, actor_role

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        query = urllib.parse.parse_qs(parsed.query)

        def q(key):
            return query.get(key, [None])[0]

        # 1. Health check
        if path == "" or path == "/api" or path == "/api/health":
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "online",
                "service": "NLAMS Backend API",
                "version": "1.0.0",
                "dataset_projects": len(loader.get_all("projects")),
                "dataset_proposals": len(loader.get_all("proposals")),
                "dataset_parcels": len(loader.get_all("parcels"))
            }).encode("utf-8"))
            return

        # 2. Executive Analytics
        if path == "/api/analytics":
            data = loader.get_analytics()
            self._set_headers(200)
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        # 3. Proposals Endpoints
        if path == "/api/proposals":
            status = q("status")
            role = q("role")
            user_email = q("userEmail")
            state = q("state")
            district = q("district")
            search = q("search")
            proposals = loader.get_proposals(status, role, user_email, state, district, search)
            self._set_headers(200)
            self.wfile.write(json.dumps(proposals).encode("utf-8"))
            return

        if path.startswith("/api/proposals/"):
            prop_id = path.split("/api/proposals/")[1]
            proposal = loader.get_by_id("proposals", prop_id)
            if proposal:
                self._set_headers(200)
                self.wfile.write(json.dumps(proposal).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Proposal '{prop_id}' not found"}).encode("utf-8"))
            return

        # 4. Projects Collection & Single Project Details
        if path == "/api/projects":
            state = q("state")
            district = q("district")
            ptype = q("type")
            stage = q("stage")
            status = q("status")
            risk = q("risk")
            search = q("search")
            projects = loader.filter_projects(state, district, ptype, stage, status, risk, search)
            self._set_headers(200)
            self.wfile.write(json.dumps(projects).encode("utf-8"))
            return

        if path.startswith("/api/projects/"):
            project_id = path.split("/api/projects/")[1]
            project_details = loader.get_project_details(project_id)
            if project_details:
                self._set_headers(200)
                self.wfile.write(json.dumps(project_details).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Project '{project_id}' not found"}).encode("utf-8"))
            return

        # 5. System Notifications Endpoint
        if path == "/api/notifications/system" or path == "/api/system-notifications":
            role = q("role")
            email = q("email")
            notifs = loader.get_notifications_for_user(role, email)
            self._set_headers(200)
            self.wfile.write(json.dumps(notifs).encode("utf-8"))
            return

        # 6. Standard Entity Collections
        endpoint_map = {
            "/api/parcels": "parcels",
            "/api/notifications": "notifications",
            "/api/awards": "awards",
            "/api/compensation": "compensation",
            "/api/families": "families",
            "/api/milestones": "milestones",
            "/api/alerts": "alerts",
            "/api/workflow": "workflow",
            "/api/documents": "documents",
            "/api/audit": "audit",
            "/api/sync": "sync",
            "/api/users": "users",
        }

        if path in endpoint_map:
            collection = endpoint_map[path]
            items = loader.get_all(collection)
            proj_id = q("projectId")
            if proj_id:
                items = [item for item in items if item.get("projectId") == proj_id]
            self._set_headers(200)
            self.wfile.write(json.dumps(items).encode("utf-8"))
            return

        # 404
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": f"Endpoint '{path}' not found"}).encode("utf-8"))

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        actor_name, actor_role = self._get_actor_info()

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        # 1. Proposals Workflow Actions
        if path == "/api/proposals":
            proposal = loader.create_proposal(payload, actor_name, actor_role)
            self._set_headers(201)
            self.wfile.write(json.dumps(proposal).encode("utf-8"))
            return

        if path.startswith("/api/proposals/") and path.endswith("/submit"):
            prop_id = path.split("/api/proposals/")[1].split("/submit")[0]
            notes = payload.get("notes", "")
            proposal = loader.submit_proposal(prop_id, actor_name, actor_role, notes)
            if proposal:
                self._set_headers(200)
                self.wfile.write(json.dumps(proposal).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Proposal '{prop_id}' not found"}).encode("utf-8"))
            return

        if path.startswith("/api/proposals/") and path.endswith("/verify"):
            prop_id = path.split("/api/proposals/")[1].split("/verify")[0]
            notes = payload.get("notes", "")
            proposal = loader.verify_proposal(prop_id, actor_name, actor_role, notes)
            if proposal:
                self._set_headers(200)
                self.wfile.write(json.dumps(proposal).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Proposal '{prop_id}' not found"}).encode("utf-8"))
            return

        if path.startswith("/api/proposals/") and path.endswith("/send-back"):
            prop_id = path.split("/api/proposals/")[1].split("/send-back")[0]
            reason = payload.get("reason", "").strip()
            if not reason:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Send back reason is mandatory."}).encode("utf-8"))
                return
            proposal = loader.send_back_proposal(prop_id, actor_name, actor_role, reason)
            if proposal:
                self._set_headers(200)
                self.wfile.write(json.dumps(proposal).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Proposal '{prop_id}' not found"}).encode("utf-8"))
            return

        if path.startswith("/api/proposals/") and path.endswith("/reject"):
            prop_id = path.split("/api/proposals/")[1].split("/reject")[0]
            reason = payload.get("reason", "").strip()
            if not reason:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Rejection reason is mandatory."}).encode("utf-8"))
                return
            proposal = loader.reject_proposal(prop_id, actor_name, actor_role, reason)
            if proposal:
                self._set_headers(200)
                self.wfile.write(json.dumps(proposal).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Proposal '{prop_id}' not found"}).encode("utf-8"))
            return

        if path.startswith("/api/proposals/") and path.endswith("/approve"):
            prop_id = path.split("/api/proposals/")[1].split("/approve")[0]
            notes = payload.get("notes", "")
            proposal = loader.approve_proposal(prop_id, actor_name, actor_role, notes)
            if proposal:
                self._set_headers(200)
                self.wfile.write(json.dumps(proposal).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Proposal '{prop_id}' not found"}).encode("utf-8"))
            return

        # 2. Project Creation
        if path == "/api/projects":
            project = loader.create_project(payload, actor_name, actor_role)
            self._set_headers(201)
            self.wfile.write(json.dumps(project).encode("utf-8"))
            return

        # 3. Document Creation / Upload
        if path == "/api/documents":
            doc = loader.create_document(payload, actor_name, actor_role)
            self._set_headers(201)
            self.wfile.write(json.dumps(doc).encode("utf-8"))
            return

        # 4. Notifications Mark Read
        if path.startswith("/api/notifications/") and path.endswith("/read"):
            notif_id = path.split("/api/notifications/")[1].split("/read")[0]
            notif = loader.mark_notification_read(notif_id)
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "success", "notification": notif}).encode("utf-8"))
            return

        if path == "/api/notifications/read-all":
            res = loader.mark_all_notifications_read(payload.get("role"), payload.get("email"))
            self._set_headers(200)
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        # 5. Audit Log Creation
        if path == "/api/audit":
            entry = loader.add_audit_log(
                payload.get("user", actor_name),
                payload.get("role", actor_role),
                payload.get("action", "UPDATE"),
                payload.get("module", "System"),
                payload.get("recordId", "REC-001"),
                payload.get("description", "System transaction logged.")
            )
            self._set_headers(201)
            self.wfile.write(json.dumps(entry).encode("utf-8"))
            return

        # 6. ML Predictive Risk
        if path == "/api/predict-risk":
            try:
                acq_pct = float(payload.get("land_acquisition_percentage", 0))
                pending_p = int(payload.get("pending_parcels", 0))
                disputed_p = int(payload.get("disputed_parcels", 0))
                comp_pend = float(payload.get("compensation_pending_percentage", 0))
                app_delay = int(payload.get("approval_delay_days", 0))
                poss_delay = int(payload.get("possession_delay_days", 0))
                rr_pend = float(payload.get("rr_pending_percentage", 0))

                result = predict_project_risk(
                    acq_pct, pending_p, disputed_p, comp_pend, app_delay, poss_delay, rr_pend
                )
                self._set_headers(200)
                self.wfile.write(json.dumps(result).encode("utf-8"))
            except Exception as e:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": f"Invalid payload: {str(e)}"}).encode("utf-8"))
            return

        # 7. Authentication Login
        if path == "/api/auth/login":
            email = payload.get("email", "").strip().lower()
            password = payload.get("password", "").strip()
            users = loader.get_all("users")
            user = next((u for u in users if u.get("email", "").lower() == email), None)

            if user:
                token = f"nlams-token-{user.get('id')}-{user.get('role')}"
                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "token": token,
                    "user": user
                }).encode("utf-8"))
            else:
                self._set_headers(401)
                self.wfile.write(json.dumps({"error": "Invalid email or credentials"}).encode("utf-8"))
            return

        # 404 Catch-all
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": f"POST endpoint '{path}' not found"}).encode("utf-8"))

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        actor_name, actor_role = self._get_actor_info()

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        if path.startswith("/api/proposals/"):
            prop_id = path.split("/api/proposals/")[1]
            proposal = loader.update_proposal(prop_id, payload, actor_name, actor_role)
            if proposal:
                self._set_headers(200)
                self.wfile.write(json.dumps(proposal).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Proposal '{prop_id}' not found"}).encode("utf-8"))
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"error": f"PUT endpoint '{path}' not found"}).encode("utf-8"))

def run_server(port=PORT):
    server_address = ("", port)
    httpd = http.server.HTTPServer(server_address, NLAMSRequestHandler)
    print(f"================================================================")
    print(f" NLAMS Python Backend REST Server Active")
    print(f" Listening on http://localhost:{port}")
    print(f" Endpoints: /api/proposals, /api/projects, /api/parcels, /api/analytics")
    print(f"================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run_server(port)
