"""
NLAMS (National Land Acquisition Management System) - SQLite Database Helper
Initializes SQLite database from nlams_schema.sql and provides database query helpers.
"""

import sqlite3
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "dataset" / "sql" / "nlams.db"
SCHEMA_SQL = BASE_DIR / "dataset" / "sql" / "nlams_schema.sql"
SEED_SQL = BASE_DIR / "dataset" / "sql" / "nlams_seed_data.sql"

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Create tables and seed data if database does not exist."""
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    conn = get_connection()
    cursor = conn.cursor()

    if SCHEMA_SQL.exists():
        with open(SCHEMA_SQL, "r", encoding="utf-8-sig") as f:
            cursor.executescript(f.read())

    # Check if projects table has records
    cursor.execute("SELECT COUNT(*) FROM projects")
    count = cursor.fetchone()[0]
    if count == 0 and SEED_SQL.exists():
        with open(SEED_SQL, "r", encoding="utf-8-sig") as f:
            cursor.executescript(f.read())

    conn.commit()
    conn.close()

def query_db(query: str, args: tuple = (), one: bool = False) -> Any:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.close()
    if rv:
        return (dict(rv[0])) if one else [dict(r) for r in rv]
    return None if one else []
