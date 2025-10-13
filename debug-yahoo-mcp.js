// Simple test script for MCP debugging
const axios = require('axios');

async function debugYahooAPI() {
    console.log('Starting Yahoo Finance API debug...');
    
    const symbol = 'SNOW';
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    
    // This should hit our breakpoint
    const response = await axios.get(`${baseUrl}/${symbol}`, {
        params: {
            period1: Math.floor(new Date('2025-09-01').getTime() / 1000),
            period2: Math.floor(new Date('2025-09-30').getTime() / 1000),
            interval: '1mo',
            includePrePost: 'false'
        }
    });
    
    console.log('Response received:', response.data.chart?.result?.[0]?.timestamp?.length);
    return response;
}

debugYahooAPI().catch(console.error);