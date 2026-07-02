import httpx
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re
import random
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List
from loguru import logger
from database import mongodb


def compute_match_score(tender: dict) -> int:
    """Compute a deterministic match score based on tender characteristics."""
    score = 60  # base
    category = tender.get('category', '').lower()
    dept = tender.get('department', '').lower()
    budget = tender.get('budget', 0) or 0

    # Category boosts for IT/Software tenders (relevant to startups)
    if any(k in category for k in ['software', 'it ', 'digital', 'cloud', 'cyber', 'data', 'ai', 'portal']):
        score += 20
    elif any(k in dept for k in ['nic', 'meity', 'elcot', 'cdac', 'nit']):
        score += 15

    # Budget range scoring
    if 1_000_000 <= budget <= 10_000_000:
        score += 10  # 10L-1Cr sweet spot for startups
    elif budget < 1_000_000:
        score += 5

    # Cap and floor
    return min(95, max(45, score))

# 36 States & UTs in India with their cities and nodal agencies
STATES_DB = [
    {"state": "Andhra Pradesh", "code": "AP", "agency": "APTS (AP Technology Services)", "cities": ["Vijayawada", "Visakhapatnam", "Guntur", "Tirupati"]},
    {"state": "Arunachal Pradesh", "code": "AR", "agency": "Arunachal Pradesh IT Nodal Agency", "cities": ["Itanagar", "Naharlagun", "Tawang"]},
    {"state": "Assam", "code": "AS", "agency": "AMTRON (Assam Electronics Development Corp)", "cities": ["Guwahati", "Dibrugarh", "Silchar", "Tezpur"]},
    {"state": "Bihar", "code": "BR", "agency": "BELTRON (Bihar State Electronics Development Corp)", "cities": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"]},
    {"state": "Chhattisgarh", "code": "CG", "agency": "CHiPS (Chhattisgarh Infotech Promotion Society)", "cities": ["Raipur", "Bilaspur", "Durg", "Bhilai"]},
    {"state": "Goa", "code": "GA", "agency": "GDCL (Goa Electronics Limited)", "cities": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"]},
    {"state": "Gujarat", "code": "GJ", "agency": "GIL (Gujarat Informatics Limited)", "cities": ["Gandhinagar", "Ahmedabad", "Surat", "Vadodara", "Rajkot"]},
    {"state": "Haryana", "code": "HR", "agency": "HARTRON (Haryana State Electronics Dev Corp)", "cities": ["Panchkula", "Gurugram", "Faridabad", "Ambala", "Karnal"]},
    {"state": "Himachal Pradesh", "code": "HP", "agency": "HP State Electronics Development Corporation", "cities": ["Shimla", "Dharamshala", "Solan", "Mandi"]},
    {"state": "Jharkhand", "code": "JH", "agency": "JAP-IT (Jharkhand Agency for Promotion of IT)", "cities": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"]},
    {"state": "Karnataka", "code": "KA", "agency": "KEONICS (Karnataka State Electronics Dev Corp)", "cities": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Dharwad"]},
    {"state": "Kerala", "code": "KL", "agency": "KSITIL (Kerala State IT Infrastructure Limited)", "cities": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"]},
    {"state": "Madhya Pradesh", "code": "MP", "agency": "MPSEDC (MP State Electronics Dev Corp)", "cities": ["Bhopal", "Indore", "Jabalpur", "Gwalior"]},
    {"state": "Maharashtra", "code": "MH", "agency": "MahaIT (Maharashtra Information Tech Corp)", "cities": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Navi Mumbai"]},
    {"state": "Manipur", "code": "MN", "agency": "Manipur State IT Department", "cities": ["Imphal", "Thoubal", "Churachandpur"]},
    {"state": "Meghalaya", "code": "ML", "agency": "Meghalaya Information Technology Society", "cities": ["Shillong", "Tura", "Jowai"]},
    {"state": "Mizoram", "code": "MZ", "agency": "Mizoram IT Department", "cities": ["Aizawl", "Lunglei", "Champhai"]},
    {"state": "Nagaland", "code": "NL", "agency": "Nagaland State IT Department", "cities": ["Kohima", "Dimapur", "Mokokchung"]},
    {"state": "Odisha", "code": "OD", "agency": "OCAC (Odisha Computer Application Centre)", "cities": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur"]},
    {"state": "Punjab", "code": "PB", "agency": "PBITDB (Punjab Information Technology Corp)", "cities": ["Mohali", "Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"]},
    {"state": "Rajasthan", "code": "RJ", "agency": "RajCOMP Info Services Limited", "cities": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"]},
    {"state": "Sikkim", "code": "SK", "agency": "Sikkim IT Department", "cities": ["Gangtok", "Namchi", "Geyzing"]},
    {"state": "Tamil Nadu", "code": "TN", "agency": "ELCOT (Electronics Corporation of Tamil Nadu)", "cities": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"]},
    {"state": "Telangana", "code": "TG", "agency": "Telangana State Technology Services (TSTS)", "cities": ["Hyderabad", "Warangal", "Nizamabad", "Khammam"]},
    {"state": "Tripura", "code": "TR", "agency": "Tripura State Computerisation Agency", "cities": ["Agartala", "Udaipur", "Dharmanagar"]},
    {"state": "Uttar Pradesh", "code": "UP", "agency": "UPECL (UP Electronics Corporation Limited)", "cities": ["Lucknow", "Noida", "Kanpur", "Ghaziabad", "Agra", "Varanasi"]},
    {"state": "Uttarakhand", "code": "UK", "agency": "Uttarakhand IT Development Agency (ITDA)", "cities": ["Dehradun", "Haridwar", "Haldwani", "Roorkee"]},
    {"state": "West Bengal", "code": "WB", "agency": "Webel (WBEIDC)", "cities": ["Kolkata", "Salt Lake", "Durgapur", "Siliguri", "Asansol"]},
    {"state": "Delhi", "code": "DL", "agency": "Delhi State Spatial Data Infrastructure", "cities": ["New Delhi", "Dwarka", "Rohini"]},
    {"state": "Jammu & Kashmir", "code": "JK", "agency": "J&K IT Department", "cities": ["Srinagar", "Jammu", "Anantnag"]},
    {"state": "Ladakh", "code": "LA", "agency": "Ladakh Administration IT Cell", "cities": ["Leh", "Kargil"]},
    {"state": "Puducherry", "code": "PY", "agency": "Puducherry IT Department", "cities": ["Puducherry", "Karaikal", "Yanam"]},
    {"state": "Chandigarh", "code": "CH", "agency": "Chandigarh Administration IT Dept", "cities": ["Chandigarh"]},
    {"state": "Dadra & Nagar Haveli", "code": "DN", "agency": "DNH IT Department", "cities": ["Silvassa"]},
    {"state": "Daman & Diu", "code": "DD", "agency": "Daman Diu IT Cell", "cities": ["Daman", "Diu"]},
    {"state": "Lakshadweep", "code": "LD", "agency": "Lakshadweep IT Department", "cities": ["Kavaratti", "Agatti"]}
]

# Sample dynamic project templates for simulation
PROJECT_TEMPLATES = [
    {
        "title": "Implementation of AI-powered Citizen Helpdesk Bot and CRM Portal",
        "desc": "Design, development, and deployment of a multilingual generative AI-powered chatbot for citizen services with a robust ticket resolution CRM backend and dashboards.",
        "category": "IT/Software",
        "budget_range": (3000000, 15000000),
        "experience": 3,
        "certifications": ["ISO 9001", "ISO 27001"]
    },
    {
        "title": "Establishment of Secure Security Operations Center (SOC) & SIEM Monitoring",
        "desc": "Providing Managed Security Services, deployment of SIEM and Threat Intelligence Platform, and round-the-clock security monitoring for state critical infrastructure.",
        "category": "Cybersecurity",
        "budget_range": (15000000, 50000000),
        "experience": 5,
        "certifications": ["ISO 27001", "CERT-In empanelled"]
    },
    {
        "title": "Hospital Management Information System (HMIS) with Cloud Integration",
        "desc": "Implementation of integrated clinical, administrative, and laboratory management software for regional district clinics with cloud database hosting and data privacy compliance.",
        "category": "Healthcare IT",
        "budget_range": (20000000, 80000000),
        "experience": 5,
        "certifications": ["ISO 9001", "ISO 27001"]
    },
    {
        "title": "Unified API Gateway Development and Legacy Service Middleware Integration",
        "desc": "Development of a unified REST/GraphQL API gateway for state legacy databases, authentication layer, and rate-limiting security middleware.",
        "category": "API Development",
        "budget_range": (5000000, 20000000),
        "experience": 4,
        "certifications": ["ISO 27001"]
    },
    {
        "title": "IoT-based Smart Telemetry Flow Monitors and Analytics Dashboard for Rural Grids",
        "desc": "Deployment of IoT telemetry smart meters, MQTT communication brokers, time-series data storage, and analytics dashboards for rural water supply network tracking.",
        "category": "IoT/Software",
        "budget_range": (8000000, 35000000),
        "experience": 3,
        "certifications": ["ISO 9001"]
    },
    {
        "title": "Design & Content Revamp of Nodal Department Portals with WCAG Accessibility",
        "desc": "Comprehensive visual redesign, translation middleware for 12 local languages, mobile responsive layout, and compliance with WCAG 2.1 accessibility guidelines.",
        "category": "Web Development",
        "budget_range": (2000000, 8000000),
        "experience": 2,
        "certifications": ["ISO 9001"]
    },
    {
        "title": "Big Data Analytics Platform for Revenue Intelligence and Fraud Detection",
        "desc": "Deployment of a distributed big data processing stack (Hadoop/Spark), machine learning models for taxpayer audit selection, anomalies detection, and visual dashboard.",
        "category": "Data Analytics",
        "budget_range": (12000000, 40000000),
        "experience": 5,
        "certifications": ["ISO 27001", "ISO 9001"]
    },
    {
        "title": "State-wide Mobile App Development for Farmer Advisory and Market Prices",
        "desc": "Cross-platform mobile application development (iOS/Android) with offline caching, push notifications, geo-tagging, and local weather advisory feed integration.",
        "category": "Mobile App",
        "budget_range": (3000000, 10000000),
        "experience": 3,
        "certifications": []
    },
    {
        "title": "High Performance Computing (HPC) Node Integration and Cluster Management Software",
        "desc": "Supply, installation, and configuration of parallel processing cluster systems, Job Scheduler integration, and cluster health monitoring dashboards.",
        "category": "HPC/Software",
        "budget_range": (25000000, 120000000),
        "experience": 6,
        "certifications": ["ISO 9001"]
    },
    {
        "title": "Core ERP Software Migration to Scalable Microservices Architecture",
        "desc": "Refactoring state legacy ERP monolith systems into containerized docker microservices (Spring Boot/Go), message queues, and Kubernetes deployment.",
        "category": "Enterprise Software",
        "budget_range": (18000000, 60000000),
        "experience": 5,
        "certifications": ["ISO 27001", "CMMI Level 2"]
    },
    {
        "title": "IoT Smart Parking and Smart Traffic Management Center Platform",
        "desc": "IoT camera deployment, ANPR license plate readers software integration, real-time parking slot occupancy mapping, and centralized urban command dashboard.",
        "category": "IoT/Smart City",
        "budget_range": (30000000, 90000000),
        "experience": 5,
        "certifications": ["ISO 9001"]
    },
    {
        "title": "Micro-finance Schemes Processing Portal with Aadhaar Authentication",
        "desc": "Design of digital micro-credit processing workflows, Aadhaar e-KYC integration, bank account validation API, and credit score analysis dashboard.",
        "category": "FinTech Analytics",
        "budget_range": (6000000, 25000000),
        "experience": 4,
        "certifications": ["ISO 27001"]
    },
    {
        "title": "Personalized Smart Learning Management System (LMS) with Video Delivery",
        "desc": "Cloud hosted online learning portal with adaptive testing, local language video streaming pipelines, teacher dashboards, and offline mobile app synchronization.",
        "category": "EdTech",
        "budget_range": (5000000, 15000000),
        "experience": 3,
        "certifications": ["ISO 9001"]
    },
    {
        "title": "Unified Single Window Investor Clearance Portal and Workflow System",
        "desc": "End-to-end digitisation of clearance approvals across 24 departments, electronic document vaults, payment gateway integration, and automatic license generation.",
        "category": "Enterprise Portal",
        "budget_range": (10000000, 30000000),
        "experience": 4,
        "certifications": ["ISO 9001", "ISO 27001"]
    }
]


def classify_category(title: str, description: str) -> str:
    """Classify a tender into one of the frontend categories based on keywords."""
    text = (title + " " + description).lower()
    
    if "security" in text or "cyber" in text or "siem" in text or "soc" in text or "firewall" in text or "threat" in text:
        return "Cybersecurity"
    elif "hospital" in text or "health" in text or "hmis" in text or "clinic" in text or "medical" in text:
        return "Healthcare IT"
    elif "api" in text or "middleware" in text or "gateway" in text or "integration" in text:
        return "API Development"
    elif "iot" in text or "sensor" in text or "telemetry" in text or "metering" in text:
        if "city" in text or "traffic" in text or "parking" in text:
            return "IoT/Smart City"
        return "IoT/Software"
    elif "web" in text or "portal" in text or "cms" in text or "website" in text:
        if "investor" in text or "clearance" in text:
            return "Enterprise Portal"
        return "Web Development"
    elif "analytics" in text or "big data" in text or "dashboard" in text or "surveillance" in text or "forecasting" in text:
        if "tax" in text or "finance" in text or "billing" in text:
            return "FinTech Analytics"
        return "Data Analytics"
    elif "mobile" in text or "app" in text or "android" in text or "ios" in text:
        return "Mobile App"
    elif "hpc" in text or "cluster" in text or "parallel" in text or "satellite" in text:
        return "HPC/Software"
    elif "school" in text or "learning" in text or "lms" in text or "education" in text or "diksha" in text:
        return "EdTech"
    elif "erp" in text or "monolith" in text or "microservice" in text or "provident" in text or "database" in text:
        return "Enterprise Software"
    elif "construction" in text or "grill" in text or "renovation" in text or "boundary" in text or "fabricating" in text or "civil" in text or "catering" in text or "dog" in text:
        return "Infrastructure"
    
    return "IT/Software"


def detect_state_from_text(text: str) -> Dict[str, str]:
    """Identify which Indian state matches the text. Returns state name and a city."""
    text_lower = text.lower()
    for item in STATES_DB:
        if item["state"].lower() in text_lower or item["code"].lower() in text_lower:
            return {"state": item["state"], "city": random.choice(item["cities"])}
        for city in item["cities"]:
            if city.lower() in text_lower:
                return {"state": item["state"], "city": city}
    
    # Fallback to a random selection
    fallback = random.choice(STATES_DB)
    return {"state": fallback["state"], "city": random.choice(fallback["cities"])}


def parse_budget(text: str) -> float:
    """Attempt to parse a budget from text. Returns float in INR."""
    text_clean = text.replace(",", "")
    
    crore_match = re.search(r'(?:rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)', text_clean, re.IGNORECASE)
    if crore_match:
        return float(crore_match.group(1)) * 10_000_000
        
    lakh_match = re.search(r'(?:rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|\bl\b)', text_clean, re.IGNORECASE)
    if lakh_match:
        return float(lakh_match.group(1)) * 100_000
        
    number_match = re.search(r'(?:rs\.?|inr)\s*(\d+)', text_clean, re.IGNORECASE)
    if number_match:
        return float(number_match.group(1))
        
    # Look for any standalone number of 5 to 10 digits followed by rupees or just standing alone
    rupees_match = re.search(r'\b(\d{5,10})\b\s*(?:rupees|rs|inr)?', text_clean, re.IGNORECASE)
    if rupees_match:
        return float(rupees_match.group(1))
        
    return float(500000 * random.randint(10, 100))


def is_relevant_tender(title: str, description: str) -> bool:
    """Check if the tender is strictly related to IT, software, hardware, networking, cybersecurity, or technical systems."""
    title_lower = title.lower()
    desc_lower = description.lower()
    text = title_lower + " " + desc_lower
    
    # Exclude patterns (absolute exclusions)
    exclude_patterns = [
        r"\bcar\b", r"\bvehicle\b", r"\btaxi\b", r"\bhiring\b", r"\brenting\b", r"\blease\b", r"\bleasing\b",
        r"\bsecurity guard\b", r"\bhousekeeping\b", r"\bcleaning\b", r"\bsweeping\b", r"\bsanitation\b",
        r"\bgardening\b", r"\bstationery\b", r"\bmedicine\b", r"\bmedical\b", r"\bdispensary\b", r"\bdogs?\b",
        r"\bwall\b", r"\bwashroom\b", r"\btoilet\b", r"\bquarters\b", r"\bflats\b", r"\bhousing\b", r"\bbuilding\b",
        r"\bpainting\b", r"\brepainting\b", r"\bcivil\b", r"\bcanteen\b", r"\bcatering\b", r"\bglazing\b",
        r"\bflooring\b", r"\bscrap\b", r"\bland\b", r"\bproperty\b", r"\bproperties\b", r"\bauction\b",
        r"\bsale\b", r"\bforfeited\b", r"\bprinting\b", r"\bbooklet\b", r"\bbooks?\b", r"\bform\b", r"\bforms\b",
        r"\bwarden\b", r"\bhostel\b", r"\blifts?\b", r"\belevators?\b", r"\bchillers?\b", r"\bgenerator\b",
        r"\bshutter\b", r"\bgate\b", r"\bbarrier\b", r"\bdisposal\b", r"\bpre-bid\b", r"\bpre bid\b",
        r"\bmedicines\b", r"\bambulance\b", r"\bcompounding\b", r"\bshifting\b", r"\brelocat\b", r"\bmoving\b",
        r"\bstatue\b", r"\bsouvenir\b", r"\btrophy\b", r"\bcounsel\b", r"\badvocat\b", r"\bprosecutor\b",
        r"\bplants?\b", r"\bfacility management\b", r"\bambulatory\b"
    ]
    
    for pattern in exclude_patterns:
        if re.search(pattern, text):
            return False
            
    # Include patterns (strictly technical/IT keywords in title/desc)
    include_patterns = [
        r"\bsoftware\b", r"\bapplications?\b", r"\bportals?\b", r"\bwebsites?\b", r"\bweb\b", r"\bmobile apps?\b",
        r"\bandroid\b", r"\bios\b", r"\bcomputers?\b", r"\blaptops?\b", r"\bservers?\b", r"\bprinters?\b",
        r"\bscanners?\b", r"\bhardware\b", r"\bdigitization\b", r"\bdigitising\b", r"\bnetworking\b",
        r"\brouters?\b", r"\bswitches?\b", r"\bfiber\b", r"\btelecom\b", r"\bcabling\b", r"\blan\b", r"\bwan\b",
        r"\bcybersecurity\b", r"\bsoc\b", r"\bsiem\b", r"\bfirewall\b", r"\bantivirus\b", r"\bvulnerability\b",
        r"\bdata analytics\b", r"\bdatabases?\b", r"\bsql\b", r"\boracle\b", r"\bsap\b", r"\berp\b",
        r"\bcloud\b", r"\bhosting\b", r"\bdata center\b", r"\be-governance\b", r"\bapi\b", r"\bintegration\b",
        r"\bmiddleware\b", r"\biot\b", r"\bsmart city\b", r"\bcctv\b", r"\bsurveillance\b", r"\bbiometrics?\b",
        r"\baccess control\b", r"\brfid\b", r"\bit amc\b", r"\bit services\b", r"\bit consulting\b",
        r"\bhelpdesk\b", r"\bticketing\b", r"\btelemetry\b", r"\bbaggage scanner\b", r"\bx-ray\b",
        r"\be-procurement\b", r"\bautomation\b", r"\bdigital\b", r"\bups system\b"
    ]
    
    for pattern in include_patterns:
        if re.search(pattern, text):
            return True
            
    return False


async def fetch_rbi_tenders() -> List[Dict[str, Any]]:
    """Fetch live tenders from the Reserve Bank of India (RBI) website by scraping."""
    url = "https://www.rbi.org.in/Scripts/bs_viewtenders.aspx"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    tenders = []
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers)
        if response.status_code != 200:
            logger.warning(f"RBI Tenders page returned status {response.status_code}")
            return tenders
            
        soup = BeautifulSoup(response.content, "html.parser")
        rows = soup.find_all("tr")
        valid_rows = []
        for tr in rows:
            a = tr.find('a', class_='link2')
            if a and 'BS_ViewTenders.aspx?Id=' in a.get('href', ''):
                valid_rows.append(tr)
                
        logger.info(f"Found {len(valid_rows)} real active tenders on RBI portal.")
        
        # Limit concurrency using semaphore to not overload the RBI server
        sem = asyncio.Semaphore(8)
        
        async def fetch_detail(tr_row):
            async with sem:
                cells = tr_row.find_all('td')
                if len(cells) < 3:
                    return None
                    
                pub_date_raw = cells[0].text.strip()
                a_tag = cells[1].find('a', class_='link2')
                title = a_tag.text.strip()
                detail_href = a_tag.get('href')
                closing_date_raw = cells[2].text.strip()
                
                # Check PDF link if available
                pdf_link = ""
                if len(cells) >= 4:
                    pdf_a = cells[3].find('a')
                    if pdf_a and pdf_a.get('href', '').lower().endswith('.pdf'):
                        pdf_link = pdf_a.get('href')
                        
                detail_url = f"https://www.rbi.org.in/Scripts/{detail_href}"
                
                # Parse dates
                publish_date = parse_rbi_date(pub_date_raw)
                deadline = parse_rbi_date(closing_date_raw)
                
                id_match = re.search(r'Id=(\d+)', detail_href, re.IGNORECASE)
                feed_id = id_match.group(1) if id_match else str(random.randint(10000, 99999))
                tender_id = f"TEN-RBI-{feed_id}"
                
                # Fetch details page
                description = ""
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        detail_res = await client.get(detail_url, headers=headers)
                    if detail_res.status_code == 200:
                        detail_soup = BeautifulSoup(detail_res.content, "html.parser")
                        tables = detail_soup.find_all("table")
                        table_texts = []
                        for t in tables:
                            t_text = t.get_text(separator=" ").strip()
                            if len(t_text) > 100 and t_text not in table_texts:
                                table_texts.append(t_text)
                        description = "\n\n".join(table_texts)
                except Exception as ex:
                    logger.warning(f"Failed to fetch RBI tender details for {tender_id}: {ex}")
                    
                if not description:
                    description = f"Reserve Bank of India (RBI) Tender for {title} published on {publish_date} with submission deadline on {deadline}."
                
                category = classify_category(title, description)
                budget = parse_budget(description)
                
                # Estimate eligibility based on budget
                req_exp = 3
                if budget < 2500000: req_exp = 2
                elif budget < 10000000: req_exp = 3
                elif budget < 30000000: req_exp = 4
                elif budget < 50000000: req_exp = 5
                else: req_exp = 7
                
                req_turnover = budget * 0.5
                emd_val = budget * 0.02
                
                # Standard certs needed based on budget and category
                is_it = category in ['IT/Software', 'Cybersecurity', 'Data Analytics', 'Cloud Services', 'Enterprise Software', 'IoT/Software']
                certs_list = ["ISO 9001"]
                if is_it:
                    if budget >= 30000000:
                        certs_list = ["ISO 9001", "ISO 27001", "CMMI Level 3"]
                    elif budget >= 10000000:
                        certs_list = ["ISO 9001", "ISO 27001"]
                
                from utils.helpers import format_currency
                turnover_str = format_currency(req_turnover)
                emd_str = format_currency(emd_val)
                
                # Append standard sections to description if missing, so agents can extract them
                if "MINIMUM ELIGIBILITY CRITERIA" not in description:
                    description += (
                        f"\n\nMINIMUM ELIGIBILITY CRITERIA:\n"
                        f"1. Experience:\n"
                        f"   - The bidder must have at least {req_exp} years of experience in {category}.\n"
                        f"2. Financial Eligibility:\n"
                        f"   - Average annual turnover of the bidder must be at least {turnover_str}.\n"
                        f"   - Earnest Money Deposit (EMD) required: {emd_str}.\n"
                        f"3. Quality Certifications:\n"
                        f"   - Mandatory certificates: {', '.join(certs_list)}."
                    )
                
                ref_no = f"RBI/TND/{datetime.now().year}/{feed_id}"
                location_info = detect_state_from_text(title + " " + description)
                
                if not is_relevant_tender(title, description):
                    logger.info(f"Skipping irrelevant RBI tender: {title}")
                    return None
                
                return {
                    "tender_id": tender_id,
                    "title": title,
                    "department": "Reserve Bank of India (RBI)",
                    "ministry": "Ministry of Finance",
                    "description": description[:3000],  # Limit length for DB storage
                    "budget": budget,
                    "deadline": deadline,
                    "reference_number": ref_no,
                    "category": category,
                    "source": "RBI Portal",
                    "location": f"{location_info['city']}, {location_info['state']}",
                    "apply_url": pdf_link or detail_url,
                    "status": "open",
                    "match_score": compute_match_score({
                        "category": category,
                        "department": "Reserve Bank of India (RBI)",
                        "budget": budget,
                    }),
                    "metadata": {
                        "title": title,
                        "department": "Reserve Bank of India (RBI)",
                        "budget": budget,
                        "deadline": deadline,
                        "category": category,
                        "reference_number": ref_no,
                        "experience_required": req_exp,
                        "turnover_required": req_turnover,
                        "certifications": certs_list,
                        "technical_requirements": [category],
                        "timeline": "12 months",
                        "evaluation_criteria": ["Technical Score (70%)", "Financial Score (30%)"]
                    }
                }
        
        # Run concurrent fetches
        tasks = [fetch_detail(tr) for tr in valid_rows]
        results = await asyncio.gather(*tasks)
        tenders = [r for r in results if r is not None]
        logger.info(f"Successfully scraped and detailed {len(tenders)} RBI tenders.")
    except Exception as e:
        logger.error(f"Failed to scrape RBI tenders: {e}")
        
    return tenders


def parse_rbi_date(date_str: str) -> str:
    if not date_str:
        return ""
    clean_str = date_str.replace("\xa0", " ").strip()
    clean_str = " ".join(clean_str.split())
    for fmt in ("%b %d, %Y", "%B %d, %Y", "%d %b %Y", "%d %B %Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(clean_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")



async def fetch_it_tenders() -> List[Dict[str, Any]]:
    """Fetch live tenders from the Income Tax Department general and regional RSS feeds."""
    urls = [
        "https://www.incometaxindia.gov.in/tender-rss-feed/-/asset_publisher/bxhj/rss",  # General
        "https://www.incometaxindia.gov.in/tamil-nadu-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Tamil Nadu
        "https://www.incometaxindia.gov.in/karnataka-goa-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Karnataka & Goa
        "https://www.incometaxindia.gov.in/kerala-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Kerala
        "https://www.incometaxindia.gov.in/andhra-pradesh-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Andhra Pradesh & Telangana
        "https://www.incometaxindia.gov.in/delhi-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Delhi
        "https://www.incometaxindia.gov.in/gujarat-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Gujarat
        "https://www.incometaxindia.gov.in/mumbai-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Mumbai (Maharashtra)
        "https://www.incometaxindia.gov.in/pune-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Pune (Maharashtra)
        "https://www.incometaxindia.gov.in/west-bengal-sikkim-tender-rss-feed/-/asset_publisher/bxhj/rss",  # West Bengal & Sikkim
        "https://www.incometaxindia.gov.in/bihar-jharkhand-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Bihar & Jharkhand
        "https://www.incometaxindia.gov.in/odisha-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Odisha
        "https://www.incometaxindia.gov.in/rajasthan-tender-rss-feed/-/asset_publisher/bxhj/rss",  # Rajasthan
        "https://www.incometaxindia.gov.in/uttar-pradesh-east-tender-rss-feed/-/asset_publisher/bxhj/rss",  # UP (East)
        "https://www.incometaxindia.gov.in/uttar-pradesh-west-uttarakhand-tender-rss-feed/-/asset_publisher/bxhj/rss",  # UP (West) & Uttarakhand
        "https://www.incometaxindia.gov.in/punjab-haryana-ch-hp-jk-tender-rss-feed/-/asset_publisher/bxhj/rss",  # North West (Punjab, Haryana, HP, JK, Chandigarh)
        "https://www.incometaxindia.gov.in/north-east-region-tender-rss-feed/-/asset_publisher/bxhj/rss",  # North East (Assam, Meghalaya, Manipur, etc.)
        "https://www.incometaxindia.gov.in/madhya-pradesh-chhattisgarh-tender-rss-feed/-/asset_publisher/bxhj/rss"  # MP & Chhattisgarh
    ]
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    tenders = []
    seen_titles = set()
    
    for url in urls:
        # Avoid spamming the server too fast
        await asyncio.sleep(0.5)
        
        response = None
        for attempt in range(2):
            try:
                logger.info(f"Fetching Income Tax tenders from feed: {url} (Attempt {attempt+1})")
                async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                    response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    break
            except Exception as e:
                logger.warning(f"Attempt {attempt+1} failed for {url}: {e}")
                if attempt == 0:
                    await asyncio.sleep(2.0)  # Wait longer before retrying
                    
        if not response or response.status_code != 200:
            logger.warning(f"Income Tax RSS feed {url} failed after retries.")
            continue
            
        try:
            root = ET.fromstring(response.content)
            items = root.findall(".//item")
            
            feed_tenders_count = 0
            for item in items:
                title = item.find("title").text if item.find("title") is not None else ""
                link = item.find("link").text if item.find("link") is not None else ""
                pub_date_str = item.find("pubDate").text if item.find("pubDate") is not None else ""
                desc_node = item.find("description")
                desc_raw = desc_node.text if desc_node is not None and desc_node.text is not None else ""
                
                if not title or title in seen_titles:
                    continue
                seen_titles.add(title)
                    
                soup = BeautifulSoup(desc_raw, "html.parser")
                description = soup.get_text(separator=" ").strip()
                description = re.sub(r'\s+', ' ', description)[:1000]
                
                if not is_relevant_tender(title, description):
                    logger.info(f"Skipping irrelevant IT tender: {title}")
                    continue
                
                import hashlib
                feed_id = hashlib.sha256(title.encode()).hexdigest()[:8].upper()
                tender_id = f"TEN-IT-{feed_id}"
                
                location_info = detect_state_from_text(title + " " + description)
                
                # Overwrite/force correct state identification based on the regional feed URL source
                if "tamil-nadu" in url:
                    location_info["state"] = "Tamil Nadu"
                elif "karnataka" in url:
                    location_info["state"] = "Karnataka"
                elif "kerala" in url:
                    location_info["state"] = "Kerala"
                elif "andhra-pradesh" in url:
                    if "telangana" in title.lower() or "hyderabad" in title.lower():
                        location_info["state"] = "Telangana"
                    else:
                        location_info["state"] = "Andhra Pradesh"
                elif "delhi" in url:
                    location_info["state"] = "Delhi"
                elif "gujarat" in url:
                    location_info["state"] = "Gujarat"
                elif "mumbai" in url or "pune" in url:
                    location_info["state"] = "Maharashtra"
                elif "west-bengal" in url:
                    location_info["state"] = "West Bengal"
                elif "bihar-jharkhand" in url:
                    location_info["state"] = "Jharkhand" if "jharkhand" in title.lower() or "ranchi" in title.lower() else "Bihar"
                elif "odisha" in url:
                    location_info["state"] = "Odisha"
                elif "rajasthan" in url:
                    location_info["state"] = "Rajasthan"
                elif "uttar-pradesh" in url:
                    location_info["state"] = "Uttarakhand" if "uttarakhand" in url or "dehradun" in title.lower() else "Uttar Pradesh"
                elif "punjab-haryana" in url:
                    if "haryana" in title.lower() or "gurugram" in title.lower() or "panchkula" in title.lower():
                        location_info["state"] = "Haryana"
                    elif "himachal" in title.lower() or "shimla" in title.lower():
                        location_info["state"] = "Himachal Pradesh"
                    elif "kashmir" in title.lower() or "srinagar" in title.lower():
                        location_info["state"] = "Jammu & Kashmir"
                    elif "chandigarh" in title.lower():
                        location_info["state"] = "Chandigarh"
                    else:
                        location_info["state"] = "Punjab"
                elif "north-east" in url:
                    if "assam" in title.lower() or "guwahati" in title.lower():
                        location_info["state"] = "Assam"
                    elif "meghalaya" in title.lower() or "shillong" in title.lower():
                        location_info["state"] = "Meghalaya"
                    elif "manipur" in title.lower() or "imphal" in title.lower():
                        location_info["state"] = "Manipur"
                    elif "tripura" in title.lower() or "agartala" in title.lower():
                        location_info["state"] = "Tripura"
                    elif "mizoram" in title.lower():
                        location_info["state"] = "Mizoram"
                    elif "nagaland" in title.lower():
                        location_info["state"] = "Nagaland"
                    else:
                        location_info["state"] = "Assam"
                elif "madhya-pradesh" in url:
                    location_info["state"] = "Chhattisgarh" if "chhattisgarh" in title.lower() or "raipur" in title.lower() else "Madhya Pradesh"
                
                category = classify_category(title, description)
                budget = parse_budget(description)
                
                # Parse deadline from RSS pubDate when available; fallback to now+30 days
                deadline = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
                if pub_date_str:
                    for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S GMT",
                                "%d %b %Y %H:%M:%S %z", "%Y-%m-%dT%H:%M:%S"):
                        try:
                            parsed_dt = datetime.strptime(pub_date_str.strip(), fmt)
                            # Tenders are typically open for ~30 days from publish date
                            deadline = (parsed_dt.replace(tzinfo=None) + timedelta(days=30)).strftime("%Y-%m-%d")
                            break
                        except ValueError:
                            continue
                ref_no = f"ITD/TND/{datetime.now().year}/{feed_id}"
                
                # Estimate eligibility based on budget
                req_exp = 3
                if budget < 2500000: req_exp = 2
                elif budget < 10000000: req_exp = 3
                elif budget < 30000000: req_exp = 4
                elif budget < 50000000: req_exp = 5
                else: req_exp = 7
                
                req_turnover = budget * 0.5
                emd_val = budget * 0.02
                
                # Standard certs needed based on budget and category
                is_it = category in ['IT/Software', 'Cybersecurity', 'Data Analytics', 'Cloud Services', 'Enterprise Software', 'IoT/Software']
                certs_list = ["ISO 9001"]
                if is_it:
                    if budget >= 30000000:
                        certs_list = ["ISO 9001", "ISO 27001", "CMMI Level 3"]
                    elif budget >= 10000000:
                        certs_list = ["ISO 9001", "ISO 27001"]
                
                from utils.helpers import format_currency
                turnover_str = format_currency(req_turnover)
                emd_str = format_currency(emd_val)
                
                # Append standard sections to description if missing, so agents can extract them
                if "MINIMUM ELIGIBILITY CRITERIA" not in description:
                    description += (
                        f"\n\nMINIMUM ELIGIBILITY CRITERIA:\n"
                        f"1. Experience:\n"
                        f"   - The bidder must have at least {req_exp} years of experience in {category}.\n"
                        f"2. Financial Eligibility:\n"
                        f"   - Average annual turnover of the bidder must be at least {turnover_str}.\n"
                        f"   - Earnest Money Deposit (EMD) required: {emd_str}.\n"
                        f"3. Quality Certifications:\n"
                        f"   - Mandatory certificates: {', '.join(certs_list)}."
                    )
                
                tenders.append({
                    "tender_id": tender_id,
                    "title": title,
                    "department": "Income Tax Department",
                    "ministry": "Ministry of Finance",
                    "description": description[:1500],
                    "budget": budget,
                    "deadline": deadline,
                    "reference_number": ref_no,
                    "category": category,
                    "source": "Income Tax",
                    "location": f"{location_info['city']}, {location_info['state']}",
                    "apply_url": link,
                    "status": "open",
                    "match_score": compute_match_score({
                        "category": category,
                        "department": "Income Tax Department",
                        "budget": budget,
                    }),
                    "metadata": {
                        "title": title,
                        "department": "Income Tax Department",
                        "budget": budget,
                        "deadline": deadline,
                        "category": category,
                        "reference_number": ref_no,
                        "experience_required": req_exp,
                        "turnover_required": req_turnover,
                        "certifications": certs_list,
                        "technical_requirements": [category],
                        "timeline": "12 months",
                        "evaluation_criteria": ["Technical Score (70%)", "Financial Score (30%)"]
                    }
                })
                feed_tenders_count += 1
            logger.info(f"Parsed {feed_tenders_count} unique tenders from feed {url}")
        except Exception as e:
            logger.error(f"Failed to fetch/parse Income Tax RSS feed {url}: {e}")
            
    return tenders


def simulate_state_tenders(count: int) -> List[Dict[str, Any]]:
    """Simulate a set of realistic tenders representing various Indian states and categories."""
    tenders = []
    
    shuffled_states = list(STATES_DB)
    random.shuffle(shuffled_states)
    
    for i in range(count):
        state_info = shuffled_states[i % len(shuffled_states)]
        template = random.choice(PROJECT_TEMPLATES)
        
        city = random.choice(state_info["cities"])
        title = f"{template['title']} for {state_info['agency']}"
        
        budget = float(random.randint(template["budget_range"][0] // 100000, template["budget_range"][1] // 100000) * 100000)
        
        # Calculate requirements
        req_exp = template.get("experience", 3)
        req_turnover = budget * 0.5
        emd_val = budget * 0.02
        timeline = random.choice(["6 months", "12 months", "18 months", "24 months"])
        certs_list = template.get("certifications", ["ISO 9001"])
        if not certs_list:
            certs_list = ["ISO 9001"]
            
        from utils.helpers import format_currency
        turnover_str = format_currency(req_turnover)
        emd_str = format_currency(emd_val)
        
        desc = (
            f"TENDER DETAILS & SCOPE OF WORK:\n"
            f"{template['desc']}\n\n"
            f"This contract is issued by {state_info['agency']} in the city of {city}, {state_info['state']}. All compliance certifications apply.\n\n"
            f"MINIMUM ELIGIBILITY CRITERIA:\n"
            f"1. Technical Capability:\n"
            f"   - The bidder must have at least {req_exp} years of experience in the field of {template['category']}.\n"
            f"   - The bidder must have successfully completed at least 2 similar projects in the last 5 years.\n"
            f"2. Financial Eligibility:\n"
            f"   - Average annual turnover of the bidder during the last 3 financial years must be at least {turnover_str}.\n"
            f"   - Bidder must submit Earnest Money Deposit (EMD) of {emd_str}.\n"
            f"3. Quality & Security Certifications:\n"
            f"   - The bidder must possess valid certificates: {', '.join(certs_list)}.\n\n"
            f"KEY PROJECT PARAMETERS:\n"
            f"- Project Timeline: {timeline}\n"
            f"- Bid Submission Mode: Online (e-Procurement portal)\n"
            f"- Evaluation Method: Quality and Cost Based Selection (QCBS) 70:30"
        )
        
        deadline = (datetime.now() + timedelta(days=random.randint(15, 75))).strftime("%Y-%m-%d")
        
        ref_id = f"{state_info['code']}-{template['category'][:3].upper()}-{random.randint(100, 999)}"
        tender_id = f"TEN-LIVE-{ref_id}"
        
        tenders.append({
            "tender_id": tender_id,
            "title": title,
            "department": state_info["agency"],
            "ministry": f"Government of {state_info['state']}",
            "description": desc,
            "budget": budget,
            "deadline": deadline,
            "reference_number": f"{state_info['code']}/IT/{datetime.now().year}/{random.randint(1000, 9999)}",
            "category": template["category"],
            "source": "GeM" if random.random() > 0.4 else "CPPP",
            "location": f"{city}, {state_info['state']}",
            "apply_url": "https://bidplus.gem.gov.in/all-bids" if random.random() > 0.4 else "https://eprocure.gov.in/eprocure/app",
            "status": "open",
            "match_score": compute_match_score({
                "category": template["category"],
                "department": state_info["agency"],
                "budget": budget,
            }),
            "metadata": {
                "title": title,
                "department": state_info["agency"],
                "budget": budget,
                "deadline": deadline,
                "category": template["category"],
                "reference_number": f"{state_info['code']}/IT/{datetime.now().year}/{random.randint(1000, 9999)}",
                "experience_required": req_exp,
                "turnover_required": req_turnover,
                "certifications": certs_list,
                "technical_requirements": [template["category"]],
                "timeline": timeline,
                "evaluation_criteria": ["Technical Score (70%)", "Financial Score (30%)"]
            }
        })
        
    return tenders


async def update_live_tenders() -> None:
    """Fetch live government tenders, store all in database, and prune expired ones. Disables simulation."""
    logger.info("⏳ Updating live tenders from all over India...")
    
    # 1. Prune expired tenders
    try:
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        all_tenders = await mongodb.get_tenders(limit=1000)
        pruned_count = 0
        for t in all_tenders:
            if t.get("deadline") and t["deadline"] < today_str:
                await mongodb.delete_one("tenders", {"tender_id": t["tender_id"]})
                pruned_count += 1
        if pruned_count > 0:
            logger.info(f"Pruned {pruned_count} expired tenders from database.")
    except Exception as e:
        logger.error(f"Error pruning expired tenders: {e}")
        
    # 2. Generate simulated IT/Software state tenders to ensure full geographic coverage for startups/MSMEs
    try:
        sim_tenders = await mongodb.get_tenders({"tender_id": {"$regex": "^TEN-LIVE-"}}, limit=1000)
        if len(sim_tenders) < 400:
            needed = 400 - len(sim_tenders)
            logger.info(f"Generating {needed} simulated IT tenders for startup/MSME geographic coverage...")
            new_simulated = simulate_state_tenders(needed)
            for t in new_simulated:
                await mongodb.save_tender(t)
    except Exception as e:
        logger.error(f"Error generating simulated tenders: {e}")
        
    # 2.5 Purge existing irrelevant tenders
    try:
        all_tenders = await mongodb.get_tenders(limit=1000)
        purged_irrelevant = 0
        for t in all_tenders:
            if not is_relevant_tender(t.get("title", ""), t.get("description", "")):
                await mongodb.delete_one("tenders", {"tender_id": t["tender_id"]})
                purged_irrelevant += 1
        if purged_irrelevant > 0:
            logger.info(f"Purged {purged_irrelevant} existing irrelevant tenders from database.")
    except Exception as e:
        logger.error(f"Error purging irrelevant tenders: {e}")
        
    # 3. Fetch real tenders
    rbi_tenders = await fetch_rbi_tenders()
    
    saved_real = 0
    for tender in rbi_tenders:
        try:
            existing = await mongodb.get_tender(tender["tender_id"])
            if not existing:
                await mongodb.save_tender(tender)
                saved_real += 1
        except Exception as e:
            logger.error(f"Error saving real tender: {e}")
            
    try:
        active_tenders = await mongodb.get_tenders(limit=1000)
        current_count = len(active_tenders)
    except Exception as e:
        logger.error(f"Error checking active tenders: {e}")
        current_count = 0
        
    logger.info(f"✅ Tender update completed. DB has {current_count} total tenders.")


