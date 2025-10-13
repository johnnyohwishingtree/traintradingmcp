const axios = require('axios');
const YahooFinanceIncremental = require('./yahoo-finance-incremental');

class SymbolSearchEnhanced {
  constructor(database) {
    this.db = database;
    this.yahooUpdater = new YahooFinanceIncremental(database);
    
    // Yahoo Finance symbol search API
    this.searchUrl = 'https://query1.finance.yahoo.com/v1/finance/search';
    
    // Common exchanges and their display names
    this.exchanges = {
      'NMS': 'NASDAQ',
      'NYQ': 'NYSE', 
      'PCX': 'NYSE Arca',
      'BTS': 'BATS',
      'ASE': 'NYSE American',
      'PNK': 'OTC Pink'
    };
  }

  /**
   * Search symbols using Yahoo Finance API
   */
  async searchYahooSymbols(query) {
    try {
      console.log(`🔍 Searching Yahoo Finance for: ${query}`);
      
      const response = await axios.get(this.searchUrl, {
        params: {
          q: query,
          lang: 'en-US',
          region: 'US',
          quotesCount: 10,
          newsCount: 0,
          enableFuzzyQuery: false,
          quotesQueryId: 'tss_match_phrase_query',
          enableCb: false,
          enableNavLinks: false,
          enableEnhancedTrivialQuery: true
        },
        timeout: 5000
      });

      const quotes = response.data?.quotes || [];
      
      return quotes
        .filter(quote => quote.typeDisp === 'Equity') // Only stocks
        .map(quote => ({
          symbol: quote.symbol,
          shortName: quote.shortname || quote.longname || quote.symbol,
          typeDisp: quote.typeDisp || 'Stock',
          exchange: this.exchanges[quote.exchDisp] || quote.exchDisp || 'Unknown',
          market: quote.market || 'us_market',
          isYahooFinance: quote.isYahooFinance || false,
          inDatabase: false // Will be updated after checking DB
        }));
        
    } catch (error) {
      console.error(`❌ Yahoo search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Search symbols in local database
   */
  async searchLocalSymbols(query) {
    try {
      const allSymbols = await this.db.getAllSymbols();
      
      const filtered = allSymbols.filter(symbol => 
        symbol.symbol.toLowerCase().includes(query.toLowerCase()) ||
        (symbol.name && symbol.name.toLowerCase().includes(query.toLowerCase()))
      );
      
      return filtered.map(symbol => ({
        symbol: symbol.symbol,
        shortName: symbol.name || symbol.symbol,
        typeDisp: symbol.type || 'Stock',
        exchange: symbol.exchange || 'Unknown',
        market: 'us_market',
        isYahooFinance: true,
        inDatabase: true
      }));
      
    } catch (error) {
      console.error(`❌ Local search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if symbol data is stale (needs updating)
   */
  async isDataStale(symbol, maxAgeHours = 24) {
    try {
      const lastDatapoint = await this.yahooUpdater.getLastDatapoint(symbol, '1day');
      if (!lastDatapoint) return true; // No data = definitely stale
      
      const ageHours = (Date.now() - lastDatapoint.getTime()) / (1000 * 60 * 60);
      return ageHours > maxAgeHours;
    } catch (error) {
      return true; // Error checking = assume stale
    }
  }

  /**
   * Combined search: local DB + Yahoo Finance with staleness check
   */
  async searchSymbols(query) {
    console.log(`🔍 Enhanced symbol search: ${query}`);
    
    try {
      // Search both local and Yahoo Finance in parallel
      const [localResults, yahooResults] = await Promise.all([
        this.searchLocalSymbols(query),
        this.searchYahooSymbols(query)
      ]);
      
      // Create a map to merge results (prioritize local DB)
      const symbolMap = new Map();
      
      // Add local results first, but check if data is stale
      for (const result of localResults) {
        const isStale = await this.isDataStale(result.symbol);
        result.isStale = isStale;
        result.needsUpdate = isStale;
        symbolMap.set(result.symbol, result);
      }
      
      // Add Yahoo results if not already in local DB
      yahooResults.forEach(result => {
        if (!symbolMap.has(result.symbol)) {
          result.needsUpdate = true; // New symbols always need data
          symbolMap.set(result.symbol, result);
        }
      });
      
      // Convert back to array and sort
      const combinedResults = Array.from(symbolMap.values())
        .sort((a, b) => {
          // Sort: local DB first, then by symbol match relevance
          if (a.inDatabase && !b.inDatabase) return -1;
          if (!a.inDatabase && b.inDatabase) return 1;
          
          // Both in same category, sort by symbol match quality
          const aExact = a.symbol.toLowerCase() === query.toLowerCase();
          const bExact = b.symbol.toLowerCase() === query.toLowerCase();
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Sort alphabetically
          return a.symbol.localeCompare(b.symbol);
        });
      
      console.log(`   ✅ Found ${combinedResults.length} symbols (${localResults.length} local, ${yahooResults.length} Yahoo)`);
      
      // Log stale data info
      const staleCount = combinedResults.filter(r => r.isStale).length;
      if (staleCount > 0) {
        console.log(`   ⚠️ ${staleCount} symbols have stale data and will be updated`);
      }
      
      return combinedResults;
      
    } catch (error) {
      console.error(`❌ Symbol search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Auto-download data for a symbol when requested
   */
  async downloadSymbolData(symbol, intervals = ['1day']) {
    console.log(`\\n📊 Auto-downloading data for ${symbol}...`);
    
    try {
      // Check if symbol exists in database
      const symbolRecord = await this.db.getOrCreateSymbol(symbol);
      
      // Separate monthly from other intervals since we ALWAYS generate monthly from daily data
      const nonMonthlyIntervals = intervals.filter(interval => interval !== '1month');
      const hasMonthly = intervals.includes('1month');
      
      // Fetch non-monthly data from Yahoo API
      let results = { updated: [], upToDate: [], failed: [], totalNewPoints: 0 };
      
      if (nonMonthlyIntervals.length > 0) {
        results = await this.yahooUpdater.updateMultipleSymbols(
          [symbol],
          nonMonthlyIntervals,
          true // Force refresh
        );
      }
      
      // ALWAYS generate monthly data from daily aggregation (never use Yahoo monthly API)
      if (hasMonthly) {
        console.log(`   📊 Generating monthly data from daily aggregation for ${symbol}`);
        
        // First ensure we have recent daily data
        if (!nonMonthlyIntervals.includes('1day')) {
          console.log(`   📅 Fetching daily data first for monthly aggregation...`);
          const dailyResults = await this.yahooUpdater.updateMultipleSymbols(
            [symbol],
            ['1day'],
            true // Force refresh
          );
          results.totalNewPoints += dailyResults.totalNewPoints || 0;
        }
        
        // Now generate monthly from daily
        await this.yahooUpdater.fixMonthlyDataFromDaily(symbol);
        results.updated.push(`${symbol}@1month`);
        console.log(`   ✅ Monthly data generated from daily aggregation`);
      }
      
      if (results.updated.length > 0 || results.upToDate.length > 0) {
        console.log(`   ✅ ${symbol} data ready (${results.totalNewPoints} new points)`);
        return { 
          success: true, 
          symbol, 
          dataPoints: results.totalNewPoints,
          status: results.updated.length > 0 ? 'downloaded' : 'already_exists'
        };
      } else {
        console.log(`   ❌ Failed to download ${symbol} data`);
        return { 
          success: false, 
          symbol, 
          error: 'No data available'
        };
      }
      
    } catch (error) {
      console.error(`   ❌ Download failed for ${symbol}: ${error.message}`);
      return { 
        success: false, 
        symbol, 
        error: error.message 
      };
    }
  }

  /**
   * Enhanced search with auto-download option
   */
  async searchAndDownload(query, autoDownload = false, intervals = ['1day']) {
    console.log(`\\n🔍 ENHANCED SYMBOL SEARCH: ${query}`);
    console.log(`📥 Auto-download: ${autoDownload ? 'YES' : 'NO'}`);
    
    // First, get search results
    const searchResults = await this.searchSymbols(query);
    
    if (autoDownload && searchResults.length > 0) {
      console.log(`\\n📊 Auto-downloading data for search results...`);
      
      // Download data for symbols that need updates (new symbols OR stale data)
      const symbolsToUpdate = searchResults
        .filter(result => result.needsUpdate || !result.inDatabase)
        .slice(0, 5); // Limit to first 5 results to avoid overwhelming
      
      if (symbolsToUpdate.length > 0) {
        console.log(`   🔄 Updating ${symbolsToUpdate.length} symbols (${symbolsToUpdate.filter(s => s.isStale).length} stale, ${symbolsToUpdate.filter(s => !s.inDatabase).length} new)`);
        
        const downloadPromises = symbolsToUpdate.map(result => 
          this.downloadSymbolData(result.symbol, intervals)
        );
        
        const downloadResults = await Promise.all(downloadPromises);
        
        // Update the search results with download status
        searchResults.forEach(result => {
          const downloadResult = downloadResults.find(dr => dr.symbol === result.symbol);
          if (downloadResult && downloadResult.success) {
            result.inDatabase = true;
            result.justDownloaded = true;
            result.isStale = false; // No longer stale after update
          }
        });
        
        const successful = downloadResults.filter(r => r.success).length;
        console.log(`   ✅ Auto-updated data for ${successful}/${downloadResults.length} symbols`);
      } else {
        console.log(`   ✅ All symbols have current data`);
      }
    }
    
    return {
      query,
      results: searchResults,
      total: searchResults.length,
      inDatabase: searchResults.filter(r => r.inDatabase).length,
      justDownloaded: searchResults.filter(r => r.justDownloaded).length
    };
  }
}

module.exports = SymbolSearchEnhanced;