# NLAMS — National Land Acquisition Management System

**Smart India Hackathon 2026 (SIH 20016)**

A full-stack government-grade digital platform that manages the entire land acquisition lifecycle — from project proposal and multi-level administrative approval, through statutory notification, cadastral parcel mapping, compensation disbursement, physical possession, and rehabilitation & resettlement (R&R) of affected families — with an integrated AI/ML predictive risk engine and offline-first PWA design.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Frontend Architecture & Features](#3-frontend-architecture--features)
4. [Backend Architecture & API](#4-backend-architecture--api)
5. [Data Layer & Dataset](#5-data-layer--dataset)
6. [ML Risk Prediction Engine](#6-ml-risk-prediction-engine)
7. [Installation, Setup & Usage](#7-installation-setup--usage)
8. [File Structure](#8-file-structure)
9. [Demo Credentials](#9-demo-credentials)
10. [API Endpoint Reference](#10-api-endpoint-reference)

---

## 1. Project Overview

### Problem Statement

Land acquisition for public infrastructure projects in India is governed by the **Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act (RFCTLARR), 2013**. The process involves multiple stages — preliminary notification, social impact assessment, identification of affected families, compensation determination, physical possession, and rehabilitation — each requiring coordination between central ministries, state governments, district collectors, land acquisition officers, and project agencies (e.g., PWD).

Currently this workflow is largely paper-based and fragmented across departments, leading to:
- Delays in compensation disbursement (sometimes years)
- Disputes over land ownership and boundary records
- Lack of transparency for affected citizens
- No early-warning system for project risk
- Difficult audit trails for statutory compliance

### What NLAMS Does

NLAMS digitizes and unifies this entire lifecycle into a single web-based platform with:

- **Proposal workflow engine** — PWD agencies submit project proposals that flow through District Authority verification → State Government approval, with send-back/reject mechanisms and full timeline tracking
- **Cadastral parcel management** — individual land parcels linked to projects with survey numbers, coordinates, ownership type, and acquisition status
- **Compensation tracking** — award determination, beneficiary disbursement records, and financial reconciliation
- **Rehabilitation & Resettlement** — socio-economic census of affected families, displaced family tracking, and R&R benefit monitoring
- **GIS mapping** — interactive Leaflet maps showing project land parcels with geographic coordinates
- **Predictive AI risk engine** — a 7-factor weighted scoring model that computes project delay risk (0–100) with recommendations
- **Role-based access control** — 7 distinct government roles with granular page-level and action-level permissions
- **Offline-first PWA** — service worker caching, IndexedDB sync queue, and offline data entry with later synchronization
- **Comprehensive audit trail** — every create/update/submit/verify/approve/reject action is logged with user, role, timestamp, and origin (ONLINE/OFFLINE)
- **Statutory notification management** — gazette-style S1/S2/S3 notifications tracked per project
- **Executive analytics dashboard** — KPIs, state-wise breakdowns, SLA risk distribution, and milestone delay metrics
- **Document management** — DPR, cadastral maps, awards, and legal documents with version tracking
- **Inter-departmental workflow tasks** — task assignment and tracking across revenue, forest, environment, and engineering departments
- **SLA bottleneck alerts** — automated alerts when milestones breach statutory time limits

### Target Users

| Role | Description |
|------|-------------|
| Central Ministry | NITI Aayog / Ministry of Rural Development — national oversight |
| State Government | State Project Director — approves verified proposals, state-level monitoring |
| District Authority | District Collector & Magistrate — field verification of proposals |
| PWD Agency | Engineering cell — creates and submits project proposals |
| Land Acquisition Officer | LAO — manages awards, compensation disbursement |
| R&R Officer | Rehabilitation & Resettlement officer — manages affected families |
| System Admin | IT administrator — user management, audit, system health |

---

## 2. Technology Stack

### Frontend
| Category | Technology |
|----------|-----------|
| Framework | React 19 with TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Charts | Recharts |
| Maps | Leaflet (react-leaflet) |
| Offline Storage | IndexedDB via Dexie |
| PWA | vite-plugin-pwa with Workbox |
| State Management | React Context API + hooks |
| API Client | Custom fetch-based service with localStorage fallback |

### Backend
| Category | Technology |
|----------|-----------|
| Primary Server | Zero-dependency Python HTTP server (`server.py`) — no pip install needed |
| Optional Server | FastAPI with Swagger UI (`app.py`) — requires `pip install` |
| Language | Python 3.12+ |
| Data Format | JSON (runtime) + CSV (exchange) + SQL (schema) |
| ML Engine | Pure Python weighted scoring model (`ml_engine.py`) |

### Data Persistence
- **Backend**: JSON files loaded into memory, changes persisted back to disk
- **Frontend fallback**: localStorage with seeded mock data
- **Offline**: IndexedDB (Dexie) for sync queue
- **SQL schema**: Provided in `dataset/sql/` for relational database migration

---

## 3. Frontend Architecture & Features

### Application Structure

The frontend is a Single Page Application (SPA) built with React Router patterns. The root `App.tsx` manages authentication state, role-based route guarding, and layout composition.

```
src/
├── App.tsx                    # Root component, auth gate, route definitions
├── main.tsx                   # Entry point, renders App
├── index.css                  # Tailwind directives + global styles
├── auth/AuthContext.tsx       # Authentication context provider
├── config/navigation.ts       # Sidebar navigation config with role permissions
├── data/mockData.ts           # Seed data + local risk prediction fallback
├── services/apiService.ts     # API client with localStorage fallback
├── types/index.ts             # All TypeScript type definitions
├── utils/
│   ├── exportUtils.ts         # CSV/PDF export utilities
│   └── statusStyles.ts        # Status badge color/style mappings
├── components/
│   ├── layout/
│   │   ├── Layout.tsx         # Main layout shell
│   │   ├── Header.tsx         # Top bar with user info, notifications, sync
│   │   └── Sidebar.tsx        # Role-filtered navigation sidebar
│   └── ui/index.tsx           # Reusable UI components (Card, Badge, Modal, etc.)
└── pages/
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── ProjectsPage.tsx
    ├── ProjectDetailPage.tsx
    ├── ProposalsPage.tsx
    ├── LandParcelsPage.tsx
    ├── GisPage.tsx
    ├── CompensationPage.tsx
    ├── PossessionPage.tsx
    ├── FamiliesPage.tsx
    ├── RehabilitationPage.tsx
    ├── NotificationsPage.tsx
    ├── AwardsPage.tsx
    ├── AlertsPage.tsx
    ├── WorkflowPage.tsx
    ├── SyncQueuePage.tsx
    ├── ReportsPage.tsx
    ├── DocumentsPage.tsx
    ├── AnalyticsPage.tsx
    └── admin/
        ├── AdminUsersPage.tsx
        ├── AdminRolesPage.tsx
        ├── AdminAuditPage.tsx
        ├── AdminHealthPage.tsx
        ├── AdminPwaPage.tsx
        └── AdminSettingsPage.tsx
```

### Pages & Routes

| Page | Route | Purpose | Roles |
|------|-------|---------|-------|
| Login | `/login` | Email/password authentication | All |
| Executive Dashboard | `/dashboard` | KPI overview, alerts, recent activity | All |
| Projects | `/projects` | List/filter all land acquisition projects | All (filtered by role) |
| Project Detail | `/projects/:id` | Full project profile with tabs for parcels, awards, compensation, families, milestones, documents, timeline | All |
| Proposals | `/proposals` | Create, submit, verify, approve, reject, send-back proposals | PWD, District, State |
| Land Parcels | `/parcels` | Cadastral parcel inventory with survey details | PWD, LAO, District |
| GIS Map | `/gis` | Interactive Leaflet map of project parcels | All |
| Compensation | `/compensation` | Award determination and disbursement tracking | LAO, Central, State |
| Possession | `/possession` | Physical possession status and scheduling | PWD, LAO, District |
| Affected Families | `/families` | Socio-economic census of affected families | R&R, LAO |
| Rehabilitation | `/rehabilitation` | R&R benefit tracking and resettlement status | R&R |
| Statutory Notifications | `/notifications` | S1/S2/S3 gazette notification management | PWD, District, State |
| Awards | `/awards` | LAO award declarations per project | LAO, District |
| SLA Alerts | `/alerts` | Bottleneck alerts when milestones breach SLA | All |
| Workflow Tasks | `/workflow` | Inter-departmental task assignment and tracking | All |
| Sync Queue | `/sync` | Offline transaction queue management | Admin, PWD |
| Reports | `/reports` | Exportable reports (CSV/PDF) | Central, State, Admin |
| Documents | `/documents` | Document management with version control | All |
| Analytics | `/analytics` | Executive analytics with charts | Central, State |
| Admin: Users | `/admin/users` | User directory and management | Admin |
| Admin: Roles | `/admin/roles` | Role permission matrix viewer | Admin |
| Admin: Audit | `/admin/audit` | Compliance audit log viewer | Admin |
| Admin: Health | `/admin/health` | System health and API connectivity check | Admin |
| Admin: PWA | `/admin/pwa` | PWA/offline status and sync diagnostics | Admin |
| Admin: Settings | `/admin/settings` | System configuration | Admin |

### Role-Based Access Control

The navigation config (`src/config/navigation.ts`) defines which sidebar items are visible to each role. The `AuthContext` manages the current user session and the `Layout` component filters navigation items accordingly. Route-level guards in `App.tsx` prevent unauthorized page access.

**7 Roles and their key permissions:**

| Role ID | Can Create Proposal | Can Verify | Can Approve | Can Manage Compensation | Can Manage R&R | Admin Access |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| `central_ministry` | — | — | — | View | View | — |
| `state_gov` | — | — | ✓ | View | View | — |
| `district_authority` | — | ✓ | — | View | View | — |
| `pwd_agency` | ✓ | — | — | — | — | — |
| `land_acquisition_officer` | — | — | — | ✓ | View | — |
| `rr_officer` | — | — | — | — | ✓ | — |
| `system_admin` | — | — | — | — | — | ✓ |

### Authentication

- Login via `LoginPage` with email and password
- Backend endpoint: `POST /api/auth/login` (validates against `users.json`)
- Frontend fallback: validates against `DEMO_USERS` in `mockData.ts`
- Session stored in `sessionStorage` as `nlams_user`
- API calls include `X-User-Name` and `X-User-Role` headers for audit attribution
- No external auth provider — uses internal user directory

### Offline-First PWA Design

- **Service Worker**: Generated by `vite-plugin-pwa` with Workbox — caches all static assets for offline access
- **IndexedDB**: Uses Dexie for the offline sync queue — transactions created offline are stored locally and synced when connectivity returns
- **Sync Queue Page**: Admins and PWD officers can view pending offline transactions, retry sync, or clear the queue
- **Manifest**: PWA manifest (`public/manifest.webmanifest`) with app icons (192px and 512px), theme color, and standalone display mode
- **API Fallback**: Every API call in `apiService.ts` attempts the backend first; if unreachable, it falls back to localStorage-stored mock data — ensuring the app is fully functional even without the backend running

### API Service Layer (`src/services/apiService.ts`)

The `ApiService` object is the single data access point for the entire frontend. Its design pattern:

1. **Try backend** — `fetchFromApi<T>()` sends a request to `VITE_API_URL` with actor headers
2. **On failure, use local state** — each method has a localStorage-backed fallback seeded from `mockData.ts`
3. **Write-through** — mutations (create, update, submit, verify, etc.) write to both the API (if available) and local storage simultaneously

This dual-mode design means:
- With backend running: data persists server-side in JSON files
- Without backend: data persists in browser localStorage across sessions
- Transition is seamless — the app never shows an error if the backend is down

**Local storage keys:**
| Key | Content |
|-----|---------|
| `nlams_proposals_store` | Proposals list |
| `nlams_notifs_store` | System notifications |
| `nlams_projects_store` | Projects list |
| `nlams_docs_store` | Documents |
| `nlams_audit_store` | Audit logs |
| `nlams_user` (session) | Current user session |

### UI Components (`src/components/ui/index.tsx`)

Reusable components including:
- `Card` — content container with header/body/footer slots
- `Badge` — status pill with color variants (success, warning, error, info, neutral)
- `Modal` — dialog overlay with backdrop
- `Button` — primary/secondary/ghost/danger variants
- `ProgressBar` — linear progress indicator
- `StatCard` — dashboard KPI card with icon and trend
- `Table` — data table with sortable headers
- `Tabs` — tabbed navigation for detail pages
- `EmptyState` — placeholder for empty lists

### Charts & Analytics

The `AnalyticsPage` uses **Recharts** to render:
- Bar charts: state-wise project distribution
- Pie charts: project status breakdown, risk level distribution
- Line charts: acquisition progress over time
- Area charts: compensation disbursement trends

### GIS Mapping

The `GisPage` uses **react-leaflet** to render an interactive map showing:
- Project boundaries as polygons
- Individual land parcels as markers
- Color-coded by acquisition status
- Popup details with survey number, owner, area, and compensation status

---

## 4. Backend Architecture & API

### Dual Server Design

The backend offers two interchangeable server options, both serving the same API on port 8000:

#### Option A: Zero-Dependency Server (`server.py`)
- Pure Python standard library only — no `pip install` required
- Uses `http.server.BaseHTTPRequestHandler`
- Ideal for quick demos and environments without package management
- Run: `python backend/server.py 8000`

#### Option B: FastAPI Server (`app.py`)
- Full FastAPI with Pydantic models and automatic Swagger/OpenAPI docs
- Interactive API documentation at `http://localhost:8000/docs`
- Requires: `pip install -r backend/requirements.txt`
- Run: `python backend/app.py`

### Data Loader (`backend/data_loader.py`)

The data loader is the persistence engine:

1. On startup, loads all JSON files from `dataset/json/` into in-memory dictionaries
2. Serves all GET requests from memory (fast, no disk I/O per request)
3. On mutations (POST/PUT/DELETE), updates the in-memory store **and** writes the entire affected JSON file back to disk
4. Provides filter functions for query parameters (state, district, type, stage, status, risk, search)

**Data files managed:**
- `projects.json`, `proposals.json`, `land_parcels.json`
- `notifications.json`, `system_notifications.json`
- `awards.json`, `compensation_records.json`
- `affected_families.json`, `milestones.json`
- `alerts.json`, `workflow_tasks.json`
- `documents.json`, `audit_logs.json`
- `sync_queue.json`, `users.json`, `risk_predictions.json`

### Proposals Workflow State Machine

The proposals module implements a multi-stage government approval workflow:

```
                        ┌──────────┐
                        │  DRAFT   │ ← PWD creates (not submitted)
                        └────┬─────┘
                             │ submit
                             ▼
                        ┌──────────┐
              ┌─────────│SUBMITTED │
              │         └────┬─────┘
              │              │ verify (District Authority)
              │   send back  ▼
              │    ┌─────────────────┐
              │    │UNDER_VERIFICATION│
              │    └────────┬────────┘
              │             │ forward to state
              │             ▼
              │    ┌──────────────────┐
              │    │  UNDER_SCRUTINY   │
              │    └────────┬─────────┘
              │             │
              │     ┌───────┼────────┐
              │     │       │        │
              │  send back  │     reject
              │     │       │        │
              │     ▼       ▼        ▼
              │  ┌──────┐ ┌──────┐ ┌─────────┐
              │  │SENT  │ │APPROV│ │REJECTED │
              │  │BACK  │ │ED    │ │         │
              │  └──┬───┘ └──┬───┘ └─────────┘
              │     │        │
              └─────┘        │ creates Project
                             ▼
                        ┌──────────┐
                        │ PROJECT   │ → Notification → Award →
                        │ CREATED   │   Compensation → Possession →
                        └──────────┘   R&R → Completion
```

**Workflow actions and who can perform them:**

| Action | From Status | To Status | Role |
|--------|-------------|-----------|------|
| Create (draft) | — | DRAFT | pwd_agency |
| Submit | DRAFT / SENT_BACK | SUBMITTED | pwd_agency |
| Verify | SUBMITTED | UNDER_SCRUTINY | district_authority |
| Send Back | SUBMITTED / UNDER_VERIFICATION | SENT_BACK | district_authority |
| Reject | UNDER_SCRUTINY | REJECTED | state_gov |
| Approve | UNDER_SCRUTINY | APPROVED | state_gov |

When a proposal is **approved**, the backend automatically:
1. Creates a new `Project` record with a generated ID (PRJ-NNN)
2. Seeds initial project metadata from the proposal (land required, cost, agency, location)
3. Generates a **system notification** to the PWD agency
4. Logs an **audit entry**

### Notification System

System notifications are role-targeted messages that appear in the header bell icon and the notifications panel. Each notification includes:

- `recipientRole` — which role should see it
- `recipientEmail` — (optional) specific user email
- `targetModule` — which module the notification relates to (proposals, projects, compensation, etc.)
- `targetId` — the specific record ID
- `type` — `info`, `warning`, `error`, `success`
- `isRead` — read/unread state

Notifications are generated automatically on workflow transitions (submit, verify, send-back, approve, reject) and on SLA threshold breaches.

### Audit Logging

Every state-changing action is recorded in the audit log:

| Field | Description |
|-------|-------------|
| `id` | Auto-generated (AUD-NNNNN) |
| `timestamp` | DD-Mon-YYYY HH:MM |
| `user` | Name of the actor |
| `role` | Role of the actor |
| `module` | Affected module (Proposals, Projects, Documents, etc.) |
| `action` | CREATE, UPDATE, SUBMIT, VERIFY, APPROVE, REJECT, SEND_BACK, UPLOAD, SYNC |
| `recordId` | ID of the affected record |
| `description` | Human-readable description |
| `origin` | ONLINE or OFFLINE |
| `syncTimestamp` | When an offline action was synced (null if online) |

---

## 5. Data Layer & Dataset

### Dataset Structure

The `dataset/` directory contains three representations of the same data:

```
dataset/
├── json/          ← Runtime data (loaded by backend into memory)
│   ├── projects.json
│   ├── proposals.json
│   ├── land_parcels.json
│   ├── notifications.json
│   ├── system_notifications.json
│   ├── awards.json
│   ├── compensation_records.json
│   ├── affected_families.json
│   ├── milestones.json
│   ├── alerts.json
│   ├── workflow_tasks.json
│   ├── documents.json
│   ├── audit_logs.json
│   ├── sync_queue.json
│   ├── users.json
│   └── risk_predictions.json
├── csv/           ← Data exchange format (for import/export)
│   ├── projects.csv
│   ├── affected_families.csv
│   ├── alerts.csv
│   ├── audit_logs.csv
│   ├── awards.csv
│   ├── compensation_records.csv
│   ├── documents.csv
│   ├── land_parcels.csv
│   ├── milestones.csv
│   ├── ml_risk_training_data.csv
│   ├── notifications.csv
│   ├── sync_queue.csv
│   ├── users.csv
│   └── workflow_tasks.csv
├── sql/           ← Relational schema (for DB migration)
│   ├── nlams_schema.sql       ← Table definitions, constraints, indexes
│   └── nlams_seed_data.sql    ← INSERT statements for seed data
├── raw_user_input.csv    ← Original hackathon-provided input
├── generate_dataset.ps1  ← PowerShell script to generate JSON from CSV
├── match_and_enrich_dataset.ps1  ← Enrichment script
└── README.md
```

### Data Entities

| Entity | JSON File | Description | Key Fields |
|--------|-----------|-------------|------------|
| Project | `projects.json` | Land acquisition project | id, name, agency, state, district, type, landRequired, landAcquired, acquisitionPct, compensationPct, possessionPct, rrPct, status, stage, risk, riskScore, estimatedCost |
| Proposal | `proposals.json` | Pre-project approval request | id, projectName, submittedBy, department, agency, projectType, state, district, landRequired, estimatedCost, purpose, status, currentStage, assignedRole, timeline[], documents[] |
| Land Parcel | `land_parcels.json` | Individual cadastral plot | id, projectId, surveyNo, village, area, coordinates, ownerName, ownershipType, acquisitionStatus, awardAmount |
| Statutory Notification | `notifications.json` | S1/S2/S3 gazette notice | id, projectId, type, issueDate, responsePeriod, status |
| System Notification | `system_notifications.json` | In-app role-targeted alert | id, title, message, type, recipientRole, targetModule, targetId, isRead |
| Award | `awards.json` | LAO compensation declaration | id, projectId, awardNo, date, totalAmount, beneficiaries |
| Compensation Record | `compensation_records.json` | Individual disbursement | id, projectId, beneficiaryName, amount, bankAccount, status, date |
| Affected Family | `affected_families.json` | Socio-economic census record | id, projectId, familyHead, members, category, displacementStatus, rrBenefits |
| Milestone | `milestones.json` | Project timeline checkpoint | id, projectId, name, plannedDate, actualDate, status, delayDays |
| Alert | `alerts.json` | SLA bottleneck alert | id, projectId, type, severity, message, raisedDate |
| Workflow Task | `workflow_tasks.json` | Inter-departmental task | id, projectId, department, task, assignedTo, status, dueDate |
| Document | `documents.json` | Uploaded file metadata | id, projectId, category, fileName, uploadedBy, uploadDate, version, status |
| Audit Log | `audit_logs.json` | Compliance trail | id, timestamp, user, role, module, action, recordId, description, origin |
| Sync Queue | `sync_queue.json` | Offline transaction queue | id, type, payload, status, createdDate, syncDate |
| User | `users.json` | System user directory | id, name, email, role, department, phone, active |
| Risk Prediction | `risk_predictions.json` | ML model output history | id, projectId, input, output, timestamp |

### Seed Data Note

All data in the dataset is **fictional and synthetically generated** for hackathon demonstration purposes. No real citizen names, bank account numbers, or land records are used. The data models real-world structures and relationships but contains entirely imaginary content.

### SQL Schema (`dataset/sql/nlams_schema.sql`)

A full relational database schema is provided with:
- Tables for all 16 entities with primary/foreign keys
- Constraints (NOT NULL, CHECK, UNIQUE)
- Indexes on frequently queried columns (state, district, status, projectId)
- Enum-like constraints for status fields

This enables migration to PostgreSQL/MySQL for production deployment.

---

## 6. ML Risk Prediction Engine

### Overview

The ML engine (`backend/ml_engine.py`) implements a **composite weighted scoring model** that evaluates project delay risk based on 7 statutory and execution parameters. The model produces a risk score (0–100), a risk classification, and actionable recommendations.

### Input Parameters

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `land_acquisition_percentage` | float | 0–100 | Percentage of required land acquired |
| `pending_parcels` | int | 0+ | Number of parcels not yet acquired |
| `disputed_parcels` | int | 0+ | Parcels with ownership/legal disputes |
| `compensation_pending_percentage` | float | 0–100 | Percentage of compensation not yet disbursed |
| `approval_delay_days` | int | 0+ | Days beyond statutory limit for approvals |
| `possession_delay_days` | int | 0+ | Days beyond planned possession date |
| `rr_pending_percentage` | float | 0–100 | Percentage of R&R benefits pending |

### Scoring Algorithm

```
acq_gap = 100 - land_acquisition_percentage         # Gap in acquisition
parcel_risk = min(40, pending×0.5 + disputed×1.5)   # Max 40 points
comp_risk = min(25, comp_pending×0.5)                # Max 25 points
delay_risk = min(20, approval_delay×0.3 + possession_delay×0.2)  # Max 20
rr_risk = min(15, rr_pending×0.3)                    # Max 15 points

raw_score = parcel_risk + comp_risk + delay_risk + rr_risk + (acq_gap × 0.1)
score = min(100, round(raw_score))
```

### Risk Classification

| Score | Level | Recommendation Summary |
|-------|-------|----------------------|
| 80–100 | **CRITICAL** | Immediate high-level escalation; expedite SLA clearances; fast-track compensation via special camps; resolve disputes through lok-adalat |
| 60–79 | **HIGH** | Prioritize compensation bottlenecks; district-level joint revenue verification; deploy additional survey units |
| 35–59 | **MEDIUM** | Proactive monitoring of revenue records; schedule timely possession surveys; address compensation delays |
| 0–34 | **LOW** | Project within optimal parameters; routine milestone tracking |

### API Usage

**Request:**
```http
POST /api/predict-risk
Content-Type: application/json

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
  "recommendation": "Prioritize compensation sanction bottlenecks...",
  "factors": [
    {"name": "Compensation Pending", "value": "65.1%", "weight": 25},
    {"name": "Land Disputes", "value": "1 parcels", "weight": 2},
    {"name": "Possession Delay", "value": "20 days", "weight": 4},
    {"name": "R&R Pending", "value": "85.0%", "weight": 15},
    {"name": "Approval Delays", "value": "35 days", "weight": 11}
  ]
}
```

### Frontend Integration

The frontend `ApiService.predictRisk()` method:
1. Sends the input to `POST /api/predict-risk`
2. If backend is unreachable, falls back to a local TypeScript implementation of the same algorithm (`localPredictRisk` in `mockData.ts`)
3. Results are displayed with a gauge chart, factor breakdown bars, and the recommendation text

---

## 7. Installation, Setup & Usage

### Prerequisites

- **Node.js** 18+ and npm (for frontend)
- **Python** 3.12+ (for backend)
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Backend Setup

#### Option A: Zero-Dependency Server (Recommended — runs instantly)

```bash
python backend/server.py 8000
```

Or on Windows:
```powershell
# Double-click or run:
backend\run_backend.bat
# Or via PowerShell:
backend\run_backend.ps1
```

No pip install needed — uses only Python standard library.

#### Option B: FastAPI with Swagger UI

```bash
pip install -r backend/requirements.txt
python backend/app.py
```

Then open `http://localhost:8000/docs` for interactive API documentation.

### Environment Configuration

| Variable | Location | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | `.env` | `http://localhost:8000/api` | Backend API base URL |

The frontend automatically falls back to localStorage mock data if the backend is not running, so the app works standalone.

### Running Both Together

1. Start the backend: `python backend/server.py 8000`
2. Start the frontend: `npm run dev`
3. Open `http://localhost:5173` in your browser
4. Log in with any demo credential (see below)

### PWA Installation

The app is installable as a Progressive Web App:
1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. The app installs as a standalone application with offline support

### Backend Tests

```bash
# API endpoint tests
python backend/test_api.py

# Full workflow integration test
python backend/test_full_workflow.py
```

---

## 8. File Structure

```
NLAMS/
│
├── README.md                          # Original project README
├── PROJECT_DOCUMENTATION.md           # This file
├── package.json                       # Frontend dependencies and scripts
├── package-lock.json                  # Locked dependency versions
├── vite.config.ts                     # Vite build configuration
├── tsconfig.json                      # TypeScript config (root)
├── tsconfig.app.json                  # TypeScript config (app)
├── tsconfig.node.json                 # TypeScript config (node)
├── tailwind.config.js                 # Tailwind CSS configuration
├── postcss.config.js                  # PostCSS configuration
├── eslint.config.js                   # ESLint configuration
├── index.html                         # HTML entry point
├── .env                               # Environment variables
├── .gitignore                         # Git ignore rules
│
├── .bolt/                             # Bolt configuration
│   ├── config.json
│   └── prompt
│
├── public/                            # Static assets
│   ├── favicon.svg
│   ├── icon-192.png                   # PWA icon (small)
│   └── icon-512.png                   # PWA icon (large)
│
├── dist/                              # Production build output
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js                          # Service worker
│   ├── registerSW.js
│   ├── _redirects
│   ├── favicon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── workbox-*.js                   # Workbox runtime
│   └── assets/
│       ├── index-*.js                 # Bundled JavaScript
│       └── index-*.css                # Bundled CSS
│
├── src/                               # Frontend source code
│   ├── App.tsx                        # Root component
│   ├── main.tsx                       # Entry point
│   ├── index.css                      # Global styles
│   ├── vite-env.d.ts                  # Vite type declarations
│   ├── auth/
│   │   └── AuthContext.tsx            # Auth provider
│   ├── config/
│   │   └── navigation.ts              # Sidebar nav config
│   ├── data/
│   │   └── mockData.ts                # Seed data + local fallbacks
│   ├── services/
│   │   └── apiService.ts              # API client with fallback
│   ├── types/
│   │   └── index.ts                   # TypeScript types
│   ├── utils/
│   │   ├── exportUtils.ts             # CSV/PDF export
│   │   └── statusStyles.ts            # Status badge styles
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       └── index.tsx              # Reusable UI components
│   └── pages/
│       ├── LoginPage.tsx
│       ├── DashboardPage.tsx
│       ├── ProjectsPage.tsx
│       ├── ProjectDetailPage.tsx
│       ├── ProposalsPage.tsx
│       ├── LandParcelsPage.tsx
│       ├── GisPage.tsx
│       ├── CompensationPage.tsx
│       ├── PossessionPage.tsx
│       ├── FamiliesPage.tsx
│       ├── RehabilitationPage.tsx
│       ├── NotificationsPage.tsx
│       ├── AwardsPage.tsx
│       ├── AlertsPage.tsx
│       ├── WorkflowPage.tsx
│       ├── SyncQueuePage.tsx
│       ├── ReportsPage.tsx
│       ├── DocumentsPage.tsx
│       ├── AnalyticsPage.tsx
│       └── admin/
│           ├── AdminUsersPage.tsx
│           ├── AdminRolesPage.tsx
│           ├── AdminAuditPage.tsx
│           ├── AdminHealthPage.tsx
│           ├── AdminPwaPage.tsx
│           └── AdminSettingsPage.tsx
│
├── backend/                           # Python backend
│   ├── server.py                      # Zero-dependency HTTP server
│   ├── app.py                         # FastAPI server with Swagger
│   ├── data_loader.py                 # JSON data persistence engine
│   ├── database.py                    # Database connection utilities
│   ├── ml_engine.py                   # ML risk prediction model
│   ├── requirements.txt               # Python dependencies (FastAPI only)
│   ├── run_backend.bat                # Windows quick-start
│   ├── run_backend.ps1                # PowerShell quick-start
│   ├── test_api.py                    # API endpoint tests
│   ├── test_full_workflow.py          # Integration tests
│   ├── README.md                      # Backend-specific docs
│   └── __pycache__/                   # Compiled Python
│
└── dataset/                           # Data layer
    ├── json/                          # Runtime JSON (16 files)
    ├── csv/                           # CSV exchange format (14 files)
    ├── sql/                           # SQL schema + seed
    ├── raw_user_input.csv             # Original hackathon input
    ├── generate_dataset.ps1           # Dataset generation script
    ├── match_and_enrich_dataset.ps1   # Dataset enrichment script
    └── README.md                      # Dataset documentation
```

---

## 9. Demo Credentials

All passwords are `demo@123`.

| Role | Email | Name |
|------|-------|------|
| Central Ministry | `central@nlams.gov.in` | Rajesh Kumar |
| State Government | `state@nlams.gov.in` | Anjali Mehta |
| District Authority | `district@nlams.gov.in` | Ramesh Iyer |
| PWD Agency | `pwd@nlams.gov.in` | Kavya Krishnan |
| Land Acquisition Officer | `lao@nlams.gov.in` | Suresh Babu |
| R&R Officer | `rr@nlams.gov.in` | Lakshmi Narayanan |
| System Admin | `admin@nlams.gov.in` | Vikram Singh |

---

## 10. API Endpoint Reference

All endpoints are prefixed with `/api`. Base URL: `http://localhost:8000/api`

### System & Analytics

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| GET | `/health` | — | System status and dataset stats |
| GET | `/analytics` | — | Executive dashboard KPIs, state breakdowns, SLA risk counts |

### Proposals

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| GET | `/proposals` | `?status&role&userEmail&state&district&search` | List/filter proposals |
| GET | `/proposals/:id` | — | Get single proposal with timeline |
| POST | `/proposals` | Body: Partial<Proposal> | Create new proposal (draft or submitted) |
| PUT | `/proposals/:id` | Body: Partial<Proposal> | Update proposal fields |
| POST | `/proposals/:id/submit` | Body: `{notes?}` | Submit draft/resubmit sent-back proposal |
| POST | `/proposals/:id/verify` | Body: `{notes?}` | District Authority verifies proposal |
| POST | `/proposals/:id/send-back` | Body: `{reason}` | Send back to PWD for clarification |
| POST | `/proposals/:id/reject` | Body: `{reason}` | Reject proposal (State Gov) |
| POST | `/proposals/:id/approve` | Body: `{notes?}` | Approve proposal, auto-creates Project |

### Projects

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| GET | `/projects` | `?state&district&type&stage&status&risk&search` | List/filter projects |
| GET | `/projects/:id` | — | Full project detail with linked entities |
| POST | `/projects` | Body: Partial<Project> | Create project manually |

### Cadastral & Statutory Data

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| GET | `/parcels` | `?projectId` | Land parcel dataset with coordinates |
| GET | `/notifications` | `?projectId` | Statutory gazette notifications |
| GET | `/awards` | `?projectId` | LAO award declarations |
| GET | `/compensation` | `?projectId` | Compensation disbursement records |
| GET | `/families` | `?projectId` | Affected family census records |
| GET | `/milestones` | `?projectId` | Project milestones with delay metrics |
| GET | `/alerts` | `?projectId` | SLA bottleneck alerts |
| GET | `/workflow` | `?projectId` | Inter-departmental workflow tasks |
| GET | `/documents` | `?projectId` | Document metadata |
| GET | `/system-notifications` | `?role&email` | In-app role-targeted notifications |

### Document Upload

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| POST | `/documents` | Body: `{projectId, category, fileName, ...}` | Upload document metadata |

### Notifications

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| POST | `/notifications/:id/read` | — | Mark single notification as read |
| POST | `/notifications/read-all` | Body: `{role?, email?}` | Mark all as read |

### Audit & Sync

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| GET | `/audit` | — | Compliance audit logs |
| POST | `/audit` | Body: `{action, module, recordId, description}` | Create audit entry |
| GET | `/sync` | — | Offline PWA sync queue |
| GET | `/users` | — | Administrative user directory |

### ML Risk Prediction

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/predict-risk` | `{land_acquisition_percentage, pending_parcels, disputed_parcels, compensation_pending_percentage, approval_delay_days, possession_delay_days, rr_pending_percentage}` | Compute risk score, level, and recommendations |

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | `{email, password}` | Authenticate and return token + user |

---

*NLAMS — National Land Acquisition Management System. Built for Smart India Hackathon 2026 (SIH 20016). All data is fictional and for demonstration purposes only.*
