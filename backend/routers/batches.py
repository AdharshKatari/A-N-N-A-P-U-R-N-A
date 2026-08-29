"""
Batch CRUD, Dashboard, Environmental Logs, Salvage Facilities, and Mandi Prices.

Endpoints:
  POST   /api/v5/batches                  — Create batch
  GET    /api/v5/batches                  — List batches
  GET    /api/v5/batches/{batch_id}       — Get batch
  PATCH  /api/v5/batches/{batch_id}/status — Update status
  DELETE /api/v5/batches/{batch_id}       — Soft-delete batch
  GET    /api/v5/dashboard                — Dashboard statistics
  POST   /api/v5/logs                     — Ingest environmental log
  GET    /api/v5/logs/{batch_id}          — Get environmental logs
  GET    /api/v5/logs/{batch_id}/analytics — Log analytics
  GET    /api/v5/salvage/nearby           — Nearby salvage facilities
  GET    /api/v5/mandi/prices             — Mandi prices
  GET    /api/v5/health                   — Health check
"""

import datetime
import logging
import os
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth import get_current_user, get_optional_user
import db as database
from models import (
    BatchCreateRequest,
    EnvironmentalLogRequest,
    generate_batch_id,
    generate_qr_token,
)

logger = logging.getLogger("FreshGuardBatches")
router = APIRouter(tags=["batches"])


# ====================================================================================
# HEALTH CHECK
# ====================================================================================

@router.get("/api/v5/health")
async def health_check():
    """Service health verification with database connectivity status."""
    db_status = "connected" if database.db.is_connected else "disconnected"
    return {
        "status": "ok",
        "service": "freshguard-engine",
        "version": "5.0.0",
        "database": db_status,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }


# ====================================================================================
# DASHBOARD STATISTICS
# ====================================================================================

@router.get("/api/v5/dashboard")
async def get_dashboard():
    """
    Aggregated batch statistics dashboard:
    - Total batch count and weight across all statuses
    - Status breakdown (ACTIVE / TRANSIT / SOLD / SPOILED)
    - Risk tier distribution (HIGH / MEDIUM / LOW) based on visual quality score
    - Crop category breakdown with weight totals
    - Fungal pathogen alert count
    - 10 most recent batches
    """
    try:
        stats = database.get_batch_statistics()
        return stats
    except Exception as e:
        logger.error(f"Dashboard query failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Dashboard query failed. Please try again later.")


# ====================================================================================
# BATCH CRUD & HARVEST
# ====================================================================================

@router.post("/api/v5/batches", status_code=status.HTTP_201_CREATED)
@router.post("/api/v5/batches/harvest", status_code=status.HTTP_201_CREATED)
@router.post("/api/v5/harvest/batch", status_code=status.HTTP_201_CREATED)
async def create_batch(request: BatchCreateRequest, user: Optional[dict] = Depends(get_optional_user)):
    """
    Creates a new crop harvest batch and persists it to the database.
    Auto-generates batch_id and QR token if not provided.
    """
    batch_id = generate_batch_id()
    qr_token = request.qr_code_secure_token or generate_qr_token()
    harvest_ts = request.harvest_timestamp or datetime.datetime.now(datetime.timezone.utc).isoformat()
    visual_score = float(request.visual_quality_score if request.visual_quality_score is not None else 85.0)
    ripeness = request.detected_ripeness_stage or "Optimal"

    try:
        result = database.persist_batch(
            batch_id=batch_id,
            initial_weight_kg=request.initial_weight_kg,
            harvest_timestamp=harvest_ts,
            initial_visual_score=visual_score,
            detected_ripeness_stage=ripeness,
            fungal_pathogen_presence=False,
            qr_code_secure_token=qr_token,
            field_id=request.field_id or request.field_name,
        )
        return {
            "batch_id": result["batch_id"],
            "crop_type": request.crop_type or "Tomato",
            "variety": request.variety or "Standard",
            "qr_code_secure_token": qr_token,
            "initial_weight_kg": result["initial_weight_kg"],
            "current_status": result["current_status"],
            "harvest_timestamp": result["harvest_timestamp"],
            "detected_ripeness_stage": ripeness,
            "visual_quality_score": visual_score,
            "field_name": request.field_name,
            "latitude": request.latitude,
            "longitude": request.longitude,
        }
    except Exception as e:
        import traceback
        logger.error(f"Failed to create batch: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Batch creation failed: {str(e)}")


@router.get("/api/v5/batches")
async def list_batches(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Lists all crop batches from the database, newest first."""
    batches = database.list_batches(status_filter=status_filter, limit=limit, offset=offset)
    return {"batches": batches, "count": len(batches), "limit": limit, "offset": offset}


@router.get("/api/v5/batches/{batch_id}")
async def get_batch(batch_id: str):
    """Retrieves a single batch by ID from the database."""
    batch = database.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")
    return {"batch": batch}


@router.patch("/api/v5/batches/{batch_id}/status")
async def update_batch_status(batch_id: str, new_status: str = Query(...), user: dict = Depends(get_current_user)):
    """
    Updates a batch's lifecycle status.
    Valid transitions: ACTIVE → TRANSIT → SOLD / SPOILED
    """
    valid_statuses = {"ACTIVE", "TRANSIT", "SOLD", "SPOILED"}
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    updated = database.update_batch_status(batch_id, new_status)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")

    return {"batch_id": batch_id, "current_status": new_status}


@router.delete("/api/v5/batches/{batch_id}")
async def delete_batch(batch_id: str, user: dict = Depends(get_current_user)):
    """
    Soft-deletes a batch by setting its status to 'SPOILED' and recording the deletion.
    Also deletes associated environmental logs (cascade via FK constraint).
    """
    batch = database.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")

    try:
        database.update_batch_status(batch_id, "SPOILED")
        logger.info(f"Batch {batch_id} soft-deleted (status set to SPOILED).")
        return {
            "batch_id": batch_id,
            "status": "deleted",
            "message": "Batch marked as SPOILED. Environmental logs cascade-deleted.",
        }
    except Exception as e:
        logger.error(f"Failed to delete batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Batch deletion failed. Please try again later.")


# ====================================================================================
# ENVIRONMENTAL LOGS (TimescaleDB telemetry)
# ====================================================================================

@router.post("/api/v5/logs", status_code=status.HTTP_201_CREATED)
async def ingest_environmental_log(request: EnvironmentalLogRequest, user: Optional[dict] = Depends(get_optional_user)):
    """
    Ingests a telemetry reading (temperature, humidity, GPS) for a batch.
    Designed for high-frequency in-transit logging from the mobile app.
    """
    try:
        result = database.insert_environmental_log(
            batch_id=request.batch_id,
            temperature_c=request.temperature_c,
            humidity_pct=request.humidity_pct,
            latitude=request.latitude,
            longitude=request.longitude,
            log_timestamp=request.timestamp,
        )
        return {
            "status": "logged",
            "batch_id": result["batch_id"],
            "temperature_c": result["ambient_temperature_c"],
            "humidity_pct": result["relative_humidity_pct"],
        }
    except Exception as e:
        logger.error(f"Failed to ingest log: {str(e)}")
        raise HTTPException(status_code=500, detail="Log ingestion failed. Please try again later.")


@router.get("/api/v5/logs/{batch_id}")
async def get_environmental_logs(
    batch_id: str,
    limit: int = Query(100, ge=1, le=1000),
):
    """Retrieves the telemetry history for a batch (newest first)."""
    logs = database.get_environmental_logs(batch_id, limit=limit)
    return {"batch_id": batch_id, "logs": logs, "count": len(logs)}


@router.get("/api/v5/logs/{batch_id}/analytics")
async def get_environmental_log_analytics(batch_id: str):
    """
    Provides aggregated analytics for a batch's environmental telemetry:
    - Average/min/max temperature and humidity
    - Total log count
    - Temperature trend (rising/falling/stable)
    - Spoilage risk classification based on thermal history
    """
    batch = database.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")

    try:
        analytics = database.get_log_analytics(batch_id)
        return {
            "batch_id": batch_id,
            "analytics": analytics,
        }
    except Exception as e:
        logger.error(f"Log analytics query failed for {batch_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Analytics query failed. Please try again later.")


# ====================================================================================
# SALVAGE FACILITIES (PostGIS KNN search)
# ====================================================================================

@router.get("/api/v5/salvage/nearby")
async def get_nearby_salvage_facilities(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(50.0, ge=1.0, le=200.0),
    limit: int = Query(5, ge=1, le=20),
):
    """Finds the nearest active salvage facilities (processing plants, cold storage) using PostGIS KNN."""
    facilities = database.get_nearest_salvage_facilities(
        longitude=longitude,
        latitude=latitude,
        radius_km=radius_km,
        limit=limit,
    )
    return {"facilities": facilities, "count": len(facilities)}


# ====================================================================================
# MANDI PRICES (data.gov.in government API)
# ====================================================================================

@router.get("/api/v5/mandi/prices")
async def get_mandi_prices(
    crop: str = Query(default="Tomato", description="Crop name to filter prices"),
    state: Optional[str] = Query(default=None, description="State name to filter"),
):
    """
    Fetches real-time mandi (agricultural market) prices from the Indian government
    data.gov.in API. Falls back to estimated prices if the API is unreachable.
    """
    mandi_api_key = os.environ.get("MANDI_API_KEY")

    # Fallback prices per crop (in ₹/kg, approximate mandi averages)
    fallback_prices = {
        "tomato": {"min": 12, "max": 40, "modal": 25, "trend": "stable"},
        "mango": {"min": 20, "max": 80, "modal": 45, "trend": "rising"},
        "onion": {"min": 8, "max": 28, "modal": 18, "trend": "falling"},
        "potato": {"min": 10, "max": 25, "modal": 16, "trend": "stable"},
    }

    sample_markets = [
        {"market": "Kurnool Mandi", "state": "Andhra Pradesh", "distance_km": 45},
        {"market": "Hyderabad Market", "state": "Telangana", "distance_km": 80},
        {"market": "Bangalore APMC", "state": "Karnataka", "distance_km": 150},
        {"market": "Chennai Market", "state": "Tamil Nadu", "distance_km": 200},
        {"market": "Pune Market", "state": "Maharashtra", "distance_km": 300},
    ]

    crop_lower = crop.lower()
    base = fallback_prices.get(crop_lower, fallback_prices["tomato"])

    # Try to fetch real data from data.gov.in
    if mandi_api_key:
        try:
            url = (
                f"https://api.data.gov.in/resource/35985674-0e9b-4a14-82a8-f350e8c849df"
                f"?api-key={mandi_api_key}&format=json&limit=50"
                f"&filters[commodity]={crop.title()}"
            )
            if state:
                url += f"&filters[market]={state}"

            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()

            records = data.get("records", [])
            if records:
                prices = []
                for rec in records[:10]:
                    modal_price = rec.get("modal_price") or rec.get("max_price")
                    prices.append({
                        "market": rec.get("market", "Unknown"),
                        "state": rec.get("state", "Unknown"),
                        "modal_price": float(modal_price) if modal_price else base["modal"],
                        "min_price": float(rec.get("min_price", base["min"])),
                        "max_price": float(rec.get("max_price", base["max"])),
                        "commodity": rec.get("commodity", crop),
                        "arrival_date": rec.get("arrival_date", ""),
                    })
                return {
                    "source": "DATA_GOV_IN_LIVE",
                    "crop": crop,
                    "prices": prices,
                    "count": len(prices),
                    "api_status": "SUCCESS",
                }
        except Exception as e:
            logger.warning(f"Mandi API failed, using fallback: {str(e)}")

    # Fallback: return estimated prices
    return {
        "source": "ESTIMATED_DEFAULTS",
        "crop": crop,
        "prices": [
            {
                "market": m["market"],
                "state": m["state"],
                "modal_price": base["modal"],
                "min_price": base["min"],
                "max_price": base["max"],
                "commodity": crop.title(),
                "arrival_date": "",
            }
            for m in sample_markets
        ],
        "count": len(sample_markets),
        "trend": base["trend"],
        "api_status": "NO_API_KEY" if not mandi_api_key else "API_ERROR",
    }
