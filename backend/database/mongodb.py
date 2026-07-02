"""
Async MongoDB connection and CRUD helpers using motor.
Supports MongoDB Atlas and local MongoDB instances.
"""

from __future__ import annotations

import logging
import json
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel
from bson import ObjectId
from bson.errors import InvalidId

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


# ---------------------------------------------------------------------------
# Connection management
# ---------------------------------------------------------------------------

async def connect_to_mongodb(uri: str, db_name: str) -> None:
    """Create MongoDB client and verify connection."""
    global _client, _db
    try:
        _client = AsyncIOMotorClient(
            uri,
            maxPoolSize=20,
            minPoolSize=5,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            retryWrites=True
        )
        _db = _client[db_name]
        # Ping to verify connection
        await _client.admin.command("ping")
        logger.info(f"✅ Connected to MongoDB: {db_name}")
        await _create_indexes()
    except Exception as exc:
        logger.warning(f"⚠️  MongoDB connection failed ({exc}). Running with in-memory fallback.")
        _client = None
        _db = None
        
        # Populate default user in-memory
        try:
            from auth import get_password_hash
            default_user = {
                "user_id": "default-user-id-12345",
                "name": "Default User",
                "email": "user@example.com",
                "hashed_password": get_password_hash("password123"),
            }
            # Clear previous to prevent duplicate appends on repeat connections
            _memory_store["users"] = [default_user]
            logger.info("💡 Populated default in-memory user: user@example.com / password123")
        except Exception as auth_exc:
            logger.error(f"Failed to create default in-memory user: {auth_exc}")
            
        try:
            _load_cache()
        except Exception as cache_exc:
            logger.error(f"Failed to load tenders cache on startup: {cache_exc}")


async def close_mongodb() -> None:
    """Close the MongoDB client."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed.")


def get_database() -> Optional[AsyncIOMotorDatabase]:
    """Return the active database instance (may be None if not connected)."""
    return _db


# ---------------------------------------------------------------------------
# In-memory fallback store
# ---------------------------------------------------------------------------
_memory_store: Dict[str, List[Dict]] = {
    "users": [],
    "tenders": [],
    "schemes": [],
    "business_profiles": [],
    "eligibility_results": [],
    "reports": [],
    "agent_logs": [],
    "notifications": [],
    "analyses": [],
}

CACHE_FILE = Path(__file__).resolve().parent.parent / "tenders_cache.json"

# Dirty flag for debounced cache writes — avoids flushing on every bulk tender insert
_cache_dirty: bool = False

def _load_cache():
    global _memory_store
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for col in data:
                    if col in _memory_store:
                        for doc in data[col]:
                            for k, v in list(doc.items()):
                                if isinstance(v, str) and (k.endswith("_at") or k == "created_at" or k == "updated_at"):
                                    try:
                                        doc[k] = datetime.fromisoformat(v)
                                    except Exception:
                                        pass
                        _memory_store[col] = data[col]
            logger.info(f"💡 Loaded in-memory database cache from: {CACHE_FILE}")
        except Exception as e:
            logger.error(f"Failed to load tenders cache: {e}")

def _save_cache():
    try:
        class CustomJSONEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                try:
                    return super().default(obj)
                except TypeError:
                    return str(obj)

        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(_memory_store, f, indent=2, cls=CustomJSONEncoder)
    except Exception as e:
        logger.error(f"Failed to save tenders cache: {e}")


def _get_memory_collection(collection_name: str) -> List[Dict]:
    if collection_name not in _memory_store:
        _memory_store[collection_name] = []
    return _memory_store[collection_name]


# ---------------------------------------------------------------------------
# Index creation
# ---------------------------------------------------------------------------

async def _create_indexes() -> None:
    """Create necessary indexes on all collections."""
    if _db is None:
        return
    try:
        # tenders
        await _db.tenders.create_indexes([
            IndexModel([("category", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("deadline", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
            IndexModel([("department", ASCENDING)]),
        ])
        # analyses
        await _db.analyses.create_indexes([
            IndexModel([("analysis_id", ASCENDING)], unique=True),
            IndexModel([("company_id", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])
        # business_profiles
        await _db.business_profiles.create_indexes([
            IndexModel([("company_id", ASCENDING)], unique=True),
        ])
        # reports
        await _db.reports.create_indexes([
            IndexModel([("analysis_id", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])
        # schemes
        await _db.schemes.create_indexes([
            IndexModel([("name", ASCENDING)]),
            IndexModel([("provider", ASCENDING)]),
        ])
        logger.info("✅ MongoDB indexes created.")
    except Exception as exc:
        logger.warning(f"Index creation warning: {exc}")


# ---------------------------------------------------------------------------
# Generic CRUD helpers
# ---------------------------------------------------------------------------

def _serialize_doc(doc: Dict) -> Dict:
    """Convert ObjectId to string for JSON serialisation."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


async def insert_one(collection_name: str, document: Dict) -> str:
    """Insert a single document; returns the inserted id as string."""
    document.setdefault("created_at", datetime.utcnow())
    document.setdefault("updated_at", datetime.utcnow())

    if _db is not None:
        result = await _db[collection_name].insert_one(document)
        return str(result.inserted_id)
    else:
        import uuid
        doc_id = document.get("_id") or str(uuid.uuid4())
        document["_id"] = doc_id
        _get_memory_collection(collection_name).append(document.copy())
        # Mark cache as dirty; important writes (users, profiles) flush immediately
        if collection_name in ("users", "business_profiles"):
            _save_cache()
        else:
            global _cache_dirty
            _cache_dirty = True
        return doc_id


def _match_memory_document(doc: Dict, query: Dict) -> bool:
    """Helper to check if in-memory document matches MongoDB-like query (including basic operators like $gte, $lte, $in, $ne)."""
    for k, v in query.items():
        if isinstance(v, dict):
            # Check MongoDB operators
            val = doc.get(k)
            for op, op_val in v.items():
                if op == "$gte":
                    if val is None or val < op_val:
                        return False
                elif op == "$lte":
                    if val is None or val > op_val:
                        return False
                elif op == "$gt":
                    if val is None or val <= op_val:
                        return False
                elif op == "$lt":
                    if val is None or val >= op_val:
                        return False
                elif op == "$ne":
                    if val == op_val:
                        return False
                elif op == "$in":
                    if not isinstance(op_val, (list, set, tuple)) or val not in op_val:
                        return False
                elif op == "$nin":
                    if not isinstance(op_val, (list, set, tuple)) or val in op_val:
                        return False
                else:
                    if val != op_val:
                        return False
        else:
            if doc.get(k) != v:
                return False
    return True


# Default mock analyses for a user
def get_mock_analyses(user_id: str) -> List[Dict]:
    from datetime import datetime, timedelta
    base_date = datetime.utcnow()
    return [
        {
            "_id": "ANL-0140",
            "analysis_id": "ANL-0140",
            "user_id": user_id,
            "company_id": user_id,
            "status": "completed",
            "tender_title": "NIC Integrated e-Governance Platform",
            "created_at": base_date - timedelta(days=2),
            "updated_at": base_date - timedelta(days=2),
            "result": {
                "tender_title": "NIC Integrated e-Governance Platform",
                "business_profile": {
                    "name": "TechVenture Solutions Pvt Ltd",
                    "turnover": 180,
                    "company_type": "startup"
                },
                "eligibility_result": {
                    "overall_score": 0.78,
                    "experience_match": 0.60,
                    "turnover_match": 0.70,
                    "cert_match": 0.80,
                    "tech_match": 0.90,
                    "missing_items": ["CMMI Level 3 Certification"],
                    "eligible": True
                },
                "gaps": [
                    {"requirement": "CMMI Level 3", "current_status": "Missing", "gap_type": "critical", "recommendation": "Partner with a certified firm"},
                    {"requirement": "ISO 27001", "current_status": "Missing", "gap_type": "important", "recommendation": "Obtain within 6 months"}
                ],
                "cost_estimate": {
                    "development_cost": 8500000,
                    "infrastructure_cost": 3200000,
                    "team_cost": 4500000,
                    "operational_cost": 2800000,
                    "total": 19000000,
                    "margin_recommendation": 15.0
                },
                "risk_report": {
                    "overall_risk": "Medium",
                    "mitigation": ["Maintain financial buffer", "Ensure key backups"]
                },
                "bid_prediction": {
                    "win_probability": 0.78,
                    "confidence": "Medium",
                    "recommendation": "Apply with Improvements"
                },
                "proposal_draft": {
                    "executive_summary": "TechVenture Solutions Pvt Ltd proposes to develop a state-of-the-art citizen portal for the government.",
                    "technical_proposal": "Our solution uses a modern React + Node.js stack with headless CMS.",
                    "scope_of_work": "Milestones include design, implementation, testing, and 12-month support.",
                    "project_plan": "Phase 1: Discovery. Phase 2: Design. Phase 3: Core development.",
                    "budget_template": "Development: 85L, Infrastructure: 32L, Operations: 28L.",
                    "compliance_checklist": ["ISO 9001", "ISO 27001", "Udyam registration"]
                }
            }
        },
        {
            "_id": "ANL-0141",
            "analysis_id": "ANL-0141",
            "user_id": user_id,
            "company_id": user_id,
            "status": "completed",
            "tender_title": "DRDO Cybersecurity Infrastructure Upgrade",
            "created_at": base_date - timedelta(days=5),
            "updated_at": base_date - timedelta(days=5),
            "result": {
                "tender_title": "DRDO Cybersecurity Infrastructure Upgrade",
                "business_profile": {
                    "name": "TechVenture Solutions Pvt Ltd",
                    "turnover": 180,
                    "company_type": "startup"
                },
                "eligibility_result": {
                    "overall_score": 0.92,
                    "experience_match": 0.90,
                    "turnover_match": 0.95,
                    "cert_match": 0.90,
                    "tech_match": 0.95,
                    "missing_items": [],
                    "eligible": True
                },
                "gaps": [],
                "cost_estimate": {
                    "development_cost": 5000000,
                    "infrastructure_cost": 8000000,
                    "team_cost": 3000000,
                    "operational_cost": 1000000,
                    "total": 17000000,
                    "margin_recommendation": 18.0
                },
                "risk_report": {
                    "overall_risk": "Low",
                    "mitigation": ["Monitor client requirements closely"]
                },
                "bid_prediction": {
                    "win_probability": 0.85,
                    "confidence": "High",
                    "recommendation": "Apply Immediately"
                },
                "proposal_draft": {
                    "executive_summary": "TechVenture Solutions Pvt Ltd proposes to secure the DRDO network with state-of-the-art SOC.",
                    "technical_proposal": "Our solution uses a modern SIEM + SOAR system.",
                    "scope_of_work": "Milestones include SOC setup, testing, and 24x7 monitoring.",
                    "project_plan": "Phase 1: Setup. Phase 2: Configuration. Phase 3: Live runs.",
                    "budget_template": "SOC: 80L, Support: 30L, Infrastructure: 50L.",
                    "compliance_checklist": ["ISO 27001", "SOC 2 Type II"]
                }
            }
        }
    ]

async def find_one(collection_name: str, query: Dict) -> Optional[Dict]:
    """Find a single document matching the query."""
    doc = None
    if _db is not None:
        raw_doc = await _db[collection_name].find_one(query)
        doc = _serialize_doc(raw_doc) if raw_doc else None
    else:
        col = _get_memory_collection(collection_name)
        for d in col:
            if _match_memory_document(d, query):
                doc = d.copy()
                break
                
    if not doc and collection_name == "analyses":
        # Check if query targets a specific mock analysis ID
        analysis_id = query.get("analysis_id")
        if analysis_id and analysis_id.startswith("ANL-"):
            user_id = query.get("user_id", "default-user-id-12345")
            mocks = get_mock_analyses(user_id)
            for m in mocks:
                if m["analysis_id"] == analysis_id:
                    doc = m.copy()
                    break
    return doc


async def find_many(
    collection_name: str,
    query: Dict,
    limit: int = 100,
    skip: int = 0,
    sort_by: str = "created_at",
    sort_order: int = DESCENDING,
) -> List[Dict]:
    """Find multiple documents matching the query."""
    res = []
    if _db is not None:
        cursor = _db[collection_name].find(query).sort(sort_by, sort_order).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        res = [_serialize_doc(d) for d in docs]
    else:
        col = _get_memory_collection(collection_name)
        results = []
        for doc in col:
            if _match_memory_document(doc, query):
                results.append(doc.copy())
        res = results[skip: skip + limit]
        
    if not res:
        if collection_name == "analyses":
            # Only return mock analyses for the designated mock user to avoid data leaks
            user_id = query.get("user_id", "")
            if user_id == "mock-user-1":
                res = [m.copy() for m in get_mock_analyses(user_id)]
        elif collection_name == "schemes":
            try:
                from rag.chromadb_setup import SCHEME_DATA
                res = [s.copy() for s in SCHEME_DATA]
            except Exception:
                res = []
    return res


async def update_one(collection_name: str, query: Dict, update: Dict) -> bool:
    """Update a single document. Returns True if matched."""
    update.setdefault("$set", {})["updated_at"] = datetime.utcnow()

    if _db is not None:
        result = await _db[collection_name].update_one(query, update)
        return result.matched_count > 0
    else:
        col = _get_memory_collection(collection_name)
        for doc in col:
            if _match_memory_document(doc, query):
                set_vals = update.get("$set", {})
                doc.update(set_vals)
                # Flush immediately for user/profile updates for consistency
                if collection_name in ("users", "business_profiles"):
                    _save_cache()
                else:
                    global _cache_dirty
                    _cache_dirty = True
                return True
        return False


async def delete_one(collection_name: str, query: Dict) -> bool:
    """Delete a single document. Returns True if deleted."""
    if _db is not None:
        result = await _db[collection_name].delete_one(query)
        return result.deleted_count > 0
    else:
        col = _get_memory_collection(collection_name)
        for i, doc in enumerate(col):
            if _match_memory_document(doc, query):
                col.pop(i)
                global _cache_dirty
                _cache_dirty = True
                return True
        return False


async def delete_many(collection_name: str, query: Dict) -> int:
    """Delete multiple documents. Returns number of deleted documents."""
    if _db is not None:
        result = await _db[collection_name].delete_many(query)
        return result.deleted_count
    else:
        col = _get_memory_collection(collection_name)
        initial_len = len(col)
        new_col = [d for d in col if not _match_memory_document(d, query)]
        _memory_store[collection_name] = new_col
        global _cache_dirty
        _cache_dirty = True
        return initial_len - len(new_col)


async def flush_cache_if_dirty() -> None:
    """Flush in-memory store to disk only when there are pending changes."""
    global _cache_dirty
    if _cache_dirty:
        _save_cache()
        _cache_dirty = False
        logger.debug("Cache flushed to disk.")



async def count_documents(collection_name: str, query: Dict) -> int:
    """Count documents matching query."""
    count = 0
    if _db is not None:
        count = await _db[collection_name].count_documents(query)
    else:
        col = _get_memory_collection(collection_name)
        for doc in col:
            if _match_memory_document(doc, query):
                count += 1
        # For analyses, also count mock entries if the query targets mock-user-1
        if count == 0 and collection_name == "analyses":
            user_id = query.get("user_id", query.get("company_id", ""))
            if user_id == "mock-user-1":
                count = len(get_mock_analyses(user_id))
    return count


# ---------------------------------------------------------------------------
# Domain-specific CRUD
# ---------------------------------------------------------------------------

# ---- Users ----------------------------------------------------------------

async def create_user(user_data: Dict) -> str:
    return await insert_one("users", user_data)


async def get_user_by_email(email: str) -> Optional[Dict]:
    return await find_one("users", {"email": email})


async def get_user_by_id(user_id: str) -> Optional[Dict]:
    return await find_one("users", {"user_id": user_id})


# ---- Business Profiles ----------------------------------------------------

async def save_business_profile(profile: Dict) -> str:
    existing = await find_one("business_profiles", {"company_id": profile.get("company_id")})
    if existing:
        await update_one(
            "business_profiles",
            {"company_id": profile["company_id"]},
            {"$set": profile},
        )
        return profile["company_id"]
    return await insert_one("business_profiles", profile)


async def get_business_profile(company_id: str) -> Optional[Dict]:
    return await find_one("business_profiles", {"company_id": company_id})


# ---- Tenders --------------------------------------------------------------

async def save_tender(tender: Dict) -> str:
    return await insert_one("tenders", tender)


async def get_tender(tender_id: str) -> Optional[Dict]:
    return await find_one("tenders", {"tender_id": tender_id})


async def get_tenders(filters: Dict = None, limit: int = 500, skip: int = 0) -> List[Dict]:
    return await find_many("tenders", filters or {}, limit=limit, skip=skip)


async def update_tender(tender_id: str, update_data: Dict) -> bool:
    return await update_one("tenders", {"tender_id": tender_id}, {"$set": update_data})


# ---- Analyses -------------------------------------------------------------

async def create_analysis_record(
    analysis_id: str,
    user_id: str,
    status: str = "queued",
    tender_title: str = "Tender Analysis",
) -> str:
    """Create a new analysis record with initial status."""
    document = {
        "analysis_id": analysis_id,
        "user_id": user_id,
        "status": status,
        "tender_title": tender_title,
        "result": None,
        "error": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    return await insert_one("analyses", document)


async def update_analysis_status(
    analysis_id: str,
    status: str,
    result: Optional[Dict] = None,
    error: Optional[str] = None,
) -> bool:
    """Update the status (and optionally result/error) of an existing analysis record."""
    update_fields: Dict[str, Any] = {"status": status, "updated_at": datetime.utcnow()}
    if result is not None:
        update_fields["result"] = result
        # Store pdf_report_path at top level for easier access in download endpoint
        if isinstance(result, dict):
            if result.get("pdf_report_path"):
                update_fields["pdf_report_path"] = result["pdf_report_path"]
            if result.get("tender_title"):
                update_fields["tender_title"] = result["tender_title"]
            elif result.get("tender_metadata", {}).get("title"):
                update_fields["tender_title"] = result["tender_metadata"]["title"]
    if error is not None:
        update_fields["error"] = error
    if status == "completed":
        update_fields["completed_at"] = datetime.utcnow()

    return await update_one("analyses", {"analysis_id": analysis_id}, {"$set": update_fields})


async def save_analysis(analysis: Dict) -> str:
    existing = await find_one("analyses", {"analysis_id": analysis.get("analysis_id")})
    if existing:
        await update_one(
            "analyses",
            {"analysis_id": analysis["analysis_id"]},
            {"$set": analysis},
        )
        return analysis["analysis_id"]
    return await insert_one("analyses", analysis)


async def get_analysis(analysis_id: str) -> Optional[Dict]:
    return await find_one("analyses", {"analysis_id": analysis_id})


async def get_analyses_by_company(company_id: str, limit: int = 20) -> List[Dict]:
    return await find_many("analyses", {"company_id": company_id}, limit=limit)


# ---- Reports --------------------------------------------------------------

async def save_report(report: Dict) -> str:
    return await insert_one("reports", report)


async def get_report(analysis_id: str) -> Optional[Dict]:
    return await find_one("reports", {"analysis_id": analysis_id})


# ---- Schemes --------------------------------------------------------------

async def save_scheme(scheme: Dict) -> str:
    return await insert_one("schemes", scheme)


async def get_schemes(filters: Dict = None) -> List[Dict]:
    return await find_many("schemes", filters or {}, limit=100)


# ---- Agent Logs -----------------------------------------------------------

async def save_agent_log(log: Dict) -> str:
    return await insert_one("agent_logs", log)


async def get_agent_logs(analysis_id: str) -> List[Dict]:
    return await find_many("agent_logs", {"analysis_id": analysis_id})


# ---- Notifications --------------------------------------------------------

async def create_notification(notification: Dict) -> str:
    return await insert_one("notifications", notification)


async def get_notifications(user_id: str, unread_only: bool = False) -> List[Dict]:
    query: Dict = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    return await find_many("notifications", query)


# ---- Dashboard stats ------------------------------------------------------

async def get_dashboard_stats(company_id: Optional[str] = None) -> Dict:
    """Aggregate dashboard statistics."""
    query = {}
    if company_id:
        query["company_id"] = company_id

    total_analyses = await count_documents("analyses", query)
    total_tenders = await count_documents("tenders", {})
    total_reports = await count_documents("reports", query)

    # Recent analyses
    recent = await find_many("analyses", query, limit=5)

    # Compute average win probability from stored analyses
    all_analyses = await find_many("analyses", query, limit=500)
    win_probs = []
    high_prob_count = 0
    for a in all_analyses:
        bid = a.get("bid_prediction") or {}
        wp = bid.get("win_probability", 0)
        if wp:
            win_probs.append(wp)
            if wp >= 0.65:
                high_prob_count += 1

    avg_wp = sum(win_probs) / len(win_probs) if win_probs else 0.0

    return {
        "total_tenders_analyzed": total_analyses,
        "total_tenders_discovered": total_tenders,
        "average_win_probability": round(avg_wp, 3),
        "high_probability_tenders": high_prob_count,
        "schemes_matched": await count_documents("schemes", {}),
        "reports_generated": total_reports,
        "recent_analyses": recent,
    }


# ---- Watchlist ------------------------------------------------------------

async def add_watchlist_item(item: Dict) -> str:
    # item: {tender_id, user_id, notify_days_before, added_at}
    existing = await find_one("watchlist", {"tender_id": item["tender_id"], "user_id": item["user_id"]})
    if existing:
        return existing["_id"]
    return await insert_one("watchlist", item)


async def remove_watchlist_item(tender_id: str, user_id: str) -> bool:
    return await delete_one("watchlist", {"tender_id": tender_id, "user_id": user_id})


async def get_watchlist_by_user(user_id: str) -> List[Dict]:
    items = await find_many("watchlist", {"user_id": user_id})
    # Fetch actual tender details for each item
    watchlist_tenders = []
    for item in items:
        tender = await get_tender(item["tender_id"])
        if tender:
            # calculate days to deadline
            from datetime import datetime
            days_to_deadline = 30 # default
            if tender.get("deadline"):
                try:
                    deadline_date = datetime.strptime(tender["deadline"], "%Y-%m-%d")
                    days_to_deadline = (deadline_date - datetime.utcnow()).days
                except Exception:
                    pass
            watchlist_tenders.append({
                **tender,
                "watchlist_item_id": item["_id"],
                "notify_days_before": item.get("notify_days_before", 7),
                "days_to_deadline": days_to_deadline
            })
    return watchlist_tenders


async def get_all_watchlist_items() -> List[Dict]:
    return await find_many("watchlist", {}, limit=1000)


# ---- Saved Searches -------------------------------------------------------

async def save_search(search: Dict) -> str:
    return await insert_one("saved_searches", search)


async def get_saved_searches(user_id: str) -> List[Dict]:
    return await find_many("saved_searches", {"user_id": user_id})


async def get_all_active_saved_searches() -> List[Dict]:
    return await find_many("saved_searches", {"notify_new_matches": True}, limit=1000)


async def get_tenders_added_today() -> List[Dict]:
    # Returns tenders created today
    from datetime import datetime, timedelta
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if _db is not None:
        cursor = _db.tenders.find({"created_at": {"$gte": today}})
        docs = await cursor.to_list(length=100)
        return [_serialize_doc(d) for d in docs]
    else:
        col = _get_memory_collection("tenders")
        return [t.copy() for t in col if t.get("created_at", today) >= today]


# ---- Consortium Profiles --------------------------------------------------

async def upsert_consortium_profile(profile: Dict) -> str:
    existing = await find_one("consortium_profiles", {"company_id": profile.get("company_id")})
    if existing:
        await update_one(
            "consortium_profiles",
            {"company_id": profile["company_id"]},
            {"$set": profile},
        )
        return profile["company_id"]
    return await insert_one("consortium_profiles", profile)


async def find_companies_with_capabilities(capabilities: List[str]) -> List[Dict]:
    # Match consortium profiles that can provide any of the capabilities needed
    if _db is not None:
        # Match where can_provide shares any element with capabilities
        cursor = _db.consortium_profiles.find({
            "can_provide": {"$in": capabilities},
            "open_to_consortium": True
        })
        docs = await cursor.to_list(length=50)
        return [_serialize_doc(d) for d in docs]
    else:
        col = _get_memory_collection("consortium_profiles")
        results = []
        for profile in col:
            if not profile.get("open_to_consortium", False):
                continue
            can_fill = [c for c in profile.get("can_provide", []) if c in capabilities]
            if can_fill:
                results.append(profile.copy())
        return results


# ---- Team Workspace -------------------------------------------------------

async def save_workspace(workspace: Dict) -> str:
    workspace_id = workspace.get("workspace_id")
    existing = await find_one("workspaces", {"workspace_id": workspace_id})
    if existing:
        await update_one("workspaces", {"workspace_id": workspace_id}, {"$set": workspace})
        return workspace_id
    return await insert_one("workspaces", workspace)


async def get_workspace(workspace_id: str) -> Optional[Dict]:
    return await find_one("workspaces", {"workspace_id": workspace_id})


async def add_workspace_member(workspace_id: str, user_id: str) -> bool:
    if _db is not None:
        result = await _db.workspaces.update_one(
            {"workspace_id": workspace_id},
            {"$addToSet": {"members": user_id}}
        )
        return result.modified_count > 0
    else:
        workspace = await find_one("workspaces", {"workspace_id": workspace_id})
        if workspace:
            members = workspace.get("members", [])
            if user_id not in members:
                members.append(user_id)
                workspace["members"] = members
                return True
        return False


async def share_analysis_to_workspace(workspace_id: str, analysis_id: str) -> bool:
    if _db is not None:
        result = await _db.workspaces.update_one(
            {"workspace_id": workspace_id},
            {"$addToSet": {"shared_analyses": analysis_id}}
        )
        return result.modified_count > 0
    else:
        workspace = await find_one("workspaces", {"workspace_id": workspace_id})
        if workspace:
            shared = workspace.get("shared_analyses", [])
            if analysis_id not in shared:
                shared.append(analysis_id)
                workspace["shared_analyses"] = shared
                return True
        return False


async def save_comment(comment: Dict) -> str:
    return await insert_one("comments", comment)


async def get_comments(analysis_id: str) -> List[Dict]:
    return await find_many("comments", {"analysis_id": analysis_id})


async def resolve_comment(comment_id: str) -> bool:
    return await update_one("comments", {"comment_id": comment_id}, {"$set": {"resolved": True}})


async def get_workspace_for_analysis(analysis_id: str) -> Optional[Dict]:
    # Find workspace that has this analysis shared
    if _db is not None:
        doc = await _db.workspaces.find_one({"shared_analyses": analysis_id})
        return _serialize_doc(doc) if doc else None
    else:
        col = _get_memory_collection("workspaces")
        for ws in col:
            if analysis_id in ws.get("shared_analyses", []):
                return ws.copy()
        return None


# ---- Scheme Subscriptions -------------------------------------------------

async def subscribe_user_to_scheme(user_id: str, scheme_id: str, remind_days_before: int) -> str:
    query = {"user_id": user_id, "scheme_id": scheme_id}
    existing = await find_one("scheme_subscriptions", query)
    if existing:
        await update_one("scheme_subscriptions", query, {"$set": {"remind_days_before": remind_days_before}})
        return existing["_id"]
    return await insert_one("scheme_subscriptions", {
        "user_id": user_id,
        "scheme_id": scheme_id,
        "remind_days_before": remind_days_before
    })


async def get_scheme_subscriptions(user_id: str) -> List[Dict]:
    subs = await find_many("scheme_subscriptions", {"user_id": user_id})
    subscribed_schemes = []
    for sub in subs:
        # In a real system we fetch the scheme details from the schemes collection or a mock database
        scheme = await find_one("schemes", {"id": sub["scheme_id"]})
        if not scheme:
            # Fallback to search list
            from rag.chromadb_setup import get_scheme_by_id_mock
            scheme = get_scheme_by_id_mock(sub["scheme_id"])
        
        if scheme:
            subscribed_schemes.append({
                **scheme,
                "subscription_id": sub["_id"],
                "remind_days_before": sub.get("remind_days_before", 14)
            })
    return subscribed_schemes


async def unsubscribe_user_from_scheme(user_id: str, scheme_id: str) -> bool:
    return await delete_one("scheme_subscriptions", {"user_id": user_id, "scheme_id": scheme_id})


async def get_scheme(scheme_id: str) -> Optional[Dict]:
    scheme = await find_one("schemes", {"id": scheme_id})
    if not scheme:
        from rag.chromadb_setup import get_scheme_by_id_mock
        scheme = get_scheme_by_id_mock(scheme_id)
    return scheme


# ---- File Hashes ----------------------------------------------------------

async def get_file_by_hash(file_hash: str) -> Optional[Dict]:
    return await find_one("uploaded_files", {"_id": file_hash})


async def save_file_record(record: Dict) -> str:
    return await insert_one("uploaded_files", record)


# ---- Active Users (for Weekly Digest) --------------------------------------

async def get_all_active_users() -> List[Dict]:
    return await find_many("users", {}, limit=1000)

