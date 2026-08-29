# 🌾 Annapurna FreshGuard (अन्नपूर्णा)
> **Giving Perishable Crops an Expiry Clock Before They Hit the Road**  
> **Smart India Hackathon 2026** | **Problem Statement: `I-NXS-018`** | **Team AGS (Team #18)**

---

## 📌 Executive Summary

India produces over **330 million metric tonnes** of fruits and vegetables annually, yet **₹1,52,000 Crore** is lost each year to post-harvest decay and distress selling. 

Farmers like **Ramesh Patel (Nashik, 500kg tomatoes)** face severe price deductions at local mandis (₹22/kg) because middlemen exploit the fear that *"tomatoes might rot on the highway"*. 

**Annapurna FreshGuard** transforms blind transit trucks into biologically intelligent supply chain corridors. By combining **Computer Vision AGMARK AI (0–100 quality scoring)**, **ISRO Bhoonidhi STAC Satellite Remote Sensing**, **$Q_{10}$ Respiration Kinetics**, and **PostGIS Plan-B Salvage Routing**, Annapurna empowers farmers to unlock high-demand terminal markets (e.g. Mumbai Vashi APMC @ ₹34/kg) with guaranteed **+₹4,875 Net Extra Profit** per harvest.

---

## 🚀 Key Architectural Moats

```
                                  ┌─────────────────────────────┐
                                  │   Farmer Field / Crop Lot   │
                                  └──────────────┬──────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   ▼                             ▼                             ▼
       ┌───────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
       │   5-Fruit Camera AI   │    │ ISRO Satellite STAC API│    │  OpenWeather Degree-Hr │
       │  Gemini 2.5 + ML Grading  │  (Bhoonidhi & SAC VEDAS) │    │  Thermal In-Transit Loss│
       └───────────┬───────────┘    └────────────┬───────────┘    └────────────┬───────────┘
                   │                             │                             │
                   └───────────────────────┬─────┴─────────────────────────────┘
                                           ▼
                           ┌───────────────────────────────┐
                           │   Q10 Respiration Bio-Clock   │
                           │   Decay = Q10^(ΔT/10) * Ethylene│
                           └───────────────┬───────────────┘
                                           │
                   ┌───────────────────────┴───────────────────────┐
                   ▼                                               ▼
       ┌───────────────────────┐                       ┌───────────────────────┐
       │ Smart Move Arbitrage  │                       │  PostGIS Plan-B Hub   │
       │ Vashi APMC (+₹4,875)  │                       │ Thane Puree (₹20 Floor)│
       └───────────┬───────────┘                       └───────────┬───────────┘
                   │                                               │
                   └───────────────────────┬───────────────────────┘
                                           ▼
                           ┌───────────────────────────────┐
                           │  Tamper-Proof Kisan QR Pass   │
                           │  Cryptographic Batch Token   │
                           └───────────────────────────────┘
```

---

## 🔬 Four Interconnected Predictive Layers

### 1. 👁️ Computer Vision Quality Scoring Engine
- **Module**: `backend/engines/vision.py` & `backend/ai/classifier/fruit_classifier.py`
- **Capabilities**: 5-sample batch inspection, AGMARK 0–100 numeric score, surface necrosis quantification, fungal pathogen detection, and ripeness classification (Unripe / Optimal / Overripe).

### 2. 🛰️ ISRO Satellite Remote Sensing & Weather Ingestion
- **Module**: `backend/engines/satellite.py` & `backend/server.py`
- **Capabilities**: Queries **ISRO Bhoonidhi STAC API** and **SAC VEDAS** for 10m Sentinel-2 / Cartosat multispectral imagery. Computes live **NDVI Canopy Vigor Index** (0.78 for healthy crops) and soil moisture to gauge pre-harvest stress.

### 3. 🧪 $Q_{10}$ Temperature & Ethylene Respiration Kinetics
- **Module**: `backend/engines/logistics.py` & `mobile/src/components/BiologicalExpiryClock.tsx`
- **Mathematical Formulation**:
  $$\text{Decay Velocity} = Q_{10}^{\frac{\max(0, \, T_{\text{ambient}} - 12^\circ\text{C})}{10}} \times E_{\text{multiplier}}$$
  $$\text{Residual Safe Transit Life} = \frac{\text{Base Shelf Life}}{\text{Decay Velocity}}$$
- **Crop Parameters**: Tomatoes ($Q_{10} = 2.2$), Mangoes ($Q_{10} = 2.5$), Onions ($Q_{10} = 2.0$).
- **Interactive UI**: Live slider from $12^\circ\text{C} \rightarrow 42^\circ\text{C}$ dynamically recalculating shelf-life countdown and status tier in real-time.

### 4. 🚛 Smart Move Arbitrage & PostGIS Plan-B Salvage
- **Module**: `backend/engines/logistics.py` & `mobile/src/screens/SmartMoveScreen.tsx`
- **Market Arbitrage**: Compares local APMC rates vs distant terminal markets, net freight costs, and in-transit temperature degradation.
- **Plan-B Salvage Routing**: If heat-spikes or highway congestion threaten spoilage, auto-reroutes to the nearest food processing plant (e.g. Thane Puree @ ₹20/kg guaranteed floor price) to eliminate 100% loss.

---

## 📱 Rural-First Zero-Friction Usability

- **1-Tap Kisan Demo**: Immediate access for farmers and SIH jury evaluation without forms or CAPTCHA.
- **Annapurna Vaani (Multilingual Voice AI)**: Natural hands-free audio assistance in **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, **Marathi (मराठी)**, and **English** powered by `expo-speech`.
- **Full Offline SQLite Sync**: Queues and computes scans in highway 2G/dead zones, automatically syncing on reconnect.
- **Verifiable Kisan QR Passport**: Cryptographic hash certificate shown at the mandi gate to prevent unfair middleman discounts.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile Client** | React Native, Expo SDK ~54, TypeScript, Expo Speech, Vector Icons |
| **Backend API** | FastAPI (Python 3.11+), Uvicorn, Pydantic, HTTPX, NumPy, SciPy |
| **AI / ML & Vision** | Google Gemini 2.5 Flash Vision, Colorimetry OpenCV / PIL, Fungal Classifier |
| **Geospatial & Storage** | PostgreSQL 16 + PostGIS, TimescaleDB, Upstash Redis |
| **External APIs** | ISRO Bhoonidhi STAC, ISRO SAC VEDAS, OpenWeatherMap, Agmarknet |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- Expo Go app on mobile (Android / iOS)

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Mobile Setup
```bash
# Navigate to mobile
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start -c
```
- Open **Expo Go** on Android or **Camera** on iOS and scan the QR code in the terminal.

---

## 👥 Team AGS (Team #18)

- **Problem Statement**: `I-NXS-018` — AI-Based Perishable Goods Spoilage Prediction Software
- **Hackathon**: Smart India Hackathon (SIH) 2026
- **Repository**: [https://github.com/AdharshKatari/A-N-N-A-P-U-R-N-A.git](https://github.com/AdharshKatari/A-N-N-A-P-U-R-N-A.git)

*Dedicated to empowering India's 140 million Annadatas with scientific post-harvest intelligence.*