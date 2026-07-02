"""
Agent 4: Eligibility Analysis Agent
Cross-matches business profile vs tender requirements with weighted scoring
"""
import json
from datetime import datetime
from typing import Dict, Any, List
from loguru import logger


async def run_eligibility_analysis(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    """Analyze eligibility by comparing business profile to tender requirements."""
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] EligibilityAnalysis: Starting analysis")

    try:
        profile = state.get("business_profile", {})
        metadata = state.get("tender_metadata", {})
        profile_scores = state.get("_profile_scores", {})

        exp_score = profile_scores.get("experience", 50.0)
        turnover_score = profile_scores.get("turnover", 50.0)
        cert_score = profile_scores.get("certifications", 50.0)
        tech_score = profile_scores.get("team", 60.0)

        # Weighted overall score (0-100)
        overall = (
            exp_score * 0.30 +
            turnover_score * 0.25 +
            cert_score * 0.25 +
            tech_score * 0.20
        )

        # Missing items
        missing_items = []
        certs_have = [c.lower() for c in profile.get("certifications", []) or []]
        certs_req = metadata.get("certifications") or []
        if certs_req is None:
            certs_req = []
        for cert in certs_req:
            if not any(cert.lower() in c for c in certs_have):
                missing_items.append(f"Certification: {cert}")

        raw_req_exp = metadata.get("experience_required")
        req_exp = float(raw_req_exp) if raw_req_exp is not None else 3.0
        
        raw_exp_have = profile.get("experience_years")
        exp_have = float(raw_exp_have) if raw_exp_have is not None else 0.0
        
        if exp_have < req_exp:
            missing_items.append(f"Experience: Need {req_exp:.0f} years, have {exp_have:.0f} years")

        raw_req_turn = metadata.get("turnover_required")
        req_turn = float(raw_req_turn) if raw_req_turn is not None else 0.0
        
        multipliers = {"absolute": 1, "lakhs": 100_000, "crores": 10_000_000}
        if "annual_turnover" in profile and profile.get("annual_turnover") is not None:
            unit = profile.get("turnover_unit") or "lakhs"
            turnover = float(profile["annual_turnover"]) * multipliers.get(unit.lower(), 100_000)
        else:
            turnover_val = profile.get("turnover") or profile.get("annual_turnover")
            if turnover_val is None:
                turnover_val = 0
            try:
                turnover = float(turnover_val)
                if turnover < 100000 and turnover > 0:
                    turnover = turnover * 100000
            except (ValueError, TypeError):
                turnover = 0.0

        if turnover < req_turn:
            from utils.helpers import format_currency
            missing_items.append(f"Turnover: Need {format_currency(req_turn)}, have {format_currency(turnover)}")

        # Detailed breakdown
        req_exp_str = f"{req_exp:.0f} years" if req_exp > 0 else "Not Specified"
        req_turn_str = f"Rs. {req_turn/1e5:.1f} Lakhs" if req_turn > 0 else "Not Specified"
        
        breakdown = [
            {
                "criterion": "Project Experience",
                "required": req_exp_str,
                "current": f"{exp_have:.0f} years",
                "score": round(exp_score, 1),
                "weight": 0.30,
            },
            {
                "criterion": "Annual Turnover",
                "required": req_turn_str,
                "current": f"Rs. {turnover/1e5:.1f} Lakhs",
                "score": round(turnover_score, 1),
                "weight": 0.25,
            },
            {
                "criterion": "Certifications",
                "required": ", ".join(certs_req) if certs_req else "None",
                "current": ", ".join(profile.get("certifications", []) or []) or "None",
                "score": round(cert_score, 1),
                "weight": 0.25,
            },
            {
                "criterion": "Technical Capability & Team",
                "required": "Adequate team for scope",
                "current": f"{profile.get('team_size', 0)} members",
                "score": round(tech_score, 1),
                "weight": 0.20,
            },
        ]

        eligible = overall >= 60.0

        logs.append(f"[{datetime.now().isoformat()}] EligibilityAnalysis: Overall = {overall:.1f}%, Eligible = {eligible}")

        return {
            **state,
            "eligibility_result": {
                "overall_score": round(overall / 100, 3),
                "experience_match": round(exp_score / 100, 3),
                "turnover_match": round(turnover_score / 100, 3),
                "cert_match": round(cert_score / 100, 3),
                "tech_match": round(tech_score / 100, 3),
                "missing_items": missing_items,
                "eligible": eligible,
                "breakdown": breakdown,
            },
            "agent_logs": logs,
            "current_step": "technical_requirement",
        }

    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] EligibilityAnalysis: Error - {str(e)}")
        return {
            **state,
            "eligibility_result": {
                "overall_score": None,
                "experience_match": None,
                "turnover_match": None,
                "cert_match": None,
                "tech_match": None,
                "missing_items": [],
                "eligible": None,
                "failed": True,
                "error": str(e),
                "breakdown": [],
            },
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"EligibilityAnalysis: {str(e)}"],
            "current_step": "technical_requirement",
        }
