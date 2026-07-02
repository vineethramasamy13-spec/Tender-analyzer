from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from config import settings
from database import mongodb
from loguru import logger
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from tasks.alerts import send_deadline_alerts
from tasks.digest import send_weekly_digest
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routers import (
    auth,
    analysis,
    tenders,
    profiles,
    chat,
    reports,
    workspace,
    schemes,
    analytics,
    consortium
)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Background Tasks Scheduler
scheduler = AsyncIOScheduler()
scheduler.add_job(send_deadline_alerts, "cron", hour=8, minute=0)
scheduler.add_job(send_weekly_digest, "cron", day_of_week="mon", hour=9, minute=0)

# Periodic cache flush (every 30 seconds) for debounced in-memory writes
from database.mongodb import flush_cache_if_dirty
scheduler.add_job(flush_cache_if_dirty, "interval", seconds=30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager: startup before yield, shutdown after."""
    # ── STARTUP ──────────────────────────────────────────────────────────
    logger.info("Starting up TenderAI API...")

    # 1. Connect to MongoDB
    await mongodb.connect_to_mongodb(settings.MONGODB_URI, settings.MONGODB_DB_NAME)

    # 2. Setup directories
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)

    # 3. Start Scheduler (single import of update_live_tenders)
    try:
        from tasks.tender_updater import update_live_tenders
        scheduler.add_job(update_live_tenders, "interval", minutes=2)
        scheduler.start()
        logger.info("⏰ Background tasks scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")

    # 4. Run initial live tenders update in the background
    try:
        import asyncio
        asyncio.create_task(update_live_tenders())
        logger.info("🚀 Background initial live tenders update queued on startup")
    except Exception as e:
        logger.error(f"Failed to run initial live tenders update: {e}")

    # 5. Pre-warm Groq LLM
    from config import get_groq_client
    groq_client = get_groq_client()
    if groq_client:
        try:
            import anyio
            def _warm():
                groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": "hi"}],
                    max_tokens=1
                )
            await anyio.to_thread.run_sync(_warm)
            logger.info("Groq pre-warmed successfully")
        except Exception as exc:
            logger.warning(f"Groq pre-warm failed: {exc}")

    yield  # ── Application runs here ────────────────────────────────────

    # ── SHUTDOWN ─────────────────────────────────────────────────────────
    logger.info("Shutting down TenderAI API...")
    # Flush in-memory cache before exit
    try:
        from database.mongodb import _save_cache
        _save_cache()
    except Exception:
        pass
    await mongodb.close_mongodb()
    scheduler.shutdown()


app = FastAPI(
    title="TenderAI API",
    version="1.0.0",
    description="AI-Powered Tender Analyzer Platform Backend",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware config
allow_origins = [settings.FRONTEND_URL]
if "http://localhost:3000" not in allow_origins:
    allow_origins.append("http://localhost:3000")
if "http://127.0.0.1:3000" not in allow_origins:
    allow_origins.append("http://127.0.0.1:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
async def health_check():
    """Service health state endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(analysis.router, prefix="/api", tags=["analysis"])
app.include_router(tenders.router, prefix="/api", tags=["tenders"])
app.include_router(profiles.router, prefix="/api", tags=["profiles"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(reports.router, prefix="/api", tags=["reports"])
app.include_router(workspace.router, prefix="/api", tags=["workspace"])
app.include_router(schemes.router, prefix="/api", tags=["schemes"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])
app.include_router(consortium.router, prefix="/api", tags=["consortium"])
