"""
LangGraph State Definition for Tender Analysis Pipeline
"""
from typing import TypedDict, List, Optional, Any, Dict
from datetime import datetime


class TenderMetadata(TypedDict, total=False):
    title: str
    department: str
    deadline: str
    budget: float
    category: str
    reference_number: str
    experience_required: int
    turnover_required: float
    certifications: List[str]
    technical_requirements: List[str]
    financial_requirements: List[str]
    timeline: str
    evaluation_criteria: List[str]
    submission_requirements: List[str]


class BusinessProfileData(TypedDict, total=False):
    company_name: str
    company_type: str  # startup/msme/enterprise/ngo
    annual_turnover: float
    turnover_unit: str  # absolute/lakhs/crores
    turnover: float  # legacy compatibility in lakhs
    experience_years: int
    certifications: List[str]
    team_size: int
    industry: str
    state: str
    tech_stack: List[str]
    past_projects: List[str]
    registration_number: str


class EligibilityData(TypedDict, total=False):
    """
    Standardized Eligibility Result Data.
    All scores (overall_score, experience_match, turnover_match, cert_match, tech_match) must be in 0.0-1.0 range.
    """
    overall_score: float      # always 0.0–1.0
    experience_match: float   # always 0.0–1.0
    turnover_match: float     # always 0.0–1.0
    cert_match: float         # always 0.0–1.0
    tech_match: float         # always 0.0–1.0
    missing_items: List[str]
    eligible: bool
    failed: bool              # True if eligibility analysis failed
    error: Optional[str]      # Error message if failed
    breakdown: List[Dict[str, Any]]


class GapItemData(TypedDict, total=False):
    requirement: str
    current_status: str
    gap_type: str  # critical/important/optional
    recommendation: str


class CostData(TypedDict, total=False):
    development_cost: float
    infrastructure_cost: float
    team_cost: float
    operational_cost: float
    total: float
    currency: str
    margin_recommendation: float
    breakdown_details: Dict[str, Any]


class RiskData(TypedDict, total=False):
    financial_risk: str
    compliance_risk: str
    technical_risk: str
    delivery_risk: str
    overall_risk: str
    risk_score: float
    mitigation: List[str]


class SchemeData(TypedDict, total=False):
    name: str
    provider: str
    benefit: str
    eligibility: str
    amount: str
    deadline: str
    link: str
    match_score: float


class CompetitorData(TypedDict, total=False):
    competition_level: str
    estimated_competitors: int
    key_players: List[str]
    win_factors: List[str]


class BidData(TypedDict, total=False):
    win_probability: float
    confidence: str
    recommendation: str
    key_factors: List[str]


class ProposalData(TypedDict, total=False):
    executive_summary: str
    technical_proposal: str
    scope_of_work: str
    project_plan: str
    budget_template: str
    compliance_checklist: List[str]


class TenderAnalysisState(TypedDict, total=False):
    # Identity
    analysis_id: str
    tender_id: str
    current_step: str
    
    # Input data
    tender_text: str
    tender_pdf_path: str
    tender_url: str
    
    # Extracted data
    tender_metadata: TenderMetadata
    tender_title: str
    
    # Business profile
    business_profile: BusinessProfileData
    business_readiness_score: float
    
    # Analysis results
    eligibility_result: EligibilityData
    gaps: List[GapItemData]
    cost_estimate: CostData
    risk_report: RiskData
    scheme_recommendations: List[SchemeData]
    competitor_analysis: CompetitorData
    bid_prediction: BidData
    proposal_draft: ProposalData
    
    # Discovered tenders (for discovery mode)
    discovered_tenders: List[Dict[str, Any]]
    
    # Report
    report_data: Dict[str, Any]
    pdf_report_path: str
    
    # Logging
    agent_logs: List[str]
    errors: List[str]
    
    # Timestamps
    started_at: str
    completed_at: str

    # API Keys (optional user-supplied keys)
    groq_api_key: Optional[str]
    gemini_api_key: Optional[str]
