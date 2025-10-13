const DatabaseFactory = require('../services/database-factory');

async function cleanDuplicateDailyData() {
  console.log('🧹 Starting cleanup of duplicate daily data...\n');
  
  const db = DatabaseFactory.create('postgres');
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First, identify all symbols with duplicate daily data
    const duplicatesResult = await client.query(`
      SELECT 
        s.symbol,
        s.id as symbol_id,
        COUNT(DISTINCT DATE(o.timestamp)) as unique_days,
        COUNT(*) as total_records,
        COUNT(*) - COUNT(DISTINCT DATE(o.timestamp)) as duplicate_records
      FROM ohlc_data o
      JOIN symbols s ON o.symbol_id = s.id
      WHERE o.interval = '1day'
      GROUP BY s.symbol, s.id
      HAVING COUNT(*) > COUNT(DISTINCT DATE(o.timestamp))
      ORDER BY duplicate_records DESC
    `);
    
    console.log(`Found ${duplicatesResult.rows.length} symbols with duplicate daily data:\n`);
    
    for (const symbol of duplicatesResult.rows) {
      console.log(`📊 Processing ${symbol.symbol}: ${symbol.duplicate_records} duplicates to remove...`);
      
      // For each symbol, keep only the first entry for each date
      // and update its timestamp to be normalized to 9:30 AM
      const deleteResult = await client.query(`
        WITH ranked_data AS (
          SELECT 
            id,
            timestamp,
            DATE(timestamp) as trading_date,
            ROW_NUMBER() OVER (PARTITION BY DATE(timestamp) ORDER BY id) as rn
          FROM ohlc_data
          WHERE symbol_id = $1 AND interval = '1day'
        ),
        to_delete AS (
          SELECT id FROM ranked_data WHERE rn > 1
        )
        DELETE FROM ohlc_data
        WHERE id IN (SELECT id FROM to_delete)
        RETURNING id
      `, [symbol.symbol_id]);
      
      console.log(`   ✅ Deleted ${deleteResult.rowCount} duplicate records`);
      
      // Now normalize the remaining timestamps to 9:30 AM
      // Only update if the time is not already 9:30 AM
      const updateResult = await client.query(`
        UPDATE ohlc_data
        SET timestamp = DATE(timestamp) + INTERVAL '9 hours 30 minutes'
        WHERE symbol_id = $1 
        AND interval = '1day'
        AND (EXTRACT(HOUR FROM timestamp) != 9 OR EXTRACT(MINUTE FROM timestamp) != 30)
        RETURNING id
      `, [symbol.symbol_id]);
      
      console.log(`   ✅ Normalized ${updateResult.rowCount} timestamps to 9:30 AM\n`);
    }
    
    // Verify cleanup
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as symbols_with_duplicates
      FROM (
        SELECT 
          symbol_id,
          COUNT(*) - COUNT(DISTINCT DATE(timestamp)) as duplicates
        FROM ohlc_data
        WHERE interval = '1day'
        GROUP BY symbol_id
        HAVING COUNT(*) > COUNT(DISTINCT DATE(timestamp))
      ) as dup_check
    `);
    
    const duplicatesRemaining = parseInt(verifyResult.rows[0].symbols_with_duplicates);
    if (duplicatesRemaining === 0) {
      console.log('✅ SUCCESS: All duplicate daily data has been cleaned up!');
      await client.query('COMMIT');
    } else {
      console.log(`⚠️ WARNING: ${duplicatesRemaining} symbols still have duplicates`);
      console.log('Rolling back transaction...');
      await client.query('ROLLBACK');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error cleaning duplicate data:', error.message);
    throw error;
  } finally {
    client.release();
    await db.close();
  }
}

// Run the cleanup
cleanDuplicateDailyData()
  .then(() => {
    console.log('\n🎉 Cleanup completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Cleanup failed:', err);
    process.exit(1);
  });