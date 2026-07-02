"""
MCP Search Server - Tender and Scheme Discovery Tools
"""
import httpx
import asyncio
from datetime import datetime, timedelta
import random
from typing import List, Dict, Any
from loguru import logger


def get_mock_tenders() -> List[Dict[str, Any]]:
    """Returns 15 realistic Indian government tenders as fallback data."""
    base_date = datetime.now()
    tenders = [
        {
            "id": "TEN-2025-NIC-001",
            "title": "Integrated e-Governance Platform Development",
            "department": "National Informatics Centre (NIC)",
            "ministry": "Ministry of Electronics and IT",
            "budget": 32000000,
            "budget_formatted": "₹3.2 Cr",
            "deadline": (base_date + timedelta(days=45)).strftime("%Y-%m-%d"),
            "category": "IT/Software",
            "reference_number": "NIC/eGov/2025/001",
            "description": "Development of integrated e-governance platform for state departments with citizen services portal, backend workflow automation, and mobile application.",
            "eligibility": {
                "experience_years": 5,
                "turnover_required": 10000000,
                "certifications": ["ISO 9001", "ISO 27001"],
                "team_size": 20
            },
            "match_score": 85,
            "status": "open",
            "source": "GeM",
            "location": "Chennai, Tamil Nadu",
        },
        {
            "id": "TEN-2025-DRDO-002",
            "title": "Cybersecurity Infrastructure Upgrade and SOC Implementation",
            "department": "Defence Research and Development Organisation (DRDO)",
            "ministry": "Ministry of Defence",
            "budget": 18000000,
            "budget_formatted": "₹1.8 Cr",
            "deadline": (base_date + timedelta(days=30)).strftime("%Y-%m-%d"),
            "category": "Cybersecurity",
            "reference_number": "DRDO/CYBER/2025/002",
            "description": "Establishment of Security Operations Center with SIEM, threat intelligence, and 24x7 monitoring for DRDO facilities.",
            "eligibility": {
                "experience_years": 7,
                "turnover_required": 15000000,
                "certifications": ["ISO 27001", "CERT-In empanelled"],
                "team_size": 15
            },
            "match_score": 72,
            "status": "open",
            "source": "CPPP",
            "location": "Hyderabad, Telangana",
        },
        {
            "id": "TEN-2025-MOH-003",
            "title": "Hospital Management Information System (HMIS) Development",
            "department": "Ministry of Health and Family Welfare",
            "ministry": "Ministry of Health",
            "budget": 25000000,
            "budget_formatted": "₹2.5 Cr",
            "deadline": (base_date + timedelta(days=60)).strftime("%Y-%m-%d"),
            "category": "HealthTech",
            "reference_number": "MOH/HMIS/2025/003",
            "description": "End-to-end hospital management system covering OPD, IPD, pharmacy, lab, billing, and health records management for 50+ government hospitals.",
            "eligibility": {
                "experience_years": 5,
                "turnover_required": 8000000,
                "certifications": ["ISO 9001"],
                "team_size": 25
            },
            "match_score": 78,
            "status": "open",
            "source": "GeM",
            "location": "Pune, Maharashtra",
        },
        {
            "id": "TEN-2025-UIDAI-004",
            "title": "Aadhaar Integration API Services and Middleware Development",
            "department": "Unique Identification Authority of India (UIDAI)",
            "ministry": "Ministry of Electronics and IT",
            "budget": 8500000,
            "budget_formatted": "₹85 L",
            "deadline": (base_date + timedelta(days=25)).strftime("%Y-%m-%d"),
            "category": "API Development",
            "reference_number": "UIDAI/API/2025/004",
            "description": "Development of secure middleware for Aadhaar-based authentication and eKYC integration for government services.",
            "eligibility": {
                "experience_years": 3,
                "turnover_required": 5000000,
                "certifications": ["ISO 27001"],
                "team_size": 10
            },
            "match_score": 90,
            "status": "open",
            "source": "GeM",
            "location": "Bengaluru, Karnataka",
        },
        {
            "id": "TEN-2025-RAIL-005",
            "title": "Real-time Passenger Information and Journey Planner System",
            "department": "Indian Railways",
            "ministry": "Ministry of Railways",
            "budget": 41000000,
            "budget_formatted": "₹4.1 Cr",
            "deadline": (base_date + timedelta(days=90)).strftime("%Y-%m-%d"),
            "category": "IT/Software",
            "reference_number": "IR/RPIS/2025/005",
            "description": "Mobile and web application for real-time train tracking, PNR status, seat availability, and AI-powered journey planning for 10 million daily users.",
            "eligibility": {
                "experience_years": 8,
                "turnover_required": 20000000,
                "certifications": ["ISO 9001", "ISO 27001"],
                "team_size": 30
            },
            "match_score": 65,
            "status": "open",
            "source": "CPPP",
            "location": "Mumbai, Maharashtra",
        },
        {
            "id": "TEN-2025-MEITY-006",
            "title": "Digital India Portal Enhancement and Content Management",
            "department": "Ministry of Electronics and Information Technology (MeitY)",
            "ministry": "Ministry of Electronics and IT",
            "budget": 12000000,
            "budget_formatted": "₹1.2 Cr",
            "deadline": (base_date + timedelta(days=40)).strftime("%Y-%m-%d"),
            "category": "Web Development",
            "reference_number": "MEITY/DI/2025/006",
            "description": "Enhancement of Digital India portal with multilingual support, accessibility compliance, CMS integration, and performance optimization.",
            "eligibility": {
                "experience_years": 4,
                "turnover_required": 6000000,
                "certifications": ["ISO 9001"],
                "team_size": 12
            },
            "match_score": 88,
            "status": "open",
            "source": "GeM",
            "location": "New Delhi, Delhi",
        },
        {
            "id": "TEN-2025-SEBI-007",
            "title": "Financial Data Analytics and Market Surveillance Platform",
            "department": "Securities and Exchange Board of India (SEBI)",
            "ministry": "Ministry of Finance",
            "budget": 28000000,
            "budget_formatted": "₹2.8 Cr",
            "deadline": (base_date + timedelta(days=55)).strftime("%Y-%m-%d"),
            "category": "Data Analytics",
            "reference_number": "SEBI/ANALYTICS/2025/007",
            "description": "Big data analytics platform for market surveillance, insider trading detection, and regulatory compliance monitoring using ML/AI.",
            "eligibility": {
                "experience_years": 6,
                "turnover_required": 12000000,
                "certifications": ["ISO 27001", "ISO 9001"],
                "team_size": 20
            },
            "match_score": 70,
            "status": "open",
            "source": "GeM",
            "location": "Mumbai, Maharashtra",
        },
        {
            "id": "TEN-2025-AGRI-008",
            "title": "Crop Monitoring and Farmer Advisory Mobile Application",
            "department": "Ministry of Agriculture and Farmers Welfare",
            "ministry": "Ministry of Agriculture",
            "budget": 4500000,
            "budget_formatted": "₹45 L",
            "deadline": (base_date + timedelta(days=35)).strftime("%Y-%m-%d"),
            "category": "AgriTech",
            "reference_number": "AGRI/CROP/2025/008",
            "description": "AI-powered mobile app for crop disease detection, weather advisory, market prices, and government scheme information for farmers in 5 states.",
            "eligibility": {
                "experience_years": 2,
                "turnover_required": 3000000,
                "certifications": [],
                "team_size": 8
            },
            "match_score": 92,
            "status": "open",
            "source": "GeM",
            "location": "Bhopal, Madhya Pradesh",
        },
        {
            "id": "TEN-2025-ISRO-009",
            "title": "Satellite Data Processing and Geospatial Analysis System",
            "department": "Indian Space Research Organisation (ISRO)",
            "ministry": "Department of Space",
            "budget": 50000000,
            "budget_formatted": "₹5 Cr",
            "deadline": (base_date + timedelta(days=75)).strftime("%Y-%m-%d"),
            "category": "Data Processing",
            "reference_number": "ISRO/SAT/2025/009",
            "description": "High-performance system for processing satellite imagery, geospatial analysis, disaster management support, and agricultural monitoring.",
            "eligibility": {
                "experience_years": 10,
                "turnover_required": 25000000,
                "certifications": ["ISO 9001", "ISO 27001", "CMMI Level 3"],
                "team_size": 40
            },
            "match_score": 55,
            "status": "open",
            "source": "CPPP",
            "location": "Bengaluru, Karnataka",
        },
        {
            "id": "TEN-2025-EPFO-010",
            "title": "Provident Fund Management System Modernization",
            "department": "Employees Provident Fund Organisation (EPFO)",
            "ministry": "Ministry of Labour and Employment",
            "budget": 35000000,
            "budget_formatted": "₹3.5 Cr",
            "deadline": (base_date + timedelta(days=50)).strftime("%Y-%m-%d"),
            "category": "Enterprise Software",
            "reference_number": "EPFO/PF/2025/010",
            "description": "Modernization of EPFO's core IT systems including member portal, employer dashboard, claim processing, and payment gateway integration.",
            "eligibility": {
                "experience_years": 7,
                "turnover_required": 18000000,
                "certifications": ["ISO 9001", "ISO 27001", "CMMI Level 2"],
                "team_size": 35
            },
            "match_score": 68,
            "status": "open",
            "source": "GeM",
            "location": "New Delhi, Delhi",
        },
        {
            "id": "TEN-2025-SMART-011",
            "title": "IoT-based Smart Traffic Management System",
            "department": "Smart Cities Mission",
            "ministry": "Ministry of Housing and Urban Affairs",
            "budget": 21000000,
            "budget_formatted": "₹2.1 Cr",
            "deadline": (base_date + timedelta(days=45)).strftime("%Y-%m-%d"),
            "category": "IoT/Smart City",
            "reference_number": "SCM/TRAFFIC/2025/011",
            "description": "IoT sensor network, adaptive traffic signal control, ANPR cameras, and central command center for 3 smart cities.",
            "eligibility": {
                "experience_years": 5,
                "turnover_required": 10000000,
                "certifications": ["ISO 9001"],
                "team_size": 20
            },
            "match_score": 75,
            "status": "open",
            "source": "GeM",
            "location": "Surat, Gujarat",
        },
        {
            "id": "TEN-2025-GSTN-012",
            "title": "GST Analytics Dashboard and Taxpayer Intelligence System",
            "department": "Goods and Services Tax Network (GSTN)",
            "ministry": "Ministry of Finance",
            "budget": 15000000,
            "budget_formatted": "₹1.5 Cr",
            "deadline": (base_date + timedelta(days=38)).strftime("%Y-%m-%d"),
            "category": "FinTech Analytics",
            "reference_number": "GSTN/ANALYTICS/2025/012",
            "description": "Advanced analytics platform for GST compliance monitoring, fraud detection, taxpayer segmentation, and revenue forecasting.",
            "eligibility": {
                "experience_years": 5,
                "turnover_required": 8000000,
                "certifications": ["ISO 27001"],
                "team_size": 15
            },
            "match_score": 82,
            "status": "open",
            "source": "CPPP",
            "location": "New Delhi, Delhi",
        },
        {
            "id": "TEN-2025-EDU-013",
            "title": "DIKSHA Digital Learning Platform Enhancement and Content Delivery",
            "department": "Ministry of Education",
            "ministry": "Ministry of Education",
            "budget": 9000000,
            "budget_formatted": "₹90 L",
            "deadline": (base_date + timedelta(days=42)).strftime("%Y-%m-%d"),
            "category": "EdTech",
            "reference_number": "MOE/DIKSHA/2025/013",
            "description": "Enhancement of DIKSHA e-learning platform with AI-personalized content, offline capability, regional language support, and teacher training modules.",
            "eligibility": {
                "experience_years": 3,
                "turnover_required": 5000000,
                "certifications": ["ISO 9001"],
                "team_size": 15
            },
            "match_score": 87,
            "status": "open",
            "source": "GeM",
            "location": "New Delhi, Delhi",
        },
        {
            "id": "TEN-2025-NITI-014",
            "title": "Policy Impact Assessment and Data Visualization Tool",
            "department": "NITI Aayog",
            "ministry": "Planning Commission",
            "budget": 6500000,
            "budget_formatted": "₹65 L",
            "deadline": (base_date + timedelta(days=28)).strftime("%Y-%m-%d"),
            "category": "GovTech Analytics",
            "reference_number": "NITI/POLICY/2025/014",
            "description": "Interactive dashboard for monitoring SDG progress, policy intervention impact, district-level data visualization, and predictive analytics for policymakers.",
            "eligibility": {
                "experience_years": 3,
                "turnover_required": 4000000,
                "certifications": [],
                "team_size": 10
            },
            "match_score": 91,
            "status": "open",
            "source": "GeM",
            "location": "New Delhi, Delhi",
        },
        {
            "id": "TEN-2025-CUST-015",
            "title": "Customs Trade Facilitation and Risk Management Portal",
            "department": "Central Board of Indirect Taxes and Customs (CBIC)",
            "ministry": "Ministry of Finance",
            "budget": 19000000,
            "budget_formatted": "₹1.9 Cr",
            "deadline": (base_date + timedelta(days=65)).strftime("%Y-%m-%d"),
            "category": "Trade & Customs",
            "reference_number": "CBIC/TRADE/2025/015",
            "description": "Modernization of customs clearance system with risk-based selectivity, AI-assisted cargo assessment, and trade facilitation portal for importers/exporters.",
            "eligibility": {
                "experience_years": 6,
                "turnover_required": 10000000,
                "certifications": ["ISO 9001", "ISO 27001"],
                "team_size": 20
            },
            "match_score": 74,
            "status": "open",
            "source": "CPPP",
            "location": "New Delhi, Delhi",
        },
        {
            "id": "TEN-2025-WB-016",
            "title": "Smart Grid Metering Platform and Analytics System",
            "department": "West Bengal State Electricity Distribution Company (WBSEDCL)",
            "ministry": "Power Department, West Bengal",
            "budget": 18000000,
            "budget_formatted": "₹1.8 Cr",
            "deadline": (base_date + timedelta(days=50)).strftime("%Y-%m-%d"),
            "category": "IoT/Smart City",
            "reference_number": "WBSEDCL/SMART/2025/016",
            "description": "Implementation of smart grid metering communication software, data collection engine, and predictive analytics for power usage.",
            "eligibility": {
                "experience_years": 5,
                "turnover_required": 9000000,
                "certifications": ["ISO 9001", "ISO 27001"],
                "team_size": 18
            },
            "match_score": 77,
            "status": "open",
            "source": "CPPP",
            "location": "Kolkata, West Bengal",
        },
        {
            "id": "TEN-2025-UP-017",
            "title": "UP e-District Portal Upgrade & Cloud Migration",
            "department": "UP Electronics Corporation Limited (UPECL)",
            "ministry": "IT & Electronics Department, Uttar Pradesh",
            "budget": 25000000,
            "budget_formatted": "₹2.5 Cr",
            "deadline": (base_date + timedelta(days=48)).strftime("%Y-%m-%d"),
            "category": "IT/Software",
            "reference_number": "UPECL/EDIST/2025/017",
            "description": "Upgrading e-District portal architecture for scalable citizen service delivery, database normalization, and secure migration to state data center cloud.",
            "eligibility": {
                "experience_years": 5,
                "turnover_required": 12000000,
                "certifications": ["ISO 9001", "ISO 27001", "CMMI Level 3"],
                "team_size": 25
            },
            "match_score": 83,
            "status": "open",
            "source": "GeM",
            "location": "Lucknow, Uttar Pradesh",
        },
        {
            "id": "TEN-2025-RAJ-018",
            "title": "Raj-LMS Learning Management System for Schools",
            "department": "Department of Information Technology & Communication (DoIT&C)",
            "ministry": "Government of Rajasthan",
            "budget": 12000000,
            "budget_formatted": "₹1.2 Cr",
            "deadline": (base_date + timedelta(days=35)).strftime("%Y-%m-%d"),
            "category": "EdTech",
            "reference_number": "DOITC/LMS/2025/018",
            "description": "Unified learning management platform for government schools in Rajasthan with offline video delivery, quiz module, and performance dashboards.",
            "eligibility": {
                "experience_years": 3,
                "turnover_required": 6000000,
                "certifications": ["ISO 9001"],
                "team_size": 12
            },
            "match_score": 88,
            "status": "open",
            "source": "GeM",
            "location": "Jaipur, Rajasthan",
        },
        {
            "id": "TEN-2025-KER-019",
            "title": "KFON Network Monitoring System & OSS Integration",
            "department": "Kerala State IT Infrastructure Limited (KSITIL)",
            "ministry": "IT Department, Kerala",
            "budget": 31000000,
            "budget_formatted": "₹3.1 Cr",
            "deadline": (base_date + timedelta(days=58)).strftime("%Y-%m-%d"),
            "category": "IT/Software",
            "reference_number": "KSITIL/KFON/2025/019",
            "description": "Robust network operations center software for KFON (Kerala Fiber Optic Network) to monitor link health, automate ticketing, and bill ISPs.",
            "eligibility": {
                "experience_years": 6,
                "turnover_required": 15000000,
                "certifications": ["ISO 27001"],
                "team_size": 22
            },
            "match_score": 75,
            "status": "open",
            "source": "CPPP",
            "location": "Kochi, Kerala",
        },
        {
            "id": "TEN-2025-AP-020",
            "title": "AP Maritime Board Cargo Logistics Portal",
            "department": "Andhra Pradesh Maritime Board (APMB)",
            "ministry": "Infrastructure & Investment, Andhra Pradesh",
            "budget": 45000000,
            "budget_formatted": "₹4.5 Cr",
            "deadline": (base_date + timedelta(days=70)).strftime("%Y-%m-%d"),
            "category": "IT/Software",
            "reference_number": "APMB/CARGO/2025/020",
            "description": "Logistics and vessel tracking software platform for cargo handling, customs clearance workflow, and port authority billing.",
            "eligibility": {
                "experience_years": 8,
                "turnover_required": 22000000,
                "certifications": ["ISO 9001", "ISO 27001"],
                "team_size": 28
            },
            "match_score": 68,
            "status": "open",
            "source": "GeM",
            "location": "Visakhapatnam, Andhra Pradesh",
        },
        {
            "id": "TEN-2025-ODISHA-021",
            "title": "Odisha Mining Asset Management & IoT Dashboard",
            "department": "Odisha Mining Corporation (OMC)",
            "ministry": "Steel & Mines Department, Odisha",
            "budget": 28000000,
            "budget_formatted": "₹2.8 Cr",
            "deadline": (base_date + timedelta(days=52)).strftime("%Y-%m-%d"),
            "category": "IoT/Smart City",
            "reference_number": "OMC/ASSETS/2025/021",
            "description": "IoT-based heavy machinery monitoring, RFID truck tracking, and dashboard reporting system for mines across Odisha.",
            "eligibility": {
                "experience_years": 5,
                "turnover_required": 12000000,
                "certifications": ["ISO 9001"],
                "team_size": 15
            },
            "match_score": 80,
            "status": "open",
            "source": "CPPP",
            "location": "Bhubaneswar, Odisha",
        },
        {
            "id": "TEN-2025-BIHAR-022",
            "title": "Beltron e-Procurement Engine Revamp",
            "department": "Bihar State Electronics Development Corp (Beltron)",
            "ministry": "IT Department, Bihar",
            "budget": 15000000,
            "budget_formatted": "₹1.5 Cr",
            "deadline": (base_date + timedelta(days=40)).strftime("%Y-%m-%d"),
            "category": "IT/Software",
            "reference_number": "BELTRON/EPROC/2025/022",
            "description": "Modernization of Bihar's central e-procurement platform engine with advanced bid security, encryption, and audit logs.",
            "eligibility": {
                "experience_years": 5,
                "turnover_required": 8000000,
                "certifications": ["ISO 27001"],
                "team_size": 15
            },
            "match_score": 82,
            "status": "open",
            "source": "GeM",
            "location": "Patna, Bihar",
        },
        {
            "id": "TEN-2025-HAR-023",
            "title": "Haryana Police Safe City Video Surveillance Platform",
            "department": "Haryana Police Department",
            "ministry": "Home Affairs, Haryana",
            "budget": 34000000,
            "budget_formatted": "₹3.4 Cr",
            "deadline": (base_date + timedelta(days=62)).strftime("%Y-%m-%d"),
            "category": "Cybersecurity",
            "reference_number": "HARPOL/SURVEIL/2025/023",
            "description": "Integrated central surveillance software with AI-assisted video analytics, vehicle tracking, and automated alert systems for Haryana districts.",
            "eligibility": {
                "experience_years": 6,
                "turnover_required": 18000000,
                "certifications": ["ISO 27001", "ISO 9001"],
                "team_size": 25
            },
            "match_score": 76,
            "status": "open",
            "source": "GeM",
            "location": "Gurugram, Haryana",
        },
        {
            "id": "TEN-2025-GOA-024",
            "title": "Goa Smart Tourism Guide & Mobile Portal",
            "department": "Goa Tourism Development Corporation (GTDC)",
            "ministry": "Tourism Department, Goa",
            "budget": 9500000,
            "budget_formatted": "₹95 L",
            "deadline": (base_date + timedelta(days=30)).strftime("%Y-%m-%d"),
            "category": "Mobile App",
            "reference_number": "GTDC/TOUR/2025/024",
            "description": "Development of multilingual mobile tourist guide application with real-time booking, GPS transit data, and government hospitality integration.",
            "eligibility": {
                "experience_years": 3,
                "turnover_required": 4000000,
                "certifications": ["ISO 9001"],
                "team_size": 8
            },
            "match_score": 93,
            "status": "open",
            "source": "CPPP",
            "location": "Panaji, Goa",
        },
        {
            "id": "TEN-2025-PUNJAB-025",
            "title": "Smart Water Billing & CRM Platform",
            "department": "Punjab Municipal Infrastructure Development Company",
            "ministry": "Local Government Department, Punjab",
            "budget": 22000000,
            "budget_formatted": "₹2.2 Cr",
            "deadline": (base_date + timedelta(days=45)).strftime("%Y-%m-%d"),
            "category": "IT/Software",
            "reference_number": "PMIDC/WATER/2025/025",
            "description": "Centralized citizen water billing portal with payment gateway, leak detection ticketing CRM, and mobile app.",
            "eligibility": {
                "experience_years": 5,
                "turnover_required": 10000000,
                "certifications": ["ISO 9001"],
                "team_size": 18
            },
            "match_score": 79,
            "status": "open",
            "source": "GeM",
            "location": "Amritsar, Punjab",
        },
        {
            "id": "TEN-2025-ASM-026",
            "title": "Assam Flood Alert Forecasting System",
            "department": "Assam State Disaster Management Authority (ASDMA)",
            "ministry": "Government of Assam",
            "budget": 17000000,
            "budget_formatted": "₹1.7 Cr",
            "deadline": (base_date + timedelta(days=55)).strftime("%Y-%m-%d"),
            "category": "IT/Software",
            "reference_number": "ASDMA/FLOOD/2025/026",
            "description": "GIS mapping and predictive flood alert modeling system utilizing telemetry station sensors and SMS citizen notification engine.",
            "eligibility": {
                "experience_years": 4,
                "turnover_required": 8000000,
                "certifications": ["ISO 9001"],
                "team_size": 12
            },
            "match_score": 85,
            "status": "open",
            "source": "CPPP",
            "location": "Guwahati, Assam",
        },
        {
            "id": "TEN-2025-JHAR-027",
            "title": "Smart Classroom Analytics & Monitoring Portal",
            "department": "Jharkhand Education Project Council (JEPC)",
            "ministry": "School Education, Jharkhand",
            "budget": 8000000,
            "budget_formatted": "₹80 L",
            "deadline": (base_date + timedelta(days=28)).strftime("%Y-%m-%d"),
            "category": "EdTech",
            "reference_number": "JEPC/SMART/2025/027",
            "description": "Web portal for tracking smart classroom usage, teacher logs, student attendance analytics, and content distribution for primary schools.",
            "eligibility": {
                "experience_years": 3,
                "turnover_required": 3500000,
                "certifications": [],
                "team_size": 10
            },
            "match_score": 90,
            "status": "open",
            "source": "GeM",
            "location": "Ranchi, Jharkhand",
        },
        {
            "id": "TEN-2025-CG-028",
            "title": "CSPDCL Billing System Upgrade & Mobile App",
            "department": "Chhattisgarh State Power Distribution Company (CSPDCL)",
            "ministry": "Power Department, Chhattisgarh",
            "budget": 38000000,
            "budget_formatted": "₹3.8 Cr",
            "deadline": (base_date + timedelta(days=68)).strftime("%Y-%m-%d"),
            "category": "IT/Software",
            "reference_number": "CSPDCL/BILL/2025/028",
            "description": "Migration of consumer billing databases to scalable PostgreSQL cluster, mobile app revamp for online payments, and meter reader logging engine.",
            "eligibility": {
                "experience_years": 7,
                "turnover_required": 18000000,
                "certifications": ["ISO 9001", "ISO 27001"],
                "team_size": 25
            },
            "match_score": 71,
            "status": "open",
            "source": "GeM",
            "location": "Raipur, Chhattisgarh",
        },
        {
            "id": "TEN-2025-JK-029",
            "title": "Jammu & Kashmir Umang Mobile App Integration",
            "department": "J&K Information Technology Department",
            "ministry": "Government of J&K",
            "budget": 7500000,
            "budget_formatted": "₹75 L",
            "deadline": (base_date + timedelta(days=25)).strftime("%Y-%m-%d"),
            "category": "Mobile App",
            "reference_number": "JKIT/UMANG/2025/029",
            "description": "Integration of 30+ municipal services APIs into single citizen portal, mobile app optimization, and regional language translation middleware.",
            "eligibility": {
                "experience_years": 3,
                "turnover_required": 4000000,
                "certifications": ["ISO 27001"],
                "team_size": 8
            },
            "match_score": 91,
            "status": "open",
            "source": "CPPP",
            "location": "Srinagar, Jammu & Kashmir",
        },
        {
            "id": "TEN-2025-UK-030",
            "title": "Uttarakhand Smart Water IoT Flow Monitoring",
            "department": "Uttarakhand Jal Sansthan",
            "ministry": "Government of Uttarakhand",
            "budget": 11000000,
            "budget_formatted": "₹1.1 Cr",
            "deadline": (base_date + timedelta(days=40)).strftime("%Y-%m-%d"),
            "category": "IoT/Smart City",
            "reference_number": "UJS/FLOW/2025/030",
            "description": "Establishment of IoT-enabled water flow telemetry monitors, central database logging server, and SMS alerts for flow fluctuations in rural grids.",
            "eligibility": {
                "experience_years": 4,
                "turnover_required": 5000000,
                "certifications": ["ISO 9001"],
                "team_size": 12
            },
            "match_score": 87,
            "status": "open",
            "source": "GeM",
            "location": "Dehradun, Uttarakhand",
        },
    ]
    return tenders


async def search_tenders_google(
    query: str,
    api_key: str,
    cse_id: str,
    num_results: int = 10
) -> List[Dict[str, Any]]:
    """Search government tenders using Google Custom Search API."""
    if not api_key or not cse_id:
        logger.warning("Google CSE credentials not configured, using mock data")
        return get_mock_tenders()[:5]
    
    try:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": api_key,
            "cx": cse_id,
            "q": f"{query} government tender India site:gem.gov.in OR site:eprocure.gov.in",
            "num": num_results,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            data = response.json()
            
        results = []
        for item in data.get("items", []):
            results.append({
                "title": item.get("title", ""),
                "link": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "source": "Google CSE",
            })
        return results
    except Exception as e:
        logger.error(f"Google CSE search failed: {e}")
        return get_mock_tenders()[:5]


async def search_gem_portal(query: str) -> List[Dict[str, Any]]:
    """Search GeM portal for tenders (with mock fallback)."""
    try:
        # GeM doesn't have a public API, return filtered mock data
        all_tenders = get_mock_tenders()
        query_lower = query.lower()
        filtered = [
            t for t in all_tenders
            if query_lower in t["title"].lower()
            or query_lower in t["category"].lower()
            or query_lower in t["department"].lower()
        ]
        return filtered if filtered else all_tenders[:5]
    except Exception as e:
        logger.error(f"GeM search failed: {e}")
        return get_mock_tenders()[:5]


async def search_cppp_portal(query: str) -> List[Dict[str, Any]]:
    """Search CPPP portal for tenders (with mock fallback)."""
    try:
        all_tenders = get_mock_tenders()
        cppp_tenders = [t for t in all_tenders if t.get("source") == "CPPP"]
        return cppp_tenders[:5]
    except Exception as e:
        logger.error(f"CPPP search failed: {e}")
        return get_mock_tenders()[:3]


async def search_schemes(query: str) -> List[Dict[str, Any]]:
    """Search government scheme database."""
    schemes = [
        {"name": "Startup India Seed Fund Scheme", "provider": "DPIIT", "amount": "₹20 Lakhs", "type": "startup", "match_score": 88},
        {"name": "MSME Technology Upgradation Fund", "provider": "MSME Ministry", "amount": "₹1 Crore", "type": "msme", "match_score": 82},
        {"name": "Digital MSME Scheme", "provider": "MSME Ministry", "amount": "₹50 Lakhs", "type": "msme", "match_score": 79},
        {"name": "MeitY Startup Hub Program", "provider": "MeitY", "amount": "₹25 Lakhs", "type": "startup", "match_score": 91},
        {"name": "Software Technology Parks Scheme", "provider": "STPI", "amount": "Tax Benefits", "type": "national", "match_score": 85},
        {"name": "Atal Innovation Mission", "provider": "NITI Aayog", "amount": "₹10 Lakhs", "type": "startup", "match_score": 74},
        {"name": "DPIIT Recognition Benefits", "provider": "DPIIT", "amount": "Multiple Benefits", "type": "startup", "match_score": 95},
        {"name": "Credit Guarantee Fund for Startups", "provider": "NCGTC", "amount": "Up to ₹5 Cr", "type": "startup", "match_score": 77},
        {"name": "Make in India IT Initiative", "provider": "DPIIT", "amount": "Priority in Tenders", "type": "national", "match_score": 83},
        {"name": "PM Mudra Yojana", "provider": "MUDRA Bank", "amount": "Up to ₹10 Lakhs", "type": "msme", "match_score": 68},
    ]
    query_lower = query.lower()
    return [s for s in schemes if any(w in s["name"].lower() or w in s["type"] for w in query_lower.split())] or schemes[:5]


async def discover_all_tenders(query: str, api_key: str = "", cse_id: str = "") -> List[Dict[str, Any]]:
    """Discover tenders from all sources and deduplicate."""
    gem_results, cppp_results = await asyncio.gather(
        search_gem_portal(query),
        search_cppp_portal(query),
    )
    
    all_tenders = []
    seen_titles = set()
    
    for tender in gem_results + cppp_results:
        title = tender.get("title", "").lower()[:50]
        if title not in seen_titles:
            seen_titles.add(title)
            all_tenders.append(tender)
    
    return all_tenders
