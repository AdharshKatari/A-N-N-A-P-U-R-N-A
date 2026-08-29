"""
Ethylene Gas Interaction Engine

Models chemical ethylene gas accumulation (PPM) inside sealed truck containers
during crop transit. Climacteric crops (tomatoes, mangoes) release ethylene
that accelerates ripening and decay in co-shipped produce.

⚠️ DO NOT MODIFY the gas interaction formula or sensitivity thresholds
without consulting post-harvest biology literature.
"""

from typing import List

from models import CropCoHabitant


class EthyleneGasCore:
    """
    Models ethylene gas cross-contamination between co-habitant crops
    in unventilated transit containers.

    Crop profiles define climacteric behavior and ethylene sensitivity.
    Non-climacteric, low-sensitivity crops (e.g., onions) are unaffected.
    """

    CROP_PROFILES = {
        "tomatoes": {"climacteric": True, "sensitivity": "HIGH"},
        "mangoes":  {"climacteric": True, "sensitivity": "HIGH"},
        "onions":   {"climacteric": False, "sensitivity": "LOW"},
    }

    @classmethod
    def compute_gas_multiplier(
        cls,
        crop: str,
        ripeness: str,
        co_habitants: List[CropCoHabitant],
        ventilated: bool,
    ) -> float:
        """
        Models chemical gas accumulation in PPM inside unventilated truck containers.

        Returns a multiplier (1.00 = safe, up to 4.00 = lethal) that amplifies
        the Q10 respiration decay rate.

        ⚠️ DO NOT CHANGE the formula below without consulting post-harvest biology.
        """
        p = cls.CROP_PROFILES.get(crop.lower(), {"climacteric": False, "sensitivity": "LOW"})
        if not p["climacteric"] and p["sensitivity"] == "LOW":
            return 1.00

        # Base gas load depends on ripeness stage
        gas_load = 5.0 if ripeness.lower() == "overripe" else 1.5 if ripeness.lower() == "optimal" else 0.2

        # Add ethylene contribution from co-habitant crops
        for comp in co_habitants:
            comp_crop = comp.crop_type if hasattr(comp, "crop_type") else comp.get("crop_type", "")
            comp_ripeness = comp.ripeness_stage if hasattr(comp, "ripeness_stage") else comp.get("ripeness_stage", "")
            comp_weight = comp.approximate_weight_kg if hasattr(comp, "approximate_weight_kg") else comp.get("approximate_weight_kg", 0.0)
            if cls.CROP_PROFILES.get(comp_crop.lower(), {}).get("climacteric", False):
                gas_load += (
                    (4.0 * (comp_weight / 100.0))
                    if comp_ripeness.lower() == "overripe"
                    else 1.0
                )

        # Ventilation reduces effective PPM by ~60%
        effective_ppm = gas_load * (1.0 if ventilated else 2.5)

        # Sensitivity determines how much ethylene accelerates decay
        multiplier = 1.0 + (effective_ppm * (0.15 if p["sensitivity"] == "HIGH" else 0.04))
        return min(4.00, round(multiplier, 2))
