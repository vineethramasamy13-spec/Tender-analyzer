import os
from datetime import datetime
from database import mongodb
from loguru import logger

def parse_date(date_str: str) -> datetime:
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        return datetime.utcnow()

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

async def send_email(to: str, subject: str, html: str, smtp_config: dict = None, attachments: list = None):
    """Sends a real email using SMTP configuration from settings or user credentials."""
    if to.endswith("@example.com") or to.startswith("stress_"):
        logger.info(f"📬 Bypassing real SMTP dispatch for stress test email: {to}")
        return True
        
    from config import settings
    
    host = settings.SMTP_HOST
    port = settings.SMTP_PORT
    username = settings.SMTP_USERNAME
    password = settings.SMTP_PASSWORD
    sender = settings.SMTP_SENDER or username
    
    if smtp_config:
        host = smtp_config.get("smtp_host") or host
        port = smtp_config.get("smtp_port") or port
        username = smtp_config.get("smtp_username") or username
        password = smtp_config.get("smtp_password") or password
        sender = smtp_config.get("smtp_sender") or sender
        
    if not host or not username or not password:
        logger.warning(f"📬 SMTP credentials not configured. Falling back to Simulated Email.\n"
                       f"To: {to}\nSubject: {subject}\nContent: {html[:150]}...")
        return False
        
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to
        
        part = MIMEText(html, "html")
        msg.attach(part)
        
        if attachments:
            from email.mime.application import MIMEApplication
            for filepath in attachments:
                if os.path.exists(filepath):
                    with open(filepath, "rb") as f:
                        attach_part = MIMEApplication(f.read(), Name=os.path.basename(filepath))
                    attach_part['Content-Disposition'] = f'attachment; filename="{os.path.basename(filepath)}"'
                    msg.attach(attach_part)
        
        # Connect to SMTP server
        if int(port) == 465:
            server = smtplib.SMTP_SSL(host, int(port), timeout=10)
        else:
            server = smtplib.SMTP(host, int(port), timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()
            
        server.login(username, password)
        server.send_message(msg)
        server.quit()
        logger.info(f"📬 Email successfully sent to {to}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send SMTP email: {e}")
        
        # ── DEMO/MOCK FALLBACK ──
        # If Google blocks the email due to quotas, automatically pop it open in the browser!
        try:
            import tempfile
            import webbrowser
            import uuid
            
            temp_dir = tempfile.gettempdir()
            fallback_html_path = os.path.join(temp_dir, f"tenderai_mock_email_{uuid.uuid4().hex[:6]}.html")
            
            # Inject a banner indicating it's a mock email
            mock_banner = f"""
            <div style="background-color: #fef08a; color: #854d0e; padding: 10px; text-align: center; font-weight: bold; border-radius: 8px; margin-bottom: 20px;">
                ⚠️ SMTP Email Quota Exceeded.<br/>
                This is a local simulation of the email that was queued for: {to}
            </div>
            """
            mock_html = html.replace("<body>", f"<body>\n{mock_banner}") if "<body>" in html else mock_banner + html
            
            with open(fallback_html_path, "w", encoding="utf-8") as f:
                f.write(mock_html)
                
            webbrowser.open(f"file:///{fallback_html_path}")
            logger.info(f"📬 Opened Mock Email in browser as fallback: {fallback_html_path}")
        except Exception as mock_e:
            logger.error(f"Failed to open mock email: {mock_e}")
            
        return False

def render_deadline_alert_template(tender: dict, days_left: int) -> str:
    return f"""
    <html>
        <body>
            <h2>⚠️ Tender Deadline Alert</h2>
            <p>The deadline for the tender <strong>{tender.get('title', 'Tender')}</strong> is in <strong>{days_left} days</strong>.</p>
            <p>Reference number: {tender.get('reference_number', 'N/A')}</p>
            <p>Budget: ₹ {tender.get('budget', 0.0):,.2f}</p>
        </body>
    </html>
    """

async def send_deadline_alerts():
    """Scan watchlist and send emails for upcoming deadlines."""
    logger.info("⏳ Running deadline alert scanner...")
    try:
        watchlist = await mongodb.get_all_watchlist_items()
        
        for item in watchlist:
            tender = await mongodb.get_tender(item["tender_id"])
            if not tender or not tender.get("deadline"):
                continue
            
            deadline = parse_date(tender["deadline"])
            days_left = (deadline - datetime.utcnow()).days
            
            if days_left == item.get("notify_days_before", 7):
                user = await mongodb.get_user_by_id(item["user_id"])
                if user and user.get("email"):
                    await send_email(
                        to=user["email"],
                        subject=f"⚠️ Tender deadline in {days_left} days: {tender['title']}",
                        html=render_deadline_alert_template(tender, days_left)
                    )
        logger.info("✅ Deadline alert scan complete.")
    except Exception as e:
        logger.error(f"Failed to scan deadline alerts: {e}")

async def send_scheme_reminder(user_id: str, scheme: dict):
    """Callback for specific scheme reminders."""
    try:
        user = await mongodb.get_user_by_id(user_id)
        if user and user.get("email"):
            await send_email(
                to=user["email"],
                subject=f"🏛️ Scheme Subscription Reminder: {scheme.get('name')}",
                html=f"<html><body><h2>Reminder</h2><p>The deadline for scheme {scheme.get('name')} is {scheme.get('deadline')}.</p></body></html>"
            )
    except Exception as e:
        logger.error(f"Failed to send scheme reminder: {e}")
