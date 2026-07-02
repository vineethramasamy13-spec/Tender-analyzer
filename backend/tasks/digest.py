from datetime import datetime
from database import mongodb
from loguru import logger
from tasks.alerts import send_email

async def send_weekly_digest():
    """Weekly digest task of matching tenders and upcoming deadlines."""
    logger.info("⏳ Generating weekly digests...")
    try:
        users = await mongodb.get_all_active_users()
        
        for user in users:
            # Fetch recent completed analyses
            analyses = await mongodb.find_many("analyses", {"user_id": user["user_id"]}, limit=5)
            
            # Fetch watchlist items
            watchlist = await mongodb.get_watchlist_by_user(user["user_id"])
            upcoming = [w for w in watchlist if w.get("days_to_deadline", 30) <= 14]
            
            if not analyses and not upcoming:
                continue
                
            # Render digest html
            html = f"""
            <html>
                <body>
                    <h2>📋 Your Weekly Tender Analyzer Digest</h2>
                    <p>Hello {user.get('name', 'User')}, here is your weekly summary:</p>
                    
                    <h3>🕒 Recent Analyses</h3>
                    <ul>
            """
            for a in analyses[:3]:
                res = a.get("result") or {}
                elig = res.get("eligibility_result") or {}
                html += f"<li>{a.get('tender_title')} — Eligibility: {float(elig.get('overall_score', 0.0))*100:.0f}%</li>"
                
            html += """
                    </ul>
                    <h3>⚠️ Watchlist Alerts</h3>
                    <ul>
            """
            for w in upcoming:
                html += f"<li>{w.get('title')} — Deadline: {w.get('deadline')} ({w.get('days_to_deadline')} days left)</li>"
                
            html += """
                    </ul>
                    <p>Good luck with your bids!</p>
                </body>
            </html>
            """
            
            await send_email(
                to=user["email"],
                subject="📋 Your Weekly Tender Digest",
                html=html
            )
        logger.info("✅ Weekly digests complete.")
    except Exception as e:
        logger.error(f"Failed to generate weekly digests: {e}")
