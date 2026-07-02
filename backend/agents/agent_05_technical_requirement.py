"""
Agent 5: Technical Requirement Agent - Gap Analysis
"""
from datetime import datetime
from typing import Dict, Any, List
from loguru import logger


def _classify_gap(requirement: str, has_it: bool, partial: bool = False) -> str:
    critical_keywords = ["iso 27001", "cmmi", "cert-in", "security clearance", "mandatory"]
    important_keywords = ["iso 9001", "experience", "cloud", "infrastructure", "integration"]
    req_lower = requirement.lower()
    if any(k in req_lower for k in critical_keywords):
        return "critical" if not has_it else "optional"
    if any(k in req_lower for k in important_keywords):
        return "important" if not has_it else "optional"
    return "optional"


async def run_technical_analysis(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] TechnicalRequirement: Starting gap analysis")

    try:
        profile = state.get("business_profile", {}) or {}
        metadata = state.get("tender_metadata", {}) or {}
        
        tech_requirements = metadata.get("technical_requirements") or [
            "Software Development (Web/Mobile)", "Cloud Infrastructure (AWS/Azure/GCP)",
            "Database Management (SQL/NoSQL)", "API Development and Integration",
            "Cybersecurity and Data Protection", "Scalability and Performance Testing"
        ]
        
        certs_required = metadata.get("certifications") or ["ISO 27001", "ISO 9001"]
        company_certs = [c.lower() for c in profile.get("certifications", []) or []]
        company_stack = [s.lower() for s in profile.get("tech_stack", ["python", "react", "nodejs"]) or []]
        
        gaps: List[Dict[str, Any]] = []
        
        # Check certifications
        for cert in certs_required:
            has_cert = any(cert.lower() in c for c in company_certs)
            gap_type = "critical" if "27001" in cert or "cmmi" in cert.lower() else "important"
            gaps.append({
                "requirement": f"{cert} Certification",
                "current_status": "Available" if has_cert else "Not Available",
                "gap_type": "optional" if has_cert else gap_type,
                "recommendation": "Already certified" if has_cert else f"Obtain {cert} certification (3-6 months). Consider partnering with a certified firm in the interim.",
            })
        
        # Check technical requirements
        tech_skill_map = {
            "cloud": ["aws", "azure", "gcp", "cloud"],
            "security": ["security", "iso 27001", "soc"],
            "mobile": ["react native", "flutter", "android", "ios"],
            "data": ["analytics", "ml", "ai", "data science"],
            "web": ["react", "angular", "vue", "django", "fastapi"],
        }
        
        for req in tech_requirements:
            req_lower = req.lower()
            has_skill = any(skill in " ".join(company_stack) for skill in req_lower.split()[:3])
            
            if not has_skill:
                gaps.append({
                    "requirement": req,
                    "current_status": "Partial / Needs Assessment",
                    "gap_type": _classify_gap(req, has_skill),
                    "recommendation": f"Assess team capability for '{req}'. Consider hiring specialists or using subcontracting. Timeline: 30-60 days.",
                })
            else:
                gaps.append({
                    "requirement": req,
                    "current_status": "Available",
                    "gap_type": "optional",
                    "recommendation": "Team has this capability. Highlight in technical proposal.",
                })
        
        # Sort: critical first
        order = {"critical": 0, "important": 1, "optional": 2}
        gaps.sort(key=lambda x: order.get(x.get("gap_type", "optional"), 2))
        
        critical_count = sum(1 for g in gaps if g["gap_type"] == "critical" and g["current_status"] != "Available")
        logs.append(f"[{datetime.now().isoformat()}] TechnicalRequirement: {len(gaps)} requirements, {critical_count} critical gaps")
        
        return {
            **state,
            "gaps": gaps,
            "agent_logs": logs,
            "current_step": "cost_estimation",
        }

    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] TechnicalRequirement: Error - {str(e)}")
        return {
            **state,
            "gaps": [],
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"TechnicalRequirement: {str(e)}"],
            "current_step": "cost_estimation",
            "_failed": True,
        }
