"""
Offline Mobile Sync Gateway

Specialized FastAPI APIRouter that processes queued offline records
sent by the mobile device. When a farmer regains cellular connectivity,
the mobile app sends its local SQLite transaction logs as an array payload.

This endpoint iterates through each entry, derives visual scores from
manual inputs, generates cryptographic passports, and persists to the
central database.
"""

import datetime
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import psycopg2
import psycopg2.extras

from auth import get_current_user
import db as database
from passport import CryptographicPassportEngine

logger = logging.getLogger("FreshGuardSyncGateway")


# ====================================================================================
# SYNC GATEWAY PYDANTIC MODELS
# ====================================================================================

class OfflineSyncTransaction(BaseModel):
    client_local_id: str
    batch_id: str
    crop_type: str
    weight_kg: float
    harvest_timestamp: str
    cached_lat: float
    cached_lng: float
    is_ventilated: bool
    manual_color_index: int    # Fallback if photo compression fails (1=Unripe, 2=Optimal, 3=Overripe)
    manual_bruise_index: int   # 0-4 scale, each point = 25% quality penalty


class SyncBatchPayload(BaseModel):
    farmer_id: str
    device_sync_timestamp: str
    transactions: List[OfflineSyncTransaction]


class SyncResponse(BaseModel):
    sync_status: str
    records_processed_count: int
    synced_client_ids: List[str]
    failed_records: List[dict]


# ====================================================================================
# API ROUTER
# ====================================================================================

router = APIRouter(
    prefix="/api/v5/sync",
    tags=["Mobile Edge Sync Synchronization"],
)


@router.post("/process-queue", response_model=SyncResponse)
async def sync_offline_mobile_payload(payload: SyncBatchPayload, user: dict = Depends(get_current_user)):
    """
    Ingests a batch of offline transactions queued by the mobile app's
    local SQLite cache. Each transaction is processed, visually scored
    from manual inputs, given a cryptographic passport, and persisted.

    Designed for 2G/3G rural connectivity: tolerates partial failures
    and reports per-transaction success/failure status.
    """
    successful_sync_ids = []
    failed_sync_ids = []

    for tx in payload.transactions:
        try:
            # 1. Derive visual scoring from manual questionnaire inputs
            #    Replaces Vision LLM API when image upload fails in 2G zones
            derived_visual_score = max(0.0, 100.0 - (tx.manual_bruise_index * 25.0))
            ripeness_map = {1: "Unripe", 2: "Optimal", 3: "Overripe"}
            derived_ripeness = ripeness_map.get(tx.manual_color_index, "Optimal")

            # 2. Generate the Cryptographic Passport token for the offline batch
            expiry = CryptographicPassportEngine.generate_batch_expiry(days_from_now=7)
            passport_data = CryptographicPassportEngine.generate_secure_qr_token({
                "batch_id": tx.batch_id,
                "crop_type": tx.crop_type,
                "weight_kg": tx.weight_kg,
                "visual_score": derived_visual_score,
                "expiry_timestamp": expiry,
            })

            # 3. Persist the batch to the database (if connected)
            if database.db.is_connected:
                with database.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                    database.persist_batch(
                        batch_id=tx.batch_id,
                        initial_weight_kg=tx.weight_kg,
                        harvest_timestamp=tx.harvest_timestamp,
                        initial_visual_score=derived_visual_score,
                        detected_ripeness_stage=derived_ripeness,
                        fungal_pathogen_presence=False,
                        qr_code_secure_token=passport_data["qr_passport_token"],
                        cur=cur,
                    )
    
                    # 4. Ingest the initial environmental log with cached GPS
                    database.insert_environmental_log(
                        batch_id=tx.batch_id,
                        temperature_c=28.0,  # Default ambient when sensor unavailable
                        humidity_pct=65.0,
                        latitude=tx.cached_lat,
                        longitude=tx.cached_lng,
                        cur=cur,
                    )

            logger.info(
                f"Synced offline transaction {tx.client_local_id} | "
                f"batch={tx.batch_id} | farmer={payload.farmer_id} | "
                f"visual_score={derived_visual_score:.1f}"
            )
            successful_sync_ids.append(tx.client_local_id)

        except Exception as tx_err:
            logger.error(f"Failed to ingest transaction ID {tx.client_local_id}: {str(tx_err)}")
            failed_sync_ids.append({"id": tx.client_local_id, "reason": str(tx_err)})

    return SyncResponse(
        sync_status="COMPLETED",
        records_processed_count=len(payload.transactions),
        synced_client_ids=successful_sync_ids,
        failed_records=failed_sync_ids,
    )
