const axios = require('axios');

async function debugMonthlyData() {
    console.log('Fetching monthly data for SNOW from Yahoo Finance...\n');
    
    const symbol = 'SNOW';
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    
    // Fetch monthly data
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
    
    console.log('Raw monthly data from Yahoo:');
    console.log('============================\n');
    
    // Show last 5 months
    const lastMonths = timestamps.slice(-5);
    
    for (let i = timestamps.length - 5; i < timestamps.length; i++) {
        if (i < 0) continue;
        
        const rawTimestamp = timestamps[i];
        const rawDate = new Date(rawTimestamp * 1000);
        
        console.log(`Month ${i}:`);
        console.log(`  Raw timestamp: ${rawTimestamp}`);
        console.log(`  Raw date: ${rawDate.toISOString()}`);
        console.log(`  Raw date (local): ${rawDate.toString()}`);
        console.log(`  OHLC: O=${quotes.open[i]?.toFixed(2)}, H=${quotes.high[i]?.toFixed(2)}, L=${quotes.low[i]?.toFixed(2)}, C=${quotes.close[i]?.toFixed(2)}`);
        
        // Apply our normalization
        const monthDate = new Date(rawTimestamp * 1000);
        
        // Set to first day of the month
        monthDate.setDate(1);
        monthDate.setHours(9, 30, 0, 0);
        
        console.log(`  After setting to 1st: ${monthDate.toDateString()} (Day: ${monthDate.getDay()})`);
        
        // Find the first trading day (skip weekends)
        let dayOfWeek = monthDate.getDay();
        while (dayOfWeek === 0 || dayOfWeek === 6) {
            monthDate.setDate(monthDate.getDate() + 1);
            dayOfWeek = monthDate.getDay();
        }
        
        console.log(`  First trading day: ${monthDate.toDateString()} (Day: ${dayOfWeek})`);
        console.log(`  Normalized ISO: ${monthDate.toISOString()}`);
        console.log('');
    }
    
    // Check what month we're currently in
    const now = new Date();
    console.log('\nCurrent date analysis:');
    console.log(`  Today: ${now.toDateString()}`);
    console.log(`  Current month: ${now.getMonth() + 1} (${now.toLocaleString('default', { month: 'long' })})`);
    console.log(`  Current year: ${now.getFullYear()}`);
    
    // Check if Yahoo is returning partial month data
    const lastTimestamp = timestamps[timestamps.length - 1];
    const lastDate = new Date(lastTimestamp * 1000);
    console.log('\nLast data point from Yahoo:');
    console.log(`  Date: ${lastDate.toDateString()}`);
    console.log(`  Is current month: ${lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear()}`);
}

debugMonthlyData().catch(console.error);