/**
 * Debug script to verify monthly timestamp positioning
 * Should show first day of month (e.g., Aug 1, Sep 1) not last day
 */

const Database = require('./services/database');

async function debugMonthlyTimestamps() {
    console.log('🔍 Debugging monthly timestamp positioning...');
    
    const db = new Database();
    
    try {
        // Get SNOW monthly data
        const monthlyData = await db.getOHLCData('SNOW', '1month', 12); // Last 12 months
        
        console.log('\n📊 Monthly data timestamps (last 12 months):');
        monthlyData.forEach((record, i) => {
            const date = new Date(record.date);
            const dayOfMonth = date.getDate();
            const month = date.toLocaleString('en-US', { month: 'long' });
            const year = date.getFullYear();
            const color = record.close > record.open ? '🟢' : '🔴';
            
            console.log(`  ${month} ${year} - Day ${dayOfMonth}: ${date.toISOString().split('T')[0]} ${color}`);
            console.log(`    O:${record.open.toFixed(2)} H:${record.high.toFixed(2)} L:${record.low.toFixed(2)} C:${record.close.toFixed(2)}`);
            
            // Check if it's the first day of the month
            if (dayOfMonth !== 1) {
                console.log(`    ⚠️ WARNING: Not first day of month! Should be ${month} 1st`);
            } else {
                console.log(`    ✅ Correctly positioned at first day of month`);
            }
            console.log('');
        });
        
        await db.close();
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
        await db.close();
    }
}

debugMonthlyTimestamps();