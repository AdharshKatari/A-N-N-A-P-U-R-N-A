-- ====================================================================================
-- FreshGuard Seed Data: Sample records for testing the full pipeline
-- Run AFTER init_architecture.sql
-- ====================================================================================

-- 1. CLIMATE FALLBACK: Sample data for Andhra Pradesh tomato-growing districts
INSERT INTO regional_climate_fallback_matrix
    (district_name, state_name, week_number, historical_avg_temp_c, historical_avg_humidity_pct, ambient_heat_risk_tier)
VALUES
    ('Chittoor', 'Andhra Pradesh', 14, 32.5, 58.3, 'ELEVATED'),
    ('Chittoor', 'Andhra Pradesh', 15, 34.1, 55.0, 'CRITICAL'),
    ('Chittoor', 'Andhra Pradesh', 16, 33.8, 56.2, 'ELEVATED'),
    ('Kurnool', 'Andhra Pradesh', 14, 35.2, 52.1, 'CRITICAL'),
    ('Kurnool', 'Andhra Pradesh', 15, 36.0, 50.8, 'CRITICAL'),
    ('Anantapur', 'Andhra Pradesh', 14, 34.8, 48.5, 'CRITICAL'),
    ('Prakasam', 'Andhra Pradesh', 14, 33.2, 60.1, 'ELEVATED'),
    ('Guntur', 'Andhra Pradesh', 14, 32.0, 65.4, 'NOMINAL')
ON CONFLICT (district_name, week_number) DO NOTHING;

-- 2. FARM FIELDS: Sample farm boundaries (approximate polygons near Kurabalakota)
INSERT INTO fields (farmer_id, field_name, crop_type, boundary)
VALUES
    ('FARMER-001', 'Ramaiah Tomato Plot', 'Tomatoes',
     ST_GeomFromText('POLYGON((78.45 13.68, 78.47 13.68, 78.47 13.70, 78.45 13.70, 78.45 13.68))', 4326)),
    ('FARMER-002', 'Lakshmi Mango Orchard', 'Mangoes',
     ST_GeomFromText('POLYGON((78.50 13.72, 78.52 13.72, 78.52 13.74, 78.50 13.74, 78.50 13.72))', 4326)),
    ('FARMER-003', 'Venkat Onion Field', 'Onions',
     ST_GeomFromText('POLYGON((78.55 13.65, 78.57 13.65, 78.57 13.67, 78.55 13.67, 78.55 13.65))', 4326));

-- 3. SATELLITE GRID: Sample Bhuvan NDVI data for the Chittoor region
INSERT INTO bhuvan_satellite_macro_grid
    (grid_geom, bhuvan_ndvi_index, smap_soil_moisture, bhuvan_surface_temp_c, last_satellite_pass)
VALUES
    (ST_GeomFromText('POLYGON((78.40 13.65, 78.50 13.65, 78.50 13.75, 78.40 13.75, 78.40 13.65))', 4326),
     0.72, 0.45, 31.2, NOW() - INTERVAL '2 days'),
    (ST_GeomFromText('POLYGON((78.50 13.65, 78.60 13.65, 78.60 13.75, 78.50 13.75, 78.50 13.65))', 4326),
     0.38, 0.22, 34.8, NOW() - INTERVAL '3 days'),
    (ST_GeomFromText('POLYGON((78.45 13.70, 78.55 13.70, 78.55 13.80, 78.45 13.80, 78.45 13.70))', 4326),
     0.61, 0.38, 32.5, NOW() - INTERVAL '1 day');

-- 4. CROP BATCHES: Sample active batches with QR tokens
INSERT INTO crop_batches
    (batch_id, field_id, initial_weight_kg, harvest_timestamp, initial_visual_score,
     detected_ripeness_stage, fungal_pathogen_presence, qr_code_secure_token, current_status)
VALUES
    ('FG-2026-TOM-001',
     (SELECT field_id FROM fields WHERE field_name = 'Ramaiah Tomato Plot' LIMIT 1),
     450.00, NOW() - INTERVAL '6 hours', 82.50, 'Optimal', FALSE,
     'QR-FG-2026-TOM-001-SECURE-TOKEN-ABC123', 'ACTIVE'),
    ('FG-2026-MNG-002',
     (SELECT field_id FROM fields WHERE field_name = 'Lakshmi Mango Orchard' LIMIT 1),
     320.00, NOW() - INTERVAL '12 hours', 75.00, 'Optimal', FALSE,
     'QR-FG-2026-MNG-002-SECURE-TOKEN-DEF456', 'ACTIVE'),
    ('FG-2026-TOM-003',
     (SELECT field_id FROM fields WHERE field_name = 'Ramaiah Tomato Plot' LIMIT 1),
     180.00, NOW() - INTERVAL '2 days', 45.00, 'Overripe', TRUE,
     'QR-FG-2026-TOM-003-SECURE-TOKEN-GHI789', 'ACTIVE');

-- 5. ENVIRONMENTAL LOGS: Sample telemetry for batch FG-2026-TOM-001
INSERT INTO environmental_logs
    (log_timestamp, batch_id, ambient_temperature_c, relative_humidity_pct, location_point)
VALUES
    (NOW() - INTERVAL '5 hours', 'FG-2026-TOM-001', 31.5, 62.0,
     ST_GeomFromText('POINT(78.46 13.69)', 4326)),
    (NOW() - INTERVAL '4 hours', 'FG-2026-TOM-001', 33.2, 58.5,
     ST_GeomFromText('POINT(78.48 13.69)', 4326)),
    (NOW() - INTERVAL '3 hours', 'FG-2026-TOM-001', 35.0, 55.0,
     ST_GeomFromText('POINT(78.50 13.70)', 4326)),
    (NOW() - INTERVAL '2 hours', 'FG-2026-TOM-001', 34.1, 57.2,
     ST_GeomFromText('POINT(78.52 13.70)', 4326)),
    (NOW() - INTERVAL '1 hours', 'FG-2026-TOM-001', 32.8, 60.1,
     ST_GeomFromText('POINT(78.54 13.71)', 4326));

-- 6. SALVAGE FACILITIES: Plan-B backup processing plants and cold storage
INSERT INTO secondary_salvage_facilities
    (facility_name, facility_type, guaranteed_floor_price_per_kg, location_geom)
VALUES
    ('Chittoor Tomato Pulp Factory', 'Processing_Plant', 18.00,
     ST_GeomFromText('POINT(78.62 13.68)', 4326)),
    ('Tirupati Cold Storage Hub', 'Cold_Storage', 22.50,
     ST_GeomFromText('POINT(78.70 13.65)', 4326)),
    ('Kadapa Fruit Processing Unit', 'Processing_Plant', 15.00,
     ST_GeomFromText('POINT(78.80 14.45)', 4326)),
    ('Nellore Cold Chain Depot', 'Cold_Storage', 20.00,
     ST_GeomFromText('POINT(79.95 14.45)', 4326));
