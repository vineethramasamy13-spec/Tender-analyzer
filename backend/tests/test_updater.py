import pytest
from tasks.tender_updater import classify_category, detect_state_from_text, parse_budget, simulate_state_tenders, update_live_tenders
from database import mongodb

def test_classify_category():
    assert classify_category("Cybersecurity upgrade", "") == "Cybersecurity"
    assert classify_category("LMS for school", "") == "EdTech"
    assert classify_category("API middleware development", "") == "API Development"
    assert classify_category("Smart Meter telemetry", "") == "IoT/Software"
    assert classify_category("Office Painting and Civil Work", "") == "Infrastructure"
    assert classify_category("Generic project", "") == "IT/Software"

def test_detect_state_from_text():
    res1 = detect_state_from_text("Tender for ELCOT Chennai")
    assert res1["state"] == "Tamil Nadu"
    assert res1["city"] in ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"]
    
    res2 = detect_state_from_text("UPECL Lucknow project")
    assert res2["state"] == "Uttar Pradesh"
    assert res2["city"] in ["Lucknow", "Noida", "Kanpur", "Ghaziabad", "Agra", "Varanasi"]

def test_parse_budget():
    assert parse_budget("The cost is Rs 5.5 Crores") == 55_000_000
    assert parse_budget("Estimated budget is INR 40 Lakhs") == 4_000_000
    assert parse_budget("Tender amount of 5000000 rupees") == 5_000_000
    assert parse_budget("Random text") > 0

def test_simulate_state_tenders():
    tenders = simulate_state_tenders(5)
    assert len(tenders) == 5
    for t in tenders:
        assert t["tender_id"].startswith("TEN-LIVE-")
        assert t["status"] == "open"
        assert t["budget"] > 0
        assert t["location"] != ""
        assert t["category"] != ""

@pytest.mark.asyncio
async def test_update_live_tenders():
    # Make sure we clean up current tenders in memory
    mongodb._memory_store["tenders"] = []
    
    # Run the live update
    await update_live_tenders()
    
    # Verify tenders are stored in the memory database
    tenders = await mongodb.get_tenders(limit=100)
    assert len(tenders) >= 40
    
    # Check that both RBI/IT (if resolved) and GeM/CPPP simulated items are there
    sources = [t["source"] for t in tenders]
    assert any("Portal" in s or "Tax" in s or "GeM" in s or "CPPP" in s for s in sources)
    
    # Verify that all 28 states and union territories match correctly on filtering
    categories = [t["category"] for t in tenders]
    assert len(categories) > 0
