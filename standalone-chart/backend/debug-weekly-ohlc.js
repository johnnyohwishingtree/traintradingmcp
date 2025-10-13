/**
 * Debug script to compare our weekly OHLC data with Yahoo Finance
 * Focus on September 8th and September 15th weeks
 */

const axios = require('axios');
const YahooFinanceIncremental = require('./yahoo-finance-incremental');

async function debugWeeklyOHLC() {
    console.log('🔍 Debugging weekly OHLC data accuracy...');
    
    try {
        // 1. Get raw Yahoo Finance weekly data directly
        console.log('\n📊 Step 1: Fetching raw Yahoo Finance weekly data...');
        const now = Math.floor(Date.now() / 1000);
        const period1 = Math.floor((Date.now() - (60 * 24 * 60 * 60 * 1000)) / 1000); // Last 60 days
        
        const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/SNOW', {
            params: {
                period1,
                period2: now,
                interval: '1wk',
                includePrePost: 'false'
            },
            timeout: 10000
        });
        
        const chartData = response.data.chart?.result?.[0];
        const timestamps = chartData.timestamp || [];
        const quotes = chartData.indicators?.quote?.[0] || {};
        
        console.log('📊 Raw Yahoo Finance weekly data (last 10 weeks):');
        const lastTenWeeks = timestamps.slice(-10);
        lastTenWeeks.forEach((ts, i) => {
            const actualIndex = timestamps.length - 10 + i;
            const date = new Date(ts * 1000);
            const dayOfWeek = date.getDay();
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            const ohlc = {
                open: quotes.open?.[actualIndex],
                high: quotes.high?.[actualIndex], 
                low: quotes.low?.[actualIndex],
                close: quotes.close?.[actualIndex],
                volume: quotes.volume?.[actualIndex]
            };
            
            const color = ohlc.close > ohlc.open ? '🟢' : '🔴';
            
            console.log(`  ${date.toISOString().split('T')[0]} (${dayNames[dayOfWeek]}) ${color}`);
            console.log(`    O:${ohlc.open?.toFixed(2)} H:${ohlc.high?.toFixed(2)} L:${ohlc.low?.toFixed(2)} C:${ohlc.close?.toFixed(2)}`);
            console.log(`    Range: ${ohlc.low?.toFixed(2)} -> ${ohlc.high?.toFixed(2)} (${((ohlc.high - ohlc.low) / ohlc.low * 100).toFixed(1)}%)`);
            console.log('');
        });
        
        // 2. Get our processed data
        console.log('\n📊 Step 2: Checking our processed weekly data...');
        const updater = new YahooFinanceIncremental();
        const ourData = await updater.db.getOHLCData('SNOW', '1week', 10);
        
        console.log('📊 Our weekly data (last 10 weeks):');
        ourData.slice(-10).forEach((record, i) => {
            const date = new Date(record.date);
            const color = record.close > record.open ? '🟢' : '🔴';
            
            console.log(`  ${record.date.toISOString().split('T')[0]} (Mon) ${color}`);
            console.log(`    O:${record.open.toFixed(2)} H:${record.high.toFixed(2)} L:${record.low.toFixed(2)} C:${record.close.toFixed(2)}`);
            console.log(`    Range: ${record.low.toFixed(2)} -> ${record.high.toFixed(2)} (${((record.high - record.low) / record.low * 100).toFixed(1)}%)`);
            console.log('');
        });
        
        // 3. Focus on specific weeks mentioned
        console.log('\n🔍 Step 3: Comparing specific weeks...');
        
        // Find September 8th week
        const sep8Week = ourData.find(r => {
            const date = new Date(r.date);
            return date >= new Date('2025-09-08') && date < new Date('2025-09-15');
        });
        
        // Find September 15th week  
        const sep15Week = ourData.find(r => {
            const date = new Date(r.date);
            return date >= new Date('2025-09-15') && date < new Date('2025-09-22');
        });
        
        if (sep8Week) {
            const color = sep8Week.close > sep8Week.open ? '🟢' : '🔴';
            console.log(`Sep 8th week: ${color} O:${sep8Week.open.toFixed(2)} H:${sep8Week.high.toFixed(2)} L:${sep8Week.low.toFixed(2)} C:${sep8Week.close.toFixed(2)}`);
            console.log(`  Expected: 🔴 Red candle with range 221->232`);
        }
        
        if (sep15Week) {
            const color = sep15Week.close > sep15Week.open ? '🟢' : '🔴';
            console.log(`Sep 15th week: ${color} O:${sep15Week.open.toFixed(2)} H:${sep15Week.high.toFixed(2)} L:${sep15Week.low.toFixed(2)} C:${sep15Week.close.toFixed(2)}`);
            console.log(`  Expected: 🟢 Green candle with range 214->231`);
        }
        
        await updater.close();
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugWeeklyOHLC();