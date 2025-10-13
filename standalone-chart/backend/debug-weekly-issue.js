/**
 * Debug script to investigate weekly timestamp normalization issue
 * Run this with VS Code debugger to step through the problem
 */

const YahooFinanceIncremental = require('./yahoo-finance-incremental');

async function debugWeeklyIssue() {
    console.log('🔍 Starting debug session for weekly timestamp issue...');
    
    const updater = new YahooFinanceIncremental();
    
    try {
        // Clear existing weekly data for clean test
        console.log('🗑️ Clearing existing SNOW weekly data...');
        await updater.db.deleteSymbolData('SNOW');
        
        // Force a fresh fetch of weekly data
        console.log('📊 Fetching SNOW weekly data with debugging...');
        const result = await updater.updateSymbolData('SNOW', '1week', true);
        
        console.log('✅ Update result:', result);
        
        // Check what was actually stored in database
        console.log('📊 Checking database contents...');
        const storedData = await updater.db.getOHLCData('SNOW', '1week', 5);
        
        console.log('📊 First 5 weekly records from database:');
        storedData.forEach((record, i) => {
            const date = new Date(record.date);
            const dayOfWeek = date.getDay();
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            console.log(`  ${i+1}. ${record.date.toISOString()} (${dayNames[dayOfWeek]}) - O:${record.open} C:${record.close}`);
        });
        
    } catch (error) {
        console.error('❌ Debug session failed:', error);
    } finally {
        await updater.close();
    }
}

// Set breakpoint here to start debugging
debugger; // Main breakpoint: Start debugging session

debugWeeklyIssue();