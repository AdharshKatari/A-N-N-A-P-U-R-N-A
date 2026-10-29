"""
Shared Pydantic models and helper functions for FreshGuard routers.
Central contract definitions — what the API accepts and returns.
"""

import datetime
import uuid
from typing import List, Dict, Any, Optional

from pydantic import BaseModel, Field


# ====================================================================================
# PYDANTIC MODELS — Request / Response Contracts
# ====================================================================================

class CropCoHabitant(BaseModel):
    crop_type: str
    ripeness_stage: str  # Unripe, Optimal, Overripe
    approximate_weight_kg: float


class SecondaryFallbackInput(BaseModel):
    facility_name: str
    facility_type: str  # Processing_Plant, Cold_Storage
    distance_from_mandi_km: float
    transit_hours_from_mandi: float
    guaranteed_floor_price_per_kg: float


class MandiDestinationInput(BaseModel):
    mandi_name: str
    distance_km: float
    transit_duration_hours: float
    expected_market_price_per_kg: float
    ambient_temp_c: float
    potential_fallbacks: List[SecondaryFallbackInput] = Field(default_factory=list)


class UnifiedDecisionResponse(BaseModel):
    batch_id: str
    crop_type: str
    batch_weight_kg: float
    calculated_at: str
    vision_assessment: Dict[str, Any]
    biochemical_metrics: Dict[str, Any]
    satellite_intelligence: Dict[str, Any]
    ranked_logistics_options: List[Dict[str, Any]]


class VisionAgronomySchema(BaseModel):
    """Structured output from the AI vision pipeline — AGMARK grading parameters."""
    crop_identified: str = Field(description="Detected crop family, e.g., 'Tomato'")
    visual_quality_score: int = Field(description="Strict AGMARK-compliant freshness rating from 0 to 100.")
    ripeness_stage: str = Field(description="Constrained strictly to: 'Unripe', 'Optimal', or 'Overripe'")
    fungal_pathogen_presence: bool = Field(description="True if surface rot spores are found.")
    confidence: int = Field(default=85, description="Confidence score 0-100 for the prediction.")


class WhatIfRequest(BaseModel):
    crop_type: str = Field(description="Crop name, e.g., 'Tomato'")
    quantity_kg: float = Field(description="Batch weight in kilograms")
    visual_score: float = Field(default=85.0, description="Visual quality score 0-100")
    ambient_temp_c: float = Field(default=32.0, description="Current ambient temperature in Celsius")
    latitude: Optional[float] = Field(default=None, description="GPS latitude for weather lookup")
    longitude: Optional[float] = Field(default=None, description="GPS longitude for weather lookup")
    ethylene_multiplier: float = Field(default=1.0, description="Ethylene cross-contamination factor")


class WeatherRequest(BaseModel):
    latitude: float
    longitude: float


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    recaptcha_token: Optional[str] = Field(default=None, description="Optional reCAPTCHA token")


class UserLoginRequest(BaseModel):
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")
    recaptcha_token: Optional[str] = Field(default=None, description="Optional reCAPTCHA token")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str


class BatchDeleteRequest(BaseModel):
    reason: Optional[str] = Field(default=None, description="Optional reason for deletion audit trail")


class BatchCreateRequest(BaseModel):
    crop_type: Optional[str] = Field(default="Tomato", description="Crop family or type")
    variety: Optional[str] = Field(default=None, description="Crop variety")
    initial_weight_kg: float
    latitude: Optional[float] = Field(default=None, description="Harvest field latitude")
    longitude: Optional[float] = Field(default=None, description="Harvest field longitude")
    field_name: Optional[str] = Field(default=None, description="Field or farm section name")
    field_id: Optional[str] = None
    detected_ripeness_stage: Optional[str] = Field(default="Optimal", description="Ripeness stage")
    visual_quality_score: Optional[float] = Field(default=85.0, description="AGMARK visual quality score 0-100")
    harvest_timestamp: Optional[str] = None  # ISO format, defaults to now
    qr_code_secure_token: Optional[str] = None  # Auto-generated if not provided


class EnvironmentalLogRequest(BaseModel):
    batch_id: str
    temperature_c: float
    humidity_pct: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: Optional[str] = None  # ISO format, defaults to server now




class TransitInterceptRequest(BaseModel):
    batch_id: str = Field(description="Unique batch identifier, e.g., 'FG-2026-TOM-001'")
    crop_type: str = Field(default="Tomato", description="Crop type, e.g., 'Tomato', 'Mango'")
    quantity_kg: float = Field(..., gt=0, description="Payload weight in kilograms")
    current_lat: float = Field(..., description="Current vehicle GPS latitude")
    current_lon: float = Field(..., description="Current vehicle GPS longitude")
    remaining_transit_hours: float = Field(..., ge=0, description="Estimated remaining drive hours to primary mandi")
    ambient_temp_c: float = Field(..., description="Current ambient or cargo temperature in Celsius")
    degradation_index: float = Field(..., ge=0.0, le=1.0, description="Continuous degradation index D_i in [0.0, 1.0]")
    ethylene_ppm: float = Field(default=0.0, ge=0.0, description="Ethylene gas accumulation in PPM")
    primary_mandi_name: Optional[str] = Field(default="Vashi APMC Mumbai", description="Primary target mandi name")
    primary_mandi_price_per_kg: Optional[float] = Field(default=34.0, description="Expected market price at primary mandi")
    search_radius_km: Optional[float] = Field(default=80.0, description="PostGIS search radius for fallback facilities")


class TransitInterceptResponse(BaseModel):
    batch_id: str
    routing_status: str
    risk_tier: str
    target_facility: str
    facility_type: str
    distance_to_target_km: Optional[float] = None
    salvage_net_payout_inr: Optional[float] = None
    residual_shelf_life_hours: float
    remaining_transit_hours: float
    diversion_recommended: bool
    reason: str
    candidate_fallbacks: List[Dict[str, Any]] = Field(default_factory=list)

# ====================================================================================
# SHARED HELPERS
# ====================================================================================

def generate_batch_id() -> str:
    """Generate a unique batch ID: FG-YYYY-XXXXXXXX."""
    now = datetime.datetime.now()
    suffix = uuid.uuid4().hex[:8].upper()
    return f"FG-{now.year}-{suffix}"


def generate_qr_token() -> str:
    """Generate a unique QR token identifier."""
    return f"QR-FG-{uuid.uuid4().hex[:16].upper()}"
