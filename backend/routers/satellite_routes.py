"""
ISRO VEDAS Live Satellite Data Endpoints

Queries ISRO VEDAS OGC WMS for NDVI and soil moisture data.
Falls back to internal climate matrix if government servers are unreachable.

Endpoints:
  GET /api/v5/satellite/vedas/live        — Single-point NDVI + soil moisture
  GET /api/v5/satellite/vedas/multi-layer — Multi-layer bounding box query
"""

from fastapi import APIRouter, Query

from vedas_scraper import BhuvanVedasScraperWorker

router = APIRouter(tags=["satellite"])


@router.get("/api/v5/satellite/vedas/live")
async def fetch_vedas_live(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_deg: float = Query(0.1, ge=0.01, le=1.0),
):
    """
    Queries ISRO VEDAS OGC WMS for live NDVI and soil moisture at GPS coordinates.
    Falls back to internal climate matrix if government servers are unreachable.
    """
    result = BhuvanVedasScraperWorker.fetch_for_coordinates(
        latitude=latitude, longitude=longitude, radius_deg=radius_deg,
    )
    return result


@router.get("/api/v5/satellite/vedas/multi-layer")
async def fetch_vedas_multi_layer(
    min_lng: float = Query(...),
    min_lat: float = Query(...),
    max_lng: float = Query(...),
    max_lat: float = Query(...),
):
    """
    Queries multiple VEDAS layers (NDVI + SMAP soil moisture) for a bounding box.
    """
    result = BhuvanVedasScraperWorker.fetch_multi_layer(
        min_lng=min_lng, min_lat=min_lat, max_lng=max_lng, max_lat=max_lat,
    )
    return result
