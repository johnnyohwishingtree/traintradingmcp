// Test script to create proper monthly aggregation from daily data
const axios = require('axios');

async function testMonthlyAggregation() {
    console.log('🔍 Testing monthly aggregation from daily data for SNOW');
    
    const symbol = 'SNOW';
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    
    // Get daily data for 2025
    const response = await axios.get(`${baseUrl}/${symbol}`, {
        params: {
            period1: Math.floor(new Date('2025-01-01').getTime() / 1000),
            period2: Math.floor(Date.now() / 1000),
            interval: '1d',
            includePrePost: 'false'
        }
    });
    
    const chartData = response.data.chart?.result?.[0];
    const timestamps = chartData.timestamp || [];
    const quotes = chartData.indicators?.quote?.[0] || {};
    
    // Group daily data by month
    const monthlyData = {};
    
    for (let i = 0; i < timestamps.length; i++) {
        const date = new Date(timestamps[i] * 1000);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                month: monthKey,
                candles: []
            };
        }
        
        monthlyData[monthKey].candles.push({
            date: date.toDateString(),
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume[i]
        });
    }
    
    // Create monthly aggregations
    console.log('\nMonthly aggregations from daily data:');
    console.log('====================================');
    
    Object.keys(monthlyData).sort().forEach(monthKey => {
        const month = monthlyData[monthKey];
        const candles = month.candles;
        
        if (candles.length === 0) return;
        
        const monthlyCandle = {
            month: monthKey,
            open: candles[0].open,
            high: Math.max(...candles.map(c => c.high)),
            low: Math.min(...candles.map(c => c.low)),
            close: candles[candles.length - 1].close,
            volume: candles.reduce((sum, c) => sum + c.volume, 0),
            tradingDays: candles.length
        };
        
        console.log(`${monthKey}: O=${monthlyCandle.open?.toFixed(2)}, H=${monthlyCandle.high.toFixed(2)}, L=${monthlyCandle.low.toFixed(2)}, C=${monthlyCandle.close?.toFixed(2)} (${monthlyCandle.tradingDays} days)`);
        
        if (monthKey === '2025-09') {
            console.log(`  September details:`);
            candles.forEach(c => {
                console.log(`    ${c.date}: O=${c.open?.toFixed(2)}, H=${c.high?.toFixed(2)}, L=${c.low?.toFixed(2)}, C=${c.close?.toFixed(2)}`);
            });
        }
    });
}

testMonthlyAggregation().catch(console.error);