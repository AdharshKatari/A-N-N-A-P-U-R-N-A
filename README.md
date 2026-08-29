# 🌾 The Farmer Market (FreshGuard / Annapurna)
### *AI-Powered Post-Harvest Intelligence, Biological Physics & Spatial Logistics Decision Engine*

[![React Native](https://img.shields.io/badge/React_Native-v0.74-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-v51-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-Spatial_GIS-green?style=for-the-badge&logo=postgis&logoColor=white)](https://postgis.net/)
[![TimescaleDB](https://img.shields.io/badge/TimescaleDB-Hypertables-FDB515?style=for-the-badge&logo=timescale&logoColor=black)](https://www.timescale.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-Multimodal_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Maestro](https://img.shields.io/badge/Maestro-E2E_UI_Testing-black?style=for-the-badge)](https://maestro.mobile.dev/)

---

## 📌 Executive Summary

Over **15% to 30% of Indian horticultural crops** (such as tomatoes, mangoes, and onions) are lost post-harvest due to transit decay, unventilated ethylene contamination, and market gluts at destination mandis. 

**The Farmer Market** (*FreshGuard Core / Annapurna*) is a hardware-agnostic, multi-layered decision-support platform designed to eliminate post-harvest agricultural losses. Moving beyond basic static price listings, the platform fuses **Smartphone Computer Vision**, **$Q_{10}$ Biological Respiration Physics**, **Chemical Ethylene Gas Dispersion Equations**, and **PostGIS Spatial Rerouting** to provide marginal farmers and Farmer Producer Organisations (FPOs) with actionable logistics guidance: **when, where, and how to route fresh produce to maximize net profit margins**.

---

## 🏗️ System Architecture & Data Movement

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │           MOBILE CLIENT (React Native / Expo)           │
                                  │    17+ Screens | Multilingual (6 Langs) | Voice AI      │
                                  └────────────────────────────┬────────────────────────────┘
                                                               │ HTTP / REST (api.ts)
                                                               ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                   FASTAPI BACKEND CORE                                                    │
│                                                                                                                           │
│   ┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────┐   │
│   │ 3-Tier Vision Pipeline    │   │ Ethylene Gas Engine       │   │ Q10 Respiration Kinetics  │   │ QR Crypto Engine  │   │
│   │ (FreeLLM ➔ Gemini ➔ CV)   │   │ (Chemical Multipliers)    │   │ (Exponential Thermal)     │   │ (HMAC-SHA256)     │   │
│   └─────────────┬─────────────┘   └─────────────┬─────────────┘   └─────────────┬─────────────┘   └─────────┬─────────┘   │
│                 │                               │                               │                           │             │
│   ┌─────────────▼─────────────┐   ┌─────────────▼─────────────┐   ┌─────────────▼─────────────┐   ┌─────────▼─────────┐   │
│   │ ISRO Satellite Engine     │   │ Plan-B Spatial Routing    │   │ OpenWeather & Govt Mandi  │   │ Offline Sync      │   │
│   │ (VEDAS / Bhoonidhi NDVI)  │   │ (PostGIS Salvage Hubs)    │   │ (Proxy + Climate Matrix)  │   │ (Queue Gateway)   │   │
│   └───────────────────────────┘   └───────────────────────────┘   └───────────────────────────┘   └───────────────────┘   │
└──────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┘
                                                               │ psycopg2 / Pool
                                                               ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     DATA PERSISTENCE & FAULT-TOLERANT TIER                                                │
│   • PostgreSQL 15: Core relational ledger (`crop_batches`, `fields`)                                                      │
│   • PostGIS: Spatial vectors (`GEOMETRY(Point, 4326)`, `GEOMETRY(MultiPolygon, 4326)`)                                    │
│   • TimescaleDB: High-frequency telemetry hyper-table (`environmental_logs`)                                              │
│   • Fallback Tier: 10-Year Regional Climate Matrix + `InMemoryStore` (Zero-crash offline guarantee)                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Complete Feature Ecosystem

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       KEY PLATFORM CAPABILITIES                                          │
├─────────────────────────────────────┬────────────────────────────────────┬───────────────────────────────┤
│ 📸 5-Sample Smart Produce Scanner   │ ⚖️ Side-by-Side Mandi Arbitrage   │ 🛡️ PostGIS Plan-B Safety Net  │
│ 🧪 Chemical Ethylene Gas Warning    │ 🧬 Q10 Biological Decay Physics    │ 🔐 Cryptographic QR Passport  │
│ 🔮 "What-If" Scenario Simulator     │ 🚚 SmartMove FPO Freight Pooling   │ 📡 ISRO Satellite NDVI Stress │
│ 🗣️ Regional Voice AI Assistant      │ 🌦️ Thermal Weather Alert Engine   │ 📴 Zero-Crash Offline Sync    │
└─────────────────────────────────────┴────────────────────────────────────┴───────────────────────────────┘
```

### 1. 📸 5-Sample Smart Produce Quality Scanner
*   **Computer Vision Guardrails:** Real-time on-device check for **Laplacian 2D gradient blur variance** ($\text{Var} \ge 30.0$), brightness normalization, and resolution verification.
*   **3-Tier Multi-Engine AI Grading:** Analyzes surface skin texture, color uniformity, and fungal spores using **Google Gemini 2.5 Flash** (Tier 1/2) with local **NumPy/Pillow colorimetric & necrotic lesion fallback** (Tier 3).
*   **AGMARK Parameter Extraction:** Predicts visual quality score ($0–100$), categorical ripeness (`Unripe`, `Optimal`, `Overripe`), and boolean fungal pathogen presence with calibrated confidence.

### 2. ⚖️ Side-by-Side Mandi Arbitrage Radar
*   **Real Profit vs. Nominal Price:** Compares local vs. distant metro mandis (e.g., *Nashik APMC vs. Vashi Mumbai*).
*   **Transit Cost & Spoilage Factoring:** Automatically deducts diesel freight (**₹5.00/km**) and estimated transit thermal decay loss from gross payout to highlight genuine net profit margins.
*   **Mandi Quick-Switcher & Swap:** Interactive UI pills allowing farmers to instantly benchmark alternative regional APMCs with haptic feedback.

### 3. 🛡️ PostGIS Plan-B Mandi Rejection Rerouting Core
*   **4-Hour Rejection Delay Modeling:** Simulates market glut delays or mandi entry rejections to calculate remaining shelf life.
*   **Spatial Fallback Radius:** PostGIS spatial queries (`ST_DWithin`, GiST Indexing) map secondary cold storage and food processing facilities with guaranteed floor purchase prices.
*   **Resilience Tiers:** Evaluates route safety into **AIRTIGHT** (has viable salvage hub), **VULNERABLE** (safe arrival life $\ge 1.5\text{d}$, but no fallback), and **CRITICAL_SPECULATIVE**.

### 4. 🧪 Chemical Ethylene Gas Cross-Contamination Warning
*   **Climacteric Interaction Matrix:** Models autocatalytic ethylene gas accumulation (PPM) when co-shipping produce.
*   **Ventilation Modifiers:** Multiplies biological respiration rates up to **4.00x** when high-emitting climacteric crops (e.g., overripe tomatoes) are loaded with sensitive produce in unventilated trucks.

### 5. 🧬 $Q_{10}$ Respiration Kinetics & Thermal Decay Engine
*   **Exponential Decay Physics:** Calculates exponential decay speed based on ambient transit temperatures:
    $$\text{Thermal Velocity} = (Q_{10})^{\frac{T_{\text{ambient}} - 12.0}{10.0}}$$
*   **Crop-Calibrated Constants:** $Q_{10} = 2.2$ for Tomatoes, $2.5$ for Mangoes, and $2.0$ for Onions above optimal baselines ($12^\circ\text{C}$).

### 6. 🔐 Cryptographic QR Crop Passport
*   **Tamper-Proof B2B Verification:** Encapsulates batch provenance, AGMARK visual score, harvest timestamp, and weight into an immutable **HMAC-SHA256** signed token (`{Base64 Payload}.{Base64 Signature}`).
*   **Quick-Commerce Integration:** Downstream buyers (e.g., *Zepto, Blinkit, Mandi Traders*) scan the QR code to verify quality authenticity in constant time (`hmac.compare_digest`), preventing middleman tampering.

### 7. 🔮 "What-If" Multi-Scenario Strategy Simulator
*   **4 Real-World Economic Pathways:** Simulates trade-offs between:
    1. *Immediate Local Mandi Sale* (Zero transit decay, baseline price).
    2. *Distant Metro APMC Transit* (Higher price spread minus freight & thermal loss).
    3. *Cold Storage Holding* (Speculative price surge minus electricity storage fees).
    4. *Secondary Food Processing Salvage* (Instant bulk floor price for borderline batches).

### 8. 🚚 SmartMove & FPO Shared Freight Pooling Optimizer
*   **Consolidated Consignments:** Pools smallholder farm yields into shared commercial carriers (e.g., Bolero / Tata 407), reducing per-kg transit freight by up to **60%**.
*   **Route Optimization:** Groups nearby geofenced farm pickups for collective delivery to high-yield mandis.

### 9. 📡 ISRO Satellite NDVI Pre-Harvest Stress Layer
*   **Crop Durability Pre-Check:** Connects to ISRO Bhoonidhi STAC and VEDAS WMS APIs to compute **Normalized Difference Vegetation Index (NDVI)** and SMAP soil moisture.
*   **Pre-Harvest Decay Adjustment:** Scales baseline post-harvest durability ($0.85\times - 1.00\times$) based on field vegetative stress prior to harvest.

### 10. 🗣️ Multilingual Regional Voice AI Assistant
*   **6 Indian Languages:** Native support across **Telugu (`te`)**, **Hindi (`hi`)**, **Marathi (`mr`)**, **English (`en`)**, **Tamil (`ta`)**, and **Kannada (`kn`)**.
*   **Hands-Free Speech Synthesis:** Regional voice recognition and synthesized audio feedback for farmers working in the field.

### 11. 🌦️ Agro-Weather Hazard Alert Engine
*   **Thermal Shock & Moisture Alerts:** Warns farmers when local ambient temperatures exceed $35^\circ\text{C}$ or relative humidity exceeds $85\%$.
*   **10-Year Historical Climate Fallback:** Automatically substitutes live weather API timeouts with pre-compiled district-by-week historical weather profiles.

### 12. 📴 Zero-Crash Offline Synchronization Gateway
*   **Field Blackout Protection:** Client mutations (batch status changes, IoT sensor logs) queue locally in `AsyncStorage`.
*   **Idempotent Server Gateway:** Synchronizes queues automatically upon cell signal restoration (`/api/v5/sync/process-queue`) using UUID idempotency keys.

---

## 📱 Mobile App UI Flow Previews

```
┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│     HOME DASHBOARD        │   │    5-SAMPLE AI SCANNER    │   │  SIDE-BY-SIDE ARBITRAGE   │
├───────────────────────────┤   ├───────────────────────────┤   ├───────────────────────────┤
│ ☀️ 32°C Sunny • Nashik    │   │  [📸 Sample 1 / 5]        │   │ ⚡ INXS ARBITRAGE RADAR   │
│ ⚠️ Heat Stress Warning    │   │  ┌─────────────────────┐  │   │ Nashik APMC vs Vashi APMC │
│                           │   │  │   [ Tomato Image ]  │  │   │                           │
│ Active Batches: 4 (2.4T)  │   │  └─────────────────────┘  │   │ • Price: ₹24/kg ➔ ₹34/kg  │
│                           │   │  ✓ Sharpness: OK (Var 48) │   │ • Transit: 12km ➔ 168km   │
│ [📸 Scan Harvest Produce] │   │  ✓ Lighting: Sunlight     │   │ • Spoilage: 0.8% ➔ 3.2%   │
│ [⚖️ Mandi Arbitrage]     │   │                           │   │ • Diesel: ₹120 ➔ ₹840     │
│ [🚚 FPO SmartMove Pool]   │   │ AGMARK Score: 86/100      │   │                           │
│ [🔐 QR Digital Passports] │   │ Ripeness: Optimal (Firm)  │   │ 💰 Net Profit Delta:      │
│                           │   │ Fungal Pathogens: None    │   │    +₹4,160 Net Gain!      │
│ [🗣️ Voice Assistant]      │   │ Estimated Life: 8.5 Days  │   │ [🛡️ Plan-B: Cold Storage] │
└───────────────────────────┘   └───────────────────────────┘   └───────────────────────────┘
```

---

## 🔌 API Endpoint Reference

| Endpoint | Method | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `/api/v5/auth/register` | `POST` | Register farmer account with bcrypt hashing | None |
| `/api/v5/auth/login` | `POST` | Authenticate farmer and obtain JWT token | None |
| `/api/v5/dashboard` | `GET` | Fetch aggregate batch stats and active farm metrics | Bearer JWT |
| `/api/v5/batches` | `GET` / `POST` | List or create tracked crop batch ledgers | Bearer JWT |
| `/api/v5/batches/{id}/status` | `PATCH` | Transition lifecycle state (`ACTIVE` ➔ `TRANSIT` ➔ `SOLD` / `SPOILED`) | Bearer JWT |
| `/api/v5/vision/analyze` | `POST` | Execute AI image quality scan and AGMARK grading | Bearer JWT |
| `/api/v5/harvest/evaluate-all` | `POST` | Master evaluation (Vision + Ethylene + Q10 + Spatial Fallback) | Bearer JWT |
| `/api/v5/market/compare` | `GET` | Side-by-side mandi arbitrage calculation | None |
| `/api/v5/whatif/simulate` | `POST` | Run 4-scenario logistics and market holding simulation | Optional |
| `/api/v5/passport/generate` | `POST` | Generate HMAC-SHA256 signed QR crop passport | Bearer JWT |
| `/api/v5/passport/verify` | `POST` | Public verification endpoint for B2B buyers | None |
| `/api/v5/logs` | `POST` | Ingest IoT transit temperature, humidity, and GPS telemetry | Bearer JWT |
| `/api/v5/logs/{id}/analytics` | `GET` | Fetch cumulative degree-hours and spoilage velocity | Bearer JWT |
| `/api/v5/weather` | `GET` | Local weather proxy with 10-year climate matrix fallback | None |
| `/api/v5/salvage/nearby` | `GET` | Spatial query for nearest PostGIS cold storage facilities | None |
| `/api/v5/sync/process-queue` | `POST` | Synchronize offline mutation queue | Bearer JWT |

---

## 🗄️ Database Architecture

```sql
-- 1. Master Batch Ledger
CREATE TABLE crop_batches (
    batch_id VARCHAR(50) PRIMARY KEY,
    field_id UUID REFERENCES fields(field_id) ON DELETE SET NULL,
    initial_weight_kg NUMERIC(8,2) NOT NULL,
    harvest_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    initial_visual_score NUMERIC(5,2) NOT NULL,
    detected_ripeness_stage VARCHAR(30) CHECK (detected_ripeness_stage IN ('Unripe', 'Optimal', 'Overripe')),
    fungal_pathogen_presence BOOLEAN DEFAULT FALSE,
    qr_code_secure_token TEXT UNIQUE NOT NULL,
    current_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (current_status IN ('ACTIVE', 'TRANSIT', 'SOLD', 'SPOILED'))
);

-- 2. TimescaleDB Telemetry Hypertable
CREATE TABLE environmental_logs (
    log_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    batch_id VARCHAR(50) REFERENCES crop_batches(batch_id) ON DELETE CASCADE,
    ambient_temperature_c NUMERIC(4,1) NOT NULL,
    relative_humidity_pct NUMERIC(4,1) NOT NULL,
    location_point GEOMETRY(Point, 4326)
);
SELECT create_hypertable('environmental_logs', 'log_timestamp');

-- 3. PostGIS Secondary Salvage Directory
CREATE TABLE secondary_salvage_facilities (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name VARCHAR(150) NOT NULL,
    facility_type VARCHAR(50) CHECK (facility_type IN ('Processing_Plant', 'Cold_Storage')),
    guaranteed_floor_price_per_kg NUMERIC(6,2) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX idx_facilities_spatial ON secondary_salvage_facilities USING GIST (location_geom);
```

---

## 🛡️ Zero-Downtime Resilient Degradation

| Layer | Primary Service | Fail-Safe Fallback | Guarantee |
| :--- | :--- | :--- | :--- |
| **Vision AI** | Google Gemini 2.5 Flash | Dedicated Colorimetric/Defect Classifier (`fruit_classifier.py`) | Zero external API dependencies during offline/cloud outages |
| **Weather** | OpenWeatherMap Live API | 10-Year Regional Historical Climate Matrix (District + Week) | Realistic ambient temperatures for any Indian district |
| **Database** | PostgreSQL 15 Pool | Thread-safe in-memory store (`InMemoryStore`) | Zero crashes during field demos or disconnected environments |
| **Satellite** | ISRO Bhoonidhi STAC / VEDAS | Pre-cached Bhuvan spatial grid / Neutral modifier | Uninterrupted harvest evaluation if government APIs timeout |

---

## 🚀 Quick Start & Installation

### Prerequisites
*   **Node.js 18+** & **npm**
*   **Python 3.10+**
*   **Docker & Docker Compose** (Optional, for PostgreSQL + TimescaleDB)

---

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment & install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*API Documentation & Swagger UI available at: `http://localhost:8000/docs`*

---

### 2. Mobile App Setup
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start -c
```
*Press `a` to open Android Emulator, or scan the QR code using Expo Go.*

---

## 🧪 Testing & Validation

### 1. Mobile E2E UI Testing with Maestro
```bash
# Run full mobile test suite against Android emulator
maestro test .maestro/app-smoke.yaml
maestro test .maestro/market/
maestro test .maestro/scan/
```

### 2. Backend Automated Test Suite
```bash
# Run all physics kinetics, crypto passport, and route integration tests
pytest backend/test_suite.py -v
```

### 3. Kaggle Produce Benchmark
```bash
# Validate Agro-Vision classifier against Kaggle fresh-and-stale dataset
python backend/benchmark_kaggle_dataset.py
```

---

## 👥 Contributors & SIH 2024
*Developed with ❤️ for Indian Farmers.*

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.