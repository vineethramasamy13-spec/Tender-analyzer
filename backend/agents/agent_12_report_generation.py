"""
Agent 12: Report Generation Agent
Compiles all outputs into structured 15-section report
"""
from datetime import datetime
from typing import Dict, Any
from loguru import logger
from utils.helpers import generate_id


async def run_report_generation(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] ReportGeneration: Compiling report")

    try:
        analysis_id = state.get("analysis_id", generate_id())
        elig = state.get("eligibility_result", {})
        bid = state.get("bid_prediction", {})
        risk = state.get("risk_report", {})
        
        win_prob = float(bid.get("win_probability", 0.7)) * 100
        elig_score = float(elig.get("overall_score", 0.7)) * 100

        report_data = {
            "analysis_id": analysis_id,
            "generated_at": datetime.utcnow().isoformat(),
            "version": "1.0",
            
            # All analysis sections
            "tender_metadata": state.get("tender_metadata", {}),
            "tender_title": state.get("tender_title", "Government Tender"),
            "business_profile": state.get("business_profile", {}),
            "eligibility_result": elig,
            "gaps": state.get("gaps", []),
            "cost_estimate": state.get("cost_estimate", {}),
            "risk_report": risk,
            "scheme_recommendations": state.get("scheme_recommendations", []),
            "competitor_analysis": state.get("competitor_analysis", {}),
            "bid_prediction": bid,
            "proposal_draft": state.get("proposal_draft", {}),
            
            # Executive summary stats
            "summary": {
                "eligibility_score": round(elig_score, 1),
                "win_probability": round(win_prob, 1),
                "risk_level": risk.get("overall_risk", "medium"),
                "recommendation": bid.get("recommendation", "Apply with Improvements"),
                "confidence": bid.get("confidence", "Medium"),
                "total_gaps": len(state.get("gaps", [])),
                "critical_gaps": sum(1 for g in state.get("gaps", []) if g.get("gap_type") == "critical"),
                "schemes_found": len(state.get("scheme_recommendations", [])),
            }
        }

        # Try to save to MongoDB
        try:
            from database import mongodb
            await mongodb.save_analysis(report_data)
            logs.append(f"[{datetime.now().isoformat()}] ReportGeneration: Saved to MongoDB")
        except Exception as db_err:
            logger.warning(f"MongoDB save failed: {db_err}")

        logs.append(f"[{datetime.now().isoformat()}] ReportGeneration: Report compiled - {len(report_data)} sections")

        return {
            **state,
            "report_data": report_data,
            "agent_logs": logs,
            "current_step": "pdf_export",
        }

    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] ReportGeneration: Error - {str(e)}")
        return {
            **state,
            "report_data": {"analysis_id": state.get("analysis_id", ""), "error": str(e)},
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"ReportGeneration: {str(e)}"],
            "current_step": "pdf_export",
        }
