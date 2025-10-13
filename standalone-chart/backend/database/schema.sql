-- Chart data caching database schema

-- Symbols table
CREATE TABLE IF NOT EXISTS symbols (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT,
  exchange TEXT,
  type TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OHLC data table
CREATE TABLE IF NOT EXISTS ohlc_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol_id INTEGER NOT NULL,
  interval TEXT NOT NULL, -- '1min', '5min', '1day', '1week', '1month'
  timestamp DATETIME NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (symbol_id) REFERENCES symbols(id),
  UNIQUE(symbol_id, interval, timestamp)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ohlc_symbol_interval ON ohlc_data(symbol_id, interval);
CREATE INDEX IF NOT EXISTS idx_ohlc_timestamp ON ohlc_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_symbols_symbol ON symbols(symbol);

-- Data freshness tracking
CREATE TABLE IF NOT EXISTS data_freshness (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol_id INTEGER NOT NULL,
  interval TEXT NOT NULL,
  last_fetched DATETIME NOT NULL,
  last_successful_fetch DATETIME,
  fetch_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  FOREIGN KEY (symbol_id) REFERENCES symbols(id),
  UNIQUE(symbol_id, interval)
);

-- Popular symbols to cache (seed data)
INSERT OR IGNORE INTO symbols (symbol, name, exchange, type) VALUES
  ('AAPL', 'Apple Inc.', 'NASDAQ', 'Stock'),
  ('GOOGL', 'Alphabet Inc.', 'NASDAQ', 'Stock'),
  ('MSFT', 'Microsoft Corporation', 'NASDAQ', 'Stock'),
  ('AMZN', 'Amazon.com Inc.', 'NASDAQ', 'Stock'),
  ('TSLA', 'Tesla Inc.', 'NASDAQ', 'Stock'),
  ('META', 'Meta Platforms Inc.', 'NASDAQ', 'Stock'),
  ('NVDA', 'NVIDIA Corporation', 'NASDAQ', 'Stock'),
  ('IBM', 'International Business Machines', 'NYSE', 'Stock'),
  ('SNOW', 'Snowflake Inc.', 'NYSE', 'Stock'),
  ('WDAY', 'Workday Inc.', 'NASDAQ', 'Stock');