const Database = require('./services/database');

async function fixMonthlyData() {
    const db = new Database();
    
    console.log('🔧 Fixing duplicate monthly data...');
    
    try {
        // Get all monthly data that needs fixing
        const query = `
            SELECT s.symbol, o.timestamp, o.id
            FROM ohlc_data o
            JOIN symbols s ON o.symbol_id = s.id
            WHERE o.interval = '1month'
            ORDER BY s.symbol, o.timestamp
        `;
        
        const rows = await new Promise((resolve, reject) => {
            db.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`Found ${rows.length} monthly data points to check`);
        
        // Group by symbol and month
        const monthlyData = {};
        rows.forEach(row => {
            const date = new Date(row.timestamp);
            const monthKey = `${row.symbol}_${date.getFullYear()}_${date.getMonth()}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = [];
            }
            monthlyData[monthKey].push(row);
        });
        
        // Find and delete duplicates (keep the first entry for each month)
        let duplicatesToDelete = [];
        for (const [monthKey, entries] of Object.entries(monthlyData)) {
            if (entries.length > 1) {
                console.log(`❌ Found ${entries.length} entries for ${monthKey}:`);
                entries.forEach(e => console.log(`   - ${e.timestamp} (id: ${e.id})`));
                
                // Keep the first entry, delete the rest
                for (let i = 1; i < entries.length; i++) {
                    duplicatesToDelete.push(entries[i].id);
                }
            }
        }
        
        if (duplicatesToDelete.length > 0) {
            console.log(`\n🗑️ Deleting ${duplicatesToDelete.length} duplicate entries...`);
            
            const deleteQuery = `DELETE FROM ohlc_data WHERE id IN (${duplicatesToDelete.join(',')})`;
            await new Promise((resolve, reject) => {
                db.db.run(deleteQuery, function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`✅ Deleted ${this.changes} duplicate monthly entries`);
                        resolve();
                    }
                });
            });
        } else {
            console.log('✅ No duplicate monthly data found');
        }
        
        await db.close();
        console.log('🎉 Monthly data cleanup complete!');
        
    } catch (error) {
        console.error('❌ Error fixing monthly data:', error);
        await db.close();
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    fixMonthlyData().then(() => process.exit(0));
}

module.exports = { fixMonthlyData };