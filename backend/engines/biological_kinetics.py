"""
Advanced Biological Kinetics & Respiration Engine

Couples continuous vision degradation metrics (D_i ∈ [0.0, 1.0]) with:
- Non-linear Q10 Arrhenius respiration velocity
- Climacteric autocatalytic ethylene gas accumulation physics
- Dynamic durability curve mapping
- Real-time in-transit residual shelf life forecasting
"""

import math
from typing import Dict, Any, Optional

# Calibrated ICAR Post-Harvest Physical Constants
CROP_Q10_CONSTANTS = {
    "tomatoes": 2.2,
    "tomato": 2.2,
    "mangoes": 2.5,
    "mango": 2.5,
    "onions": 2.0,
    "onion": 2.0,
    "papayas": 2.3,
    "papaya": 2.3,
}

# Standard baseline shelf life at 12°C baseline temperature (hours)
CROP_BASE_SHELF_LIFE_HOURS = {
    "tomatoes": 120.0,  # 5 days
    "tomato": 120.0,
    "mangoes": 168.0,   # 7 days
    "mango": 168.0,
    "onions": 720.0,    # 30 days
    "onion": 720.0,
    "papayas": 96.0,    # 4 days
    "papaya": 96.0,
}

# Ethylene sensitivity by crop category
CROP_ETHYLENE_SENSITIVITY = {
    "tomatoes": 0.05,
    "tomato": 0.05,
    "mangoes": 0.08,
    "mango": 0.08,
    "onions": 0.01,
    "onion": 0.01,
    "papayas": 0.07,
    "papaya": 0.07,
}


def calculate_durability_multiplier(degradation_index: float) -> float:
    """
    Translates continuous computer vision degradation index (D_i ∈ [0.0, 1.0])
    into dynamic biological durability.
    
    Formula:
        Multiplier = max(0.05, 1.0 - (D_i * 0.70))
    """
    d_i = max(0.0, min(1.0, float(degradation_index)))
    return max(0.05, 1.0 - (d_i * 0.70))


def calculate_q10_respiration_velocity(crop: str, temp_ambient_c: float) -> float:
    """
    Computes Arrhenius/Q10 non-linear thermal decay speed above 12°C baseline:
    
    Respiration Velocity = (Q10)^((T_ambient - 12.0) / 10.0)
    """
    crop_key = crop.lower().strip()
    q10 = CROP_Q10_CONSTANTS.get(crop_key, 2.0)
    temp_delta = max(0.0, temp_ambient_c - 12.0)
    return math.pow(q10, temp_delta / 10.0)


def calculate_ethylene_penalty(crop: str, ethylene_ppm: float) -> float:
    """
    Autocatalytic climacteric acceleration penalty.
    Produce co-loaded in unventilated freight undergoes accelerated ripening.
    """
    if ethylene_ppm <= 0.5:
        return 1.0

    crop_key = crop.lower().strip()
    sensitivity = CROP_ETHYLENE_SENSITIVITY.get(crop_key, 0.04)
    multiplier = 1.0 + (ethylene_ppm * sensitivity)
    return min(4.0, multiplier)


def calculate_residual_shelf_life(
    crop: str,
    degradation_index: float,
    temp_ambient_c: float,
    ethylene_ppm: float = 0.0,
    transit_duration_hours: float = 0.0,
    ndvi_modifier: float = 1.0,
    base_hours: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Synthesizes continuous vision metrics, thermal Degree-Hours, and gas dynamics
    to compute exact residual transit shelf life.
    """
    crop_key = crop.lower().strip()
    if base_hours is None:
        base_hours = CROP_BASE_SHELF_LIFE_HOURS.get(crop_key, 120.0)

    # 1. Biological durability from continuous vision model
    durability = calculate_durability_multiplier(degradation_index)

    # 2. Thermal acceleration velocity
    thermal_velocity = calculate_q10_respiration_velocity(crop_key, temp_ambient_c)

    # 3. Gas dispersion penalty
    ethylene_mult = calculate_ethylene_penalty(crop_key, ethylene_ppm)

    # 4. Effective unified decay rate
    effective_decay_rate = thermal_velocity * ethylene_mult

    # 5. Pre-transit initial shelf life under current biological stress
    adjusted_initial_hours = base_hours * durability * ndvi_modifier

    # 6. Degradation incurred during transit
    hours_consumed_in_transit = transit_duration_hours * effective_decay_rate
    residual_hours = max(0.0, adjusted_initial_hours - hours_consumed_in_transit)

    return {
        "crop": crop,
        "degradation_index": round(degradation_index, 4),
        "durability_multiplier": round(durability, 3),
        "thermal_decay_velocity": round(thermal_velocity, 2),
        "ethylene_penalty": round(ethylene_mult, 2),
        "effective_decay_rate": round(effective_decay_rate, 2),
        "adjusted_initial_hours": round(adjusted_initial_hours, 1),
        "residual_shelf_life_hours": round(residual_hours, 1),
        "residual_shelf_life_days": round(residual_hours / 24.0, 2),
    }


def evaluate_transit_viability(
    crop: str,
    degradation_index: float,
    temp_ambient_c: float,
    remaining_transit_hours: float,
    ethylene_ppm: float = 0.0,
    ndvi_modifier: float = 1.0,
    market_turnaround_delay_hours: float = 4.0,
) -> Dict[str, Any]:
    """
    Proactively determines whether a crop batch in transit will survive to
    the primary APMC mandi and through its 4-hour market turnaround auction.
    """
    kinetics = calculate_residual_shelf_life(
        crop=crop,
        degradation_index=degradation_index,
        temp_ambient_c=temp_ambient_c,
        ethylene_ppm=ethylene_ppm,
        transit_duration_hours=remaining_transit_hours,
        ndvi_modifier=ndvi_modifier,
    )

    residual_hours = kinetics["residual_shelf_life_hours"]
    required_safe_hours = remaining_transit_hours + market_turnaround_delay_hours

    # Safety margin comparison
    is_safe = residual_hours >= required_safe_hours
    hours_deficit = round(required_safe_hours - residual_hours, 1)

    if is_safe:
        risk_level = "SAFE"
        diagnosis = (
            f"Produce will arrive with {residual_hours:.1f}h shelf-life remaining "
            f"(comfortably exceeding required {required_safe_hours:.1f}h window)."
        )
    elif residual_hours >= remaining_transit_hours:
        risk_level = "VULNERABLE"
        diagnosis = (
            f"Produce will reach mandi with only {residual_hours:.1f}h shelf-life, "
            f"leaving insufficient buffer for market turnaround (deficit: {hours_deficit:.1f}h). High risk of dock rejection."
        )
    else:
        risk_level = "CRITICAL_SPOILAGE_RISK"
        diagnosis = (
            f"Terminal spoilage hazard: Crop will decompose in transit ({residual_hours:.1f}h remaining vs "
            f"{remaining_transit_hours:.1f}h transit time). Immediate mid-route diversion required."
        )

    return {
        "is_safe": is_safe,
        "risk_level": risk_level,
        "residual_shelf_life_hours": residual_hours,
        "residual_shelf_life_days": round(residual_hours / 24.0, 2),
        "required_safe_hours": required_safe_hours,
        "hours_deficit": max(0.0, hours_deficit),
        "diagnosis": diagnosis,
        "kinetics": kinetics,
    }
