"""
Agent 8: Government Scheme Recommendation Agent
"""
from datetime import datetime
from typing import Dict, Any, List
from loguru import logger


async def run_scheme_recommendation(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] SchemeRecommendation: Starting")

    try:
        profile = state.get("business_profile", {})
        
        chroma_client = None
        try:
            from config import settings
            from rag.chromadb_setup import get_chroma_client, get_relevant_schemes, initialize_scheme_data, SCHEME_DATA
            chroma_client = get_chroma_client(settings.CHROMADB_PERSIST_DIR)
            if chroma_client:
                initialize_scheme_data(chroma_client)
            schemes_raw = get_relevant_schemes(chroma_client, profile, n=8)
        except Exception:
            from rag.chromadb_setup import SCHEME_DATA
            schemes_raw = SCHEME_DATA[:8]
        
        # Format and filter schemes
        company_type = profile.get("company_type", "").lower()
        annual_turnover = float(profile.get("annual_turnover", 0))
        
        schemes = []
        for s in schemes_raw:
            match_score = float(s.get("match_score", 75.0))
            
            # Boost for company type match
            scheme_type = s.get("type", "national").lower()
            if company_type == "startup" and scheme_type == "startup":
                match_score = min(100, match_score + 10)
            elif company_type == "msme" and scheme_type == "msme":
                match_score = min(100, match_score + 10)
            
            # Filter low-relevance
            if match_score < 50:
                continue
            
            schemes.append({
                "name": s.get("name", "Unknown Scheme"),
                "provider": s.get("provider", "Government of India"),
                "benefit": s.get("benefit", "Financial support"),
                "eligibility": s.get("eligibility", "Eligible businesses"),
                "amount": s.get("amount", "Varies"),
                "deadline": s.get("deadline", "Ongoing"),
                "link": s.get("link", "india.gov.in"),
                "match_score": round(match_score, 1),
            })
        
        # Sort by match score
        schemes.sort(key=lambda x: x["match_score"], reverse=True)
        schemes = schemes[:8]  # Top 8 schemes
        
        logs.append(f"[{datetime.now().isoformat()}] SchemeRecommendation: Found {len(schemes)} matching schemes")

        return {
            **state,
            "scheme_recommendations": schemes,
            "agent_logs": logs,
            "current_step": "competitor_analysis",
        }

    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] SchemeRecommendation: Error - {str(e)}")
        return {
            **state,
            "scheme_recommendations": [],
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"SchemeRecommendation: {str(e)}"],
            "current_step": "competitor_analysis",
            "_failed": True,
        }
