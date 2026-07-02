"""
Agent 9: Competitor Analysis Agent
"""
from datetime import datetime
from typing import Dict, Any
from loguru import logger


async def run_competitor_analysis(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] CompetitorAnalysis: Starting")

    try:
        metadata = state.get("tender_metadata", {})
        raw_budget = metadata.get("budget")
        budget = float(raw_budget) if raw_budget is not None else 0.0
        category = metadata.get("category", "IT/Software")

        # Estimate competition based on budget
        if budget < 5000000:  # < 50L
            level, count = "low", 5
            key_players = ["Small IT firms (Tier 3 cities)", "Startup companies", "Freelancer consortiums", "Regional IT vendors"]
            win_factors = ["Competitive pricing", "Quick delivery timeline", "Local presence", "Innovative approach"]
        elif budget < 20000000:  # 50L - 2Cr
            level, count = "medium", 15
            key_players = ["Mid-size IT companies", "MSME IT firms", "Regional system integrators", "Niche solution providers"]
            win_factors = ["Strong technical proposal", "Relevant certifications (ISO/CMMI)", "Proven similar projects", "Competitive pricing"]
        else:  # > 2Cr
            level, count = "high", 30
            key_players = ["Large IT firms (TCS, Infosys, Wipro)", "Mid-size companies (Mphasis, Hexaware)", "Global system integrators", "Specialized government IT vendors"]
            win_factors = ["Exceptional technical capability", "CMMI Level 3+ certification", "Extensive government references", "Competitive pricing with value-adds"]

        # Category-specific additions
        if "security" in category.lower() or "cyber" in category.lower():
            key_players.append("Cybersecurity specialists (Quick Heal, Seqrite)")
            win_factors.append("CERT-In empanelment")
        
        logs.append(f"[{datetime.now().isoformat()}] CompetitorAnalysis: Level={level}, Est. competitors={count}")

        return {
            **state,
            "competitor_analysis": {
                "competition_level": level,
                "estimated_competitors": count,
                "key_players": key_players[:4],
                "win_factors": win_factors[:4],
            },
            "agent_logs": logs,
            "current_step": "bid_prediction",
        }

    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] CompetitorAnalysis: Error - {str(e)}")
        return {
            **state,
            "competitor_analysis": {
                "competition_level": "unknown",
                "estimated_competitors": 0,
                "key_players": [],
                "win_factors": [],
                "failed": True,
                "error": str(e)
            },
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"CompetitorAnalysis: {str(e)}"],
            "current_step": "bid_prediction",
        }
