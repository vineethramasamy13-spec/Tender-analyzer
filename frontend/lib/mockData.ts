// ===================== TYPES =====================
export interface Tender {
  id: string;
  title: string;
  department: string;
  ministry: string;
  budget: number;
  budgetDisplay: string;
  category: string;
  deadline: string;
  daysLeft: number;
  matchScore: number;
  description: string;
  location: string;
  tenderNo: string;
  status: 'open' | 'closing_soon' | 'closed';
  source: string;
  applyUrl?: string;
  metadata?: {
    title: string;
    department: string;
    budget: number;
    deadline: string;
    category: string;
    reference_number: string;
    experience_required: number;
    turnover_required: number;
    certifications: string[];
    technical_requirements: string[];
    timeline: string;
    evaluation_criteria?: string[];
  };
}


export interface Scheme {
  id: string;
  name: string;
  provider: string;
  providerType: 'central' | 'state' | 'ministry';
  benefit: string;
  benefitAmount: number;
  eligibility: string;
  matchScore: number;
  deadline: string;
  category: string;
  description: string;
  applyUrl: string;
}

export interface AgentStep {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: string;
  icon: string;
}

export interface GapItem {
  id: number;
  requirement: string;
  required: string;
  currentStatus: string;
  gapType: 'critical' | 'important' | 'optional';
  recommendation: string;
  met: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ===================== MOCK TENDERS =====================
export const MOCK_TENDERS: Tender[] = [
  {
    id: 'T001',
    title: "Releasing RBI's Public Awareness Campaigns in Kaun Banega Crorepati (KBC) 2026",
    department: 'Department of Communication (DoC), RBI Central Office',
    ministry: 'Ministry of Finance',
    budget: 24500000,
    budgetDisplay: '₹2.45 Cr',
    category: 'IT/Software',
    deadline: '2026-07-25',
    daysLeft: 30,
    matchScore: 88,
    description: "Department of Communication (DoC) invites financial bids from empanelled advertising agencies for the Public Awareness Campaign (PAC) for releasing advertisements during 'KBC 2026' on 'Sony TV' (TV).\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 3 years of experience in IT/Software.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹1.22 Cr.\n   - Earnest Money Deposit (EMD) required: ₹4.90 Lakhs.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001, ISO 27001.",
    location: 'Mumbai, Maharashtra',
    tenderNo: 'RBI/CO/DOC/12/2026/ET/85',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: "Releasing RBI's Public Awareness Campaigns in Kaun Banega Crorepati (KBC) 2026",
      department: 'Department of Communication (DoC), RBI Central Office',
      budget: 24500000,
      deadline: '2026-07-25',
      category: 'IT/Software',
      reference_number: 'RBI/CO/DOC/12/2026/ET/85',
      experience_required: 3,
      turnover_required: 12250000,
      certifications: ['ISO 9001', 'ISO 27001'],
      technical_requirements: ['Advertising Campaign Management', 'Broadcasting Coordination'],
      timeline: '6 months',
      evaluation_criteria: ['QCBS (70:30)']
    }
  },
  {
    id: 'T002',
    title: 'Provision of mosquito mesh and allied civil works in Class III flats at RBI Staff Quarters, RPC Layout, Bengaluru',
    department: 'Estate Department, RBI Bengaluru Regional Office',
    ministry: 'Ministry of Finance',
    budget: 7840000,
    budgetDisplay: '₹78.4 L',
    category: 'Infrastructure',
    deadline: '2026-08-03',
    daysLeft: 39,
    matchScore: 78,
    description: "Reserve Bank of India, Bengaluru invites e-Tender through MSTC website from eligible empanelled vendors for the Provision of mosquito mesh and allied civil works in Class III flats at RBI Staff Quarters, RPC Layout, Bengaluru.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 3 years of experience in Infrastructure.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹39.2 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹1.56 Lakhs.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001.",
    location: 'Bengaluru, Karnataka',
    tenderNo: 'RBI/Bangalore Regional Office/Estate/7/26-27/ET/195',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Provision of mosquito mesh and allied civil works in Class III flats at RBI Staff Quarters, RPC Layout, Bengaluru',
      department: 'Estate Department, RBI Bengaluru Regional Office',
      budget: 7840000,
      deadline: '2026-08-03',
      category: 'Infrastructure',
      reference_number: 'RBI/Bangalore Regional Office/Estate/7/26-27/ET/195',
      experience_required: 3,
      turnover_required: 3920000,
      certifications: ['ISO 9001'],
      technical_requirements: ['Civil Construction', 'Fabrication & Mesh Installation'],
      timeline: '3 months',
      evaluation_criteria: ['Lowest Financial Bid (L1)']
    }
  },
  {
    id: 'T003',
    title: "Re-Construction Of Damaged Compound Wall And Allied Civil Works At Bank's Holiday Home, Ooty Chennai",
    department: 'Estate Department, RBI Chennai Regional Office',
    ministry: 'Ministry of Finance',
    budget: 1550000,
    budgetDisplay: '₹15.5 L',
    category: 'Infrastructure',
    deadline: '2026-07-27',
    daysLeft: 32,
    matchScore: 82,
    description: "Reserve Bank of India, Chennai invites e-Tender (two parts) from empanelled contractors for the limited tender for Re-construction of damaged compound wall and allied civil works at Bank's Holiday Home, Ooty Chennai.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 2 years of experience in Infrastructure.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹7.75 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹31,000.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001.",
    location: 'Chennai, Tamil Nadu',
    tenderNo: 'RBI/Chennai/Estate/11/26-27/ET/22',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: "Re-Construction Of Damaged Compound Wall And Allied Civil Works At Bank's Holiday Home, Ooty Chennai",
      department: 'Estate Department, RBI Chennai Regional Office',
      budget: 1550000,
      deadline: '2026-07-27',
      category: 'Infrastructure',
      reference_number: 'RBI/Chennai/Estate/11/26-27/ET/22',
      experience_required: 2,
      turnover_required: 775000,
      certifications: ['ISO 9001'],
      technical_requirements: ['Civil Masonry works', 'Structural Wall Reconstruction'],
      timeline: '2 months',
      evaluation_criteria: ['Lowest Financial Bid (L1)']
    }
  },
  {
    id: 'T004',
    title: 'Supply, Installation, Testing & Commissioning of CCTV IP System at RBI Main Building, Mumbai',
    department: 'Department of Supervision, RBI Central Office',
    ministry: 'Ministry of Finance',
    budget: 18500000,
    budgetDisplay: '₹1.85 Cr',
    category: 'Cybersecurity',
    deadline: '2026-07-15',
    daysLeft: 20,
    matchScore: 81,
    description: "Reserve Bank of India, Central Office, Mumbai invites bids for the upgrade and deployment of advanced IP-based CCTV cameras, secure network storage, video analytics suite, and integrated command center monitoring system.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 5 years of experience in Cybersecurity.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹92.5 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹3.70 Lakhs.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001, ISO 27001.",
    location: 'Mumbai, Maharashtra',
    tenderNo: 'RBI/CO/SUP/3/2026/ET/129',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Supply, Installation, Testing & Commissioning of CCTV IP System at RBI Main Building, Mumbai',
      department: 'Department of Supervision, RBI Central Office',
      budget: 18500000,
      deadline: '2026-07-15',
      category: 'Cybersecurity',
      reference_number: 'RBI/CO/SUP/3/2026/ET/129',
      experience_required: 5,
      turnover_required: 9250000,
      certifications: ['ISO 9001', 'ISO 27001'],
      technical_requirements: ['IP Camera Installation', 'Network Storage (NAS) Setup', 'Video Analytics Integration'],
      timeline: '6 months',
      evaluation_criteria: ['QCBS (70:30)']
    }
  },
  {
    id: 'T005',
    title: 'Annual Maintenance Contract for IT Hardware and Network Equipment at RBI Regional Office, Jaipur',
    department: 'Department of Information Technology, RBI Jaipur Office',
    ministry: 'Ministry of Finance',
    budget: 4500000,
    budgetDisplay: '₹45.0 L',
    category: 'IT/Software',
    deadline: '2026-07-10',
    daysLeft: 15,
    matchScore: 92,
    description: "RBI Jaipur invites e-Tenders for the comprehensive Annual Maintenance Contract (AMC) for desktop computers, servers, printers, scanners, local area network cabling, and switch hardware units.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 3 years of experience in IT/Software.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹22.5 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹90,000.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001.",
    location: 'Jaipur, Rajasthan',
    tenderNo: 'RBI/Jaipur/DIT/2/2026/ET/45',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Annual Maintenance Contract for IT Hardware and Network Equipment at RBI Regional Office, Jaipur',
      department: 'Department of Information Technology, RBI Jaipur Office',
      budget: 4500000,
      deadline: '2026-07-10',
      category: 'IT/Software',
      reference_number: 'RBI/Jaipur/DIT/2/2026/ET/45',
      experience_required: 3,
      turnover_required: 2250000,
      certifications: ['ISO 9001'],
      technical_requirements: ['Hardware Maintenance', 'LAN Troubleshooting', 'OS & Desktop Administration'],
      timeline: '12 months',
      evaluation_criteria: ['Lowest Financial Bid (L1)']
    }
  },
  {
    id: 'T006',
    title: 'Design, Development, Migration & Hosting of Integrated Public Grievance CRM Portal',
    department: 'Department of Administrative Reforms & Public Grievances',
    ministry: 'Ministry of Finance',
    budget: 35000000,
    budgetDisplay: '₹3.5 Cr',
    category: 'Web Development',
    deadline: '2026-08-10',
    daysLeft: 46,
    matchScore: 84,
    description: "Ministry of Finance invites bids for the development of a secure cloud-hosted multilingual citizen grievances ticketing CRM portal, integrated with legacy databases, featuring SMS/email triggers, mobile responsiveness, and executive compliance dashboards.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 5 years of experience in Web Development.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹1.75 Cr.\n   - Earnest Money Deposit (EMD) required: ₹7.0 Lakhs.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001, ISO 27001, CMMI Level 3.",
    location: 'New Delhi, Delhi',
    tenderNo: 'MOF/DARPG/CRM/2026/102',
    status: 'open',
    source: 'CPPP',
    metadata: {
      title: 'Design, Development, Migration & Hosting of Integrated Public Grievance CRM Portal',
      department: 'Department of Administrative Reforms & Public Grievances',
      budget: 35000000,
      deadline: '2026-08-10',
      category: 'Web Development',
      reference_number: 'MOF/DARPG/CRM/2026/102',
      experience_required: 5,
      turnover_required: 17500000,
      certifications: ['ISO 9001', 'ISO 27001', 'CMMI Level 3'],
      technical_requirements: ['React + Node.js Monolith Migration', 'API Gateway Rate-Limiter Integration', 'PostgreSQL DB administration'],
      timeline: '12 months',
      evaluation_criteria: ['QCBS (70:30)']
    }
  },
  {
    id: 'T007',
    title: 'Supply and Commissioning of 100KW Solar Power Plant at RBI Staff Quarters, Kochi',
    department: 'Estate Department, RBI Kochi Regional Office',
    ministry: 'Ministry of Finance',
    budget: 6500000,
    budgetDisplay: '₹65.0 L',
    category: 'Infrastructure',
    deadline: '2026-07-20',
    daysLeft: 25,
    matchScore: 71,
    description: "Reserve Bank of India, Kochi invites tenders for the design, procurement, structural mounting, battery grid connection, and commissioning of a 100KW rooftop grid-interactive solar power system at the RBI Officers quarters.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 3 years of experience in Infrastructure.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹32.5 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹1.30 Lakhs.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001.",
    location: 'Kochi, Kerala',
    tenderNo: 'RBI/Kochi/Estate/4/26-27/ET/89',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Supply and Commissioning of 100KW Solar Power Plant at RBI Staff Quarters, Kochi',
      department: 'Estate Department, RBI Kochi Regional Office',
      budget: 6500000,
      deadline: '2026-07-20',
      category: 'Infrastructure',
      reference_number: 'RBI/Kochi/Estate/4/26-27/ET/89',
      experience_required: 3,
      turnover_required: 3250000,
      certifications: ['ISO 9001'],
      technical_requirements: ['Solar Panel Mounting', 'Grid Inverter Synchronization', 'Electrical Net Metering'],
      timeline: '4 months',
      evaluation_criteria: ['Lowest Financial Bid (L1)']
    }
  },
  {
    id: 'T008',
    title: 'Comprehensive Fire Fighting System Upgrade at RBI Office Building, Patna',
    department: 'Estate Department, RBI Patna Regional Office',
    ministry: 'Ministry of Finance',
    budget: 12000000,
    budgetDisplay: '₹1.20 Cr',
    category: 'Infrastructure',
    deadline: '2026-07-30',
    daysLeft: 35,
    matchScore: 75,
    description: "RBI Patna invites bids for the comprehensive retrofitting and deployment of hydrant valves, wet riser pipelines, addressable fire alarm panels, smoke sensors, and sprinkler grids.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 4 years of experience in Infrastructure.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹60.0 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹2.40 Lakhs.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001.",
    location: 'Patna, Bihar',
    tenderNo: 'RBI/Patna/Estate/9/26-27/ET/12',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Comprehensive Fire Fighting System Upgrade at RBI Office Building, Patna',
      department: 'Estate Department, RBI Patna Regional Office',
      budget: 12000000,
      deadline: '2026-07-30',
      category: 'Infrastructure',
      reference_number: 'RBI/Patna/Estate/9/26-27/ET/12',
      experience_required: 4,
      turnover_required: 6000000,
      certifications: ['ISO 9001'],
      technical_requirements: ['Fire Pipeline Fitting', 'Addressable Alarm Programming', 'NOC Liaisoning'],
      timeline: '5 months',
      evaluation_criteria: ['Lowest Financial Bid (L1)']
    }
  },
  {
    id: 'T009',
    title: 'Facility Management Services for IT Infrastructure and Servers at RBI Office, Kolkata',
    department: 'Department of Information Technology, RBI Kolkata Office',
    ministry: 'Ministry of Finance',
    budget: 14500000,
    budgetDisplay: '₹1.45 Cr',
    category: 'IT/Software',
    deadline: '2026-08-05',
    daysLeft: 41,
    matchScore: 89,
    description: "RBI Kolkata invites e-Tenders for the provisioning of round-the-clock Facility Management Services (FMS) to support active servers, hypervisors, virtualization clusters, network routing, and server room operations.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 4 years of experience in IT/Software.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹72.5 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹2.90 Lakhs.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001, ISO 27001.",
    location: 'Kolkata, West Bengal',
    tenderNo: 'RBI/Kolkata/DIT/1/2026/ET/302',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Facility Management Services for IT Infrastructure and Servers at RBI Office, Kolkata',
      department: 'Department of Information Technology, RBI Kolkata Office',
      budget: 14500000,
      deadline: '2026-08-05',
      category: 'IT/Software',
      reference_number: 'RBI/Kolkata/DIT/1/2026/ET/302',
      experience_required: 4,
      turnover_required: 7250000,
      certifications: ['ISO 9001', 'ISO 27001'],
      technical_requirements: ['Server Administration', 'VMware & Hypervisor Monitoring', 'Active Directory config'],
      timeline: '12 months',
      evaluation_criteria: ['QCBS (70:30)']
    }
  },
  {
    id: 'T010',
    title: 'Supply, Installation & Commissioning of Central Air Conditioning Plant at RBI Office, Guwahati',
    department: 'Estate Department, RBI Guwahati Regional Office',
    ministry: 'Ministry of Finance',
    budget: 28000000,
    budgetDisplay: '₹2.80 Cr',
    category: 'Infrastructure',
    deadline: '2026-08-20',
    daysLeft: 56,
    matchScore: 68,
    description: "Reserve Bank of India, Guwahati invites e-Tenders for the supply, ducting fabrication, chiller node integration, and commissioning of a central VRF/air conditioning plant for the regional office building.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 4 years of experience in Infrastructure.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹1.40 Cr.\n   - Earnest Money Deposit (EMD) required: ₹5.60 Lakhs.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001.",
    location: 'Guwahati, Assam',
    tenderNo: 'RBI/Guwahati/Estate/6/26-27/ET/210',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Supply, Installation & Commissioning of Central Air Conditioning Plant at RBI Office, Guwahati',
      department: 'Estate Department, RBI Guwahati Regional Office',
      budget: 28000000,
      deadline: '2026-08-20',
      category: 'Infrastructure',
      reference_number: 'RBI/Guwahati/Estate/6/26-27/ET/210',
      experience_required: 4,
      turnover_required: 14000000,
      certifications: ['ISO 9001'],
      technical_requirements: ['VRF Chiller Installation', 'Ducting & Air Balancing', 'Automated Thermostat setup'],
      timeline: '6 months',
      evaluation_criteria: ['Lowest Financial Bid (L1)']
    }
  },
  {
    id: 'T011',
    title: 'Outsourced Citizen Helpdesk Call Center Services for RBI Grievance Redressal Cell',
    department: 'Consumer Education and Protection Department, RBI Central Office',
    ministry: 'Ministry of Finance',
    budget: 16500000,
    budgetDisplay: '₹1.65 Cr',
    category: 'IT/Software',
    deadline: '2026-07-28',
    daysLeft: 23,
    matchScore: 86,
    description: "RBI Central Office, Mumbai invites bids for the provisioning of outsourced customer support and call center helpdesk services, including regional language translation support, VoIP integration, and compliance ticketing CRM software.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 4 years of experience in IT/Software.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹82.5 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹3.30 Lakhs.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001, ISO 27001.",
    location: 'Mumbai, Maharashtra',
    tenderNo: 'RBI/CO/CEPD/5/2026/ET/54',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Outsourced Citizen Helpdesk Call Center Services for RBI Grievance Redressal Cell',
      department: 'Consumer Education and Protection Department, RBI Central Office',
      budget: 16500000,
      deadline: '2026-07-28',
      category: 'IT/Software',
      reference_number: 'RBI/CO/CEPD/5/2026/ET/54',
      experience_required: 4,
      turnover_required: 8250000,
      certifications: ['ISO 9001', 'ISO 27001'],
      technical_requirements: ['Voice Helpdesk Operations', 'SIP/VoIP Network Integration', 'CRM ticketing systems'],
      timeline: '12 months',
      evaluation_criteria: ['QCBS (70:30)']
    }
  },
  {
    id: 'T012',
    title: 'Structural Audit and Rehabilitation of Main Office Building at RBI Regional Office, Kanpur',
    department: 'Estate Department, RBI Kanpur Regional Office',
    ministry: 'Ministry of Finance',
    budget: 3800000,
    budgetDisplay: '₹38.0 L',
    category: 'Infrastructure',
    deadline: '2026-07-22',
    daysLeft: 27,
    matchScore: 79,
    description: "Reserve Bank of India, Kanpur invites e-Tenders for carrying out non-destructive tests (NDT), structural integrity auditing, core concrete analysis, and subsequent structural rehabilitation works on the office tower.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 3 years of experience in Infrastructure.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹19.0 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹76,000.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001.",
    location: 'Kanpur, Uttar Pradesh',
    tenderNo: 'RBI/Kanpur/Estate/3/26-27/ET/129',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Structural Audit and Rehabilitation of Main Office Building at RBI Regional Office, Kanpur',
      department: 'Estate Department, RBI Kanpur Regional Office',
      budget: 3800000,
      deadline: '2026-07-22',
      category: 'Infrastructure',
      reference_number: 'RBI/Kanpur/Estate/3/26-27/ET/129',
      experience_required: 3,
      turnover_required: 1900000,
      certifications: ['ISO 9001'],
      technical_requirements: ['Non-Destructive Testing (NDT)', 'Concrete Core Sampling', 'Rebar Scanning & Epoxy injection'],
      timeline: '3 months',
      evaluation_criteria: ['Lowest Financial Bid (L1)']
    }
  },
  {
    id: 'T013',
    title: 'Supply and Integration of Core Network Security Firewalls and Threat Prevention Systems',
    department: 'Department of Information Technology, RBI Hyderabad Office',
    ministry: 'Ministry of Finance',
    budget: 22000000,
    budgetDisplay: '₹2.20 Cr',
    category: 'Cybersecurity',
    deadline: '2026-08-01',
    daysLeft: 37,
    matchScore: 85,
    description: "RBI Hyderabad invites e-Tenders for the supply, mounting, fiber integration, and routing configuration of enterprise-grade active-active network security firewalls, intrusion prevention systems, and secure SSL inspection portals.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 4 years of experience in Cybersecurity.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹1.10 Cr.\n   - Earnest Money Deposit (EMD) required: ₹4.40 Lakhs.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001, ISO 27001.",
    location: 'Hyderabad, Telangana',
    tenderNo: 'RBI/Hyderabad/DIT/4/2026/ET/142',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Supply and Integration of Core Network Security Firewalls and Threat Prevention Systems',
      department: 'Department of Information Technology, RBI Hyderabad Office',
      budget: 22000000,
      deadline: '2026-08-01',
      category: 'Cybersecurity',
      reference_number: 'RBI/Hyderabad/DIT/4/2026/ET/142',
      experience_required: 4,
      turnover_required: 11000000,
      certifications: ['ISO 9001', 'ISO 27001'],
      technical_requirements: ['Enterprise Firewall Provisioning', 'Intrusion Prevention System (IPS) config', 'BGP/OSPF Routing integration'],
      timeline: '4 months',
      evaluation_criteria: ['QCBS (70:30)']
    }
  },
  {
    id: 'T014',
    title: 'Design, Multi-color Printing and Distribution of Financial Literacy Booklets',
    department: 'Consumer Education and Protection Department, RBI New Delhi Office',
    ministry: 'Ministry of Finance',
    budget: 1800000,
    budgetDisplay: '₹18.0 L',
    category: 'Web Development',
    deadline: '2026-07-18',
    daysLeft: 23,
    matchScore: 78,
    description: "CEP Department, RBI New Delhi invites tenders for the digital typesetting, printing on eco-friendly paper, bundling, and distribution of 2 Lakh financial awareness booklets across regional districts.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 2 years of experience in Web Development.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹9.0 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹36,000.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001.",
    location: 'New Delhi, Delhi',
    tenderNo: 'RBI/Delhi/CEPD/8/2026/ET/15',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Design, Multi-color Printing and Distribution of Financial Literacy Booklets',
      department: 'Consumer Education and Protection Department, RBI New Delhi Office',
      budget: 1800000,
      deadline: '2026-07-18',
      category: 'Web Development',
      reference_number: 'RBI/Delhi/CEPD/8/2026/ET/15',
      experience_required: 2,
      turnover_required: 900000,
      certifications: ['ISO 9001'],
      technical_requirements: ['Graphic Design & Typesetting', 'Industrial Printing', 'Logistics coordination'],
      timeline: '2 months',
      evaluation_criteria: ['Lowest Financial Bid (L1)']
    }
  },
  {
    id: 'T015',
    title: 'Landscaping and Horticultural Maintenance Works at RBI Officers Residential Complex, Chennai',
    department: 'Estate Department, RBI Chennai Regional Office',
    ministry: 'Ministry of Finance',
    budget: 2200000,
    budgetDisplay: '₹22.0 L',
    category: 'Infrastructure',
    deadline: '2026-07-28',
    daysLeft: 33,
    matchScore: 80,
    description: "Reserve Bank of India, Chennai invites e-Tenders for the comprehensive upkeep of lawns, vertical gardens, sprinkler grids, and landscaping maintenance at the bank's Officers flats, Poes Garden, Chennai.\n\nMINIMUM ELIGIBILITY CRITERIA:\n1. Experience:\n   - The bidder must have at least 2 years of experience in Infrastructure.\n2. Financial Eligibility:\n   - Average annual turnover of the bidder must be at least ₹11.0 Lakhs.\n   - Earnest Money Deposit (EMD) required: ₹44,000.\n3. Quality Certifications:\n   - Mandatory certificates: ISO 9001.",
    location: 'Chennai, Tamil Nadu',
    tenderNo: 'RBI/Chennai/Estate/4/26-27/ET/95',
    status: 'open',
    source: 'RBI Portal',
    metadata: {
      title: 'Landscaping and Horticultural Maintenance Works at RBI Officers Residential Complex, Chennai',
      department: 'Estate Department, RBI Chennai Regional Office',
      budget: 2200000,
      deadline: '2026-07-28',
      category: 'Infrastructure',
      reference_number: 'RBI/Chennai/Estate/4/26-27/ET/95',
      experience_required: 2,
      turnover_required: 1100000,
      certifications: ['ISO 9001'],
      technical_requirements: ['Lawn Landscaping', 'Horticulture Maintenance', 'Sprinkler plumbing repairs'],
      timeline: '12 months',
      evaluation_criteria: ['Lowest Financial Bid (L1)']
    }
  }
];;

// ===================== MOCK SCHEMES =====================
export const MOCK_SCHEMES: Scheme[] = [
  {
    id: 'S001',
    name: 'Startup India Seed Fund Scheme',
    provider: 'DPIIT',
    providerType: 'central',
    benefit: 'Grant up to ₹20 Lakhs + ₹50L debt',
    benefitAmount: 2000000,
    eligibility: 'DPIIT recognized startups, <2 yrs old, not in financial support earlier',
    matchScore: 92,
    deadline: '2026-09-30',
    category: 'Startup',
    description: 'Provides financial assistance to startups for proof of concept, prototype development, product trials, market-entry, and commercialization.',
    applyUrl: 'https://seedfund.startupindia.gov.in',
  },
  {
    id: 'S002',
    name: 'MSME Technology Upgradation Fund',
    provider: 'Ministry of MSME',
    providerType: 'central',
    benefit: 'Subsidy up to 15% on plant & machinery',
    benefitAmount: 1500000,
    eligibility: 'Registered MSMEs with valid Udyam certificate',
    matchScore: 85,
    deadline: '2026-12-31',
    category: 'MSME',
    description: 'Financial support to MSMEs for technology upgradation, adoption of clean technologies, and energy-efficient processes.',
    applyUrl: 'https://dcmsme.gov.in',
  },
  {
    id: 'S003',
    name: 'Digital MSME Scheme',
    provider: 'Ministry of MSME',
    providerType: 'central',
    benefit: 'Up to ₹1 Lakh subsidy on cloud tools',
    benefitAmount: 100000,
    eligibility: 'Registered MSMEs seeking digital transformation',
    matchScore: 78,
    deadline: '2026-08-31',
    category: 'MSME',
    description: 'Promotes use of cloud-based services, digital tools, and technology platforms among MSMEs for improving competitiveness.',
    applyUrl: 'https://digitalmsme.in',
  },
  {
    id: 'S004',
    name: 'MeitY Startup Hub Acceleration Program',
    provider: 'MeitY',
    providerType: 'ministry',
    benefit: '₹25L grant + mentorship + infra',
    benefitAmount: 2500000,
    eligibility: 'Deep tech startups in AI, IoT, Blockchain, Cybersecurity',
    matchScore: 89,
    deadline: '2026-07-31',
    category: 'Tech Startup',
    description: 'Accelerates deep technology startups through funding, mentorship, infrastructure support, and government procurement opportunities.',
    applyUrl: 'https://msh.meity.gov.in',
  },
  {
    id: 'S005',
    name: 'Software Technology Parks Tax Benefits',
    provider: 'STPI',
    providerType: 'ministry',
    benefit: '10-year tax holiday + duty exemptions',
    benefitAmount: 5000000,
    eligibility: 'IT/ITES companies exporting software from STP units',
    matchScore: 81,
    deadline: 'Ongoing',
    category: 'Tax Benefit',
    description: 'Tax holidays, customs duty exemptions, and infrastructure support for software exporters registered under the STP scheme.',
    applyUrl: 'https://stpi.in',
  },
  {
    id: 'S006',
    name: 'Make in India Digital Initiative',
    provider: 'DPIIT',
    providerType: 'central',
    benefit: 'Preferential market access in govt procurement',
    benefitAmount: 0,
    eligibility: 'Companies with >50% local value addition in IT products',
    matchScore: 76,
    deadline: 'Ongoing',
    category: 'Procurement Benefit',
    description: 'Preferential market access policy for domestically manufactured electronic products in government procurement.',
    applyUrl: 'https://makeinindia.com',
  },
  {
    id: 'S007',
    name: 'DPIIT Startup Recognition Benefits',
    provider: 'DPIIT',
    providerType: 'central',
    benefit: 'Tax exemptions + IPR fast-track + tender relaxations',
    benefitAmount: 0,
    eligibility: 'Startups registered on Startup India portal',
    matchScore: 94,
    deadline: 'Ongoing',
    category: 'Startup',
    description: 'Recognized startups get income tax exemption for 3 years, fast-track IPR, self-certification under labour laws, and relaxed tender norms.',
    applyUrl: 'https://startupindia.gov.in/recognition',
  },
  {
    id: 'S008',
    name: 'Atal Innovation Mission Grant',
    provider: 'NITI Aayog',
    providerType: 'central',
    benefit: 'Up to ₹1 Crore grant for deep tech',
    benefitAmount: 10000000,
    eligibility: 'Innovative startups in priority sectors with working prototype',
    matchScore: 67,
    deadline: '2026-10-15',
    category: 'Innovation',
    description: 'Grant support for breakthrough innovations in priority sectors through AIM network of Atal Incubation Centers.',
    applyUrl: 'https://aim.gov.in',
  },
  {
    id: 'S009',
    name: 'Pradhan Mantri Mudra Yojana (PMMY)',
    provider: 'Ministry of Finance',
    providerType: 'central',
    benefit: 'Collateral-free loans up to ₹10 Lakh',
    benefitAmount: 1000000,
    eligibility: 'Non-corporate, non-farm small/micro enterprises',
    matchScore: 73,
    deadline: 'Ongoing',
    category: 'MSME Finance',
    description: 'Provides collateral-free micro-loans under Shishu (₹50K), Kishor (₹5L), and Tarun (₹10L) categories for business growth.',
    applyUrl: 'https://mudra.org.in',
  },
  {
    id: 'S010',
    name: 'Credit Guarantee Fund for Startups (CGFS)',
    provider: 'SIDBI',
    providerType: 'central',
    benefit: 'Credit guarantee up to ₹5 Crore',
    benefitAmount: 50000000,
    eligibility: 'DPIIT recognized startups, CGTMSE member lending institutions',
    matchScore: 83,
    deadline: '2027-03-31',
    category: 'Finance',
    description: 'Provides credit guarantee coverage to enable collateral-free lending to startups by banks and NBFCs.',
    applyUrl: 'https://sidbi.in/cgfs',
  },
  {
    id: 'S011',
    name: 'Production Linked Incentive for IT Hardware',
    provider: 'MeitY',
    providerType: 'ministry',
    benefit: '4-6% incentive on incremental sales',
    benefitAmount: 3000000,
    eligibility: 'Manufacturers of laptops, tablets, servers, IoT devices',
    matchScore: 55,
    deadline: '2026-08-31',
    category: 'Manufacturing',
    description: 'PLI scheme offering financial incentives to boost domestic manufacturing of IT hardware and reduce import dependence.',
    applyUrl: 'https://meity.gov.in/pli-ithardware',
  },
  {
    id: 'S012',
    name: 'NASSCOM Emerge 50 Innovation Program',
    provider: 'NASSCOM',
    providerType: 'ministry',
    benefit: 'Mentorship + ₹10L prize + visibility',
    benefitAmount: 1000000,
    eligibility: 'Product startups with >6 months operational history',
    matchScore: 71,
    deadline: '2026-07-30',
    category: 'Tech Startup',
    description: 'Recognizes and accelerates India\'s most promising tech product startups with mentoring, funding connections, and media exposure.',
    applyUrl: 'https://emerge50.nasscom.in',
  },
  {
    id: 'S013',
    name: 'GeM Seller Incentive Program',
    provider: 'GeM Portal',
    providerType: 'central',
    benefit: 'Preferential access to ₹3L Cr govt purchases',
    benefitAmount: 0,
    eligibility: 'MSMEs and startups registered on GeM portal',
    matchScore: 88,
    deadline: 'Ongoing',
    category: 'Procurement',
    description: 'GeM registration gives MSMEs and startups direct access to government procurement market with payment guarantee within 10 days.',
    applyUrl: 'https://gem.gov.in',
  },
  {
    id: 'S014',
    name: 'Tamil Nadu Startup Policy & TANSEED Grant',
    provider: 'Tamil Nadu Govt',
    providerType: 'state',
    benefit: '₹50L seed support + office space',
    benefitAmount: 5000000,
    eligibility: 'Startups registered in Tamil Nadu with innovative product',
    matchScore: 62,
    deadline: '2027-03-31',
    category: 'State Scheme',
    description: 'Comprehensive startup support including seed funding, co-working space, mentorship, and fast-track incorporation for Tamil Nadu-based startups.',
    applyUrl: 'https://startuptn.in',
  },
  {
    id: 'S015',
    name: 'National Supercomputing Mission Grant',
    provider: 'DST',
    providerType: 'central',
    benefit: 'HPC access worth ₹2Cr + grants',
    benefitAmount: 20000000,
    eligibility: 'Research institutions and tech companies in HPC/AI domain',
    matchScore: 48,
    deadline: '2026-09-15',
    category: 'R&D',
    description: 'Access to high-performance computing resources and grants for R&D in computational science, AI, and data analytics.',
    applyUrl: 'https://nsm.gov.in',
  },
  {
    id: 'S016',
    name: 'Export Promotion Capital Goods (EPCG)',
    provider: 'DGFT',
    providerType: 'central',
    benefit: 'Zero duty on capital goods import',
    benefitAmount: 2000000,
    eligibility: 'IT/ITES exporters with export obligation of 6x in 6 years',
    matchScore: 69,
    deadline: 'Ongoing',
    category: 'Export Benefit',
    description: 'Allows import of capital goods at zero customs duty for upgrading technology in export-oriented units.',
    applyUrl: 'https://dgft.gov.in',
  },
  {
    id: 'S017',
    name: 'TIDE 2.0 - Technology Incubation Program',
    provider: 'MeitY',
    providerType: 'ministry',
    benefit: '₹75L financial support per startup',
    benefitAmount: 7500000,
    eligibility: 'Early-stage tech startups in AI, IoT, blockchain, cybersecurity',
    matchScore: 86,
    deadline: '2026-08-20',
    category: 'Tech Startup',
    description: 'Supports technology incubation through financial assistance, mentoring, and networking to commercialize deep tech innovations.',
    applyUrl: 'https://tide.meity.gov.in',
  },
  {
    id: 'S018',
    name: 'NASSCOM Data Security Council of India',
    provider: 'DSCI',
    providerType: 'ministry',
    benefit: 'Certification + market access in US/EU',
    benefitAmount: 0,
    eligibility: 'IT/ITES companies with data security practices',
    matchScore: 74,
    deadline: 'Ongoing',
    category: 'Certification',
    description: 'DSCI certification enhances market access in US and EU markets for Indian IT companies with strong data privacy practices.',
    applyUrl: 'https://dsci.in',
  },
  {
    id: 'S019',
    name: 'PM GatiShakti Digital Infrastructure Fund',
    provider: 'Ministry of Finance',
    providerType: 'central',
    benefit: 'Grants for digital infra development',
    benefitAmount: 5000000,
    eligibility: 'Companies building digital/physical infrastructure',
    matchScore: 58,
    deadline: '2026-12-31',
    category: 'Infrastructure',
    description: 'Financial support for building digital infrastructure under PM GatiShakti National Master Plan for multi-modal connectivity.',
    applyUrl: 'https://pmgatishakti.gov.in',
  },
  {
    id: 'S020',
    name: 'Startup India Tax Exemption (Section 80-IAC)',
    provider: 'Income Tax Dept',
    providerType: 'central',
    benefit: '100% tax exemption for 3 consecutive years',
    benefitAmount: 0,
    eligibility: 'DPIIT recognized startups incorporated after Apr 2016',
    matchScore: 91,
    deadline: 'Ongoing',
    category: 'Tax Benefit',
    description: 'Complete income tax exemption for any 3 consecutive years out of first 10 years for eligible startups under Startup India.',
    applyUrl: 'https://startupindia.gov.in/tax',
  },
];

// ===================== MOCK AGENT STEPS =====================
export const MOCK_AGENT_STEPS: AgentStep[] = [
  {
    id: 1,
    name: 'Extraction & Classification',
    description: 'Parsing document text and classifying tender category',
    status: 'completed',
    duration: '1.2s',
    icon: 'FileText',
  },
  {
    id: 2,
    name: 'Eligibility Matcher',
    description: 'Matching bidder profile parameters vs tender criteria',
    status: 'completed',
    duration: '1.5s',
    icon: 'CheckCircle',
  },
  {
    id: 3,
    name: 'Compliance & Gap Auditor',
    description: 'Auditing technical specifications and gaps',
    status: 'completed',
    duration: '1.7s',
    icon: 'Settings',
  },
  {
    id: 4,
    name: 'Financial & Risk Assessor',
    description: 'Evaluating cost breakdown, delivery risks, and subsidies',
    status: 'running',
    icon: 'DollarSign',
  },
  {
    id: 5,
    name: 'Success & Competitor Intel',
    description: 'Predicting bidding success and competitor profiles',
    status: 'pending',
    icon: 'TrendingUp',
  },
  {
    id: 6,
    name: 'Proposal & Report Builder',
    description: 'Compiling final report and exporting PDF format',
    status: 'pending',
    icon: 'FileDown',
  },
];

// ===================== MOCK ANALYSIS RESULT =====================
export const MOCK_ANALYSIS_RESULT = {
  tenderId: 'T001',
  tenderTitle: 'Integrated e-Governance Platform Development',
  analysisId: 'ANL-2026-0142',
  generatedAt: '2026-06-24T17:00:00Z',

  scores: {
    eligibility: 78,
    technical: 72,
    financial: 68,
    experience: 65,
    compliance: 80,
    overall: 73,
  },

  recommendation: 'RECOMMENDED' as const,
  winProbability: 67,
  riskLevel: 'medium' as const,

  eligibilityCriteria: [
    { criterion: 'Company Registration', required: 'Registered under Companies Act', current: 'Pvt Ltd registered 2021', score: 100, status: 'met' as const },
    { criterion: 'Annual Turnover', required: '₹2 Cr minimum last 3 years', current: '₹1.8 Cr (FY24)', score: 60, status: 'partial' as const },
    { criterion: 'Prior Experience', required: '3+ similar government projects', current: '2 projects completed', score: 66, status: 'partial' as const },
    { criterion: 'ISO 9001 Certification', required: 'Mandatory', current: 'Certified till Dec 2027', score: 100, status: 'met' as const },
    { criterion: 'CMMI Level', required: 'CMMI Level 3 or above', current: 'Not certified', score: 0, status: 'not_met' as const },
    { criterion: 'EMD Amount', required: '₹16 Lakhs', current: 'Can arrange', score: 100, status: 'met' as const },
    { criterion: 'PAN & GST', required: 'Valid PAN and GST registration', current: 'Both valid', score: 100, status: 'met' as const },
    { criterion: 'GeM Registration', required: 'GeM seller registration', current: 'Not registered', score: 0, status: 'not_met' as const },
  ],

  gaps: [
    { id: 1, requirement: 'CMMI Level 3 Certification', required: 'CMMI Level 3 or equivalent', currentStatus: 'Not certified', gapType: 'critical' as const, recommendation: 'Initiate CMMI Level 3 appraisal immediately. Partner with a CMMI-certified subcontractor in interim.', met: false },
    { id: 2, requirement: 'Annual Turnover', required: '₹2 Crore minimum', currentStatus: '₹1.8 Cr (FY24)', gapType: 'important' as const, recommendation: 'Submit CA certificate with consolidated group turnover or partner with a larger firm.', met: false },
    { id: 3, requirement: 'Government Project Experience', required: '3 similar projects', currentStatus: '2 projects', gapType: 'important' as const, recommendation: 'Submit comprehensive project references including any sub-contractor or consortium roles.', met: false },
    { id: 4, requirement: 'GeM Registration', required: 'Active GeM seller', currentStatus: 'Not registered', gapType: 'critical' as const, recommendation: 'Register on GeM portal immediately at gem.gov.in. Process takes 2-3 days.', met: false },
    { id: 5, requirement: 'Data Center Experience', required: 'Experience with Tier 3+ DC', currentStatus: 'Limited experience', gapType: 'important' as const, recommendation: 'Partner with a certified data center provider for this component.', met: false },
    { id: 6, requirement: 'ReactJS Expertise', required: 'Team with ReactJS & Node.js', currentStatus: '3 ReactJS developers', gapType: 'optional' as const, recommendation: 'Team strength is adequate. Consider upskilling 1-2 more developers.', met: true },
    { id: 7, requirement: 'Project Manager Qualification', required: 'PMP certified PM', currentStatus: 'PM with 7 yrs experience, no PMP', gapType: 'optional' as const, recommendation: 'Enroll PM in PMP certification. Can submit experience certificate as substitute.', met: false },
  ],

  costEstimation: {
    development: 8500000,
    infrastructure: 3200000,
    team: 12000000,
    operations: 2800000,
    contingency: 1500000,
    total: 28000000,
    recommendedBid: 29500000,
    marginPercent: 12.8,
  },

  risks: [
    { id: 1, title: 'Payment Delay Risk', description: 'Government projects often face 60-90 day payment delays', level: 'high' as const, likelihood: 'likely', impact: 'high', mitigation: 'Include payment terms clause, maintain 3-month working capital buffer' },
    { id: 2, title: 'Scope Creep Risk', description: 'e-Governance projects often face scope expansion mid-project', level: 'high' as const, likelihood: 'likely', impact: 'medium', mitigation: 'Strong change management process, detailed SRS sign-off before development' },
    { id: 3, title: 'Integration Complexity', description: 'Integration with legacy government systems is unpredictable', level: 'medium' as const, likelihood: 'possible', impact: 'high', mitigation: 'Allocate 30% buffer time for integration, request API documentation upfront' },
    { id: 4, title: 'Key Person Dependency', description: 'Loss of key technical resources during project', level: 'medium' as const, likelihood: 'possible', impact: 'medium', mitigation: 'Document all processes, cross-train team members, retention bonuses' },
    { id: 5, title: 'Security Audit Compliance', description: 'CERT-In security audits may reveal compliance gaps', level: 'low' as const, likelihood: 'unlikely', impact: 'high', mitigation: 'Pre-emptive VAPT testing, engage certified security auditor from day 1' },
  ],

  proposalSections: {
    executiveSummary: `TechVenture Solutions Pvt Ltd proposes to develop a comprehensive Integrated e-Governance Platform for the National Informatics Centre under MeitY. With our proven track record of delivering 2 government digital transformation projects and expertise in React, Node.js, and cloud technologies, we are well-positioned to deliver this mission-critical solution.\n\nOur approach combines agile delivery methodology with government compliance frameworks, ensuring on-time delivery within the allocated budget of ₹3.2 Crores. The proposed solution will serve 50+ government departments, handling 10 lakh+ citizen transactions daily with 99.9% uptime guarantee.`,
    technicalApproach: `Our technical architecture follows microservices principles deployed on NIC Cloud (MeghRaj), ensuring data sovereignty and GIGW compliance:\n\n• Frontend: React 18 + TypeScript with accessibility-first design (WCAG 2.1 AA)\n• Backend: Node.js microservices with API Gateway pattern\n• Database: PostgreSQL for transactional data, Redis for caching\n• Security: OAuth 2.0 + Aadhaar authentication, end-to-end encryption\n• Deployment: Containerized via Docker + Kubernetes on NIC Cloud`,
    teamComposition: `Project Team (15 members):\n• 1 Project Manager (7 years, PMP eligible)\n• 2 Solution Architects (10+ years each)\n• 4 Full-Stack Developers (React/Node.js)\n• 2 Backend Developers (Java/Spring Boot)\n• 2 QA Engineers (ISTQB certified)\n• 1 DevOps Engineer\n• 1 Security Specialist\n• 1 Business Analyst\n• 1 UI/UX Designer`,
  },

  matchingSchemes: ['S001', 'S004', 'S007', 'S013', 'S017', 'S020'],
};

// ===================== MOCK DASHBOARD STATS =====================
export const MOCK_DASHBOARD_STATS = {
  activeTenders: { value: 24, trend: '+3', trending: 'up' as const },
  matchingTenders: { value: 8, matchScore: 78, trending: 'up' as const },
  upcomingDeadlines: { value: 3, urgency: 'high' as const },
  successRate: { value: 73, trend: '+5%', trending: 'up' as const },

  recentAnalyses: [
    { id: 'ANL-0142', tenderName: 'Integrated e-Governance Platform', eligibility: 78, winProbability: 67, risk: 'medium' as const, date: '2026-06-24', status: 'completed' as const },
    { id: 'ANL-0141', tenderName: 'SEBI Financial Analytics Platform', eligibility: 85, winProbability: 74, risk: 'low' as const, date: '2026-06-22', status: 'completed' as const },
    { id: 'ANL-0140', tenderName: 'DRDO Cybersecurity Upgrade', eligibility: 52, winProbability: 31, risk: 'high' as const, date: '2026-06-20', status: 'completed' as const },
    { id: 'ANL-0139', tenderName: 'GSTN Tax Analytics Dashboard', eligibility: 91, winProbability: 82, risk: 'low' as const, date: '2026-06-18', status: 'completed' as const },
    { id: 'ANL-0138', tenderName: 'MeitY Digital India Portal', eligibility: 88, winProbability: 79, risk: 'low' as const, date: '2026-06-15', status: 'completed' as const },
  ],

  upcomingDeadlinesList: [
    { id: 'T004', name: 'Aadhaar Integration API Services', deadline: '2026-06-30', daysLeft: 6, budget: '₹85 L' },
    { id: 'T002', name: 'DRDO Cybersecurity Upgrade', deadline: '2026-07-05', daysLeft: 11, budget: '₹1.8 Cr' },
    { id: 'T008', name: 'Crop Monitoring Mobile App', deadline: '2026-07-10', daysLeft: 16, budget: '₹45 L' },
  ],
};

// ===================== MOCK CHAT MESSAGES =====================
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-001',
    role: 'assistant',
    content: 'Hello! I\'m TenderAI, your intelligent tender analysis assistant. I have access to all your analyzed tenders, company profile, and government scheme data. How can I help you today?',
    timestamp: '2026-06-24T16:45:00Z',
  },
  {
    id: 'msg-002',
    role: 'user',
    content: 'Can I apply for the NIC e-Governance tender?',
    timestamp: '2026-06-24T16:45:30Z',
  },
  {
    id: 'msg-003',
    role: 'assistant',
    content: `**Eligibility Assessment for NIC e-Governance Platform Tender (₹3.2 Cr)**\n\nBased on my analysis of your company profile against the tender requirements:\n\n**✅ Criteria Met (5/8):**\n- Company Registration — Pvt Ltd ✓\n- ISO 9001 Certification ✓\n- PAN & GST Registration ✓\n- EMD Capacity (₹16L) ✓\n- Technical Team (ReactJS/Node.js) ✓\n\n**⚠️ Partial Match (2/8):**\n- Annual Turnover: ₹1.8 Cr vs ₹2 Cr required (gap of ₹20L)\n- Government Experience: 2 projects vs 3 required\n\n**❌ Critical Gaps (2/8):**\n- CMMI Level 3 Certification (mandatory)\n- GeM Portal Registration (can register in 2-3 days)\n\n**📊 Overall Eligibility: 78%**\n\n**My Recommendation:** You CAN bid with strategic positioning:\n1. Register on GeM portal immediately\n2. Partner with a CMMI-certified firm as lead bidder\n3. Present consolidated group turnover for financial qualification\n\nWould you like me to draft a proposal outline or find matching government schemes to strengthen your bid? 🎯`,
    timestamp: '2026-06-24T16:46:00Z',
  },
  {
    id: 'msg-004',
    role: 'user',
    content: 'What government schemes can help me reduce costs for this project?',
    timestamp: '2026-06-24T16:47:00Z',
  },
  {
    id: 'msg-005',
    role: 'assistant',
    content: `**🏛️ Recommended Government Schemes for This Project**\n\nI've matched 6 schemes that can significantly reduce your project costs and improve bid competitiveness:\n\n**1. DPIIT Startup Recognition (Match: 94%)**\n- Benefit: Tax exemption on project profits for 3 years\n- Action: Apply at startupindia.gov.in if not already done\n\n**2. MeitY Startup Hub Acceleration (Match: 89%)**\n- Benefit: ₹25 Lakh grant + cloud infrastructure credits\n- Action: Apply before July 31, 2026\n\n**3. Startup India Seed Fund (Match: 92%)**\n- Benefit: ₹20L grant + ₹50L debt at low interest\n- Action: Open round — apply at seedfund.startupindia.gov.in\n\n**4. TIDE 2.0 Program (Match: 86%)**\n- Benefit: ₹75L financial support for tech startups\n- Action: Deadline August 20, 2026\n\n**💰 Potential Savings:** Combining these schemes could reduce effective project cost by **18-22%**, improving your bid margin from 12.8% to potentially 30%+.\n\nShould I prepare an application checklist for the top 3 schemes? 📋`,
    timestamp: '2026-06-24T16:47:45Z',
  },
];
