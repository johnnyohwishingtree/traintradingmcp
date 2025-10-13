const YahooFinanceIncremental = require('./yahoo-finance-incremental');
const DatabaseFactory = require('./services/database-factory');

async function testIntradayDirect() {
  console.log('🧪 Testing intraday data fetching directly...\n');
  
  const db = DatabaseFactory.create('postgres');
  const yahooUpdater = new YahooFinanceIncremental(db);
  
  try {
    console.log('📊 Attempting to fetch TSLA 1min data...');
    const data = await yahooUpdater.fetchYahooData('TSLA', '1min');
    
    console.log(`✅ Successfully fetched ${data.length} data points`);
    if (data.length > 0) {
      console.log('📈 First data point:', data[0]);
      console.log('📈 Last data point:', data[data.length - 1]);
    }
    
  } catch (error) {
    console.error('❌ Direct fetch failed:', error.message);
    if (error.response) {
      console.error('📤 Request URL:', error.config?.url);
      console.error('📤 Request params:', error.config?.params);
      console.error('📥 Response status:', error.response.status);
      console.error('📥 Response data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await db.close();
  }
}

testIntradayDirect().catch(console.error);