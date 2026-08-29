import os
import sys
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from dotenv import load_dotenv

# Fix Windows cp1252 encoding for print statements
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Load keys directly from your existing .env file
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env", override=True)

app = FastAPI(title="Farmer Market Backend API")

# ISRO Bhoonidhi API base URLs (from official API spec)
BHOONIDHI_AUTH_URL = "https://bhoonidhi-api.nrsc.gov.in/auth/token"
BHOONIDHI_SEARCH_URL = "https://bhoonidhi-api.nrsc.gov.in/data/search"

# 1. Establish PostgreSQL Connection Pool (Aiven) -- optional
pg_conn = None
try:
    import psycopg2
    pg_conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    print("[OK] Connected to Aiven Postgres Warehouse Engine")
except Exception as e:
    print(f"[WARN] Postgres Connection Failure: {e}")
    pg_conn = None

# 2. Establish Redis Connection (Upstash / TCP) -- optional
redis_client = None
try:
    import redis
    redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)
    redis_client.ping()
    print("[OK] Connected to Production Redis Cache Socket")
except Exception as e:
    print(f"[WARN] Redis Connection Failure: {e}")
    redis_client = None


# Define the data validation structure for incoming coordinates
class CoordinateInput(BaseModel):
    longitude: float
    latitude: float


BHOONIDHI_TOKEN_KEY = "bhoonidhi:access_token"
BHOONIDHI_REFRESH_KEY = "bhoonidhi:refresh_token"
BHOONIDHI_USER_KEY = "bhoonidhi:user_id"

# In-memory token cache (fallback when Redis is read-only)
_mem_cache = {"token": None, "expires_at": 0.0}


def _read_cache():
    """Try Redis first, then in-memory cache."""
    if redis_client:
        try:
            t = redis_client.get(BHOONIDHI_TOKEN_KEY)
            if t:
                ttl = redis_client.ttl(BHOONIDHI_TOKEN_KEY)
                print(f"[OK] Bhoonidhi token loaded from Redis (TTL: {ttl}s)")
                return t
        except Exception as e:
            print(f"[WARN] Redis read failed: {e}")
    # In-memory fallback
    if _mem_cache["token"] and datetime.now().timestamp() < _mem_cache["expires_at"]:
        remaining = int(_mem_cache["expires_at"] - datetime.now().timestamp())
        print(f"[OK] Bhoonidhi token loaded from memory cache (TTL: {remaining}s)")
        return _mem_cache["token"]
    return None


def _write_cache(access_token, refresh_token, expires_in):
    """Try Redis first, then in-memory cache."""
    safe_ttl = max(expires_in - 60, 60)
    wrote = False
    if redis_client:
        try:
            redis_client.setex(BHOONIDHI_TOKEN_KEY, safe_ttl, access_token)
            if refresh_token:
                redis_client.setex(BHOONIDHI_REFRESH_KEY, safe_ttl * 3, refresh_token)
            print(f"[OK] Bhoonidhi token cached in Redis (TTL: {safe_ttl}s)")
            wrote = True
        except Exception as e:
            print(f"[WARN] Redis write failed ({e}), using memory cache")
    if not wrote:
        _mem_cache["token"] = access_token
        _mem_cache["expires_at"] = datetime.now().timestamp() + safe_ttl
        print(f"[OK] Bhoonidhi token cached in memory (TTL: {safe_ttl}s)")


def get_bhoonidhi_token():
    """Get a Bhoonidhi access token, using Redis/memory cache when available."""
    # 1. Check cache first
    cached = _read_cache()
    if cached:
        return cached

    # 2. Cache miss -- authenticate fresh
    user_id = os.getenv("ISRO_BHOONIDHI_USER_ID")
    password = os.getenv("ISRO_BHOONIDHI_PASSWORD")

    if not user_id or not password:
        raise ValueError("ISRO_BHOONIDHI_USER_ID and ISRO_BHOONIDHI_PASSWORD must be set in .env")

    auth_payload = {
        "userId": user_id,
        "password": password,
        "grant_type": "password",
    }

    auth_res = requests.post(BHOONIDHI_AUTH_URL, json=auth_payload, timeout=10)
    auth_res.raise_for_status()
    auth_data = auth_res.json()

    access_token = auth_data.get("access_token")
    refresh_token = auth_data.get("refresh_token")
    expires_in = auth_data.get("expires_in", 1200)  # default 20 min

    if not access_token:
        raise ValueError(f"Auth response missing access_token: {auth_data}")

    # 3. Store in cache
    _write_cache(access_token, refresh_token, expires_in)

    return access_token


def search_bhoonidhi_catalog(token, longitude, latitude, offset=0.1):
    """Search Bhoonidhi STAC catalogue for satellite scenes near the given coordinates."""
    bbox = [
        longitude - offset,
        latitude - offset,
        longitude + offset,
        latitude + offset,
    ]

    # Search across agricultural remote sensing collections
    # ResourceSat-2 AWIFS/LISS3 for NDVI, EOS-06 OCM for ocean/land color
    search_payload = {
        "collections": [
            "ResourceSat-2_AWIFS_L2",
            "ResourceSat-2_AWIFS_BOA",
            "ResourceSat-2_LISS3_L2",
        ],
        "bbox": bbox,
        "limit": 20,
    }

    headers = {"Authorization": f"Bearer {token}"}

    catalog_res = requests.post(BHOONIDHI_SEARCH_URL, json=search_payload, headers=headers, timeout=15)
    catalog_res.raise_for_status()
    result = catalog_res.json()

    features = result.get("features", [])
    total = result.get("context", {}).get("returned", len(features))
    print(f"[OK] Bhoonidhi returned {total} scenes for bbox around ({longitude}, {latitude})")

    return features


@app.post("/api/satellite/search")
def search_satellite_data(coords: CoordinateInput):
    try:
        print(f"[INFO] Searching satellite data for ({coords.latitude}, {coords.longitude})...")

        try:
            # Step 1: Authenticate with Bhoonidhi
            token = get_bhoonidhi_token()

            # Step 2: Search the STAC catalogue
            features = search_bhoonidhi_catalog(token, coords.longitude, coords.latitude)
            data_source = "live_isro_bhoonidhi"

        except Exception as api_err:
            # SAFE FALLBACK: If Bhoonidhi is unreachable, generate mock metadata
            print(f"[WARN] Bhoonidhi API error ({api_err}). Falling back to mock data...")
            data_source = "mock_satellite_engine"
            features = [
                {
                    "id": "MOCK_RESOURCESAT_2_AWIFS_2026",
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [coords.longitude - 0.05, coords.latitude - 0.05],
                                [coords.longitude + 0.05, coords.latitude - 0.05],
                                [coords.longitude + 0.05, coords.latitude + 0.05],
                                [coords.longitude - 0.05, coords.latitude + 0.05],
                                [coords.longitude - 0.05, coords.latitude - 0.05],
                            ]
                        ],
                    },
                    "properties": {
                        "datetime": datetime.now().isoformat(),
                        "eo:cloud_cover": 2.5,
                        "satellite": "RESOURCESAT-2 (Simulated)",
                        "sensor": "AWIFS",
                        "crop_health_index_ndvi": 0.72,
                    },
                    "assets": {
                        "thumbnail": {
                            "href": "https://unsplash.com"
                        }
                    },
                }
            ]

        # Log the request into Aiven PostGIS data warehouse (optional)
        if pg_conn:
            try:
                with pg_conn.cursor() as cursor:
                    log_query = """
                        INSERT INTO vehicle_tracking (time, vehicle_id, temperature, location)
                        VALUES (%s, 'SATELLITE_QUERY_SYSTEM', NULL, ST_SetSRID(ST_MakePoint(%s, %s), 4326));
                    """
                    cursor.execute(log_query, (datetime.now(), coords.longitude, coords.latitude))
                    pg_conn.commit()
                    print("[OK] Query geometry saved to Aiven PostGIS warehouse.")
            except Exception as db_err:
                print(f"[WARN] Failed to log to PostGIS: {db_err}")
        else:
            print("[INFO] PostGIS unavailable -- skipping query log.")

        return {
            "success": True,
            "source": data_source,
            "coordinates": {"longitude": coords.longitude, "latitude": coords.latitude},
            "scenes_found": len(features),
            "features": features,
        }

    except Exception as err:
        print(f"[ERROR] Server internal crash: {err}")
        raise HTTPException(status_code=500, detail=str(err))
