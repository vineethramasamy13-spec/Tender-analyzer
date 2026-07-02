"""
Pydantic v2 schemas for the Tender Analyzer platform.
All models used across agents, API, and database layers.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Literal
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class CompanyType(str, Enum):
    startup = "startup"
    msme = "msme"
    enterprise = "enterprise"
    ngo = "ngo"


class GapType(str, Enum):
    critical = "critical"
    important = "important"
    optional = "optional"


class RiskLevel(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"


class TenderCategory(str, Enum):
    it_software = "IT/Software"
    infrastructure = "Infrastructure"
    consulting = "Consulting"
    healthcare = "Healthcare"
    education = "Education"
    defense = "Defense"
    energy = "Energy"
    transport = "Transport"
    other = "Other"


class TenderStatus(str, Enum):
    open = "open"
    closed = "closed"
    awarded = "awarded"
    cancelled = "cancelled"


# ---------------------------------------------------------------------------
# Tender models
# ---------------------------------------------------------------------------

class TenderBase(BaseModel):
    title: str
    department: str
    description: Optional[str] = None
    category: TenderCategory = TenderCategory.it_software
    budget_min: Optional[float] = None  # INR
    budget_max: Optional[float] = None  # INR
    deadline: Optional[str] = None
    reference_number: Optional[str] = None
    source: Optional[str] = None  # GeM / CPPP / Google
    source_url: Optional[str] = None
    state: Optional[str] = None
    status: TenderStatus = TenderStatus.open


class TenderCreate(TenderBase):
    raw_text: Optional[str] = None
    file_path: Optional[str] = None


class TenderResponse(TenderBase):
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    analysis_id: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Business Profile
# ---------------------------------------------------------------------------

class BusinessProfile(BaseModel):
    company_id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    turnover: Optional[float] = Field(None, description="Annual turnover in INR (lakhs)")
    annual_turnover: Optional[float] = Field(None, description="Annual turnover value")
    turnover_unit: Literal["absolute", "lakhs", "crores"] = "lakhs"
    certifications: List[str] = Field(default_factory=list)
    experience_years: int = Field(..., ge=0, description="Years of relevant experience")
    team_size: int = Field(..., ge=1)
    industry: str
    state: str
    company_type: CompanyType
    pan_number: Optional[str] = None
    gstin: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    registered_on_gem: bool = False
    dpiit_recognized: bool = False
    previous_tenders_won: int = 0
    technical_capabilities: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Eligibility
# ---------------------------------------------------------------------------

class EligibilityResult(BaseModel):
    overall_score: float = Field(..., ge=0, le=100, description="Overall eligibility score 0-100")
    experience_match: float = Field(..., ge=0, le=100)
    turnover_match: float = Field(..., ge=0, le=100)
    cert_match: float = Field(..., ge=0, le=100)
    tech_match: float = Field(..., ge=0, le=100)
    missing_items: List[str] = Field(default_factory=list)
    eligible: bool
    ineligible_reasons: List[str] = Field(default_factory=list)
    borderline_items: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Gap Analysis
# ---------------------------------------------------------------------------

class GapItem(BaseModel):
    requirement: str
    current_status: str
    gap_type: GapType
    recommendation: str
    effort_weeks: Optional[int] = None
    estimated_cost_inr: Optional[float] = None


# ---------------------------------------------------------------------------
# Cost Estimation
# ---------------------------------------------------------------------------

class CostEstimate(BaseModel):
    development_cost: float = Field(..., description="INR")
    infrastructure_cost: float = Field(..., description="INR")
    team_cost: float = Field(..., description="INR")
    operational_cost: float = Field(..., description="INR")
    miscellaneous_cost: float = Field(default=0.0, description="INR")
    total: float = Field(..., description="INR")
    currency: str = "INR"
    margin_recommendation: float = Field(..., description="Margin % recommended")
    bid_price_recommendation: float = Field(default=0.0, description="Recommended bid price in INR")
    cost_breakdown: Dict[str, float] = Field(default_factory=dict)
    assumptions: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Risk Assessment
# ---------------------------------------------------------------------------

class RiskReport(BaseModel):
    financial_risk: str
    compliance_risk: str
    technical_risk: str
    delivery_risk: str
    overall_risk: str
    risk_score: float = Field(..., ge=0, le=10)
    mitigation: List[str] = Field(default_factory=list)
    financial_risk_details: Optional[str] = None
    compliance_risk_details: Optional[str] = None
    technical_risk_details: Optional[str] = None
    delivery_risk_details: Optional[str] = None


# ---------------------------------------------------------------------------
# Scheme Recommendations
# ---------------------------------------------------------------------------

class SchemeRecommendation(BaseModel):
    name: str
    provider: str
    benefit: str
    eligibility: str
    amount: str
    deadline: str
    link: str
    match_score: float = Field(..., ge=0, le=1)
    category: Optional[str] = None
    how_to_apply: Optional[str] = None


# ---------------------------------------------------------------------------
# Competitor Analysis
# ---------------------------------------------------------------------------

class CompetitorAnalysis(BaseModel):
    competition_level: str  # Low / Medium / High
    estimated_competitors: int
    key_players: List[str]
    win_factors: List[str]
    market_insights: Optional[str] = None
    price_sensitivity: Optional[str] = None
    differentiators: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Bid Prediction
# ---------------------------------------------------------------------------

class BidPrediction(BaseModel):
    win_probability: float = Field(..., ge=0, le=1)
    confidence: str  # High / Medium / Low
    recommendation: str  # Apply Immediately / Apply with Improvements / Reconsider
    key_factors: List[str]
    score_breakdown: Dict[str, float] = Field(default_factory=dict)
    improvement_actions: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Proposal Draft
# ---------------------------------------------------------------------------

class ProposalDraft(BaseModel):
    executive_summary: str
    technical_proposal: str
    scope_of_work: str
    project_plan: str
    budget_template: str
    compliance_checklist: List[str]
    about_company: Optional[str] = None
    team_composition: Optional[str] = None
    past_performance: Optional[str] = None
    quality_assurance: Optional[str] = None


# ---------------------------------------------------------------------------
# LangGraph State (TypedDict-style as Pydantic for serialization)
# ---------------------------------------------------------------------------

class TenderAnalysisState(BaseModel):
    """Full LangGraph state shared across all agents."""

    # Identifiers
    analysis_id: str = Field(default_factory=lambda: str(uuid4()))
    tender_id: Optional[str] = None
    company_id: Optional[str] = None

    # Tender info
    tender_title: Optional[str] = None
    tender_text: Optional[str] = None
    tender_url: Optional[str] = None
    tender_file_path: Optional[str] = None
    tender_metadata: Dict[str, Any] = Field(default_factory=dict)

    # Business
    business_profile: Optional[BusinessProfile] = None

    # Agent outputs
    eligibility_result: Optional[EligibilityResult] = None
    gaps: List[GapItem] = Field(default_factory=list)
    cost_estimate: Optional[CostEstimate] = None
    risk_report: Optional[RiskReport] = None
    scheme_recommendations: List[SchemeRecommendation] = Field(default_factory=list)
    competitor_analysis: Optional[CompetitorAnalysis] = None
    bid_prediction: Optional[BidPrediction] = None
    proposal_draft: Optional[ProposalDraft] = None

    # Report
    report_data: Dict[str, Any] = Field(default_factory=dict)
    report_path: Optional[str] = None
    report_url: Optional[str] = None

    # Discovered tenders (from discovery agent)
    discovered_tenders: List[Dict[str, Any]] = Field(default_factory=list)

    # Tracking
    agent_logs: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    current_step: str = "initialized"
    progress_percent: int = 0

    # Timestamps
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# API Request / Response models
# ---------------------------------------------------------------------------

class AnalysisRequest(BaseModel):
    business_profile: BusinessProfile
    tender_text: Optional[str] = None
    tender_url: Optional[str] = None
    tender_id: Optional[str] = None
    tender_file_path: Optional[str] = None


class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str = "started"
    message: str = "Analysis pipeline started"
    websocket_url: Optional[str] = None


class AnalysisStatusResponse(BaseModel):
    analysis_id: str
    status: str
    current_step: str
    progress_percent: int
    agent_logs: List[str]
    errors: List[str]
    completed: bool = False
    report_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    history: List[ChatMessage] = Field(default_factory=list)
    analysis_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    sources: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class DashboardStats(BaseModel):
    total_tenders_analyzed: int = 0
    total_tenders_discovered: int = 0
    average_win_probability: float = 0.0
    high_probability_tenders: int = 0
    schemes_matched: int = 0
    reports_generated: int = 0
    top_categories: List[Dict[str, Any]] = Field(default_factory=list)
    recent_analyses: List[Dict[str, Any]] = Field(default_factory=list)
    monthly_trend: List[Dict[str, Any]] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Upload response
# ---------------------------------------------------------------------------

class UploadResponse(BaseModel):
    tender_id: str
    file_name: str
    file_path: str
    pages: int
    extracted_text_preview: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    message: str = "PDF uploaded and text extracted successfully"


# ---------------------------------------------------------------------------
# Profile Save
# ---------------------------------------------------------------------------

class ProfileSaveResponse(BaseModel):
    company_id: str
    message: str = "Business profile saved successfully"
