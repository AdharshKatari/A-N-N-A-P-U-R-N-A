import os
import sys

# Ensure backend directory is in Python path for all engine & router imports
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app as fapp

class AsgiPathNormalizer:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            headers = dict(scope.get("headers", []))
            matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
            
            # Normalize path for FastAPI route matching
            if path.startswith("/v5/"):
                scope["path"] = "/api" + path
            elif path.startswith("/api/v5/"):
                pass
            elif matched_path and matched_path.startswith("/api/v5/"):
                scope["path"] = matched_path
            elif matched_path and matched_path.startswith("/v5/"):
                scope["path"] = "/api" + matched_path
            elif path in ("/health", "/api/health") or matched_path in ("/health", "/api/health"):
                scope["path"] = "/api/v5/health"
            elif path in ("/", "", "/api", "/api/", "/api/index.py"):
                scope["path"] = "/api/v5/health"

        await self.app(scope, receive, send)

app = AsgiPathNormalizer(fapp)
