from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from database import mongodb
from auth import get_current_user
from collections import Counter
from statistics import mean

router = APIRouter()

@router.get("/analytics/summary")
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    analyses = await mongodb.find_many("analyses", {"user_id": user_id}, limit=1000)
    
    if not analyses:
        return {
            "total_analyses": 0,
            "avg_eligibility_score": 0.0,
            "avg_win_probability": 0.0,
            "highest_score": 0.0,
            "most_common_gaps": [],
            "tenders_by_category": {},
            "score_trend": [],
            "eligible_rate": 0.0
        }
        
    eligibility_scores = []
    win_probs = []
    all_gaps = []
    categories = []
    
    for a in analyses:
        res = a.get("result") or {}
        elig = res.get("eligibility_result") or {}
        bid = res.get("bid_prediction") or {}
        gaps_list = res.get("gaps") or []
        
        # Check overall score
        score = elig.get("overall_score")
        if score is not None:
            eligibility_scores.append(float(score))
            
        wp = bid.get("win_probability")
        if wp is not None:
            win_probs.append(float(wp))
            
        for g in gaps_list:
            req = g.get("requirement")
            if req:
                all_gaps.append(req)
                
        # Category composition
        tender_metadata = res.get("tender_metadata") or {}
        cat = tender_metadata.get("category") or "Unknown"
        categories.append(cat)
        
    gap_frequency = Counter(all_gaps).most_common(10)
    category_counts = Counter(categories)
    
    # Calculate eligible rate (score >= 0.6)
    eligible_count = sum(1 for s in eligibility_scores if s >= 0.60)
    eligible_rate = eligible_count / len(eligibility_scores) if eligibility_scores else 0.0
    
    # Get last 10 sorted by date
    sorted_analyses = sorted(
        [a for a in analyses if a.get("created_at")], 
        key=lambda x: x["created_at"]
    )
    
    score_trend = []
    for a in sorted_analyses[-10:]:
        res = a.get("result") or {}
        elig = res.get("eligibility_result") or {}
        bid = res.get("bid_prediction") or {}
        created_at_dt = a.get("created_at")
        date_str = created_at_dt.strftime("%Y-%m-%d") if created_at_dt else ""
        
        score_trend.append({
            "date": date_str,
            "tender": a.get("tender_title", "")[:30],
            "eligibility": float(elig.get("overall_score") or 0.0),
            "win_probability": float(bid.get("win_probability") or 0.0)
        })
        
    return {
        "total_analyses": len(analyses),
        "avg_eligibility_score": round(mean(eligibility_scores), 3) if eligibility_scores else 0.0,
        "avg_win_probability": round(mean(win_probs), 3) if win_probs else 0.0,
        "highest_score": max(eligibility_scores) if eligibility_scores else 0.0,
        "most_common_gaps": [{"gap": g, "count": c} for g, c in gap_frequency],
        "tenders_by_category": dict(category_counts),
        "score_trend": score_trend,
        "eligible_rate": round(eligible_rate, 3)
    }
