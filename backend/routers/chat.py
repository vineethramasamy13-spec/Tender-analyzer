from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict, Any
from models.schemas import ChatRequest, ChatResponse
from database import mongodb
from auth import get_current_user
from config import settings, get_groq_client
from rag import chromadb_setup
from uuid import uuid4
from datetime import datetime
import asyncio
from loguru import logger

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_assistant(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """RAG-powered chat assistant endpoint."""
    try:
        # Retrieve context from ChromaDB
        chroma_client = chromadb_setup.get_chroma_client(settings.CHROMADB_PERSIST_DIR)
        context = ""
        if chroma_client:
            context = chromadb_setup.chat_retrieve(chroma_client, request.message, n=3)
        else:
            context = "No database context available. Answering using general knowledge."
            
        from utils.encryption import decrypt_val
        groq_client = get_groq_client(decrypt_val(current_user.get("groq_api_key")))
        
        history_str = ""
        for msg in request.history[-5:]:
            history_str += f"{msg.role.capitalize()}: {msg.content}\n"
            
        prompt = f"""You are TenderAI, an advanced AI-powered platform designed to help startups, MSMEs, and enterprises discover, analyze, and win government tenders (like GeM, CPPP, and RBI).

Key features of this TenderAI app:
1. Smart Tender Discovery: Automatically monitors and aggregates active tech tenders across major government portals.
2. 6-Agent AI Pipeline: Employs 6 specialized agents (Extraction & Classification, Eligibility Matcher, Compliance & Gap Auditor, Financial & Risk Assessor, Success & Competitor Intel, and Proposal & Report Builder) to run end-to-end evaluations.
3. Eligibility Scoring & Bid Prediction: Computes a matching score between a company profile and tender criteria, predicting winning probability.
4. Scheme Recommendation: Recommends relevant government benefit schemes (like Startup India, MSME subsidies, DPIIT) to boost startup viability.
5. AI Proposal Co-Pilot: Automatically drafts professional proposal sections and allows chatting directly with the analyzed tender data.

Use the following context from tender documents and government schemes to answer the user's question. If the context doesn't contain the answer, use your knowledge about the TenderAI app described above to explain the platform.
Maintain a professional, formal, and helpful tone.

CONTEXT:
{context}

CONVERSATION HISTORY:
{history_str}
User: {request.message}
Assistant:"""

        response_text = ""
        if groq_client:
            try:
                response = await asyncio.to_thread(
                    groq_client.chat.completions.create,
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=1000,
                    timeout=10.0,
                )
                response_text = response.choices[0].message.content
            except Exception as e:
                logger.error(f"Groq chat call failed: {e}")
                raise HTTPException(
                    status_code=503,
                    detail="AI service temporarily unavailable — please retry in a moment"
                )
        else:
            response_text = f"Regarding your question about {request.message}: You should review the experience and turnover requirements of the specific tender. For example, NIC tenders typically require 5 years experience, while MSMEs can benefit from relaxed criteria and financial schemes like the Startup India Seed Fund."
            
        sources = []
        if "SCHEME:" in context:
            sources.append("Government Scheme Database")
        if "TENDER INFO:" in context:
            sources.append("Tender Document Analysis")
        if not sources:
            sources.append("General Knowledge Base")
            
        return ChatResponse(
            response=response_text,
            conversation_id=request.conversation_id or str(uuid4()),
            sources=sources,
            timestamp=datetime.utcnow()
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in chat assistant: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/{analysis_id}")
async def chat_with_analysis(
    analysis_id: str,
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Proposal Co-Pilot chat with analysis context."""
    analysis = await mongodb.get_analysis(analysis_id)
    if not analysis:
        # Fallback: check if this is a tender ID
        tender = await mongodb.get_tender(analysis_id)
        if not tender:
            # Also search in mock list
            from mcp.search_server import get_mock_tenders
            mocks = get_mock_tenders()
            for mock in mocks:
                if mock.get("id") == analysis_id or mock.get("tender_id") == analysis_id:
                    tender = mock
                    break
                    
        if tender:
            # Build a lightweight context based on the tender document only
            context = f"""
TENDER TITLE: {tender.get('title', 'Unknown Tender')}
DEPARTMENT: {tender.get('department', 'Unknown Department')}
BUDGET: {tender.get('budget', 'Unknown')}
DEADLINE: {tender.get('deadline', 'Unknown')}
CATEGORY: {tender.get('category', 'IT/Software')}
REFERENCE NUMBER: {tender.get('reference_number', tender.get('tenderNo', ''))}
LOCATION: {tender.get('location', 'India')}
DESCRIPTION: {tender.get('description', '')[:2000]}
"""
            history_str = ""
            for msg in request.history[-5:]:
                history_str += f"{msg.role.capitalize()}: {msg.content}\n"
                
            prompt = f"""You are TenderAI, an expert government tender advisor.
You have access to the following tender information. Help the user understand this tender and guide them on how to prepare.

TENDER INFORMATION:
{context}

CONVERSATION HISTORY:
{history_str}
User: {request.message}
Assistant:"""

            from utils.encryption import decrypt_val
            groq_client = get_groq_client(decrypt_val(current_user.get("groq_api_key")))
            response_text = ""
            if groq_client:
                try:
                    response = await asyncio.to_thread(
                        groq_client.chat.completions.create,
                        model="llama-3.1-8b-instant",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3,
                        max_tokens=1000,
                        timeout=10.0,
                    )
                    response_text = response.choices[0].message.content
                except Exception as e:
                    logger.error(f"Groq tender chat call failed: {e}")
                    raise HTTPException(
                        status_code=503,
                        detail="AI service temporarily unavailable — please retry in a moment"
                    )
            else:
                response_text = f"Regarding the tender '{tender.get('title')}' by {tender.get('department')}: The budget is Rs. {tender.get('budget')}. Since you haven't run a full analysis yet, click the 'Analyze' button to check if your company profile meets the experience and turnover criteria!"
                
            return {
                "response": response_text,
                "analysis_id": analysis_id,
                "sources": ["Tender Details"],
                "timestamp": datetime.utcnow()
            }
            
        raise HTTPException(status_code=404, detail="Analysis or Tender not found")
        
    if analysis["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this analysis")
        
    state = analysis.get("result") or {}
    
    # Extract key statistics and content
    elig = state.get("eligibility_result") or {}
    bid = state.get("bid_prediction") or {}
    risk = state.get("risk_report") or {}
    proposal = state.get("proposal_draft") or {}
    gaps = state.get("gaps") or []
    
    elig_score = float(elig.get("overall_score", 0.0)) * 100
    win_prob = float(bid.get("win_probability", 0.0)) * 100
    risk_level = risk.get("overall_risk", "Medium")
    missing_items = elig.get("missing_items", [])
    
    # Build rich context from full analysis state
    context = f"""
TENDER TITLE: {state.get('tender_title', 'Unknown Tender')}
ELIGIBILITY SCORE: {elig_score:.1f}%
WIN PROBABILITY: {win_prob:.1f}%
RISK LEVEL: {risk_level}
CRITICAL GAPS: {', '.join([g.get('requirement', '') for g in gaps if g.get('gap_type') == 'critical'])}
MISSING ITEMS: {', '.join(missing_items)}

CURRENT PROPOSAL EXCERPT (Executive Summary):
{proposal.get('executive_summary', 'No executive summary draft available.')}

CURRENT PROPOSAL EXCERPT (Technical Proposal):
{proposal.get('technical_proposal', 'No technical proposal draft available.')}
"""

    history_str = ""
    for msg in request.history[-5:]:
        history_str += f"{msg.role.capitalize()}: {msg.content}\n"
        
    prompt = f"""You are an expert government tender and bid writing consultant.
You have access to the following tender analysis context. Help the user improve their bid.
Always be specific, professional, and actionable. Reference actual numbers and terms from the analysis.

ANALYSIS CONTEXT:
{context}

CONVERSATION HISTORY:
{history_str}
User: {request.message}
Assistant:"""

    from utils.encryption import decrypt_val
    groq_client = get_groq_client(decrypt_val(current_user.get("groq_api_key")))
    response_text = ""
    if groq_client:
        try:
            response = await asyncio.to_thread(
                groq_client.chat.completions.create,
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1000,
                timeout=10.0,
            )
            response_text = response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq co-pilot call failed: {e}")
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable — please retry in a moment"
            )
    else:
        # Fallback simulation
        response_text = f"Here is a recommendation for NIC tender. Your win probability is {win_prob:.1f}%. You should address the missing certifications like CMMI Level 3 by forming a consortium."
        
    return {
        "response": response_text,
        "analysis_id": analysis_id,
        "sources": ["Analysis Report", "Proposal Draft"],
        "timestamp": datetime.utcnow()
    }
