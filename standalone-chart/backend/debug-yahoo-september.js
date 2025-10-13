const axios = require('axios');

async function debugYahooSeptember() {
    console.log('🔍 Debugging Yahoo Finance API calls for SNOW September data\n');
    
    const symbol = 'SNOW';
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    
    // 1. Get daily data for September 2025
    console.log('1. Fetching DAILY data for September 2025:');
    console.log('==============================================');
    
    const septStart = Math.floor(new Date('2025-09-01').getTime() / 1000);
    const septEnd = Math.floor(new Date('2025-09-30').getTime() / 1000);
    
    console.log(`Period: ${new Date(septStart * 1000).toISOString()} to ${new Date(septEnd * 1000).toISOString()}`);
    
    const dailyResponse = await axios.get(`${baseUrl}/${symbol}`, {
        params: {
            period1: septStart,
            period2: septEnd,
            interval: '1d',
            includePrePost: 'false'
        }
    });
    
    const dailyData = dailyResponse.data.chart?.result?.[0];
    const dailyTimestamps = dailyData.timestamp || [];
    const dailyQuotes = dailyData.indicators?.quote?.[0] || {};
    
    console.log(`Daily data points: ${dailyTimestamps.length}`);
    
    let dailyLow = Infinity;
    let dailyHigh = -Infinity;
    let dailyOpen = null;
    let dailyClose = null;
    
    for (let i = 0; i < dailyTimestamps.length; i++) {
        const date = new Date(dailyTimestamps[i] * 1000);
        const open = dailyQuotes.open[i];
        const high = dailyQuotes.high[i];
        const low = dailyQuotes.low[i];
        const close = dailyQuotes.close[i];
        
        if (dailyOpen === null) dailyOpen = open;
        dailyClose = close;
        
        if (high > dailyHigh) dailyHigh = high;
        if (low < dailyLow) dailyLow = low;
        
        console.log(`  ${date.toDateString()}: O=${open?.toFixed(2)}, H=${high?.toFixed(2)}, L=${low?.toFixed(2)}, C=${close?.toFixed(2)}`);
    }
    
    console.log(`\nSeptember Daily Aggregated: O=${dailyOpen?.toFixed(2)}, H=${dailyHigh.toFixed(2)}, L=${dailyLow.toFixed(2)}, C=${dailyClose?.toFixed(2)}`);
    
    // 2. Get monthly data from Yahoo
    console.log('\n\n2. Fetching MONTHLY data from Yahoo Finance:');
    console.log('===============================================');
    
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
    
    // Find September in monthly data
    for (let i = 0; i < monthlyTimestamps.length; i++) {
        const date = new Date(monthlyTimestamps[i] * 1000);
        if (date.getMonth() === 8 && date.getFullYear() === 2025) { // September = month 8
            const open = monthlyQuotes.open[i];
            const high = monthlyQuotes.high[i];
            const low = monthlyQuotes.low[i];
            const close = monthlyQuotes.close[i];
            
            console.log(`Yahoo Monthly September: ${date.toISOString()}`);
            console.log(`  O=${open?.toFixed(2)}, H=${high?.toFixed(2)}, L=${low?.toFixed(2)}, C=${close?.toFixed(2)}`);
            
            // Compare with daily aggregation
            console.log('\n🔍 COMPARISON:');
            console.log(`Daily aggregated:  O=${dailyOpen?.toFixed(2)}, H=${dailyHigh.toFixed(2)}, L=${dailyLow.toFixed(2)}, C=${dailyClose?.toFixed(2)}`);
            console.log(`Yahoo monthly:     O=${open?.toFixed(2)}, H=${high?.toFixed(2)}, L=${low?.toFixed(2)}, C=${close?.toFixed(2)}`);
            
            console.log('\nDiscrepancies:');
            if (Math.abs(dailyOpen - open) > 1) console.log(`  ❌ Open: Daily=${dailyOpen?.toFixed(2)} vs Monthly=${open?.toFixed(2)}`);
            if (Math.abs(dailyHigh - high) > 1) console.log(`  ❌ High: Daily=${dailyHigh.toFixed(2)} vs Monthly=${high?.toFixed(2)}`);
            if (Math.abs(dailyLow - low) > 1) console.log(`  ❌ Low: Daily=${dailyLow.toFixed(2)} vs Monthly=${low?.toFixed(2)}`);
            if (Math.abs(dailyClose - close) > 1) console.log(`  ❌ Close: Daily=${dailyClose?.toFixed(2)} vs Monthly=${close?.toFixed(2)}`);
            
            break;
        }
    }
}

debugYahooSeptember().catch(console.error);