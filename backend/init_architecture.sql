-- Enable enterprise spatial and identification tracking modules
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean database slate during pipeline migrations
DROP TABLE IF EXISTS secondary_salvage_facilities CASCADE;
DROP TABLE IF EXISTS environmental_logs CASCADE;
DROP TABLE IF EXISTS crop_batches CASCADE;
DROP TABLE IF EXISTS drone_flight_layers CASCADE;
DROP TABLE IF EXISTS bhuvan_satellite_macro_grid CASCADE;
DROP TABLE IF EXISTS regional_climate_fallback_matrix CASCADE;
DROP TABLE IF EXISTS fields CASCADE;

-- 1. CLIMATE FALLBACK DATABASE (10-Year historical regional weather records)
CREATE TABLE regional_climate_fallback_matrix (
    fallback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_name VARCHAR(100) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 53),
    historical_avg_temp_c NUMERIC(4,1) NOT NULL,
    historical_avg_humidity_pct NUMERIC(4,1) NOT NULL,
    ambient_heat_risk_tier VARCHAR(20) DEFAULT 'NOMINAL' CHECK (ambient_heat_risk_tier IN ('NOMINAL', 'ELEVATED', 'CRITICAL')),
    CONSTRAINT unique_district_week UNIQUE (district_name, week_number)
);
CREATE INDEX idx_climate_fallback_lookup ON regional_climate_fallback_matrix (district_name, week_number);

-- 2. FARM BOUNDARY DATABASE (Uses PostGIS MultiPolygon vectors)
CREATE TABLE fields (
    field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    crop_type VARCHAR(50) NOT NULL,
    boundary GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_fields_boundary ON fields USING GIST (boundary);

-- 3. GOVT SATELLITE CACHE (Stores pre-fetched ISRO VEDAS and Bhoonidhi data grids)
CREATE TABLE bhuvan_satellite_macro_grid (
    grid_cell_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_geom GEOMETRY(Polygon, 4326) NOT NULL,
    bhuvan_ndvi_index NUMERIC(4,3) CHECK (bhuvan_ndvi_index BETWEEN -1.000 AND 1.000),
    smap_soil_moisture NUMERIC(4,2) CHECK (smap_soil_moisture BETWEEN 0.00 AND 1.00),
    bhuvan_surface_temp_c NUMERIC(3,1),
    last_satellite_pass TIMESTAMP WITH TIME ZONE NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bhuvan_grid_geom ON bhuvan_satellite_macro_grid USING GIST (grid_geom);

-- 4. OPTIONAL PREMIUM DRONE PORT (High-precision centimeter-level UAV layer)
CREATE TABLE drone_flight_layers (
    layer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES fields(field_id) ON DELETE CASCADE,
    flight_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    mean_ndvi_score NUMERIC(4,3) CHECK (mean_ndvi_score BETWEEN -1.000 AND 1.000),
    mean_ndwi_score NUMERIC(4,3) CHECK (mean_ndwi_score BETWEEN -1.000 AND 1.000),
    raw_orthomosaic_url TEXT
);
CREATE INDEX idx_drone_flight_time ON drone_flight_layers (field_id, flight_timestamp DESC);

-- 5. BATCH PASSPORT LEDGER (The digital crop passport tracking modifications)
CREATE TABLE crop_batches (
    batch_id VARCHAR(50) PRIMARY KEY,
    field_id UUID REFERENCES fields(field_id) ON DELETE SET NULL,
    initial_weight_kg NUMERIC(8,2) NOT NULL,
    harvest_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    initial_visual_score NUMERIC(5,2) NOT NULL,
    detected_ripeness_stage VARCHAR(30) NOT NULL CHECK (detected_ripeness_stage IN ('Unripe', 'Optimal', 'Overripe')),
    fungal_pathogen_presence BOOLEAN DEFAULT FALSE,
    macro_satellite_modifier NUMERIC(3,2) DEFAULT 1.00,
    micro_drone_modifier     NUMERIC(3,2) DEFAULT 1.00,
    logistics_road_penalty   NUMERIC(3,2) DEFAULT 1.00,
    qr_code_secure_token TEXT UNIQUE NOT NULL,
    current_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (current_status IN ('ACTIVE', 'TRANSIT', 'SOLD', 'SPOILED'))
);
CREATE INDEX idx_batches_lookup ON crop_batches (current_status, harvest_timestamp DESC);

-- 6. ENVIRONMENTAL LOGS TELEMETRY (TimescaleDB hyper-table for time-series logs)
CREATE TABLE environmental_logs (
    log_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    batch_id VARCHAR(50) REFERENCES crop_batches(batch_id) ON DELETE CASCADE,
    ambient_temperature_c NUMERIC(4,1) NOT NULL,
    relative_humidity_pct NUMERIC(4,1) NOT NULL,
    location_point GEOMETRY(Point, 4326)
);
SELECT create_hypertable('environmental_logs', 'log_timestamp');
CREATE INDEX idx_logs_spatial_time ON environmental_logs (batch_id, log_timestamp DESC);

-- 7. PLAN-B SALVAGE DIRECTORY (PostGIS spatial directory for backup routing options)
CREATE TABLE secondary_salvage_facilities (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name VARCHAR(150) NOT NULL,
    facility_type VARCHAR(50) CHECK (facility_type IN ('Processing_Plant', 'Cold_Storage')),
    guaranteed_floor_price_per_kg NUMERIC(6,2) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_facilities_spatial ON secondary_salvage_facilities USING GIST (location_geom);
