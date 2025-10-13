const StrategicDataCollector = require('./strategic-data-collector');
const cron = require('node-cron');

// Configuration
const API_KEYS = [
  '8O6M43P5LFHH3KC7', // First API key - 25 calls/day
  '9G5TENUKNK80BD6Z'  // Second API key - 25 calls/day
];

// Total: 50 API calls available per day with both keys

class DailyDataCollector {
  constructor() {
    this.apiKeys = API_KEYS;
    this.totalCalls = API_KEYS.length * 25;
    console.log(`💰 Daily Collection Service initialized with ${this.apiKeys.length} API keys`);
    console.log(`📊 Total daily capacity: ${this.totalCalls} API calls`);
  }

  async runDailyCollection() {
    console.log('\\n' + '='.repeat(60));
    console.log(`🌅 DAILY DATA COLLECTION STARTED AT ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    const allResults = {
      successful: [],
      failed: [],
      totalCallsUsed: 0
    };

    // Strategy for 75 calls (3 API keys × 25 calls each) - OPTIMIZED
    // Priority 1: Daily data (25+ years per call) - Highest value
    // Priority 2: Weekly data for long-term analysis
    // Priority 3: Intraday data for active trading
    
    const strategy = [
      // Priority 1: Daily data (25 calls) - 25+ years each, most valuable
      { 
        symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 
                  'SNOW', 'IBM', 'WDAY', 'JPM', 'V', 'DIS', 'NFLX', 'AMD',
                  'BA', 'CRM', 'UBER', 'ABNB', 'SHOP', 'SPOT', 'COIN', 'GME',
                  'AMC', 'PLTR'], 
        interval: '1day',
        priority: 1 
      },
      
      // Priority 2: Weekly data (20 calls) - Long-term trends
      { 
        symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 
                  'SNOW', 'IBM', 'WDAY', 'JPM', 'V', 'DIS', 'NFLX', 'AMD',
                  'BA', 'CRM', 'UBER', 'ABNB', 'SHOP'], 
        interval: '1week',
        priority: 2 
      },
      
      // Priority 3: 60min data (15 calls) - Swing trading
      { 
        symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 
                  'SNOW', 'SPY', 'QQQ', 'IWM', 'XLF', 'XLK', 'XLE', 'GLD'], 
        interval: '60min',
        priority: 3 
      },
      
      // Priority 4: 15min data (10 calls) - Day trading
      { 
        symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 
                  'SPY', 'QQQ', 'IWM'], 
        interval: '15min',
        priority: 4 
      },
      
      // Priority 5: 5min data (5 calls) - Active scalping
      { 
        symbols: ['AAPL', 'SPY', 'QQQ', 'TSLA', 'NVDA'], 
        interval: '5min',
        priority: 5 
      }
    ];

    // Use API keys sequentially
    for (let keyIndex = 0; keyIndex < this.apiKeys.length; keyIndex++) {
      const apiKey = this.apiKeys[keyIndex];
      console.log(`\\n📋 Using API Key #${keyIndex + 1} (${apiKey.substring(0, 4)}...${apiKey.substring(-4)})`);
      
      const collector = new StrategicDataCollector(apiKey);
      collector.strategy = strategy;
      collector.maxCalls = 25; // Each key has 25 calls

      try {
        const results = await collector.collectStrategicData();
        
        // Aggregate results
        allResults.successful.push(...results.successful);
        allResults.failed.push(...results.failed);
        allResults.totalCallsUsed += results.callsUsed;
        
        console.log(`✅ API Key #${keyIndex + 1} used ${results.callsUsed}/25 calls`);
        
        await collector.close();
        
        // If we successfully used all calls from this key, continue to next
        if (results.callsUsed >= 24 || results.failed.some(f => f.includes('rate limit'))) {
          console.log(`⚠️ API Key #${keyIndex + 1} exhausted, switching to next key...`);
          
          // Remove already successful items from strategy for next key
          for (const successItem of results.successful) {
            const [symbol, interval] = successItem.split('@');
            for (const group of strategy) {
              const index = group.symbols.indexOf(symbol);
              if (index > -1 && group.interval === interval) {
                group.symbols.splice(index, 1);
              }
            }
          }
        } else {
          // Key still has capacity, something went wrong
          console.log(`⚡ API Key #${keyIndex + 1} still has capacity, stopping collection`);
          break;
        }
        
      } catch (error) {
        console.error(`❌ Failed with API Key #${keyIndex + 1}:`, error.message);
      }
    }

    // Final summary
    console.log('\\n' + '='.repeat(60));
    console.log('📊 DAILY COLLECTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${allResults.successful.length} datasets`);
    console.log(`❌ Failed: ${allResults.failed.length} datasets`);
    console.log(`📞 Total API calls used: ${allResults.totalCallsUsed}/${this.totalCalls}`);
    
    if (allResults.successful.length > 0) {
      console.log('\\n✅ Successfully cached:');
      // Group by symbol for cleaner output
      const bySymbol = {};
      for (const item of allResults.successful) {
        const [symbol, interval] = item.split('@');
        if (!bySymbol[symbol]) bySymbol[symbol] = [];
        bySymbol[symbol].push(interval);
      }
      for (const [symbol, intervals] of Object.entries(bySymbol)) {
        console.log(`  ${symbol}: ${intervals.join(', ')}`);
      }
    }
    
    console.log('\\n🌙 Next collection scheduled for midnight tomorrow');
    console.log('='.repeat(60));
    
    return allResults;
  }

  startScheduledCollection() {
    console.log('⏰ Scheduling daily data collection...');
    
    // Run immediately on start if requested
    if (process.argv.includes('--now')) {
      console.log('🚀 Running initial collection immediately...');
      this.runDailyCollection().catch(err => {
        console.error('❌ Initial collection failed:', err);
      });
    }
    
    // Schedule for midnight every day (00:05 to avoid exact midnight issues)
    cron.schedule('5 0 * * *', async () => {
      console.log('⏰ Midnight trigger activated!');
      try {
        await this.runDailyCollection();
      } catch (error) {
        console.error('❌ Scheduled collection failed:', error);
      }
    });
    
    console.log('✅ Daily collection scheduled for 00:05 (12:05 AM) every day');
    console.log('💡 Add --now flag to run immediately: node daily-collection.js --now');
  }
}

// Run the service
if (require.main === module) {
  const collector = new DailyDataCollector();
  collector.startScheduledCollection();
  
  // Keep the process running
  console.log('\\n🌟 Daily Collection Service is running...');
  console.log('Press Ctrl+C to stop\\n');
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down Daily Collection Service...');
    process.exit(0);
  });
}

module.exports = DailyDataCollector;