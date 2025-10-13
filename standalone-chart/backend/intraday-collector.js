const axios = require('axios');
const Database = require('./services/database');

class IntradayCollector {
  constructor() {
    this.db = new Database();
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    
    // Focus on popular symbols for intraday data
    this.symbols = [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA',
      'SNOW', 'IBM', 'WDAY', 'JPM', 'V', 'DIS', 'NFLX'
    ];
    
    // Yahoo Finance interval mapping for intraday
    this.intervals = {
      '1min': '1m',
      '5min': '5m', 
      '15min': '15m',
      '30min': '30m',
      '60min': '1h'
    };
  }

  async fetchYahooIntraday(symbol, interval = '1min', period = '1d') {
    console.log(`📥 Fetching ${symbol}@${interval} intraday data from Yahoo Finance...`);
    
    try {
      const yahooInterval = this.intervals[interval] || '1m';
      
      // For intraday, we use period instead of timestamps
      let yahooRange;
      switch(period) {
        case '1d': yahooRange = '1d'; break;
        case '2d': yahooRange = '2d'; break;
        case '5d': yahooRange = '5d'; break;
        case '1mo': yahooRange = '1mo'; break;
        default: yahooRange = '1d';
      }
      
      const response = await axios.get(`${this.baseUrl}/${symbol}`, {
        params: {
          range: yahooRange,
          interval: yahooInterval,
          includePrePost: 'false'
        },
        timeout: 15000
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
          // Yahoo returns timestamps in seconds, convert to ISO string
          const date = new Date(timestamps[i] * 1000);
          
          ohlcData.push({
            timestamp: date.toISOString(),
            open: quotes.open[i],
            high: quotes.high[i], 
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume?.[i] || 0
          });
        }
      }
      
      console.log(`✅ Retrieved ${ohlcData.length} intraday points for ${symbol}@${interval}`);
      return ohlcData;
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${symbol}@${interval}:`, error.message);
      throw error;
    }
  }

  async storeIntradayData(symbol, interval, data) {
    try {
      // Get or create symbol
      const symbolRecord = await this.db.getOrCreateSymbol(symbol, `${symbol} Inc.`, 'NASDAQ', 'Stock');
      
      // Store OHLC data
      const result = await this.db.insertOHLCData(symbolRecord.id, interval, data);
      
      // Update freshness tracking
      await this.db.updateDataFreshness(symbolRecord.id, interval, true, null);
      
      console.log(`💾 Stored ${result.inserted} intraday points for ${symbol}@${interval}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Storage error for ${symbol}@${interval}:`, error.message);
      throw error;
    }
  }

  async collectIntradayData() {
    console.log('🚀 YAHOO FINANCE INTRADAY DATA COLLECTION');
    console.log('='.repeat(60));
    console.log('⏰ Collecting 1m, 5m, 15m, 30m, 1h data');
    console.log(`📊 Symbols: ${this.symbols.length}`);
    console.log('='.repeat(60));
    
    const results = {
      successful: [],
      failed: [],
      totalDatasets: 0,
      totalDataPoints: 0
    };
    
    // Collect intraday data for each symbol and interval
    for (const symbol of this.symbols) {
      console.log(`\\n📈 Processing ${symbol} intraday data...`);
      
      for (const [interval, yahooInterval] of Object.entries(this.intervals)) {
        try {
          // Use appropriate period for different intervals
          let period;
          if (interval === '1min') {
            period = '1d'; // 1 day for 1-minute (390 points)
          } else if (interval === '5min') {
            period = '5d'; // 5 days for 5-minute data
          } else if (interval === '15min') {
            period = '1mo'; // 1 month for 15-minute data
          } else if (interval === '30min') {
            period = '1mo'; // 1 month for 30-minute data
          } else if (interval === '60min') {
            period = '1mo'; // 1 month for hourly data
          } else {
            period = '1d';
          }
          
          const data = await this.fetchYahooIntraday(symbol, interval, period);
          
          if (data.length > 0) {
            await this.storeIntradayData(symbol, interval, data);
            
            results.successful.push(`${symbol}@${interval}`);
            results.totalDataPoints += data.length;
            results.totalDatasets++;
          } else {
            console.log(`⚠️ No data returned for ${symbol}@${interval}`);
          }
          
          // Small delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          console.error(`❌ Failed ${symbol}@${interval}:`, error.message);
          results.failed.push(`${symbol}@${interval}: ${error.message}`);
        }
      }
    }
    
    // Final summary
    console.log('\\n' + '='.repeat(60));
    console.log('📊 INTRADAY COLLECTION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${results.successful.length} datasets`);
    console.log(`❌ Failed: ${results.failed.length} datasets`);
    console.log(`📊 Total data points: ${results.totalDataPoints.toLocaleString()}`);
    console.log(`💾 Intraday cache populated!`);
    
    if (results.successful.length > 0) {
      console.log('\\n✅ Successfully cached intraday data:');
      console.log(`   1-minute: ${results.successful.filter(s => s.includes('@1min')).length} symbols`);
      console.log(`   5-minute: ${results.successful.filter(s => s.includes('@5min')).length} symbols`);
      console.log(`   15-minute: ${results.successful.filter(s => s.includes('@15min')).length} symbols`);
      console.log(`   30-minute: ${results.successful.filter(s => s.includes('@30min')).length} symbols`);
      console.log(`   1-hour: ${results.successful.filter(s => s.includes('@60min')).length} symbols`);
    }
    
    console.log('\\n🎉 All intraday timeframes now available for charting!');
    
    return results;
  }

  async close() {
    await this.db.close();
  }
}

// Run if called directly
if (require.main === module) {
  const collector = new IntradayCollector();
  
  collector.collectIntradayData()
    .then(results => {
      console.log('\\n✅ Intraday collection complete!');
      console.log(`📈 Ready to display ${results.totalDatasets} intraday datasets`);
      return collector.close();
    })
    .catch(error => {
      console.error('💥 Intraday collection failed:', error);
      return collector.close();
    })
    .then(() => {
      process.exit(0);
    });
}

module.exports = IntradayCollector;