import pytest
import asyncio
from agents.agent_03_business_profile import run_business_profile_analysis
from agents.agent_04_eligibility_analysis import run_eligibility_analysis
from agents.agent_06_cost_estimation import run_cost_estimation
from agents.agent_07_risk_assessment import run_risk_assessment
from agents.agent_10_bid_prediction import run_bid_prediction

@pytest.mark.asyncio
async def test_business_profile_and_eligibility():
    state = {
        "business_profile": {
            "experience_years": 5,
            "annual_turnover": 12000000.0,
            "certifications": ["ISO 9001", "ISO 27001"],
            "team_size": 15
        },
        "tender_metadata": {
            "experience_required": 3,
            "turnover_required": 10000000.0,
            "certifications": ["ISO 9001"],
        },
        "agent_logs": []
    }
    
    # Step 1: Run profile analysis
    profile_state = await run_business_profile_analysis(state)
    assert "business_readiness_score" in profile_state
    assert profile_state["business_readiness_score"] > 0
    assert "_profile_scores" in profile_state
    
    # Step 2: Run eligibility analysis
    eligibility_state = await run_eligibility_analysis(profile_state)
    assert "eligibility_result" in eligibility_state
    eligibility_result = eligibility_state["eligibility_result"]
    assert eligibility_result["eligible"] is True
    assert eligibility_result["overall_score"] > 0.5


@pytest.mark.asyncio
async def test_cost_estimation():
    state = {
        "business_profile": {
            "team_size": 15,
            "company_type": "startup"
        },
        "tender_metadata": {
            "budget": 5000000.0,
            "timeline": "12 months"
        },
        "agent_logs": []
    }
    
    cost_state = await run_cost_estimation(state)
    assert "cost_estimate" in cost_state
    estimate = cost_state["cost_estimate"]
    assert "total" in estimate
    assert estimate["total"] > 0


@pytest.mark.asyncio
async def test_risk_assessment():
    state = {
        "business_profile": {
            "experience_years": 2,
            "annual_turnover": 3000000.0,
            "certifications": []
        },
        "tender_metadata": {
            "experience_required": 5,
            "turnover_required": 10000000.0,
            "certifications": ["ISO 27001"]
        },
        "agent_logs": []
    }
    
    risk_state = await run_risk_assessment(state)
    assert "risk_report" in risk_state
    risk = risk_state["risk_report"]
    assert "overall_risk" in risk
    assert "risk_score" in risk


@pytest.mark.asyncio
async def test_bid_prediction():
    state = {
        "eligibility_result": {
            "overall_score": 0.85
        },
        "risk_report": {
            "risk_score": 3.0
        },
        "competitor_analysis": {
            "competition_level": "Medium"
        },
        "business_profile": {
            "experience_years": 5,
            "certifications": ["ISO 9001"]
        },
        "tender_metadata": {
            "experience_required": 3,
            "certifications": ["ISO 9001"]
        },
        "agent_logs": []
    }
    
    bid_state = await run_bid_prediction(state)
    assert "bid_prediction" in bid_state
    pred = bid_state["bid_prediction"]
    assert "win_probability" in pred
    assert "confidence" in pred
