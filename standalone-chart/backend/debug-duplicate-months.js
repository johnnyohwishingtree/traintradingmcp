// Debug duplicate monthly entries issue
const axios = require('axios');

async function debugDuplicateMonths() {
    console.log('🔍 Debugging duplicate monthly entries for SNOW');
    
    const symbol = 'SNOW';
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    
    // Fetch raw monthly data from Yahoo Finance
    const response = await axios.get(`${baseUrl}/${symbol}`, {
        params: {
            period1: Math.floor(new Date('2025-07-01').getTime() / 1000),
            period2: Math.floor(Date.now() / 1000),
            interval: '1mo',
            includePrePost: 'false'
        }
    });
    
    const chartData = response.data.chart?.result?.[0];
    const timestamps = chartData.timestamp || [];
    const quotes = chartData.indicators?.quote?.[0] || {};
    
    console.log('Raw Yahoo Finance monthly data:');
    console.log('==============================');
    
    for (let i = 0; i < timestamps.length; i++) {
        const rawTimestamp = timestamps[i];
        const rawDate = new Date(rawTimestamp * 1000);
        
        if (rawDate.getFullYear() === 2025 && (rawDate.getMonth() === 7 || rawDate.getMonth() === 8)) {
            console.log(`\nEntry ${i}:`);
            console.log(`  Raw timestamp: ${rawTimestamp}`);
            console.log(`  Raw date: ${rawDate.toISOString()}`);
            console.log(`  Month: ${rawDate.getMonth() + 1} (${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][rawDate.getMonth()]})`);
            console.log(`  OHLC: O=${quotes.open[i]?.toFixed(2)}, H=${quotes.high[i]?.toFixed(2)}, L=${quotes.low[i]?.toFixed(2)}, C=${quotes.close[i]?.toFixed(2)}`);
        }
    }
}

debugDuplicateMonths().catch(console.error);