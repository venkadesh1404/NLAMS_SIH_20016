"""
NLAMS (National Land Acquisition Management System) - Standalone Zero-Dependency Python REST Server
Runs out-of-the-box on standard Python 3.12 without external packages.
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
        # Enable CORS for frontend applications (Vite, React, etc.)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS pre-flight requests."""
        self._set_headers(204)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        query = urllib.parse.parse_qs(parsed.query)

        # Helper to get first query param
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
                "dataset_parcels": len(loader.get_all("parcels"))
            }).encode("utf-8"))
            return

        # 2. Executive Analytics
        if path == "/api/analytics":
            data = loader.get_analytics()
            self._set_headers(200)
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        # 3. Projects Collection & Single Project Details
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

        # 4. Standard Entity Endpoints
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
            # Optional project filter
            proj_id = q("projectId")
            if proj_id:
                items = [item for item in items if item.get("projectId") == proj_id]
            self._set_headers(200)
            self.wfile.write(json.dumps(items).encode("utf-8"))
            return

        # 404 Catch-all
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": f"Endpoint '{path}' not found"}).encode("utf-8"))

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        # 1. ML Predictive Risk
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

        # 2. Authentication Login
        if path == "/api/auth/login":
            email = payload.get("email", "").strip().lower()
            password = payload.get("password", "").strip()
            users = loader.get_all("users")
            user = next((u for u in users if u.get("email", "").lower() == email), None)

            # In demo mode, accept demo@123 or any password for registered test users
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

        # 404 Catch-all for POST
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": f"POST endpoint '{path}' not found"}).encode("utf-8"))

def run_server(port=PORT):
    server_address = ("", port)
    httpd = http.server.HTTPServer(server_address, NLAMSRequestHandler)
    print(f"================================================================")
    print(f" NLAMS Python Backend REST Server Active")
    print(f" Listening on http://localhost:{port}")
    print(f" Endpoints: /api/projects, /api/parcels, /api/analytics, /api/predict-risk")
    print(f"================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run_server(port)
