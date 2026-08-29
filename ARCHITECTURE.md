# ARCHITECTURE.md — FreshGuard / Annapurna

> High-level map of the system. Modules, services, data movement. Not implementation detail — the shape of the thing.

---

## System Overview

FreshGuard is an AI-powered post-harvest intelligence platform for Indian farmers. It combines computer vision, biological physics, satellite data, and spatial routing to help farmers decide when/where/how to sell their crops.

```
┌─────────────────────────────────────────────────────┐
│                   MOBILE APP                         │
│              React Native / Expo SDK 57              │
│                  17 Screens                          │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────┐
│                 FASTAPI BACKEND                      │
│              backend/main.py (1454 lines)            │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Vision Pipeline│  │ Ethylene Gas │  │ Q10       │ │
│  │ (3-tier)      │  │ Engine       │  │ Kinetics  │ │
│  └──────┬───────┘  └──────────────┘  └───────────┘ │
│         │                                            │
│  ┌──────┴───────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Satellite    │  │ Weather Proxy│  │ Passport  │ │
│  │ Layer        │  │              │  │ Engine    │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┘ │
│         │                 │                          │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌───────────┐ │
│  │ What-If      │  │ Sync Gateway │  │ Mandi     │ │
│  │ Simulator    │  │ (offline)    │  │ Prices    │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ psycopg2
                       ▼
┌─────────────────────────────────────────────────────┐
│           POSTGRESQL 15 + POSTGIS + TIMESCALEDB      │
│                                                      │
│  crop_batches    environmental_logs   fields          │
│  secondary_salvage_facilities   climate_matrix        │
└─────────────────────────────────────────────────────┘
```

---

## Modules

### Backend Modules

| Module | File | Responsibility | Lines |
|--------|------|----------------|-------|
| **App Shell** | `backend/main.py` | Config, CORS, lifecycle, router mounting | ~80 |
| **Models** | `backend/models.py` | Shared Pydantic models + helpers | ~120 |
| **Vision Engine** | `backend/engines/vision.py` | 3-tier AI vision pipeline | ~170 |
| **Ethylene Engine** | `backend/engines/ethylene.py` | Gas cross-contamination model | ~80 |
| **Satellite Engine** | `backend/engines/satellite.py` | ISRO Bhoonidhi NDVI intelligence | ~120 |
| **Logistics Engine** | `backend/engines/logistics.py` | Q10 kinetics + Plan-B routing | ~100 |
| **Batches Router** | `backend/routers/batches.py` | CRUD, dashboard, logs, salvage, mandi | ~300 |
| **Harvest Router** | `backend/routers/harvest.py` | Master evaluation pipeline | ~130 |
| **Passport Router** | `backend/routers/passport_routes.py` | QR passport generate/verify | ~60 |
| **Weather Router** | `backend/routers/weather.py` | Weather proxy + alerts | ~160 |
| **Satellite Router** | `backend/routers/satellite_routes.py` | VEDAS endpoints | ~40 |
| **What-If Router** | `backend/routers/whatif.py` | Scenario simulation | ~180 |
| **Database** | `backend/db.py` | PostgreSQL pool + InMemoryStore | ~400 |
| **Passport Crypto** | `backend/passport.py` | HMAC-SHA256 QR engine | ~120 |
| **Bhoonidhi** | `backend/bhoonidhi_client.py` | ISRO Bhoonidhi STAC client | ~170 |
| **VEDAS** | `backend/vedas_scraper.py` | ISRO VEDAS WMS scraper | ~150 |
| **Sync Gateway** | `backend/sync_gateway.py` | Offline sync router | ~100 |

### Mobile Modules

| Module | File | Role |
|--------|------|------|
| **API Service** | `mobile/src/services/api.ts` | Single HTTP client for all backend calls |
| **Navigation** | `mobile/src/navigation/` | React Navigation 7, bottom tabs + stack |
| **Screens** | `mobile/src/screens/` | 17 screens (12 substantive, 5 shells) |

### Infrastructure

| Component | File | Purpose |
|-----------|------|---------|
| **Docker Compose** | `backend/docker-compose.yml` | Backend + PostgreSQL + TimescaleDB |
| **Dockerfile** | `backend/Dockerfile` | Multi-stage build for backend |
| **Schema** | `backend/init_architecture.sql` | PostgreSQL schema (PostGIS, TimescaleDB hypertables) |
| **Seed Data** | `backend/seed_data.sql` | Sample facilities, climate matrix |

---

## External Services

```
                    ┌──────────────────────┐
                    │   FreshGuard Backend  │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
          ▼                    ▼                     ▼
   ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
   │ Google Gemini│    │ ISRO APIs    │    │ OpenWeatherMap   │
   │ 2.5 Flash   │    │              │    │                  │
   │ (15 RPM)    │    ├─ Bhoonidhi   │    │ (1000 calls/day) │
   └─────────────┘    │  (STAC/JWT)  │    └──────────────────┘
                      ├─ VEDAS       │
                      │  (WMS/Open)  │    ┌──────────────────┐
                      └──────────────┘    │ data.gov.in      │
                                          │ (Mandi prices)   │
   ┌─────────────┐                        └──────────────────┘
   │ FreeLLMAPI  │
   │ Gateway     │    ┌──────────────────┐
   │ (optional)  │    │ SoilGrids        │
   └─────────────┘    │ (not yet used)   │
                      └──────────────────┘
```

---

## Data Flow Summary

1. **Mobile → Backend**: Farmer captures image + GPS + batch metadata
2. **Backend → Vision AI**: Image → Gemini/FreeLLMAPI → AGMARK grading
3. **Backend → Satellite**: GPS → ISRO Bhoonidhi → NDVI stress data
4. **Backend → Weather**: GPS → OpenWeatherMap → temp/humidity
5. **Backend Processing**: Vision score → shelf life → ethylene penalty → Q10 decay → ranked logistics
6. **Backend → Database**: Batch persisted, environmental logs ingested, QR passport generated
7. **Backend → Mobile**: Ranked mandi options with shelf life, profit margins, resilience status

---

## Key Architectural Patterns

### Resilient Degradation
Every external API has a fallback. The system works offline:
- Vision: FreeLLMAPI → Gemini → Deterministic baseline
- Satellite: Bhoonidhi → fallback climate matrix
- Weather: OpenWeatherMap → hardcoded defaults
- Database: PostgreSQL → InMemoryStore

### Monolith (by design)
Single `main.py` handles everything. This is intentional — the project is at hackathon/early-stage scale. Splitting into routers is planned but not urgent.

### In-Memory Fallback
`InMemoryStore` in `db.py` mirrors the PostgreSQL interface using Python dicts. Enables zero-dependency operation for demos and field testing.

### Biological Physics Engine
Not hand-wavy heuristics — scientifically grounded Q₁₀ kinetics with crop-specific constants. The ethylene gas interaction matrix models real chemical cross-contamination in sealed truck containers.

---

## Current Architecture (Implemented)

```
backend/
  main.py              (app setup, middleware, lifecycle — ~80 lines)
  models.py            (shared Pydantic models + helpers)
  routers/
    batches.py         (CRUD, dashboard, logs, salvage, mandi)
    harvest.py         (evaluation pipeline)
    passport_routes.py (QR generation/verification)
    weather.py         (proxy + alerts)
    satellite_routes.py (VEDAS + Bhoonidhi)
    whatif.py          (scenario simulation)
    __init__.py
  engines/
    vision.py          (3-tier pipeline)
    ethylene.py        (gas interaction model)
    logistics.py       (Q10 + Plan-B routing)
    satellite.py       (NDVI processing)
    __init__.py
  db.py                (PostgreSQL pool + InMemoryStore)
  passport.py          (HMAC-SHA256 QR crypto)
  bhoonidhi_client.py  (ISRO Bhoonidhi STAC)
  vedas_scraper.py     (ISRO VEDAS WMS)
  sync_gateway.py      (offline sync)
```

This is Phase 2 of the action plan — completed.
