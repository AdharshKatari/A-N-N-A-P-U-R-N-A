"""
FreshGuard Processing Engine Core — App Shell

This file is the thin entry point that:
  1. Configures FastAPI app, CORS, and lifecycle events
  2. Imports and mounts all routers
  3. Loads environment variables

All business logic lives in:
  - backend/engines/    (vision, ethylene, satellite, logistics)
  - backend/routers/    (batch, harvest, passport, weather, satellite, whatif)
  - backend/models.py   (Pydantic models and helpers)
  - backend/db.py       (database operations)
  - backend/passport.py (QR crypto engine)
"""

import logging
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
    parent_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    if os.path.exists(parent_env):
        load_dotenv(parent_env)
except ImportError:
    pass

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from rate_limit import limiter

import db as database

# Routers
from routers.batches import router as batches_router
from routers.harvest import router as harvest_router
from routers.passport_routes import router as passport_router
from routers.weather import router as weather_router
from routers.satellite_routes import router as satellite_router
from routers.whatif import router as whatif_router
from routers.auth import router as auth_router
from routers.vision_routes import router as vision_router
from routers.metadata import router as metadata_router
from routers.notifications import router as notifications_router
from routers.scans import router as scans_router
from routers.voice import router as voice_router
from sync_gateway import router as sync_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FreshGuardBackendCore")

# ====================================================================================
# RATE LIMITING
# ====================================================================================


# ====================================================================================
# APP CONFIGURATION
# ====================================================================================

app = FastAPI(title="FreshGuard Processing Engine Core", version="5.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount all routers
app.include_router(batches_router)
app.include_router(harvest_router)
app.include_router(passport_router)
app.include_router(weather_router)
app.include_router(satellite_router)
app.include_router(auth_router)
app.include_router(whatif_router)
app.include_router(vision_router)
app.include_router(metadata_router)
app.include_router(notifications_router)
app.include_router(scans_router)
app.include_router(voice_router)
app.include_router(sync_router)

# CORS for mobile client connections.
# In development, allow all origins. In production, restrict to specific origins.
_cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ====================================================================================
# LIFECYCLE: Connect to PostgreSQL on startup
# ====================================================================================

@app.on_event("startup")
async def startup_db_pool():
    """Initialize the PostgreSQL connection pool when the app starts."""
    db_ok = database.db.connect()
    if db_ok:
        logger.info("FreshGuard started with PostgreSQL connection.")
    else:
        logger.warning("FreshGuard started in DEGRADED MODE (no database). Endpoints will return errors.")


@app.on_event("shutdown")
async def shutdown_db_pool():
    """Close the connection pool on shutdown."""
    database.db.close()