"""
Comprehensive End-to-End Idea & Vision Verification Script for Annapurna FreshGuard.

Validates:
1. AI Vision Sensor Layer (Mock upload & AGMARK schema extraction)
2. Ethylene Gas Multiplier Layer (Ventilated vs unventilated cargo)
3. ISRO Satellite NDVI Spectral Modifier (Stressed vs healthy vegetation)
4. Non-Linear Q10 Biological Respiration Kinetics & Plan-B Salvage Routing
5. Multilingual Annapurna Vaani Voice Assistant & Navigation Routing
"""

import sys
import os
import json
import logging
import asyncio
from typing import Dict, Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from engines.vision import run_vision_sensor_layer, get_genai_client
from engines.ethylene import EthyleneGasCore
from engines.satellite import SatelliteDataCore
from engines.logistics import LogisticsKineticsCore, MandiDestinationInput
from models import SecondaryFallbackInput, VisionAgronomySchema

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("FreshGuardVerifier")


class MockUploadFile:
    def __init__(self, data: bytes, content_type: str = "image/jpeg"):
        self.data = data
        self.content_type = content_type

    async def read(self) -> bytes:
        return self.data


async def test_vision_engine_mock_and_parsing():
    print("\n==================================================================")
    print("📷 TEST 1: AI AGRO-VISION SCHEMA & SPOILAGE DETECTION ENGINE")
    print("==================================================================")
    
    # 1. Test Deterministic / Gemini fallback with mock image buffers
    mock_file_ripe = MockUploadFile(b"test_image_bytes_for_optimal_ripe_tomato_payload_123456789")
    result_ripe = await run_vision_sensor_layer(mock_file_ripe)
    
    print("✅ Parsed Agro-Vision Output:")
    print(f"   - Identified Crop: {result_ripe.crop_identified}")
    print(f"   - Quality Score: {result_ripe.visual_quality_score}/100")
    print(f"   - Ripeness Stage: {result_ripe.ripeness_stage}")
    print(f"   - Fungal Pathogen: {result_ripe.fungal_pathogen_presence}")
    print(f"   - Confidence: {result_ripe.confidence}%")
    
    assert isinstance(result_ripe, VisionAgronomySchema)
    assert 0 <= result_ripe.visual_quality_score <= 100
    assert result_ripe.ripeness_stage in ["Unripe", "Optimal", "Overripe"]
    print("\n✅ AI Vision Pipeline Test: PASSED")


def test_ethylene_gas_dynamics():
    print("\n==================================================================")
    print("🧪 TEST 2: ETHYLENE CROSS-CONTAMINATION DYNAMICS")
    print("==================================================================")
    
    # Ventilated vs closed
    ventilated = EthyleneGasCore.compute_gas_multiplier(
        crop="tomatoes", ripeness="Optimal", co_habitants=[], ventilated=True
    )
    closed = EthyleneGasCore.compute_gas_multiplier(
        crop="tomatoes", ripeness="Optimal", co_habitants=[], ventilated=False
    )
    
    # Co-habitant with overripe climacteric mangoes
    co_habitant_factor = EthyleneGasCore.compute_gas_multiplier(
        crop="tomatoes",
        ripeness="Optimal",
        co_habitants=[{"crop_type": "mangoes", "ripeness_stage": "Overripe", "approximate_weight_kg": 150.0}],
        ventilated=False
    )
    
    print(f"   - Single Crop (Ventilated Truck): {ventilated:.2f}x decay velocity")
    print(f"   - Single Crop (Closed Container): {closed:.2f}x decay velocity")
    print(f"   - Co-Transport with Overripe Climacteric Mangoes: {co_habitant_factor:.2f}x accelerated decay velocity")
    
    assert ventilated < closed
    assert co_habitant_factor > closed
    print("\n✅ Ethylene Dynamics Test: PASSED")


def test_satellite_ndvi_modifier():
    print("\n==================================================================")
    print("🛰️ TEST 3: ISRO SATELLITE NDVI SPECTRAL HEALTH MODIFIERS")
    print("==================================================================")
    sat = SatelliteDataCore()
    
    stressed_mod = sat.compute_ndvi_modifier(0.30)
    healthy_mod = sat.compute_ndvi_modifier(0.72)
    interpolated_mod = sat.compute_ndvi_modifier(0.525)
    
    print(f"   - Stressed Canopy (NDVI 0.30): {stressed_mod:.2f}x multiplier (15% shelf-life penalty)")
    print(f"   - Healthy Canopy (NDVI 0.72): {healthy_mod:.2f}x multiplier (100% full shelf-life)")
    print(f"   - Moderate Canopy (NDVI 0.525): {interpolated_mod:.2f}x multiplier")
    
    assert stressed_mod == 0.85
    assert healthy_mod == 1.00
    assert 0.90 <= interpolated_mod <= 0.95
    print("\n✅ Satellite NDVI Modifier Test: PASSED")


def test_q10_respiration_and_smart_move():
    print("\n==================================================================")
    print("🚚 TEST 4: NON-LINEAR Q10 RESPIRATION & SMART MOVE ROUTE ARBITRAGE")
    print("==================================================================")
    
    targets = [
        MandiDestinationInput(
            mandi_name="Nashik Local Mandi",
            distance_km=18.0,
            transit_duration_hours=0.75,
            expected_market_price_per_kg=24.0,  # ₹2,400/qtl
            ambient_temp_c=30.0,
            potential_fallbacks=[
                SecondaryFallbackInput(
                    facility_name="Nashik Cold Storage Hub",
                    facility_type="Cold_Storage",
                    distance_from_mandi_km=4.0,
                    transit_hours_from_mandi=0.2,
                    guaranteed_floor_price_per_kg=20.0
                )
            ]
        ),
        MandiDestinationInput(
            mandi_name="Vashi Navi Mumbai Terminal",
            distance_km=168.0,
            transit_duration_hours=4.5,
            expected_market_price_per_kg=34.0,  # ₹3,400/qtl (+41% premium)
            ambient_temp_c=32.0,
            potential_fallbacks=[
                SecondaryFallbackInput(
                    facility_name="Mumbai Kissan Processing Plant",
                    facility_type="Processing_Plant",
                    distance_from_mandi_km=12.0,
                    transit_hours_from_mandi=0.6,
                    guaranteed_floor_price_per_kg=28.0
                )
            ]
        ),
        MandiDestinationInput(
            mandi_name="Pune Gultekdi Market",
            distance_km=210.0,
            transit_duration_hours=5.5,
            expected_market_price_per_kg=31.5,
            ambient_temp_c=31.0,
            potential_fallbacks=[]
        )
    ]

    routes = LogisticsKineticsCore.simulate_routing_futures(
        crop="tomatoes",
        base_life_days=9.0,
        quantity_kg=1000.0,  # 1 tonne
        ethylene_mult=1.0,
        ndvi_modifier=0.98,
        targets=targets
    )

    for idx, r in enumerate(routes, 1):
        print(f"\nRank #{idx}: 🏆 {r['mandi_destination_name']}")
        print(f"   - Expected Arrival Shelf-Life: {r['expected_shelf_life_on_arrival_days']} days")
        print(f"   - Estimated Net Profit Margin: ₹{r['estimated_primary_net_profit_inr']:.2f}")
        print(f"   - Resilience Status: {r['resilience_status']}")
        print(f"   - Plan-B Salvage Backup: {r['backup_plan_b_route']}")

    # Vashi Mumbai should be #1 recommendation due to massive price arbitrage + Airtight Plan-B
    assert routes[0]["mandi_destination_name"] == "Vashi Navi Mumbai Terminal"
    assert routes[0]["estimated_primary_net_profit_inr"] > routes[1]["estimated_primary_net_profit_inr"]
    print("\n✅ Q10 Respiration & Smart Move Test: PASSED")


async def test_annapurna_vaani_voice():
    print("\n==================================================================")
    print("🎙️ TEST 5: ANNAPURNA VAANI MULTILINGUAL SPEECH & AUTO-ROUTING")
    print("==================================================================")
    from routers.voice import voice_assistant, VoiceQueryRequest

    queries = [
        ("ఈరోజు మార్కెట్ రేటు ఎంత ఉంది?", "te", "Telugu Mandi Price Query"),
        ("आज नासिक मंडी में क्या भाव है?", "hi", "Hindi Mandi Price Query"),
        ("How is the weather for harvesting?", "en", "English Weather Query"),
        ("माझ्या पिकाची गुणवत्ता तपासायची आहे", "mr", "Marathi Quality Scan Query"),
    ]

    for query, lang, label in queries:
        req = VoiceQueryRequest(query=query, language=lang, crop="Tomato", location="Nashik")
        res = await voice_assistant(req)
        print(f"\n🗣️ [{label}] - Language: {lang.upper()}")
        print(f"   - Farmer Spoke: \"{query}\"")
        print(f"   - Vaani Audio: \"{res.spoken_text[:90]}...\"")
        print(f"   - English Translation: \"{res.english_translation[:90]}...\"")
        print(f"   - Autonomous Auto-Navigation: 🚀 [{res.action}] -> Label: {res.action_label}")
        assert res.spoken_text is not None and len(res.spoken_text) > 0
        assert res.action in ["NAVIGATE_MARKET", "NAVIGATE_SCAN", "NAVIGATE_WEATHER", "NAVIGATE_SMART_MOVE", "NAVIGATE_CROPS", None]

    print("\n✅ Annapurna Vaani Voice Engine Test: PASSED")


async def run_all():
    print("\n==================================================================")
    print("🚀 STARTING FULL PLATFORM IDEA & ALGORITHM VERIFICATION")
    print("==================================================================")
    await test_vision_engine_mock_and_parsing()
    test_ethylene_gas_dynamics()
    test_satellite_ndvi_modifier()
    test_q10_respiration_and_smart_move()
    await test_annapurna_vaani_voice()
    print("\n==================================================================")
    print("🎉 ALL 5 PLATFORM ENGINES & IDEA FUNCTIONALITY VERIFIED 100% OPERATIONAL!")
    print("==================================================================")


if __name__ == "__main__":
    asyncio.run(run_all())
