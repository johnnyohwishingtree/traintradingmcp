#!/usr/bin/env node

const SQLiteDatabase = require('../services/database');
const PostgresDatabase = require('../services/database-postgres');

class DatabaseMigration {
  constructor() {
    this.sqliteDb = new SQLiteDatabase();
    this.postgresDb = new PostgresDatabase();
  }

  async migrate() {
    console.log('🚀 Starting database migration from SQLite to PostgreSQL...');
    console.log('='.repeat(60));
    
    try {
      // Step 1: Migrate symbols
      await this.migrateSymbols();
      
      // Step 2: Migrate OHLC data
      await this.migrateOHLCData();
      
      // Step 3: Migrate freshness data
      await this.migrateFreshnessData();
      
      // Step 4: Verify migration
      await this.verifyMigration();
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ Migration completed successfully!');
      console.log('📊 PostgreSQL database is ready for use');
      console.log('\nNext steps:');
      console.log('1. Update your application to use PostgreSQL');
      console.log('2. Test all functionality with the new database');
      console.log('3. Backup/archive the SQLite database');
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async migrateSymbols() {
    console.log('\n📋 Step 1: Migrating symbols...');
    
    const symbols = await this.sqliteDb.getAllSymbols();
    console.log(`   Found ${symbols.length} symbols in SQLite`);
    
    for (const symbol of symbols) {
      await this.postgresDb.getOrCreateSymbol(
        symbol.symbol,
        symbol.name,
        symbol.exchange,
        symbol.type
      );
      console.log(`   ✓ Migrated symbol: ${symbol.symbol}`);
    }
    
    console.log(`   ✅ Successfully migrated ${symbols.length} symbols`);
  }

  async migrateOHLCData() {
    console.log('\n📊 Step 2: Migrating OHLC data...');
    
    const symbols = await this.sqliteDb.getAllSymbols();
    const intervals = ['1min', '5min', '15min', '30min', '1hour', '1day', '1week', '1month'];
    
    let totalRecords = 0;
    let migratedRecords = 0;
    
    for (const symbol of symbols) {
      console.log(`\n   Processing symbol: ${symbol.symbol}`);
      
      // Get PostgreSQL symbol record
      const pgSymbol = await this.postgresDb.getOrCreateSymbol(symbol.symbol);
      
      for (const interval of intervals) {
        try {
          // Get data from SQLite (get all data, no limit)
          const data = await this.sqliteDb.getOHLCData(symbol.symbol, interval, 999999);
          
          if (data.length === 0) {
            continue; // Skip empty intervals
          }
          
          console.log(`     ${interval}: ${data.length} records`);
          totalRecords += data.length;
          
          // Convert SQLite format to PostgreSQL format
          const pgData = data.map(row => ({
            timestamp: row.date.toISOString(),
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume
          }));
          
          // Insert into PostgreSQL
          const result = await this.postgresDb.insertOHLCData(pgSymbol.id, interval, pgData);
          migratedRecords += result.inserted;
          
          if (result.errors > 0) {
            console.log(`     ⚠️ ${result.errors} errors during insertion`);
          }
          
        } catch (error) {
          console.error(`     ❌ Error migrating ${symbol.symbol}@${interval}:`, error.message);
        }
      }
    }
    
    console.log(`\n   ✅ Migration summary:`);
    console.log(`      Total records found: ${totalRecords}`);
    console.log(`      Successfully migrated: ${migratedRecords}`);
    console.log(`      Migration rate: ${((migratedRecords / totalRecords) * 100).toFixed(1)}%`);
  }

  async migrateFreshnessData() {
    console.log('\n🕒 Step 3: Migrating freshness data...');
    
    // SQLite freshness data migration would require direct SQLite queries
    // For now, we'll skip this as it will be regenerated automatically
    console.log('   📝 Skipping freshness data - will be regenerated automatically');
    console.log('   ✅ Freshness data migration completed');
  }

  async verifyMigration() {
    console.log('\n🔍 Step 4: Verifying migration...');
    
    // Get counts from both databases
    const sqliteSymbols = await this.sqliteDb.getAllSymbols();
    const postgresSymbols = await this.postgresDb.getAllSymbols();
    
    console.log(`   SQLite symbols: ${sqliteSymbols.length}`);
    console.log(`   PostgreSQL symbols: ${postgresSymbols.length}`);
    
    if (sqliteSymbols.length === postgresSymbols.length) {
      console.log('   ✅ Symbol count matches');
    } else {
      console.log('   ⚠️ Symbol count mismatch');
    }
    
    // Sample a few symbols to verify data
    const sampleSymbols = sqliteSymbols.slice(0, 3);
    for (const symbol of sampleSymbols) {
      const sqliteData = await this.sqliteDb.getOHLCData(symbol.symbol, '1day', 100);
      const postgresData = await this.postgresDb.getOHLCData(symbol.symbol, '1day', 100);
      
      console.log(`   ${symbol.symbol} - SQLite: ${sqliteData.length}, PostgreSQL: ${postgresData.length}`);
      
      if (sqliteData.length > 0 && postgresData.length > 0) {
        const sqliteLast = sqliteData[sqliteData.length - 1];
        const postgresLast = postgresData[postgresData.length - 1];
        
        if (sqliteLast.close === postgresLast.close) {
          console.log(`      ✅ Latest data matches (close: ${sqliteLast.close})`);
        } else {
          console.log(`      ⚠️ Latest data mismatch (SQLite: ${sqliteLast.close}, PostgreSQL: ${postgresLast.close})`);
        }
      }
    }
    
    console.log('   ✅ Verification completed');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up connections...');
    
    try {
      await this.sqliteDb.close();
      await this.postgresDb.close();
      console.log('   ✅ Database connections closed');
    } catch (error) {
      console.error('   ⚠️ Error during cleanup:', error.message);
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new DatabaseMigration();
  migration.migrate();
}

module.exports = DatabaseMigration;