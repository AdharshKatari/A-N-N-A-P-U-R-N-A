# CONSTRAINTS.md — FreshGuard / Annapurna

> What the AI must never do. Boundaries, not suggestions.

---

## 🔴 Hard Constraints (Never Violate)

### C1: Do NOT upgrade Pydantic to v2
`backend/main.py` uses Pydantic v1 API (`.parse_obj()`, `.parse_raw()`, `.dict()`) across 1454 lines. Upgrading requires updating every model call. This must happen **after** main.py is split into routers (Phase 2), not before.

### C2: Do NOT modify the Q10 respiration physics
The `LogisticsKineticsCore` class uses scientifically grounded Q₁₀ constants:
- Tomatoes: 2.2
- Mangoes: 2.5
- Onions: 2.0

These are based on published post-harvest biology research. Do not change the formula, constants, or threshold logic without consulting domain literature.

### C3: Do NOT modify the EthyleneGasCore gas interaction matrix
The ethylene cross-contamination model simulates real PPM chemistry in sealed containers. The climacteric flags, sensitivity levels, and ventilation multipliers are crop-science derived.

### C4: Do NOT remove the InMemoryStore fallback
`db.py` falls back to `InMemoryStore` when PostgreSQL is unreachable. This is critical for field demos, hackathon judging, and development without Docker. Never remove or gate it behind a feature flag.

### C5: Do NOT hardcode secrets
All secrets must come from environment variables:
- `PASSPORT_HMAC_SECRET` — passport signing key
- `POSTGRES_PASSWORD` — database password
- `GEMINI_API_KEY` — AI vision
- `OPENWEATHER_API_KEY` — weather
- `ISRO_BHOONIDHI_USER_ID` / `PASSWORD` — satellite
- `MANDI_API_KEY` — mandi prices
- `FREELLMAPI_KEY` — alternative vision gateway

Never put real keys in source code. The `.env` file is gitignored.

### C6: Do NOT delete the deterministic vision fallback
The 3rd tier of the vision pipeline (deterministic baseline returning `Tomatoes, 85, Optimal, False`) is the safety net for demos when all AI services are down. It must always be the last fallback.

---

## 🟠 Soft Constraints (Ask Before Changing)

### C7: Do not add new dependencies without asking
The project has a specific dependency set. New packages (Redis, Celery, SQLAlchemy, etc.) should be discussed first. The exception is security-related packages (python-jose, passlib, slowapi) which are already planned.### C8: Do not re-merge routers back into main.py

The split is complete. `main.py` is now ~80 lines. Do not add business logic back into it. Keep engines in `engines/` and endpoints in `routers/`.

### C9: Do not change the API response shapes
The mobile app (`mobile/src/services/api.ts`) depends on specific response structures. Changing response keys or nesting will break the mobile app. If a response must change, update both backend and mobile in the same commit.

### C10: Do not touch the mobile screens unless specifically asked
The 17 screens are mostly stable. Changes should be intentional, not exploratory.

---

## 🟡 Style Constraints

### C11: Follow existing code patterns
- Backend: class-based engines with `@classmethod` methods
- Database: module-level functions with `db.is_connected` branching
- Mobile: functional components with local state (no Redux)
- Tests: pytest with `pytest-asyncio`

### C12: Comment non-obvious logic
The Q10 formula, ethylene PPM modeling, and Plan-B routing logic are scientifically dense. Always explain the "why" in comments, not the "what."

### C13: Log errors, don't expose them
Server-side: `logger.error(f"... {str(e)}")` — full details.
Client-side: `detail="Generic error message"` — no internals.

---

## Files That Must Not Change Without Discussion

| File | Reason |
|------|--------|
| `backend/engines/logistics.py` :: `LogisticsKineticsCore` | Scientific model |
| `backend/engines/ethylene.py` :: `EthyleneGasCore` | Scientific model |
| `backend/engines/vision.py` :: fallback tier 3 | Demo safety net |
| `backend/db.py` :: `InMemoryStore` | Demo/judging safety net |
| `backend/passport.py` :: `CryptographicPassportEngine` | Crypto correctness |
| `backend/init_architecture.sql` | Database schema (requires migration) |
| `mobile/src/services/api.ts` | Mobile ↔ backend contract |
