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
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
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
from routers.logistics_routes import router as logistics_router
from routers.metadata import router as metadata_router
from routers.notifications import router as notifications_router
from routers.scans import router as scans_router
from routers.voice import router as voice_router
try:
    from routers.mandi_compare import router as mandi_compare_router
except ModuleNotFoundError as exc:
    if exc.name != "routers.mandi_compare":
        raise
    mandi_compare_router = None
    logging.getLogger(__name__).warning(
        "Market comparison router is missing; the client will use its local fallback."
    )
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
app.include_router(logistics_router)
app.include_router(metadata_router)
app.include_router(notifications_router)
app.include_router(scans_router)
app.include_router(voice_router)
if mandi_compare_router is not None:
    app.include_router(mandi_compare_router)
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


# ====================================================================================
# STATIC ASSETS & WEB APP SPA SERVING (OPTION 1 & 2)
# ====================================================================================

dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'mobile', 'dist'))

if os.path.exists(dist_dir):
    expo_dir = os.path.join(dist_dir, '_expo')
    if os.path.exists(expo_dir):
        app.mount('/_expo', StaticFiles(directory=expo_dir), name='expo-static')

    assets_dir = os.path.join(dist_dir, 'assets')
    if os.path.exists(assets_dir):
        app.mount('/assets', StaticFiles(directory=assets_dir), name='app-assets')

    icons_dir = os.path.join(dist_dir, 'icons')
    if os.path.exists(icons_dir):
        app.mount('/icons', StaticFiles(directory=icons_dir), name='app-icons')

    @app.get('/manifest.json', include_in_schema=False)
    async def get_manifest():
        manifest_path = os.path.join(dist_dir, 'manifest.json')
        if os.path.exists(manifest_path):
            return FileResponse(manifest_path, media_type='application/manifest+json')
        return JSONResponse(status_code=404, content={'detail': 'manifest.json not found'})

    @app.get('/sw.js', include_in_schema=False)
    async def get_service_worker():
        sw_path = os.path.join(dist_dir, 'sw.js')
        if os.path.exists(sw_path):
            return FileResponse(
                sw_path,
                media_type='application/javascript',
                headers={'Service-Worker-Allowed': '/'}
            )
        return JSONResponse(status_code=404, content={'detail': 'sw.js not found'})

    @app.get('/{full_path:path}', include_in_schema=False)
    async def serve_web_spa(request: Request, full_path: str):
        # Do not intercept API, docs, or schema endpoints
        if full_path.startswith('api/') or full_path in ('docs', 'redoc', 'openapi.json'):
            return JSONResponse(status_code=404, content={'detail': 'Not Found'})
        
        target_file = os.path.join(dist_dir, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
        
        index_file = os.path.join(dist_dir, 'index.html')
        if os.path.exists(index_file):
            return FileResponse(index_file)
        
        return JSONResponse(status_code=404, content={'detail': 'Web build not found'})
