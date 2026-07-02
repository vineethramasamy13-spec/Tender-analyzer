"""
Agent 6: Cost Estimation Agent
"""
import json
from datetime import datetime
from typing import Dict, Any
from loguru import logger


def _estimate_cost_rule_based(budget: float, team_size: int, duration_months: int = 12) -> Dict[str, float]:
    """Rule-based cost estimation."""
    avg_monthly_salary = 80000  # INR
    team_cost = team_size * avg_monthly_salary * duration_months
    dev_cost = budget * 0.40
    infra_cost = budget * 0.15
    ops_cost = budget * 0.10
    return {
        "development_cost": round(dev_cost),
        "infrastructure_cost": round(infra_cost),
        "team_cost": round(team_cost),
        "operational_cost": round(ops_cost),
        "total": round(dev_cost + infra_cost + team_cost + ops_cost),
    }


async def run_cost_estimation(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] CostEstimation: Starting")

    try:
        metadata = state.get("tender_metadata", {}) or {}
        profile = state.get("business_profile", {}) or {}
        competitor = state.get("competitor_analysis", {}) or {}
        
        raw_budget = metadata.get("budget")
        budget = float(raw_budget) if raw_budget is not None else 10000000.0
        team_size = int(profile.get("team_size", 15) or 15)
        competition = (competitor.get("competition_level") or "medium").lower()
        
        # Margin recommendation
        margin_map = {"low": 20.0, "medium": 15.0, "high": 10.0, "critical": 8.0}
        margin = margin_map.get(competition, 15.0)
        
        # Try Groq for detailed estimation
        groq_client = None
        try:
            from config import get_groq_client
            groq_client = get_groq_client(state.get("groq_api_key"))
        except Exception:
            pass
        
        if groq_client and state.get("tender_text"):
            try:
                tender_snippet = state.get("tender_text", "")[:2000]
                prompt = f"""Estimate project costs for this government tender. Return ONLY JSON.

Tender Budget: {budget:,.0f} INR
Team Size: {team_size}
Timeline: {metadata.get('timeline', '12 months')}
Tender: {tender_snippet[:500]}

Return JSON:
{{
  "development_cost": <float>,
  "infrastructure_cost": <float>,
  "team_cost": <float>,
  "operational_cost": <float>,
  "total": <float>,
  "reasoning": "<brief explanation>"
}}"""
                from utils.llm_utils import call_groq_retry
                content = await call_groq_retry(
                    client=groq_client,
                    model="llama-3.3-70b-versatile",
                    prompt=prompt,
                    temperature=0.2,
                    max_tokens=500
                )
                start = content.find('{')
                end = content.rfind('}') + 1
                if start != -1:
                    cost_data = json.loads(content[start:end])
                    cost_data["margin_recommendation"] = margin
                    cost_data["currency"] = "INR"
                    logs.append(f"[{datetime.now().isoformat()}] CostEstimation: AI estimate - Total {cost_data.get('total', 0):,.0f} INR")
                    return {**state, "cost_estimate": cost_data, "agent_logs": logs, "current_step": "risk_assessment"}
            except Exception as e:
                logger.warning(f"Groq cost estimation failed: {e}")
        
        # Fallback: rule-based
        costs = _estimate_cost_rule_based(budget, team_size)
        costs["margin_recommendation"] = margin
        costs["currency"] = "INR"
        
        logs.append(f"[{datetime.now().isoformat()}] CostEstimation: Rule-based estimate - Total {costs['total']:,.0f} INR")
        return {**state, "cost_estimate": costs, "agent_logs": logs, "current_step": "risk_assessment"}

    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] CostEstimation: Error - {str(e)}")
        return {
            **state,
            "cost_estimate": {
                "development_cost": 0.0,
                "infrastructure_cost": 0.0,
                "team_cost": 0.0,
                "operational_cost": 0.0,
                "total": 0.0,
                "margin_recommendation": 0.0,
                "currency": "INR",
                "failed": True,
                "error": str(e)
            },
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"CostEstimation: {str(e)}"],
            "current_step": "risk_assessment",
        }
