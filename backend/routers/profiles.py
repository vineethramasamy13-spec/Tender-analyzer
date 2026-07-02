from fastapi import APIRouter, Depends, HTTPException
from models.schemas import BusinessProfile
from database import mongodb
from auth import get_current_user
from typing import Dict, Any

router = APIRouter()

@router.post("/profile")
async def save_profile(profile: BusinessProfile, current_user: dict = Depends(get_current_user)):
    profile_dict = profile.model_dump()
    # Associate profile with the authenticated user ID
    profile_dict["company_id"] = current_user["user_id"]
    await mongodb.save_business_profile(profile_dict)
    return {"status": "success", "company_id": current_user["user_id"]}

@router.get("/profile/{company_id}", response_model=BusinessProfile)
async def get_profile(company_id: str, current_user: dict = Depends(get_current_user)):
    # Restrict to user's own profile
    if company_id != current_user["user_id"] and company_id != "my":
        raise HTTPException(status_code=403, detail="Not authorized to access this profile")
    
    target_id = current_user["user_id"]
    profile = await mongodb.get_business_profile(target_id)
    if not profile:
        # Return a blank template instead of failing
        return BusinessProfile(
            name=current_user["name"],
            turnover=0.0,
            annual_turnover=0.0,
            turnover_unit="lakhs",
            certifications=[],
            experience_years=0,
            team_size=1,
            industry="IT/Software",
            state="All India",
            company_type="startup"
        )
    return profile
