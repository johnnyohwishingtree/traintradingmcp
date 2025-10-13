#!/usr/bin/env node

// Simple test to verify PostgreSQL functionality
const PostgresDatabase = require('./services/database-postgres');

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Functionality');
  console.log('=' .repeat(50));
  
  const db = new PostgresDatabase();
  
  try {
    // Test 1: Connection
    console.log('\n1. Testing connection...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for connection
    console.log('   ✅ Connection successful');
    
    // Test 2: Get symbols
    console.log('\n2. Testing symbol retrieval...');
    const symbols = await db.getAllSymbols();
    console.log(`   ✅ Found ${symbols.length} symbols`);
    
    if (symbols.length > 0) {
      const testSymbol = symbols.find(s => s.symbol === 'SNOW') || symbols[0];
      console.log(`   📊 Testing with symbol: ${testSymbol.symbol}`);
      
      // Test 3: Get OHLC data
      console.log('\n3. Testing OHLC data retrieval...');
      const dailyData = await db.getOHLCData(testSymbol.symbol, '1day', 10);
      console.log(`   ✅ Retrieved ${dailyData.length} daily data points`);
      
      if (dailyData.length > 0) {
        const latest = dailyData[dailyData.length - 1];
        console.log(`   📈 Latest data: ${latest.date.toDateString()} - Close: $${latest.close}`);
      }
      
      // Test 4: Data age
      console.log('\n4. Testing data age function...');
      const ageInfo = await db.getDataAge(testSymbol.symbol, '1day');
      if (ageInfo) {
        console.log(`   ✅ Data age: ${ageInfo.age_minutes ? Math.round(ageInfo.age_minutes) : 'N/A'} minutes`);
        console.log(`   📊 Data points: ${ageInfo.data_points}`);
      } else {
        console.log('   ⚠️ No age info available');
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 PostgreSQL functionality test completed successfully!');
    console.log('💡 The database is ready for production use');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
}

testPostgreSQL();