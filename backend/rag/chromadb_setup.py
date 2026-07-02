"""
ChromaDB Setup and RAG Retriever for Tender Analyzer
"""
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False
    logger.warning("ChromaDB not available")

try:
    from sentence_transformers import SentenceTransformer
    ST_AVAILABLE = True
except ImportError:
    ST_AVAILABLE = False
    logger.warning("sentence-transformers not available")

_chroma_client = None
_embedding_model = None

SCHEME_DATA = [
    {"id": "scheme-001", "name": "Startup India Seed Fund Scheme", "provider": "DPIIT",
     "amount": "20 Lakhs", "type": "startup", "eligibility": "DPIIT recognized startups",
     "benefit": "Seed funding for prototype development and market entry",
     "deadline": "Rolling applications", "link": "startupindia.gov.in/seed-fund",
     "description": "Provides financial assistance to startups for proof of concept prototype development product trials market entry and commercialization"},
    {"id": "scheme-002", "name": "MSME Technology Upgradation Fund Scheme", "provider": "MSME Ministry",
     "amount": "1 Crore", "type": "msme", "eligibility": "Registered MSME units",
     "benefit": "Capital subsidy for technology upgrade and modernization",
     "deadline": "Ongoing", "link": "msme.gov.in/tufs",
     "description": "Financial support to MSMEs for technology upgradation to improve productivity and competitiveness"},
    {"id": "scheme-003", "name": "Digital MSME Scheme", "provider": "MSME Ministry",
     "amount": "50 Lakhs", "type": "msme", "eligibility": "MSMEs with Udyam registration",
     "benefit": "Cloud computing and digitization support",
     "deadline": "Ongoing", "link": "digitalmsme.gov.in",
     "description": "Adoption of cloud computing services and digital tools by MSMEs to enhance productivity"},
    {"id": "scheme-004", "name": "MeitY Startup Hub Program", "provider": "MeitY",
     "amount": "25 Lakhs", "type": "startup", "eligibility": "IT Software startups",
     "benefit": "Incubation funding and market access",
     "deadline": "Quarterly cohorts", "link": "meity.gov.in/startup-hub",
     "description": "Supporting IT and software startups through incubation mentoring and seed funding"},
    {"id": "scheme-005", "name": "Software Technology Parks Scheme", "provider": "STPI",
     "amount": "Tax benefits plus Infrastructure", "type": "national", "eligibility": "Software export companies",
     "benefit": "Income tax exemption and infrastructure support",
     "deadline": "Ongoing", "link": "stpi.in",
     "description": "Tax holiday and infrastructure support for software development and export companies"},
    {"id": "scheme-006", "name": "DPIIT Recognition Benefits", "provider": "DPIIT",
     "amount": "Multiple benefits", "type": "startup", "eligibility": "Innovative startups under 10 years",
     "benefit": "Tax exemptions IPR fast-track self-certification",
     "deadline": "Rolling", "link": "startupindia.gov.in/recognition",
     "description": "Recognition as startup provides income tax exemption angel tax exemption and easier compliance"},
    {"id": "scheme-007", "name": "Atal Innovation Mission", "provider": "NITI Aayog",
     "amount": "10 Lakhs", "type": "startup", "eligibility": "Innovative startups and entrepreneurs",
     "benefit": "Grant funding and mentorship",
     "deadline": "Ongoing", "link": "aim.gov.in",
     "description": "Support for innovation and entrepreneurship through Atal Incubation Centers and challenge grants"},
    {"id": "scheme-008", "name": "Credit Guarantee Fund Trust for Startups", "provider": "DPIIT SIDBI",
     "amount": "5 Crore", "type": "startup", "eligibility": "DPIIT recognized startups",
     "benefit": "Collateral-free loans with credit guarantee",
     "deadline": "Ongoing", "link": "ncgtc.in",
     "description": "Provides credit guarantee for loans to startups without requiring collateral"},
    {"id": "scheme-009", "name": "Make in India Initiative IT Sector", "provider": "DPIIT",
     "amount": "Priority procurement", "type": "national", "eligibility": "Domestically manufactured IT products",
     "benefit": "25 percent purchase preference in government tenders",
     "deadline": "Ongoing", "link": "makeinindia.com",
     "description": "Preference given to locally manufactured electronic goods and software in government procurement"},
    {"id": "scheme-010", "name": "Pradhan Mantri Mudra Yojana", "provider": "MUDRA Bank",
     "amount": "10 Lakhs", "type": "msme", "eligibility": "Small business enterprises",
     "benefit": "Collateral-free business loans",
     "deadline": "Ongoing", "link": "mudra.org.in",
     "description": "Provides microfinance loans to non-corporate non-farm small micro enterprises"},
    {"id": "scheme-011", "name": "PLI Scheme IT Hardware", "provider": "MeitY",
     "amount": "4 to 6 percent incentive", "type": "national", "eligibility": "Electronics manufacturers",
     "benefit": "Sales-linked incentive for 5 years",
     "deadline": "Closed for new applications", "link": "meity.gov.in/pli",
     "description": "Production linked incentives for manufacturing laptops tablets servers in India"},
    {"id": "scheme-012", "name": "National SC-ST Hub", "provider": "MSME Ministry",
     "amount": "Various grants", "type": "msme", "eligibility": "SC ST entrepreneurs",
     "benefit": "Business support and government procurement preference",
     "deadline": "Ongoing", "link": "nsshhub.org",
     "description": "Special support for SC ST entrepreneurs including preference in government procurement"},
    {"id": "scheme-013", "name": "IndiaAI Mission Startup Fund", "provider": "MeitY IndiaAI",
     "amount": "2 Crore", "type": "startup", "eligibility": "AI ML startups",
     "benefit": "Compute credits and funding for AI development",
     "deadline": "2025 cohort open", "link": "indiaai.gov.in",
     "description": "Support for Indian AI startups with compute credits mentorship and deployment opportunities"},
    {"id": "scheme-014", "name": "SIDBI Startup Assistance Scheme", "provider": "SIDBI",
     "amount": "10 Lakhs to 5 Crore", "type": "startup", "eligibility": "Growth-stage startups",
     "benefit": "Debt and quasi-equity financing",
     "deadline": "Ongoing", "link": "sidbi.in/startup",
     "description": "Financial assistance to startups in growth stage through debt and quasi-equity instruments"},
    {"id": "scheme-015", "name": "GeM Startup Runway Program", "provider": "GeM",
     "amount": "Priority access to 50000 Cr market", "type": "startup", "eligibility": "DPIIT recognized startups",
     "benefit": "Relaxed criteria for government procurement",
     "deadline": "Ongoing", "link": "gem.gov.in/startup",
     "description": "Startups can sell to government without meeting regular turnover experience criteria on GeM"},
    {"id": "scheme-016", "name": "MSME Cluster Development Programme", "provider": "MSME Ministry",
     "amount": "15 Crore per cluster", "type": "msme", "eligibility": "Cluster of MSMEs",
     "benefit": "Common facility center and infrastructure",
     "deadline": "Ongoing", "link": "msme.gov.in/cdp",
     "description": "Development of common facility centers for MSME clusters to improve productivity"},
    {"id": "scheme-017", "name": "National Cyber Security Startup Hub", "provider": "CERT-In",
     "amount": "Incubation support", "type": "startup", "eligibility": "Cybersecurity startups",
     "benefit": "Technical support and government client access",
     "deadline": "Ongoing", "link": "ncss.cert-in.org.in",
     "description": "Platform for cybersecurity startups to develop and deploy solutions for government agencies"},
    {"id": "scheme-018", "name": "Research to Market Program", "provider": "DST",
     "amount": "25 Lakhs", "type": "startup", "eligibility": "Tech startups with R&D products",
     "benefit": "Commercialization support for research products",
     "deadline": "Annual calls", "link": "dst.gov.in",
     "description": "Supports startups in converting research outcomes into market-ready products"},
    {"id": "scheme-019", "name": "Export Promotion Capital Goods Scheme", "provider": "DGFT",
     "amount": "Zero import duty", "type": "national", "eligibility": "Export-oriented units",
     "benefit": "Duty-free import of capital goods",
     "deadline": "Ongoing", "link": "dgft.gov.in",
     "description": "Allows import of capital goods at zero customs duty for export production units"},
    {"id": "scheme-020", "name": "Venture Capital Assistance Scheme", "provider": "SFAC",
     "amount": "50 Lakhs", "type": "startup", "eligibility": "Agri-startups and FPOs",
     "benefit": "Venture capital for agri-business",
     "deadline": "Ongoing", "link": "sfacindia.com",
     "description": "Venture capital assistance for setting up agri-business and food processing ventures"},
]


def get_chroma_client(persist_dir: str = "./chroma_data"):
    global _chroma_client
    if _chroma_client is None and CHROMA_AVAILABLE:
        try:
            Path(persist_dir).mkdir(parents=True, exist_ok=True)
            _chroma_client = chromadb.PersistentClient(path=persist_dir)
            logger.info(f"ChromaDB initialized at {persist_dir}")
        except Exception as e:
            logger.error(f"ChromaDB init failed: {e}")
    return _chroma_client


def initialize_scheme_data(chroma_client):
    try:
        collection = chroma_client.get_or_create_collection("scheme_docs")
        if collection.count() >= len(SCHEME_DATA):
            return collection
        ids = [s["id"] for s in SCHEME_DATA]
        texts = [f"{s['name']} {s['description']} {s['eligibility']} {s['type']} {s['benefit']}" for s in SCHEME_DATA]
        metadatas = [{k: str(v) for k, v in s.items() if k != "id"} for s in SCHEME_DATA]
        collection.upsert(ids=ids, documents=texts, metadatas=metadatas)
        logger.info(f"Loaded {len(SCHEME_DATA)} schemes into ChromaDB")
        return collection
    except Exception as e:
        logger.error(f"Scheme data init failed: {e}")
        return None


def add_tender_doc(chroma_client, doc_id: str, text: str, metadata: dict):
    try:
        collection = chroma_client.get_or_create_collection("tender_docs")
        collection.upsert(ids=[doc_id], documents=[text[:5000]],
                          metadatas=[{k: str(v) for k, v in metadata.items()}])
    except Exception as e:
        logger.error(f"Add tender doc failed: {e}")


def semantic_search(chroma_client, query: str, collection_name: str, n_results: int = 5) -> List[Dict[str, Any]]:
    if not chroma_client:
        return []
    try:
        collection = chroma_client.get_or_create_collection(collection_name)
        count = collection.count()
        if count == 0:
            return []
        results = collection.query(query_texts=[query], n_results=min(n_results, count))
        output = []
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]
        for i, (doc, meta, dist) in enumerate(zip(docs, metas, dists)):
            output.append({"text": doc, "metadata": meta, "similarity": 1 - dist, "rank": i + 1})
        return output
    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        return []


def find_similar_tenders(chroma_client, tender_text: str, n: int = 5) -> List[Dict[str, Any]]:
    return semantic_search(chroma_client, tender_text[:1000], "tender_docs", n)


def get_relevant_schemes(chroma_client, company_profile: dict, n: int = 8) -> List[Dict[str, Any]]:
    if not chroma_client:
        return SCHEME_DATA[:n]
    query = f"{company_profile.get('company_type', 'startup')} {company_profile.get('industry', 'IT')} software technology"
    try:
        collection = chroma_client.get_or_create_collection("scheme_docs")
        if collection.count() == 0:
            initialize_scheme_data(chroma_client)
        results = semantic_search(chroma_client, query, "scheme_docs", n)
        if not results:
            return SCHEME_DATA[:n]
        schemes = []
        for r in results:
            meta = dict(r.get("metadata", {}))
            meta["match_score"] = round(r.get("similarity", 0.7) * 100, 1)
            schemes.append(meta)
        return schemes
    except Exception as e:
        logger.error(f"Scheme retrieval failed: {e}")
        return SCHEME_DATA[:n]


def chat_retrieve(chroma_client, query: str, n: int = 3) -> str:
    contexts = []
    scheme_results = semantic_search(chroma_client, query, "scheme_docs", n)
    for r in scheme_results:
        meta = r.get("metadata", {})
        contexts.append(f"SCHEME: {meta.get('name', '')} - {meta.get('benefit', '')} (Provider: {meta.get('provider', '')})")
    tender_results = semantic_search(chroma_client, query, "tender_docs", n)
    for r in tender_results:
        contexts.append(f"TENDER INFO: {r.get('text', '')[:300]}")
    return "\n".join(contexts) if contexts else "No specific context found. Answering from general knowledge."


def get_scheme_by_id_mock(scheme_id: str) -> Optional[Dict[str, Any]]:
    for s in SCHEME_DATA:
        if s.get("id") == scheme_id:
            return s.copy()
    return None
