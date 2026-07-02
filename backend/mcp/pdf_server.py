"""
PDF MCP Server - Tools for reading and extracting data from tender PDFs
"""
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("PyMuPDF not available, using text fallback")


def read_pdf(file_path: str) -> str:
    """Read PDF and extract text content."""
    path = Path(file_path)
    if not path.exists():
        return "Error: File not found"
    
    if not PYMUPDF_AVAILABLE:
        return "PDF reading requires PyMuPDF installation"
    
    try:
        doc = fitz.open(str(path))
        full_text = ""
        
        for page in doc:
            full_text += page.get_text() + "\n"
        
        doc.close()
        return full_text
    except Exception as e:
        logger.error(f"PDF read error: {e}")
        return f"Error reading PDF: {str(e)}"


def extract_tables(file_path: str) -> List[Dict[str, Any]]:
    """Extract tables from PDF."""
    if not PYMUPDF_AVAILABLE:
        return []
    
    try:
        doc = fitz.open(file_path)
        tables = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Use text blocks to identify table-like structures
            blocks = page.get_text("blocks")
            page_tables = []
            
            for block in blocks:
                if block[6] == 0:  # text block
                    text = block[4].strip()
                    if '\t' in text or '|' in text:
                        rows = [row.split('\t') for row in text.split('\n') if row.strip()]
                        if rows:
                            page_tables.append({"rows": rows, "page": page_num + 1})
            
            tables.extend(page_tables)
        
        doc.close()
        return tables
    except Exception as e:
        logger.error(f"Table extraction error: {e}")
        return []


async def extract_eligibility_criteria(text: str, groq_client=None) -> Dict[str, Any]:
    """Extract eligibility criteria from tender text using AI."""
    
    # Try AI extraction first
    if groq_client and text:
        try:
            prompt = f"""Extract eligibility criteria from this tender document. Return ONLY valid JSON.

TENDER TEXT (first 4000 chars):
{text[:4000]}

Return this exact JSON structure:
{{
  "experience_required": <years as integer>,
  "turnover_required": <annual turnover in INR as float>,
  "certifications": ["list", "of", "required", "certifications"],
  "technical_requirements": ["technical", "skills", "required"],
  "financial_requirements": ["financial", "criteria"],
  "timeline": "<project duration>",
  "evaluation_criteria": ["evaluation", "parameters"],
  "submission_requirements": ["documents", "required"]
}}"""
            
            from utils.llm_utils import call_groq_retry
            content = await call_groq_retry(
                client=groq_client,
                model="llama-3.3-70b-versatile",
                prompt=prompt,
                temperature=0.1,
                max_tokens=1000
            )
            # Extract JSON from response
            start = content.find('{')
            end = content.rfind('}') + 1
            if start != -1 and end > start:
                return json.loads(content[start:end])
        except Exception as e:
            logger.error(f"AI eligibility extraction failed: {e}")
    
    # Fallback: rule-based extraction
    import re
    result = {
        "experience_required": 3,
        "turnover_required": 5000000,
        "certifications": [],
        "technical_requirements": [],
        "financial_requirements": [],
        "timeline": "12 months",
        "evaluation_criteria": ["Technical Capability", "Financial Strength", "Past Experience"],
        "submission_requirements": ["Company Registration", "PAN Card", "GST Certificate", "Experience Certificates"]
    }
    
    if text:
        # Experience
        exp_match = re.search(r'(\d+)\s*years?\s*(?:of\s*)?experience', text, re.IGNORECASE)
        if exp_match:
            result["experience_required"] = int(exp_match.group(1))
        
        # Turnover
        turnover_crore = re.search(r'turnover.*?(\d+(?:\.\d+)?)\s*crore', text, re.IGNORECASE)
        turnover_lakh = re.search(r'turnover.*?(\d+(?:\.\d+)?)\s*lakh', text, re.IGNORECASE)
        if turnover_crore:
            result["turnover_required"] = float(turnover_crore.group(1)) * 1e7
        elif turnover_lakh:
            result["turnover_required"] = float(turnover_lakh.group(1)) * 1e5
        
        # Certifications
        cert_patterns = ["ISO 27001", "ISO 9001", "CMMI", "CERT-In", "PCI DSS", "SOC 2"]
        for cert in cert_patterns:
            if cert.lower() in text.lower():
                result["certifications"].append(cert)
    
    return result


async def extract_tender_metadata(text: str, groq_client=None) -> Dict[str, Any]:
    """Extract tender metadata (title, dept, deadline, budget) from text."""
    
    if groq_client and text:
        try:
            prompt = f"""Extract metadata from this tender document. Return ONLY valid JSON.

TENDER TEXT:
{text[:3000]}

Return this JSON:
{{
  "title": "<tender title>",
  "department": "<issuing department>",
  "deadline": "<deadline date YYYY-MM-DD>",
  "budget": <budget in INR as float>,
  "category": "<IT/Software/Infrastructure/Consulting/Healthcare>",
  "reference_number": "<tender ref number>"
}}"""
            
            from utils.llm_utils import call_groq_retry
            content = await call_groq_retry(
                client=groq_client,
                model="llama-3.3-70b-versatile",
                prompt=prompt,
                temperature=0.1,
                max_tokens=500
            )
            start = content.find('{')
            end = content.rfind('}') + 1
            if start != -1:
                return json.loads(content[start:end])
        except Exception as e:
            logger.error(f"Metadata extraction failed: {e}")
    
    # Fallback defaults
    import re
    from datetime import datetime, timedelta
    
    result = {
        "title": "Government Tender",
        "department": "Government Department",
        "deadline": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "budget": 10000000.0,
        "category": "IT/Software",
        "reference_number": "GOI/TENDER/2025/001"
    }
    
    if text:
        # 1. Tender Title / Description
        desc_match = re.search(r'(?:Tender Description|Description|Title)\s*[:\-]?\s*(.*)', text, re.IGNORECASE)
        if desc_match:
            result["title"] = desc_match.group(1).strip()
        else:
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            for l in lines:
                if len(l) > 15 and "tender" not in l.lower() and "details" not in l.lower():
                    result["title"] = l
                    break

        # 2. Issuing Department
        dept_match = re.search(r'(?:Department|Issuing Department|Authority|Issuing Office)\s*[:\-]?\s*(.*)', text, re.IGNORECASE)
        if dept_match:
            result["department"] = dept_match.group(1).strip()
        elif "TAMIL NADU NEWSPRINT AND PAPERS LIMITED" in text or "TNPL" in text:
            result["department"] = "Tamil Nadu Newsprint and Papers Limited (TNPL)"
            
        # 3. Reference/Tender Number
        ref_match = re.search(r'(?:Tender Number|Ref Number|Tender No|Reference Number|No\.)\s*[:\-]?\s*([A-Za-z0-9/\-_]+)', text, re.IGNORECASE)
        if ref_match:
            result["reference_number"] = ref_match.group(1).strip()
            
        # 4. Budget
        from utils.helpers import extract_budget_from_text
        try:
            budget_val = extract_budget_from_text(text)
            if budget_val > 0:
                result["budget"] = budget_val
        except Exception:
            pass

        # 5. Category
        text_lower = text.lower()
        if "balancing" in text_lower or "rubber" in text_lower or "lining" in text_lower:
            result["category"] = "Other"
        elif "software" in text_lower or "website" in text_lower or "portal" in text_lower or "api" in text_lower:
            result["category"] = "IT/Software"
            
    return result
