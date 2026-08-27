"""
NLAMS End-to-End Workflow Verification Test
Tests complete lifecycle:
1. PWD creates draft proposal
2. PWD submits proposal -> Notifications created for District Authority
3. District reviews and sends back with reason -> PWD receives feedback
4. PWD edits and resubmits
5. District reviews and verifies -> State receives notification
6. State reviews and approves -> Active Project automatically initialized
7. Verifies audit logs, notification state, and project database consistency
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from data_loader import loader

def test_full_workflow():
    print("==================================================================")
    print(" STARTING NLAMS END-TO-END WORKFLOW INTEGRATION TEST")
    print("==================================================================")

    # 1. PWD creates Proposal
    print("\n[Step 1] PWD creates proposal...")
    p_data = {
        "projectName": "Erode-Tiruppur Fast Corridor Bypass",
        "department": "Highways & Infrastructure Planning",
        "agency": "PWD Tamil Nadu",
        "projectType": "Highways",
        "state": "Tamil Nadu",
        "district": "Tiruppur",
        "landRequired": 65.0,
        "estimatedCost": 1850.0,
        "purpose": "Four-lane corridor bypassing congested commercial textile centers.",
        "targetDate": "2028-10-31",
        "isSubmit": False,
        "submittedByEmail": "pwd@nlams.gov.in",
        "documents": [
            {"id": "DOC-T001", "name": "DPR_Erode_Tiruppur.pdf", "type": "DPR", "size": "3.5 MB", "uploadDate": "2026-08-28"}
        ]
    }
    proposal = loader.create_proposal(p_data, actor_name="Kavya Krishnan", actor_role="pwd_agency")
    prop_id = proposal["id"]
    print(f" Proposal created successfully: ID = {prop_id}, Status = {proposal['status']}")
    assert proposal["status"] == "DRAFT"

    # 2. PWD Submits Proposal
    print(f"\n[Step 2] PWD submits proposal {prop_id}...")
    proposal = loader.submit_proposal(prop_id, actor_name="Kavya Krishnan", actor_role="pwd_agency", notes="Formal submission for revenue boundary verification.")
    print(f" Proposal submitted: Status = {proposal['status']}, Assigned Authority = {proposal['assignedAuthority']}")
    assert proposal["status"] == "SUBMITTED"
    assert proposal["assignedRole"] == "district_authority"

    # Check notification created for District Authority
    district_notifs = loader.get_notifications_for_user(role="district_authority")
    assert any(n.get("targetId") == prop_id for n in district_notifs), "District notification was not created!"
    print(" Notification successfully delivered to District Authority queue.")

    # 3. District Authority Sends Back for clarifications
    print(f"\n[Step 3] District Authority sends back {prop_id} for clarification...")
    send_back_reason = "Village Survey Sheet #44 lacks patta subdivision markings. Please attach updated extract."
    proposal = loader.send_back_proposal(prop_id, actor_name="Ramesh Iyer", actor_role="district_authority", reason=send_back_reason)
    print(f" Proposal sent back: Status = {proposal['status']}, Reason = '{proposal['sendBackReason']}'")
    assert proposal["status"] == "SENT_BACK"

    # Check PWD notification
    pwd_notifs = loader.get_notifications_for_user(email="pwd@nlams.gov.in")
    assert any(n.get("targetId") == prop_id and "Sent Back" in n.get("title", "") for n in pwd_notifs), "PWD was not notified of send-back!"
    print(" PWD successfully notified with mandatory feedback reason.")

    # 4. PWD edits and resubmits
    print(f"\n[Step 4] PWD edits and resubmits proposal {prop_id}...")
    proposal = loader.update_proposal(
        prop_id,
        {
            "isSubmit": True,
            "purpose": "Updated corridor alignment with verified survey subdivision numbers.",
            "notes": "Attached updated revenue patta extract for Sheet #44."
        },
        actor_name="Kavya Krishnan",
        actor_role="pwd_agency"
    )
    print(f" Proposal resubmitted: Status = {proposal['status']}")
    assert proposal["status"] == "SUBMITTED"

    # 5. District Authority verifies
    print(f"\n[Step 5] District Authority verifies proposal {prop_id}...")
    proposal = loader.verify_proposal(prop_id, actor_name="Ramesh Iyer", actor_role="district_authority", notes="All revenue boundaries authenticated.")
    print(f" Proposal verified: Status = {proposal['status']}, Assigned Authority = {proposal['assignedAuthority']}")
    assert proposal["status"] == "UNDER_SCRUTINY"
    assert proposal["assignedRole"] == "state_gov"

    # 6. State Government Approves
    print(f"\n[Step 6] State Government grants administrative approval for {prop_id}...")
    proposal = loader.approve_proposal(prop_id, actor_name="Dr. S. Radhakrishnan", actor_role="state_gov", notes="Administrative sanction granted. Land acquisition proceeding sanctioned.")
    print(f" Proposal Approved: Status = {proposal['status']}, Associated Project ID = {proposal.get('projectId')}")
    assert proposal["status"] == "APPROVED"
    created_proj_id = proposal.get("projectId")
    assert created_proj_id is not None, "Project was not initialized!"

    # Verify project exists in database
    proj = loader.get_by_id("projects", created_proj_id)
    assert proj is not None, f"Project {created_proj_id} not found in database!"
    print(f" Active Project {created_proj_id} registered: '{proj['name']}' ({proj['landRequired']} ha, Status = {proj['status']})")

    # 7. Check Audit Trail
    print("\n[Step 7] Checking system audit logs...")
    audit_logs = loader.get_all("audit")
    proposal_audits = [a for a in audit_logs if a.get("recordId") == prop_id]
    print(f" Found {len(proposal_audits)} audit entries logged for {prop_id}:")
    for a in proposal_audits:
        print(f"   [{a['timestamp']}] ({a['role']}) {a['action']}: {a['description']}")
    assert len(proposal_audits) >= 5, "Audit entries missing from lifecycle!"

    print("\n==================================================================")
    print(" ALL END-TO-END WORKFLOW INTEGRATION TESTS PASSED (100% SUCCESS)")
    print("==================================================================")

if __name__ == "__main__":
    test_full_workflow()
