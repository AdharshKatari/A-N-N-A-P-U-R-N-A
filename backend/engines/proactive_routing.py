"""
Proactive PostGIS Mid-Route Spatial Routing & Diversion Hub

Prevents terminal APMC market rejections by proactively intercepting shipments
during transit. If thermal degree-hours or biological degradation velocity (D_i)
threaten to spoil produce before destination arrival + turnaround delay,
the system executes spatial queries (PostGIS ST_DWithin / ST_Distance) to reroute
the vehicle mid-transit to the nearest active cold storage or processing plant.
"""

import math
import logging
from typing import Dict, Any, List, Optional
from engines.biological_kinetics import evaluate_transit_viability
from db import db

logger = logging.getLogger("FreshGuardProactiveRouting")

# Default offline spatial directory of secondary salvage facilities (for rural network blackouts)
OFFLINE_SALVAGE_FACILITIES = [
    {
        "facility_id": "FAC-001",
        "facility_name": "Chittoor Tomato Pulp Factory",
        "facility_type": "Processing_Plant",
        "guaranteed_floor_price_per_kg": 18.00,
        "longitude": 78.62,
        "latitude": 13.68,
        "is_active": True,
    },
    {
        "facility_id": "FAC-002",
        "facility_name": "Tirupati Cold Storage Hub",
        "facility_type": "Cold_Storage",
        "guaranteed_floor_price_per_kg": 22.50,
        "longitude": 78.70,
        "latitude": 13.65,
        "is_active": True,
    },
    {
        "facility_id": "FAC-003",
        "facility_name": "Kadapa Fruit Processing Unit",
        "facility_type": "Processing_Plant",
        "guaranteed_floor_price_per_kg": 15.00,
        "longitude": 78.80,
        "latitude": 14.45,
        "is_active": True,
    },
    {
        "facility_id": "FAC-004",
        "facility_name": "Nellore Cold Chain Depot",
        "facility_type": "Cold_Storage",
        "guaranteed_floor_price_per_kg": 20.00,
        "longitude": 79.95,
        "latitude": 14.45,
        "is_active": True,
    },
    {
        "facility_id": "FAC-005",
        "facility_name": "Nashik Agro Processing Cluster",
        "facility_type": "Processing_Plant",
        "guaranteed_floor_price_per_kg": 19.50,
        "longitude": 73.78,
        "latitude": 19.99,
        "is_active": True,
    },
    {
        "facility_id": "FAC-006",
        "facility_name": "Vashi Cold Vault Logistics",
        "facility_type": "Cold_Storage",
        "guaranteed_floor_price_per_kg": 24.00,
        "longitude": 72.99,
        "latitude": 19.07,
        "is_active": True,
    },
]


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance in kilometers between two GPS points."""
    r = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def find_salvage_facilities_postgis(
    lat: float,
    lon: float,
    search_radius_km: float = 75.0,
) -> List[Dict[str, Any]]:
    """
    Executes PostGIS spatial query using geography casting and ST_DWithin.
    Falls back gracefully to offline spatial directory if database is unavailable.
    """
    pool = db
    if pool.is_connected:
        try:
            radius_meters = search_radius_km * 1000.0
            query = """
                SELECT 
                    facility_id::text,
                    facility_name,
                    facility_type,
                    guaranteed_floor_price_per_kg::float,
                    ST_X(location_geom) as lon,
                    ST_Y(location_geom) as lat,
                    ST_Distance(location_geom, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) / 1000.0 as dist_km
                FROM secondary_salvage_facilities
                WHERE is_active = TRUE
                  AND ST_DWithin(location_geom, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
                ORDER BY dist_km ASC
                LIMIT 5;
            """
            with pool.cursor() as cur:
                cur.execute(query, (lon, lat, lon, lat, radius_meters))
                rows = cur.fetchall()
                if rows:
                    results = []
                    for r in rows:
                        results.append({
                            "facility_id": r[0],
                            "facility_name": r[1],
                            "facility_type": r[2],
                            "guaranteed_floor_price_per_kg": float(r[3]),
                            "longitude": float(r[4]),
                            "latitude": float(r[5]),
                            "distance_km": round(float(r[6]), 2),
                        })
                    return results
        except Exception as e:
            logger.warning(f"PostGIS query failed: {e}. Utilizing offline spatial matrix.")

    # Offline spatial search fallback
    offline_results = []
    for fac in OFFLINE_SALVAGE_FACILITIES:
        if not fac.get("is_active", True):
            continue
        dist = haversine_distance_km(lat, lon, fac["latitude"], fac["longitude"])
        if dist <= search_radius_km:
            item = dict(fac)
            item["distance_km"] = round(dist, 2)
            offline_results.append(item)

    offline_results.sort(key=lambda x: x["distance_km"])
    return offline_results[:5]


def evaluate_proactive_mid_route_intercept(
    batch_id: str,
    crop: str,
    quantity_kg: float,
    current_lat: float,
    current_lon: float,
    remaining_transit_hours: float,
    ambient_temp_c: float,
    degradation_index: float,
    ethylene_ppm: float = 0.0,
    primary_mandi_name: str = "Vashi APMC Mumbai",
    primary_mandi_price_per_kg: float = 34.0,
    search_radius_km: float = 80.0,
) -> Dict[str, Any]:
    """
    Core Spatial Intercept Logic:
    1. Runs biological kinetics to evaluate crop survival to primary destination.
    2. If safe, confirms ON_SCHEDULE status.
    3. If decay outpaces arrival, triggers proactive DIVERSION_TRIGGERED alert.
    4. Evaluates fallback facilities by distance, salvage floor price, and salvage shelf life.
    """
    # 1. Evaluate biological kinetics
    viability = evaluate_transit_viability(
        crop=crop,
        degradation_index=degradation_index,
        temp_ambient_c=ambient_temp_c,
        remaining_transit_hours=remaining_transit_hours,
        ethylene_ppm=ethylene_ppm,
    )

    residual_hours = viability["residual_shelf_life_hours"]

    # 2. Check if primary route is safe
    if viability["is_safe"]:
        projected_primary_revenue = quantity_kg * primary_mandi_price_per_kg
        return {
            "batch_id": batch_id,
            "routing_status": "ON_SCHEDULE",
            "risk_tier": viability["risk_level"],
            "target_facility": primary_mandi_name,
            "facility_type": "PRIMARY_APMC_MANDI",
            "residual_shelf_life_hours": residual_hours,
            "remaining_transit_hours": remaining_transit_hours,
            "projected_revenue_inr": round(projected_primary_revenue, 2),
            "reason": viability["diagnosis"],
            "diversion_recommended": False,
            "candidate_fallbacks": [],
        }

    # 3. Spoilage hazard detected — trigger mid-route spatial intercept!
    logger.warning(
        f"Batch {batch_id} at risk! Residual hours {residual_hours:.1f}h < "
        f"transit {remaining_transit_hours:.1f}h + turnaround buffer. Triggering spatial intercept."
    )

    fallbacks = find_salvage_facilities_postgis(
        lat=current_lat,
        lon=current_lon,
        search_radius_km=search_radius_km,
    )

    if not fallbacks:
        # Fallback to wider 150km search if no facilities within primary radius
        fallbacks = find_salvage_facilities_postgis(
            lat=current_lat,
            lon=current_lon,
            search_radius_km=search_radius_km * 2.0,
        )

    scored_fallbacks = []
    effective_decay_rate = viability["kinetics"]["effective_decay_rate"]

    for fb in fallbacks:
        # Estimate transit time to salvage facility (assuming ~40 km/h local truck speed + 0.5h unloading)
        salvage_transit_hours = (fb["distance_km"] / 40.0) + 0.5
        salvage_shelf_life = max(0.0, residual_hours - (salvage_transit_hours * effective_decay_rate))

        # Freight cost to salvage facility: ₹5.50/km
        freight_cost = fb["distance_km"] * 5.50
        salvage_gross = quantity_kg * fb["guaranteed_floor_price_per_kg"]
        salvage_net = max(0.0, salvage_gross - freight_cost)

        viable_for_facility = salvage_shelf_life >= 1.5

        scored_fallbacks.append({
            "facility_id": fb.get("facility_id", ""),
            "facility_name": fb["facility_name"],
            "facility_type": fb["facility_type"],
            "distance_km": fb["distance_km"],
            "salvage_transit_hours": round(salvage_transit_hours, 1),
            "salvage_shelf_life_remaining_hours": round(salvage_shelf_life, 1),
            "guaranteed_floor_price_per_kg": fb["guaranteed_floor_price_per_kg"],
            "estimated_salvage_net_payout_inr": round(salvage_net, 2),
            "is_viable": viable_for_facility,
        })

    # Sort fallbacks by: 1. viability, 2. net salvage payout
    viable_options = [f for f in scored_fallbacks if f["is_viable"]]
    if viable_options:
        viable_options.sort(key=lambda x: x["estimated_salvage_net_payout_inr"], reverse=True)
        recommended_target = viable_options[0]
    elif scored_fallbacks:
        scored_fallbacks.sort(key=lambda x: x["distance_km"])
        recommended_target = scored_fallbacks[0]
    else:
        recommended_target = None

    if recommended_target:
        intercept_reason = (
            f"PROACTIVE DIVERSION TRIGGERED: Biological degradation index (D_i={degradation_index:.2f}) "
            f"and thermal load ({ambient_temp_c}°C) will cause batch rejection before {primary_mandi_name}. "
            f"Rerouting to '{recommended_target['facility_name']}' ({recommended_target['distance_km']} km away) "
            f"guarantees salvage payout of ₹{recommended_target['estimated_salvage_net_payout_inr']:,.2f} "
            f"and preserves {recommended_target['salvage_shelf_life_remaining_hours']}h residual life."
        )
    else:
        intercept_reason = (
            f"CRITICAL SPOILAGE IMMINENT: Residual life ({residual_hours:.1f}h) is insufficient to reach primary mandi, "
            "and no active Plan-B salvage facilities were found within spatial search radius."
        )

    return {
        "batch_id": batch_id,
        "routing_status": "DIVERSION_TRIGGERED",
        "risk_tier": viability["risk_level"],
        "target_facility": recommended_target["facility_name"] if recommended_target else "NONE_AVAILABLE",
        "facility_type": recommended_target["facility_type"] if recommended_target else "NONE",
        "distance_to_target_km": recommended_target["distance_km"] if recommended_target else None,
        "salvage_net_payout_inr": recommended_target["estimated_salvage_net_payout_inr"] if recommended_target else 0.0,
        "residual_shelf_life_hours": residual_hours,
        "remaining_transit_hours": remaining_transit_hours,
        "diversion_recommended": True,
        "reason": intercept_reason,
        "candidate_fallbacks": scored_fallbacks,
    }
