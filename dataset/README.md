# NLAMS Dataset Documentation (SIH 20016)

Comprehensive multi-format dataset package (JSON, CSV, SQL) for the **National Land Acquisition Management System (NLAMS)**.

---

## 1. Directory Structure

```
dataset/
├── README.md                          # Comprehensive Dataset Documentation & Data Dictionary
├── generate_dataset.ps1               # Automated Scalable PowerShell Dataset Generator
├── json/                              # JSON Collections
│   ├── projects.json                  # Infrastructure Projects (29 records)
│   ├── land_parcels.json              # GIS Cadastral Land Parcels (169 records)
│   ├── notifications.json             # Statutory Gazette Notifications (72 records)
│   ├── awards.json                    # Land Acquisition Awards & Valuations (37 records)
│   ├── compensation_records.json      # Financial & Beneficiary Payments (119 records)
│   ├── affected_families.json         # R&R Socio-Economic Census (196 records)
│   ├── milestones.json                # Project Timelines & Delays (261 records)
│   ├── alerts.json                    # SLA & Bottleneck Alerts (24 records)
│   ├── workflow_tasks.json            # Inter-Departmental Tasks (29 records)
│   ├── documents.json                 # DMS File Metadata (115 records)
│   ├── audit_logs.json                # Compliance Audit Trail (100 records)
│   ├── sync_queue.json                # Offline PWA Sync Log (25 records)
│   ├── users.json                     # RBAC Users (10 records)
│   └── risk_predictions.json         # Risk Engine Analysis Output (29 records)
├── csv/                               # Tabular CSVs (for Pandas, Scikit-learn, Excel, GIS)
│   ├── projects.csv
│   ├── land_parcels.csv
│   ├── notifications.csv
│   ├── awards.csv
│   ├── compensation_records.csv
│   ├── affected_families.csv
│   ├── milestones.csv
│   ├── alerts.csv
│   ├── workflow_tasks.csv
│   ├── documents.csv
│   ├── audit_logs.csv
│   ├── sync_queue.csv
│   ├── users.csv
│   └── ml_risk_training_data.csv      # Formatted 7-feature ML Dataset
└── sql/                               # Relational Database Scripts
    ├── nlams_schema.sql               # PostgreSQL / MySQL / SQLite DDL with FKs & Indexes
    └── nlams_seed_data.sql            # Ready-to-execute SQL INSERT statements
```

---

## 2. Entity Schemas & Data Dictionary

### 2.1 Projects (`projects.json` / `projects.csv`)
Master project directory covering major infrastructure sectors across 8 Indian states.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key (e.g. `PWD-TN-2026-001`) |
| `name` | `VARCHAR(255)` | Full project name |
| `agency` | `VARCHAR(128)` | Executing agency (NHAI, State PWD, DFCCIL, etc.) |
| `state` | `VARCHAR(64)` | State name |
| `district` | `VARCHAR(64)` | Target district |
| `type` | `VARCHAR(64)` | Project Type (`Highways`, `Railways`, `Irrigation`, `Industrial Corridor`, `Urban Development`, `Renewable Energy`, `Public Infrastructure`, `Other`) |
| `landRequired` | `NUMERIC` | Land required in hectares |
| `landAcquired` | `NUMERIC` | Land acquired in hectares |
| `landNotified` | `NUMERIC` | Land notified under preliminary gazette (ha) |
| `acquisitionPct` | `NUMERIC` | Acquisition progress percentage ($0-100\%$) |
| `compensationPct` | `NUMERIC` | Compensation progress percentage ($0-100\%$) |
| `possessionPct` | `NUMERIC` | Physical possession handover percentage ($0-100\%$) |
| `rrPct` | `NUMERIC` | R&R resettlement percentage ($0-100\%$) |
| `status` | `VARCHAR(64)` | Project status (`Submitted`, `Under Scrutiny`, `Approved`, `Notification Issued`, `Award Declared`, `Compensation Pending`, `Compensation Completed`, `Possession Pending`, `Possession Completed`, `R&R In Progress`, `Completed`, `Delayed`) |
| `stage` | `VARCHAR(64)` | Active lifecycle stage (`Proposal`, `Scrutiny`, `Approval`, `Notification`, `Award`, `Compensation`, `Possession`, `R&R`, `Completion`) |
| `targetDate` | `DATE` | Scheduled target completion date (`YYYY-MM-DD`) |
| `estimatedCost` | `NUMERIC` | Total sanctioned budget in ₹ Lakhs |
| `risk` | `VARCHAR(16)` | AI Risk Category (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `riskScore` | `INTEGER` | Computed risk score ($0-100$) |
| `affectedFamilies` | `INTEGER` | Count of project-affected families (PAFs) |
| `displacedFamilies` | `INTEGER` | Count of physically displaced families (PDFs) |
| `compensationAssessed`| `NUMERIC`| Total assessed compensation in ₹ Lakhs |
| `compensationDisbursed`| `NUMERIC`| Total disbursed compensation in ₹ Lakhs |

---

### 2.2 Land Parcels (`land_parcels.json` / `land_parcels.csv`)
Spatial cadastral land parcel directory with GPS coordinates and title classifications.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key (e.g. `LP-0001-TN`) |
| `projectId` | `VARCHAR(64)` | Foreign Key $\rightarrow$ `projects.id` |
| `surveyNumber` | `VARCHAR(64)` | Cadastral survey number (e.g. `142/3A`) |
| `village` | `VARCHAR(128)` | Revenue village |
| `taluk` | `VARCHAR(128)` | Revenue taluk / sub-division |
| `district` | `VARCHAR(64)` | District |
| `state` | `VARCHAR(64)` | State |
| `area` | `NUMERIC` | Area in hectares |
| `landType` | `VARCHAR(64)` | Land classification (`Wetland`, `Dry Land`, `Garden Land`, `Poramboke`, `Residential`, `Commercial`) |
| `ownershipType` | `VARCHAR(64)` | Title tenure (`Private Patta`, `Government`, `Inam`, `Temple Land`, `Assigned`, `Wakf`) |
| `lat` / `lng` | `NUMERIC` | GIS Latitude & Longitude decimal coordinates |
| `acquisitionStatus` | `VARCHAR(64)` | `Proposed`, `Notified`, `Acquired`, `Disputed`, `Pending` |
| `compensationStatus` | `VARCHAR(64)` | `Not Started`, `Assessed`, `Approved`, `Partially Paid`, `Fully Paid` |
| `possessionStatus` | `VARCHAR(64)` | `Pending`, `Scheduled`, `Taken`, `Handover Completed` |
| `rrStatus` | `VARCHAR(64)` | `Not Started`, `Eligible`, `In Progress`, `Completed`, `Disputed` |
| `ownerCount` | `INTEGER` | Number of registered owners |

---

### 2.3 Notifications (`notifications.json` / `notifications.csv`)
Statutory Gazette notifications issued under the RFCTLARR Act 2013 (Section 11, 19, etc.).

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key (`NOT-0001`) |
| `projectId` | `VARCHAR(64)` | Foreign Key $\rightarrow$ `projects.id` |
| `projectName` | `VARCHAR(255)` | Name of associated project |
| `type` | `VARCHAR(128)` | `Preliminary Notification`, `Declaration`, `Award Notification`, `Possession Notice`, `Other Statutory Notice` |
| `number` | `VARCHAR(128)` | Gazette notification number |
| `issueDate` | `DATE` | Issue date (`YYYY-MM-DD`) |
| `publicationDate` | `DATE` | Official Gazette publication date |
| `status` | `VARCHAR(64)` | `Draft`, `Issued`, `Published`, `Expired` |
| `remarks` | `TEXT` | Legal circulation notes |

---

### 2.4 Awards (`awards.json` / `awards.csv`)
Statutory compensation awards passed by the Competent Authority Land Acquisition (CALA/LAO).

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key (`AWD-0001`) |
| `projectId` | `VARCHAR(64)` | Foreign Key $\rightarrow$ `projects.id` |
| `district` / `village` | `VARCHAR` | Geographic location |
| `surveyNumber` | `VARCHAR(64)` | Covered survey subdivision |
| `awardDate` | `DATE` | Declaration date |
| `landArea` | `NUMERIC` | Area evaluated (ha) |
| `awardAmount` | `NUMERIC` | Total award value in ₹ Lakhs |
| `beneficiaryCount` | `INTEGER` | Number of eligible beneficiaries |
| `status` | `VARCHAR(64)` | `Draft`, `Under Review`, `Approved`, `Declared` |

---

### 2.5 Compensation Records (`compensation_records.json` / `compensation_records.csv`)
Direct Beneficiary Transfer (DBT) payment registry per landowner.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key (`CMP-00001`) |
| `projectId` | `VARCHAR(64)` | Foreign Key $\rightarrow$ `projects.id` |
| `projectName` | `VARCHAR(255)` | Associated project |
| `district` | `VARCHAR(64)` | District |
| `beneficiaryId` | `VARCHAR(64)` | Beneficiary ID (`BEN-10245`) |
| `landArea` | `NUMERIC` | Acquired land area (ha) |
| `assessedAmount` | `NUMERIC` | Assessed entitlement (₹ Lakhs) |
| `approvedAmount` | `NUMERIC` | Sanctioned amount (₹ Lakhs) |
| `paidAmount` | `NUMERIC` | Transferred amount (₹ Lakhs) |
| `paymentDate` | `DATE` | Transfer date |
| `status` | `VARCHAR(64)` | `Assessment Pending`, `Assessed`, `Approved`, `Payment Pending`, `Partially Paid`, `Fully Paid` |

---

### 2.6 Affected Families (`affected_families.json` / `affected_families.csv`)
Socio-economic census for Rehabilitation & Resettlement (R&R) entitlements.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key (`FAM-00001`) |
| `projectId` | `VARCHAR(64)` | Foreign Key $\rightarrow$ `projects.id` |
| `category` | `VARCHAR(64)` | `Title Holder`, `Occupant`, `Tenant`, `Agricultural Labour`, `Artisan`, `Other` |
| `landAffected` | `NUMERIC` | Area affected (ha) |
| `displacementStatus` | `VARCHAR(64)` | `Not Displaced`, `Partially Displaced`, `Fully Displaced` |
| `compensationStatus` | `VARCHAR(64)` | `Not Started`, `Assessed`, `Approved`, `Partially Paid`, `Fully Paid` |
| `rrEligibility` | `BOOLEAN` | Eligible for Second Schedule R&R benefits |
| `rrBenefit` | `VARCHAR(128)` | `Housing Plot`, `Employment`, `Financial Assistance`, `Land Allotment`, `Skill Training`, `Multiple Benefits` |
| `rrStatus` | `VARCHAR(64)` | `Not Started`, `Eligible`, `In Progress`, `Completed`, `Disputed` |

---

### 2.7 Milestones (`milestones.json` / `milestones.csv`)
Statutory lifecycle stages tracking planned vs. actual schedule and delay days.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | Primary Key (`MS-00001`) |
| `projectId` | `VARCHAR(64)` | Foreign Key $\rightarrow$ `projects.id` |
| `stage` | `VARCHAR(64)` | Stage name (`Proposal` $\dots$ `Completion`) |
| `plannedDate` | `DATE` | Target SLA date |
| `actualDate` | `DATE` | Actual completion date |
| `authority` | `VARCHAR(128)` | Designated authority |
| `status` | `VARCHAR(64)` | `Completed`, `In Progress`, `Pending`, `Delayed` |
| `delayDays` | `INTEGER` | Days delayed beyond SLA |
| `remarks` | `TEXT` | Delay cause explanation |

---

### 2.8 Machine Learning Risk Feature Set (`ml_risk_training_data.csv`)

Formatted feature table designed for training regression (Risk Score) and classification (Risk Level) models:

1. `land_acquisition_percentage`: Numeric ($0-100\%$)
2. `pending_parcels`: Integer count of unverified parcels
3. `disputed_parcels`: Integer count of litigated parcels
4. `compensation_pending_percentage`: Numeric ($0-100\%$)
5. `approval_delay_days`: Integer days of cumulative approval delays
6. `possession_delay_days`: Integer days of possession handover delays
7. `rr_pending_percentage`: Numeric ($0-100\%$)
8. **Target 1 (`risk_score`)**: Integer ($0-100$)
9. **Target 2 (`risk_level`)**: Categorical (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
10. **Target 3 (`recommendation`)**: Text mitigation strategy

---

## 3. How to Regenerate or Scale Data

You can re-run the included PowerShell script to regenerate or scale the dataset with a new seed:

```powershell
powershell -ExecutionPolicy Bypass -File .\generate_dataset.ps1 -Seed 100
```
