import json
import os
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from passport import CryptographicPassportEngine
from vedas_scraper import BhuvanVedasScraperWorker
from main import app
from engines.ethylene import EthyleneGasCore
from engines.logistics import LogisticsKineticsCore, MandiDestinationInput
from engines.satellite import SatelliteDataCore
from auth import get_current_user

client = TestClient(app)

def override_get_current_user():
    return {"user_id": "TEST-USER-1", "username": "testuser"}

app.dependency_overrides[get_current_user] = override_get_current_user


# ====================================================================================
# LAYER 2: ETHYLENE GAS MULTIPLIER TESTS
# ====================================================================================

def test_biochemical_ethylene_caps():
    """Validates that closed cargo containers apply correct ethylene gas multipliers."""
    unventilated_factor = EthyleneGasCore.compute_gas_multiplier(
        crop="tomatoes",
        ripeness="Optimal",
        co_habitants=[{"crop_type" "ripeness_stage": "Overripe", "approximate_weight_kg": 150.0}],
        ventilated=False
    )
    assert unventilated_factor > 1.00
    assert unventilated_factor <= 4.00


def test_ethylene_ventilated_vs_closed():
    """Ventilated containers produce lower ethylene multipliers than closed ones."""
    ventilated = EthyleneGasCore.compute_gas_multiplier(
        crop="tomatoes", ripeness="Optimal",
        co_habitants=[], ventilated=True
    )
    closed = EthyleneGasCore.compute_gas_multiplier(
        crop="tomatoes", ripeness="Optimal",
        co_habitants=[], ventilated=False
    )
    assert ventilated < closed


def test_ethylene_non_climacteric_returns_one():
    """Non-climacteric crops (onions) always return 1.00."""
    factor = EthyleneGasCore.compute_gas_multiplier(
        crop="onions", ripeness="Optimal",
        co_habitants=[], ventilated=False
    )
    assert factor == 1.00


# ====================================================================================
# LAYER 3: ISRO SATELLITE NDVI MODIFIER TESTS
# ====================================================================================

def test_ndvi_modifier_stressed_crop():
    """NDVI below 0.40 applies a 15% shelf-life penalty (0.85x)."""
    core = SatelliteDataCore()
    modifier = core.compute_ndvi_modifier(0.30)
    assert modifier == 0.85


def test_ndvi_modifier_healthy_crop():
    """NDVI above 0.65 applies no penalty (1.00x)."""
    core = SatelliteDataCore()
    modifier = core.compute_ndvi_modifier(0.72)
    assert modifier == 1.00


def test_ndvi_modifier_interpolation():
    """NDVI between 0.40 and 0.65 interpolates linearly."""
    core = SatelliteDataCore()
    modifier = core.compute_ndvi_modifier(0.525)
    assert 0.90 <= modifier <= 0.95


def test_satellite_no_gps_returns_skipped():
    """Without GPS coordinates, satellite layer skips gracefully."""
    core = SatelliteDataCore()
    import asyncio
    loop = asyncio.new_event_loop()
    result = loop.run_until_complete(core.fetch_satellite_intelligence(None, None))
    loop.close()
    assert result["api_status"] == "NO_GPS_COORDINATES"
    assert result["ndvi_modifier"] == 1.00


def test_satellite_extract_ndvi_empty_features():
    """Empty feature list returns None NDVI."""
    core = SatelliteDataCore()
    ndvi = core.extract_ndvi_from_features([])
    assert ndvi is None


# ====================================================================================
# LAYER 4: Q10 RESPIRATION + PLAN-B ROUTING TESTS
# ====================================================================================

def test_q10_respiration_priority_sorting():
    """Routes with secure backup paths rank higher than unsafe high-margin routes."""
    mock_targets = [
        MandiDestinationInput(
            mandi_name="High-Margin Unsafe Mandi",
            distance_km=280.0,
            transit_duration_hours=11.5,
            expected_market_price_per_kg=45.0,
            ambient_temp_c=34.5,
            potential_fallbacks=[]
        ),
        MandiDestinationInput(
            mandi_name="Stable Protected Mandi Hub",
            distance_km=110.0,
            transit_duration_hours=4.5,
            expected_market_price_per_kg=35.0,
            ambient_temp_c=32.0,
            potential_fallbacks=[{
                "facility_name": "Chittoor Pulp Factory",
                "facility_type": "Processing_Plant",
                "distance_from_mandi_km": 10.0,
                "transit_hours_from_mandi": 0.5,
                "guaranteed_floor_price_per_kg": 22.0
            }]
        )
    ]

    results = LogisticsKineticsCore.simulate_routing_futures(
        crop="tomatoes",
        base_life_days=11.9,
        quantity_kg=500.0,
        ethylene_mult=1.5,
        ndvi_modifier=1.00,
        targets=mock_targets
    )
    assert results[0]["resilience_status"] == "AIRTIGHT"


def test_q10_ndvi_modifier_reduces_shelf_life():
    """Stressed NDVI (0.85x) produces lower shelf life than healthy NDVI (1.00x)."""
    mock_target = [
        MandiDestinationInput(
            mandi_name="Test Mandi",
            distance_km=100.0,
            transit_duration_hours=5.0,
            expected_market_price_per_kg=30.0,
            ambient_temp_c=30.0,
            potential_fallbacks=[]
        )
    ]

    healthy = LogisticsKineticsCore.simulate_routing_futures(
        crop="tomatoes", base_life_days=11.9,
        quantity_kg=500.0, ethylene_mult=1.0, ndvi_modifier=1.00,
        targets=mock_target
    )
    stressed = LogisticsKineticsCore.simulate_routing_futures(
        crop="tomatoes", base_life_days=11.9,
        quantity_kg=500.0, ethylene_mult=1.0, ndvi_modifier=0.85,
        targets=mock_target
    )
    assert stressed[0]["expected_shelf_life_on_arrival_days"] < healthy[0]["expected_shelf_life_on_arrival_days"]


def test_q10_mangoes_higher_q10_constant():
    """Mangoes (Q10=2.5) lose shelf life faster than tomatoes (Q10=2.2) at the same temperature."""
    mock_target = [
        MandiDestinationInput(
            mandi_name="Test Mandi",
            distance_km=100.0,
            transit_duration_hours=8.0,
            expected_market_price_per_kg=30.0,
            ambient_temp_c=34.0,
            potential_fallbacks=[]
        )
    ]

    tomatoes = LogisticsKineticsCore.simulate_routing_futures(
        crop="tomatoes", base_life_days=11.9,
        quantity_kg=500.0, ethylene_mult=1.0, ndvi_modifier=1.00,
        targets=mock_target
    )
    mangoes = LogisticsKineticsCore.simulate_routing_futures(
        crop="mangoes", base_life_days=11.9,
        quantity_kg=500.0, ethylene_mult=1.0, ndvi_modifier=1.00,
        targets=mock_target
    )
    assert mangoes[0]["expected_shelf_life_on_arrival_days"] < tomatoes[0]["expected_shelf_life_on_arrival_days"]


# ====================================================================================
# HEALTH ENDPOINT TESTS
# ====================================================================================

def test_health_endpoint():
    """Health check returns OK status."""
    response = client.get("/api/v5/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "5.0.0"


def test_health_reports_db_status():
    """Health endpoint reports database connection status."""
    response = client.get("/api/v5/health")
    data = response.json()
    assert "database" in data
    assert data["database"] in ("connected", "disconnected")


# ====================================================================================
# BATCH ENDPOINTS (mocked DB tests)
# ====================================================================================

@patch("routers.batches.database")
def test_create_batch_persists_to_db(mock_db):
    """POST /api/v5/batches creates a batch and returns its ID."""
    mock_db.db.is_connected = True
    mock_db.persist_batch.return_value = {
        "batch_id": "FG-2026-TEST0001",
        "initial_weight_kg": 450.0,
        "harvest_timestamp": "2026-08-22T10:00:00+00:00",
        "detected_ripeness_stage": "Optimal",
        "fungal_pathogen_presence": False,
        "macro_satellite_modifier": 1.00,
        "current_status": "ACTIVE",
    }

    response = client.post("/api/v5/batches", json={
        "initial_weight_kg": 450.0,
        "harvest_timestamp": "2026-08-22T10:00:00+00:00",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["batch_id"] == "FG-2026-TEST0001"
    assert data["initial_weight_kg"] == 450.0
    assert "qr_code_secure_token" in data


@patch("routers.batches.database")
def test_list_batches_returns_array(mock_db):
    """GET /api/v5/batches returns a list of batches."""
    mock_db.db.is_connected = True
    mock_db.list_batches.return_value = [
        {"batch_id": "FG-2026-TEST0001", "initial_weight_kg": 450.0, "current_status": "ACTIVE"},
    ]

    response = client.get("/api/v5/batches")
    assert response.status_code == 200
    data = response.json()
    assert "batches" in data
    assert len(data["batches"]) == 1


@patch("routers.batches.database")
def test_get_batch_by_id(mock_db):
    """GET /api/v5/batches/{id} returns a single batch."""
    mock_db.db.is_connected = True
    mock_db.get_batch.return_value = {
        "batch_id": "FG-2026-TEST0001",
        "initial_weight_kg": 450.0,
        "current_status": "ACTIVE",
    }

    response = client.get("/api/v5/batches/FG-2026-TEST0001")
    assert response.status_code == 200
    data = response.json()
    assert data["batch"]["batch_id"] == "FG-2026-TEST0001"


@patch("routers.batches.database")
def test_get_batch_not_found(mock_db):
    """GET /api/v5/batches/{id} returns 404 for missing batch."""
    mock_db.db.is_connected = True
    mock_db.get_batch.return_value = None

    response = client.get("/api/v5/batches/NONEXISTENT")
    assert response.status_code == 404


def test_create_batch_uses_in_memory_fallback():
    """POST /api/v5/batches uses in-memory fallback when PostgreSQL is unavailable."""
    response = client.post("/api/v5/batches", json={
        "initial_weight_kg": 100.0,
    })
    assert response.status_code == 201
    data = response.json()
    assert "batch_id" in data
    # Verify it was stored in in-memory store
    from db import mem_store
    assert data["batch_id"] in mem_store.batches


# ====================================================================================
# DASHBOARD STATISTICS ENDPOINT (mocked DB tests)
# ====================================================================================

@patch("routers.batches.database")
def test_dashboard_returns_full_statistics(mock_db):
    """GET /api/v5/dashboard returns aggregated batch statistics."""
    mock_db.db.is_connected = True
    mock_db.get_batch_statistics.return_value = {
        "totals": {
            "batch_count": 3,
            "total_weight_kg": 950.0,
            "avg_visual_score": 67.5,
        },
        "by_status": [
            {"current_status": "ACTIVE", "batch_count": 2, "total_weight_kg": 770.0},
            {"current_status": "SOLD", "batch_count": 1, "total_weight_kg": 180.0},
        ],
        "by_risk_tier": [
            {"risk_tier": "LOW", "batch_count": 2, "total_weight_kg": 770.0},
            {"risk_tier": "HIGH", "batch_count": 1, "total_weight_kg": 180.0},
        ],
        "by_crop_category": [
            {"crop_category": "Tomatoes", "batch_count": 2, "total_weight_kg": 630.0},
            {"crop_category": "Mangoes", "batch_count": 1, "total_weight_kg": 320.0},
        ],
        "pathogen_alerts": 1,
        "recent_batches": [],
    }

    response = client.get("/api/v5/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["totals"]["batch_count"] == 3
    assert data["totals"]["total_weight_kg"] == 950.0
    assert len(data["by_status"]) == 2
    assert len(data["by_risk_tier"]) == 2
    assert len(data["by_crop_category"]) == 2
    assert data["pathogen_alerts"] == 1


def test_dashboard_uses_in_memory_fallback():
    """GET /api/v5/dashboard uses in-memory fallback when PostgreSQL is unavailable."""
    # Clear any leftover data from other tests
    from db import mem_store
    mem_store.batches.clear()
    response = client.get("/api/v5/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "totals" in data
    assert data["totals"]["batch_count"] == 0


# ====================================================================================
# ENVIRONMENTAL LOG ENDPOINTS (mocked DB tests)
# ====================================================================================

@patch("routers.batches.database")
def test_ingest_env_log(mock_db):
    """POST /api/v5/logs ingests a telemetry reading."""
    mock_db.db.is_connected = True
    mock_db.insert_environmental_log.return_value = {
        "batch_id": "FG-2026-TEST0001",
        "ambient_temperature_c": 32.5,
        "relative_humidity_pct": 65.0,
    }

    response = client.post("/api/v5/logs", json={
        "batch_id": "FG-2026-TEST0001",
        "temperature_c": 32.5,
        "humidity_pct": 65.0,
        "latitude": 13.69,
        "longitude": 78.46,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "logged"


@patch("routers.batches.database")
def test_get_env_logs(mock_db):
    """GET /api/v5/logs/{batch_id} returns telemetry history."""
    mock_db.db.is_connected = True
    mock_db.get_environmental_logs.return_value = [
        {"batch_id": "FG-2026-TEST0001", "ambient_temperature_c": 32.5, "relative_humidity_pct": 65.0},
    ]

    response = client.get("/api/v5/logs/FG-2026-TEST0001")
    assert response.status_code == 200
    data = response.json()
    assert len(data["logs"]) == 1


# ====================================================================================
# CRYPTOGRAPHIC PASSPORT ENGINE TESTS
# ====================================================================================

def test_passport_generate_and_verify():
    """Generated passport token should verify successfully with correct data."""
    result = CryptographicPassportEngine.generate_secure_qr_token({
        "batch_id": "FG-2026-TOM-001",
        "crop_type": "Tomatoes",
        "weight_kg": 450.0,
        "visual_score": 82.5,
        "expiry_timestamp": "2026-08-29T00:00:00+00:00",
    })

    token = result["qr_passport_token"]
    assert "." in token  # Must have payload.signature format

    decoded = CryptographicPassportEngine.verify_passport_integrity(token)
    assert decoded is not None
    assert decoded["BID"] == "FG-2026-TOM-001"
    assert decoded["CRP"] == "Tomatoes"
    assert decoded["WGT"] == "450.0"


def test_passport_tampered_token_rejected():
    """A tampered passport token should fail verification."""
    result = CryptographicPassportEngine.generate_secure_qr_token({
        "batch_id": "FG-2026-TOM-001",
        "crop_type": "Tomatoes",
        "weight_kg": 450.0,
        "visual_score": 82.5,
        "expiry_timestamp": "2026-08-29T00:00:00+00:00",
    })

    # Tamper with the payload portion
    parts = result["qr_passport_token"].split(".")
    tampered_token = parts[0] + "X." + parts[1]

    decoded = CryptographicPassportEngine.verify_passport_integrity(tampered_token)
    assert decoded is None


def test_passport_invalid_format_rejected():
    """Invalid token formats should return None."""
    assert CryptographicPassportEngine.verify_passport_integrity("") is None
    assert CryptographicPassportEngine.verify_passport_integrity("noseparator") is None
    assert CryptographicPassportEngine.verify_passport_integrity("a.b.c") is None


def test_passport_api_endpoint():
    """POST /api/v5/passport/generate returns a valid token."""
    response = client.post("/api/v5/passport/generate", params={
        "batch_id": "FG-2026-TOM-001",
        "crop_type": "Tomatoes",
        "weight_kg": 450.0,
        "visual_score": 82.5,
        "expiry_days": 7,
    })
    assert response.status_code == 200
    data = response.json()
    assert "qr_passport_token" in data
    assert "expiry_timestamp" in data


def test_passport_verify_api_endpoint():
    """POST /api/v5/passport/verify validates a generated token."""
    # First generate a token
    gen_resp = client.post("/api/v5/passport/generate", params={
        "batch_id": "FG-2026-TOM-001",
        "crop_type": "Tomatoes",
        "weight_kg": 450.0,
        "visual_score": 82.5,
    })
    token = gen_resp.json()["qr_passport_token"]

    # Then verify it
    verify_resp = client.post("/api/v5/passport/verify", params={"token": token})
    assert verify_resp.status_code == 200
    assert verify_resp.json()["status"] == "VERIFIED"
    assert verify_resp.json()["batch_id"] == "FG-2026-TOM-001"


def test_passport_verify_tampered_api_rejects():
    """POST /api/v5/passport/verify returns 401 for tampered tokens."""
    response = client.post("/api/v5/passport/verify", params={
        "token": "dGFtcGVyZWQ.xdGFtcGVyZWQ"
    })
    assert response.status_code == 401


# ====================================================================================
# ISRO VEDAS SCRAPER TESTS
# ====================================================================================

def test_vedas_scraper_fallback_on_error():
    """VEDAS scraper should degrade gracefully when government servers are down."""
    result = BhuvanVedasScraperWorker.harvest_satellite_matrix_for_bbox(
        min_lng=78.4, min_lat=13.6, max_lng=78.6, max_lat=13.8,
        timeout_seconds=0.1,  # Very short timeout to force failure
    )
    assert result["status"] in ("DEGRADED_FALLBACK", "SUCCESS", "NO_FEATURES_IN_BBOX")
    assert "ndvi_index" in result
    assert "root_moisture" in result


def test_vedas_fetch_for_coordinates():
    """fetch_for_coordinates should convert GPS to bounding box and query."""
    result = BhuvanVedasScraperWorker.fetch_for_coordinates(
        latitude=13.69, longitude=78.46, radius_deg=0.1
    )
    assert "ndvi_index" in result
    assert "root_moisture" in result


def test_vedas_live_api_endpoint():
    """GET /api/v5/satellite/vedas/live returns satellite data."""
    response = client.get("/api/v5/satellite/vedas/live", params={
        "latitude": 13.69,
        "longitude": 78.46,
    })
    assert response.status_code == 200
    data = response.json()
    assert "ndvi_index" in data


def test_vedas_multi_layer_api_endpoint():
    """GET /api/v5/satellite/vedas/multi-layer returns combined data."""
    response = client.get("/api/v5/satellite/vedas/multi-layer", params={
        "min_lng": 78.4, "min_lat": 13.6,
        "max_lng": 78.6, "max_lat": 13.8,
    })
    assert response.status_code == 200
    data = response.json()
    assert "ndvi" in data
    assert "soil_moisture" in data


# ====================================================================================
# BATCH DELETE ENDPOINT TESTS
# ====================================================================================

@patch("routers.batches.database")
def test_delete_batch_soft_deletes(mock_db):
    """DELETE /api/v5/batches/{id} soft-deletes a batch."""
    mock_db.db.is_connected = True
    mock_db.get_batch.return_value = {
        "batch_id": "FG-2026-DEL-001",
        "current_status": "ACTIVE",
    }
    mock_db.update_batch_status.return_value = True

    response = client.delete("/api/v5/batches/FG-2026-DEL-001")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "deleted"
    mock_db.update_batch_status.assert_called_once_with("FG-2026-DEL-001", "SPOILED")


@patch("routers.batches.database")
def test_delete_batch_not_found(mock_db):
    """DELETE /api/v5/batches/{id} returns 404 for missing batch."""
    mock_db.db.is_connected = True
    mock_db.get_batch.return_value = None

    response = client.delete("/api/v5/batches/NONEXISTENT")
    assert response.status_code == 404


def test_delete_batch_uses_in_memory_fallback():
    """DELETE /api/v5/batches/{id} uses in-memory fallback when PostgreSQL is unavailable."""
    from db import mem_store
    mem_store.batches.clear()
    # Create a batch via in-memory store
    mem_store.persist_batch("FG-2026-DELFB", 100.0, "2026-08-22T00:00:00Z", 80.0, "Optimal", False, "QR-DELFB")
    # Soft-delete succeeds
    response = client.delete("/api/v5/batches/FG-2026-DELFB")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "deleted"
    # Verify the batch was soft-deleted (status set to SPOILED)
    batch = mem_store.get_batch("FG-2026-DELFB")
    assert batch is not None
    assert batch["current_status"] == "SPOILED"
    # Non-existent batch returns 404
    response = client.delete("/api/v5/batches/NONEXISTENT")
    assert response.status_code == 404


# ====================================================================================
# WEATHER PROXY ENDPOINT TESTS
# ====================================================================================

@patch.dict(os.environ, {}, clear=True)
def test_weather_endpoint_no_api_key_returns_fallback():
    """GET /api/v5/weather returns fallback data when OWM API key is missing."""
    response = client.get("/api/v5/weather", params={"latitude": 13.69, "longitude": 78.46})
    assert response.status_code == 200
    data = response.json()
    assert data["temp"] is not None
    assert data["humidity"] is not None
    assert data["api_status"] == "NO_API_KEY_CONFIGURED"


# ====================================================================================
# WEATHER ALERTS ENDPOINT TESTS
# ====================================================================================

def test_weather_alerts_high_temperature():
    """GET /api/v5/weather/alerts returns heat warning for high temps."""
    # Without OWM key, temp defaults to 32°C — should trigger HIGH alert
    response = client.get(
        "/api/v5/weather/alerts",
        params={"latitude": 13.69, "longitude": 78.46, "crop_type": "Tomato"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["crop_type"] == "Tomato"
    assert len(data["alerts"]) > 0
    assert "severity" in data["alerts"][0]
    assert "thermal_acceleration_factor" in data


def test_weather_alerts_default_crop():
    """GET /api/v5/weather/alerts defaults to Tomato if no crop specified."""
    response = client.get(
        "/api/v5/weather/alerts",
        params={"latitude": 13.69, "longitude": 78.46},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["crop_type"] == "Tomato"


# ====================================================================================
# WHAT-IF SIMULATION ENDPOINT TESTS
# ====================================================================================

def test_whatif_simulate_returns_scenarios():
    """POST /api/v5/whatif/simulate returns ranked scenarios."""
    response = client.post("/api/v5/whatif/simulate", json={
        "crop_type": "Tomato",
        "quantity_kg": 500.0,
        "visual_score": 85.0,
        "ambient_temp_c": 32.0,
        "ethylene_multiplier": 1.0,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["crop_type"] == "Tomato"
    assert data["quantity_kg"] == 500.0
    assert len(data["scenarios"]) == 4  # sell_local, transport, store, processing
    assert data["scenarios"][0]["is_recommended"] is True
    # Verify scenario structure
    for scenario in data["scenarios"]:
        assert "title" in scenario
        assert "expected_net_profit_inr" in scenario
        assert "risk_level" in scenario
        assert "shelf_life_remaining_days" in scenario
        assert "reasoning" in scenario


def test_whatif_simulate_high_temp_increases_decay():
    """Higher temperature increases decay velocity in what-if simulation."""
    hot = client.post("/api/v5/whatif/simulate", json={
        "crop_type": "Tomato", "quantity_kg": 500.0,
        "ambient_temp_c": 38.0,
    }).json()
    cool = client.post("/api/v5/whatif/simulate", json={
        "crop_type": "Tomato", "quantity_kg": 500.0,
        "ambient_temp_c": 20.0,
    }).json()
    assert hot["decay_velocity"] > cool["decay_velocity"]
    # Hot scenario should have lower shelf life in transport option
    hot_transport = [s for s in hot["scenarios"] if s["id"] == "transport_distant"][0]
    cool_transport = [s for s in cool["scenarios"] if s["id"] == "transport_distant"][0]
    assert hot_transport["shelf_life_remaining_days"] < cool_transport["shelf_life_remaining_days"]


def test_whatif_simulate_mangoes_faster_decay():
    """Mangoes (Q10=2.5) decay faster than tomatoes (Q10=2.2) at same temp."""
    tomatoes = client.post("/api/v5/whatif/simulate", json={
        "crop_type": "Tomato", "quantity_kg": 500.0, "ambient_temp_c": 34.0,
    }).json()
    mangoes = client.post("/api/v5/whatif/simulate", json={
        "crop_type": "Mango", "quantity_kg": 500.0, "ambient_temp_c": 34.0,
    }).json()
    assert mangoes["decay_velocity"] > tomatoes["decay_velocity"]


# ====================================================================================
# ENVIRONMENTAL LOG ANALYTICS ENDPOINT TESTS
# ====================================================================================

@patch("routers.batches.database")
def test_log_analytics_returns_aggregates(mock_db):
    """GET /api/v5/logs/{batch_id}/analytics returns aggregated telemetry data."""
    mock_db.db.is_connected = True
    mock_db.get_batch.return_value = {"batch_id": "FG-2026-ANA-001"}
    mock_db.get_log_analytics.return_value = {
        "log_count": 12,
        "temperature": {"min_c": 28.5, "avg_c": 32.1, "max_c": 35.8},
        "humidity": {"min_pct": 55.0, "avg_pct": 62.5, "max_pct": 70.0},
        "temperature_trend": "RISING",
        "degree_hours_above_optimal": 145.5,
        "spoilage_risk_class": "HIGH",
        "spoilage_risk_pct": 58,
        "first_log_timestamp": "2026-08-22T06:00:00",
        "last_log_timestamp": "2026-08-22T12:00:00",
    }

    response = client.get("/api/v5/logs/FG-2026-ANA-001/analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["batch_id"] == "FG-2026-ANA-001"
    assert data["analytics"]["log_count"] == 12
    assert data["analytics"]["spoilage_risk_class"] == "HIGH"
    assert data["analytics"]["temperature_trend"] == "RISING"


@patch("routers.batches.database")
def test_log_analytics_batch_not_found(mock_db):
    """GET /api/v5/logs/{batch_id}/analytics returns 404 for missing batch."""
    mock_db.db.is_connected = True
    mock_db.get_batch.return_value = None

    response = client.get("/api/v5/logs/NONEXISTENT/analytics")
    assert response.status_code == 404


def test_log_analytics_uses_in_memory_fallback():
    """GET /api/v5/logs/{batch_id}/analytics uses in-memory fallback when PostgreSQL is unavailable."""
    from db import mem_store
    # Create a batch and add a log entry
    mem_store.persist_batch("FG-2026-ANAFB", 200.0, "2026-08-22T00:00:00Z", 85.0, "Optimal", False, "QR-ANAFB")
    mem_store.insert_environmental_log("FG-2026-ANAFB", 28.0, 65.0)
    mem_store.insert_environmental_log("FG-2026-ANAFB", 32.0, 70.0)
    response = client.get("/api/v5/logs/FG-2026-ANAFB/analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["analytics"]["log_count"] == 2


# ====================================================================================
# OFFLINE SYNC GATEWAY TESTS
# ====================================================================================

@patch("sync_gateway.database.db")
@patch("sync_gateway.CryptographicPassportEngine")
def test_sync_gateway_processes_offline_transactions(mock_passport, mock_db):
    """POST /api/v5/sync/process-queue processes offline transaction batches."""
    mock_db.is_connected = True
    mock_db.persist_batch.return_value = {"batch_id": "SYNC-001"}
    mock_db.insert_environmental_log.return_value = {}
    mock_passport.generate_batch_expiry.return_value = "2026-08-29T00:00:00+00:00"
    mock_passport.generate_secure_qr_token.return_value = {
        "qr_passport_token": "test.token",
        "raw_payload_verify_string": "test",
    }

    response = client.post("/api/v5/sync/process-queue", json={
        "farmer_id": "FARMER-001",
        "device_sync_timestamp": "2026-08-22T10:00:00+00:00",
        "transactions": [{
            "client_local_id": "LOCAL-001",
            "batch_id": "SYNC-001",
            "crop_type": "Tomatoes",
            "weight_kg": 200.0,
            "harvest_timestamp": "2026-08-22T08:00:00+00:00",
            "cached_lat": 13.69,
            "cached_lng": 78.46,
            "is_ventilated": True,
            "manual_color_index": 2,
            "manual_bruise_index": 1,
        }],
    })
    assert response.status_code == 200
    data = response.json()
    assert data["sync_status"] == "COMPLETED"
    assert len(data["synced_client_ids"]) == 1
    assert len(data["failed_records"]) == 0
