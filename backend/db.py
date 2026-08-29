"""
FreshGuard PostgreSQL Connection Pool Module

Provides a managed connection pool using psycopg2 for the crop_batches
and environmental_logs tables. Falls back gracefully when the database
is unreachable (e.g. during local development without Docker).
"""

import os
import logging
import datetime
from contextlib import contextmanager
from typing import Optional, Any, Dict, List

import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool

from config import settings

logger = logging.getLogger("FreshGuardDB")

# Database connection parameters from configuration
# Use DATABASE_URL if available (includes sslmode for Aiven), otherwise fall back to individual params
import urllib.parse

if settings.DATABASE_URL if hasattr(settings, 'DATABASE_URL') else None:
    parsed = urllib.parse.urlparse(settings.DATABASE_URL)
    DB_CONFIG = {
        "dbname": parsed.path[1:] if parsed.path else settings.DB_NAME,
        "user": parsed.username or settings.DB_USER,
        "password": parsed.password or settings.DB_PASSWORD,
        "host": parsed.hostname or settings.DB_HOST,
        "port": parsed.port or settings.DB_PORT,
    }
    # Add SSL mode from query params
    query = urllib.parse.parse_qs(parsed.query)
    if 'sslmode' in query:
        DB_CONFIG['sslmode'] = query['sslmode'][0]
else:
    DB_CONFIG = {
        "dbname": settings.DB_NAME,
        "user": settings.DB_USER,
        "password": settings.DB_PASSWORD,
        "host": settings.DB_HOST,
        "port": settings.DB_PORT,
    }


class DatabasePool:
    """
    Manages a psycopg2 connection pool for FreshGuard.
    All queries route through this class to ensure connection reuse.
    """

    def __init__(self):
        self._pool: Optional[ThreadedConnectionPool] = None
        self._connected = False

    def connect(self) -> bool:
        """
        Initializes the connection pool. Returns True on success.
        Safe to call multiple times — only connects once.
        """
        if self._connected:
            return True

        try:
            self._pool = ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                **DB_CONFIG
            )
            self._connected = True
            logger.info("PostgreSQL connection pool initialized successfully.")
            return True
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed: {e}. Running in degraded mode.")
            self._connected = False
            return False

    @property
    def is_connected(self) -> bool:
        return self._connected and self._pool is not None

    @contextmanager
    def cursor(self, cursor_factory=None):
        """
        Context manager that yields a cursor from the pool.
        Auto-commits on success, rolls back on error.
        """
        if not self.is_connected:
            raise RuntimeError("Database pool not connected.")

        conn = self._pool.getconn()
        try:
            cur = conn.cursor(cursor_factory=cursor_factory)
            yield cur
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()
            self._pool.putconn(conn)

    def close(self):
        if self._pool:
            self._pool.closeall()
            self._connected = False
            logger.info("PostgreSQL connection pool closed.")


# Singleton instance
db = DatabasePool()


# ====================================================================================
# IN-MEMORY FALLBACK STORE
# Used when PostgreSQL is unreachable. Stores data in dicts so all endpoints work
# for local development and demo purposes.
# ====================================================================================

class InMemoryStore:
    """Lightweight in-memory fallback that mirrors the PostgreSQL interface."""

    def __init__(self):
        self.batches: Dict[str, Dict[str, Any]] = {
            "BAT-2026-TOM-01": {
                "batch_id": "BAT-2026-TOM-01",
                "field_id": "Tomato (Hybrid Roma) - East Field",
                "initial_weight_kg": 500.0,
                "harvest_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "initial_visual_score": 88.0,
                "detected_ripeness_stage": "Turning / Light Red",
                "fungal_pathogen_presence": False,
                "macro_satellite_modifier": 1.05,
                "micro_drone_modifier": 1.0,
                "logistics_road_penalty": 1.0,
                "qr_code_secure_token": "QR-TOM-98234-PASSPORT",
                "current_status": "ACTIVE",
            },
            "BAT-2026-ONI-02": {
                "batch_id": "BAT-2026-ONI-02",
                "field_id": "Red Onion - North Field",
                "initial_weight_kg": 1200.0,
                "harvest_timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)).isoformat(),
                "initial_visual_score": 92.0,
                "detected_ripeness_stage": "Harvest Ready / Cured",
                "fungal_pathogen_presence": False,
                "macro_satellite_modifier": 1.02,
                "micro_drone_modifier": 1.0,
                "logistics_road_penalty": 1.0,
                "qr_code_secure_token": "QR-ONI-44182-PASSPORT",
                "current_status": "ACTIVE",
            },
            "BAT-2026-PAD-03": {
                "batch_id": "BAT-2026-PAD-03",
                "field_id": "Paddy (Basmati 1121) - South Plot",
                "initial_weight_kg": 850.0,
                "harvest_timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=4)).isoformat(),
                "initial_visual_score": 81.0,
                "detected_ripeness_stage": "Mature Grain",
                "fungal_pathogen_presence": False,
                "macro_satellite_modifier": 0.98,
                "micro_drone_modifier": 1.0,
                "logistics_road_penalty": 1.0,
                "qr_code_secure_token": "QR-PAD-67812-PASSPORT",
                "current_status": "ACTIVE",
            },
            "BAT-2026-MAN-04": {
                "batch_id": "BAT-2026-MAN-04",
                "field_id": "Alphonso Mango - Orchard Block 2",
                "initial_weight_kg": 400.0,
                "harvest_timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)).isoformat(),
                "initial_visual_score": 94.0,
                "detected_ripeness_stage": "Firm Ripe",
                "fungal_pathogen_presence": False,
                "macro_satellite_modifier": 1.10,
                "micro_drone_modifier": 1.0,
                "logistics_road_penalty": 1.0,
                "qr_code_secure_token": "QR-MAN-11928-PASSPORT",
                "current_status": "SOLD",
            },
        }
        self.logs: Dict[str, list] = {}  # batch_id -> [log_dicts]
        self.facilities: List[Dict[str, Any]] = [
            {
                "facility_id": "FAC-001",
                "facility_name": "Hyderabad Cold Storage Hub",
                "facility_type": "Cold_Storage",
                "guaranteed_floor_price_per_kg": 18.0,
                "longitude": 78.4867,
                "latitude": 17.3850,
                "distance_km": 12.5,
            },
            {
                "facility_id": "FAC-002",
                "facility_name": "Chittoor Processing Plant",
                "facility_type": "Processing_Plant",
                "guaranteed_floor_price_per_kg": 15.0,
                "longitude": 79.1003,
                "latitude": 13.2172,
                "distance_km": 35.0,
            },
            {
                "facility_id": "FAC-003",
                "facility_name": "Madanapalli Agri Processing",
                "facility_type": "Processing_Plant",
                "guaranteed_floor_price_per_kg": 16.5,
                "longitude": 78.5006,
                "latitude": 13.5503,
                "distance_km": 8.0,
            },
        ]
        self.notifications = [
            {
                "id": "notif-1",
                "icon": "star",
                "icon_color": "#F59E0B",
                "icon_bg": "#FEF3C7",
                "title": "Recommendation updated!",
                "description": "Rythu Market is now the best option due to a sudden price increase of +₹50/quintal.",
                "time_label": "20 mins ago",
                "unread": True,
            },
            {
                "id": "notif-2",
                "icon": "warning",
                "icon_color": "#FFA000",
                "icon_bg": "#FFF8E1",
                "title": "Weather Alert: Heat Spike",
                "description": "Unusual heat spike predicted for Tuesday in East Field. Consider early morning irrigation.",
                "time_label": "2 hours ago",
                "unread": True,
            },
            {
                "id": "notif-3",
                "icon": "trending-up",
                "icon_color": "#007233",
                "icon_bg": "#91F5A3",
                "title": "Market price alert: Wheat up 5%",
                "description": "Wheat prices reached ₹2,410/quintal at District Mandi.",
                "time_label": "Yesterday",
                "unread": False,
            },
            {
                "id": "notif-4",
                "icon": "science",
                "icon_color": "#145C2E",
                "icon_bg": "#ECE8DF",
                "title": "Soil test completed",
                "description": "Soil moisture is optimal at 42% with stable nutrient values for Paddy Batch 04.",
                "time_label": "3 days ago",
                "unread": False,
            },
        ]
        self.pest_scans = [
            {
                "id": "scan-1",
                "crop_name": "Paddy",
                "scan_date": "Checked today at 09:41 AM",
                "issue_detected": True,
                "result_text": "Possible leaf blight",
                "image_uri": "https://lh3.googleusercontent.com/aida-public/AB6AXuDTx2BwGYwcHhhtJnRDQV7-nyKnATPbiG4vrNiXHV1LZ0Kz1LatNQBzuX_VmQncBYRXUNIahhSt0W4Y5xHru-aCOAMWMnjAEy8ihEejBLPkkEV4FKXixOsH5hS6LHz7rncfRC5OKWNW1XsQw-cKVcZbFByrcXQssKHqaQt-vEUWvAk6h3pTFxF8jbFUnZGXHFMTtwfAEMusEDx9itl_RVyg6nh8OyT4cJrerp_GWpqmKAUdvYa8zCMrqQ",
            }
        ]

    def persist_batch(self, batch_id, initial_weight_kg, harvest_timestamp,
                      initial_visual_score, detected_ripeness_stage,
                      fungal_pathogen_presence, qr_code_secure_token,
                      field_id=None, macro_satellite_modifier=1.00):
        self.batches[batch_id] = {
            "batch_id": batch_id,
            "field_id": field_id,
            "initial_weight_kg": float(initial_weight_kg),
            "harvest_timestamp": harvest_timestamp,
            "initial_visual_score": float(initial_visual_score),
            "detected_ripeness_stage": detected_ripeness_stage,
            "fungal_pathogen_presence": fungal_pathogen_presence,
            "macro_satellite_modifier": float(macro_satellite_modifier),
            "micro_drone_modifier": 1.0,
            "logistics_road_penalty": 1.0,
            "qr_code_secure_token": qr_code_secure_token,
            "current_status": "ACTIVE",
        }
        return self.batches[batch_id]

    def get_batch(self, batch_id):
        return self.batches.get(batch_id)

    def list_batches(self, status_filter=None, limit=50, offset=0):
        items = list(self.batches.values())
        if status_filter:
            items = [b for b in items if b["current_status"] == status_filter]
        items.sort(key=lambda b: b.get("harvest_timestamp", ""), reverse=True)
        return items[offset:offset + limit]

    def update_batch_status(self, batch_id, new_status):
        if batch_id in self.batches:
            self.batches[batch_id]["current_status"] = new_status
            return True
        return False

    def delete_batch(self, batch_id):
        if batch_id in self.batches:
            del self.batches[batch_id]
            self.logs.pop(batch_id, None)
            return True
        return False

    def insert_environmental_log(self, batch_id, temperature_c, humidity_pct,
                                 latitude=None, longitude=None, log_timestamp=None):
        import datetime
        ts = log_timestamp or datetime.datetime.now(datetime.timezone.utc).isoformat()
        entry = {
            "batch_id": batch_id,
            "ambient_temperature_c": float(temperature_c),
            "relative_humidity_pct": float(humidity_pct),
            "longitude": longitude,
            "latitude": latitude,
            "log_timestamp": ts,
        }
        self.logs.setdefault(batch_id, []).append(entry)
        return entry

    def get_environmental_logs(self, batch_id, limit=100):
        logs = self.logs.get(batch_id, [])
        return list(reversed(logs[-limit:]))

    def get_log_analytics(self, batch_id):
        import math
        logs = self.logs.get(batch_id, [])
        if not logs:
            return {
                "log_count": 0, "temperature": {"min_c": None, "avg_c": None, "max_c": None},
                "humidity": {"min_pct": None, "avg_pct": None, "max_pct": None},
                "temperature_trend": "INSUFFICIENT_DATA",
                "degree_hours_above_optimal": 0.0, "spoilage_risk_class": "LOW",
                "spoilage_risk_pct": 5, "first_log_timestamp": None, "last_log_timestamp": None,
            }
        temps = [l["ambient_temperature_c"] for l in logs]
        humids = [l["relative_humidity_pct"] for l in logs]
        # Simple trend from first to last
        trend = "STABLE"
        if len(temps) >= 2:
            diff = temps[-1] - temps[0]
            trend = "RISING" if diff > 2 else "FALLING" if diff < -2 else "STABLE"
        degree_hours = sum(max(0, t - 12.0) for t in temps)
        if degree_hours > 200:
            risk_class, risk_pct = "CRITICAL", min(95, int(degree_hours / 3))
        elif degree_hours > 100:
            risk_class, risk_pct = "HIGH", min(80, int(degree_hours / 2.5))
        elif degree_hours > 40:
            risk_class, risk_pct = "MEDIUM", min(60, int(degree_hours / 1.5))
        else:
            risk_class, risk_pct = "LOW", max(5, int(degree_hours / 2))
        return {
            "log_count": len(logs),
            "temperature": {"min_c": min(temps), "avg_c": round(sum(temps)/len(temps), 1), "max_c": max(temps)},
            "humidity": {"min_pct": min(humids), "avg_pct": round(sum(humids)/len(humids), 1), "max_pct": max(humids)},
            "temperature_trend": trend,
            "degree_hours_above_optimal": round(degree_hours, 2),
            "spoilage_risk_class": risk_class,
            "spoilage_risk_pct": risk_pct,
            "first_log_timestamp": logs[0]["log_timestamp"],
            "last_log_timestamp": logs[-1]["log_timestamp"],
        }

    def get_nearest_salvage_facilities(self, longitude, latitude, radius_km=50.0, limit=5):
        import math
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
            return R * 2 * math.asin(math.sqrt(a))
        results = []
        for f in self.facilities:
            dist = haversine(latitude, longitude, f["latitude"], f["longitude"])
            if dist <= radius_km:
                results.append({**f, "distance_km": round(dist, 1)})
        results.sort(key=lambda x: x["distance_km"])
        return results[:limit]

    def get_notifications(self):
        return self.notifications

    def get_recent_scans(self):
        return self.pest_scans

    def get_batch_statistics(self):
        batches = list(self.batches.values())
        total = len(batches)
        total_weight = sum(b["initial_weight_kg"] for b in batches)
        avg_score = sum(b["initial_visual_score"] for b in batches) / total if total else 0
        by_status, by_risk, by_crop = {}, {}, {}
        for b in batches:
            s = b["current_status"]
            by_status.setdefault(s, {"batch_count": 0, "total_weight_kg": 0})
            by_status[s]["batch_count"] += 1
            by_status[s]["total_weight_kg"] += b["initial_weight_kg"]
            vs = b["initial_visual_score"]
            tier = "HIGH" if vs < 50 else "MEDIUM" if vs < 75 else "LOW"
            by_risk.setdefault(tier, {"batch_count": 0, "total_weight_kg": 0})
            by_risk[tier]["batch_count"] += 1
            by_risk[tier]["total_weight_kg"] += b["initial_weight_kg"]
        pathogen_count = sum(1 for b in batches if b["fungal_pathogen_presence"])
        recent = sorted(batches, key=lambda b: b.get("harvest_timestamp", ""), reverse=True)[:10]
        return {
            "totals": {"batch_count": total, "total_weight_kg": round(total_weight, 2), "avg_visual_score": round(avg_score, 1)},
            "by_status": [{"current_status": k, **v} for k, v in by_status.items()],
            "by_risk_tier": [{"risk_tier": k, **v} for k, v in by_risk.items()],
            "by_crop_category": [{"crop_category": "Mixed", "batch_count": total, "total_weight_kg": round(total_weight, 2)}],
            "pathogen_alerts": pathogen_count,
            "recent_batches": [{"batch_id": b["batch_id"], "initial_weight_kg": b["initial_weight_kg"],
                               "harvest_timestamp": b.get("harvest_timestamp"),
                               "detected_ripeness_stage": b["detected_ripeness_stage"],
                               "current_status": b["current_status"],
                               "initial_visual_score": b["initial_visual_score"]} for b in recent],
        }


# Global in-memory fallback instance
mem_store = InMemoryStore()


# ====================================================================================
# BATCH OPERATIONS (crop_batches table)
# ====================================================================================

def persist_batch(
    batch_id: str,
    initial_weight_kg: float,
    harvest_timestamp: str,
    initial_visual_score: float,
    detected_ripeness_stage: str,
    fungal_pathogen_presence: bool,
    qr_code_secure_token: str,
    field_id: Optional[str] = None,
    macro_satellite_modifier: float = 1.00,
    cur: Optional[Any] = None,
) -> Dict[str, Any]:
    """Inserts a new crop batch into the database."""
    valid_field_uuid = None
    if field_id:
        try:
            import uuid as _uuid
            _uuid.UUID(str(field_id))
            valid_field_uuid = str(field_id)
        except (ValueError, TypeError, AttributeError):
            valid_field_uuid = None

    if not db.is_connected:
        return mem_store.persist_batch(batch_id, initial_weight_kg, harvest_timestamp,
            initial_visual_score, detected_ripeness_stage, fungal_pathogen_presence,
            qr_code_secure_token, field_id, macro_satellite_modifier)
    sql = """
        INSERT INTO crop_batches (
            batch_id, field_id, initial_weight_kg, harvest_timestamp,
            initial_visual_score, detected_ripeness_stage,
            fungal_pathogen_presence, macro_satellite_modifier,
            qr_code_secure_token, current_status
        ) VALUES (
            %s, %s, %s, %s::timestamptz, %s, %s, %s, %s, %s, 'ACTIVE'
        )
        RETURNING batch_id, initial_weight_kg, harvest_timestamp,
                  detected_ripeness_stage, fungal_pathogen_presence,
                  macro_satellite_modifier, current_status;
    """
    params = (
        batch_id, valid_field_uuid, initial_weight_kg, harvest_timestamp,
        initial_visual_score, detected_ripeness_stage,
        fungal_pathogen_presence, macro_satellite_modifier,
        qr_code_secure_token
    )
    if cur:
        cur.execute(sql, params)
        return dict(cur.fetchone())
    else:
        with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as local_cur:
            local_cur.execute(sql, params)
            return dict(local_cur.fetchone())


def get_batch(batch_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single batch by ID."""
    if not db.is_connected:
        return mem_store.get_batch(batch_id)
    sql = """
        SELECT batch_id, field_id, initial_weight_kg, harvest_timestamp::text,
               initial_visual_score, detected_ripeness_stage,
               fungal_pathogen_presence, macro_satellite_modifier,
               micro_drone_modifier, logistics_road_penalty,
               current_status, qr_code_secure_token
        FROM crop_batches
        WHERE batch_id = %s;
    """
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, (batch_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def list_batches(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """Lists batches, optionally filtered by status."""
    if not db.is_connected:
        return mem_store.list_batches(status_filter, limit, offset)
    if status_filter:
        sql = """
            SELECT batch_id, initial_weight_kg, harvest_timestamp::text,
                   detected_ripeness_stage, fungal_pathogen_presence,
                   macro_satellite_modifier, current_status
            FROM crop_batches
            WHERE current_status = %s
            ORDER BY harvest_timestamp DESC
            LIMIT %s OFFSET %s;
        """
        params = (status_filter, limit, offset)
    else:
        sql = """
            SELECT batch_id, initial_weight_kg, harvest_timestamp::text,
                   detected_ripeness_stage, fungal_pathogen_presence,
                   macro_satellite_modifier, current_status
            FROM crop_batches
            ORDER BY harvest_timestamp DESC
            LIMIT %s OFFSET %s;
        """
        params = (limit, offset)

    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, params)
        return [dict(row) for row in cur.fetchall()]


def update_batch_status(batch_id: str, new_status: str) -> bool:
    """Updates the status of a batch (ACTIVE → TRANSIT → SOLD/SPOILED)."""
    if not db.is_connected:
        return mem_store.update_batch_status(batch_id, new_status)
    sql = """
        UPDATE crop_batches
        SET current_status = %s
        WHERE batch_id = %s
        RETURNING batch_id;
    """
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, (new_status, batch_id))
        return cur.fetchone() is not None


# ====================================================================================
# ENVIRONMENTAL LOG OPERATIONS (environmental_logs table)
# ====================================================================================

def insert_environmental_log(
    batch_id: str,
    temperature_c: float,
    humidity_pct: float,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    log_timestamp: Optional[str] = None,
    cur: Optional[Any] = None,
) -> Dict[str, Any]:
    """Inserts a telemetry reading for a batch in transit."""
    if not db.is_connected:
        return mem_store.insert_environmental_log(batch_id, temperature_c, humidity_pct, latitude, longitude, log_timestamp)
    ts = log_timestamp or "NOW()"

    if latitude is not None and longitude is not None:
        sql = f"""
            INSERT INTO environmental_logs (
                log_timestamp, batch_id, ambient_temperature_c,
                relative_humidity_pct, location_point
            ) VALUES (
                {ts}::timestamptz, %s, %s, %s,
                ST_GeomFromText('POINT(%s %s)', 4326)
            )
            RETURNING batch_id, ambient_temperature_c, relative_humidity_pct;
        """
        params = (batch_id, temperature_c, humidity_pct, longitude, latitude)
    else:
        sql = f"""
            INSERT INTO environmental_logs (
                log_timestamp, batch_id, ambient_temperature_c,
                relative_humidity_pct
            ) VALUES (
                {ts}::timestamptz, %s, %s, %s
            )
            RETURNING batch_id, ambient_temperature_c, relative_humidity_pct;
        """
        params = (batch_id, temperature_c, humidity_pct)

    if cur:
        cur.execute(sql, params)
        return dict(cur.fetchone())
    else:
        with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as local_cur:
            local_cur.execute(sql, params)
            return dict(local_cur.fetchone())


def get_environmental_logs(
    batch_id: str,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """Retrieves telemetry history for a batch, newest first."""
    if not db.is_connected:
        return mem_store.get_environmental_logs(batch_id, limit)
    sql = """
        SELECT log_timestamp::text, batch_id, ambient_temperature_c,
               relative_humidity_pct,
               ST_X(location_point) AS longitude,
               ST_Y(location_point) AS latitude
        FROM environmental_logs
        WHERE batch_id = %s
        ORDER BY log_timestamp DESC
        LIMIT %s;
    """
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, (batch_id, limit))
        return [dict(row) for row in cur.fetchall()]


# ====================================================================================
# SALVAGE FACILITIES OPERATIONS (secondary_salvage_facilities table)
# ====================================================================================

def get_nearest_salvage_facilities(
    longitude: float,
    latitude: float,
    radius_km: float = 50.0,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Uses PostGIS KNN nearest-neighbor search to find the closest
    active salvage facilities within a given radius.
    """
    if not db.is_connected:
        return mem_store.get_nearest_salvage_facilities(longitude, latitude, radius_km, limit)
    sql = """
        SELECT facility_id, facility_name, facility_type,
               guaranteed_floor_price_per_kg,
               ST_X(location_geom) AS longitude,
               ST_Y(location_geom) AS latitude,
               ST_Distance(
                   location_geom::geography,
                   ST_GeomFromText('POINT(%s %s)', 4326)::geography
               ) / 1000.0 AS distance_km
        FROM secondary_salvage_facilities
        WHERE is_active = TRUE
          AND ST_DWithin(
              location_geom::geography,
              ST_GeomFromText('POINT(%s %s)', 4326)::geography,
              %s * 1000.0
          )
        ORDER BY location_geom <-> ST_GeomFromText('POINT(%s %s)', 4326)
        LIMIT %s;
    """
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, (longitude, latitude, longitude, latitude, radius_km, longitude, latitude, limit))
        return [dict(row) for row in cur.fetchall()]


# ====================================================================================
# BATCH DELETION OPERATIONS
# ====================================================================================

def delete_batch(batch_id: str) -> bool:
    """
    Hard-deletes a batch and its cascade environmental logs.
    Returns True if a row was deleted.
    """
    if not db.is_connected:
        return mem_store.delete_batch(batch_id)
    sql = """
        DELETE FROM crop_batches
        WHERE batch_id = %s
        RETURNING batch_id;
    """
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, (batch_id,))
        return cur.fetchone() is not None


# ====================================================================================
# ENVIRONMENTAL LOG ANALYTICS OPERATIONS
# ====================================================================================

def get_log_analytics(batch_id: str) -> Dict[str, Any]:
    """
    Aggregates environmental telemetry data for a batch:
    - Min/avg/max temperature and humidity
    - Total log count
    - Temperature trend (rising/falling/stable) based on last 5 readings
    - Spoilage risk classification based on thermal history (degree-hours above 12°C)
    """
    if not db.is_connected:
        return mem_store.get_log_analytics(batch_id)
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # 1. Basic aggregates
        cur.execute("""
            SELECT
                COUNT(*) AS log_count,
                MIN(ambient_temperature_c) AS min_temp,
                ROUND(AVG(ambient_temperature_c), 1) AS avg_temp,
                MAX(ambient_temperature_c) AS max_temp,
                MIN(relative_humidity_pct) AS min_humidity,
                ROUND(AVG(relative_humidity_pct), 1) AS avg_humidity,
                MAX(relative_humidity_pct) AS max_humidity,
                MIN(log_timestamp::text) AS first_log,
                MAX(log_timestamp::text) AS last_log
            FROM environmental_logs
            WHERE batch_id = %s;
        """, (batch_id,))
        row = cur.fetchone()
        stats = dict(row) if row else {}
        log_count = stats.get("log_count") or 0

        # If no logs yet for this batch, return clean baseline
        if log_count == 0:
            return {
                "log_count": 0,
                "temperature": {"min_c": None, "avg_c": None, "max_c": None},
                "humidity": {"min_pct": None, "avg_pct": None, "max_pct": None},
                "temperature_trend": "INSUFFICIENT_DATA",
                "degree_hours_above_optimal": 0.0,
                "spoilage_risk_class": "LOW",
                "spoilage_risk_pct": 5,
                "first_log_timestamp": None,
                "last_log_timestamp": None,
            }

        # 2. Temperature trend (last 5 readings, oldest to newest)
        cur.execute("""
            SELECT ambient_temperature_c
            FROM environmental_logs
            WHERE batch_id = %s
            ORDER BY log_timestamp DESC
            LIMIT 5;
        """, (batch_id,))
        recent_temps = [r["ambient_temperature_c"] for r in cur.fetchall()]
        recent_temps.reverse()  # chronological order

        if len(recent_temps) >= 2:
            temp_diff = recent_temps[-1] - recent_temps[0]
            if temp_diff > 2.0:
                trend = "RISING"
            elif temp_diff < -2.0:
                trend = "FALLING"
            else:
                trend = "STABLE"
        else:
            trend = "INSUFFICIENT_DATA"

        # 3. Degree-hours above optimal (12°C) — spoilage risk metric using valid SQL CTE
        cur.execute("""
            WITH intervals AS (
                SELECT
                    ambient_temperature_c,
                    EXTRACT(EPOCH FROM (log_timestamp - LAG(log_timestamp) OVER (ORDER BY log_timestamp))) / 3600.0 AS hours
                FROM environmental_logs
                WHERE batch_id = %s
            )
            SELECT COALESCE(SUM(GREATEST(0, ambient_temperature_c - 12.0) * COALESCE(hours, 1.0)), 0) AS degree_hours_above_optimal
            FROM intervals;
        """, (batch_id,))
        dh_row = cur.fetchone()
        degree_hours = float(dh_row["degree_hours_above_optimal"]) if dh_row and dh_row.get("degree_hours_above_optimal") is not None else 0.0

    # Classify spoilage risk based on accumulated degree-hours
    if degree_hours > 200:
        risk_class = "CRITICAL"
        risk_pct = min(95, int(degree_hours / 3))
    elif degree_hours > 100:
        risk_class = "HIGH"
        risk_pct = min(80, int(degree_hours / 2.5))
    elif degree_hours > 40:
        risk_class = "MEDIUM"
        risk_pct = min(60, int(degree_hours / 1.5))
    else:
        risk_class = "LOW"
        risk_pct = max(5, int(degree_hours / 2))

    return {
        "log_count": log_count,
        "temperature": {
            "min_c": float(stats["min_temp"]) if stats.get("min_temp") is not None else None,
            "avg_c": float(stats["avg_temp"]) if stats.get("avg_temp") is not None else None,
            "max_c": float(stats["max_temp"]) if stats.get("max_temp") is not None else None,
        },
        "humidity": {
            "min_pct": float(stats["min_humidity"]) if stats.get("min_humidity") is not None else None,
            "avg_pct": float(stats["avg_humidity"]) if stats.get("avg_humidity") is not None else None,
            "max_pct": float(stats["max_humidity"]) if stats.get("max_humidity") is not None else None,
        },
        "temperature_trend": trend,
        "degree_hours_above_optimal": round(degree_hours, 2),
        "spoilage_risk_class": risk_class,
        "spoilage_risk_pct": risk_pct,
        "first_log_timestamp": stats.get("first_log"),
        "last_log_timestamp": stats.get("last_log"),
    }


# ====================================================================================
# DASHBOARD AGGREGATION OPERATIONS
# ====================================================================================

def get_batch_statistics() -> Dict[str, Any]:
    """
    Aggregated dashboard statistics across all batches:
    - Total batch count and weight
    - Status breakdown (ACTIVE / TRANSIT / SOLD / SPOILED)
    - Risk tier distribution (HIGH / MEDIUM / LOW) based on visual score
    - Crop type breakdown with weight totals
    - Recent batches (last 10)
    """
    if not db.is_connected:
        return mem_store.get_batch_statistics()
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # 1. Overall totals
        cur.execute("""
            SELECT COUNT(*) AS total_batches,
                   COALESCE(SUM(initial_weight_kg), 0) AS total_weight_kg,
                   COALESCE(AVG(initial_visual_score), 0) AS avg_visual_score
            FROM crop_batches;
        """)
        totals = dict(cur.fetchone())

        # 2. Status breakdown
        cur.execute("""
            SELECT current_status,
                   COUNT(*) AS batch_count,
                   COALESCE(SUM(initial_weight_kg), 0) AS total_weight_kg
            FROM crop_batches
            GROUP BY current_status
            ORDER BY batch_count DESC;
        """)
        by_status = [dict(row) for row in cur.fetchall()]

        # 3. Risk tier distribution (HIGH < 50, MEDIUM 50-75, LOW > 75)
        cur.execute("""
            SELECT
                CASE
                    WHEN initial_visual_score < 50 THEN 'HIGH'
                    WHEN initial_visual_score < 75 THEN 'MEDIUM'
                    ELSE 'LOW'
                END AS risk_tier,
                COUNT(*) AS batch_count,
                COALESCE(SUM(initial_weight_kg), 0) AS total_weight_kg
            FROM crop_batches
            GROUP BY risk_tier
            ORDER BY batch_count DESC;
        """)
        by_risk = [dict(row) for row in cur.fetchall()]

        # 4. Crop type breakdown
        cur.execute("""
            SELECT
                CASE
                    WHEN batch_id LIKE '%TOM%' THEN 'Tomatoes'
                    WHEN batch_id LIKE '%MNG%' THEN 'Mangoes'
                    WHEN batch_id LIKE '%ONI%' THEN 'Onions'
                    ELSE 'Other'
                END AS crop_category,
                COUNT(*) AS batch_count,
                COALESCE(SUM(initial_weight_kg), 0) AS total_weight_kg
            FROM crop_batches
            GROUP BY crop_category
            ORDER BY total_weight_kg DESC;
        """)
        by_crop = [dict(row) for row in cur.fetchall()]

        # 5. Recent batches (last 10)
        cur.execute("""
            SELECT batch_id, initial_weight_kg, harvest_timestamp::text,
                   detected_ripeness_stage, current_status, initial_visual_score
            FROM crop_batches
            ORDER BY harvest_timestamp DESC
            LIMIT 10;
        """)
        recent = [dict(row) for row in cur.fetchall()]

        # 6. Fungal pathogen alert count
        cur.execute("""
            SELECT COUNT(*) AS pathogen_alerts
            FROM crop_batches
            WHERE fungal_pathogen_presence = TRUE;
        """)
        pathogen = dict(cur.fetchone())

    return {
        "totals": {
            "batch_count": totals["total_batches"],
            "total_weight_kg": float(totals["total_weight_kg"]),
            "avg_visual_score": round(float(totals["avg_visual_score"]), 1),
        },
        "by_status": by_status,
        "by_risk_tier": by_risk,
        "by_crop_category": by_crop,
        "pathogen_alerts": pathogen["pathogen_alerts"],
        "recent_batches": recent,
    }


# ====================================================================================
# NOTIFICATIONS & SCANS (Added for UI migration)
# ====================================================================================

def get_notifications() -> List[Dict[str, Any]]:
    if not db.is_connected:
        return mem_store.get_notifications()
    try:
        with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50;")
            rows = [dict(r) for r in cur.fetchall()]
            if not rows:
                return mem_store.get_notifications()
            return rows
    except Exception as e:
        logger.error(f"Failed to fetch notifications: {e}")
        return mem_store.get_notifications()

def get_recent_scans() -> List[Dict[str, Any]]:
    if not db.is_connected:
        return mem_store.get_recent_scans()
    try:
        with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM pest_scans ORDER BY created_at DESC LIMIT 20;")
            rows = [dict(r) for r in cur.fetchall()]
            if not rows:
                return mem_store.get_recent_scans()
            return rows
    except Exception as e:
        logger.error(f"Failed to fetch recent scans: {e}")
        return mem_store.get_recent_scans()
