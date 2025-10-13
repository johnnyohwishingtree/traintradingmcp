const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '..', 'database', 'chart_data.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection error:', err);
      } else {
        console.log('✅ Connected to chart data database');
      }
    });
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
    return new Promise((resolve, reject) => {
      // First try to get existing symbol
      this.db.get(
        'SELECT * FROM symbols WHERE symbol = ?',
        [symbol],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            resolve(row);
            return;
          }
          
          // Create new symbol
          const dbRef = this.db;
          this.db.run(
            'INSERT INTO symbols (symbol, name, exchange, type) VALUES (?, ?, ?, ?)',
            [symbol, name, exchange, type],
            function(err) {
              if (err) {
                reject(err);
                return;
              }
              
              // Get the created symbol
              dbRef.get(
                'SELECT * FROM symbols WHERE id = ?',
                [this.lastID],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                }
              );
            }
          );
        }
      );
    });
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
    return new Promise(async (resolve, reject) => {
      if (!data || data.length === 0) {
        resolve({ inserted: 0, errors: 0, skipped: 0 });
        return;
      }

      console.log(`📊 Inserting ${data.length} data points for symbol_id=${symbolId}, interval=${interval}`);
      
      // Pre-process data to remove duplicates within the incoming dataset
      const uniqueData = this.removeDuplicatesFromData(data, interval);
      if (uniqueData.length !== data.length) {
        console.log(`🔧 Filtered ${data.length - uniqueData.length} duplicate ${interval} entries from incoming data`);
      }
      
      // For monthly/weekly data, handle current period updates specially
      if ((interval === '1month' || interval === '1week') && uniqueData.length > 0) {
        const lastDataPoint = uniqueData[uniqueData.length - 1];
        const lastDate = new Date(lastDataPoint.timestamp);
        
        if (interval === '1month') {
          // Delete current month data to avoid partial month conflicts
          const monthStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
          const monthEnd = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
          
          console.log(`🗑️ Clearing existing monthly data for ${monthStart.toISOString().split('T')[0]} to ${monthEnd.toISOString().split('T')[0]}`);
          
          await new Promise((res, rej) => {
            this.db.run(
              `DELETE FROM ohlc_data 
               WHERE symbol_id = ? AND interval = ? 
               AND date(timestamp) >= date(?) AND date(timestamp) <= date(?)`,
              [symbolId, interval, monthStart.toISOString(), monthEnd.toISOString()],
              function(err) {
                if (err) rej(err);
                else {
                  console.log(`🗑️ Deleted ${this.changes} existing monthly records`);
                  res();
                }
              }
            );
          });
          
        } else if (interval === '1week') {
          // For weekly data, delete all existing weekly records to avoid any duplicates
          // since we're normalizing all timestamps to Monday of each week
          console.log(`🗑️ Clearing all existing weekly data to avoid timestamp conflicts`);
          
          await new Promise((res, rej) => {
            this.db.run(
              `DELETE FROM ohlc_data 
               WHERE symbol_id = ? AND interval = ?`,
              [symbolId, interval],
              function(err) {
                if (err) rej(err);
                else {
                  console.log(`🗑️ Deleted ${this.changes} existing weekly records`);
                  res();
                }
              }
            );
          });
        }
      }
      
      // Final data to insert
      data = uniqueData;
      
      // Use batch insert with transaction for better performance and consistency
      const dbRef = this.db;
      
      dbRef.serialize(() => {
        dbRef.run("BEGIN TRANSACTION");
        
        const stmt = dbRef.prepare(`
          INSERT OR REPLACE INTO ohlc_data 
          (symbol_id, interval, timestamp, open, high, low, close, volume) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        let inserted = 0;
        let replaced = 0;
        let errors = 0;
        
        data.forEach((item, index) => {
          // Validate data before insertion
          if (!this.validateOHLCData(item)) {
            errors++;
            console.error(`❌ Invalid OHLC data at index ${index}:`, item);
            return;
          }
          
          stmt.run([
            symbolId,
            interval,
            item.timestamp,
            item.open,
            item.high,
            item.low,
            item.close,
            item.volume || 0
          ], function(err) {
            if (err) {
              errors++;
              console.error(`❌ Insert error for ${item.timestamp}:`, err.message);
            } else {
              if (this.changes > 0) {
                // SQLite doesn't provide reliable lastID for REPLACE, so count all as inserted
                inserted++;
              }
            }
            
            // Check if all operations completed
            if (inserted + errors === data.length) {
              stmt.finalize((finalizeErr) => {
                if (finalizeErr) {
                  console.error('❌ Statement finalize error:', finalizeErr);
                  dbRef.run("ROLLBACK");
                  reject(finalizeErr);
                  return;
                }
                
                dbRef.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    console.error('❌ Transaction commit error:', commitErr);
                    reject(commitErr);
                    return;
                  }
                  
                  console.log(`✅ Batch insert complete: ${inserted} processed, ${errors} errors`);
                  resolve({ 
                    inserted: inserted, // Total successful operations
                    errors
                  });
                });
              });
            }
          });
        });
      });
    });
  }

  // Get OHLC data
  async getOHLCData(symbol, interval, limit = 1000) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT o.timestamp, o.open, o.high, o.low, o.close, o.volume
        FROM ohlc_data o
        JOIN symbols s ON o.symbol_id = s.id
        WHERE s.symbol = ? AND o.interval = ?
        ORDER BY o.timestamp DESC
        LIMIT ?
      `;
      
      this.db.all(query, [symbol, interval, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Reverse to get chronological order (oldest first)
          const data = rows.reverse().map(row => ({
            date: new Date(row.timestamp),
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume
          }));
          resolve(data);
        }
      });
    });
  }

  // Update data freshness tracking
  async updateDataFreshness(symbolId, interval, success = true, error = null) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      this.db.run(`
        INSERT OR REPLACE INTO data_freshness 
        (symbol_id, interval, last_fetched, last_successful_fetch, fetch_count, error_count, last_error)
        VALUES (
          ?, ?, ?, 
          CASE WHEN ? THEN ? ELSE COALESCE((SELECT last_successful_fetch FROM data_freshness WHERE symbol_id = ? AND interval = ?), ?) END,
          COALESCE((SELECT fetch_count FROM data_freshness WHERE symbol_id = ? AND interval = ?), 0) + 1,
          COALESCE((SELECT error_count FROM data_freshness WHERE symbol_id = ? AND interval = ?), 0) + CASE WHEN ? THEN 0 ELSE 1 END,
          ?
        )
      `, [
        symbolId, interval, now,
        success, success ? now : null, symbolId, interval, now,
        symbolId, interval,
        symbolId, interval, success,
        error
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Get data age (minutes since last update)
  async getDataAge(symbol, interval) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          (julianday('now') - julianday(df.last_successful_fetch)) * 24 * 60 as age_minutes,
          df.last_successful_fetch,
          COUNT(o.id) as data_points
        FROM symbols s
        LEFT JOIN data_freshness df ON s.id = df.symbol_id AND df.interval = ?
        LEFT JOIN ohlc_data o ON s.id = o.symbol_id AND o.interval = ?
        WHERE s.symbol = ?
        GROUP BY s.id, df.last_successful_fetch
      `;
      
      this.db.get(query, [interval, interval, symbol], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Get all symbols
  async getAllSymbols() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM symbols ORDER BY symbol', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Delete all data for a symbol
  async deleteSymbolData(symbol) {
    return new Promise((resolve, reject) => {
      const dbRef = this.db;
      
      // First get the symbol ID
      dbRef.get('SELECT id FROM symbols WHERE symbol = ?', [symbol], (err, symbolRow) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!symbolRow) {
          resolve({ deletedRows: 0, message: `Symbol ${symbol} not found in database` });
          return;
        }
        
        // Delete all OHLC data for this symbol
        dbRef.run(
          'DELETE FROM ohlc_data WHERE symbol_id = ?',
          [symbolRow.id],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            
            const deletedRows = this.changes;
            
            // Also delete freshness tracking
            dbRef.run(
              'DELETE FROM data_freshness WHERE symbol_id = ?',
              [symbolRow.id],
              (err) => {
                if (err) {
                  console.warn('Warning: Failed to delete freshness tracking:', err);
                }
                
                resolve({
                  deletedRows,
                  symbolId: symbolRow.id,
                  message: `Deleted ${deletedRows} data rows for ${symbol}`
                });
              }
            );
          }
        );
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('📊 Database connection closed');
        }
        resolve();
      });
    });
  }
}

module.exports = Database;