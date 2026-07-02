"""
Agent 3: Business Profile Agent
Evaluates company capabilities and readiness
"""
from datetime import datetime
from typing import Dict, Any
from loguru import logger


def _score_certifications(certs: list, required: list) -> float:
    if not required:
        return 1.0
    matched = sum(1 for r in required if any(r.lower() in c.lower() for c in certs))
    return matched / len(required)


async def run_business_profile_analysis(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    """Evaluate business profile and compute readiness score."""
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] BusinessProfile: Analyzing company profile")
    
    try:
        profile = state.get("business_profile", {}) or {}
        metadata = state.get("tender_metadata", {}) or {}
        
        # Score dimensions (0-100)
        raw_exp = profile.get("experience_years")
        exp_years = float(raw_exp) if raw_exp is not None else 0.0
        
        raw_req_exp = metadata.get("experience_required")
        req_exp = float(raw_req_exp) if raw_req_exp is not None else 3.0
        
        experience_score = min(100, (exp_years / max(req_exp, 1)) * 100)
        
        turnover_val = profile.get("turnover") or profile.get("annual_turnover")
        if turnover_val is None:
            turnover_val = 0
        try:
            turnover = float(turnover_val)
            if turnover < 100000 and turnover > 0:
                turnover = turnover * 100000
        except (ValueError, TypeError):
            turnover = 0.0
        
        raw_req_turn = metadata.get("turnover_required")
        req_turnover = float(raw_req_turn) if raw_req_turn is not None else 5000000.0
        turnover_score = min(100, (turnover / max(req_turnover, 1)) * 100)
        
        certs = profile.get("certifications", []) or []
        req_certs = metadata.get("certifications", []) or []
        if req_certs is None:
            req_certs = []
        cert_score = _score_certifications(certs, req_certs) * 100
        
        raw_team = profile.get("team_size") or profile.get("teamSize")
        team_size = int(raw_team) if raw_team is not None else 0
        team_score = min(100, (team_size / 20) * 100)  # normalize to 20 people
        
        # Weighted readiness score
        readiness = (
            experience_score * 0.30 +
            turnover_score * 0.25 +
            cert_score * 0.25 +
            team_score * 0.20
        )
        
        strengths = []
        weaknesses = []
        
        if experience_score >= 80: strengths.append("Strong project experience")
        else: weaknesses.append(f"Experience gap: {exp_years:.0f} years vs {req_exp:.0f} required")
        
        if turnover_score >= 80: strengths.append("Adequate financial turnover")
        else: weaknesses.append(f"Turnover gap: {turnover/1e5:.1f}L vs {req_turnover/1e5:.1f}L required")
        
        if cert_score >= 80: strengths.append("Strong certification portfolio")
        elif cert_score >= 50: strengths.append("Partial certification coverage")
        else: weaknesses.append("Missing critical certifications")
        
        if team_size >= 15: strengths.append("Adequate team capacity")
        else: weaknesses.append(f"Team size ({team_size}) may be insufficient for large projects")
        
        logs.append(f"[{datetime.now().isoformat()}] BusinessProfile: Readiness score = {readiness:.1f}%")
        logs.append(f"[{datetime.now().isoformat()}] BusinessProfile: Strengths: {len(strengths)}, Weaknesses: {len(weaknesses)}")
        
        return {
            **state,
            "business_readiness_score": round(readiness, 2),
            "agent_logs": logs,
            "current_step": "eligibility_analysis",
            "_profile_scores": {
                "experience": experience_score,
                "turnover": turnover_score,
                "certifications": cert_score,
                "team": team_score,
            },
            "_strengths": strengths,
            "_weaknesses": weaknesses,
        }
        
    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] BusinessProfile: Error - {str(e)}")
        return {
            **state,
            "business_readiness_score": 0.0,
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"BusinessProfile: {str(e)}"],
            "current_step": "eligibility_analysis",
            "_failed": True
        }
