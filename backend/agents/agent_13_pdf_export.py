"""
Agent 13: PDF Export Agent
Generates final downloadable PDF report
"""
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
from loguru import logger
from utils.helpers import sanitize_filename


async def run_pdf_export(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] PDFExport: Starting PDF generation")

    try:
        report_data = state.get("report_data", {})
        if not report_data:
            report_data = {
                "analysis_id": state.get("analysis_id", "report"),
                "tender_title": state.get("tender_title", "Government Tender"),
                "business_profile": state.get("business_profile", {}),
                "tender_metadata": state.get("tender_metadata", {}),
                "eligibility_result": state.get("eligibility_result", {}),
                "gaps": state.get("gaps", []),
                "cost_estimate": state.get("cost_estimate", {}),
                "risk_report": state.get("risk_report", {}),
                "scheme_recommendations": state.get("scheme_recommendations", []),
                "competitor_analysis": state.get("competitor_analysis", {}),
                "bid_prediction": state.get("bid_prediction", {}),
                "proposal_draft": state.get("proposal_draft", {}),
            }

        # Determine output path
        try:
            from config import settings
            reports_dir = settings.REPORTS_DIR
        except Exception:
            reports_dir = "./reports"
        
        Path(reports_dir).mkdir(parents=True, exist_ok=True)
        
        analysis_id = state.get("analysis_id", "report")
        title = state.get("tender_title", "Tender")
        safe_title = sanitize_filename(title)[:40]
        filename = f"Tender_Analysis_{safe_title}_{analysis_id[:8]}.pdf"
        output_path = str(Path(reports_dir) / filename)

        # Generate PDF
        from mcp.report_server import generate_pdf_report
        result_path = generate_pdf_report(report_data, output_path)
        
        logs.append(f"[{datetime.now().isoformat()}] PDFExport: PDF generated at {result_path}")
        logs.append(f"[{datetime.now().isoformat()}] PDFExport: Analysis pipeline COMPLETED successfully")
        logs.append(f"[{datetime.now().isoformat()}] === ANALYSIS COMPLETE ===")

        return {
            **state,
            "pdf_report_path": result_path,
            "completed_at": datetime.utcnow().isoformat(),
            "agent_logs": logs,
            "current_step": "completed",
        }

    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] PDFExport: Error - {str(e)}")
        return {
            **state,
            "pdf_report_path": "",
            "completed_at": datetime.utcnow().isoformat(),
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"PDFExport: {str(e)}"],
            "current_step": "completed",
        }
