const axios = require('axios');
const DatabaseFactory = require('./services/database-factory');

class YahooFinanceIncremental {
  constructor(database = null) {
    // Accept injected database or create PostgreSQL instance
    this.db = database || DatabaseFactory.create('postgres');
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    
    // Interval mapping
    this.intervals = {
      '1min': '1m',
      '5min': '5m',
      '15min': '15m',
      '30min': '30m',
      '60min': '1h',
      '1day': '1d',
      '1week': '1wk',
      '1month': '1mo'
    };
  }

  /**
   * Get the last timestamp for a symbol/interval from the database
   */
  async getLastDatapoint(symbol, interval) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT MAX(timestamp) as last_timestamp
        FROM ohlc_data o
        JOIN symbols s ON o.symbol_id = s.id
        WHERE s.symbol = ? AND o.interval = ?
      `;
      
      this.db.db.get(query, [symbol, interval], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row?.last_timestamp ? new Date(row.last_timestamp) : null);
        }
      });
    });
  }

  /**
   * Fetch data from Yahoo Finance with optional start date
   */
  async fetchYahooData(symbol, interval = '1day', startDate = null, endDate = null) {
    console.log(`📥 Fetching ${symbol}@${interval} from Yahoo Finance...`);
    
    try {
      const yahooInterval = this.intervals[interval] || '1d';
      
      // Calculate period timestamps
      let period1, period2;
      
      // Determine if this is an intraday interval
      const isIntraday = ['1min', '5min', '15min', '30min', '60min'].includes(interval);
      
      if (startDate) {
        // Start from specific date (for incremental updates)
        period1 = Math.floor(new Date(startDate).getTime() / 1000);
      } else {
        // Default date range based on interval type
        const now = Date.now();
        if (isIntraday) {
          // Different limits for different intraday intervals
          if (interval === '60min') {
            // 1h data: up to 729 days (within last 730 days)
            period1 = Math.floor((now - (729 * 24 * 60 * 60 * 1000)) / 1000);
          } else {
            // 5m, 15m, 30m data: up to 59 days (within last 60 days)
            period1 = Math.floor((now - (59 * 24 * 60 * 60 * 1000)) / 1000);
          }
        } else {
          // For daily/weekly/monthly, fetch last 2 years
          period1 = Math.floor((now - (2 * 365 * 24 * 60 * 60 * 1000)) / 1000);
        }
      }
      
      if (endDate) {
        period2 = Math.floor(new Date(endDate).getTime() / 1000);
      } else {
        period2 = Math.floor(Date.now() / 1000);
      }
      
      console.log(`   📅 Period: ${new Date(period1 * 1000).toISOString().split('T')[0]} to ${new Date(period2 * 1000).toISOString().split('T')[0]}`);
      
      const response = await axios.get(`${this.baseUrl}/${symbol}`, {
        params: {
          period1,
          period2,
          interval: yahooInterval,
          includePrePost: 'false',
          events: 'div,split' // Include dividends and splits
        },
        timeout: 10000
      });
      
      const chartData = response.data.chart?.result?.[0];
      if (!chartData) {
        throw new Error('No chart data in response');
      }
      
      const timestamps = chartData.timestamp || [];
      const quotes = chartData.indicators?.quote?.[0] || {};
      
      // Convert to OHLC format
      const ohlcData = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (quotes.open?.[i] && quotes.high?.[i] && quotes.low?.[i] && quotes.close?.[i]) {
          const timestamp = new Date(timestamps[i] * 1000);
          
          // Handle timestamp positioning based on interval
          let formattedTimestamp;
          
          if (interval === '1week') {
            // Position weekly candles at the start of the trading week (Monday)
            // Yahoo returns various timestamps, so we normalize to the Monday of that week
            const weekDate = new Date(timestamp);
            const dayOfWeek = weekDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
            
            // BREAKPOINT: Check original timestamp and day of week
            debugger; // Breakpoint 1: Examine original timestamp
            
            // Calculate days to adjust to get to Monday (day 1)
            let daysToMonday;
            if (dayOfWeek === 0) { // Sunday
              daysToMonday = -1; // Go forward to next Monday (starts trading week)
            } else {
              daysToMonday = dayOfWeek - 1; // Go back to Monday of same week
            }
            
            weekDate.setDate(weekDate.getDate() - daysToMonday);
            weekDate.setHours(9, 30, 0, 0); // Set to market open time
            formattedTimestamp = weekDate.toISOString();
            
            // BREAKPOINT: Check normalized timestamp
            debugger; // Breakpoint 2: Examine normalized timestamp
          } else if (interval === '1month') {
            // Yahoo Finance returns monthly data with end-of-month timestamps
            // The data represents that month, just normalize to first trading day
            const monthDate = new Date(timestamp);
            
            // Set to first day of the same month
            monthDate.setDate(1);
            monthDate.setHours(9, 30, 0, 0); // Set to market open time
            
            // Find the first trading day (skip weekends)
            let dayOfWeek = monthDate.getDay();
            while (dayOfWeek === 0 || dayOfWeek === 6) { // Skip Sunday (0) and Saturday (6)
              monthDate.setDate(monthDate.getDate() + 1);
              dayOfWeek = monthDate.getDay();
            }
            
            formattedTimestamp = monthDate.toISOString();
          } else if (interval === '1day') {
            // Normalize daily timestamps to 9:30 AM to prevent duplicates
            // Yahoo may return different times for the same trading day
            const dailyDate = new Date(timestamp);
            dailyDate.setHours(9, 30, 0, 0); // Set to market open time
            formattedTimestamp = dailyDate.toISOString();
          } else {
            // For intraday intervals - keep exact timestamp
            formattedTimestamp = timestamp.toISOString();
          }
          
          // BREAKPOINT: Check what timestamp is being pushed to ohlcData
          if (interval === '1week') {
            debugger; // Breakpoint 3: Examine timestamp before pushing to array
          }
          
          ohlcData.push({
            timestamp: formattedTimestamp,
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume?.[i] || 0
          });
        }
      }
      
      console.log(`   ✅ Retrieved ${ohlcData.length} data points`);
      return ohlcData;
      
    } catch (error) {
      console.error(`   ❌ Failed to fetch ${symbol}@${interval}:`, error.message);
      if (error.response) {
        console.error(`   📤 Request URL: ${error.config?.url}`);
        console.error(`   📤 Request params:`, error.config?.params);
        console.error(`   📥 Response status: ${error.response.status}`);
        console.error(`   📥 Response data:`, error.response.data);
      }
      throw error;
    }
  }

  /**
   * Fix monthly data by aggregating from daily data for better accuracy
   * Yahoo Finance's monthly API is sometimes inconsistent, so we create our own from daily data
   */
  async fixMonthlyDataFromDaily(symbol) {
    console.log(`🔧 Fixing monthly data for ${symbol} using daily aggregation`);
    
    try {
      // Get ALL daily data from the database to generate complete monthly history
      console.log(`   📊 Loading all daily data from database for ${symbol}...`);
      const dailyData = await this.db.getOHLCData(symbol, '1day', 99999); // Get all daily data
      
      console.log(`   ✅ Loaded ${dailyData.length} daily data points for aggregation`);
      
      if (dailyData.length === 0) {
        console.log('   ⚠️ No daily data available for monthly aggregation');
        return;
      }
      
      // Group daily data by month and aggregate
      const monthlyCandles = {};
      
      dailyData.forEach(candle => {
        const date = new Date(candle.date); // Database uses 'date' field, not 'timestamp'
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyCandles[monthKey]) {
          monthlyCandles[monthKey] = {
            year: date.getFullYear(),
            month: date.getMonth(),
            candles: []
          };
        }
        
        monthlyCandles[monthKey].candles.push(candle);
      });
      
      // Create aggregated monthly candles
      const aggregatedMonths = [];
      
      Object.keys(monthlyCandles).sort().forEach(monthKey => {
        const monthData = monthlyCandles[monthKey];
        const candles = monthData.candles;
        
        if (candles.length === 0) return;
        
        // Create first trading day timestamp for this month
        const firstTradingDay = new Date(monthData.year, monthData.month, 1);
        firstTradingDay.setHours(9, 30, 0, 0);
        
        // Find first weekday
        let dayOfWeek = firstTradingDay.getDay();
        while (dayOfWeek === 0 || dayOfWeek === 6) {
          firstTradingDay.setDate(firstTradingDay.getDate() + 1);
          dayOfWeek = firstTradingDay.getDay();
        }
        
        const monthlyCandle = {
          timestamp: firstTradingDay.toISOString(),
          open: candles[0].open,
          high: Math.max(...candles.map(c => c.high)),
          low: Math.min(...candles.map(c => c.low)),
          close: candles[candles.length - 1].close,
          volume: candles.reduce((sum, c) => sum + c.volume, 0)
        };
        
        aggregatedMonths.push(monthlyCandle);
        console.log(`   📊 ${monthKey}: O=${monthlyCandle.open.toFixed(2)}, H=${monthlyCandle.high.toFixed(2)}, L=${monthlyCandle.low.toFixed(2)}, C=${monthlyCandle.close.toFixed(2)} (${candles.length} days)`);
      });
      
      if (aggregatedMonths.length === 0) {
        console.log('   ⚠️ No monthly aggregations created');
        return;
      }
      
      // Get symbol record
      const symbolRecord = await this.db.getOrCreateSymbol(symbol);
      
      // Delete existing monthly data for the last 12 months
      console.log(`   🗑️ Clearing existing monthly data for aggregation...`);
      const deleteStartDate = new Date();
      deleteStartDate.setMonth(deleteStartDate.getMonth() - 12);
      deleteStartDate.setDate(1);
      
      // Use database-agnostic deletion (PostgreSQL or SQLite)
      if (this.db.pool) {
        // PostgreSQL
        const client = await this.db.pool.connect();
        try {
          const result = await client.query(
            `DELETE FROM ohlc_data 
             WHERE symbol_id = $1 AND interval = '1month' 
             AND timestamp >= $2`,
            [symbolRecord.id, deleteStartDate.toISOString()]
          );
          console.log(`   🗑️ Deleted ${result.rowCount} existing monthly records`);
        } finally {
          client.release();
        }
      } else if (this.db.db) {
        // SQLite
        await new Promise((resolve, reject) => {
          this.db.db.run(
            `DELETE FROM ohlc_data 
             WHERE symbol_id = ? AND interval = '1month' 
             AND date(timestamp) >= date(?)`,
            [symbolRecord.id, deleteStartDate.toISOString()],
            function(err) {
              if (err) reject(err);
              else {
                console.log(`   🗑️ Deleted ${this.changes} existing monthly records`);
                resolve();
              }
            }
          );
        });
      }
      
      // Insert corrected monthly data
      await this.db.insertOHLCData(symbolRecord.id, '1month', aggregatedMonths);
      
      console.log(`   ✅ Fixed ${aggregatedMonths.length} months using daily aggregation`);
      
    } catch (error) {
      console.error(`   ❌ Failed to fix monthly data for ${symbol}:`, error.message);
    }
  }

  /**
   * Fix current month data by aggregating from daily data
   * Yahoo Finance's monthly API sometimes provides incomplete current month data
   */
  async fixCurrentMonthData(symbol) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    console.log(`🔧 Fixing current month data for ${symbol} (${currentYear}-${currentMonth + 1})`);
    
    try {
      // Fetch daily data for current month
      const monthStart = new Date(currentYear, currentMonth, 1);
      const dailyData = await this.fetchYahooData(symbol, '1day', monthStart);
      
      if (dailyData.length === 0) {
        console.log('   ⚠️ No daily data available for current month');
        return;
      }
      
      // Aggregate daily data into monthly candle
      const monthlyCandle = {
        timestamp: new Date(currentYear, currentMonth, 1).toISOString(),
        open: dailyData[0].open,
        high: Math.max(...dailyData.map(d => d.high)),
        low: Math.min(...dailyData.map(d => d.low)),
        close: dailyData[dailyData.length - 1].close,
        volume: dailyData.reduce((sum, d) => sum + d.volume, 0)
      };
      
      console.log(`   🔧 Aggregated ${dailyData.length} daily bars into monthly candle`);
      console.log(`   📊 Monthly: Open $${monthlyCandle.open.toFixed(2)}, High $${monthlyCandle.high.toFixed(2)}, Low $${monthlyCandle.low.toFixed(2)}, Close $${monthlyCandle.close.toFixed(2)}`);
      
      // Update the monthly data in database
      const symbolRecord = await this.db.getOrCreateSymbol(symbol);
      
      // Delete existing current month data
      await new Promise((resolve, reject) => {
        this.db.db.run(
          `DELETE FROM ohlc_data 
           WHERE symbol_id = ? AND interval = '1month' 
           AND date(timestamp) >= date(?) AND date(timestamp) < date(?)`,
          [symbolRecord.id, monthStart.toISOString(), new Date(currentYear, currentMonth + 1, 1).toISOString()],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      // Insert corrected monthly data
      await this.db.insertOHLCData(symbolRecord.id, '1month', [monthlyCandle]);
      
      console.log(`   ✅ Fixed current month data for ${symbol}`);
      
    } catch (error) {
      console.error(`   ❌ Failed to fix current month data for ${symbol}:`, error.message);
    }
  }

  /**
   * Fetch all available historical data for a symbol/interval
   */
  async fetchAllHistoricalData(symbol, interval = '1day') {
    console.log(`\\n📊 Fetching ALL historical data for ${symbol}@${interval}`);
    
    // Determine maximum period based on interval
    let startDate;
    const now = new Date();
    
    if (interval.includes('min')) {
      // Different limits for different intraday intervals
      if (interval === '60min') {
        // 1h data: up to 729 days (within last 730 days)
        startDate = new Date(now.getTime() - (729 * 24 * 60 * 60 * 1000));
      } else {
        // 5m, 15m, 30m data: up to 59 days (within last 60 days)
        startDate = new Date(now.getTime() - (59 * 24 * 60 * 60 * 1000));
      }
    } else if (interval === '1day') {
      // Daily: Get maximum available (up to 50 years)
      startDate = new Date('1970-01-01');
    } else if (interval === '1week') {
      // Weekly: Get maximum available
      startDate = new Date('1970-01-01');
    } else if (interval === '1month') {
      // Monthly: Get maximum available
      startDate = new Date('1970-01-01');
    }
    
    return await this.fetchYahooData(symbol, interval, startDate, now);
  }

  /**
   * Incrementally update data for a symbol/interval
   * Only fetches new data since last stored datapoint
   */
  async updateSymbolData(symbol, interval = '1day', forceFullRefresh = false) {
    console.log(`\\n🔄 Updating ${symbol}@${interval}...`);
    
    try {
      // Get or create symbol record
      const symbolRecord = await this.db.getOrCreateSymbol(symbol, `${symbol} Inc.`, 'NASDAQ', 'Stock');
      
      let data;
      
      if (forceFullRefresh) {
        console.log('   🔄 Force refresh - fetching all historical data');
        data = await this.fetchAllHistoricalData(symbol, interval);
      } else {
        // Check last datapoint in database
        const lastDatapoint = await this.getLastDatapoint(symbol, interval);
        
        if (lastDatapoint) {
          console.log(`   📅 Last data in DB: ${lastDatapoint.toISOString().split('T')[0]}`);
          
          // Add 1 day to avoid duplicate
          const startDate = new Date(lastDatapoint.getTime() + (24 * 60 * 60 * 1000));
          
          // Check if we need to update
          const daysSinceLastUpdate = Math.floor((Date.now() - lastDatapoint.getTime()) / (24 * 60 * 60 * 1000));
          
          if (daysSinceLastUpdate < 1 && interval === '1day') {
            console.log(`   ✅ Data is up to date (last update: ${lastDatapoint.toISOString().split('T')[0]})`);
            return { symbol, interval, status: 'up_to_date', newPoints: 0 };
          }
          
          console.log(`   📈 Fetching new data from ${startDate.toISOString().split('T')[0]}`);
          data = await this.fetchYahooData(symbol, interval, startDate);
        } else {
          console.log('   📊 No existing data - fetching all historical data');
          data = await this.fetchAllHistoricalData(symbol, interval);
        }
      }
      
      if (data.length > 0) {
        // Store the new data
        const result = await this.db.insertOHLCData(symbolRecord.id, interval, data);
        
        // Update freshness tracking
        await this.db.updateDataFreshness(symbolRecord.id, interval, true, null);
        
        console.log(`   💾 Stored ${result.inserted} new data points`);
        
        // Fix monthly data using daily aggregation for better accuracy
        if (interval === '1month') {
          await this.fixMonthlyDataFromDaily(symbol);
        }
        
        return {
          symbol,
          interval,
          status: 'updated',
          newPoints: result.inserted,
          errors: result.errors
        };
      } else {
        console.log('   ✅ No new data to update');
        return { symbol, interval, status: 'no_new_data', newPoints: 0 };
      }
      
    } catch (error) {
      console.error(`   ❌ Update failed for ${symbol}@${interval}:`, error.message);
      
      // Update freshness tracking with error
      try {
        const symbolRecord = await this.db.getOrCreateSymbol(symbol);
        await this.db.updateDataFreshness(symbolRecord.id, interval, false, error.message);
      } catch (dbError) {
        console.error('   ❌ Failed to update error tracking:', dbError.message);
      }
      
      return {
        symbol,
        interval,
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Update multiple symbols/intervals
   */
  async updateMultipleSymbols(symbols, intervals = ['1day'], forceFullRefresh = false) {
    console.log('\\n' + '='.repeat(60));
    console.log('📊 INCREMENTAL DATA UPDATE');
    console.log('='.repeat(60));
    console.log(`📈 Symbols: ${symbols.length}`);
    console.log(`⏱️ Intervals: ${intervals.join(', ')}`);
    console.log(`🔄 Mode: ${forceFullRefresh ? 'FULL REFRESH' : 'INCREMENTAL'}`);
    
    // Filter out monthly intervals - they should be generated from daily aggregation
    const filteredIntervals = intervals.filter(interval => interval !== '1month');
    const hasMonthly = intervals.includes('1month');
    
    if (hasMonthly) {
      console.log('⚠️ WARNING: Monthly intervals are no longer fetched from Yahoo API');
      console.log('📊 Monthly data should be generated using fixMonthlyDataFromDaily() instead');
    }
    
    console.log(`⏱️ Filtered intervals: ${filteredIntervals.join(', ')}`);
    console.log('='.repeat(60));
    
    const results = {
      updated: [],
      upToDate: [],
      failed: [],
      totalNewPoints: 0
    };
    
    for (const symbol of symbols) {
      for (const interval of filteredIntervals) {
        const result = await this.updateSymbolData(symbol, interval, forceFullRefresh);
        
        if (result.status === 'updated') {
          results.updated.push(`${symbol}@${interval} (+${result.newPoints})`);
          results.totalNewPoints += result.newPoints;
        } else if (result.status === 'up_to_date' || result.status === 'no_new_data') {
          results.upToDate.push(`${symbol}@${interval}`);
        } else {
          results.failed.push(`${symbol}@${interval}: ${result.error}`);
        }
        
        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Generate monthly data from daily aggregation if monthly was requested
      if (hasMonthly) {
        console.log(`📊 Generating monthly data from daily aggregation for ${symbol}...`);
        try {
          await this.fixMonthlyDataFromDaily(symbol);
          results.updated.push(`${symbol}@1month (generated from daily)`);
          console.log(`   ✅ Monthly data generated for ${symbol}`);
        } catch (error) {
          console.error(`   ❌ Failed to generate monthly data for ${symbol}:`, error.message);
          results.failed.push(`${symbol}@1month: ${error.message}`);
        }
      }
    }
    
    // Summary
    console.log('\\n' + '='.repeat(60));
    console.log('📊 UPDATE COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${results.updated.length} datasets`);
    console.log(`⏭️ Already up-to-date: ${results.upToDate.length} datasets`);
    console.log(`❌ Failed: ${results.failed.length} datasets`);
    console.log(`📊 Total new data points: ${results.totalNewPoints.toLocaleString()}`);
    
    if (results.updated.length > 0) {
      console.log('\\n📈 Updated datasets:');
      results.updated.forEach(item => console.log(`   ${item}`));
    }
    
    return results;
  }

  async close() {
    await this.db.close();
  }
}

// Run if called directly
if (require.main === module) {
  const updater = new YahooFinanceIncremental();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const forceRefresh = args.includes('--force') || args.includes('-f');
  const symbols = args.filter(arg => !arg.startsWith('-')).map(s => s.toUpperCase());
  
  // Default symbols if none provided
  const symbolsToUpdate = symbols.length > 0 ? symbols : [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA',
    'SNOW', 'IBM', 'WDAY', 'JPM', 'V', 'DIS', 'NFLX', 'AMD'
  ];
  
  // Default intervals - daily, weekly, monthly, and intraday
  const intervals = ['1day', '1week', '1month', '5min', '15min', '60min'];
  
  console.log('🚀 Yahoo Finance Incremental Updater');
  console.log('Usage: node yahoo-finance-incremental.js [symbols...] [--force]');
  console.log('Example: node yahoo-finance-incremental.js AAPL TSLA --force');
  console.log('');
  
  updater.updateMultipleSymbols(symbolsToUpdate, intervals, forceRefresh)
    .then(results => {
      console.log('\\n✅ Update process complete!');
      return updater.close();
    })
    .catch(error => {
      console.error('💥 Update failed:', error);
      return updater.close();
    })
    .then(() => {
      process.exit(0);
    });
}

module.exports = YahooFinanceIncremental;