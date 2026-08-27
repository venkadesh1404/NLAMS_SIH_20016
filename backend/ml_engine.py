"""
NLAMS (National Land Acquisition Management System) - AI & Predictive Risk Engine
Evaluates project health, bottleneck weights, and predictive delay risk.
"""

from typing import Dict, Any, List

def predict_project_risk(
    land_acquisition_percentage: float,
    pending_parcels: int,
    disputed_parcels: int,
    compensation_pending_percentage: float,
    approval_delay_days: int,
    possession_delay_days: int,
    rr_pending_percentage: float
) -> Dict[str, Any]:
    """
    Computes a composite risk score (0-100) and risk classification
    based on 7 key statutory and execution parameters.
    """
    acq_gap = max(0.0, 100.0 - float(land_acquisition_percentage))
    parcel_risk = min(40.0, (float(pending_parcels) * 0.5) + (float(disputed_parcels) * 1.5))
    comp_risk = min(25.0, float(compensation_pending_percentage) * 0.5)
    delay_risk = min(20.0, (float(approval_delay_days) * 0.3) + (float(possession_delay_days) * 0.2))
    rr_risk = min(15.0, float(rr_pending_percentage) * 0.3)

    raw_score = parcel_risk + comp_risk + delay_risk + rr_risk + (acq_gap * 0.1)
    score = int(round(min(100.0, raw_score)))

    if score >= 80:
        level = "CRITICAL"
        recommendation = (
            "Immediate high-level administrative escalation required. "
            "Expedite pending SLA clearances, fast-track compensation disbursements via special camps, "
            "and resolve legal disputes through lok-adalat."
        )
    elif score >= 60:
        level = "HIGH"
        recommendation = (
            "Prioritize compensation sanction bottlenecks and district-level joint revenue verification. "
            "Deploy additional land survey units to clear pending parcel backlogs."
        )
    elif score >= 35:
        level = "MEDIUM"
        recommendation = (
            "Maintain proactive monitoring of pending revenue records and schedule timely joint possession surveys. "
            "Address compensation delays proactively."
        )
    else:
        level = "LOW"
        recommendation = "Project progressing within optimal statutory parameters. Proceed with routine milestone tracking."

    factors = [
        {"name": "Compensation Pending", "value": f"{round(compensation_pending_percentage, 1)}%", "weight": int(round(comp_risk))},
        {"name": "Land Disputes", "value": f"{disputed_parcels} parcels", "weight": int(round(disputed_parcels * 1.5))},
        {"name": "Possession Delay", "value": f"{possession_delay_days} days", "weight": int(round(possession_delay_days * 0.2))},
        {"name": "R&R Pending", "value": f"{round(rr_pending_percentage, 1)}%", "weight": int(round(rr_risk))},
        {"name": "Approval Delays", "value": f"{approval_delay_days} days", "weight": int(round(approval_delay_days * 0.3))},
    ]

    return {
        "riskScore": score,
        "riskLevel": level,
        "recommendation": recommendation,
        "factors": factors
    }
