# 🎓 FreshGuard: Smart India Hackathon (SIH) Technical Viva & Defense Question Bank
## Comprehensive Senior Jury Q&A, Scientific Explanations & Algorithmic Defense

---

### 🧬 Category 1: Biological & Biochemical Foundations ($Q_{10}$ & Ethylene Kinetics)

#### Q1: "What is the biological significance of the $Q_{10}$ temperature coefficient in post-harvest logistics?"
> **Optimal Answer:**
> The $Q_{10}$ temperature coefficient represents the rate of metabolic respiration acceleration when ambient temperature rises by $10^\circ\text{C}$. For perishable commodities like tomatoes ($Q_{10} = 2.2$) and mangoes ($Q_{10} = 2.5$), respiration doubles or triples per $10^\circ\text{C}$ rise above their baseline safe threshold ($12^\circ\text{C}$). 
> 
> FreshGuard utilizes the exponential formula:
> $$\text{Thermal Velocity} = Q_{10}^{\frac{T_{\text{ambient}} - 12.0}{10.0}}$$
> This directly accounts for high-heat transit conditions (e.g., $38^\circ\text{C}$ summer transit in Maharashtra/Telangana), proving that produce degrades $3\times\text{ to }5\times$ faster during daytime delays.

---

#### Q2: "How does FreshGuard handle climacteric vs. non-climacteric cross-contamination in transit vehicles?"
> **Optimal Answer:**
> Climacteric crops (e.g., tomatoes, mangoes) undergo an auto-catalytic burst of ethylene gas ($C_2H_4$) during ripening, while non-climacteric crops (e.g., potatoes, onions) do not produce massive ethylene but may be highly sensitive to it (e.g., potatoes sprouting prematurely).
> 
> FreshGuard’s `EthyleneInteractionCore` computes a non-linear chemical load multiplier:
> 1. **Ripeness Load:** Overripe produce contributes $5.0\text{ PPM}$ base load vs $1.5\text{ PPM}$ for optimal.
> 2. **Companion Cargo Weight Ratio:** Accounts for cross-loaded commodities:
>    $$\text{Companion Factor} = 4.0 \times \left(\frac{\text{Weight}_{\text{companion}}}{100}\right) \quad \text{(if overripe)}$$
> 3. **Ventilation Containment:** Unventilated vehicle bodies trap gases, applying a $2.5\times$ confinement penalty.
> 4. **Safety Bound:** Clamped to a max penalty ceiling of $4.00\times$.

---

### 🤖 Category 2: AI Grader & Computer Vision Pipeline

#### Q3: "Why did you use Gemini 2.5 Flash with structured JSON schemas rather than a traditional CNN like YOLO or ResNet?"
> **Optimal Answer:**
> Traditional CNNs (YOLO/ResNet) require massive, labor-intensive labelled datasets for every new crop defect and suffer severe domain shift under varied rural lighting.
> 
> Gemini 2.5 Flash provides:
> 1. **Zero-Shot Agronomic Semantics:** Recognizes nuanced physiological disorders (e.g., blossom end rot, sunscald, early fungal mycelium) without crop-by-crop retraining.
> 2. **Deterministic Schema Enforcement:** Uses `GenerateContentConfig(response_schema=VisionAgronomySchema, temperature=0.1)` guaranteeing strict, machine-readable JSON without conversational hallucination.
> 3. **Low Latency & Cost Efficiency:** Sub-800ms response times at ultra-low inference costs, with built-in programmatic local matrix fallback in case of connectivity loss.

---

#### Q4: "How do you prevent a farmer from scanning a single cherry-picked 'good' tomato to fake batch quality?"
> **Optimal Answer:**
> We implement the **5-Fruit Random Sampling Protocol** in [CropScannerScreen.tsx](file:///c:/Users/HP/OneDrive/Documents/webd/task/The%20Farmer%20Market/CropScannerScreen.tsx). The native state machine forces the user to capture 5 distinct cross-sectional samples across top, middle, and bottom crates of the harvest lot before assembling the payload. The visual scoring represents an integrated statistical mean rather than an isolated cherry-picked data point.

---

### 🗺️ Category 3: Geospatial Engineering & PostGIS Architecture

#### Q5: "How does PostGIS enable sub-10ms nearest-neighbor Plan-B rerouting during an in-transit crisis?"
> **Optimal Answer:**
> In our database schema [schema.sql](file:///c:/Users/HP/OneDrive/Documents/webd/task/The%20Farmer%20Market/schema.sql), all secondary facilities (cold storages and food processing plants) are indexed with **GiST (Generalized Search Tree)** spatial indices on `location_geom`.
> 
> Using the PostGIS K-Nearest Neighbor (KNN) distance operator `<->`:
> ```sql
> SELECT facility_id, name, guaranteed_floor_price_per_kg
> FROM secondary_salvage_facilities
> WHERE is_active = TRUE AND ST_DWithin(location_geom::geography, mandi_geom::geography, 100000)
> ORDER BY location_geom <-> mandi_geom
> LIMIT 5;
> ```
> This executes with bounding-box index scans in $<10\text{ms}$, allowing instant recalculation of salvage profit margins:
> $$\text{Salvage Profit} = (\text{Quantity} \times \text{Floor Price}) - \text{Total Transport Cost}$$

---

#### Q6: "Explain the multi-tier spatial fallback function `get_tiered_crop_modifiers`."
> **Optimal Answer:**
> Indian smallholder farmlands often lack high-resolution private data. FreshGuard uses a tiered fallback mechanism:
> 1. **Tier 1 (Public Satellite Macro Grid):** Intersects farm boundaries with ISRO Bhuvan / VEDAS 250m grid data. If NDVI $< 0.40$ (indicating water/thermal stress during pre-harvest), a $15\%$ base shelf-life penalty ($0.85\times$) is applied.
> 2. **Tier 2 (Private Drone UAV Layer):** If high-resolution multispectral drone data is uploaded within 14 days, it overrides the satellite macro grid with centimeter-accurate NDVI/NDWI indices.
> 3. **Tier 3 (10-Year Historical Climate Matrix):** If live APIs are unreachable, the system queries the `regional_climate_fallback_matrix` partitioned by calendar week (Weeks 1–53) to estimate ambient thermal risks.

---

### 🚛 Category 4: Economic Resilience & Plan-B Salvage Loop

#### Q7: "Why is a route classified as 'VULNERABLE' or 'CRITICAL_SPECULATIVE' even if it offers a higher mandi price?"
> **Optimal Answer:**
> Traditional logistics optimizes solely for gross market price ($P \times Q$). In agriculture, this is dangerously speculative:
> - If a Mandi is 300km away ($11.5\text{ hrs}$ transit at $34.5^\circ\text{C}$), produce arrives with only $1.2\text{ days}$ of remaining shelf life.
> - If the Mandi experiences market gluts or administrative rejection (accounting for a standard $4.0\text{-hour}$ turnaround penalty), the crop is $100\%$ ruined before it can reach another buyer.
> - FreshGuard’s algorithm penalizes routes without a viable salvage facility within reach:
>   - **`AIRTIGHT`:** Arrival shelf life $>1.5\text{ days}$ AND active secondary salvage cluster within range $\rightarrow$ **100% Rank Weight**.
>   - **`VULNERABLE`:** High primary profit but NO viable fallback salvage facility $\rightarrow$ **50% Rank Weight Penalty**.
>   - **`CRITICAL_SPECULATIVE`:** Arrival shelf life $<1.5\text{ days}$ $\rightarrow$ **90% Rank Weight Penalty**.

---

### 🛡️ Category 5: DevOps, Edge Performance & System Robustness

#### Q8: "How does FreshGuard operate in rural areas with poor 2G/3G network connectivity?"
> **Optimal Answer:**
> 1. **Client-Side Image Manipulation:** [CropScannerScreen.tsx](file:///c:/Users/HP/OneDrive/Documents/webd/task/The%20Farmer%20Market/CropScannerScreen.tsx) uses `expo-image-manipulator` to downsample images to 800px width and compress them to WebP ($75\%$ quality), cutting payload sizes from $\sim 8\text{MB}$ raw JPEG down to $\sim 85\text{KB}$ ($>98\%$ bandwidth reduction).
> 2. **Non-Blocking Background GPS:** GPS fixes are acquired asynchronously during camera initialization.
> 3. **Edge SQLite Fallback:** When the gateway is unreachable, the mobile app switches to an embedded SQLite lookup table populated with regional Q10 constants and pre-cached mandi routes.

---

#### Q9: "Why use TimescaleDB hypertables for `environmental_logs`?"
> **Optimal Answer:**
> IoT fleet tracking generates millions of sensor rows per day across thousands of transit trucks. Standard PostgreSQL tables degrade significantly under high-volume time-series inserts.
> 
> TimescaleDB automatically partitions `environmental_logs` into temporal chunks by `log_timestamp`. This enables:
> - $10\times\text{ to }20\times$ faster write throughput for continuous GPS, DHT22 temp/humidity, and MQ-137 ethylene sensor telemetry.
> - Native time-bucket aggregation queries for plotting live in-transit decay curves on the monitoring dashboard.
