from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pathlib import Path
import os
import asyncio
import uuid
from database import mongodb
from auth import get_current_user
from config import settings
from mcp.report_server import generate_pdf_report
from utils.docx_export import export_proposal_docx
from tasks.alerts import send_email
from loguru import logger

router = APIRouter()

@router.get("/report/{analysis_id}")
async def download_report_pdf(analysis_id: str, current_user: dict = Depends(get_current_user)):
    """Download the PDF report of a completed analysis."""
    try:
        # First check if the analysis exists in the database
        analysis = await mongodb.get_analysis(analysis_id)
        
        # If not in DB but it's a demo or startswith ANL-, generate from default mock dict
        if not analysis and (analysis_id == "demo" or (analysis_id and analysis_id.startswith("ANL-"))):
            # Generate demo report data
            report_data = {
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
            os.makedirs(settings.REPORTS_DIR, exist_ok=True)
            report_path = Path(settings.REPORTS_DIR) / f"Tender_Analysis_Report_{analysis_id}.pdf"
            if not report_path.exists():
                temp_path = Path(settings.REPORTS_DIR) / f"Tender_Analysis_Report_{analysis_id}_{uuid.uuid4()}.pdf"
                await asyncio.to_thread(generate_pdf_report, report_data, str(temp_path))
                try:
                    os.rename(temp_path, report_path)
                except FileExistsError:
                    try:
                        os.remove(temp_path)
                    except Exception:
                        pass
                except Exception:
                    pass
            return FileResponse(
                path=str(report_path),
                filename=f"Tender_Analysis_Report_{analysis_id}.pdf",
                media_type="application/pdf"
            )
            
        analysis = await mongodb.get_analysis(analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
            
        if analysis["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this report")
            
        report_path_str = analysis.get("pdf_report_path") or analysis.get("report_path")
        if not report_path_str:
            fallback_path = Path(settings.REPORTS_DIR) / f"Tender_Analysis_Report_{analysis_id}.pdf"
            if fallback_path.exists():
                report_path_str = str(fallback_path)
            else:
                # Compile PDF report dynamically from stored state if missing
                result_state = analysis.get("result")
                if result_state:
                    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
                    fallback_path = Path(settings.REPORTS_DIR) / f"Tender_Analysis_Report_{analysis_id}.pdf"
                    if not fallback_path.exists():
                        temp_path = Path(settings.REPORTS_DIR) / f"Tender_Analysis_Report_{analysis_id}_{uuid.uuid4()}.pdf"
                        await asyncio.to_thread(generate_pdf_report, result_state, str(temp_path))
                        try:
                            os.rename(temp_path, fallback_path)
                        except FileExistsError:
                            try:
                                os.remove(temp_path)
                            except Exception:
                                pass
                        except Exception:
                            pass
                    report_path_str = str(fallback_path)
                else:
                    raise HTTPException(status_code=404, detail="PDF report has not been generated or is missing")
                
        report_path = Path(report_path_str)
        if not report_path.exists():
            raise HTTPException(status_code=404, detail="Report file not found on disk")
            
        return FileResponse(
            path=str(report_path),
            filename=f"Tender_Analysis_Report_{analysis_id}.pdf",
            media_type="application/pdf"
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in download PDF report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/report/{analysis_id}/email")
async def email_report_pdf(analysis_id: str, current_user: dict = Depends(get_current_user)):
    """Email the PDF report of a completed analysis."""
    try:
        analysis = await mongodb.get_analysis(analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        if analysis["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        report_path_str = analysis.get("pdf_report_path") or analysis.get("report_path")
        if not report_path_str:
            fallback_path = Path(settings.REPORTS_DIR) / f"Tender_Analysis_Report_{analysis_id}.pdf"
            if fallback_path.exists():
                report_path_str = str(fallback_path)
            else:
                raise HTTPException(status_code=404, detail="PDF report not found. Please download it first to generate it.")
                
        report_path = Path(report_path_str)
        if not report_path.exists():
            raise HTTPException(status_code=404, detail="Report file not found on disk")
            
        # Send Email
        html_content = f"""
        <html>
            <body style="font-family: sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 30px; border-radius: 12px;">
                <h2 style="color: #3b82f6;">Your TenderAI Report is Ready!</h2>
                <p>Hello {current_user.get('name', 'User')},</p>
                <p>Please find the attached PDF report for your recent tender analysis.</p>
                <p style="color: #94a3b8; font-size: 12px;">This is an automated message from TenderAI.</p>
            </body>
        </html>
        """
        asyncio.create_task(send_email(
            to=current_user["email"], 
            subject=f"📄 Tender Analysis Report - {analysis.get('tender_title', 'Report')}", 
            html=html_content, 
            attachments=[str(report_path)]
        ))
        
        return {"message": "Email queued for delivery successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error sending report email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email")

@router.get("/report/{analysis_id}/download/docx")
async def download_report_docx(analysis_id: str, current_user: dict = Depends(get_current_user)):
    """Download the generated Word proposal draft."""
    try:
        # First check if the analysis exists in the database
        analysis = await mongodb.get_analysis(analysis_id)
        
        # If not in DB but it's a demo or startswith ANL-, generate from default mock dict
        if not analysis and (analysis_id == "demo" or (analysis_id and analysis_id.startswith("ANL-"))):
            result_state = {
                "tender_title": "NIC Integrated e-Governance Platform",
                "business_profile": {
                    "name": "TechVenture Solutions Pvt Ltd",
                    "company_type": "startup"
                },
                "eligibility_result": {
                    "overall_score": 0.78,
                    "eligible": True
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
            os.makedirs(settings.REPORTS_DIR, exist_ok=True)
            docx_path = Path(settings.REPORTS_DIR) / f"Tender_Proposal_{analysis_id}.docx"
            if not docx_path.exists():
                temp_path = Path(settings.REPORTS_DIR) / f"Tender_Proposal_{analysis_id}_{uuid.uuid4()}.docx"
                await asyncio.to_thread(export_proposal_docx, result_state, str(temp_path))
                try:
                    os.rename(temp_path, docx_path)
                except FileExistsError:
                    try:
                        os.remove(temp_path)
                    except Exception:
                        pass
                except Exception:
                    pass
            return FileResponse(
                path=str(docx_path),
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                filename=f"Tender_Proposal_{analysis_id}.docx"
            )

        analysis = await mongodb.get_analysis(analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
            
        if analysis["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this report")
            
        result_state = analysis.get("result")
        if not result_state:
            raise HTTPException(status_code=400, detail="Proposal has not been fully compiled yet")
            
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        docx_path = Path(settings.REPORTS_DIR) / f"Tender_Proposal_{analysis_id}.docx"
        
        # Build Word document
        if not docx_path.exists():
            temp_path = Path(settings.REPORTS_DIR) / f"Tender_Proposal_{analysis_id}_{uuid.uuid4()}.docx"
            await asyncio.to_thread(export_proposal_docx, result_state, str(temp_path))
            try:
                os.rename(temp_path, docx_path)
            except FileExistsError:
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
            except Exception:
                pass
        
        return FileResponse(
            path=str(docx_path),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=f"Tender_Proposal_{analysis_id}.docx"
        )
    except Exception as e:
        logger.error(f"Error in download DOCX report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
