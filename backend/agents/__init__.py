"""
Agents package - import all agent modules with shorthand aliases
"""
import importlib
import sys
from pathlib import Path

# Add parent to sys.path
_agents_dir = Path(__file__).parent
_backend_dir = _agents_dir.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

# Import each agent module with alias
import agents.agent_01_tender_discovery as a01
import agents.agent_02_document_extraction as a02
import agents.agent_03_business_profile as a03
import agents.agent_04_eligibility_analysis as a04
import agents.agent_05_technical_requirement as a05
import agents.agent_06_cost_estimation as a06
import agents.agent_07_risk_assessment as a07
import agents.agent_08_scheme_recommendation as a08
import agents.agent_09_competitor_analysis as a09
import agents.agent_10_bid_prediction as a10
import agents.agent_11_proposal_generation as a11
import agents.agent_12_report_generation as a12
import agents.agent_13_pdf_export as a13

__all__ = ["a01","a02","a03","a04","a05","a06","a07","a08","a09","a10","a11","a12","a13"]
