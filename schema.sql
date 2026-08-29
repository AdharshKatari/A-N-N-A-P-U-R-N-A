-- ====================================================================================
-- 🐘 FreshGuard Post-Harvest Intelligence: Module 2 Database Initialization Script
-- Production Schema: Multi-tier Geospatial Cache, ISRO Bhuvan Grid, UAV Drone Layers,
-- Digital Crop Passports, TimescaleDB Hyper-tables, and Plan-B Salvage Spatial Directory
-- ====================================================================================

-- ====================================================================================
-- 1. SYSTEM EXTENSIONS & DATABASE ARCHITECTURE ENVIRONMENT SETUP
-- ====================================================================================
-- Enable PostGIS for advanced geospatial boundary geometry and closest-point queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation mechanics for secure, non-sequential microservice ledger indexing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional TimescaleDB support for hypertable telemetry
-- CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;

-- Wipe pre-existing schemas in strict topological order to guarantee clean script execution
DROP TABLE IF EXISTS secondary_salvage_facilities CASCADE;
DROP TABLE IF EXISTS environmental_logs CASCADE;
DROP TABLE IF EXISTS crop_batches CASCADE;
DROP TABLE IF EXISTS drone_flight_layers CASCADE;
DROP TABLE IF EXISTS bhuvan_satellite_macro_grid CASCADE;
DROP TABLE IF EXISTS regional_climate_fallback_matrix CASCADE;
DROP TABLE IF EXISTS fields CASCADE;

-- ====================================================================================
-- 2. AUTOMATION & RESILIENCE LAYER: 10-YEAR HISTORICAL CLIMATE FALLBACK DATABASE
-- ====================================================================================
CREATE TABLE regional_climate_fallback_matrix (
    fallback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_name VARCHAR(100) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    -- Calendar week block (1 to 53) to map dynamic seasonal variations [INDEX]
    week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 53),
    historical_avg_temp_c NUMERIC(4,1) NOT NULL,
    historical_avg_humidity_pct NUMERIC(4,1) NOT NULL,
    ambient_heat_risk_tier VARCHAR(20) DEFAULT 'NOMINAL' CHECK (ambient_heat_risk_tier IN ('NOMINAL', 'ELEVATED', 'CRITICAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_district_week UNIQUE (district_name, week_number)
);

CREATE INDEX idx_climate_fallback_lookup ON regional_climate_fallback_matrix (district_name, week_number);

-- Populate historical baseline profiles for key Indian agricultural supply-chain hubs [INDEX]
INSERT INTO regional_climate_fallback_matrix 
    (district_name, state_name, week_number, historical_avg_temp_c, historical_avg_humidity_pct, ambient_heat_risk_tier)
VALUES
    ('Nashik', 'Maharashtra', 15, 38.5, 24.0, 'CRITICAL'),     -- Peak summer thermal stress phase
    ('Nashik', 'Maharashtra', 26, 26.5, 88.0, 'NOMINAL'),      -- High-humidity monsoon fungal phase
    ('Anantapur', 'Andhra Pradesh', 15, 40.2, 32.0, 'CRITICAL'), -- Extreme Mango harvest heat stress
    ('Madanapalle', 'Andhra Pradesh', 18, 36.8, 45.0, 'ELEVATED') -- High-volume tomato production tracking
ON CONFLICT (district_name, week_number) DO NOTHING;

-- ====================================================================================
-- 3. UPSTREAM LAYER: GEOSPATIAL FIELDS & ADVANCED ISRO SATELLITE CACHE DICTIONARIES
-- ====================================================================================
CREATE TABLE fields (
    field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    crop_type VARCHAR(50) NOT NULL,
    -- MultiPolygon geometry representing exact geofenced plot perimeters using WGS 84 system
    boundary GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GIST spatial boundary index accelerates containment lookup functions down to sub-milliseconds
CREATE INDEX idx_fields_boundary ON fields USING GIST (boundary);

-- Macro data-clearinghouse caching regional metrics from ISRO VEDAS and Bhoonidhi [INDEX]
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

-- Premium micro-UAV drone mapping data registry (Optional high-precision override layer)
CREATE TABLE drone_flight_layers (
    layer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES fields(field_id) ON DELETE CASCADE,
    flight_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    mean_ndvi_score NUMERIC(4,3) CHECK (mean_ndvi_score BETWEEN -1.000 AND 1.000),
    mean_ndwi_score NUMERIC(4,3) CHECK (mean_ndwi_score BETWEEN -1.000 AND 1.000),
    raw_orthomosaic_url TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drone_flight_time ON drone_flight_layers (field_id, flight_timestamp DESC);

-- ====================================================================================
-- 4. MIDSTREAM LAYER: DIGITAL BATCH PASSPORTS & LOGISTICS TIME-SERIES DATA TELEMATICS
-- ====================================================================================
CREATE TABLE crop_batches (
    batch_id VARCHAR(50) PRIMARY KEY, -- Printed as the unique identifier on the crop passport QR code label
    field_id UUID REFERENCES fields(field_id) ON DELETE SET NULL,
    initial_weight_kg NUMERIC(8,2) NOT NULL,
    harvest_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Feature arrays extracted by the frontend Vision AI scanning segment
    initial_visual_score NUMERIC(5,2) NOT NULL,
    detected_ripeness_stage VARCHAR(30) NOT NULL CHECK (detected_ripeness_stage IN ('Unripe', 'Optimal', 'Overripe')),
    fungal_pathogen_presence BOOLEAN DEFAULT FALSE,
    
    -- Multimodal environmental modifier tokens passed directly to the Q10 core
    macro_satellite_modifier NUMERIC(3,2) DEFAULT 1.00, -- Inherited from ISRO Bhuvan metrics lookups
    micro_drone_modifier     NUMERIC(3,2) DEFAULT 1.00, -- Inherited from progressive UAV imagery overrides
    logistics_road_penalty   NUMERIC(3,2) DEFAULT 1.00, -- Auto-computed highway shock index parameters
    
    qr_code_secure_token TEXT UNIQUE NOT NULL,
    current_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (current_status IN ('ACTIVE', 'TRANSIT', 'SOLD', 'SPOILED'))
);

CREATE INDEX idx_batches_lookup ON crop_batches (current_status, harvest_timestamp DESC);

-- Time-series telemetry tracking actual transportation environment profiles over intervals
CREATE TABLE environmental_logs (
    log_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    batch_id VARCHAR(50) REFERENCES crop_batches(batch_id) ON DELETE CASCADE,
    ambient_temperature_c NUMERIC(4,1) NOT NULL,
    relative_humidity_pct NUMERIC(4,1) NOT NULL,
    location_point GEOMETRY(Point, 4326) -- Logs real-time geographic vehicle movements
);

-- Convert standard table into a high-performance database hyper-table for time-series logs
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('environmental_logs', 'log_timestamp', if_not_exists => TRUE);
    END IF;
END $$;

CREATE INDEX idx_logs_spatial_time ON environmental_logs (batch_id, log_timestamp DESC);

-- ====================================================================================
-- 5. DOWNSTREAM LAYER: SPATIAL DIRECTORY FOR PLAN-B REJECTION ROUTING
-- ====================================================================================
CREATE TABLE secondary_salvage_facilities (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name VARCHAR(150) NOT NULL,
    facility_type VARCHAR(50) CHECK (facility_type IN ('Processing_Plant', 'Cold_Storage')),
    guaranteed_floor_price_per_kg NUMERIC(6,2) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL, -- Point coordinates used for spatial closest-neighbor index searches
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_facilities_spatial ON secondary_salvage_facilities USING GIST (location_geom);

-- ====================================================================================
-- 6. HIGH-PERFORMANCE MULTI-TIERED LOOKUP FUNCTION (DATABASE MIDDLEWARE CORE)
-- ====================================================================================
CREATE OR REPLACE FUNCTION get_tiered_crop_modifiers(
    target_lng DOUBLE PRECISION,
    target_lat DOUBLE PRECISION
)
RETURNS TABLE (
    out_field_id UUID,
    out_crop_type VARCHAR,
    out_macro_modifier NUMERIC,
    out_micro_modifier NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.field_id,
        f.crop_type::VARCHAR,
        -- Check public macro data maps: automatically apply a 15% reduction penalty if the plot area matches severe water stress indices [INDEX]
        COALESCE(
            CASE WHEN b.bhuvan_ndvi_index < 0.40 THEN 0.85::NUMERIC ELSE 1.00::NUMERIC END, 
            1.00::NUMERIC
        ) as out_macro_modifier,
        -- Check premium localized drone data: prioritize private high-res drone inputs over macro satellite bands if added within 14 days
        COALESCE(
            CASE WHEN d.mean_ndvi_score < 0.45 THEN 0.80::NUMERIC ELSE 1.15::NUMERIC END, 
            1.00::NUMERIC
        ) as out_micro_modifier
    FROM fields f
    LEFT JOIN bhuvan_satellite_macro_grid b ON ST_Intersects(f.boundary, b.grid_geom)
    LEFT JOIN LATERAL (
        SELECT mean_ndvi_score FROM drone_flight_layers 
        WHERE field_id = f.field_id AND flight_timestamp >= NOW() - INTERVAL '14 days'
        ORDER BY flight_timestamp DESC LIMIT 1
    ) d ON TRUE
    -- Match parameters with precision by scanning if the user's coordinate matches any geofenced plot boundaries
    WHERE ST_Contains(f.boundary, ST_SetSRID(ST_Point(target_lng, target_lat), 4326))
    ORDER BY b.last_satellite_pass DESC LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================================
-- 7. NOTIFICATIONS & SCANS (Added for UI migration)
-- ====================================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icon VARCHAR(50) NOT NULL,
    icon_color VARCHAR(20) NOT NULL,
    icon_bg VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    time_label VARCHAR(50) NOT NULL,
    unread BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pest_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(100) NOT NULL,
    scan_date VARCHAR(100) NOT NULL,
    issue_detected BOOLEAN DEFAULT FALSE,
    result_text VARCHAR(200) NOT NULL,
    image_uri TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
