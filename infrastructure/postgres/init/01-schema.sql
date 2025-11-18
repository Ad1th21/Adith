-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    vin VARCHAR(17) PRIMARY KEY,
    fleet_id VARCHAR(50),
    model VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    year INTEGER,
    battery_capacity DECIMAL(6,2),
    max_speed DECIMAL(5,2),
    status VARCHAR(20) NOT NULL DEFAULT 'offline',
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create telemetry hypertable
CREATE TABLE IF NOT EXISTS telemetry (
    id BIGSERIAL,
    vin VARCHAR(17) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    speed DECIMAL(6,2) NOT NULL,
    soc DECIMAL(5,2) NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    altitude DECIMAL(8,2),
    odometer DECIMAL(10,2),
    temperature DECIMAL(5,2),
    voltage DECIMAL(6,2),
    current DECIMAL(6,2),
    heading DECIMAL(5,2),
    raw_data JSONB,
    PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable('telemetry', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    vin VARCHAR(17) NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_fleet_id ON vehicles(fleet_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_seen ON vehicles(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_vin_time ON telemetry(vin, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_location ON telemetry(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_alerts_vin ON alerts(vin);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged) WHERE NOT acknowledged;

-- Add foreign key constraints
ALTER TABLE telemetry 
ADD CONSTRAINT fk_telemetry_vehicle 
FOREIGN KEY (vin) REFERENCES vehicles(vin) 
ON DELETE CASCADE;

ALTER TABLE alerts 
ADD CONSTRAINT fk_alerts_vehicle 
FOREIGN KEY (vin) REFERENCES vehicles(vin) 
ON DELETE CASCADE;

-- Create function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for vehicles table
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set up compression policy (compress chunks older than 7 days)
SELECT add_compression_policy('telemetry', INTERVAL '7 days');

-- Set up retention policy (drop chunks older than 90 days)
SELECT add_retention_policy('telemetry', INTERVAL '90 days');

-- Create continuous aggregate for hourly metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT
    vin,
    time_bucket('1 hour', timestamp) AS bucket,
    AVG(speed) AS avg_speed,
    MAX(speed) AS max_speed,
    MIN(speed) AS min_speed,
    AVG(soc) AS avg_soc,
    MIN(soc) AS min_soc,
    AVG(temperature) AS avg_temperature,
    COUNT(*) AS data_points
FROM telemetry
GROUP BY vin, bucket
WITH NO DATA;

-- Refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('telemetry_hourly',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Create view for latest telemetry per vehicle
CREATE OR REPLACE VIEW vehicle_latest_telemetry AS
SELECT DISTINCT ON (vin)
    vin,
    timestamp,
    speed,
    soc,
    latitude,
    longitude,
    temperature,
    voltage,
    current,
    heading
FROM telemetry
ORDER BY vin, timestamp DESC;

-- Grant permissions (adjust user as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO telemetry_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO telemetry_user;

-- Insert some seed vehicles for testing
INSERT INTO vehicles (vin, fleet_id, model, manufacturer, year, battery_capacity, max_speed, status) VALUES
('1HGBH41JXMN109186', 'FLEET001', 'Model S', 'Tesla', 2023, 100.0, 250.0, 'offline'),
('2HGBH41JXMN109187', 'FLEET001', 'Leaf', 'Nissan', 2022, 62.0, 150.0, 'offline'),
('3HGBH41JXMN109188', 'FLEET001', 'ID.4', 'Volkswagen', 2023, 77.0, 180.0, 'offline'),
('4HGBH41JXMN109189', 'FLEET002', 'Ioniq 5', 'Hyundai', 2023, 77.4, 185.0, 'offline'),
('5HGBH41JXMN109190', 'FLEET002', 'e-tron GT', 'Audi', 2023, 93.4, 245.0, 'offline')
ON CONFLICT (vin) DO NOTHING;

COMMIT;
