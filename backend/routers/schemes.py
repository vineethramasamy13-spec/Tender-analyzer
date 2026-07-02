from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from database import mongodb
from auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.post("/schemes/{scheme_id}/subscribe")
async def subscribe_to_scheme(
    scheme_id: str,
    remind_days_before: int = 14,
    current_user: dict = Depends(get_current_user)
):
    scheme = await mongodb.get_scheme(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    subscription_id = await mongodb.subscribe_user_to_scheme(
        user_id=current_user["user_id"],
        scheme_id=scheme_id,
        remind_days_before=remind_days_before
    )
    
    # Calculate reminder date if deadline is present
    remind_at = None
    if scheme.get("deadline") and scheme["deadline"] != "Ongoing" and scheme["deadline"] != "Rolling":
        try:
            deadline = datetime.strptime(scheme["deadline"], "%Y-%m-%d")
            remind_at = deadline - timedelta(days=remind_days_before)
        except Exception:
            pass
            
    return {
        "subscribed": True,
        "subscription_id": subscription_id,
        "scheme": scheme["name"],
        "reminder_set_for": remind_at.isoformat() if remind_at else None
    }

@router.get("/schemes")
async def list_schemes(current_user: dict = Depends(get_current_user)):
    return await mongodb.get_schemes()

@router.get("/schemes/subscriptions")
async def list_subscriptions(current_user: dict = Depends(get_current_user)):
    return await mongodb.get_scheme_subscriptions(current_user["user_id"])

@router.delete("/schemes/{scheme_id}/unsubscribe")
async def unsubscribe_from_scheme(scheme_id: str, current_user: dict = Depends(get_current_user)):
    await mongodb.unsubscribe_user_from_scheme(current_user["user_id"], scheme_id)
    return {"unsubscribed": True}
