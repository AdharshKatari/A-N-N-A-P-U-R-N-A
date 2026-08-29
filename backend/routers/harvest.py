"""
Master Harvest Evaluation Pipeline

Combines all 4 processing layers + DB persistence:
  Layer 1: Computer Vision — AGMARK quality grading via AI
  Layer 2: Ethylene Gas Interaction — cross-contamination penalty
  Layer 3: ISRO Satellite Intelligence — NDVI shelf-life modifier
  Layer 4: Q10 Respiration Kinetics + Plan-B Rerouting

Endpoint:
  POST /api/v5/harvest/evaluate-all
"""

import datetime
import json
import logging

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile

from auth import get_current_user
from rate_limit import limiter
import db as database
from models import (
    CropCoHabitant,
    MandiDestinationInput,
    UnifiedDecisionResponse,
    VisionAgronomySchema,
    generate_qr_token,
)
from engines.vision import run_vision_sensor_layer
from engines.ethylene import EthyleneGasCore
from engines.satellite import satellite_core
from engines.logistics import LogisticsKineticsCore

logger = logging.getLogger("FreshGuardHarvest")
router = APIRouter(tags=["harvest"])


def _persist_evaluation_batch(
    batch_id: str,
    weight: float,
    vision: VisionAgronomySchema,
    ndvi_mod: float,
):
    """Best-effort batch persistence after evaluation. Logs errors but does not fail the request."""
    logger.info("Persisting batch to available store.")

    try:
        qr_token = generate_qr_token()
        database.persist_batch(
            batch_id=batch_id,
            initial_weight_kg=weight,
            harvest_timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            initial_visual_score=float(vision.visual_quality_score),
            detected_ripeness_stage=vision.ripeness_stage,
            fungal_pathogen_presence=vision.fungal_pathogen_presence,
            qr_code_secure_token=qr_token,
            macro_satellite_modifier=ndvi_mod,
        )
        logger.info(f"Batch {batch_id} persisted to database after evaluation.")
    except Exception as e:
        logger.error(f"Failed to persist batch {batch_id}: {str(e)}")


@router.post("/api/v5/harvest/evaluate-all", response_model=UnifiedDecisionResponse)
@limiter.limit("10/minute")  # Strict limit: Gemini API calls are expensive
async def process_unified_harvest_call(
    request: Request,
    user: dict = Depends(get_current_user),
    batch_id: str = Query(...),
    batch_weight_kg: float = Query(...),
    is_vehicle_ventilated: bool = Query(...),
    co_habitants_json: str = Query(...),
    destinations_json: str = Query(...),
    latitude: float = Query(None, description="GPS latitude for satellite NDVI lookup"),
    longitude: float = Query(None, description="GPS longitude for satellite NDVI lookup"),
    file: UploadFile = File(...),
):
    """
    Master evaluation endpoint — runs all 4 processing layers and returns
    ranked mandi options with shelf life, profit margins, and resilience status.
    """
    try:
        co_habitants_list = [CropCoHabitant(**c) for c in json.loads(co_habitants_json)]
        destinations_list = [MandiDestinationInput(**d) for d in json.loads(destinations_json)]

        # Layer 1: Computer Vision — AGMARK quality grading via Gemini LLM
        vision_metrics = await run_vision_sensor_layer(file)

        # Layer 2: Ethylene Gas Interaction — cross-contamination penalty modeling
        ethylene_factor = EthyleneGasCore.compute_gas_multiplier(
            vision_metrics.crop_identified,
            vision_metrics.ripeness_stage,
            co_habitants_list,
            is_vehicle_ventilated,
        )

        # Layer 3: ISRO Satellite Intelligence — NDVI-based shelf-life modifier
        satellite_intel = await satellite_core.fetch_satellite_intelligence(latitude, longitude)

        # Pathogen Isolation Lockdown Handler Routine
        if vision_metrics.fungal_pathogen_presence:
            response = UnifiedDecisionResponse(
                batch_id=batch_id,
                crop_type=vision_metrics.crop_identified,
                batch_weight_kg=batch_weight_kg,
                calculated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                vision_assessment=vision_metrics.dict(),
                biochemical_metrics={
                    "ethylene_multiplier": ethylene_factor,
                    "incident_status": "EMERGENCY_ROT_ISOLATION",
                },
                satellite_intelligence=satellite_intel,
                ranked_logistics_options=[{
                    "mandi_destination_name": "IMMEDIATE LOCAL DISPOSAL / BYPRODUCTS CONVERSION FACTORY",
                    "expected_shelf_life_on_arrival_days": 0.0,
                    "estimated_primary_net_profit_inr": 0.0,
                    "resilience_status": "TERMINAL_DESTROY",
                    "backup_plan_b_route": "NONE",
                }],
            )
            # Persist pathogen-flagged batch to DB
            _persist_evaluation_batch(
                batch_id=batch_id,
                weight=batch_weight_kg,
                vision=vision_metrics,
                ndvi_mod=satellite_intel["ndvi_modifier"],
            )
            return response

        # Base shelf life: 14-day max scaled by visual quality score
        base_shelf_life_pool = 14.0 * (vision_metrics.visual_quality_score / 100.0)

        # Layer 4: Q10 Respiration Kinetics + Plan-B Rerouting
        ranked_itineraries = LogisticsKineticsCore.simulate_routing_futures(
            vision_metrics.crop_identified,
            base_shelf_life_pool,
            batch_weight_kg,
            ethylene_factor,
            satellite_intel["ndvi_modifier"],
            destinations_list,
        )

        response = UnifiedDecisionResponse(
            batch_id=batch_id,
            crop_type=vision_metrics.crop_identified,
            batch_weight_kg=batch_weight_kg,
            calculated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            vision_assessment=vision_metrics.dict(),
            biochemical_metrics={
                "ethylene_multiplier": ethylene_factor,
                "calculated_respiration_risk_class": "CRITICAL" if ethylene_factor >= 2.5 else "NOMINAL",
            },
            satellite_intelligence=satellite_intel,
            ranked_logistics_options=ranked_itineraries,
        )

        # Persist evaluated batch to DB (best-effort, non-blocking)
        _persist_evaluation_batch(
            batch_id=batch_id,
            weight=batch_weight_kg,
            vision=vision_metrics,
            ndvi_mod=satellite_intel["ndvi_modifier"],
        )

        return response

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in co_habitants or destinations.")
    except Exception as e:
        logger.error(f"Harvest evaluation failed for batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Harvest evaluation failed. Please try again later.")
