"""
LangGraph Coordinator - Master orchestrator for all 6 agents
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, Callable
from loguru import logger
from utils.helpers import generate_id

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not available, using sequential fallback")

from agents.state import TenderAnalysisState
from agents import (
    a01 as tender_discovery,
    a02 as document_extraction,
    a03 as business_profile,
    a04 as eligibility_analysis,
    a05 as technical_requirement,
    a06 as cost_estimation,
    a07 as risk_assessment,
    a08 as scheme_recommendation,
    a09 as competitor_analysis,
    a10 as bid_prediction,
    a11 as proposal_generation,
    a12 as report_generation,
    a13 as pdf_export,
)


AGENT_STEPS = [
    {"id": "document_extraction", "name": "Extraction & Classification", "description": "Reading, parsing, and classifying the tender"},
    {"id": "eligibility_analysis", "name": "Eligibility Matcher", "description": "Evaluating bidder profile vs eligibility criteria"},
    {"id": "technical_requirement", "name": "Compliance & Gap Auditor", "description": "Auditing technical specifications and gaps"},
    {"id": "financial_risk_assessor", "name": "Financial & Risk Assessor", "description": "Evaluating cost breakdown, delivery risks, and subsidies"},
    {"id": "bid_prediction", "name": "Success & Competitor Intel", "description": "Predicting win probability and assessing competition"},
    {"id": "proposal_report_builder", "name": "Proposal & Report Builder", "description": "Generating proposal draft and compiling final PDF report"},
]


_PIPELINE_SEM = asyncio.Semaphore(5)

def get_active_slots() -> int:
    """Return the number of active analysis slots in use."""
    return 5 - _PIPELINE_SEM._value

async def run_analysis(
    analysis_request: Dict[str, Any],
    websocket=None,
    progress_callback: Optional[Callable] = None,
) -> TenderAnalysisState:
    """
    Run the complete 6-agent analysis pipeline.
    """
    async with _PIPELINE_SEM:
        try:
            return await asyncio.wait_for(
                _run_analysis_pipeline(analysis_request, websocket, progress_callback),
                timeout=300
            )
        except asyncio.TimeoutError:
            logger.error(f"Analysis pipeline timed out: {analysis_request.get('analysis_id')}")
            # Return degraded state
            analysis_id = analysis_request.get("analysis_id") or generate_id()
            return {
                "analysis_id": analysis_id,
                "status": "timeout",
                "errors": ["Analysis pipeline timed out after 300 seconds"],
            }

async def _run_analysis_pipeline(
    analysis_request: Dict[str, Any],
    websocket=None,
    progress_callback: Optional[Callable] = None,
) -> TenderAnalysisState:
    """
    Internal sequential runner for the 6 agents.
    """
    analysis_id = analysis_request.get("analysis_id") or generate_id()
    
    # Initialize state
    state: TenderAnalysisState = {
        "analysis_id": analysis_id,
        "tender_id": analysis_request.get("tender_id", generate_id()),
        "tender_text": analysis_request.get("tender_text", ""),
        "tender_pdf_path": analysis_request.get("tender_pdf_path", ""),
        "tender_url": analysis_request.get("tender_url", ""),
        "tender_title": analysis_request.get("tender_title", "Government Tender"),
        "tender_metadata": {},
        "business_profile": analysis_request.get("business_profile", {}),
        "business_readiness_score": 0.0,
        "eligibility_result": {},
        "gaps": [],
        "cost_estimate": {},
        "risk_report": {},
        "scheme_recommendations": [],
        "competitor_analysis": {},
        "bid_prediction": {},
        "proposal_draft": {},
        "discovered_tenders": [],
        "report_data": {},
        "pdf_report_path": "",
        "agent_logs": [],
        "errors": [],
        "current_step": "document_extraction",
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": "",
        "groq_api_key": analysis_request.get("groq_api_key"),
        "gemini_api_key": analysis_request.get("gemini_api_key"),
    }
    
    async def send_progress(step_id: str, status: str, step_num: int):
        """Send progress update via WebSocket or callback."""
        progress = {
            "analysis_id": analysis_id,
            "step_id": step_id,
            "status": status,
            "step_number": step_num,
            "total_steps": len(AGENT_STEPS),
            "progress_percent": int((step_num / len(AGENT_STEPS)) * 100),
            "timestamp": datetime.utcnow().isoformat(),
            "logs": state.get("agent_logs", [])
        }
        
        if websocket:
            try:
                import json
                await websocket.send_text(json.dumps(progress))
            except Exception:
                pass
        
        if progress_callback:
            try:
                await progress_callback(progress)
            except Exception:
                pass

    logger.info(f"Starting analysis pipeline: {analysis_id}")
    
    # ── Sequential agent execution ───────────────────────────────────────
    
    # Step 1: Extraction & Classification
    await send_progress("document_extraction", "running", 1)
    state = await document_extraction.run_document_extraction(state)
    await send_progress("document_extraction", "completed", 1)
    
    # Step 2: Eligibility Matcher (business profile + eligibility analysis)
    await send_progress("eligibility_analysis", "running", 2)
    state = await business_profile.run_business_profile_analysis(state)
    state = await eligibility_analysis.run_eligibility_analysis(state)
    await send_progress("eligibility_analysis", "completed", 2)
    
    # Step 3: Technical Compliance Auditor
    await send_progress("technical_requirement", "running", 3)
    state = await technical_requirement.run_technical_analysis(state)
    await send_progress("technical_requirement", "completed", 3)
    
    # Step 4: Financial & Risk Assessor (parallel execution of Cost, Risk, Schemes)
    await send_progress("financial_risk_assessor", "running", 4)
    
    cost_task = cost_estimation.run_cost_estimation(state)
    risk_task = risk_assessment.run_risk_assessment(state)
    scheme_task = scheme_recommendation.run_scheme_recommendation(state)
    
    cost_result, risk_result, scheme_result = await asyncio.gather(
        cost_task, risk_task, scheme_task, return_exceptions=True
    )
    
    if not isinstance(cost_result, Exception):
        state["cost_estimate"] = cost_result.get("cost_estimate", {})
        state["agent_logs"].extend(cost_result.get("agent_logs", []))

    if not isinstance(risk_result, Exception):
        state["risk_report"] = risk_result.get("risk_report", {})
        state["agent_logs"].extend(risk_result.get("agent_logs", []))

    if not isinstance(scheme_result, Exception):
        state["scheme_recommendations"] = scheme_result.get("scheme_recommendations", [])
        state["agent_logs"].extend(scheme_result.get("agent_logs", []))
        
    await send_progress("financial_risk_assessor", "completed", 4)
    
    # Step 5: Success & Competitor Intel (Competitor Analysis + Bid Prediction)
    await send_progress("bid_prediction", "running", 5)
    state = await competitor_analysis.run_competitor_analysis(state)
    state = await bid_prediction.run_bid_prediction(state)
    await send_progress("bid_prediction", "completed", 5)
    
    # Step 6: Proposal & Report Builder (Proposal Draft + Report Generation + PDF Export)
    await send_progress("proposal_report_builder", "running", 6)
    state = await proposal_generation.run_proposal_generation(state)
    state = await report_generation.run_report_generation(state)
    state = await pdf_export.run_pdf_export(state)
    await send_progress("proposal_report_builder", "completed", 6)
    
    # Final progress
    await send_progress("completed", "completed", 6)
    
    logger.info(f"Analysis pipeline completed: {analysis_id} | PDF: {state.get('pdf_report_path', 'N/A')}")
    return state
