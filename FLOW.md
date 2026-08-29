# FLOW.md — FreshGuard / Annapurna

> How execution travels through the system. What calls what, in what order.

---

## 1. Primary Harvest Evaluation Flow

This is the core pipeline — the most complex and most important data path.

```
Mobile (ScanScreen)
  │
  ├─ POST /api/v5/harvest/evaluate-all
  │   Params: batch_id, batch_weight_kg, is_vehicle_ventilated,
  │           co_habitants_json, destinations_json, latitude, longitude
  │   Body: crop image (UploadFile)
  │
  ▼
backend/main.py :: process_unified_harvest_call()
  │
  ├─ 1. VISION PIPELINE (run_vision_sensor_layer)
  │     │
  │     ├─ FreeLLMAPI Gateway (if FREELLMAPI_KEY set)
  │     │   └─ httpx.AsyncClient → POST to FREELLMAPI_BASE_URL/chat/completions
  │     │      Returns: VisionAgronomySchema (crop, score, ripeness, pathogen)
  │     │
  │     ├─ Google Gemini SDK (if GEMINI_API_KEY set)
  │     │   └─ genai.Client.models.generate_content()
  │     │      Returns: VisionAgronomySchema
  │     │
  │     └─ Deterministic fallback (always succeeds)
  │         Returns: VisionAgronomySchema (Tomatoes, 85, Optimal, False)
  │
  ├─ 2. ETHYLENE GAS ENGINE (EthyleneGasCore.compute_gas_multiplier)
  │     │
  │     ├─ Input: crop type, ripeness, co-habitants, ventilation
  │     ├─ Models: chemical gas PPM in sealed truck container
  │     ├─ Output: multiplier (1.00 = safe, up to 4.00 = lethal)
  │     └─ File: backend/main.py :: class EthyleneGasCore
  │
  ├─ 3. SATELLITE INTELLIGENCE (satellite_core.fetch_satellite_intelligence)
  │     │
  │     ├─ ISRO Bhoonidhi STAC API
  │     │   └─ bhoonidhi_client.py :: BhoonidhiClient
  │     │      authenticate() → search_ndvi_data(lat, lng)
  │     │
  │     ├─ Extract NDVI from features
  │     │   └─ compute_ndvi_modifier(ndvi_value)
  │     │      < 0.40 → 0.85 (stressed)
  │     │      > 0.65 → 1.00 (healthy)
  │     │
  │     └─ Output: {ndvi_value, ndvi_modifier, api_status}
  │
  ├─ 4. PATHOGEN CHECK
  │     │
  │     ├─ If fungal_pathogen_presence == True:
  │     │   └─ Return TERMINAL_DESTROY response immediately
  │     │      (shelf life = 0, profit = 0, disposal only)
  │     │
  │     └─ If False: continue to Q10
  │
  ├─ 5. Q10 RESPIRATION + PLAN-B ROUTING (LogisticsKineticsCore)
  │     │
  │     ├─ Input: crop, base_life, quantity, ethylene, ndvi, destinations
  │     ├─ For each mandi destination:
  │     │   ├─ Q10 decay: thermal_speed = q10 ^ (temp_delta / 10)
  │     │   ├─ Unified decay: thermal_speed × ethylene_multiplier
  │     │   ├─ Transit loss: (transit_hours × decay) / 24
  │     │   ├─ Arrival shelf life: base_life × ndvi_modifier - transit_loss
  │     │   ├─ Net profit: (quantity × market_price) - (distance × ₹5/km)
  │     │   └─ Plan-B: check nearby cold storage/processing for salvage
  │     │
  │     ├─ Rank by: net_profit × resilience_weight
  │     └─ Output: ranked list of itineraries
  │
  ├─ 6. PERSIST TO DB (_persist_evaluation_batch)
  │     │
  │     ├─ database.persist_batch() → PostgreSQL or InMemoryStore
  │     └─ Best-effort: logs errors, doesn't fail the request
  │
  └─ 7. RETURN UnifiedDecisionResponse
        Vision + ethylene + satellite + ranked logistics
```

---

## 2. Batch CRUD Flow

Simple CRUD — no AI pipeline.

```
POST   /api/v5/batches           → database.persist_batch()
GET    /api/v5/batches           → database.list_batches(status, limit, offset)
GET    /api/v5/batches/{id}      → database.get_batch(id)
PATCH  /api/v5/batches/{id}/status → database.update_batch_status(id, new_status)
DELETE /api/v5/batches/{id}      → database.update_batch_status(id, "SPOILED")
```

Each routes through `db.py` which checks `db.is_connected`:
- **True**: SQL queries via psycopg2 pool
- **False**: `InMemoryStore` methods (dict-based)

---

## 3. What-If Scenario Flow

```
POST /api/v5/whatif/simulate
  │
  ├─ Compute base shelf life from visual_score
  ├─ Compute Q10 decay velocity
  ├─ Optionally fetch weather (if lat/lng provided)
  │
  ├─ Generate 4 scenarios:
  │   1. Sell locally now (low risk, moderate price)
  │   2. Transport to distant mandi (higher price, transit loss)
  │   3. Store overnight (possible price increase, storage cost)
  │   4. Send to processing (guaranteed floor price, 35% discount)
  │
  ├─ Rank by risk-adjusted score (profit × risk_weight)
  └─ Return ranked scenarios
```

---

## 4. Weather + Alerts Flow

```
GET /api/v5/weather?lat=&lng=
  │
  ├─ If OPENWEATHER_API_KEY set:
  │   └─ httpx → api.openweathermap.org/data/2.5/weather
  ├─ Else: return degraded defaults (32°C, 60% humidity)
  └─ Return: {temp, humidity, description, rain_chance}

GET /api/v5/weather/alerts?lat=&lng=&crop_type=
  │
  ├─ Calls get_weather() internally
  ├─ Computes Q10 thermal acceleration
  ├─ Generates alerts: CRITICAL (>35°C), HIGH (>30°C), MEDIUM (humidity/rain), LOW (cool)
  └─ Return: {alerts[], thermal_acceleration_factor}
```

---

## 5. Passport Flow

```
POST /api/v5/passport/generate?batch_id=&crop_type=&weight_kg=&visual_score=&expiry_days=
  │
  ├─ CryptographicPassportEngine.generate_secure_qr_token(metadata)
  │   ├─ Build structured payload string
  │   ├─ HMAC-SHA256 sign with PASSPORT_HMAC_SECRET
  │   ├─ Base64-encode payload + signature
  │   └─ Return: {qr_passport_token, raw_payload, expiry_timestamp}

POST /api/v5/passport/verify?token=
  │
  ├─ CryptographicPassportEngine.verify_passport_integrity(token)
  │   ├─ Split token on "."
  │   ├─ Decode payload + signature
  │   ├─ Recompute HMAC, constant-time compare
  │   └─ Return: {status, batch_id, crop_type, ...} or 401
```

---

## 6. File Relationships

```
backend/main.py
  ├── imports db.py            (database operations)
  ├── imports passport.py      (QR generation/verification)
  ├── imports bhoonidhi_client.py  (ISRO Bhoonidhi STAC)
  ├── imports vedas_scraper.py     (ISRO VEDAS WMS)
  ├── imports sync_gateway.py      (offline sync router)
  └── includes sync_router         (mounted as sub-router)

mobile/src/services/api.ts
  └── calls all /api/v5/* endpoints via fetch()
```

---

## Key Insight: No Cross-Module Calls

Almost all logic lives in `backend/main.py`. The other files are thin clients:
- `db.py` — pure data access (no business logic)
- `passport.py` — pure crypto (no HTTP)
- `bhoonidhi_client.py` — pure API client (no business logic)
- `vedas_scraper.py` — pure API client (no business logic)
- `sync_gateway.py` — pure router (delegates to db.py)

This is why splitting main.py into routers is the logical next step — the modules are already isolated.
