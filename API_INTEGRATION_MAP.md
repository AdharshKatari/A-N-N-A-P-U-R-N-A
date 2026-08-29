# API INTEGRATION MAP — FreshGuard/Annapurna

**Date**: 2026-08-26  
**Scope**: Complete mapping of UI components to backend APIs, data requirements, and integration status

---

## BACKEND ARCHITECTURE OVERVIEW

**Base URL**: `http://localhost:8001/api/v5/` (dev)  
**Framework**: FastAPI + PostgreSQL/PostGIS + Redis  
**Auth**: JWT (HS256) + reCAPTCHA v2  
**Rate Limits**: 10/min (harvest), 30/min (whatif), 60/min (general)

---

## ENDPOINT INVENTORY

### Health & Dashboard
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/health` | GET | No | `healthCheck()` | ✅ Working | Returns DB status |
| `/dashboard` | GET | Yes | `getDashboard()` | ✅ Working | Returns batch stats, status breakdown, weight totals |

### Batch Management
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/batches` | POST | Yes | `createBatch()` | ✅ Working | Creates batch, returns batch_id + QR token |
| `/batches` | GET | Yes | `listBatches()` | ✅ Working | Supports status filter, pagination |
| `/batches/{id}` | GET | Yes | `getBatch()` | ✅ Working | Full batch details |
| `/batches/{id}/status` | PATCH | Yes | `updateBatchStatus()` | ✅ Working | ACTIVE → TRANSIT → SOLD/SPOILED |
| `/batches/{id}` | DELETE | Yes | — | ✅ Working | Soft delete (sets SPOILED) |

### Environmental Logs (Telemetry)
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/logs` | POST | Yes | `ingestLog()` | ✅ Working | Temp, humidity, GPS, timestamp |
| `/logs/{batchId}` | GET | Yes | `getLogs()` | ✅ Working | Latest 100 by default |
| `/logs/{batchId}/analytics` | GET | Yes | `getLogAnalytics()` | ✅ Working | Degree-hours, spoilage risk, trends |

### Harvest Evaluation (Core Pipeline)
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/harvest/evaluate-all` | POST | Yes | `evaluateHarvest()` | ✅ Working | Multi-part: image + JSON params. 4-layer pipeline |
| `/vision/analyze` | POST | Yes | `analyzeImage()` | ✅ Working | Single image, returns VisionAgronomySchema |
| `/vision/analyze-batch` | POST | Yes | — | ✅ Working | 3-5 images, aggregated results |

### Satellite / ISRO Bhoonidhi
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/satellite/vedas/live` | GET | No | `getVedasLive()` | ⚠️ Fallback | Requires ISRO credentials (not configured) |
| `/satellite/vedas/multi-layer` | GET | No | — | ⚠️ Fallback | NDVI + SMAP soil moisture |

### Weather (OpenWeatherMap Proxy)
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/weather` | GET | No | `getWeatherByCoords()` | ✅ Working | Falls back to 32°C/60% if no API key |
| `/weather/alerts` | GET | No | `getWeatherAlerts()` | ✅ Working | Q10 thermal acceleration + spoilage risk |

### What-If Simulation
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/whatif/simulate` | POST | Optional | `simulateWhatIf()` | ✅ Working | 4 scenarios: sell local, transport, store, processing |

### Mandi Prices (data.gov.in)
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/mandi/prices` | GET | No | `getMandiPrices()` | ✅ Working | Falls back to hardcoded prices if no API key |

### Salvage Facilities (PostGIS)
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/salvage/nearby` | GET | No | `getNearbySalvage()` | ⚠️ Mock Data | Returns 3 hardcoded facilities from in-memory store |

### QR Passport
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/passport/generate` | POST | Yes | `generatePassport()` | ✅ Working | HMAC-SHA256 signed token |
| `/passport/verify` | POST | No | `verifyPassport()` | ✅ Working | Validates token integrity |

### Offline Sync
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/sync/process-queue` | POST | Yes | `syncOfflineQueue()` | ✅ Backend Ready | Mobile queue implemented, needs wiring |

### Auth
| Endpoint | Method | Auth | Mobile Consumer | Status | Notes |
|----------|--------|------|-----------------|--------|-------|
| `/auth/register` | POST | No | `register()` | ✅ Working | reCAPTCHA required |
| `/auth/login` | POST | No | `login()` | ✅ Working | Returns access + refresh tokens |
| `/auth/refresh` | POST | No | — | ✅ Working | Refresh token rotation |

---

## UI COMPONENT → API MAPPING

### HomeScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Weather card | `getWeatherByCoords(lat, lng)` | lat, lng | 32°C, Sunny, 60% |
| Greeting | — | User profile | "Good morning, Ramesh" |
| Quick Actions | Navigation only | — | — |
| Crop Status Card | `getDashboard()` | Auth token | Empty state |
| Metrics (Weight, Batches) | `getDashboard()` | Auth token | 0 |
| Progress Bar | `getDashboard().total_batches` | — | 0% |
| Weather Alert Banner | `getWeatherAlerts(lat, lng, 'Tomato')` | lat, lng, crop | None shown |
| FAQ | Static | — | Hardcoded |
| Recent Activity | — | Activity log API | Hardcoded |

**Gap**: No activity log endpoint; no user profile endpoint for name.

### ScanScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Camera/Gallery | — | — | — |
| GPS Capture | `expo-location` | Device permission | Manual entry |
| Image Compression | Client-side (WebP) | — | JPEG fallback |
| 5-Sample Protocol | — | Local state | — |
| Analysis Navigation | `navigate('Analysis', { samples, batchId, gps })` | — | — |

**Gap**: No batch creation before scan; batchId generated client-side.

### AnalysisScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Vision Analysis | `analyzeImage(base64, 'image/webp')` × N | base64 per sample | Error → Manual fallback |
| Satellite NDVI | `getVedasLive(lat, lng)` | lat, lng | "Credentials not configured" |
| Weather Alerts | `getWeatherAlerts(lat, lng, crop)` | lat, lng, crop | None |
| What-If Preview | `simulateWhatIf({...})` | crop, score, temp, coords | Loading spinner |
| Manual Fallback | Local calculation | User inputs | — |

**Gap**: No `/harvest/evaluate-all` integration (multi-sample + co-habitants + destinations).

### CropDetailsScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Batch Info | `getBatch(batchId)` | batchId | Error state |
| Environmental Logs | `getLogs(batchId, 20)` | batchId | Empty |
| Log Analytics | `getLogAnalytics(batchId)` | batchId | No observation |
| Field Map | `LeafletMap` + `MapSearchBar` | batch coords / search | Default Nashik |
| Analyze Crop Button | `navigate('Analysis')` | — | — |

**Gap**: Batch coords not stored in DB (latitude/longitude columns missing from schema).

### CropBatchesScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Batch List | `listBatches(status, 50)` | status filter | Empty state |
| Dashboard Stats | `getDashboard()` | Auth token | Zero stats |
| Filter Pills | Client-side filter | — | — |
| View Crop | `navigate('CropDetails', { batchId })` | — | — |
| Add Crop | `navigate('AddCrop')` | — | — |

**Gap**: Dashboard response structure mismatch (`by_status` vs `status_breakdown`).

### MarketScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Price Summary | `getMandiPrices(crop)` | crop from batch | Hardcoded prices |
| Map Markers | Client-side mock | — | All at user coords |
| Price Heatmap | `getMandiPrices()` data | — | Static gradient |
| Market Ranking | `getMandiPrices()` data | — | Mock ranking |
| Sell/Buy CTA | `navigate('SmartMove')` | — | — |

**Gap**: No real market coordinates; distances hardcoded `[8,14,25,40,60]`.

### SmartMoveScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Context Summary | `simulateWhatIf({crop, qty, score, temp, coords})` | All params | Hardcoded 500kg/65/28°C |
| Recommendation Card | `simulateWhatIf()` result | — | "Sell within 2-3 days" |
| Why This Recommendation | `scenario.reasoning` | — | Static text |
| Option Cards | `scenarios` array | — | 4 hardcoded scenarios |
| Compare Futures CTA | `navigate('WhatIf')` | — | — |

**Gap**: Uses hardcoded params instead of real batch/vision data.

### WhatIfScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Scenario Cards | `simulateWhatIf()` | Hardcoded params | Same as SmartMove |

**Gap**: Duplicate of SmartMove; should share logic.

### WeatherScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Current Weather | `getWeatherByCoords(lat, lng)` | lat, lng | 28°C, Sunny |
| 7-Day Forecast | — | — | **MOCK_FORECAST** (hardcoded) |
| Rainfall Card | — | — | "0mm" (hardcoded) |
| Soil Moisture | — | — | "38% (Optimal)" (hardcoded) |
| Farming Insight | `getWeatherAlerts()` | — | Alert-based |
| Map | `LeafletMap` + search | — | — |

**Gap**: No forecast API; no soil moisture API integration.

### SpoilageScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Risk Assessment | `getBatch()` + `getLogAnalytics()` | batchId | Visual score heuristic |
| Storage Map | `getNearbySalvage(lat, lng)` | lat, lng | 3 mock facilities |
| Factors List | Batch data + analytics + alerts | — | Heuristic text |
| Action Window | — | — | "2-3 days" (hardcoded) |
| Smart Move CTA | `navigate('SmartMove')` | — | — |

**Gap**: Storage facilities mock; risk calculation simplified.

### AddCropScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Crop/Variety | Static arrays | — | Hardcoded lists |
| Sowing Date | `CalendarPicker` | — | — |
| Farm Area | TextInput | — | — |
| Location | `MapLocationPicker` (Google Maps) | — | Device GPS |
| Save Button | `createBatch({weight, field_id})` | weight, field_id | — |

**Gap**: Crop/variety lists not from API; area→weight conversion simplistic (1000kg/acre).

### RouteScreen
| UI Element | API Call | Data Required | Fallback |
|------------|----------|---------------|----------|
| Facilities List | `getNearbySalvage(lat, lng)` | lat, lng | 3 mock facilities |
| Route Calculation | `getDrivingRoute()` (OSRM) | origin, dest | — |
| Market Cards | Client-side mock | — | Mock data |

**Gap**: Facilities mock; "Search" and "EditLocation" nav targets don't exist.

---

## EXTERNAL API DEPENDENCIES

| Service | Purpose | Required | Configured | Fallback Behavior |
|---------|---------|----------|------------|-------------------|
| **Google Gemini / FreeLLMAPI** | Vision AI analysis | Yes | ❌ No | Deterministic fallback (Tomatoes, 85, Optimal, false) |
| **ISRO Bhoonidhi** | Satellite NDVI, soil moisture | Yes | ❌ No | `CREDENTIALS_NOT_CONFIGURED` status |
| **OpenWeatherMap** | Current weather + alerts | Yes | ❌ No | 32°C, 60%, Sunny, 20% rain |
| **data.gov.in** | Mandi prices | Yes | ❌ No | Hardcoded price tables per crop |
| **OSRM** | Driving routes | No (free) | ✅ Yes | — |
| **Google Maps** | Location picker, geocoding | Yes | ⚠️ Needs key | Device GPS fallback |

---

## DATA MODEL GAPS

### Missing Database Columns
| Table | Missing Column | Needed By |
|-------|----------------|-----------|
| `crop_batches` | `latitude`, `longitude` | CropDetails map, Analysis GPS |
| `crop_batches` | `crop_type` (separate from field_id) | Market, SmartMove, Analysis |
| `crop_batches` | `variety` | AddCrop, traceability |
| `crop_batches` | `sowing_date` | Growth stage calculation |
| `crop_batches` | `farm_area`, `area_unit` | Yield estimation |
| `environmental_logs` | `device_id` | Offline sync deduplication |
| `fruit_samples` | **Entire table** | 5-sample protocol, per-sample vision |
| `vision_analyses` | **Entire table** | Per-sample AI results, confidence |

### Missing API Endpoints
| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `GET /batches/{id}/samples` | Retrieve 5-sample images + vision results | High |
| `POST /batches/{id}/samples` | Upload sample images during scan | High |
| `GET /user/profile` | Get farmer name, preferences | Medium |
| `GET /activity/log` | Recent activity feed | Medium |
| `GET /crops/varieties` | Dynamic crop/variety lists | Medium |
| `GET /markets/coordinates` | Real market lat/lng for map | High |
| `GET /forecast` | 7-day weather forecast | High |
| `POST /auth/logout` | Token blacklist | Low |

---

## OFFLINE SYNC ARCHITECTURE

### Mobile Queue (Implemented)
- **Storage**: AsyncStorage `@freshguard_offline_queue`
- **Structure**: Array of `OfflineTransaction` (id, type, payload, timestamp, retryCount, status)
- **Max Size**: 100 transactions
- **Retry**: Exponential backoff (max 3 retries)
- **Types**: `harvest_evaluation`, `batch_create`, `environmental_log`, `sync_batch`

### Backend Endpoint (Ready)
- `POST /api/v5/sync/process-queue`
- Accepts: `{ farmer_id, device_sync_timestamp, transactions[] }`
- Processes each: derives visual score from manual inputs, generates QR passport, persists batch + env log
- Returns: `{ sync_status, records_processed_count, synced_client_ids, failed_records[] }`

### Integration Needed
1. Auto-sync on network reconnect (NetInfo listener)
2. Sync indicator in UI (pending count badge)
3. Conflict resolution (server wins for batch data)
4. Partial failure handling (retry failed only)

---

## SECURITY NOTES

| Area | Status | Notes |
|------|--------|-------|
| JWT Secret | ⚠️ Dev fallback | Set `AUTH_SECRET_KEY` in production |
| QR Passport HMAC | ⚠️ Dev fallback | Set `PASSPORT_HMAC_SECRET` for persistent tokens |
| reCAPTCHA | ⚠️ Dev bypass | Set `RECAPTCHA_SECRET_KEY` in production |
| CORS | ✅ Configurable | `CORS_ORIGINS` env var |
| Rate Limiting | ✅ Active | 10/min harvest, 30/min whatif |
| HTTPS | ❌ Dev only | Required for production |

---

## INTEGRATION PRIORITY MATRIX

| Priority | Integration | Effort | Impact |
|----------|-------------|--------|--------|
| **P0** | Vision API keys (Gemini/FreeLLMAPI) | Low | Core AI feature |
| **P0** | Fruit samples tables + endpoints | Medium | 5-sample protocol |
| **P0** | Batch GPS columns | Low | Map, logistics, traceability |
| **P1** | ISRO Bhoonidhi credentials | Medium | Satellite intelligence |
| **P1** | OpenWeatherMap API key | Low | Live weather/forecast |
| **P1** | data.gov.in API key | Low | Real mandi prices |
| **P1** | Real market coordinates | Medium | Map accuracy |
| **P2** | 7-day forecast API | Medium | Weather screen |
| **P2** | Soil moisture API | Medium | Weather screen |
| **P2** | User profile + activity log | Medium | Home screen personalization |
| **P3** | Offline sync auto-trigger | Medium | Rural reliability |
| **P3** | Crop/variety master data | Low | AddCrop dynamic lists |
| **P3** | Push notifications | High | Alert engagement |

---

## TESTING ENDPOINTS

```bash
# Health
curl http://localhost:8001/api/v5/health

# Auth
curl -X POST http://localhost:8001/api/v5/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","recaptcha_token":""}'

# Dashboard (requires auth)
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/v5/dashboard

# Vision (requires auth)
curl -X POST -F "file=@crop.jpg" \
  -H "Authorization: Bearer <token>" \
  http://localhost:8001/api/v5/vision/analyze

# What-If (optional auth)
curl -X POST -H "Content-Type: application/json" \
  -d '{"crop_type":"Tomato","quantity_kg":500,"visual_score":65,"ambient_temp_c":28}' \
  http://localhost:8001/api/v5/whatif/simulate
```