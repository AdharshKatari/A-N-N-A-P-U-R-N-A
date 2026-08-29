"""
Weather Proxy and Spoilage Risk Alerts

Backend proxy for OpenWeatherMap — the mobile app doesn't need to manage API keys.
Also generates Q10-based spoilage risk alerts from weather data.

Endpoints:
  GET /api/v5/weather        — Current weather data
  GET /api/v5/weather/alerts — Spoilage risk alerts
"""

import datetime
import logging
import math
import os

import httpx
from fastapi import APIRouter, Query

logger = logging.getLogger("FreshGuardWeather")
router = APIRouter(tags=["weather"])


def _estimate_rain_chance(owm_data: dict) -> int:
    """Estimate rain probability from OWM cloud/rain data."""
    clouds = owm_data.get("clouds", {}).get("all", 0)
    rain_1h = owm_data.get("rain", {}).get("1h", 0)
    if rain_1h > 0:
        return min(100, int(rain_1h * 30 + 50))
    return min(100, max(0, int(clouds * 0.7)))


@router.get("/api/v5/weather")
async def get_weather(
    latitude: float = Query(...),
    longitude: float = Query(...),
):
    """
    Backend proxy for OpenWeatherMap. Returns current weather data.
    Falls back to internal defaults if OWM is unreachable.
    """
    owm_key = os.environ.get("OPENWEATHER_API_KEY") or os.environ.get("OWM_API_KEY")

    if not owm_key:
        # Return degraded fallback with realistic defaults
        return {
            "source": "INTERNAL_DEFAULTS",
            "temp": 32.0,
            "humidity": 60,
            "description": "Partly Cloudy",
            "icon": "02d",
            "feels_like": 34.0,
            "wind_speed": 4.5,
            "location_name": "Unknown",
            "rain_chance": 20,
            "api_status": "NO_API_KEY_CONFIGURED",
        }

    try:
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={latitude}&lon={longitude}&units=metric&appid={owm_key}"
        )
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

        main = data.get("main", {})
        wind = data.get("wind", {})
        weather_desc = data.get("weather", [{}])[0] if data.get("weather") else {}

        return {
            "source": "OPENWEATHERMAP_LIVE",
            "temp": round(main.get("temp", 0), 1),
            "humidity": main.get("humidity", 0),
            "description": weather_desc.get("description", "Clear"),
            "icon": weather_desc.get("icon", "01d"),
            "feels_like": round(main.get("feels_like", 0), 1),
            "wind_speed": wind.get("speed", 0),
            "location_name": data.get("name", "Unknown"),
            "rain_chance": _estimate_rain_chance(data),
            "api_status": "SUCCESS",
        }
    except Exception as e:
        logger.warning(f"Weather API failed, using fallback: {str(e)}")
        return {
            "source": "DEGRADED_FALLBACK",
            "temp": 32.0,
            "humidity": 60,
            "description": "Partly Cloudy",
            "icon": "02d",
            "feels_like": 34.0,
            "wind_speed": 4.5,
            "location_name": "Unknown",
            "rain_chance": 20,
            "api_status": "DEGRADED_FALLBACK",
        }


@router.get("/api/v5/weather/alerts")
async def get_weather_spoilage_alerts(
    latitude: float = Query(...),
    longitude: float = Query(...),
    crop_type: str = Query(default="Tomato"),
):
    """
    Generates spoilage-risk alerts based on current weather conditions
    and crop-specific Q10 biology. Combines weather data with thermal
    decay models to produce actionable warnings for farmers.
    """
    # 1. Fetch current weather
    weather = await get_weather(latitude=latitude, longitude=longitude)
    temp_c = weather["temp"]
    humidity = weather["humidity"]

    # 2. Compute Q10 thermal acceleration
    q10_constants = {"tomato": 2.2, "tomatoes": 2.2, "mango": 2.5, "mangoes": 2.5, "onion": 2.0, "onions": 2.0}
    q10 = q10_constants.get(crop_type.lower(), 2.0)
    temp_delta = max(0.0, temp_c - 12.0)
    thermal_acceleration = math.pow(q10, temp_delta / 10.0)

    # 3. Generate alerts based on thermal thresholds
    alerts = []

    if temp_c > 35:
        alerts.append({
            "severity": "CRITICAL",
            "icon": "🔴",
            "title": "Extreme heat warning",
            "description": f"Temperature at {temp_c}°C accelerates {crop_type.lower()} decay at {thermal_acceleration:.1f}x normal rate. Move to cold storage immediately.",
            "recommended_action": "Send to cold storage or sell immediately at nearest mandi",
            "spoilage_risk_pct": min(95, int(thermal_acceleration * 15)),
        })
    elif temp_c > 30:
        alerts.append({
            "severity": "HIGH",
            "icon": "🟠",
            "title": "High temperature risk",
            "description": f"At {temp_c}°C, respiration accelerates to {thermal_acceleration:.1f}x. Shelf life reduction expected.",
            "recommended_action": "Consider early sale or ensure ventilated transport",
            "spoilage_risk_pct": min(80, int(thermal_acceleration * 12)),
        })

    if humidity > 80:
        alerts.append({
            "severity": "MEDIUM",
            "icon": "🟡",
            "title": "High humidity — fungal risk elevated",
            "description": f"Humidity at {humidity}% promotes surface mold growth. Inspect for rot before transport.",
            "recommended_action": "Check produce for early signs of Botrytis or surface spores",
            "spoilage_risk_pct": min(70, int(humidity * 0.8)),
        })

    if weather.get("rain_chance", 0) > 50:
        alerts.append({
            "severity": "MEDIUM",
            "icon": "🌧️",
            "title": "Rain expected",
            "description": "Rain can increase transit delays and introduce moisture to open containers.",
            "recommended_action": "Cover open vehicles or delay departure until rain passes",
            "spoilage_risk_pct": 40,
        })

    if temp_c < 15:
        alerts.append({
            "severity": "LOW",
            "icon": "🟢",
            "title": "Cool conditions — favorable for transport",
            "description": f"Temperature at {temp_c}°C is near optimal for {crop_type.lower()} preservation.",
            "recommended_action": "Good conditions for long-distance transport",
            "spoilage_risk_pct": 5,
        })

    # Default message if no alerts triggered
    if not alerts:
        alerts.append({
            "severity": "LOW",
            "icon": "🟢",
            "title": "Conditions nominal",
            "description": f"Current weather is within safe range for {crop_type.lower()} transport.",
            "recommended_action": "No urgent action needed",
            "spoilage_risk_pct": 10,
        })

    return {
        "crop_type": crop_type,
        "weather_summary": {
            "temp_c": temp_c,
            "humidity_pct": humidity,
            "description": weather["description"],
            "rain_chance_pct": weather.get("rain_chance", 0),
        },
        "thermal_acceleration_factor": round(thermal_acceleration, 2),
        "alerts": alerts,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
