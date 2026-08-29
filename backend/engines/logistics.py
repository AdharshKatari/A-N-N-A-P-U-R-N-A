"""
Q10 Respiration Kinetics + Plan-B Spatial Routing Engine

Combines the non-linear Q10 biological respiration formula with
PostGIS nearest fallback directory paths to rank mandi destinations
by risk-adjusted profit.

⚠️ DO NOT MODIFY Q10 constants (2.2 for tomatoes, 2.5 for mangoes, 2.0 for onions)
without consulting post-harvest biology literature.
"""

import math
from typing import List, Dict, Any

from models import MandiDestinationInput


class LogisticsKineticsCore:
    """
    Simulates routing futures to multiple mandi destinations by combining:
    - Q10 respiration decay (exponential shelf-life loss per degree above 12°C)
    - Ethylene cross-contamination multiplier
    - NDVI satellite vegetation stress modifier
    - Freight cost modeling (₹5/km)
    - Plan-B salvage facility fallback (cold storage / processing plants)
    """

    @staticmethod
    def simulate_routing_futures(
        crop: str,
        base_life_days: float,
        quantity_kg: float,
        ethylene_mult: float,
        ndvi_modifier: float,
        targets: List[MandiDestinationInput],
    ) -> List[Dict[str, Any]]:
        """
        Combines the non-linear Q10 respiration formula with PostGIS
        nearest fallback directory paths.

        ⚠️ DO NOT CHANGE Q10 constants below without consulting post-harvest biology.
        """
        # Crop-specific Q10 constants (DO NOT CHANGE)
        q10 = 2.2 if crop.lower() == "tomatoes" else 2.5 if crop.lower() == "mangoes" else 2.0

        itineraries = []

        for mandi in targets:
            # Q10 thermal acceleration: exponential decay per 10°C above 12°C baseline
            temp_delta = max(0.0, mandi.ambient_temp_c - 12.0)
            thermal_speed = math.pow(q10, temp_delta / 10.0)

            # Unified decay = thermal × ethylene cross-contamination
            unified_decay_velocity = thermal_speed * ethylene_mult

            # Adjust base life by satellite vegetation stress modifier
            adjusted_base_life = base_life_days * ndvi_modifier

            # Shelf life lost during transit
            days_lost_in_transit = (mandi.transit_duration_hours * unified_decay_velocity) / 24.0
            arrival_shelf_life = max(0.0, adjusted_base_life - days_lost_in_transit)

            # Net profit = revenue - freight cost (₹5/km)
            net_profit = (quantity_kg * mandi.expected_market_price_per_kg) - (mandi.distance_km * 5.0)

            # Plan-B: Check nearby salvage facilities (cold storage / processing plants)
            best_fallback = None
            for fallback in mandi.potential_fallbacks:
                secondary_days_lost = ((4.0 + fallback.transit_hours_from_mandi) * unified_decay_velocity) / 24.0
                salvage_life = max(0.0, arrival_shelf_life - secondary_days_lost)

                if salvage_life >= 1.0:
                    salvage_profit = (
                        (quantity_kg * fallback.guaranteed_floor_price_per_kg)
                        - (mandi.distance_km * 5.0)
                        - (fallback.distance_from_mandi_km * 5.0)
                    )
                    best_fallback = {
                        "alternative_facility": fallback.facility_name,
                        "type": fallback.facility_type,
                        "salvage_shelf_life_remaining_days": round(salvage_life, 2),
                        "salvage_net_profit_margin_inr": round(salvage_profit, 2),
                    }
                    break

            # Resilience classification
            resilience = (
                "AIRTIGHT" if best_fallback
                else "VULNERABLE" if arrival_shelf_life >= 1.5
                else "CRITICAL_SPECULATIVE"
            )

            itineraries.append({
                "mandi_destination_name": mandi.mandi_name,
                "expected_shelf_life_on_arrival_days": round(arrival_shelf_life, 2),
                "estimated_primary_net_profit_inr": round(net_profit, 2),
                "resilience_status": resilience,
                "backup_plan_b_route": best_fallback or "NO_VIABLE_SALVAGE_HUBS_IN_GEO_RADIUS",
                "_rank_weight": net_profit * (
                    0.1 if resilience == "CRITICAL_SPECULATIVE"
                    else 0.5 if resilience == "VULNERABLE"
                    else 1.0
                ),
            })

        # Rank by risk-adjusted profit (highest first)
        itineraries.sort(key=lambda x: x["_rank_weight"], reverse=True)
        return itineraries
