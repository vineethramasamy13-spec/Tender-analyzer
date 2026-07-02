"""
Report MCP Server - Professional PDF Report Generation using ReportLab
"""
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
from loguru import logger

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.colors import HexColor, white, black
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, PageBreak, KeepTogether
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
    from reportlab.graphics.shapes import Drawing, Rect, String
    from reportlab.graphics.charts.barcharts import VerticalBarChart
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger.warning("ReportLab not available")

# Color palette
NAVY = HexColor("#0A1628") if REPORTLAB_AVAILABLE else None
BLUE = HexColor("#1E40AF") if REPORTLAB_AVAILABLE else None
LIGHT_BLUE = HexColor("#3B82F6") if REPORTLAB_AVAILABLE else None
EMERALD = HexColor("#059669") if REPORTLAB_AVAILABLE else None
AMBER = HexColor("#D97706") if REPORTLAB_AVAILABLE else None
RED = HexColor("#DC2626") if REPORTLAB_AVAILABLE else None
LIGHT_GRAY = HexColor("#F8FAFC") if REPORTLAB_AVAILABLE else None
MID_GRAY = HexColor("#94A3B8") if REPORTLAB_AVAILABLE else None
DARK_GRAY = HexColor("#1E293B") if REPORTLAB_AVAILABLE else None


def _get_risk_color(level: str):
    mapping = {"low": EMERALD, "medium": AMBER, "high": HexColor("#EA580C"), "critical": RED}
    return mapping.get(level.lower(), MID_GRAY) if REPORTLAB_AVAILABLE else None


def _get_score_color(score: float):
    if score >= 75: return EMERALD
    if score >= 50: return AMBER
    return RED


def safe_float(val: Any, default: float = 0.0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_int(val: Any, default: int = 0) -> int:
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def generate_pdf_report(analysis_data: Dict[str, Any], output_path: str) -> str:
    """Generate a professional 15-section PDF report."""
    
    if not REPORTLAB_AVAILABLE:
        logger.error("ReportLab not available for PDF generation")
        return output_path
    
    try:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=2*cm, leftMargin=2*cm,
            topMargin=2.5*cm, bottomMargin=2*cm,
        )
        
        styles = getSampleStyleSheet()
        elements = []
        
        # ── Styles ──────────────────────────────────────────────────────
        title_style = ParagraphStyle("Title", parent=styles["Title"],
            fontSize=28, textColor=white, spaceAfter=6, alignment=TA_CENTER,
            fontName="Helvetica-Bold")
        
        h1_style = ParagraphStyle("H1", parent=styles["Heading1"],
            fontSize=16, textColor=NAVY, spaceAfter=8, spaceBefore=16,
            fontName="Helvetica-Bold", borderPad=4)
        
        h2_style = ParagraphStyle("H2", parent=styles["Heading2"],
            fontSize=13, textColor=BLUE, spaceAfter=6, spaceBefore=10,
            fontName="Helvetica-Bold")
        
        body_style = ParagraphStyle("Body", parent=styles["Normal"],
            fontSize=10, textColor=DARK_GRAY, spaceAfter=6,
            leading=15, fontName="Helvetica")
        
        small_style = ParagraphStyle("Small", parent=styles["Normal"],
            fontSize=8, textColor=MID_GRAY, fontName="Helvetica")
        
        bold_style = ParagraphStyle("Bold", parent=styles["Normal"],
            fontSize=10, textColor=DARK_GRAY, fontName="Helvetica-Bold")
        
        table_hdr_left = ParagraphStyle("TblHdrL", fontName="Helvetica-Bold", fontSize=9, textColor=white, alignment=TA_LEFT)
        table_hdr_right = ParagraphStyle("TblHdrR", fontName="Helvetica-Bold", fontSize=9, textColor=white, alignment=TA_RIGHT)
        table_cell_bold_left = ParagraphStyle("TblCellBL", fontName="Helvetica-Bold", fontSize=9, textColor=DARK_GRAY, alignment=TA_LEFT)
        table_cell_normal_left = ParagraphStyle("TblCellNL", fontName="Helvetica", fontSize=9, textColor=DARK_GRAY, alignment=TA_LEFT, leading=12)
        table_cell_normal_right = ParagraphStyle("TblCellNR", fontName="Helvetica", fontSize=9, textColor=DARK_GRAY, alignment=TA_RIGHT)
        table_cell_bold_right = ParagraphStyle("TblCellBR", fontName="Helvetica-Bold", fontSize=9, textColor=white, alignment=TA_RIGHT)
        table_cell_bold_left_white = ParagraphStyle("TblCellBLW", fontName="Helvetica-Bold", fontSize=9, textColor=white, alignment=TA_LEFT)
        
        table_hdr_small = ParagraphStyle("TblHdrS", fontName="Helvetica-Bold", fontSize=8, textColor=white, alignment=TA_LEFT)
        table_cell_small_bold = ParagraphStyle("TblCellSB", fontName="Helvetica-Bold", fontSize=8, textColor=DARK_GRAY, alignment=TA_LEFT)
        table_cell_small_normal = ParagraphStyle("TblCellSN", fontName="Helvetica", fontSize=8, textColor=DARK_GRAY, alignment=TA_LEFT, leading=10)
        table_cell_small_center = ParagraphStyle("TblCellSC", fontName="Helvetica", fontSize=8, textColor=DARK_GRAY, alignment=TA_CENTER)
        
        summary_hdr_style = ParagraphStyle("SumHdr", fontName="Helvetica-Bold", fontSize=10, textColor=white, alignment=TA_CENTER)
        summary_cell_style = ParagraphStyle("SumCell", fontName="Helvetica-Bold", fontSize=10, textColor=DARK_GRAY, alignment=TA_CENTER)
        
        # ── Cover Page ───────────────────────────────────────────────────
        cover_table = Table([[""]], colWidths=[doc.width], rowHeights=[4*cm])
        cover_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), NAVY),
            ("TOPPADDING", (0, 0), (-1, -1), 30),
        ]))
        elements.append(cover_table)
        elements.append(Spacer(1, 0.5*cm))
        
        # Header block
        header_bg = Table([[
            Paragraph("TENDER ANALYSIS REPORT", ParagraphStyle("cov",
                fontSize=22, textColor=white, fontName="Helvetica-Bold", alignment=TA_CENTER)),
        ]], colWidths=[doc.width])
        header_bg.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), NAVY),
            ("TOPPADDING", (0, 0), (-1, -1), 20),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
        ]))
        elements.append(header_bg)
        elements.append(Spacer(1, 0.3*cm))
        
        # Tender title
        tender_title = analysis_data.get("tender_title", analysis_data.get("tender_metadata", {}).get("title", "Government Tender"))
        elements.append(Paragraph(tender_title, ParagraphStyle("tendtitle",
            fontSize=14, textColor=BLUE, fontName="Helvetica-Bold",
            alignment=TA_CENTER, spaceAfter=4)))
        
        bp = analysis_data.get("business_profile", {})
        company_name = bp.get("name") or bp.get("company_name") or "Company"
        elements.append(Paragraph(f"Prepared for: {company_name}", ParagraphStyle("comp",
            fontSize=11, textColor=DARK_GRAY, fontName="Helvetica", alignment=TA_CENTER)))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%d %B %Y, %I:%M %p')}",
            ParagraphStyle("date", fontSize=9, textColor=MID_GRAY, alignment=TA_CENTER)))
        
        # Bid prediction summary box
        bid = analysis_data.get("bid_prediction", {})
        elig = analysis_data.get("eligibility_result", {})
        
        raw_wp = bid.get("win_probability")
        wp_val = safe_float(raw_wp, 0.0)
        win_prob = wp_val * 100 if wp_val <= 1 else wp_val
        
        raw_es = elig.get("overall_score")
        es_val = safe_float(raw_es, 0.0)
        elig_score = es_val * 100 if es_val <= 1 else es_val
        
        risk = (analysis_data.get("risk_report", {}) or {}).get("overall_risk", "Medium")
        if risk is None:
            risk = "Medium"
        risk = str(risk).title()
        
        recommendation = bid.get("recommendation", "Apply with Improvements")
        if recommendation is None:
            recommendation = "Apply with Improvements"
        
        summary_data = [
            [Paragraph("Eligibility Score", summary_hdr_style), Paragraph("Win Probability", summary_hdr_style), Paragraph("Risk Level", summary_hdr_style), Paragraph("Recommendation", summary_hdr_style)],
            [Paragraph(f"{elig_score:.0f}%", summary_cell_style), Paragraph(f"{win_prob:.0f}%", summary_cell_style), Paragraph(risk, summary_cell_style), Paragraph(recommendation, summary_cell_style)],
        ]
        summary_table = Table(summary_data, colWidths=[doc.width/4]*4)
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("BACKGROUND", (0, 1), (-1, 1), LIGHT_GRAY),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_GRAY]),
        ]))
        elements.append(Spacer(1, 0.5*cm))
        elements.append(summary_table)
        elements.append(PageBreak())
        
        # ── Section 1: Executive Summary ─────────────────────────────────
        elements.append(Paragraph("1. Executive Summary", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        exec_summary = analysis_data.get("proposal_draft", {}).get("executive_summary")
        if exec_summary:
            if isinstance(exec_summary, list):
                exec_summary = "\n".join(str(item) for item in exec_summary)
            elif not isinstance(exec_summary, str):
                exec_summary = str(exec_summary)
        else:
            exec_summary = (
                f"This report provides a comprehensive analysis of the tender '{tender_title}' for {company_name}. "
                f"Based on our multi-agent AI analysis, the company demonstrates an eligibility score of {elig_score:.0f}% "
                f"with a projected win probability of {win_prob:.0f}%. "
                f"The overall risk level is assessed as {risk}, and our recommendation is to '{recommendation}'."
            )
        elements.append(Paragraph(exec_summary, body_style))
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 2: Tender Details ─────────────────────────────────────
        elements.append(Paragraph("2. Tender Details", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        metadata = analysis_data.get("tender_metadata", {}) or {}
        from utils.helpers import format_currency
        
        raw_budget = metadata.get("budget")
        if raw_budget is None or raw_budget == 0 or str(raw_budget).strip().lower() in ["n/a", "none", "not available", "0", "0.0"]:
            budget_str = "Not Specified"
        else:
            budget_str = format_currency(safe_float(raw_budget))

        tender_data = [
            [Paragraph("Field", table_hdr_left), Paragraph("Details", table_hdr_left)],
            [Paragraph("Tender Title", table_cell_bold_left), Paragraph(metadata.get("title", tender_title) or "N/A", table_cell_normal_left)],
            [Paragraph("Reference Number", table_cell_bold_left), Paragraph(metadata.get("reference_number", "N/A") or "N/A", table_cell_normal_left)],
            [Paragraph("Issuing Department", table_cell_bold_left), Paragraph(metadata.get("department", "N/A") or "N/A", table_cell_normal_left)],
            [Paragraph("Budget", table_cell_bold_left), Paragraph(budget_str or "N/A", table_cell_normal_left)],
            [Paragraph("Submission Deadline", table_cell_bold_left), Paragraph(metadata.get("deadline", "N/A") or "N/A", table_cell_normal_left)],
            [Paragraph("Category", table_cell_bold_left), Paragraph(metadata.get("category", "IT/Software") or "N/A", table_cell_normal_left)],
            [Paragraph("Project Timeline", table_cell_bold_left), Paragraph(metadata.get("timeline", "12 months") or "N/A", table_cell_normal_left)],
        ]
        td_table = Table(tender_data, colWidths=[5.5*cm, doc.width - 5.5*cm])
        td_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
            ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
        ]))
        elements.append(td_table)
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 3: Business Profile ───────────────────────────────────
        elements.append(Paragraph("3. Business Profile Analysis", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        bp = analysis_data.get("business_profile", {}) or {}
        certs = ", ".join(bp.get("certifications", [])) or "None"
        
        # Support both Pydantic schema keys and legacy/alternate keys
        company_name = bp.get("name") or bp.get("company_name") or "N/A"
        turnover_val = bp.get("turnover") or bp.get("annual_turnover")
        exp_years = safe_int(bp.get("experience_years") or bp.get("experience"), 0)
        team_size = safe_int(bp.get("team_size") or bp.get("teamSize"), 0)
        
        turnover_rs = safe_float(turnover_val, 0.0)
        if turnover_rs < 100000 and turnover_rs > 0:
            turnover_rs = turnover_rs * 100000
            
        company_type_val = bp.get("company_type", "N/A")
        company_type_str = company_type_val.value if hasattr(company_type_val, "value") else str(company_type_val)
        if "." in company_type_str:
            company_type_str = company_type_str.split(".")[-1]
        company_type_str = company_type_str.upper()
            
        profile_data = [
            [Paragraph("Field", table_hdr_left), Paragraph("Value", table_hdr_left)],
            [Paragraph("Company Name", table_cell_bold_left), Paragraph(company_name, table_cell_normal_left)],
            [Paragraph("Company Type", table_cell_bold_left), Paragraph(company_type_str, table_cell_normal_left)],
            [Paragraph("Annual Turnover", table_cell_bold_left), Paragraph(format_currency(turnover_rs), table_cell_normal_left)],
            [Paragraph("Experience", table_cell_bold_left), Paragraph(f"{exp_years} years", table_cell_normal_left)],
            [Paragraph("Team Size", table_cell_bold_left), Paragraph(f"{team_size} members", table_cell_normal_left)],
            [Paragraph("Industry", table_cell_bold_left), Paragraph(bp.get("industry", "IT/Software") or "N/A", table_cell_normal_left)],
            [Paragraph("State", table_cell_bold_left), Paragraph(bp.get("state", "N/A") or "N/A", table_cell_normal_left)],
            [Paragraph("Certifications", table_cell_bold_left), Paragraph(certs, table_cell_normal_left)],
        ]
        bp_table = Table(profile_data, colWidths=[5.5*cm, doc.width - 5.5*cm])
        bp_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BLUE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
            ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
        ]))
        elements.append(bp_table)
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 4: Eligibility Analysis ──────────────────────────────
        elements.append(Paragraph("4. Eligibility Analysis", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        elig_data = analysis_data.get("eligibility_result", {}) or {}
        overall = safe_float(elig_data.get("overall_score"), 0.0)
        if overall <= 1: overall *= 100
        
        score_color = _get_score_color(overall)
        score_box = Table([[Paragraph(f"Overall Eligibility Score: {overall:.0f}%",
            ParagraphStyle("sc", fontSize=16, fontName="Helvetica-Bold",
                textColor=white, alignment=TA_CENTER))]],
            colWidths=[doc.width])
        score_box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), score_color),
            ("TOPPADDING", (0, 0), (-1, -1), 15),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
        ]))
        elements.append(score_box)
        elements.append(Spacer(1, 0.3*cm))
        
        # Breakdown table
        breakdown = elig_data.get("breakdown", [])
        if breakdown:
            elig_rows = [[
                Paragraph("Criterion", table_hdr_small),
                Paragraph("Required", table_hdr_small),
                Paragraph("Current", table_hdr_small),
                Paragraph("Score", table_hdr_small),
                Paragraph("Status", table_hdr_small),
            ]]
            for item in breakdown:
                score_val = safe_float(item.get("score"), 0.0)
                if score_val <= 1: score_val *= 100
                status = "✓ Met" if score_val >= 70 else "✗ Gap"
                elig_rows.append([
                    Paragraph(item.get("criterion", "") or "", table_cell_small_bold),
                    Paragraph(str(item.get("required", "") or ""), table_cell_small_normal),
                    Paragraph(str(item.get("current", "") or ""), table_cell_small_normal),
                    Paragraph(f"{score_val:.0f}%", table_cell_small_center),
                    Paragraph(status, table_cell_small_bold),
                ])
            
            elig_table = Table(elig_rows, colWidths=[4.5*cm, 4*cm, 4*cm, 1.8*cm, 2.2*cm])
            elig_style = [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
            ]
            elig_table.setStyle(TableStyle(elig_style))
            elements.append(elig_table)
        
        # Missing items
        missing = elig_data.get("missing_items", [])
        if missing:
            elements.append(Spacer(1, 0.3*cm))
            elements.append(Paragraph("Missing Requirements:", h2_style))
            for item in missing:
                elements.append(Paragraph(f"• {item}", body_style))
        
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 5: Technical Gap Analysis ────────────────────────────
        elements.append(Paragraph("5. Technical Gap Analysis", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        gaps = analysis_data.get("gaps", [])
        if gaps:
            gap_rows = [[
                Paragraph("Requirement", table_hdr_small),
                Paragraph("Current Status", table_hdr_small),
                Paragraph("Gap Type", table_hdr_small),
                Paragraph("Recommendation", table_hdr_small),
            ]]
            gap_colors = []
            for i, gap in enumerate(gaps, 1):
                gap_type = gap.get("gap_type", "optional")
                if gap_type is None:
                    gap_type = "optional"
                gap_rows.append([
                    Paragraph(gap.get("requirement", "") or "", table_cell_small_bold),
                    Paragraph(gap.get("current_status", "") or "", table_cell_small_normal),
                    Paragraph(gap_type.upper(), table_cell_small_bold),
                    Paragraph(gap.get("recommendation", "") or "", table_cell_small_normal),
                ])
                row_color = {
                    "critical": HexColor("#FEF2F2"),
                    "important": HexColor("#FFFBEB"),
                    "optional": LIGHT_GRAY
                }.get(gap_type, LIGHT_GRAY)
                gap_colors.append(row_color)
            
            gap_table = Table(gap_rows, colWidths=[4.2*cm, 3.8*cm, 2.2*cm, 6.3*cm])
            gap_style_list = [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
            ]
            for i, color in enumerate(gap_colors, 1):
                gap_style_list.append(("BACKGROUND", (0, i), (-1, i), color))
            
            gap_table.setStyle(TableStyle(gap_style_list))
            elements.append(gap_table)
        else:
            elements.append(Paragraph("No critical gaps identified.", body_style))
        
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 6: Cost Estimation ────────────────────────────────────
        elements.append(Paragraph("6. Cost Estimation", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        cost = (analysis_data.get("cost_estimate") or {})
        cost_data = [
            [Paragraph("Cost Component", table_hdr_left), Paragraph("Estimated Amount", table_hdr_right)],
            [Paragraph("Development Cost", table_cell_bold_left), Paragraph(format_currency(safe_float(cost.get("development_cost"))), table_cell_normal_right)],
            [Paragraph("Infrastructure Cost", table_cell_bold_left), Paragraph(format_currency(safe_float(cost.get("infrastructure_cost"))), table_cell_normal_right)],
            [Paragraph("Team Cost", table_cell_bold_left), Paragraph(format_currency(safe_float(cost.get("team_cost"))), table_cell_normal_right)],
            [Paragraph("Operational Cost", table_cell_bold_left), Paragraph(format_currency(safe_float(cost.get("operational_cost"))), table_cell_normal_right)],
            [Paragraph("TOTAL PROJECT COST", table_cell_bold_left_white), Paragraph(format_currency(safe_float(cost.get("total"))), table_cell_bold_right)],
        ]
        cost_table = Table(cost_data, colWidths=[9.5*cm, doc.width - 9.5*cm])
        cost_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("BACKGROUND", (0, -1), (-1, -1), BLUE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [white, LIGHT_GRAY]),
            ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
        ]))
        elements.append(cost_table)
        margin = safe_float(cost.get("margin_recommendation"), 15)
        elements.append(Spacer(1, 0.2*cm))
        elements.append(Paragraph(f"Recommended Bid Margin: {margin:.0f}%", bold_style))
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 7: Risk Assessment ────────────────────────────────────
        elements.append(Paragraph("7. Risk Assessment", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        risk_data_obj = analysis_data.get("risk_report", {}) or {}
        risk_dims = [
            ("Financial Risk", risk_data_obj.get("financial_risk", "Medium") or "Medium"),
            ("Compliance Risk", risk_data_obj.get("compliance_risk", "Medium") or "Medium"),
            ("Technical Risk", risk_data_obj.get("technical_risk", "Low") or "Low"),
            ("Delivery Risk", risk_data_obj.get("delivery_risk", "Low") or "Low"),
        ]
        
        risk_rows = [[
            Paragraph("Risk Dimension", table_hdr_left),
            Paragraph("Level", table_hdr_left),
            Paragraph("Assessment", table_hdr_left),
        ]]
        for dim_name, level in risk_dims:
            level_cap = str(level).title()
            risk_rows.append([
                Paragraph(dim_name, table_cell_bold_left),
                Paragraph(level_cap, table_cell_bold_left),
                Paragraph(f"Risk level is {level_cap}. Mitigation strategies recommended.", table_cell_normal_left),
            ])
        
        risk_table = Table(risk_rows, colWidths=[4.5*cm, 2.5*cm, doc.width - 7*cm])
        risk_style_list = [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
        ]
        for i, (_, level) in enumerate(risk_dims, 1):
            bg = {
                "low": HexColor("#ECFDF5"), "medium": HexColor("#FFFBEB"),
                "high": HexColor("#FFF7ED"), "critical": HexColor("#FEF2F2")
            }.get(str(level).lower(), LIGHT_GRAY)
            risk_style_list.append(("BACKGROUND", (0, i), (-1, i), bg))
        
        risk_table.setStyle(TableStyle(risk_style_list))
        elements.append(risk_table)
        
        # Mitigations
        mitigations = risk_data_obj.get("mitigation", [])
        if mitigations:
            elements.append(Spacer(1, 0.3*cm))
            elements.append(Paragraph("Mitigation Strategies:", h2_style))
            for m in mitigations:
                elements.append(Paragraph(f"• {m}", body_style))
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 8: Government Scheme Recommendations ──────────────────
        elements.append(Paragraph("8. Government Scheme Recommendations", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        schemes = analysis_data.get("scheme_recommendations", [])
        if schemes:
            scheme_rows = [[
                Paragraph("Scheme Name", table_hdr_small),
                Paragraph("Provider", table_hdr_small),
                Paragraph("Benefit Amount", table_hdr_small),
                Paragraph("Match Score", table_hdr_small),
                Paragraph("Link", table_hdr_small),
            ]]
            for s in schemes[:8]:
                match = safe_float(s.get("match_score"), 0.0)
                if match <= 1: match *= 100
                scheme_rows.append([
                    Paragraph(s.get("name", "") or "", table_cell_small_bold),
                    Paragraph(s.get("provider", "") or "", table_cell_small_normal),
                    Paragraph(s.get("amount", "") or "", table_cell_small_normal),
                    Paragraph(f"{match:.0f}%", table_cell_small_center),
                    Paragraph(s.get("link", "Apply Online") or "Apply Online", table_cell_small_normal),
                ])
            
            scheme_table = Table(scheme_rows, colWidths=[5*cm, 3.2*cm, 3*cm, 1.8*cm, doc.width - 13*cm])
            scheme_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), EMERALD),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
                ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
            ]))
            elements.append(scheme_table)
        else:
            elements.append(Paragraph("No specific scheme recommendations at this time.", body_style))
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 9: Competitor Analysis ───────────────────────────────
        elements.append(Paragraph("9. Competitor Analysis", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        comp = analysis_data.get("competitor_analysis", {}) or {}
        comp_level = comp.get("competition_level", "Medium") or "Medium"
        elements.append(Paragraph(f"Competition Level: <b>{comp_level}</b>", body_style))
        elements.append(Paragraph(f"Estimated Competitors: <b>{comp.get('estimated_competitors', 'N/A')}</b>", body_style))
        
        key_players = comp.get("key_players", [])
        if key_players:
            elements.append(Paragraph("Likely Competitors:", h2_style))
            for player in key_players:
                elements.append(Paragraph(f"• {player}", body_style))
        
        win_factors = comp.get("win_factors", [])
        if win_factors:
            elements.append(Paragraph("Key Winning Factors:", h2_style))
            for factor in win_factors:
                elements.append(Paragraph(f"• {factor}", body_style))
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 10: Winning Probability ──────────────────────────────
        elements.append(Paragraph("10. Bid Success Prediction", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        bid_data = analysis_data.get("bid_prediction", {}) or {}
        wp = safe_float(bid_data.get("win_probability"), 0.0)
        if wp <= 1: wp *= 100
        wp_color = _get_score_color(wp)
        
        prob_box = Table([[
            Paragraph(f"Win Probability: {wp:.0f}%",
                ParagraphStyle("wp", fontSize=20, fontName="Helvetica-Bold",
                    textColor=white, alignment=TA_CENTER)),
            Paragraph(f"Confidence: {bid_data.get('confidence', 'Medium') or 'Medium'}",
                ParagraphStyle("conf", fontSize=12, fontName="Helvetica",
                    textColor=white, alignment=TA_CENTER)),
        ]], colWidths=[doc.width/2, doc.width/2])
        prob_box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), wp_color),
            ("BACKGROUND", (1, 0), (1, 0), BLUE),
            ("TOPPADDING", (0, 0), (-1, -1), 15),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
        ]))
        elements.append(prob_box)
        elements.append(Spacer(1, 0.3*cm))
        elements.append(Paragraph(f"<b>Recommendation: {bid_data.get('recommendation', 'Apply with Improvements') or 'Apply with Improvements'}</b>", body_style))
        
        key_factors = bid_data.get("key_factors", [])
        if key_factors:
            elements.append(Paragraph("Key Decision Factors:", h2_style))
            for factor in key_factors:
                elements.append(Paragraph(f"• {factor}", body_style))
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 11: AI Proposal Draft ────────────────────────────────
        elements.append(PageBreak())
        elements.append(Paragraph("11. AI-Generated Proposal Draft", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        proposal = analysis_data.get("proposal_draft", {}) or {}
        
        sections_map = [
            ("Executive Summary", "executive_summary"),
            ("Technical Proposal", "technical_proposal"),
            ("Scope of Work", "scope_of_work"),
            ("Project Plan", "project_plan"),
        ]
        for section_title, key in sections_map:
            content = proposal.get(key, "")
            if content:
                if isinstance(content, list):
                    content = "\n".join(str(item) for item in content)
                elif not isinstance(content, str):
                    content = str(content)
                elements.append(Paragraph(section_title, h2_style))
                elements.append(Paragraph(content[:1500], body_style))
                elements.append(Spacer(1, 0.3*cm))
        
        # ── Section 12: Submission Checklist ──────────────────────────────
        elements.append(Paragraph("12. Submission Checklist", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        checklist = proposal.get("compliance_checklist", [
            "Company Registration Certificate", "PAN Card Copy",
            "GST Registration Certificate", "Last 3 Years Audited Balance Sheet",
            "Experience Certificates from Past Clients", "Technical Proposal Document",
            "Financial Proposal (BOQ)", "EMD (Earnest Money Deposit)",
            "Declaration of No Blacklisting", "Power of Attorney"
        ])
        
        check_data = [[
            Paragraph("#", table_hdr_left),
            Paragraph("Document/Requirement", table_hdr_left),
            Paragraph("Status", table_hdr_left),
        ]]
        for i, item in enumerate(checklist, 1):
            check_data.append([
                Paragraph(str(i), table_cell_normal_left),
                Paragraph(item, table_cell_normal_left),
                Paragraph("☐ Pending", table_cell_bold_left),
            ])
        
        check_table = Table(check_data, colWidths=[1*cm, doc.width - 3.5*cm, 2.5*cm])
        check_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
            ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
        ]))
        elements.append(check_table)
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 13: Action Plan ───────────────────────────────────────
        elements.append(Paragraph("13. Action Plan", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        action_data = [[
            Paragraph("Priority", table_hdr_left),
            Paragraph("Action Item", table_hdr_left),
            Paragraph("Timeline", table_hdr_left),
            Paragraph("Owner", table_hdr_left),
        ]]
        action_rows_raw = [
            ["HIGH", "Obtain missing certifications (if any)", "Within 30 days", "Management"],
            ["HIGH", "Prepare technical proposal document", "Within 14 days", "Tech Lead"],
            ["HIGH", "Arrange EMD/Bid Security", "Before deadline", "Finance"],
            ["MEDIUM", "Apply for relevant government schemes", "Within 45 days", "Business Dev"],
            ["MEDIUM", "Build consortium (if needed)", "Within 21 days", "Management"],
            ["LOW", "Review competitor landscape", "Within 7 days", "Business Dev"],
        ]
        for row in action_rows_raw:
            action_data.append([
                Paragraph(row[0], table_cell_bold_left),
                Paragraph(row[1], table_cell_normal_left),
                Paragraph(row[2], table_cell_normal_left),
                Paragraph(row[3], table_cell_normal_left),
            ])
            
        action_table = Table(action_data, colWidths=[2.2*cm, doc.width - 8.2*cm, 3*cm, 3*cm])
        action_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
            ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
        ]))
        elements.append(action_table)
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 14: Final Recommendation ─────────────────────────────
        elements.append(Paragraph("14. Final Recommendation", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        rec_color = EMERALD if "immediately" in recommendation.lower() else AMBER if "improve" in recommendation.lower() else RED
        rec_box = Table([[Paragraph(f"RECOMMENDATION: {recommendation.upper()}",
            ParagraphStyle("rec", fontSize=14, fontName="Helvetica-Bold",
                textColor=white, alignment=TA_CENTER))]],
            colWidths=[doc.width])
        rec_box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), rec_color),
            ("TOPPADDING", (0, 0), (-1, -1), 15),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
        ]))
        elements.append(rec_box)
        elements.append(Spacer(1, 0.3*cm))
        elements.append(Paragraph(
            f"Based on comprehensive multi-agent AI analysis: Eligibility {elig_score:.0f}%, "
            f"Win Probability {wp:.0f}%, Risk Level {risk}. "
            f"The system recommends: {recommendation}.",
            body_style))
        elements.append(Spacer(1, 0.5*cm))
        
        # ── Section 15: References ────────────────────────────────────────
        elements.append(Paragraph("15. References & Sources", h1_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        
        references = [
            "Government e-Marketplace (GeM) — gem.gov.in",
            "Central Public Procurement Portal (CPPP) — eprocure.gov.in",
            "Startup India Portal — startupindia.gov.in",
            "MSME Portal — msme.gov.in",
            "Open Government Data Platform — data.gov.in",
            "Ministry of Electronics and IT (MeitY) — meity.gov.in",
            "Report generated by TenderAI — Agentic AI Tender Intelligence Platform",
        ]
        for ref in references:
            elements.append(Paragraph(f"• {ref}", body_style))
        
        # ── Footer ────────────────────────────────────────────────────────
        elements.append(Spacer(1, 1*cm))
        elements.append(HRFlowable(width="100%", thickness=1, color=MID_GRAY))
        elements.append(Paragraph(
            f"Generated by TenderAI — Agentic AI Platform | {datetime.now().strftime('%d %B %Y')} | Confidential",
            ParagraphStyle("footer", fontSize=8, textColor=MID_GRAY, alignment=TA_CENTER)))
        
        # Build PDF
        doc.build(elements)
        logger.info(f"PDF report generated: {output_path}")
        return output_path
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"PDF generation failed: {e}")
        raise
