from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect, Query
from typing import Dict, Any, List, Optional
from models.schemas import AnalysisRequest, AnalysisResponse, BusinessProfile
from database import mongodb
from auth import get_current_user, verify_token
from agents.coordinator import run_analysis
from datetime import datetime
from uuid import uuid4
import asyncio
import json
from loguru import logger

router = APIRouter()

# ---- WebSocket Connection Manager -----------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, analysis_id: str):
        await websocket.accept()
        if analysis_id not in self.active_connections:
            self.active_connections[analysis_id] = []
        self.active_connections[analysis_id].append(websocket)
        logger.info(f"WebSocket client connected to analysis {analysis_id}")

    def disconnect(self, websocket: WebSocket, analysis_id: str):
        if analysis_id in self.active_connections:
            if websocket in self.active_connections[analysis_id]:
                self.active_connections[analysis_id].remove(websocket)
            if not self.active_connections[analysis_id]:
                del self.active_connections[analysis_id]
        logger.info(f"WebSocket client disconnected from analysis {analysis_id}")

    async def broadcast(self, message: str, analysis_id: str):
        if analysis_id in self.active_connections:
            # Create a copy of connections to avoid issues during iteration if modified
            targets = list(self.active_connections[analysis_id])
            for connection in targets:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.warning(f"Error sending message to WebSocket: {e}")
                    # Auto disconnect failed connection
                    self.disconnect(connection, analysis_id)

manager = ConnectionManager()

# ---- Background Runner ----------------------------------------------------

async def run_and_save_analysis(analysis_request: dict, analysis_id: str, user_id: str):
    await mongodb.update_analysis_status(analysis_id, "running")
    
    # Load user's custom API keys
    try:
        user = await mongodb.get_user_by_id(user_id)
        if user:
            from utils.encryption import decrypt_val
            analysis_request["groq_api_key"] = decrypt_val(user.get("groq_api_key"))
            analysis_request["gemini_api_key"] = decrypt_val(user.get("gemini_api_key"))
    except Exception as e:
        logger.error(f"Error retrieving user API keys for analysis: {e}")
        
    async def progress_callback(progress_data):
        await manager.broadcast(json.dumps(progress_data), analysis_id)
        
    try:
        # Run analysis pipeline
        final_state = await run_analysis(
            analysis_request, 
            progress_callback=progress_callback
        )
        
        # Save to database
        await mongodb.update_analysis_status(
            analysis_id, 
            "completed", 
            result=final_state
        )
        
        # Notify clients of completion
        completion_msg = {
            "analysis_id": analysis_id,
            "step_id": "completed",
            "status": "completed",
            "progress_percent": 100,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await manager.broadcast(json.dumps(completion_msg), analysis_id)
        
    except Exception as e:
        logger.error(f"Analysis pipeline error for {analysis_id}: {e}")
        await mongodb.update_analysis_status(
            analysis_id, 
            "failed", 
            error=str(e)
        )
        # Broadcast failure
        await manager.broadcast(json.dumps({
            "analysis_id": analysis_id,
            "status": "failed",
            "message": str(e)
        }), analysis_id)

# ---- Endpoints ------------------------------------------------------------

@router.post("/analyze", response_model=AnalysisResponse)
async def start_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    analysis_id = str(uuid4())
    
    # Create record immediately
    await mongodb.create_analysis_record(
        analysis_id=analysis_id,
        user_id=current_user["user_id"],
        status="queued",
        tender_title=request.business_profile.name + " - Analysis"
    )
    
    # Prep request data
    req_dict = request.dict()
    req_dict["analysis_id"] = analysis_id
    # Ensure correct user_id in company profile
    req_dict["business_profile"]["company_id"] = current_user["user_id"]
    
    # Run in background, don't wait
    background_tasks.add_task(
        run_and_save_analysis,
        req_dict,
        analysis_id,
        current_user["user_id"]
    )
    
    return {
        "analysis_id": analysis_id,
        "status": "queued",
        "message": "Analysis pipeline queued in background",
        "websocket_url": f"/ws/analysis/{analysis_id}"
    }

@router.get("/analysis/{analysis_id}")
async def get_analysis_status(analysis_id: str, current_user: dict = Depends(get_current_user)):
    analysis = await mongodb.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if analysis["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this analysis")
    
    # If completed and result exists, return result directly or status
    return analysis

@router.delete("/analysis/{analysis_id}")
async def delete_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    analysis = await mongodb.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if analysis["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this analysis")
        
    await mongodb.delete_one("analyses", {"analysis_id": analysis_id})
    return {"deleted": True}

@router.get("/analyses")
async def list_analyses(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    skip = (page - 1) * limit
    analyses = await mongodb.find_many("analyses", {"user_id": current_user["user_id"]}, limit=limit, skip=skip)
    return analyses

@router.post("/analyze/quick")
async def quick_check(
    request: AnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Runs only document_extraction + business_profile + eligibility_analysis.
    Returns in under 10 seconds. Use to check eligibility before full analysis.
    """
    try:
        from agents import (
            agent_02_document_extraction as document_extraction,
            agent_03_business_profile as business_profile,
            agent_04_eligibility_analysis as eligibility_analysis
        )
        
        # Setup initial state
        state = {
            "analysis_id": f"QUICK-{str(uuid4())[:8]}",
            "tender_id": request.tender_id or str(uuid4()),
            "tender_text": request.tender_text or "",
            "tender_pdf_path": request.tender_file_path or "",
            "tender_url": request.tender_url or "",
            "business_profile": request.business_profile.dict(),
            "tender_metadata": {},
            "agent_logs": [],
            "errors": [],
        }
        
        # Run first 3 agents sequentially
        state = await document_extraction.run_document_extraction(state)
        state = await business_profile.run_business_profile_analysis(state)
        state = await eligibility_analysis.run_eligibility_analysis(state)
        
        elig = state.get("eligibility_result", {})
        score_val = elig.get("overall_score", 0.0)
        if score_val is not None:
            # If the score is represented as a decimal fraction, scale it up to percentage
            if score_val <= 1.0:
                score_val = round(score_val * 100.0, 1)
            else:
                score_val = round(score_val, 1)
        else:
            score_val = 0.0
        
        return {
            "eligible": elig.get("eligible"),
            "score": score_val,
            "missing_items": elig.get("missing_items", []),
            "breakdown": elig.get("breakdown", []),
            "full_analysis_available": True,
            "full_analysis_hint": "POST /api/analyze for complete 12-step report with PDF"
        }
    except Exception as e:
        logger.error(f"Quick check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---- Step Rerun Endpoints -------------------------------------------------

@router.post("/analyze/{analysis_id}/rerun/{step_id}")
async def rerun_step(
    analysis_id: str,
    step_id: str,
    current_user: dict = Depends(get_current_user)
):
    from agents import (
        agent_02_document_extraction as document_extraction,
        agent_03_business_profile as business_profile,
        agent_04_eligibility_analysis as eligibility_analysis,
        agent_05_technical_requirement as technical_requirement,
        agent_06_cost_estimation as cost_estimation,
        agent_07_risk_assessment as risk_assessment,
        agent_08_scheme_recommendation as scheme_recommendation,
        agent_09_competitor_analysis as competitor_analysis,
        agent_10_bid_prediction as bid_prediction,
        agent_11_proposal_generation as proposal_generation,
        agent_12_report_generation as report_generation,
        agent_13_pdf_export as pdf_export
    )
    
    agent_map = {
        "document_extraction": document_extraction.run_document_extraction,
        "business_profile": business_profile.run_business_profile_analysis,
        "eligibility_analysis": eligibility_analysis.run_eligibility_analysis,
        "technical_requirement": technical_requirement.run_technical_analysis,
        "cost_estimation": cost_estimation.run_cost_estimation,
        "risk_assessment": risk_assessment.run_risk_assessment,
        "scheme_recommendation": scheme_recommendation.run_scheme_recommendation,
        "competitor_analysis": competitor_analysis.run_competitor_analysis,
        "bid_prediction": bid_prediction.run_bid_prediction,
        "proposal_generation": proposal_generation.run_proposal_generation,
        "report_generation": report_generation.run_report_generation,
        "pdf_export": pdf_export.run_pdf_export,
    }
    
    if step_id not in agent_map:
        raise HTTPException(status_code=400, detail=f"Unknown step: {step_id}")
        
    analysis = await mongodb.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if analysis["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    state = analysis.get("result")
    if not state:
        raise HTTPException(status_code=400, detail="Cannot rerun step on uncompleted/failed analysis state")
        
    # Execute single step
    updated_state = await agent_map[step_id](state)
    
    # Save back to database
    await mongodb.update_analysis_status(analysis_id, "completed", result=updated_state)
    return {"step": step_id, "status": "rerun complete"}

# ---- WebSocket Endpoint ---------------------------------------------------

@router.websocket("/ws/analysis/{analysis_id}")
async def websocket_endpoint(websocket: WebSocket, analysis_id: str, token: Optional[str] = Query(None)):
    if not token:
        await websocket.close(code=4001)
        return
        
    try:
        # Verify token synchronously
        payload = verify_token(token)
        user_id = payload.get("sub")
        
        # Verify analysis ownership
        analysis = await mongodb.get_analysis(analysis_id)
        if not analysis or analysis.get("user_id") != user_id:
            logger.error(f"WS auth failed for {analysis_id}. Analysis found: {bool(analysis)}. Analysis user: {analysis.get('user_id') if analysis else None}. Token user: {user_id}")
            await websocket.close(code=4003)
            return
            
    except Exception as e:
        logger.error(f"WebSocket auth failed: {e}")
        await websocket.close(code=4001)
        return
        
    await manager.connect(websocket, analysis_id)
    
    # Send initial status
    try:
        await websocket.send_text(json.dumps({
            "analysis_id": analysis_id,
            "status": analysis.get("status", "unknown"),
            "step_id": "initial",
            "progress_percent": 100 if analysis.get("status") == "completed" else 10,
        }))
        
        # Keep connection open
        while True:
            # We just wait for client to close or send ping
            data = await websocket.receive_text()
            # If ping received, send pong
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, analysis_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, analysis_id)
