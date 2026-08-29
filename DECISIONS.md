# DECISIONS.md — FreshGuard / Annapurna

> Log of meaningful architectural and implementation decisions with rationale.
> Each entry: what was decided, why, and what was considered instead.

---

## 2026-08-23 — Monolith Split Session

### D11: Split monolithic main.py into routers + engines

**Decision**: Refactored 1454-line `backend/main.py` into 14 focused files:
- `models.py` — shared Pydantic contracts
- `engines/vision.py`, `engines/ethylene.py`, `engines/satellite.py`, `engines/logistics.py` — business logic
- `routers/batches.py`, `routers/harvest.py`, `routers/passport_routes.py`, `routers/weather.py`, `routers/satellite_routes.py`, `routers/whatif.py` — API endpoints
- `main.py` — thin app shell (~80 lines)

**Why**: 1454 lines in a single file made it impossible to reason about impact, test individual components, or have multiple AI sessions work without merge conflicts. The split follows the natural module boundaries that already existed in the code.

**Considered**: Keeping as monolith and just adding auth/rate-limiting. Rejected because adding more features to a 1454-line file would make it even harder to maintain.

### D12: Engine files own their singletons

**Decision**: `satellite_core = SatelliteDataCore()` lives in `engines/satellite.py`, not in `main.py`.

**Why**: Each engine manages its own state. The harvest router imports the singleton directly. This avoids circular dependencies and keeps `main.py` clean.

---

## 2026-08-23 — Security Hardening Session

### D1: Keep Pydantic v1 (for now)

**Decision**: Backend stays on Pydantic `1.10.14`. Root `requirements.txt` was updated to match.

**Why**: `backend/main.py` uses v1 API throughout: `.parse_obj()`, `.parse_raw()`, `.dict()`. Upgrading to v2 requires updating every model call across 1454 lines. This should happen *after* main.py is split into routers (Phase 2).

**Considered**: Upgrading to v2 immediately. Rejected because the monolith is already hard to test; a simultaneous Pydantic migration would double the risk surface.

### D2: CORS remains configurable via env var

**Decision**: `CORS_ORIGINS` env var defaults to `"*"` in development. Production must set it explicitly.

**Why**: Mobile apps don't send cookies/tokens via browser CORS, so `*` is acceptable for the API-only backend. The real security comes from JWT auth (not yet implemented). Once JWT is added, CORS can be tightened further.

**Considered**: Hardcoding specific origins. Rejected because it would break local development workflows.

### D3: Error responses are generic, logs are detailed

**Decision**: All HTTP error responses return human-readable generic messages. Full exception details go to server-side logs only.

**Why**: The harvest evaluation endpoint (`/api/v5/harvest/evaluate-all`) was leaking internal error messages like `Central Core Runtime Exception: {str(e)}`. This exposes stack traces, file paths, and library versions to attackers.

**Considered**: Returning error codes instead of messages. Rejected because the mobile app needs user-friendly messages; a code system would require client-side mapping.

### D4: HMAC secret uses random fallback with warning

**Decision**: `passport.py` generates a random 64-byte key if `PASSPORT_HMAC_SECRET` is not set. Logs a warning.

**Why**: The app must work without configuration for demos and hackathon judging. But QR tokens signed with a random key can't survive process restarts — so the warning is critical.

**Considered**: Crashing on missing secret. Rejected because it would break all demo scenarios.

---

## 2026-08-23 — Codebase Cleanup

### D5: Delete root main.py, keep only backend/main.py

**Decision**: Removed root `main.py` entirely. `backend/main.py` is the production version.

**Why**: The root file was an older copy with different class names (`EthyleneGasCore` vs `EthyleneGasCore` — actually same, but different endpoints like `/api/v5/harvest/evaluate-all` with different signatures). Having two versions causes confusion about which is canonical.

### D6: Delete root test file, keep backend/test_suite.py

**Decision**: Removed `test_freshguard_intelligence.py`. It referenced stale class names and endpoints.

**Why**: Running it would fail on import. It's worse than no test — it's a false signal of coverage.

### D7: Consolidate to single requirements.txt

**Decision**: One `requirements.txt` at root. Backend's copy deleted.

**Why**: Two files with different Pydantic versions (root had v2, backend had v1) creates dependency conflicts. Single source of truth.

---

## Pre-existing Decisions (from original codebase)

### D8: InMemoryStore as fallback for PostgreSQL

**Decision**: When PostgreSQL is unreachable, all operations fall back to Python dicts in `InMemoryStore`.

**Why**: The app targets rural India where Docker + PostgreSQL may not be available. Demo/judging scenarios need zero-dependency operation. The tradeoff is data loss on restart, which is acceptable for demos.

### D9: 3-tier vision pipeline

**Decision**: FreeLLMAPI → Google Gemini → Deterministic fallback.

**Why**: Gemini free tier is 15 RPM. FreeLLMAPI provides a gateway with potentially higher limits. The deterministic fallback ensures the app works even when all AI services are down — critical for field demos.

### D10: Q10 respiration physics for shelf-life modeling

**Decision**: Use scientifically grounded Q₁₀ kinetics (2.0–2.5 multiplier per 10°C) instead of simple linear decay.

**Why**: Post-harvest loss is exponential, not linear. A linear model would underestimate spoilage at high temperatures — exactly when accuracy matters most. The Q₁₀ constants are crop-specific (tomatoes: 2.2, mangoes: 2.5, onions: 2.0).
