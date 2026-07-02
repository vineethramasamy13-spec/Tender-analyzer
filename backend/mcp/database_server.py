"""
Database MCP Server - MongoDB storage tools for tender analysis
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from loguru import logger
from utils.helpers import generate_id


async def store_analysis(db, analysis_data: dict) -> str:
    """Store a complete tender analysis to MongoDB."""
    try:
        analysis_id = analysis_data.get("analysis_id", generate_id())
        doc = {
            "_id": analysis_id,
            "analysis_id": analysis_id,
            **analysis_data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        await db.reports.replace_one({"_id": analysis_id}, doc, upsert=True)
        return analysis_id
    except Exception as e:
        logger.error(f"Store analysis failed: {e}")
        return generate_id()


async def retrieve_history(db, company_id: str) -> List[Dict[str, Any]]:
    """Retrieve analysis history for a company."""
    try:
        cursor = db.reports.find(
            {"business_profile.company_name": {"$regex": company_id, "$options": "i"}},
            {"_id": 0}
        ).sort("created_at", -1).limit(20)
        return await cursor.to_list(length=20)
    except Exception as e:
        logger.error(f"Retrieve history failed: {e}")
        return []


async def get_similar_historical_tenders(db, tender_text: str) -> List[Dict[str, Any]]:
    """Find similar historical tenders from database."""
    try:
        # Simple keyword-based similarity (ChromaDB handles semantic)
        keywords = tender_text.lower().split()[:10]
        query = {"$or": [{"title": {"$regex": kw, "$options": "i"}} for kw in keywords[:5]]}
        cursor = db.tenders.find(query, {"_id": 0}).limit(5)
        return await cursor.to_list(length=5)
    except Exception as e:
        logger.error(f"Similar tenders lookup failed: {e}")
        return []


async def store_tender(db, tender_data: dict) -> str:
    """Store a discovered tender to MongoDB."""
    try:
        tender_id = tender_data.get("id", generate_id())
        doc = {
            "_id": tender_id,
            **tender_data,
            "stored_at": datetime.utcnow().isoformat(),
        }
        await db.tenders.replace_one({"_id": tender_id}, doc, upsert=True)
        return tender_id
    except Exception as e:
        logger.error(f"Store tender failed: {e}")
        return generate_id()


async def get_tenders(db, filters: dict = None) -> List[Dict[str, Any]]:
    """Get tenders from database with optional filters."""
    try:
        query = {}
        if filters:
            if filters.get("category"):
                query["category"] = {"$regex": filters["category"], "$options": "i"}
            if filters.get("budget_min"):
                query["budget"] = {"$gte": float(filters["budget_min"])}
            if filters.get("budget_max"):
                if "budget" in query:
                    query["budget"]["$lte"] = float(filters["budget_max"])
                else:
                    query["budget"] = {"$lte": float(filters["budget_max"])}
        
        cursor = db.tenders.find(query, {"_id": 0}).sort("deadline", 1).limit(50)
        results = await cursor.to_list(length=50)
        return results
    except Exception as e:
        logger.error(f"Get tenders failed: {e}")
        return []


async def store_business_profile(db, profile: dict) -> str:
    """Store business profile."""
    try:
        company_id = profile.get("company_id", generate_id())
        doc = {
            "_id": company_id,
            "company_id": company_id,
            **profile,
            "updated_at": datetime.utcnow().isoformat(),
        }
        await db.business_profiles.replace_one({"_id": company_id}, doc, upsert=True)
        return company_id
    except Exception as e:
        logger.error(f"Store profile failed: {e}")
        return generate_id()


async def get_business_profile(db, company_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve business profile."""
    try:
        return await db.business_profiles.find_one({"_id": company_id}, {"_id": 0})
    except Exception as e:
        logger.error(f"Get profile failed: {e}")
        return None


async def log_agent_action(db, analysis_id: str, agent: str, message: str):
    """Log agent action to MongoDB."""
    try:
        await db.agent_logs.insert_one({
            "analysis_id": analysis_id,
            "agent": agent,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        })
    except Exception:
        pass  # Non-critical logging
