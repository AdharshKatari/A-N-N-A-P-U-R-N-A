"""
Proactive Spatial Logistics & Dynamic Intercept Router

Exposes proactive PostGIS mid-route diversion endpoints:
- In-transit biological integrity evaluation
- Continuous degradation index & Q10 Arrhenius decay interception
- Dynamic rerouting to closest active salvage cold storage / processing plant
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from auth import get_current_user
from models import TransitInterceptRequest, TransitInterceptResponse
from engines.proactive_routing import (
    evaluate_proactive_mid_route_intercept,
    find_salvage_facilities_postgis,
)

logger = logging.getLogger("FreshGuardLogisticsRouter")
router = APIRouter(prefix="/api/v5/logistics", tags=["Spatial Logistics & Intercept"])


@router.post("/transit-intercept", response_model=TransitInterceptResponse)
async def evaluate_transit_integrity(
    payload: TransitInterceptRequest,
    user: dict = Depends(get_current_user),
):
    """
    Proactively checks biological health mid-route.
    If accumulated Q10 thermal degree-hours and continuous degradation index D_i
    outpace remaining arrival time + market buffer, triggers an immediate
    spatial diversion to the nearest eligible PostGIS salvage facility.
    """
    try:
        result = evaluate_proactive_mid_route_intercept(
            batch_id=payload.batch_id,
            crop=payload.crop_type,
            quantity_kg=payload.quantity_kg,
            current_lat=payload.current_lat,
            current_lon=payload.current_lon,
            remaining_transit_hours=payload.remaining_transit_hours,
            ambient_temp_c=payload.ambient_temp_c,
            degradation_index=payload.degradation_index,
            ethylene_ppm=payload.ethylene_ppm,
            primary_mandi_name=payload.primary_mandi_name or "Vashi APMC Mumbai",
            primary_mandi_price_per_kg=payload.primary_mandi_price_per_kg or 34.0,
            search_radius_km=payload.search_radius_km or 80.0,
        )

        return TransitInterceptResponse(
            batch_id=result["batch_id"],
            routing_status=result["routing_status"],
            risk_tier=result["risk_tier"],
            target_facility=result["target_facility"],
            facility_type=result["facility_type"],
            distance_to_target_km=result.get("distance_to_target_km"),
            salvage_net_payout_inr=result.get("salvage_net_payout_inr"),
            residual_shelf_life_hours=result["residual_shelf_life_hours"],
            remaining_transit_hours=result["remaining_transit_hours"],
            diversion_recommended=result["diversion_recommended"],
            reason=result["reason"],
            candidate_fallbacks=result.get("candidate_fallbacks", []),
        )

    except Exception as e:
        logger.error(f"Transit intercept evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Logistics intercept evaluation error: {str(e)}")


@router.get("/fallback-facilities")
async def list_nearby_salvage_facilities(
    lat: float = Query(..., description="Current latitude"),
    lon: float = Query(..., description="Current longitude"),
    radius_km: float = Query(default=80.0, description="Search radius in kilometers"),
    user: dict = Depends(get_current_user),
):
    """
    Queries PostGIS spatial directory (with offline fallback) for active
    secondary salvage processing plants and cold storages within a geographic radius.
    """
    try:
        facilities = find_salvage_facilities_postgis(lat=lat, lon=lon, search_radius_km=radius_km)
        return {
            "query_coordinates": {"lat": lat, "lon": lon},
            "search_radius_km": radius_km,
            "facilities_found": len(facilities),
            "facilities": facilities,
        }
    except Exception as e:
        logger.error(f"Failed to query fallback facilities: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve salvage facilities.")
