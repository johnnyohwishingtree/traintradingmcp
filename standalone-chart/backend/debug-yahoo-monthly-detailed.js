// Comprehensive analysis of Yahoo Finance monthly data
const axios = require('axios');

async function analyzeYahooMonthlyData() {
    console.log('🔍 Detailed analysis of Yahoo Finance monthly data for SNOW');
    console.log('============================================================\n');
    
    const symbol = 'SNOW';
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    
    // Get last 12 months of monthly data
    const response = await axios.get(`${baseUrl}/${symbol}`, {
        params: {
            period1: Math.floor(new Date('2024-01-01').getTime() / 1000),
            period2: Math.floor(Date.now() / 1000),
            interval: '1mo',
            includePrePost: 'false'
        }
    });
    
    const chartData = response.data.chart?.result?.[0];
    const timestamps = chartData.timestamp || [];
    const quotes = chartData.indicators?.quote?.[0] || {};
    
    console.log('Raw Yahoo Finance Monthly Data Analysis:');
    console.log('========================================\n');
    
    // Analyze each monthly entry
    for (let i = Math.max(0, timestamps.length - 24); i < timestamps.length; i++) {
        const rawTimestamp = timestamps[i];
        const rawDate = new Date(rawTimestamp * 1000);
        
        console.log(`Entry ${i}:`);
        console.log(`  Raw timestamp: ${rawTimestamp}`);
        console.log(`  Raw date: ${rawDate.toISOString()}`);
        console.log(`  Local date: ${rawDate.toDateString()}`);
        console.log(`  Year: ${rawDate.getFullYear()}, Month: ${rawDate.getMonth() + 1}, Day: ${rawDate.getDate()}`);
        console.log(`  OHLC: O=${quotes.open[i]?.toFixed(2)}, H=${quotes.high[i]?.toFixed(2)}, L=${quotes.low[i]?.toFixed(2)}, C=${quotes.close[i]?.toFixed(2)}`);
        
        // Try to determine which month this data represents by looking at the timestamp
        const timestampMonth = rawDate.getMonth() + 1;
        const timestampDay = rawDate.getDate();
        
        // If it's early in the month, it's likely the current month
        // If it's late/end of month, it's likely data FOR that month
        if (timestampDay <= 5) {
            console.log(`  ➡️ Likely represents: ${timestampMonth === 1 ? 12 : timestampMonth - 1}/${rawDate.getFullYear()} (previous month)`);
        } else {
            console.log(`  ➡️ Likely represents: ${timestampMonth}/${rawDate.getFullYear()} (same month)`);
        }
        console.log('');
    }
    
    // Now let's fetch some weekly data to compare September
    console.log('\n🔍 Fetching weekly data for September 2025 comparison:');
    console.log('====================================================');
    
    const weeklyResponse = await axios.get(`${baseUrl}/${symbol}`, {
        params: {
            period1: Math.floor(new Date('2025-09-01').getTime() / 1000),
            period2: Math.floor(new Date('2025-09-30').getTime() / 1000),
            interval: '1wk',
            includePrePost: 'false'
        }
    });
    
    const weeklyData = weeklyResponse.data.chart?.result?.[0];
    const weeklyTimestamps = weeklyData.timestamp || [];
    const weeklyQuotes = weeklyData.indicators?.quote?.[0] || {};
    
    let septHigh = -Infinity;
    let septLow = Infinity;
    let septOpen = null;
    let septClose = null;
    
    console.log('September 2025 weekly data:');
    for (let i = 0; i < weeklyTimestamps.length; i++) {
        const weekDate = new Date(weeklyTimestamps[i] * 1000);
        const open = weeklyQuotes.open[i];
        const high = weeklyQuotes.high[i];
        const low = weeklyQuotes.low[i];
        const close = weeklyQuotes.close[i];
        
        if (septOpen === null) septOpen = open;
        septClose = close;
        if (high > septHigh) septHigh = high;
        if (low < septLow) septLow = low;
        
        console.log(`  Week ${weekDate.toDateString()}: O=${open?.toFixed(2)}, H=${high?.toFixed(2)}, L=${low?.toFixed(2)}, C=${close?.toFixed(2)}`);
    }
    
    console.log(`\nSeptember 2025 aggregated from weekly: O=${septOpen?.toFixed(2)}, H=${septHigh.toFixed(2)}, L=${septLow.toFixed(2)}, C=${septClose?.toFixed(2)}`);
}

analyzeYahooMonthlyData().catch(console.error);