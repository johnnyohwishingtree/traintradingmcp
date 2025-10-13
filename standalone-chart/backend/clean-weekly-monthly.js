const Database = require('./services/database');
const YahooFinanceIncremental = require('./yahoo-finance-incremental');

async function cleanAndRefreshWeeklyMonthly() {
    const db = new Database();
    
    console.log('🧹 Cleaning up weekly and monthly data...');
    
    try {
        // Step 1: Delete ALL weekly and monthly data (it's corrupted with duplicates)
        console.log('🗑️ Deleting all weekly data...');
        await new Promise((resolve, reject) => {
            db.db.run("DELETE FROM ohlc_data WHERE interval = '1week'", function(err) {
                if (err) reject(err);
                else {
                    console.log(`   Deleted ${this.changes} weekly records`);
                    resolve();
                }
            });
        });
        
        console.log('🗑️ Deleting all monthly data...');
        await new Promise((resolve, reject) => {
            db.db.run("DELETE FROM ohlc_data WHERE interval = '1month'", function(err) {
                if (err) reject(err);
                else {
                    console.log(`   Deleted ${this.changes} monthly records`);
                    resolve();
                }
            });
        });
        
        // Step 2: Get all symbols that need weekly/monthly data refreshed
        const symbols = await db.getAllSymbols();
        const symbolList = symbols.map(s => s.symbol);
        
        console.log(`\n📊 Found ${symbolList.length} symbols to refresh`);
        
        // Step 3: Re-fetch clean weekly and monthly data
        const updater = new YahooFinanceIncremental();
        
        console.log('\n🔄 Re-fetching clean weekly and monthly data...');
        const result = await updater.updateMultipleSymbols(
            symbolList.slice(0, 10), // Process first 10 symbols to test
            ['1week', '1month'],     // Only update weekly and monthly
            true                      // Force full refresh
        );
        
        console.log('\n✅ Cleanup complete!');
        console.log(`   Updated: ${result.updated.length} datasets`);
        console.log(`   Failed: ${result.failed.length} datasets`);
        
        await updater.close();
        await db.close();
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        await db.close();
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    cleanAndRefreshWeeklyMonthly().then(() => process.exit(0));
}

module.exports = { cleanAndRefreshWeeklyMonthly };