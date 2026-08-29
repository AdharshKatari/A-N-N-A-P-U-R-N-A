# HANDOVER — FreshGuard / Annapurna

> Last updated: 2026-08-25
> Current session: JWT authentication implementation

---

## Where Things Stand

### ✅ Done (as of this session)

- **Stale file cleanup**: Deleted root `main.py`, `test_freshguard_intelligence.py`, `CropScannerScreen.tsx`
- **Consolidated requirements.txt**: Single file at root, kept Pydantic v1, added `pytest-asyncio` and `python-dotenv`
- **Security: HMAC secret**: `passport.py` now reads from `PASSPORT_HMAC_SECRET` env var with random fallback
- **Security: DB passwords**: `db.py` defaults to empty string, `docker-compose.yml` uses `${POSTGRES_PASSWORD}` without hardcoded default
- **Security: CORS**: Configurable via `CORS_ORIGINS` env var (default `*` for dev)
- **Security: Error leakage**: Wrapped `/api/v5/harvest/evaluate-all` in try/except — logs full error server-side, returns generic message to client
- **Documentation**: Created `HANDOVER.md`, `DECISIONS.md`, `FLOW.md`, `ARCHITECTURE.md`, `CONSTRAINTS.md`
- **Monolith split**: Refactored 1454-line `main.py` into 14 focused files (4 engines + 6 routers + models + thin shell)

### 🔶 In Progress / Partially Done

- **Authentication**: ✅ JWT auth implemented (auth.py + routers/auth.py). Registration, login, and `get_current_user` dependency. Protects all mutation endpoints.
- **Rate limiting**: No rate limiting. Gemini API calls are expensive.
- **Input validation**: Some endpoints have Pydantic models, query params are mostly unvalidated.

### ❌ Not Started

- Split monolithic `backend/main.py` (1454 lines) into routers
- Migrate FastAPI from `@app.on_event("startup")` to `lifespan` context
- Upgrade Pydantic to v2 (blocked by main.py split)
- Push notifications (FCM)
- Multi-language support (i18n)
- QR code image generation endpoint
- CI/CD pipeline
- Structured logging (structlog)

---

## What's Broken / Risky

| Issue | Severity | Notes |
|-------|----------|-------|
| No authentication | 🔴 High | Anyone can create/delete batches, generate passports |
| No rate limiting | 🔴 High | Gemini calls can be abused |
| `CORS_ORIGINS` defaults to `*` | 🟠 Medium | Fine for dev, must set in production |
| Root `docker-compose.yml` duplicates `backend/docker-compose.yml` | 🟡 Low | May diverge, consider deleting root copy |
| Root `bhoonidhi_client.py` duplicates `backend/bhoonidhi_client.py` | 🟡 Low | Consider deduplicating |
| `backend/core/__init__.py` exists but is empty | 🟡 Low | Unused module, unclear intent |

---

## Key Files to Know

| File | Role | Lines |
|------|------|-------|
| `backend/main.py` | Thin app shell — config, CORS, lifecycle, router mounting | ~80 |
| `backend/auth.py` | JWT auth — token create/verify, password hashing, `get_current_user` dependency | ~190 |
| `backend/routers/auth.py` | Auth endpoints — register, login, /me | ~90 |
| `backend/models.py` | Shared Pydantic models + helpers (batch_id, qr_token) + User models | ~140 |
| `backend/engines/vision.py` | 3-tier AI vision pipeline (FreeLLMAPI → Gemini → fallback) | ~170 |
| `backend/engines/ethylene.py` | Ethylene gas cross-contamination engine | ~80 |
| `backend/engines/satellite.py` | ISRO Bhoonidhi NDVI satellite intelligence | ~120 |
| `backend/engines/logistics.py` | Q10 respiration kinetics + Plan-B spatial routing | ~100 |
| `backend/routers/batches.py` | CRUD, dashboard, logs, salvage, mandi, health | ~300 |
| `backend/routers/harvest.py` | Master evaluation pipeline (4 layers + DB persist) | ~130 |
| `backend/routers/passport_routes.py` | QR passport generate/verify | ~60 |
| `backend/routers/weather.py` | Weather proxy + spoilage risk alerts | ~160 |
| `backend/routers/satellite_routes.py` | VEDAS live + multi-layer endpoints | ~40 |
| `backend/routers/whatif.py` | What-if scenario simulation | ~180 |
| `backend/db.py` | PostgreSQL pool + InMemoryStore fallback | ~400 |
| `backend/passport.py` | HMAC-SHA256 QR crypto engine | ~120 |
| `backend/bhoonidhi_client.py` | ISRO Bhoonidhi STAC API client | ~170 |
| `backend/vedas_scraper.py` | ISRO VEDAS OGC WMS scraper | ~150 |
| `backend/sync_gateway.py` | Offline sync FastAPI router | ~100 |
| `mobile/src/services/api.ts` | Mobile API service layer | ~300 |
| `mobile/src/screens/*.tsx` | 17 screens (12 with substance, 5 thin shells) | Varies |

---

## What the Next Session Should Do

1. **Add rate limiting** — Use `slowapi`. 100 req/min general, 10 req/min for vision endpoints.
2. **Register for API keys** — OpenWeatherMap (free), data.gov.in (free). Configure in `.env`.
3. **Run existing test suite** — `cd backend && python -m pytest test_suite.py -v` (test_suite.py needs updated imports post-monolith-split)
4. **Persist users to PostgreSQL** — Replace in-memory user store in auth.py with database-backed users table.

---

## Testing

```bash
# Run existing test suite
cd backend && python -m pytest test_suite.py -v

# Syntax check all backend files
python -c "import py_compile; [py_compile.compile(f, doraise=True) for f in ['backend/main.py','backend/models.py','backend/engines/vision.py','backend/engines/ethylene.py','backend/engines/logistics.py','backend/engines/satellite.py','backend/routers/batches.py','backend/routers/harvest.py','backend/routers/passport_routes.py','backend/routers/weather.py','backend/routers/satellite_routes.py','backend/routers/whatif.py','backend/db.py','backend/passport.py','backend/bhoonidhi_client.py','backend/vedas_scraper.py','backend/sync_gateway.py']]"
```

---

## External API Keys Needed

| Service | Env Var | Status |
|---------|---------|--------|
| Google Gemini | `GEMINI_API_KEY` | Required for vision |
| FreeLLMAPI | `FREELLMAPI_KEY` | Optional backup |
| OpenWeatherMap | `OPENWEATHER_API_KEY` | **Need to register** |
| ISRO Bhoonidhi | `ISRO_BHOONIDHI_USER_ID` + `PASSWORD` | Optional for NDVI |
| data.gov.in | `MANDI_API_KEY` | **Need to register** |
