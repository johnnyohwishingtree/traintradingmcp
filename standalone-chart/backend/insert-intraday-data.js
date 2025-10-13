const YahooFinanceIncremental = require('./yahoo-finance-incremental');
const DatabaseFactory = require('./services/database-factory');

async function insertIntradayData() {
  console.log('📊 Inserting TSLA 1min data into database...\n');
  
  const db = DatabaseFactory.create('postgres');
  const yahooUpdater = new YahooFinanceIncremental(db);
  
  try {
    // Get or create symbol
    const symbolRecord = await db.getOrCreateSymbol('TSLA');
    console.log(`📋 Symbol record: ${symbolRecord.symbol} (ID: ${symbolRecord.id})`);
    
    // Fetch the data
    console.log('📊 Fetching TSLA 1min data from Yahoo Finance...');
    const data = await yahooUpdater.fetchYahooData('TSLA', '1min');
    console.log(`✅ Fetched ${data.length} data points`);
    
    if (data.length > 0) {
      // Insert into database
      console.log('💾 Inserting data into PostgreSQL...');
      const result = await db.insertOHLCData(symbolRecord.id, '1min', data);
      
      console.log(`✅ Successfully inserted ${result.inserted} records`);
      if (result.errors > 0) {
        console.log(`⚠️ ${result.errors} records had errors`);
      }
      
      // Update data freshness tracking
      await db.updateDataFreshness(symbolRecord.id, '1min', true);
      console.log('✅ Updated data freshness tracking');
    }
    
  } catch (error) {
    console.error('❌ Failed to insert intraday data:', error.message);
  } finally {
    await db.close();
  }
}

insertIntradayData().catch(console.error);