-- =============================================================================
-- NLAMS (National Land Acquisition Management System) - Relational Schema DDL
-- Supported engines: PostgreSQL, MySQL 8+, SQLite 3
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    role VARCHAR(64) NOT NULL,
    department VARCHAR(128) NOT NULL,
    designation VARCHAR(128) NOT NULL,
    state VARCHAR(64),
    district VARCHAR(64),
    avatar_color VARCHAR(16) DEFAULT '#1e3a5f',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    agency VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    district VARCHAR(64) NOT NULL,
    type VARCHAR(64) NOT NULL,
    land_required NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    land_acquired NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    land_notified NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    acquisition_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    compensation_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    possession_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    rr_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(64) NOT NULL,
    stage VARCHAR(64) NOT NULL,
    target_date DATE NOT NULL,
    estimated_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    risk VARCHAR(16) NOT NULL DEFAULT 'LOW',
    risk_score INTEGER NOT NULL DEFAULT 0,
    affected_families INTEGER NOT NULL DEFAULT 0,
    displaced_families INTEGER NOT NULL DEFAULT 0,
    compensation_assessed NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    compensation_disbursed NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    description TEXT,
    last_updated VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS land_parcels (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    survey_number VARCHAR(64) NOT NULL,
    village VARCHAR(128) NOT NULL,
    taluk VARCHAR(128) NOT NULL,
    district VARCHAR(64) NOT NULL,
    state VARCHAR(64) NOT NULL,
    area NUMERIC(10, 2) NOT NULL,
    land_type VARCHAR(64) NOT NULL,
    ownership_type VARCHAR(64) NOT NULL,
    lat NUMERIC(10, 6),
    lng NUMERIC(10, 6),
    acquisition_status VARCHAR(64) NOT NULL,
    compensation_status VARCHAR(64) NOT NULL,
    possession_status VARCHAR(64) NOT NULL,
    rr_status VARCHAR(64) NOT NULL,
    owner_count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    type VARCHAR(128) NOT NULL,
    number VARCHAR(128) NOT NULL,
    issue_date DATE NOT NULL,
    publication_date DATE NOT NULL,
    status VARCHAR(64) NOT NULL,
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS awards (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    district VARCHAR(64) NOT NULL,
    village VARCHAR(128) NOT NULL,
    survey_number VARCHAR(64) NOT NULL,
    award_date DATE NOT NULL,
    land_area NUMERIC(10, 2) NOT NULL,
    award_amount NUMERIC(14, 2) NOT NULL,
    beneficiary_count INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS compensation_records (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    district VARCHAR(64) NOT NULL,
    beneficiary_id VARCHAR(64) NOT NULL,
    land_area NUMERIC(10, 2) NOT NULL,
    assessed_amount NUMERIC(14, 2) NOT NULL,
    approved_amount NUMERIC(14, 2) NOT NULL,
    paid_amount NUMERIC(14, 2) NOT NULL,
    payment_date DATE,
    status VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS affected_families (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    district VARCHAR(64) NOT NULL,
    village VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    land_affected NUMERIC(10, 2) NOT NULL,
    displacement_status VARCHAR(64) NOT NULL,
    compensation_status VARCHAR(64) NOT NULL,
    rr_eligibility BOOLEAN NOT NULL DEFAULT TRUE,
    rr_benefit VARCHAR(128),
    rr_status VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS milestones (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage VARCHAR(64) NOT NULL,
    planned_date DATE NOT NULL,
    actual_date DATE,
    authority VARCHAR(128) NOT NULL,
    status VARCHAR(64) NOT NULL,
    delay_days INTEGER DEFAULT 0,
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    type VARCHAR(128) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    created_date VARCHAR(32) NOT NULL,
    escalation_level VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_tasks (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    current_stage VARCHAR(64) NOT NULL,
    assigned_to VARCHAR(128) NOT NULL,
    assigned_role VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_date DATE NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(128) NOT NULL,
    upload_date DATE NOT NULL,
    version VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL,
    file_size VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp VARCHAR(32) NOT NULL,
    username VARCHAR(128) NOT NULL,
    role VARCHAR(128) NOT NULL,
    module VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    record_id VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    origin VARCHAR(16) NOT NULL,
    sync_timestamp VARCHAR(32)
);

CREATE INDEX IF NOT EXISTS idx_parcels_project ON land_parcels(project_id);
CREATE INDEX IF NOT EXISTS idx_comp_project ON compensation_records(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_project ON alerts(project_id);