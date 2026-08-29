"""
What-If Scenario Simulation

Simulates multiple sell/store/transport scenarios for a crop batch
using Q10 biological decay models + market economics.

Endpoint:
  POST /api/v5/whatif/simulate
"""

import datetime
import logging
import math
from typing import Optional

from fastapi import APIRouter, Depends, Request

from auth import get_optional_user
from rate_limit import limiter
from models import WhatIfRequest

logger = logging.getLogger("FreshGuardWhatIf")
router = APIRouter(tags=["whatif"])


def _estimate_local_price(crop: str) -> float:
    """Estimate local mandi price per kg based on crop type."""
    default_prices = {
        "tomato": 25.0, "tomatoes": 25.0,
        "mango": 35.0, "mangoes": 35.0,
        "onion": 18.0, "onions": 18.0,
        "potato": 15.0, "potatoes": 15.0,
    }
    return default_prices.get(crop.lower(), 22.0)


async def _fetch_weather_safe(latitude: float, longitude: float) -> Optional[dict]:
    """Safely fetch weather — used internally, never raises."""
    try:
        from routers.weather import get_weather
        return await get_weather(latitude=latitude, longitude=longitude)
    except Exception:
        return None


@router.post("/api/v5/whatif/simulate")
@limiter.limit("30/minute")  # Moderate limit: simulation is CPU-intensive
async def simulate_whatif_scenarios(request: Request, whatif_request: WhatIfRequest, user: dict = Depends(get_optional_user)):
    """
    Simulates multiple sell/store/transport scenarios for a crop batch.
    Uses Q10 biological decay models + market economics to compare:
    1. Sell locally now
    2. Transport to a distant mandi
    3. Store overnight and sell tomorrow
    4. Send to processing plant

    Returns ranked options with expected net profit, risk level, and shelf life impact.
    """
    crop = whatif_request.crop_type
    quantity = whatif_request.quantity_kg
    visual_score = whatif_request.visual_score
    temp_c = whatif_request.ambient_temp_c
    ethylene_mult = whatif_request.ethylene_multiplier

    # Compute base shelf life from visual score
    base_shelf_lives = {"tomato": 14, "tomatoes": 14, "mango": 10, "mangoes": 10, "onion": 21, "onions": 21, "potato": 30, "potatoes": 30}
    base_life = base_shelf_lives.get(crop.lower(), 14) * (visual_score / 100.0)

    # Q10 decay velocity
    q10_constants = {"tomato": 2.2, "tomatoes": 2.2, "mango": 2.5, "mangoes": 2.5, "onion": 2.0, "onions": 2.0}
    q10 = q10_constants.get(crop.lower(), 2.0)
    temp_delta = max(0.0, temp_c - 12.0)
    thermal_acceleration = math.pow(q10, temp_delta / 10.0)
    decay_velocity = thermal_acceleration * ethylene_mult

    # Fetch weather if coordinates provided
    weather_info = None
    if whatif_request.latitude and whatif_request.longitude:
        weather_info = await _fetch_weather_safe(whatif_request.latitude, whatif_request.longitude)

    # Define scenarios
    scenarios = []

    # Scenario 1: Sell locally now
    local_price = _estimate_local_price(crop)
    local_shelf_remaining = base_life  # No transit time
    local_net = quantity * local_price - (quantity * 0.02)  # 2% handling cost
    scenarios.append({
        "id": "sell_local",
        "title": "Sell locally today",
        "subtitle": "Low risk, moderate price",
        "icon": "🏪",
        "estimated_price_per_kg": local_price,
        "expected_net_profit_inr": round(local_net, 2),
        "shelf_life_remaining_days": round(local_shelf_remaining, 1),
        "risk_level": "LOW",
        "risk_score": 10,
        "decay_velocity": round(decay_velocity, 2),
        "reasoning": [
            "No transit delay — zero shelf life loss",
            "Immediate cash flow for the farmer",
            f"Shelf life preserved at {local_shelf_remaining:.1f} days",
        ],
    })

    # Scenario 2: Transport to distant mandi (6-8 hours)
    distant_mandi_distance = 200.0  # km
    distant_transit_hours = 7.0
    distant_price = local_price * 1.4  # 40% premium for bigger market
    days_lost_transit = (distant_transit_hours * decay_velocity) / 24.0
    distant_shelf = max(0.0, base_life - days_lost_transit)
    distant_net = (quantity * distant_price) - (distant_mandi_distance * 5.0)  # Rs 5/km freight
    distant_risk = "LOW" if distant_shelf > 5 else "MEDIUM" if distant_shelf > 2 else "HIGH"
    scenarios.append({
        "id": "transport_distant",
        "title": "Send to distant market",
        "subtitle": f"Higher price, {distant_transit_hours}h transit",
        "icon": "🚛",
        "estimated_price_per_kg": round(distant_price, 2),
        "expected_net_profit_inr": round(distant_net, 2),
        "shelf_life_remaining_days": round(distant_shelf, 1),
        "risk_level": distant_risk,
        "risk_score": 20 if distant_risk == "LOW" else 50 if distant_risk == "MEDIUM" else 80,
        "decay_velocity": round(decay_velocity, 2),
        "transit_hours": distant_transit_hours,
        "freight_cost_inr": round(distant_mandi_distance * 5.0, 2),
        "destination": {
            "name": "Mumbai Vashi APMC",
            "type": "Mandi",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "distance": distant_mandi_distance,
            "price": distant_price
        },
        "reasoning": [
            f"Market price premium of ~40% for bigger mandi",
            f"Transit loses {days_lost_transit:.1f} days of shelf life",
            f"Freight cost: ₹{distant_mandi_distance * 5:.0f} at ₹5/km",
            f"Residual shelf life on arrival: {distant_shelf:.1f} days",
        ],
    })

    # Scenario 3: Store overnight (sell tomorrow — 24h delay)
    store_hours = 24.0
    store_days_lost = (store_hours * decay_velocity) / 24.0
    store_shelf = max(0.0, base_life - store_days_lost)
    tomorrow_price = local_price * 1.15  # 15% possible price increase
    store_cost = quantity * 2.5  # Storage cost Rs 2.5/kg
    store_net = (quantity * tomorrow_price) - store_cost
    store_risk = "LOW" if store_shelf > 6 else "MEDIUM" if store_shelf > 3 else "HIGH"
    scenarios.append({
        "id": "store_overnight",
        "title": "Store overnight",
        "subtitle": "Possible higher price tomorrow",
        "icon": "❄️",
        "estimated_price_per_kg": round(tomorrow_price, 2),
        "expected_net_profit_inr": round(store_net, 2),
        "shelf_life_remaining_days": round(store_shelf, 1),
        "risk_level": store_risk,
        "risk_score": 15 if store_risk == "LOW" else 45 if store_risk == "MEDIUM" else 75,
        "decay_velocity": round(decay_velocity, 2),
        "storage_cost_inr": round(store_cost, 2),
        "destination": {
            "name": "Nashik Cold Storage",
            "type": "Cold Storage",
            "latitude": 20.0110,
            "longitude": 73.7900,
            "distance": 15.0,
            "price": tomorrow_price
        },
        "reasoning": [
            f"24h storage costs ₹{store_cost:.0f} (₹2.5/kg)",
            f"Price may rise ~15% tomorrow (speculative)",
            f"Shelf life reduced by {store_days_lost:.1f} days due to decay",
            f"Remaining shelf life: {store_shelf:.1f} days",
        ],
    })

    # Scenario 4: Send to processing plant
    processing_price = local_price * 0.65  # 35% discount for lower grade
    processing_net = quantity * processing_price
    scenarios.append({
        "id": "processing",
        "title": "Send to processing",
        "subtitle": "Lower grade recovery, guaranteed sale",
        "icon": "🏭",
        "estimated_price_per_kg": round(processing_price, 2),
        "expected_net_profit_inr": round(processing_net, 2),
        "shelf_life_remaining_days": 0.0,
        "risk_level": "LOW",
        "risk_score": 5,
        "decay_velocity": round(decay_velocity, 2),
        "reasoning": [
            "Guaranteed floor price regardless of visual quality",
            "Zero transit risk — typically nearby",
            "Lower recovery (~65% of market price)",
            "Best option if visual score is below 40",
        ],
    })

    # Sort by risk-adjusted profit (net profit weighted by risk)
    risk_weight = {"LOW": 1.0, "MEDIUM": 0.7, "HIGH": 0.3}
    for s in scenarios:
        s["_risk_adjusted_score"] = s["expected_net_profit_inr"] * risk_weight.get(s["risk_level"], 0.5)
    scenarios.sort(key=lambda x: x["_risk_adjusted_score"], reverse=True)

    # Mark top recommendation
    scenarios[0]["is_recommended"] = True
    for s in scenarios[1:]:
        s["is_recommended"] = False

    return {
        "crop_type": crop,
        "quantity_kg": quantity,
        "visual_score": visual_score,
        "ambient_temp_c": temp_c,
        "decay_velocity": round(decay_velocity, 2),
        "base_shelf_life_days": round(base_life, 1),
        "weather": weather_info,
        "scenarios": scenarios,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
