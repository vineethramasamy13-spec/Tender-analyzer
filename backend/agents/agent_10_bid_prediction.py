"""
Agent 10: Bid Success Prediction Agent
Uses weighted rule-based model (XGBoost-compatible)
"""
import math
from datetime import datetime
from typing import Dict, Any
from loguru import logger


def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def predict_win_probability(
    eligibility_score: float,
    risk_score: float,
    competition_level: str,
    cert_match: float,
    experience_match: float,
) -> float:
    """Calculate win probability using weighted scoring."""
    level_map = {"low": 0.9, "medium": 0.6, "high": 0.35, "critical": 0.15}
    competition_factor = level_map.get(competition_level.lower(), 0.5)
    
    # Normalize scores to 0-1
    elig = eligibility_score if eligibility_score <= 1 else eligibility_score / 100
    cert = cert_match if cert_match <= 1 else cert_match / 100
    exp = experience_match if experience_match <= 1 else experience_match / 100
    risk_inverted = 1 - (risk_score if risk_score <= 1 else risk_score / 100)
    
    # Weighted composite
    raw_score = (
        elig * 0.35 +
        risk_inverted * 0.25 +
        exp * 0.20 +
        competition_factor * 0.15 +
        cert * 0.05
    )
    
    # Apply sigmoid for smooth output, then scale to realistic range (20-90%)
    prob = sigmoid((raw_score - 0.5) * 6) * 0.70 + 0.15
    return round(min(0.92, max(0.15, prob)), 3)


async def run_bid_prediction(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] BidPrediction: Starting")

    try:
        elig = state.get("eligibility_result", {}) or {}
        risk = state.get("risk_report", {}) or {}
        comp = state.get("competitor_analysis", {}) or {}

        raw_elig_score = elig.get("overall_score")
        eligibility_score = float(raw_elig_score) if raw_elig_score is not None else 0.7
        
        raw_risk_score = risk.get("risk_score")
        risk_score = float(raw_risk_score) if raw_risk_score is not None else 0.4
        
        raw_cert_match = elig.get("cert_match")
        cert_match = float(raw_cert_match) if raw_cert_match is not None else 0.7
        
        raw_exp_match = elig.get("experience_match")
        exp_match = float(raw_exp_match) if raw_exp_match is not None else 0.7
        
        competition_level = comp.get("competition_level") or "medium"

        win_prob = predict_win_probability(
            eligibility_score, risk_score, competition_level, cert_match, exp_match
        )

        # Confidence
        if win_prob >= 0.75: confidence = "High"
        elif win_prob >= 0.50: confidence = "Medium"
        else: confidence = "Low"

        # Recommendation
        if win_prob >= 0.70:
            recommendation = "Apply Immediately"
        elif win_prob >= 0.50:
            recommendation = "Apply with Improvements"
        else:
            recommendation = "Reconsider - Address Major Gaps First"

        # Key factors
        key_factors = []
        if eligibility_score >= 0.75: key_factors.append(f"Strong eligibility score ({eligibility_score*100:.0f}%)")
        else: key_factors.append(f"Eligibility gap ({eligibility_score*100:.0f}%) - needs improvement")
        
        risk_level = risk.get("overall_risk") or "medium"
        key_factors.append(f"Risk level: {str(risk_level).title()}")
        key_factors.append(f"Competition: {competition_level.title()} ({comp.get('estimated_competitors', 15)} estimated bidders)")
        
        if cert_match < 0.7: key_factors.append("Missing certifications reduce win probability")
        if exp_match >= 0.8: key_factors.append("Strong experience match is a positive factor")

        logs.append(f"[{datetime.now().isoformat()}] BidPrediction: Win probability = {win_prob*100:.1f}%, Confidence = {confidence}")

        return {
            **state,
            "bid_prediction": {
                "win_probability": win_prob,
                "confidence": confidence,
                "recommendation": recommendation,
                "key_factors": key_factors,
            },
            "agent_logs": logs,
            "current_step": "proposal_generation",
        }

    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] BidPrediction: Error - {str(e)}")
        return {
            **state,
            "bid_prediction": {
                "win_probability": 0.0,
                "confidence": "Low",
                "recommendation": "Prediction Error",
                "key_factors": [f"Error: {str(e)}"],
                "failed": True,
                "error": str(e)
            },
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"BidPrediction: {str(e)}"],
            "current_step": "proposal_generation",
        }
