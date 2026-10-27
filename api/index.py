import os
import sys
from fastapi import Request
from fastapi.responses import JSONResponse

# Ensure backend directory is in Python path for all engine & router imports
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app

@app.middleware("http")
async def normalize_api_path(request: Request, call_next):
    path = request.scope.get("path", "")
    
    # 1. Handle Vercel stripping /api (e.g. /v5/... -> /api/v5/...)
    if path.startswith("/v5/"):
        request.scope["path"] = "/api" + path
    # 2. Handle Vercel passing rewritten destination literally /api/index.py
    elif path in ("/api/index.py", "/api", "/api/"):
        matched = request.headers.get("x-matched-path") or request.headers.get("x-forwarded-uri")
        if matched:
            # strip query if any
            matched = matched.split("?")[0]
            if matched.startswith("/api/v5/"):
                request.scope["path"] = matched
            elif matched.startswith("/v5/"):
                request.scope["path"] = "/api" + matched
            elif matched in ("/api", "/api/"):
                request.scope["path"] = "/api/v5/health"
    elif path == "/" or path == "":
        request.scope["path"] = "/api/v5/health"
    elif path == "/health":
        request.scope["path"] = "/api/v5/health"
        
    return await call_next(request)

@app.get("/api/v5/health", tags=["Health"])
@app.get("/v5/health", tags=["Health"])
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "Annapurna FreshGuard API",
        "version": "5.0.0",
        "environment": "production (Vercel Serverless)"
    }

@app.get("/api/v5/debug")
@app.get("/v5/debug")
@app.get("/debug")
async def debug_endpoint(request: Request):
    return {
        "scope_path": request.scope.get("path"),
        "raw_path": str(request.scope.get("raw_path")),
        "headers": dict(request.headers),
        "query_params": dict(request.query_params)
    }
