"""
Agent 7: Risk Assessment Agent
"""
from datetime import datetime
from typing import Dict, Any, List
from loguru import logger


def _assess_risk_level(score: float) -> str:
    if score < 0.25: return "low"
    if score < 0.5: return "medium"
    if score < 0.75: return "high"
    return "critical"


async def run_risk_assessment(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] RiskAssessment: Starting")

    try:
        profile = state.get("business_profile", {})
        metadata = state.get("tender_metadata", {})
        gaps = state.get("gaps", [])
        elig = state.get("eligibility_result", {})

        raw_budget = metadata.get("budget")
        budget = float(raw_budget) if raw_budget is not None else 0.0
        turnover_val = profile.get("turnover") or profile.get("annual_turnover") or 0
        try:
            turnover = float(turnover_val)
            if turnover < 100000:
                turnover = turnover * 100000
        except (ValueError, TypeError):
            turnover = 0.0

        elig_score = elig.get("overall_score")
        if elig_score is None: 
            elig_score = 0.7
        if elig_score > 1: elig_score /= 100
        
        critical_gaps = [g for g in gaps if g.get("gap_type") == "critical" and g.get("current_status") != "Available"]
        
        # Financial risk
        fin_ratio = turnover / max(budget, 1)
        fin_risk_score = max(0, min(1, 1 - (fin_ratio * 0.5)))
        financial_risk = _assess_risk_level(fin_risk_score)
        
        # Compliance risk (cert gaps)
        comp_risk_score = len(critical_gaps) * 0.25
        compliance_risk = _assess_risk_level(min(comp_risk_score, 1))
        
        # Technical risk (based on elig score)
        tech_risk_score = 1 - elig_score
        technical_risk = _assess_risk_level(tech_risk_score)
        
        # Delivery risk (timeline vs team size)
        team_size = int(profile.get("team_size", 0))
        delivery_risk_score = max(0, 1 - (team_size / 20))
        delivery_risk = _assess_risk_level(delivery_risk_score)
        
        # Overall = max risk
        levels = [financial_risk, compliance_risk, technical_risk, delivery_risk]
        level_order = ["low", "medium", "high", "critical"]
        overall_risk = max(levels, key=lambda x: level_order.index(x) if x in level_order else 0)
        
        # Composite risk score (0-1)
        risk_values = {"low": 0.2, "medium": 0.5, "high": 0.75, "critical": 1.0}
        risk_score = sum(risk_values.get(r, 0.5) for r in levels) / 4
        
        mitigations = [
            f"Financial: Ensure bid is within {100/max(fin_ratio*0.5, 0.01):.0f}% of annual turnover capacity",
            "Compliance: Begin certification processes at least 6 months before bid deadline",
            "Technical: Conduct pre-bid technical assessment and identify skill gaps early",
            "Delivery: Prepare a detailed project execution plan with buffer timelines",
        ]
        
        if critical_gaps:
            mitigations.insert(0, f"Critical: Address {len(critical_gaps)} critical gaps before bidding: {', '.join(g['requirement'] for g in critical_gaps[:3])}")
        
        logs.append(f"[{datetime.now().isoformat()}] RiskAssessment: Overall risk = {overall_risk}, Score = {risk_score:.2f}")

        return {
            **state,
            "risk_report": {
                "financial_risk": financial_risk,
                "compliance_risk": compliance_risk,
                "technical_risk": technical_risk,
                "delivery_risk": delivery_risk,
                "overall_risk": overall_risk,
                "risk_score": round(risk_score, 3),
                "mitigation": mitigations,
            },
            "agent_logs": logs,
            "current_step": "scheme_recommendation",
        }

    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] RiskAssessment: Error - {str(e)}")
        return {
            **state,
            "risk_report": {
                "financial_risk": "unknown",
                "compliance_risk": "unknown",
                "technical_risk": "unknown",
                "delivery_risk": "unknown",
                "overall_risk": "unknown",
                "risk_score": 0.0,
                "mitigation": [],
                "failed": True,
                "error": str(e)
            },
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"RiskAssessment: {str(e)}"],
            "current_step": "scheme_recommendation",
        }
