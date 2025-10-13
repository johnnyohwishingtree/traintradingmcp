const { Pool } = require('pg');
const path = require('path');

class PostgresDatabase {
  constructor(config = null) {
    // Default configuration for local development
    const defaultConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'chart_data',
      user: process.env.DB_USER || 'chartuser',
      password: process.env.DB_PASSWORD || 'chartpass123',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
    
    this.config = config || defaultConfig;
    this.pool = new Pool(this.config);
    
    // Handle connection errors
    this.pool.on('error', (err) => {
      console.error('❌ PostgreSQL pool error:', err);
    });
    
    this.pool.on('connect', () => {
      console.log('✅ Connected to PostgreSQL database');
    });
    
    // Test connection on startup
    this.testConnection();
  }
  
  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      console.log('🔌 PostgreSQL connection test successful:', result.rows[0].current_time);
      client.release();
    } catch (err) {
      console.error('❌ PostgreSQL connection test failed:', err.message);
      console.log('💡 Make sure PostgreSQL is running: docker-compose up -d');
    }
  }

  // Helper to identify timestamps from the same period
  getCurrentPeriodTimestamps(data, interval) {
    if (!data || data.length === 0) return [];
    
    // Get the last (most recent) data point
    const lastDate = new Date(data[data.length - 1].timestamp);
    const currentYear = lastDate.getFullYear();
    const currentMonth = lastDate.getMonth();
    
    if (interval === '1month') {
      // Find all timestamps in the same month as the last one
      return data
        .filter(item => {
          const date = new Date(item.timestamp);
          return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
        })
        .map(item => item.timestamp)
        .sort();
    } else if (interval === '1week') {
      // Find all timestamps in the same week as the last one
      const weekStart = new Date(lastDate);
      weekStart.setDate(lastDate.getDate() - lastDate.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
      
      return data
        .filter(item => {
          const date = new Date(item.timestamp);
          return date >= weekStart && date <= weekEnd;
        })
        .map(item => item.timestamp)
        .sort();
    }
    
    return [];
  }

  // Get or create symbol
  async getOrCreateSymbol(symbol, name = null, exchange = null, type = 'Stock') {
    const client = await this.pool.connect();
    try {
      // First try to get existing symbol
      let result = await client.query(
        'SELECT * FROM symbols WHERE symbol = $1',
        [symbol]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      // Create new symbol
      result = await client.query(
        'INSERT INTO symbols (symbol, name, exchange, type) VALUES ($1, $2, $3, $4) RETURNING *',
        [symbol, name, exchange, type]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Helper method to remove duplicates from incoming data
  removeDuplicatesFromData(data, interval = '1day') {
    const seen = new Set();
    return data.filter(item => {
      // For daily data, use date only (ignore time) to detect duplicates
      // For weekly data, use week number to detect duplicates
      // For intraday data, use full timestamp
      let key;
      if (interval === '1day' || interval === '1month') {
        // Extract just the date part for daily/monthly data
        const date = new Date(item.timestamp);
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      } else if (interval === '1week') {
        // For weekly data, use year and week number
        const date = new Date(item.timestamp);
        const yearStart = new Date(date.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((date - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${weekNumber}`;
      } else {
        // Use full timestamp for intraday data
        key = item.timestamp;
      }
      
      if (seen.has(key)) {
        console.log(`🔧 Removing duplicate ${interval} entry for ${key} (timestamp: ${item.timestamp})`);
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Helper method to validate OHLC data
  validateOHLCData(item) {
    if (!item || typeof item !== 'object') return false;
    if (!item.timestamp) return false;
    if (typeof item.open !== 'number' || !isFinite(item.open)) return false;
    if (typeof item.high !== 'number' || !isFinite(item.high)) return false;
    if (typeof item.low !== 'number' || !isFinite(item.low)) return false;
    if (typeof item.close !== 'number' || !isFinite(item.close)) return false;
    if (item.high < item.low) return false; // High must be >= Low
    if (item.open < 0 || item.high < 0 || item.low < 0 || item.close < 0) return false; // No negative prices
    return true;
  }

  // Insert OHLC data with smart duplicate handling
  async insertOHLCData(symbolId, interval, data) {
    if (!data || data.length === 0) {
      return { inserted: 0, errors: 0, skipped: 0 };
    }

    console.log(`📊 Inserting ${data.length} data points for symbol_id=${symbolId}, interval=${interval}`);
    
    // Pre-process data to remove duplicates within the incoming dataset
    const uniqueData = this.removeDuplicatesFromData(data, interval);
    if (uniqueData.length !== data.length) {
      console.log(`🔧 Filtered ${data.length - uniqueData.length} duplicate ${interval} entries from incoming data`);
    }
    
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // For monthly/weekly data, handle current period updates specially
      if ((interval === '1month' || interval === '1week') && uniqueData.length > 0) {
        const lastDataPoint = uniqueData[uniqueData.length - 1];
        const lastDate = new Date(lastDataPoint.timestamp);
        
        if (interval === '1month') {
          // Delete current month data to avoid partial month conflicts
          const monthStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
          const monthEnd = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
          
          console.log(`🗑️ Clearing existing monthly data for ${monthStart.toISOString().split('T')[0]} to ${monthEnd.toISOString().split('T')[0]}`);
          
          const deleteResult = await client.query(
            `DELETE FROM ohlc_data 
             WHERE symbol_id = $1 AND interval = $2 
             AND timestamp >= $3 AND timestamp <= $4`,
            [symbolId, interval, monthStart.toISOString(), monthEnd.toISOString()]
          );
          
          console.log(`🗑️ Deleted ${deleteResult.rowCount} existing monthly records`);
          
        } else if (interval === '1week') {
          // For weekly data, delete all existing weekly records to avoid any duplicates
          console.log(`🗑️ Clearing all existing weekly data to avoid timestamp conflicts`);
          
          const deleteResult = await client.query(
            `DELETE FROM ohlc_data WHERE symbol_id = $1 AND interval = $2`,
            [symbolId, interval]
          );
          
          console.log(`🗑️ Deleted ${deleteResult.rowCount} existing weekly records`);
        }
      }
      
      // Bulk insert using COPY for better performance
      let inserted = 0;
      let errors = 0;
      
      for (const item of uniqueData) {
        // Validate data before insertion
        if (!this.validateOHLCData(item)) {
          errors++;
          console.error(`❌ Invalid OHLC data:`, item);
          continue;
        }
        
        try {
          await client.query(
            `INSERT INTO ohlc_data 
             (symbol_id, interval, timestamp, open, high, low, close, volume) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (symbol_id, interval, timestamp) 
             DO UPDATE SET 
               open = EXCLUDED.open,
               high = EXCLUDED.high,
               low = EXCLUDED.low,
               close = EXCLUDED.close,
               volume = EXCLUDED.volume`,
            [
              symbolId,
              interval,
              item.timestamp,
              item.open,
              item.high,
              item.low,
              item.close,
              item.volume || 0
            ]
          );
          inserted++;
        } catch (err) {
          errors++;
          console.error(`❌ Insert error for ${item.timestamp}:`, err.message);
        }
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ Batch insert complete: ${inserted} processed, ${errors} errors`);
      return { 
        inserted,
        errors
      };
      
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction failed:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  // Get OHLC data
  async getOHLCData(symbol, interval, limit = 1000) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT o.timestamp, o.open, o.high, o.low, o.close, o.volume
        FROM ohlc_data o
        JOIN symbols s ON o.symbol_id = s.id
        WHERE s.symbol = $1 AND o.interval = $2
        ORDER BY o.timestamp DESC
        LIMIT $3
      `, [symbol, interval, limit]);
      
      // Reverse to get chronological order (oldest first)
      const data = result.rows.reverse().map(row => ({
        date: new Date(row.timestamp),
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close),
        volume: parseInt(row.volume)
      }));
      
      return data;
    } finally {
      client.release();
    }
  }

  // Update data freshness tracking
  async updateDataFreshness(symbolId, interval, success = true, error = null) {
    const client = await this.pool.connect();
    try {
      const now = new Date().toISOString();
      
      await client.query(`
        INSERT INTO data_freshness 
        (symbol_id, interval, last_fetched, last_successful_fetch, fetch_count, error_count, last_error)
        VALUES ($1, $2, $3, $4, 1, $5, $6)
        ON CONFLICT (symbol_id, interval) 
        DO UPDATE SET 
          last_fetched = $3,
          last_successful_fetch = CASE WHEN $7 THEN $4 ELSE data_freshness.last_successful_fetch END,
          fetch_count = data_freshness.fetch_count + 1,
          error_count = data_freshness.error_count + $5,
          last_error = $6
      `, [
        symbolId, 
        interval, 
        now,
        success ? now : null,
        success ? 0 : 1,
        error,
        success
      ]);
    } finally {
      client.release();
    }
  }

  // Get data age (minutes since last update)
  async getDataAge(symbol, interval) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM get_data_age_minutes($1, $2)
      `, [symbol, interval]);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Get all symbols
  async getAllSymbols() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM symbols ORDER BY symbol');
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Delete all data for a symbol
  async deleteSymbolData(symbol) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT clean_symbol_data($1) as deleted_rows', [symbol]);
      const deletedRows = result.rows[0].deleted_rows;
      
      return {
        deletedRows,
        message: `Deleted ${deletedRows} data rows for ${symbol}`
      };
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
    console.log('📊 PostgreSQL connection pool closed');
  }
}

module.exports = PostgresDatabase;