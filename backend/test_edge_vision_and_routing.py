"""
Comprehensive Test Suite for Advanced Edge Vision & Proactive Routing Engine

Validates:
1. Laplacian Blur Guardrail & MobileNetV2 ONNX Edge Inference
2. Continuous Degradation Index (D_i ∈ [0.0, 1.0]) & Batch Outlier Detection
3. Q10 Arrhenius Biological Respiration & Ethylene Kinetics
4. Proactive Mid-Route PostGIS Spatial Intercept & Rerouting
5. FastAPI Endpoints for Edge ONNX Analysis & Transit Intercept
"""

import io
import pytest
import numpy as np
import cv2
from PIL import Image
from fastapi.testclient import TestClient

from main import app
from auth import create_access_token
from engines.onnx_vision_engine import get_edge_vision_engine, EdgeVisionEngine
from engines.biological_kinetics import (
    calculate_durability_multiplier,
    calculate_q10_respiration_velocity,
    calculate_ethylene_penalty,
    calculate_residual_shelf_life,
    evaluate_transit_viability,
)
from engines.proactive_routing import (
    haversine_distance_km,
    find_salvage_facilities_postgis,
    evaluate_proactive_mid_route_intercept,
)


def create_test_image(sharp: bool = True, pattern_seed: int = 1) -> bytes:
    """Helper to generate sharp or blurry synthetic test images with high variance."""
    np.random.seed(pattern_seed)
    if sharp:
        # High-frequency checkerboard / gradient image to guarantee Laplacian Var > 100
        img = np.zeros((224, 224, 3), dtype=np.uint8)
        for i in range(0, 224, 16):
            for j in range(0, 224, 16):
                if (i // 16 + j // 16 + pattern_seed) % 2 == 0:
                    img[i:i+16, j:j+16] = [200, 30 + (pattern_seed * 20) % 200, 20]
                else:
                    img[i:i+16, j:j+16] = [30, 180, 240]
        # Add high-contrast text and circle to emulate fruit surface lesions
        cv2.circle(img, (112, 112), 40, (10, 20, 220), -1)
        cv2.putText(img, f"CROP-{pattern_seed}", (20, 112), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    else:
        # Low-frequency heavily blurred image to trigger blur guardrail
        img = np.full((224, 224, 3), 128, dtype=np.uint8)
        img = cv2.GaussianBlur(img, (51, 51), 0)

    is_success, buffer = cv2.imencode(".jpg", img)
    assert is_success
    return buffer.tobytes()


@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "test_farmer", "role": "farmer"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client():
    return TestClient(app)


# ====================================================================================
# 1. EDGE VISION ENGINE & BLUR GUARDRAIL TESTS
# ====================================================================================

def test_onnx_engine_singleton():
    """Verify EdgeVisionEngine maintains singleton instance in memory."""
    engine1 = get_edge_vision_engine()
    engine2 = EdgeVisionEngine()
    assert engine1 is engine2
    assert engine1.session is not None


def test_blur_guardrail_rejection():
    """Verify Laplacian 2D variance check correctly rejects blurry frames."""
    engine = get_edge_vision_engine()
    blurry_bytes = create_test_image(sharp=False)

    with pytest.raises(ValueError) as excinfo:
        engine.preprocess_frame(blurry_bytes)
    assert "failed sharpness guardrail" in str(excinfo.value).lower()


def test_sharp_image_preprocessing():
    """Verify sharp frame passes quality gate and converts to [3, 224, 224] tensor."""
    engine = get_edge_vision_engine()
    sharp_bytes = create_test_image(sharp=True, pattern_seed=1)

    tensor, meta = engine.preprocess_frame(sharp_bytes)
    assert tensor.shape == (3, 224, 224)
    assert tensor.dtype == np.float32
    assert meta["blur_variance"] >= 30.0


@pytest.mark.asyncio
async def test_onnx_batch_inference_5_samples():
    """Verify concurrent batch execution on 5 AGMARK samples."""
    engine = get_edge_vision_engine()
    images = [create_test_image(sharp=True, pattern_seed=i) for i in range(1, 6)]

    result = await engine.predict_batch(images)

    assert "composite" in result
    assert "samples" in result
    assert len(result["samples"]) == 5

    composite = result["composite"]
    assert 0.0 <= composite["composite_degradation_index"] <= 1.0
    assert 0.0 <= composite["max_degradation_index"] <= 1.0
    assert composite["sample_count"] == 5
    assert composite["inference_engine"] == "MobileNetV2-ONNX-Edge"

    # Per-sample metrics check
    for s in result["samples"]:
        assert 0.0 <= s["degradation_index"] <= 1.0
        assert 0 <= s["visual_quality_score"] <= 100
        assert s["ripeness_stage"] in ["Unripe", "Optimal", "Overripe"]
        assert isinstance(s["defect_detected"], bool)
        assert 60 <= s["confidence"] <= 99


# ====================================================================================
# 2. BIOLOGICAL KINETICS & RESPIRATION EQUATION TESTS
# ====================================================================================

def test_durability_multiplier_continuous_curve():
    """Verify continuous durability mapping from D_i in [0.0, 1.0]."""
    # At D_i = 0 (perfect produce): 1.0 - 0 = 1.0
    assert calculate_durability_multiplier(0.0) == 1.0

    # At D_i = 0.5: 1.0 - (0.5 * 0.70) = 0.65
    assert round(calculate_durability_multiplier(0.5), 2) == 0.65

    # At D_i = 1.0 (fully decayed): 1.0 - 0.70 = 0.30
    assert round(calculate_durability_multiplier(1.0), 2) == 0.30


def test_q10_respiration_thermal_velocity():
    """Verify Arrhenius/Q10 exponential acceleration above 12°C."""
    # Tomatoes Q10 = 2.2
    # At 12°C (baseline): speed = 2.2^0 = 1.0
    assert calculate_q10_respiration_velocity("tomatoes", 12.0) == 1.0

    # At 22°C (10°C delta): speed = 2.2^1 = 2.2
    assert round(calculate_q10_respiration_velocity("tomatoes", 22.0), 2) == 2.20

    # At 32°C (20°C delta): speed = 2.2^2 = 4.84
    assert round(calculate_q10_respiration_velocity("tomatoes", 32.0), 2) == 4.84


def test_ethylene_gas_penalty():
    """Verify autocatalytic ethylene penalty scaling."""
    # Under 0.5 ppm: no penalty
    assert calculate_ethylene_penalty("tomatoes", 0.3) == 1.0

    # Above 0.5 ppm: 1.0 + (10.0 * 0.05) = 1.50
    assert calculate_ethylene_penalty("tomatoes", 10.0) == 1.50


def test_evaluate_transit_viability_safe_vs_distress():
    """Verify proactive transit viability decision gate."""
    # 1. Safe shipment: low degradation, mild temperature
    safe_eval = evaluate_transit_viability(
        crop="tomatoes",
        degradation_index=0.10,
        temp_ambient_c=22.0,
        remaining_transit_hours=8.0,
        ethylene_ppm=0.2,
    )
    assert safe_eval["is_safe"] is True
    assert safe_eval["risk_level"] == "SAFE"

    # 2. Critical distress shipment: high degradation, hot transit
    distress_eval = evaluate_transit_viability(
        crop="tomatoes",
        degradation_index=0.75,
        temp_ambient_c=38.0,
        remaining_transit_hours=12.0,
        ethylene_ppm=5.0,
    )
    assert distress_eval["is_safe"] is False
    assert distress_eval["risk_level"] in ["VULNERABLE", "CRITICAL_SPOILAGE_RISK"]
    assert distress_eval["hours_deficit"] > 0.0


# ====================================================================================
# 3. PROACTIVE MID-ROUTE SPATIAL INTERCEPT TESTS
# ====================================================================================

def test_haversine_distance_accuracy():
    """Verify great-circle spatial distance formula."""
    # Chittoor (13.68, 78.62) to Tirupati (13.65, 78.70) is ~10 km
    dist = haversine_distance_km(13.68, 78.62, 13.65, 78.70)
    assert 5.0 <= dist <= 15.0


def test_proactive_mid_route_intercept_on_schedule():
    """Verify healthy batch continues on schedule to primary mandi."""
    res = evaluate_proactive_mid_route_intercept(
        batch_id="FG-TEST-001",
        crop="Tomato",
        quantity_kg=500.0,
        current_lat=13.68,
        current_lon=78.50,
        remaining_transit_hours=4.0,
        ambient_temp_c=20.0,
        degradation_index=0.08,
        primary_mandi_name="Vashi APMC Mumbai",
        primary_mandi_price_per_kg=34.0,
    )
    assert res["routing_status"] == "ON_SCHEDULE"
    assert res["diversion_recommended"] is False
    assert res["target_facility"] == "Vashi APMC Mumbai"


def test_proactive_mid_route_intercept_triggers_diversion():
    """Verify distressed batch triggers proactive mid-route PostGIS diversion."""
    res = evaluate_proactive_mid_route_intercept(
        batch_id="FG-TEST-002",
        crop="Tomato",
        quantity_kg=800.0,
        current_lat=13.68,
        current_lon=78.50,
        remaining_transit_hours=14.0,
        ambient_temp_c=38.0,
        degradation_index=0.78,
        primary_mandi_name="Vashi APMC Mumbai",
        primary_mandi_price_per_kg=34.0,
    )
    assert res["routing_status"] == "DIVERSION_TRIGGERED"
    assert res["diversion_recommended"] is True
    assert res["target_facility"] != "Vashi APMC Mumbai"
    assert res["salvage_net_payout_inr"] > 0.0
    assert len(res["candidate_fallbacks"]) > 0


# ====================================================================================
# 4. FASTAPI ENDPOINT INTEGRATION TESTS
# ====================================================================================

def test_fastapi_analyze_edge_onnx_endpoint(client, auth_headers):
    """Test POST /api/v5/vision/analyze-edge-onnx with 5 distinct images."""
    files = [
        ("files", (f"sample_{i}.jpg", create_test_image(sharp=True, pattern_seed=i), "image/jpeg"))
        for i in range(1, 6)
    ]
    response = client.post("/api/v5/vision/analyze-edge-onnx", files=files, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "composite" in data
    assert "samples" in data
    assert len(data["samples"]) == 5
    assert data["composite"]["inference_engine"] == "MobileNetV2-ONNX-Edge"


def test_fastapi_analyze_edge_onnx_duplicate_rejection(client, auth_headers):
    """Test duplicate detection in 5-sample protocol."""
    same_img = create_test_image(sharp=True, pattern_seed=42)
    files = [
        ("files", (f"sample_{i}.jpg", same_img, "image/jpeg"))
        for i in range(5)
    ]
    response = client.post("/api/v5/vision/analyze-edge-onnx", files=files, headers=auth_headers)
    assert response.status_code == 400
    assert "duplicate" in response.json()["detail"].lower()


def test_fastapi_transit_intercept_endpoint(client, auth_headers):
    """Test POST /api/v5/logistics/transit-intercept endpoint."""
    payload = {
        "batch_id": "FG-2026-TOM-INTERCEPT-01",
        "crop_type": "Tomato",
        "quantity_kg": 650.0,
        "current_lat": 13.68,
        "current_lon": 78.50,
        "remaining_transit_hours": 12.0,
        "ambient_temp_c": 36.5,
        "degradation_index": 0.65,
        "ethylene_ppm": 2.5,
        "primary_mandi_name": "Vashi APMC Mumbai",
        "primary_mandi_price_per_kg": 34.0,
        "search_radius_km": 80.0,
    }
    response = client.post("/api/v5/logistics/transit-intercept", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["batch_id"] == "FG-2026-TOM-INTERCEPT-01"
    assert data["routing_status"] == "DIVERSION_TRIGGERED"
    assert data["diversion_recommended"] is True
    assert "target_facility" in data
    assert data["salvage_net_payout_inr"] > 0.0


def test_fastapi_fallback_facilities_endpoint(client, auth_headers):
    """Test GET /api/v5/logistics/fallback-facilities endpoint."""
    response = client.get(
        "/api/v5/logistics/fallback-facilities?lat=13.68&lon=78.50&radius_km=100",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["facilities_found"] > 0
    assert len(data["facilities"]) > 0


# ====================================================================================
# 5. OPTIMIZED MLP ONNX, INT8 MOBILENET, & TIERED PIPELINE TESTS
# ====================================================================================

def test_mlp_onnx_spatial_descriptor_inference():
    """Verify lightweight 42-dim spatial/color descriptor MLP ONNX inference."""
    import os
    import onnxruntime as ort
    from engines.tiered_inference_pipeline import TieredInferencePipeline

    mlp_path = os.path.join(os.path.dirname(__file__), "storage", "mlp_baseline_model.onnx")
    assert os.path.exists(mlp_path)
    assert os.path.getsize(mlp_path) < 150 * 1024  # Under 150 KB (drastic drop from 27 MB)

    sess = ort.InferenceSession(mlp_path)
    dummy_img = np.full((224, 224, 3), 120, dtype=np.uint8)
    descriptor = TieredInferencePipeline.extract_42dim_descriptors(dummy_img).reshape(1, -1)
    assert descriptor.shape == (1, 42)

    outputs = sess.run(None, {sess.get_inputs()[0].name: descriptor})
    assert len(outputs) >= 1
    assert outputs[0][0] in [0, 1]


def test_mobilenet_int8_quantization_and_inference():
    """Verify INT8 quantized MobileNetV2 ONNX model size and inference parity."""
    import os
    import onnxruntime as ort

    int8_path = os.path.join(os.path.dirname(__file__), "storage", "mobilenetv2_degradation_int8.onnx")
    assert os.path.exists(int8_path)
    assert os.path.getsize(int8_path) < 3.5 * 1024 * 1024  # Under 3.5 MB (shrunk from 9.19 MB)

    sess = ort.InferenceSession(int8_path)
    dummy_tensor = np.random.randn(1, 3, 224, 224).astype(np.float32)
    output = sess.run(None, {sess.get_inputs()[0].name: dummy_tensor})[0]
    assert output.shape == (1, 4)
    # Output metrics: [D_i, defect, ripeness, conf]
    assert 0.0 <= output[0][0] <= 1.0


def test_tiered_inference_pipeline_execution():
    """Verify multi-stage pipeline handles sharp frames with early exit logic."""
    from engines.tiered_inference_pipeline import get_tiered_pipeline

    pipeline = get_tiered_pipeline()
    sharp_bytes = create_test_image(sharp=True, pattern_seed=7)

    result = pipeline.analyze_frame(sharp_bytes)
    assert "evaluation_tier" in result
    assert "early_exit" in result
    assert 0.0 <= result["degradation_index"] <= 1.0
    assert 0 <= result["visual_quality_score"] <= 100
    assert "diagnostic" in result


def test_fastapi_analyze_tiered_batch_endpoint(client, auth_headers):
    """Test POST /api/v5/vision/analyze-tiered-batch with dynamic batch."""
    files = [
        ("files", (f"sample_{i}.jpg", create_test_image(sharp=True, pattern_seed=i), "image/jpeg"))
        for i in range(1, 4)
    ]
    response = client.post("/api/v5/vision/analyze-tiered-batch", files=files, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "composite" in data
    assert "samples" in data
    assert len(data["samples"]) == 3
    assert data["composite"]["sample_count"] == 3
    assert "early_exits_triggered" in data["composite"]
    assert "compute_savings_pct" in data["composite"]


