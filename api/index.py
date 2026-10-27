import os
import sys
import json
import urllib.parse

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
            query_str = scope.get("query_string", b"").decode("utf-8")
            params = urllib.parse.parse_qs(query_str)
            
            # 1. Debug inspection hook
            if "__debug" in params or "debug-scope" in query_str:
                headers_list = {k.decode("latin1", "ignore"): v.decode("latin1", "ignore") for k, v in scope.get("headers", [])}
                payload = json.dumps({
                    "scope_path": scope.get("path"),
                    "query_string": query_str,
                    "params": params,
                    "headers": headers_list
                }, indent=2).encode("utf-8")
                await send({"type": "http.response.start", "status": 200, "headers": [(b"content-type", b"application/json")]})
                await send({"type": "http.response.body", "body": payload})
                return

            # 2. Extract path from __path parameter forwarded by Vercel rewrite
            if "__path" in params and params["__path"]:
                raw_target = params["__path"][0]
                if not raw_target.startswith("/"):
                    raw_target = "/" + raw_target
                    
                if raw_target.startswith("/v5/"):
                    target_path = "/api" + raw_target
                elif raw_target.startswith("/api/v5/"):
                    target_path = raw_target
                elif raw_target in ("/health", "/api/health"):
                    target_path = "/api/v5/health"
                elif raw_target in ("/faq", "/crops", "/crops/metadata", "/metadata/crops"):
                    target_path = "/api/v5" + raw_target
                else:
                    target_path = "/api" + raw_target if not raw_target.startswith("/api") else raw_target
                    
                scope["path"] = target_path
                
                # Remove __path from query string so endpoints receive clean params
                clean_params = {k: v for k, v in params.items() if k != "__path"}
                scope["query_string"] = urllib.parse.urlencode(clean_params, doseq=True).encode("utf-8")
            else:
                curr_path = scope.get("path", "")
                if curr_path.startswith("/v5/"):
                    scope["path"] = "/api" + curr_path
                elif curr_path in ("/", "", "/api", "/api/", "/api/index.py", "/health", "/api/health"):
                    scope["path"] = "/api/v5/health"

        await self.app(scope, receive, send)

app = AsgiPathNormalizer(fapp)
