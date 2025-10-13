// Debug the Yahoo Finance monthly data issue
const axios = require('axios');

async function debugMonthlyIssue() {
    console.log('🔍 Debugging Yahoo Finance monthly data issue');
    
    const symbol = 'SNOW';
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    
    // Fetch monthly data - this is what our app does
    console.log('1. Fetching monthly data...');
    const monthlyResponse = await axios.get(`${baseUrl}/${symbol}`, {
        params: {
            period1: Math.floor(new Date('2025-01-01').getTime() / 1000),
            period2: Math.floor(Date.now() / 1000),
            interval: '1mo',
            includePrePost: 'false'
        }
    });
    
    const monthlyData = monthlyResponse.data.chart?.result?.[0];
    const monthlyTimestamps = monthlyData.timestamp || [];
    const monthlyQuotes = monthlyData.indicators?.quote?.[0] || {};
    
    // Find September data
    for (let i = 0; i < monthlyTimestamps.length; i++) {
        const timestamp = monthlyTimestamps[i];
        const date = new Date(timestamp * 1000);
        
        if (date.getMonth() === 8 && date.getFullYear() === 2025) { // September
            console.log('Found September monthly data:');
            console.log('  Timestamp:', timestamp);
            console.log('  Date:', date.toISOString());
            console.log('  OHLC:', {
                open: monthlyQuotes.open[i],
                high: monthlyQuotes.high[i], 
                low: monthlyQuotes.low[i],
                close: monthlyQuotes.close[i]
            });
            break;
        }
    }
    
    console.log('Debug complete');
}

debugMonthlyIssue().catch(console.error);