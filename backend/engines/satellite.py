"""
ISRO Bhoonidhi Satellite NDVI Intelligence Engine

Tiered Spatial Intelligence Matrix:
  Tier 1 — ISRO Bhoonidhi/VEDAS open satellite NDVI grid (250m resolution)
  Tier 2 — Optional private drone UAV orthomosaic (cm-level resolution)

Applies a shelf-life modifier based on pre-harvest vegetation stress.
"""

import os
import logging
from typing import List, Dict, Any, Optional

from bhoonidhi_client import BhoonidhiClient

logger = logging.getLogger("FreshGuardSatellite")


class SatelliteDataCore:
    """
    Fetches NDVI vegetation indices from ISRO Bhoonidhi STAC API
    and computes a shelf-life modifier based on vegetation stress.

    Healthy vegetation (NDVI ≥ 0.65) → modifier 1.00 (no penalty)
    Stressed vegetation (NDVI < 0.40) → modifier 0.85 (15% shelf-life penalty)
    """

    SATELLITE_MODIFIER_THRESHOLDS = {
        "ndvi_stress": 0.40,
        "ndvi_healthy": 0.65,
    }

    def __init__(self):
        self.client = BhoonidhiClient()

    def compute_ndvi_modifier(self, ndvi_value: float) -> float:
        """Convert raw NDVI value to a shelf-life modifier (0.85–1.00)."""
        if ndvi_value < self.SATELLITE_MODIFIER_THRESHOLDS["ndvi_stress"]:
            return 0.85
        elif ndvi_value >= self.SATELLITE_MODIFIER_THRESHOLDS["ndvi_healthy"]:
            return 1.00
        else:
            range_span = self.SATELLITE_MODIFIER_THRESHOLDS["ndvi_healthy"] - self.SATELLITE_MODIFIER_THRESHOLDS["ndvi_stress"]
            position = ndvi_value - self.SATELLITE_MODIFIER_THRESHOLDS["ndvi_stress"]
            return round(0.85 + (position / range_span) * 0.15, 2)

    def extract_ndvi_from_features(self, features: List[Dict[str, Any]]) -> Optional[float]:
        """Extract the best (most recent) NDVI value from STAC feature properties."""
        if not features:
            return None

        best_ndvi = None
        best_date = ""

        for feature in features:
            props = feature.get("properties", {})
            ndvi = (
                props.get("ndvi_mean")
                or props.get("ndvi")
                or props.get("NDVI")
                or props.get("eo:ndvi")
                or props.get("band_statistics", {}).get("NDVI", {}).get("mean")
            )
            if ndvi is not None:
                try:
                    ndvi_val = float(ndvi)
                    date_str = props.get("datetime", "") or props.get("eo:datetime", "")
                    if date_str > best_date or best_ndvi is None:
                        best_ndvi = ndvi_val
                        best_date = date_str
                except (ValueError, TypeError):
                    continue

        return best_ndvi

    async def fetch_satellite_intelligence(
        self,
        latitude: Optional[float],
        longitude: Optional[float],
    ) -> Dict[str, Any]:
        """
        Fetch NDVI satellite data from ISRO Bhoonidhi for given GPS coordinates.
        Returns NDVI value, modifier, and API status.
        """
        result = {
            "source": "ISRO_BHOONIDHI",
            "latitude": latitude,
            "longitude": longitude,
            "ndvi_value": None,
            "ndvi_modifier": 1.00,
            "modifier_applied": False,
            "api_status": "SKIPPED",
            "grid_features_found": 0,
        }

        if latitude is None or longitude is None:
            result["api_status"] = "NO_GPS_COORDINATES"
            return result

        try:
            if not os.environ.get("ISRO_BHOONIDHI_USER_ID"):
                result["api_status"] = "CREDENTIALS_NOT_CONFIGURED"
                return result

            auth_ok = self.client.authenticate()
            if not auth_ok:
                result["api_status"] = "AUTH_FAILED"
                return result

            features = self.client.search_ndvi_data(
                latitude=latitude,
                longitude=longitude,
                radius_km=10.0,
            )

            result["grid_features_found"] = len(features)
            ndvi = self.extract_ndvi_from_features(features)

            if ndvi is not None:
                ndvi = max(-1.0, min(1.0, ndvi))
                modifier = self.compute_ndvi_modifier(ndvi)
                result["ndvi_value"] = round(ndvi, 3)
                result["ndvi_modifier"] = modifier
                result["modifier_applied"] = True
                result["api_status"] = "SUCCESS"
            else:
                result["api_status"] = "NO_NDVI_IN_FEATURES"

        except Exception as e:
            result["api_status"] = "ERROR"
            logger.error(f"Satellite layer exception: {str(e)}")

        return result


# Module-level singleton — imported by harvest router
satellite_core = SatelliteDataCore()
