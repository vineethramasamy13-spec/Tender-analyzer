"""
Agent 1: Tender Discovery Agent
Discovers government tenders from GeM, CPPP, and other portals
"""
from datetime import datetime
from typing import Dict, Any
from loguru import logger


async def run_tender_discovery(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    """Discover tenders from government portals."""
    analysis_id = state.get("analysis_id", "unknown")
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] TenderDiscovery: Starting tender discovery")
    
    try:
        from mcp.search_server import discover_all_tenders, get_mock_tenders
        from mcp.database_server import store_tender
        
        # Build search query from context
        query = state.get("tender_title", "government software IT tender India 2025")
        if not query or query == "Government Tender":
            query = "IT software development government tender India 2025"
        
        logs.append(f"[{datetime.now().isoformat()}] TenderDiscovery: Searching with query: {query}")
        
        # Get tenders from mock/real sources
        tenders = await discover_all_tenders(query)
        if not tenders:
            tenders = get_mock_tenders()
        
        # Categorize tenders
        categories = {"IT/Software": [], "Infrastructure": [], "Consulting": [], "Healthcare": [], "Other": []}
        for tender in tenders:
            cat = tender.get("category", "Other")
            if cat in categories:
                categories[cat].append(tender)
            else:
                categories["Other"].append(tender)
        
        logs.append(f"[{datetime.now().isoformat()}] TenderDiscovery: Found {len(tenders)} tenders")
        logs.append(f"[{datetime.now().isoformat()}] TenderDiscovery: Completed successfully")
        
        return {
            **state,
            "discovered_tenders": tenders,
            "agent_logs": logs,
            "current_step": "document_extraction",
        }
        
    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] TenderDiscovery: Error - {str(e)}")
        from mcp.search_server import get_mock_tenders
        return {
            **state,
            "discovered_tenders": get_mock_tenders(),
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"TenderDiscovery: {str(e)}"],
            "current_step": "document_extraction",
        }
