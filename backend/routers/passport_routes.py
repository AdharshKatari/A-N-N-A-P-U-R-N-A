"""
Cryptographic QR Passport Endpoints

Generate and verify tamper-proof QR tokens for crop batch traceability.
Downstream buyers (e.g., Zepto, Blinkit) scan these to verify provenance.

Endpoints:
  POST /api/v5/passport/generate — Create signed QR token
  POST /api/v5/passport/verify   — Verify scanned token
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from auth import get_current_user, get_optional_user
import db as database
from passport import CryptographicPassportEngine

logger = logging.getLogger("FreshGuardPassport")
router = APIRouter(tags=["passport"])


@router.get("/api/v5/passport/{batch_id}")
async def get_passport_by_batch(batch_id: str):
    """
    Retrieves or generates the cryptographic QR passport and certificate for a specific batch.
    """
    batch = database.get_batch(batch_id)
    crop_type = "Tomato"
    weight_kg = 500.0
    visual_score = 85.0
    ripeness = "Optimal"
    harvest_ts = None

    if batch:
        crop_type = batch.get("crop_type", "Tomato")
        weight_kg = float(batch.get("initial_weight_kg", 500.0))
        visual_score = float(batch.get("initial_visual_score", 85.0))
        ripeness = batch.get("detected_ripeness_stage", "Optimal")
        harvest_ts = batch.get("harvest_timestamp")

    expiry = CryptographicPassportEngine.generate_batch_expiry(days_from_now=7)
    result = CryptographicPassportEngine.generate_secure_qr_token({
        "batch_id": batch_id,
        "crop_type": crop_type,
        "weight_kg": weight_kg,
        "visual_score": visual_score,
        "expiry_timestamp": expiry,
    })

    return {
        "batch_id": batch_id,
        "qr_passport_token": result["qr_passport_token"],
        "raw_payload": result["raw_payload_verify_string"],
        "crop_type": crop_type,
        "initial_weight_kg": weight_kg,
        "visual_score": visual_score,
        "detected_ripeness_stage": ripeness,
        "harvest_timestamp": harvest_ts,
        "expiry_timestamp": expiry,
        "status": "VERIFIED",
        "qr_code_secure_token": result["qr_passport_token"],
    }


@router.post("/api/v5/passport/generate")
async def generate_passport(
    batch_id: str = Query(...),
    crop_type: str = Query("Tomato"),
    weight_kg: float = Query(500.0),
    visual_score: float = Query(85.0),
    expiry_days: int = Query(7, ge=1, le=30),
    user: Optional[dict] = Depends(get_optional_user),
):
    """
    Generates a cryptographically signed QR passport token for a batch.
    The token can be printed on crate labels and scanned by downstream buyers.
    """
    expiry = CryptographicPassportEngine.generate_batch_expiry(days_from_now=expiry_days)
    result = CryptographicPassportEngine.generate_secure_qr_token({
        "batch_id": batch_id,
        "crop_type": crop_type,
        "weight_kg": weight_kg,
        "visual_score": visual_score,
        "expiry_timestamp": expiry,
    })
    return {
        "qr_passport_token": result["qr_passport_token"],
        "raw_payload": result["raw_payload_verify_string"],
        "expiry_timestamp": expiry,
    }


@router.post("/api/v5/passport/verify")
async def verify_passport(token: str = Query(...)):
    """
    Verifies a scanned QR passport token's integrity.
    Returns decoded batch data or 401 if tampered.
    """
    decoded = CryptographicPassportEngine.verify_passport_integrity(token)
    if decoded is None:
        raise HTTPException(status_code=401, detail="Passport token is invalid or has been tampered with.")
    return {
        "status": "VERIFIED",
        "batch_id": decoded.get("BID"),
        "crop_type": decoded.get("CRP"),
        "weight_kg": decoded.get("WGT"),
        "visual_score": decoded.get("VSC"),
        "expiry_timestamp": decoded.get("EXP"),
    }
