const express = require('express');
const cors = require('cors');
const DatabaseFactory = require('./services/database-factory');
const SymbolSearchEnhanced = require('./symbol-search-enhanced');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services - Use PostgreSQL by default
const db = DatabaseFactory.create('postgres');
const symbolSearch = new SymbolSearchEnhanced(db);

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'chart-data-backend'
  });
});

// Get OHLC data for a symbol and interval with auto-download
app.get('/api/data/:symbol/:interval', async (req, res) => {
  try {
    const { symbol, interval } = req.params;
    // Set appropriate default limits based on interval type
    let defaultLimit;
    if (['1day', '1week', '1month'].includes(interval)) {
      defaultLimit = 99999; // Get all historical data for daily/weekly/monthly
    } else {
      defaultLimit = 5000; // Higher limit for intraday data
    }
    const limit = parseInt(req.query.limit) || defaultLimit;
    const upperSymbol = symbol.toUpperCase();
    
    console.log(`📊 API Request: ${upperSymbol}@${interval} (limit: ${limit})`);
    
    // Check if we have any data and if it's stale
    let data = await db.getOHLCData(upperSymbol, interval, limit);
    const ageInfo = await db.getDataAge(upperSymbol, interval);
    
    let needsDownload = false;
    let downloadReason = '';
    
    if (data.length === 0) {
      needsDownload = true;
      downloadReason = 'No data available';
      console.log(`   ⚠️ No data found for ${upperSymbol}@${interval} - will auto-download`);
    } else if (ageInfo) {
      // Determine staleness threshold based on interval type
      let staleThresholdMinutes;
      const isIntraday = ['1min', '5min', '15min', '30min', '60min'].includes(interval);
      
      if (isIntraday) {
        // For intraday data during market hours, refresh every 2 minutes
        staleThresholdMinutes = 2;
      } else if (interval === '1day') {
        // For daily data, refresh every 6 hours to prevent excessive updates
        staleThresholdMinutes = 6 * 60;
      } else {
        // For weekly/monthly, refresh every 24 hours
        staleThresholdMinutes = 24 * 60;
      }
      
      if (ageInfo.age_minutes > staleThresholdMinutes) {
        needsDownload = true;
        if (isIntraday) {
          downloadReason = `Data is ${Math.round(ageInfo.age_minutes)} minutes old`;
          console.log(`   ⚠️ Stale intraday data for ${upperSymbol}@${interval} (${Math.round(ageInfo.age_minutes)}min old) - will update`);
        } else {
          downloadReason = `Data is ${Math.round(ageInfo.age_minutes / 60)} hours old`;
          console.log(`   ⚠️ Stale data for ${upperSymbol}@${interval} (${Math.round(ageInfo.age_minutes / 60)}h old) - will update`);
        }
      }
    }
    
    // Auto-download if needed
    if (needsDownload) {
      console.log(`   📥 Auto-downloading ${upperSymbol}@${interval} (${downloadReason})`);
      
      try {
        const downloadResult = await symbolSearch.downloadSymbolData(upperSymbol, [interval]);
        
        if (downloadResult.success) {
          console.log(`   ✅ Auto-download successful for ${upperSymbol}@${interval}`);
          // Fetch the updated data
          data = await db.getOHLCData(upperSymbol, interval, limit);
          
          // Get updated age info
          const updatedAgeInfo = await db.getDataAge(upperSymbol, interval);
          
          console.log(`✅ Returning ${data.length} data points for ${upperSymbol}@${interval} (freshly downloaded)`);
          
          return res.json({
            symbol: upperSymbol,
            interval,
            data,
            metadata: {
              points: data.length,
              cached: false,
              autoDownloaded: true,
              downloadReason,
              lastUpdate: updatedAgeInfo?.last_successful_fetch,
              ageMinutes: updatedAgeInfo?.age_minutes ? Math.round(updatedAgeInfo.age_minutes) : 0
            }
          });
          
        } else {
          console.log(`   ❌ Auto-download failed for ${upperSymbol}@${interval}: ${downloadResult.error}`);
          
          // Still return any existing data if download failed
          if (data.length > 0) {
            console.log(`   📊 Returning ${data.length} existing data points despite download failure`);
            
            return res.json({
              symbol: upperSymbol,
              interval,
              data,
              metadata: {
                points: data.length,
                cached: true,
                downloadFailed: true,
                downloadError: downloadResult.error,
                lastUpdate: ageInfo?.last_successful_fetch,
                ageMinutes: ageInfo?.age_minutes ? Math.round(ageInfo.age_minutes) : null
              }
            });
          } else {
            // No existing data and download failed
            return res.status(404).json({ 
              error: 'No data available',
              message: `Failed to fetch data for ${upperSymbol}@${interval}: ${downloadResult.error}`,
              autoDownloadAttempted: true
            });
          }
        }
        
      } catch (downloadError) {
        console.error(`   💥 Auto-download error for ${upperSymbol}@${interval}:`, downloadError.message);
        
        // Return existing data if available, otherwise error
        if (data.length > 0) {
          return res.json({
            symbol: upperSymbol,
            interval,
            data,
            metadata: {
              points: data.length,
              cached: true,
              downloadFailed: true,
              downloadError: downloadError.message,
              lastUpdate: ageInfo?.last_successful_fetch,
              ageMinutes: ageInfo?.age_minutes ? Math.round(ageInfo.age_minutes) : null
            }
          });
        } else {
          return res.status(500).json({ 
            error: 'Failed to fetch data',
            message: downloadError.message,
            autoDownloadAttempted: true
          });
        }
      }
    }
    
    // Return existing fresh data
    console.log(`✅ Returning ${data.length} data points for ${upperSymbol}@${interval} (cached, fresh)`);
    
    res.json({
      symbol: upperSymbol,
      interval,
      data,
      metadata: {
        points: data.length,
        cached: true,
        autoDownloaded: false,
        lastUpdate: ageInfo?.last_successful_fetch,
        ageMinutes: ageInfo?.age_minutes ? Math.round(ageInfo.age_minutes) : null
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      message: error.message 
    });
  }
});

// Enhanced symbol search with auto-download
app.get('/api/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    // Enable auto-download by default, allow disabling with ?download=false
    const autoDownload = req.query.download !== 'false'; 
    // Include multiple intervals by default for complete data
    const intervals = req.query.intervals ? req.query.intervals.split(',') : ['1day', '1week', '1month'];
    
    console.log(`🔍 Enhanced symbol search: ${query} (auto-download: ${autoDownload}, intervals: ${intervals.join(', ')})`);
    
    // Use enhanced search with auto-download capability
    const searchResult = await symbolSearch.searchAndDownload(query, autoDownload, intervals);
    
    console.log(`✅ Found ${searchResult.total} symbols (${searchResult.inDatabase} in DB, ${searchResult.justDownloaded || 0} downloaded)`);
    
    res.json({
      query: searchResult.query,
      results: searchResult.results,
      metadata: {
        total: searchResult.total,
        inDatabase: searchResult.inDatabase,
        justDownloaded: searchResult.justDownloaded || 0,
        autoDownload: autoDownload
      }
    });
    
  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message 
    });
  }
});

// Dedicated endpoint to download symbol data
app.post('/api/download/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { intervals = ['1day'] } = req.body;
    
    console.log(`📊 Manual download request: ${symbol}`);
    
    const result = await symbolSearch.downloadSymbolData(symbol.toUpperCase(), intervals);
    
    res.json(result);
    
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).json({ 
      error: 'Download failed',
      message: error.message 
    });
  }
});

// Get all available symbols
app.get('/api/symbols', async (req, res) => {
  try {
    const symbols = await db.getAllSymbols();
    res.json(symbols);
  } catch (error) {
    console.error('Symbols Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch symbols',
      message: error.message 
    });
  }
});

// Delete all data for a symbol
app.delete('/api/symbols/:symbol/data', async (req, res) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    
    console.log(`🗑️ Delete request for ${upperSymbol} - removing all cached data`);
    
    // Delete all OHLC data for this symbol across all intervals
    const result = await db.deleteSymbolData(upperSymbol);
    
    console.log(`✅ Deleted ${result.deletedRows} data rows for ${upperSymbol}`);
    
    res.json({
      symbol: upperSymbol,
      deletedRows: result.deletedRows,
      message: `Successfully deleted all data for ${upperSymbol}`
    });
    
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete symbol data',
      message: error.message 
    });
  }
});

// Refresh all data for a symbol from Yahoo Finance
app.post('/api/symbols/:symbol/refresh', async (req, res) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    
    console.log(`🔄 Refresh request for ${upperSymbol} - fetching all data from Yahoo Finance`);
    
    // Import the Yahoo Finance incremental class
    const YahooFinanceIncremental = require('./yahoo-finance-incremental');
    const yahooFetcher = new YahooFinanceIncremental(db);
    
    let totalDataPoints = 0;
    const intervals = ['1day', '1week', '1month', '60min', '5min', '15min', '30min']; // All intervals to refresh
    
    // Refresh data for each interval with forceFullRefresh = true
    for (const interval of intervals) {
      console.log(`  📊 Refreshing ${upperSymbol}@${interval}...`);
      try {
        const result = await yahooFetcher.updateSymbolData(upperSymbol, interval, true);
        if (result && result.newPoints) {
          totalDataPoints += result.newPoints;
          console.log(`  ✅ ${upperSymbol}@${interval}: ${result.newPoints} data points`);
        }
      } catch (intervalError) {
        console.error(`  ❌ Failed to refresh ${upperSymbol}@${interval}:`, intervalError.message);
        // Continue with other intervals even if one fails
      }
    }
    
    console.log(`✅ Refreshed ${upperSymbol} with ${totalDataPoints} total data points from Yahoo Finance`);
    
    res.json({
      symbol: upperSymbol,
      totalDataPoints,
      intervals: intervals.length,
      message: `Successfully refreshed all data for ${upperSymbol} from Yahoo Finance`
    });
    
  } catch (error) {
    console.error('Refresh Error:', error);
    res.status(500).json({ 
      error: 'Failed to refresh symbol data',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Chart Data Backend Server`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_TYPE || 'PostgreSQL'} with Yahoo Finance cache`);
  console.log(`💾 Data Source: Yahoo Finance (cached)`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  GET  /health                    - Health check`);
  console.log(`  GET  /api/data/:symbol/:interval - Get OHLC data`);
  console.log(`  GET  /api/search/:query         - Search symbols`);
  console.log(`  GET  /api/symbols               - List all symbols`);
  console.log(`\n✅ Ready to serve cached market data!`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  await db.close();
  process.exit(0);
});