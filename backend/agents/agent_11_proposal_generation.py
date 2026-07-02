"""
Agent 11: Proposal Generation Agent
Uses Groq Llama 3.3 70B to generate professional proposal
"""
import json
from datetime import datetime
from typing import Dict, Any
from loguru import logger


def _generate_mock_proposal(profile: dict, metadata: dict, bid: dict) -> Dict[str, Any]:
    """Generate realistic mock proposal when Groq is unavailable."""
    company = profile.get("company_name", "Our Company")
    dept = metadata.get("department", "Government Department")
    title = metadata.get("title", "Government IT Project")
    win_prob = float(bid.get("win_probability", 0.7)) * 100
    
    return {
        "executive_summary": f"""{company} is pleased to submit this proposal for '{title}' issued by {dept}. 
        
With {profile.get('experience_years', 5)}+ years of expertise in delivering government IT projects, {company} brings proven capability, domain knowledge, and a dedicated team of {profile.get('team_size', 15)} professionals to ensure successful project delivery.

Our comprehensive approach combines agile methodology, industry best practices, and a commitment to quality that has earned us a track record of on-time, within-budget project delivery for government clients across India. Based on our AI-powered analysis, we have a {win_prob:.0f}% win probability for this tender.

We are committed to delivering a solution that fully meets the technical specifications, timeline requirements, and quality standards outlined in the tender document, while ensuring knowledge transfer and long-term maintainability.""",
        
        "technical_proposal": f"""Our technical approach for '{title}' is built on a modern, scalable architecture designed for government-grade security and performance.

TECHNOLOGY STACK:
- Frontend: React.js / Next.js for responsive, accessible user interfaces
- Backend: FastAPI / Django REST Framework for robust API development
- Database: PostgreSQL (primary) + MongoDB (NoSQL) for flexible data management
- Cloud: NIC Cloud / AWS GovCloud compliant infrastructure
- Security: AES-256 encryption, OAuth 2.0, Multi-factor Authentication
- DevOps: Docker containers, CI/CD pipelines, automated testing

METHODOLOGY:
We follow an Agile-Scrum approach with 2-week sprints, ensuring continuous stakeholder visibility and early course correction. Our team will conduct regular progress reviews, maintain comprehensive documentation, and provide weekly status reports throughout the project lifecycle.

QUALITY ASSURANCE:
- Unit testing (90% code coverage)
- Integration testing at each sprint
- User Acceptance Testing (UAT) with stakeholder participation
- Performance testing for 10,000+ concurrent users
- Security penetration testing by CERT-In certified team""",
        
        "scope_of_work": f"""DELIVERABLES FOR '{title.upper()}':

Phase 1 - Requirements & Design (Months 1-2):
1. Detailed Requirements Specification Document
2. System Architecture Design Document
3. UI/UX Wireframes and Prototypes
4. Database Schema Design
5. Security Architecture Document

Phase 2 - Development (Months 3-8):
6. Core Application Development
7. API Integration (Third-party and government systems)
8. Admin Dashboard and Reporting Module
9. Mobile Application (iOS/Android) if applicable
10. Data Migration Scripts

Phase 3 - Testing & Deployment (Months 9-11):
11. System Integration Testing Report
12. User Acceptance Testing (UAT)
13. Performance Benchmarking Report
14. Security Audit Report
15. Production Deployment

Phase 4 - Handover & Support (Month 12):
16. Knowledge Transfer Sessions
17. Operations Manual and User Guides
18. 1-Year Warranty and Support Agreement
19. Source Code and Documentation Handover""",
        
        "project_plan": f"""PROJECT TIMELINE (12 Months):

| Phase | Activities | Duration | Milestone |
|-------|-----------|----------|-----------|
| Initiation | Project kickoff, team formation, tool setup | Week 1-2 | Project Charter |
| Planning | Requirements gathering, SRS finalization | Month 1-2 | SRS Sign-off |
| Design | Architecture, UI/UX, database design | Month 2-3 | Design Approval |
| Development Sprint 1 | Core modules development | Month 3-5 | Module Demo |
| Development Sprint 2 | Integration and advanced features | Month 5-7 | Integration Demo |
| Development Sprint 3 | Admin, reports, mobile | Month 7-8 | Beta Release |
| Testing | UAT, performance, security | Month 9-10 | UAT Sign-off |
| Deployment | Production rollout, data migration | Month 11 | Go-Live |
| Stabilization | Bug fixes, optimization, training | Month 12 | Project Closure |

KEY MILESTONES:
- M1 (Month 2): SRS and Design approval
- M2 (Month 5): First working demo of core features
- M3 (Month 8): Beta release for UAT
- M4 (Month 11): Production go-live
- M5 (Month 12): Project handover and closure""",
        
        "budget_template": f"""FINANCIAL PROPOSAL BREAKDOWN:

| S.No | Component | Cost (INR) |
|------|-----------|------------|
| 1 | Software Development | As per BOQ |
| 2 | Infrastructure (Cloud/Servers) | As per BOQ |
| 3 | Project Management | 5% of development |
| 4 | Quality Assurance & Testing | 15% of development |
| 5 | Documentation | 3% of total |
| 6 | Training & Knowledge Transfer | 2% of total |
| 7 | Annual Maintenance (Year 1) | Included |
| **TOTAL** | | **As per Financial Bid** |

Note: All prices are exclusive of applicable taxes. GST will be charged at applicable rates.
Payment Terms: 30% advance, 40% on demo, 20% on UAT, 10% on go-live.""",
        
        "compliance_checklist": [
            "Company Registration Certificate (CIN/RoC)",
            "PAN Card of the Company",
            "GST Registration Certificate",
            "Udyam/MSME Registration (if applicable)",
            "DPIIT Startup Recognition Certificate (if applicable)",
            "Last 3 Years Audited Balance Sheets",
            "Last 3 Years Profit & Loss Statements",
            "IT Returns for last 3 years",
            "Bank Solvency Certificate from Nationalized Bank",
            "Earnest Money Deposit (EMD) as specified",
            "Performance Bank Guarantee (if applicable)",
            "Experience Certificates from Past Clients (minimum 3)",
            "Client Testimonials / Completion Certificates",
            "Team CVs (Key Personnel)",
            "ISO 9001 Certificate (if applicable)",
            "ISO 27001 Certificate (if applicable)",
            "CMMI Certificate (if applicable)",
            "Power of Attorney (if bid signed by authorized signatory)",
            "Declaration of No Blacklisting",
            "Integrity Pact (if required)",
        ]
    }


async def run_proposal_generation(state: Dict[str, Any], config: Dict = None) -> Dict[str, Any]:
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().isoformat()}] ProposalGeneration: Starting")

    try:
        profile = state.get("business_profile", {}) or {}
        metadata = state.get("tender_metadata", {}) or {}
        bid = state.get("bid_prediction", {}) or {}
        gaps = state.get("gaps", []) or []
        elig = state.get("eligibility_result", {}) or {}

        # Try Groq
        groq_client = None
        try:
            from config import get_groq_client
            groq_client = get_groq_client(state.get("groq_api_key"))
        except Exception:
            pass

        raw_elig_score = elig.get('overall_score')
        elig_val = float(raw_elig_score) if raw_elig_score is not None else 0.7
        
        raw_win_prob = bid.get('win_probability')
        win_val = float(raw_win_prob) if raw_win_prob is not None else 0.7

        if groq_client:
            try:
                prompt = f"""Generate a professional government tender proposal in formal Indian government style.

TENDER: {metadata.get('title', 'Government IT Project')}
DEPARTMENT: {metadata.get('department', 'Government Department')}
COMPANY: {profile.get('company_name', 'Our Company')}
EXPERIENCE: {profile.get('experience_years', 5)} years
TEAM: {profile.get('team_size', 15)} members
CERTIFICATIONS: {', '.join(profile.get('certifications', []) or [])}
ELIGIBILITY SCORE: {elig_val*100:.0f}%
WIN PROBABILITY: {win_val*100:.0f}%

Generate ONLY a JSON response:
{{
  "executive_summary": "<3-paragraph executive summary>",
  "technical_proposal": "<detailed technical approach with methodology>",
  "scope_of_work": "<numbered list of all deliverables with timelines>",
  "project_plan": "<phase-wise project plan with milestones>"
}}"""

                from utils.llm_utils import call_groq_retry
                content = await call_groq_retry(
                    client=groq_client,
                    model="llama-3.3-70b-versatile",
                    prompt=prompt,
                    temperature=0.7,
                    max_tokens=2000
                )
                start = content.find('{')
                end = content.rfind('}') + 1
                if start != -1:
                    ai_proposal = json.loads(content[start:end], strict=False)
                    # Add the remaining sections from mock
                    mock = _generate_mock_proposal(profile, metadata, bid)
                    ai_proposal["budget_template"] = mock["budget_template"]
                    ai_proposal["compliance_checklist"] = mock["compliance_checklist"]
                    
                    logs.append(f"[{datetime.now().isoformat()}] ProposalGeneration: AI proposal generated successfully")
                    return {**state, "proposal_draft": ai_proposal, "agent_logs": logs, "current_step": "report_generation"}
            except Exception as e:
                logger.warning(f"Groq proposal generation failed: {e}")

        # Fallback: detailed mock
        proposal = _generate_mock_proposal(profile, metadata, bid)
        logs.append(f"[{datetime.now().isoformat()}] ProposalGeneration: Mock proposal generated")

        return {**state, "proposal_draft": proposal, "agent_logs": logs, "current_step": "report_generation"}

    except Exception as e:
        logs.append(f"[{datetime.now().isoformat()}] ProposalGeneration: Error - {str(e)}")
        return {
            **state,
            "proposal_draft": {"executive_summary": "Proposal generation encountered an error. Please review manually.", "technical_proposal": "", "scope_of_work": "", "project_plan": "", "budget_template": "", "compliance_checklist": []},
            "agent_logs": logs,
            "errors": state.get("errors", []) + [f"ProposalGeneration: {str(e)}"],
            "current_step": "report_generation",
        }
