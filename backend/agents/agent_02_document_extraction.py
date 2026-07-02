"""
Agent 2: Document Extraction Agent
Reads tender PDFs and extracts structured data using Gemini 2.5 Flash + Groq
"""
import json
from datetime import datetime
from typing import Dict, Any
from loguru import logger


async def run_document_extraction(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    """Extract structured data from tender document."""
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] DocumentExtraction: Starting")

    try:
        from mcp.pdf_server import read_pdf, extract_eligibility_criteria, extract_tender_metadata
        
        tender_text = state.get("tender_text", "")
        pdf_path = state.get("tender_pdf_path", "")
        
        # Read PDF if path provided
        if pdf_path and not tender_text:
            tender_text = read_pdf(pdf_path)
            pages = 0
            try:
                import fitz
                doc = fitz.open(pdf_path)
                pages = len(doc)
                doc.close()
            except Exception:
                pass
            logs.append(f"[{datetime.now().isoformat()}] DocumentExtraction: Read PDF - {pages} pages")
        
        # Get Groq client from config
        groq_client = None
        try:
            from config import get_groq_client
            groq_client = get_groq_client(state.get("groq_api_key"))
        except Exception:
            pass
        
        # Extract metadata and eligibility
        metadata = await extract_tender_metadata(tender_text, groq_client) or {}
        eligibility_info = await extract_eligibility_criteria(tender_text, groq_client) or {}
        
        # Sanitize metadata
        if not isinstance(metadata, dict):
            metadata = {}
        if metadata.get("title") is None:
            metadata["title"] = "Government Tender"
        if metadata.get("department") is None:
            metadata["department"] = "Government Department"
        if metadata.get("category") is None:
            metadata["category"] = "IT/Software"
        if metadata.get("reference_number") is None:
            metadata["reference_number"] = "N/A"
            
        # Sanitize eligibility_info
        if not isinstance(eligibility_info, dict):
            eligibility_info = {}
            
        # Ensure list types are actual lists, not None
        list_fields = ["certifications", "technical_requirements", "financial_requirements", "evaluation_criteria", "submission_requirements"]
        for field in list_fields:
            if eligibility_info.get(field) is None or not isinstance(eligibility_info[field], list):
                eligibility_info[field] = []
        
        # Merge into tender_metadata
        full_metadata = {**metadata, **eligibility_info}
        
        # Post-process full_metadata to estimate realistic requirements if not explicitly found in the text
        budget_val = full_metadata.get("budget")
        try:
            budget = float(budget_val) if budget_val is not None else 10000000.0
        except (ValueError, TypeError):
            budget = 10000000.0
            
        if budget <= 0:
            budget = 10000000.0
            
        # 1. Experience Required (scale with budget)
        if not full_metadata.get("experience_required"):
            if budget < 2500000:       # < 25L
                full_metadata["experience_required"] = 2
            elif budget < 10000000:    # < 1Cr
                full_metadata["experience_required"] = 3
            elif budget < 30000000:    # < 3Cr
                full_metadata["experience_required"] = 4
            elif budget < 50000000:    # < 5Cr
                full_metadata["experience_required"] = 5
            else:                      # >= 5Cr
                full_metadata["experience_required"] = 7
                
        # 2. Turnover Required (estimated at 50% of budget)
        if not full_metadata.get("turnover_required"):
            full_metadata["turnover_required"] = budget * 0.5
            
        # 3. Certifications Required (scale with budget for IT tenders)
        if not full_metadata.get("certifications"):
            category = full_metadata.get("category", "IT/Software")
            if category in ["IT/Software", "Cybersecurity", "Data Analytics", "Cloud Services", "Enterprise Software", "IoT/Software"]:
                if budget >= 30000000: # >= 3Cr
                    full_metadata["certifications"] = ["ISO 9001", "ISO 27001", "CMMI Level 3"]
                elif budget >= 10000000: # >= 1Cr
                    full_metadata["certifications"] = ["ISO 9001", "ISO 27001"]
                else:
                    full_metadata["certifications"] = ["ISO 9001"]
            else:
                full_metadata["certifications"] = ["ISO 9001"]
                
        logs.append(f"[{datetime.now().isoformat()}] DocumentExtraction: Extracted metadata - Title: {metadata.get('title', 'N/A')}")
        logs.append(f"[{datetime.now().isoformat()}] DocumentExtraction: Estimated/Found requirements - Exp: {full_metadata['experience_required']} yrs, Turnover: {full_metadata['turnover_required']/1e5:.1f}L")
        
        return {
            **state,
            "tender_text": tender_text,
            "tender_metadata": full_metadata,
            "tender_title": metadata.get("title", state.get("tender_title", "Government Tender")),
            "agent_logs": logs,
            "current_step": "business_profile",
        }
        
    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] DocumentExtraction: Error - {str(e)}")
        # Provide default metadata
        from datetime import timedelta
        default_meta = {
            "title": state.get("tender_title", "Government IT Tender"),
            "department": "Government of India",
            "deadline": (datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d"),
            "budget": 10000000,
            "category": "IT/Software",
            "reference_number": "GOI/2025/001",
            "experience_required": 3,
            "turnover_required": 5000000,
            "certifications": ["ISO 9001"],
            "technical_requirements": ["Software Development", "Cloud Infrastructure"],
            "timeline": "12 months",
            "evaluation_criteria": ["Technical Capability", "Financial Strength", "Past Experience"],
        }
        return {
            **state,
            "tender_metadata": default_meta,
            "tender_title": default_meta["title"],
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"DocumentExtraction: {str(e)}"],
            "current_step": "business_profile",
        }
