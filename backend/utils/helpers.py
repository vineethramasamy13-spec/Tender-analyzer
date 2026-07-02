"""
Utility helper functions for Tender Analyzer
"""
import uuid
import re
from datetime import datetime
from pathlib import Path
from typing import List


def generate_id() -> str:
    """Generate a unique UUID string."""
    return str(uuid.uuid4())


def format_currency(amount: float, currency: str = "INR") -> str:
    """Format amount in Indian currency format (lakhs/crores)."""
    if amount >= 1_00_00_000:  # 1 crore+
        crores = amount / 1_00_00_000
        return f"Rs. {crores:.2f} Cr"
    elif amount >= 1_00_000:  # 1 lakh+
        lakhs = amount / 1_00_000
        return f"Rs. {lakhs:.2f} L"
    else:
        return f"Rs. {amount:,.0f}"


def calculate_days_remaining(deadline: str) -> int:
    """Calculate days remaining until deadline."""
    try:
        formats = ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%dT%H:%M:%S"]
        deadline_dt = None
        for fmt in formats:
            try:
                deadline_dt = datetime.strptime(deadline, fmt)
                break
            except ValueError:
                continue
        if deadline_dt is None:
            return 30  # default fallback
        delta = deadline_dt - datetime.now()
        return max(0, delta.days)
    except Exception:
        return 30


def sanitize_filename(name: str) -> str:
    """Sanitize a string to be used as a filename."""
    name = re.sub(r'[<>:"/\\|?*]', '_', name)
    name = re.sub(r'\s+', '_', name)
    name = name.strip('._')
    return name[:100]  # limit length


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    """Split text into overlapping chunks for RAG processing."""
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk)
        start = end - overlap
        if start >= len(text):
            break
    return chunks


def ensure_dir(path: str) -> Path:
    """Ensure a directory exists, create if not."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def truncate_text(text: str, max_length: int = 500) -> str:
    """Truncate text to max_length with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def extract_budget_from_text(text: str) -> float:
    """Extract budget amount from text (returns INR value)."""
    # Look for crore patterns
    crore_pattern = r'₹?\s*(\d+(?:\.\d+)?)\s*(?:crore|cr\.?|crores)'
    lakh_pattern = r'₹?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|L\.?)'
    
    crore_match = re.search(crore_pattern, text, re.IGNORECASE)
    if crore_match:
        return float(crore_match.group(1)) * 1_00_00_000
    
    lakh_match = re.search(lakh_pattern, text, re.IGNORECASE)
    if lakh_match:
        return float(lakh_match.group(1)) * 1_00_000
    
    return 0.0


def calculate_risk_score(risks: dict) -> float:
    """Calculate numeric risk score from risk levels."""
    level_map = {"low": 0.25, "medium": 0.5, "high": 0.75, "critical": 1.0}
    scores = [level_map.get(v.lower(), 0.5) for v in risks.values() if isinstance(v, str)]
    return sum(scores) / len(scores) if scores else 0.5
