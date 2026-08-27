"""
NLAMS Python Backend Unit & Integration Tests
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from data_loader import loader
from ml_engine import predict_project_risk

def test_data_loader():
    print("Testing DataLoader...")
    projects = loader.get_all("projects")
    assert len(projects) == 50, f"Expected 50 projects, got {len(projects)}"
    print(f" Loaded {len(projects)} projects.")

    parcels = loader.get_all("parcels")
    assert len(parcels) > 0, "No parcels found"
    print(f" Loaded {len(parcels)} parcels.")

    # Test filtering
    tn_projects = loader.filter_projects(state="Tamil Nadu")
    assert len(tn_projects) > 0, "No TN projects found"
    print(f" Found {len(tn_projects)} projects in Tamil Nadu.")

    # Test project details
    proj_details = loader.get_project_details("PRJ-001")
    assert proj_details is not None, "PRJ-001 details not found"
    assert len(proj_details.get("linked_parcels", [])) > 0, "No linked parcels for PRJ-001"
    print(f" PRJ-001 has {len(proj_details['linked_parcels'])} linked parcels.")

    # Test analytics
    analytics = loader.get_analytics()
    assert analytics.get("totalProjects") == 50, f"Expected 50 totalProjects, got {analytics.get('totalProjects')}"
    print(f" Analytics computed: Total Land Required = {analytics['totalLandRequired']} ha, Overall Acq % = {analytics['overallAcquisitionPct']}%.")

def test_ml_engine():
    print("Testing ML Risk Engine...")
    result = predict_project_risk(
        land_acquisition_percentage=49.9,
        pending_parcels=4,
        disputed_parcels=1,
        compensation_pending_percentage=65.1,
        approval_delay_days=35,
        possession_delay_days=20,
        rr_pending_percentage=85.0
    )
    assert "riskScore" in result
    assert "riskLevel" in result
    assert "recommendation" in result
    assert len(result["factors"]) > 0
    print(f" ML Risk Score: {result['riskScore']}, Level: {result['riskLevel']}")

if __name__ == "__main__":
    test_data_loader()
    test_ml_engine()
    print("\n All Backend Unit Tests Passed Successfully!")
