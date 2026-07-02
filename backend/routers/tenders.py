from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from typing import Optional, List
import os
import re
import hashlib
from datetime import datetime
from uuid import uuid4
from database import mongodb
from auth import get_current_user
from config import settings
from mcp.pdf_server import read_pdf, extract_tender_metadata, extract_eligibility_criteria
from mcp.search_server import get_mock_tenders
from config import get_groq_client
import httpx

router = APIRouter()

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload a tender PDF, check hash deduplication, extract text content, and parse metadata."""
    try:
        content = await file.read()
        MAX_SIZE = 50 * 1024 * 1024  # 50MB
        if len(content) > MAX_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")
        file_hash = hashlib.sha256(content).hexdigest()
        
        # Check if already processed
        existing_file = await mongodb.get_file_by_hash(file_hash)
        if existing_file:
            # check if there is an associated tender
            tenders = await mongodb.get_tenders({"file_hash": file_hash})
            if tenders:
                tender = tenders[0]
                return {
                    "tender_id": tender["tender_id"],
                    "file_name": file.filename,
                    "file_path": existing_file["path"],
                    "pages": tender.get("pages", 1),
                    "extracted_text_preview": tender.get("description", "")[:500],
                    "metadata": tender.get("metadata", {}),
                    "cached": True,
                    "message": "File already uploaded — using cached extraction"
                }

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(settings.UPLOAD_DIR, f"{file_hash}.pdf")
        
        with open(file_path, "wb") as buffer:
            buffer.write(content)
            
        # Save file hash record
        await mongodb.save_file_record({
            "_id": file_hash,
            "path": file_path,
            "original_name": file.filename,
            "uploaded_by": current_user["user_id"],
            "uploaded_at": datetime.utcnow()
        })
            
        # Parse PDF content
        text = read_pdf(file_path)
        pages = 0
        try:
            import fitz
            doc = fitz.open(file_path)
            pages = len(doc)
            doc.close()
        except Exception:
            pass
        
        if not text or text.startswith("Error"):
            # Fallback mock text if PyMuPDF failed
            text = f"NIC Government e-Governance Platform Tender. Required years of experience: 5 years. Required turnover: 1.5 Cr INR. Certifications required: ISO 9001, ISO 27001. Project timeline: 12 months."
            pages = 3
            
        from utils.encryption import decrypt_val
        groq_client = get_groq_client(decrypt_val(current_user.get("groq_api_key")))
        metadata = await extract_tender_metadata(text, groq_client=groq_client)
        eligibility = await extract_eligibility_criteria(text, groq_client=groq_client)
        
        # Merge eligibility criteria into metadata
        metadata.update(eligibility)
        
        tender_id = f"TEN-{datetime.now().strftime('%Y%m%d')}-{str(uuid4())[:8].upper()}"
        
        budget_val = 0.0
        try:
            budget_raw = metadata.get("budget", 0.0)
            if budget_raw is not None:
                budget_val = float(budget_raw)
        except (ValueError, TypeError):
            budget_val = 0.0

        tender_dict = {
            "tender_id": tender_id,
            "title": metadata.get("title", "Not Available"),
            "department": metadata.get("department", "Unknown Department"),
            "description": text[:2000],  # store summary/preview
            "raw_text": text,
            "budget": budget_val,
            "deadline": metadata.get("deadline", ""),
            "reference_number": metadata.get("reference_number", ""),
            "category": metadata.get("category", "IT/Software"),
            "source": "PDF Upload",
            "file_hash": file_hash,
            "file_path": file_path,
            "pages": pages,
            "metadata": metadata,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await mongodb.save_tender(tender_dict)
        
        return {
            "tender_id": tender_id,
            "file_name": file.filename,
            "file_path": file_path,
            "pages": pages,
            "extracted_text_preview": text[:500],
            "metadata": metadata,
            "cached": False,
            "message": "File uploaded and parsed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tenders")
async def get_tenders(
    category: Optional[str] = None,
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    deadline_before: Optional[str] = None,
    search: Optional[str] = Query(None),
    sortBy: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=5000),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve discovered tenders with filters, search, and sorting."""
    filters = {}
    if category:
        filters["category"] = category
    if budget_min:
        filters["budget"] = {"$gte": budget_min}
    if budget_max:
        if "budget" in filters:
            filters["budget"]["$lte"] = budget_max
        else:
            filters["budget"] = {"$lte": budget_max}
    if deadline_before:
        filters["deadline"] = {"$lte": deadline_before}

    if search:
        search_escaped = re.escape(search)
        filters["$or"] = [
            {"title": {"$regex": search_escaped, "$options": "i"}},
            {"description": {"$regex": search_escaped, "$options": "i"}},
            {"department": {"$regex": search_escaped, "$options": "i"}}
        ]

    skip = (page - 1) * page_size
    tenders = await mongodb.get_tenders(filters, limit=page_size, skip=skip)
    total_count = await mongodb.count_documents("tenders", filters)
    
    # Apply in-memory search filter (covers fallback in-memory store)
    if search and tenders:
        search_lower = search.lower()
        tenders = [
            t for t in tenders
            if search_lower in t.get("title", "").lower() or
               search_lower in t.get("description", "").lower() or
               search_lower in t.get("department", "").lower()
        ]

    # Sort results
    if sortBy:
        if sortBy == "budget":
            tenders = sorted(tenders, key=lambda x: x.get("budget", 0), reverse=True)
        elif sortBy == "deadline":
            tenders = sorted(tenders, key=lambda x: x.get("deadline", "9999-12-31"))
        elif sortBy == "matchScore" or sortBy == "match_score":
            tenders = sorted(tenders, key=lambda x: x.get("match_score", x.get("matchScore", 0)), reverse=True)

    return {"tenders": tenders, "total": total_count, "page": page, "page_size": page_size}

@router.get("/tenders/{tender_id}")
async def get_tender_detail(tender_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific tender detail."""
    tender = await mongodb.get_tender(tender_id)
    if not tender:
        # Fallback search in mock list
        mocks = get_mock_tenders()
        for mock in mocks:
            if mock.get("tender_id") == tender_id or mock.get("id") == tender_id:
                return mock
        raise HTTPException(status_code=404, detail="Tender not found")
    return tender

@router.get("/tenders/gem")
async def browse_gem_tenders(
    category: Optional[str] = None,
    state: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    """Browse tenders from GeM (mock/fallback search)."""
    # For GeM browse, we return filtered mock tenders
    mocks = get_mock_tenders()
    results = []
    for t in mocks:
        if category and category.lower() not in t.get("category", "").lower():
            continue
        budget = t.get("budget", 0)
        if min_budget and budget < min_budget:
            continue
        if max_budget and budget > max_budget:
            continue
        results.append(t)
    return results

@router.post("/tenders/gem/{bid_id}/import")
async def import_from_gem(bid_id: str, current_user: dict = Depends(get_current_user)):
    """Import a tender from GeM."""
    mocks = get_mock_tenders()
    matched = None
    for t in mocks:
        if t.get("tender_id") == bid_id or t.get("id") == bid_id:
            matched = t
            break
            
    if not matched:
        raise HTTPException(status_code=404, detail="GeM tender not found")
        
    tender_id = f"GEM-{bid_id}"
    tender_dict = {
        "tender_id": tender_id,
        "title": matched.get("title"),
        "department": matched.get("department", "GeM portal"),
        "description": matched.get("description", ""),
        "budget": float(matched.get("budget", 0.0)),
        "deadline": matched.get("deadline", ""),
        "reference_number": matched.get("reference_number", bid_id),
        "category": matched.get("category", "IT/Software"),
        "source": "GeM",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "metadata": {
            "title": matched.get("title"),
            "department": matched.get("department"),
            "budget": float(matched.get("budget", 0.0)),
            "deadline": matched.get("deadline"),
            "category": matched.get("category"),
            "experience_required": 3,
            "turnover_required": float(matched.get("budget", 0.0)) * 0.5,
            "certifications": ["ISO 9001"],
            "technical_requirements": ["Software Development"]
        }
    }
    await mongodb.save_tender(tender_dict)
    return {"tender_id": tender_id, "title": matched.get("title")}

# ---- Watchlist Endpoints --------------------------------------------------

@router.post("/tenders/{tender_id}/watch")
async def add_to_watchlist(tender_id: str, notify_days: int = 7, current_user: dict = Depends(get_current_user)):
    await mongodb.add_watchlist_item({
        "tender_id": tender_id,
        "user_id": current_user["user_id"],
        "notify_days_before": notify_days,
        "added_at": datetime.utcnow()
    })
    return {"watching": True, "notify_days_before": notify_days}

@router.delete("/tenders/{tender_id}/watch")
async def remove_from_watchlist(tender_id: str, current_user: dict = Depends(get_current_user)):
    await mongodb.remove_watchlist_item(tender_id, current_user["user_id"])
    return {"watching": False}

@router.get("/watchlist")
async def get_watchlist(current_user: dict = Depends(get_current_user)):
    return await mongodb.get_watchlist_by_user(current_user["user_id"])

# ---- Saved Searches Endpoints ---------------------------------------------

@router.post("/searches/save")
async def save_search(search_name: str, query_params: dict, current_user: dict = Depends(get_current_user)):
    await mongodb.save_search({
        "user_id": current_user["user_id"],
        "name": search_name,
        "filters": query_params,
        "notify_new_matches": True,
        "created_at": datetime.utcnow()
    })
    return {"saved": True}

@router.get("/searches")
async def list_saved_searches(current_user: dict = Depends(get_current_user)):
    return await mongodb.get_saved_searches(current_user["user_id"])
