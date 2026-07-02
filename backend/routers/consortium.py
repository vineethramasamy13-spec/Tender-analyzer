from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from database import mongodb
from auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter()

class ConsortiumProfileIn(BaseModel):
    open_to_consortium: bool = True
    can_provide: List[str]   # ["ISO 27001", "CMMI Level 3", "5 years experience"]
    looking_for: List[str]   # ["cloud partner", "hardware partner"]
    contact_email: str

@router.post("/consortium/register")
async def register_for_consortium(profile: ConsortiumProfileIn, current_user: dict = Depends(get_current_user)):
    """Register company for consortium pool."""
    profile_dict = profile.dict()
    profile_dict["company_id"] = current_user["user_id"]
    profile_dict["company_name"] = current_user["name"]
    await mongodb.upsert_consortium_profile(profile_dict)
    return {"registered": True}

@router.get("/consortium/match/{analysis_id}")
async def find_consortium_partners(analysis_id: str, current_user: dict = Depends(get_current_user)):
    """Find consortium partners to fill critical gaps in the tender requirements."""
    analysis = await mongodb.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    if analysis["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    state = analysis.get("result") or {}
    gaps = state.get("gaps") or []
    elig = state.get("eligibility_result") or {}
    
    # Identify requirements we are missing
    critical_gaps = [
        g["requirement"] for g in gaps 
        if g.get("gap_type") == "critical" and "Not Available" in g.get("current_status", "")
    ]
    
    # Also add missing certifications or items
    missing_items = elig.get("missing_items", [])
    all_gaps = list(set(critical_gaps + missing_items))
    
    if not all_gaps:
        # Fallback to general list of gaps if none marked critical/missing
        all_gaps = [g["requirement"] for g in gaps[:3]]
        
    if not all_gaps:
        return {
            "critical_gaps": [],
            "potential_partners": [],
            "message": "No requirements gaps identified for this tender. Consortium not required."
        }
        
    # Query companies providing any of these requirements
    partners = await mongodb.find_companies_with_capabilities(all_gaps)
    
    # Calculate matching details
    matched_partners = []
    for p in partners:
        # Prevent matching with oneself
        if p["company_id"] == current_user["user_id"]:
            continue
            
        can_fill = [c for c in p.get("can_provide", []) if c in all_gaps]
        match_score = len(can_fill) / len(all_gaps) if all_gaps else 0.0
        
        matched_partners.append({
            "company_id": p["company_id"],
            "company": p["company_name"],
            "can_fill": can_fill,
            "contact": p["contact_email"],
            "match_score": round(match_score, 3)
        })
        
    # Sort by match score desc
    matched_partners.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {
        "critical_gaps": all_gaps,
        "potential_partners": matched_partners
    }
