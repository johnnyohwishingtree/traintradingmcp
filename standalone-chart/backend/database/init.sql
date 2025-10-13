-- Chart Data Database Schema for PostgreSQL
-- Optimized for time-series financial data

-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Symbols table
CREATE TABLE symbols (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255),
    exchange VARCHAR(50),
    type VARCHAR(50) DEFAULT 'Stock',
    metadata JSONB,  -- For future extensibility
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on symbol for fast lookups
CREATE INDEX idx_symbols_symbol ON symbols(symbol);

-- OHLC data table optimized for time-series queries
CREATE TABLE ohlc_data (
    id BIGSERIAL PRIMARY KEY,
    symbol_id INTEGER NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    interval VARCHAR(20) NOT NULL, -- '1min', '5min', '1day', '1week', '1month'
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(12,4) NOT NULL,
    high DECIMAL(12,4) NOT NULL,
    low DECIMAL(12,4) NOT NULL,
    close DECIMAL(12,4) NOT NULL,
    volume BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure no duplicate data points
    CONSTRAINT unique_symbol_interval_timestamp UNIQUE(symbol_id, interval, timestamp),
    
    -- Data integrity constraints
    CONSTRAINT check_ohlc_positive CHECK (open > 0 AND high > 0 AND low > 0 AND close > 0),
    CONSTRAINT check_high_low CHECK (high >= low),
    CONSTRAINT check_ohlc_range CHECK (high >= open AND high >= close AND low <= open AND low <= close)
);

-- Optimized indexes for time-series queries
CREATE INDEX idx_ohlc_symbol_interval_timestamp ON ohlc_data(symbol_id, interval, timestamp DESC);
CREATE INDEX idx_ohlc_timestamp ON ohlc_data(timestamp DESC);
CREATE INDEX idx_ohlc_symbol_interval ON ohlc_data(symbol_id, interval);

-- Partition by timestamp for better performance (optional, for large datasets)
-- This can be enabled later when data volume grows significantly

-- Data freshness tracking
CREATE TABLE data_freshness (
    id SERIAL PRIMARY KEY,
    symbol_id INTEGER NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    interval VARCHAR(20) NOT NULL,
    last_fetched TIMESTAMP WITH TIME ZONE NOT NULL,
    last_successful_fetch TIMESTAMP WITH TIME ZONE,
    fetch_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    metadata JSONB,  -- For additional tracking info
    
    CONSTRAINT unique_symbol_interval_freshness UNIQUE(symbol_id, interval)
);

-- Index for freshness queries
CREATE INDEX idx_freshness_symbol_interval ON data_freshness(symbol_id, interval);

-- Create a view for easy symbol+data queries
CREATE VIEW symbol_ohlc_view AS
SELECT 
    s.symbol,
    s.name,
    s.exchange,
    o.interval,
    o.timestamp,
    o.open,
    o.high,
    o.low,
    o.close,
    o.volume
FROM symbols s
JOIN ohlc_data o ON s.id = o.symbol_id;

-- Function to get data age in minutes
CREATE OR REPLACE FUNCTION get_data_age_minutes(symbol_name VARCHAR, data_interval VARCHAR)
RETURNS TABLE(
    age_minutes NUMERIC,
    last_successful_fetch TIMESTAMP WITH TIME ZONE,
    data_points BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(EPOCH FROM (NOW() - df.last_successful_fetch)) / 60 as age_minutes,
        df.last_successful_fetch,
        COUNT(o.id) as data_points
    FROM symbols s
    LEFT JOIN data_freshness df ON s.id = df.symbol_id AND df.interval = data_interval
    LEFT JOIN ohlc_data o ON s.id = o.symbol_id AND o.interval = data_interval
    WHERE s.symbol = symbol_name
    GROUP BY s.id, df.last_successful_fetch;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old data (useful for development)
CREATE OR REPLACE FUNCTION clean_symbol_data(symbol_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    symbol_id_val INTEGER;
BEGIN
    -- Get symbol ID
    SELECT id INTO symbol_id_val FROM symbols WHERE symbol = symbol_name;
    
    IF symbol_id_val IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Delete OHLC data
    DELETE FROM ohlc_data WHERE symbol_id = symbol_id_val;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete freshness data
    DELETE FROM data_freshness WHERE symbol_id = symbol_id_val;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert some basic configuration data
INSERT INTO symbols (symbol, name, exchange, type) VALUES 
('SNOW', 'Snowflake Inc.', 'NYSE', 'Stock')
ON CONFLICT (symbol) DO NOTHING;

-- Grant permissions (useful for production deployment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chartuser;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chartuser;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO chartuser;

COMMIT;