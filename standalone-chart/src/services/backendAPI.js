import axios from 'axios';

// Backend API service
const API_BASE_URL = 'http://localhost:3001/api';

// Check if backend is available
let backendAvailable = true;

const checkBackendHealth = async () => {
  try {
    await axios.get('http://localhost:3001/health');
    backendAvailable = true;
    return true;
  } catch (error) {
    backendAvailable = false;
    return false;
  }
};

// Get OHLC data from backend cache
export const getHistoricalData = async (symbol, interval = '1day') => {
  try {
    console.log(`🔄 Fetching ${symbol}@${interval} from backend cache...`);
    
    // Check backend health first
    if (!backendAvailable && !(await checkBackendHealth())) {
      throw new Error('Backend service unavailable');
    }
    
    const response = await axios.get(`${API_BASE_URL}/data/${symbol}/${interval}`);
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      const data = response.data.data;
      const metadata = response.data.metadata;
      
      console.log(`✅ Loaded ${data.length} points for ${symbol}@${interval} from cache`);
      console.log(`📊 Data age: ${metadata.ageMinutes || 'unknown'} minutes old`);
      console.log(`📊 Price range: $${Math.min(...data.map(d => d.low)).toFixed(2)} - $${Math.max(...data.map(d => d.high)).toFixed(2)}`);
      
      return data.map(item => {
        // Store the raw UTC date - let the frontend handle timezone display
        // This preserves the actual market timestamps
        return {
          date: new Date(item.date),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        };
      });
    } else {
      throw new Error(`No cached data available for ${symbol}@${interval}`);
    }
    
  } catch (error) {
    console.error(`💥 Backend API error for ${symbol}@${interval}:`, error.message);
    
    if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
      console.error('🚨 Backend server is not running! Please start it:');
      console.error('   cd backend && npm start');
      backendAvailable = false;
    }
    
    throw new Error(`Failed to fetch ${symbol}@${interval}: ${error.message}`);
  }
};

// Enhanced search symbols with auto-download
export const searchSymbols = async (query, autoDownload = true) => {
  try {
    console.log(`🔍 Searching '${query}' via backend...`);
    
    if (!backendAvailable && !(await checkBackendHealth())) {
      throw new Error('Backend service unavailable for search');
    }
    
    // Use enhanced search with auto-download
    const downloadParam = autoDownload ? '?download=true' : '';
    const response = await axios.get(`${API_BASE_URL}/search/${encodeURIComponent(query)}${downloadParam}`);
    
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      const results = response.data.results;
      const metadata = response.data.metadata;
      
      console.log(`✅ Found ${metadata.total} symbols matching '${query}'`);
      if (metadata.justDownloaded > 0) {
        console.log(`📊 Auto-downloaded data for ${metadata.justDownloaded} new symbols`);
      }
      
      return results;
    } else if (response.data && Array.isArray(response.data)) {
      // Fallback for old format
      console.log(`✅ Found ${response.data.length} symbols matching '${query}'`);
      return response.data;
    } else {
      return [];
    }
    
  } catch (error) {
    console.error(`💥 Search error for '${query}':`, error.message);
    
    // Return empty array for search failures (graceful degradation)
    return [];
  }
};

// Download data for a specific symbol manually
export const downloadSymbolData = async (symbol, intervals = ['1day']) => {
  try {
    console.log(`📊 Downloading data for ${symbol}...`);
    
    if (!backendAvailable && !(await checkBackendHealth())) {
      throw new Error('Backend service unavailable');
    }
    
    const response = await axios.post(`${API_BASE_URL}/download/${symbol}`, {
      intervals: intervals
    });
    
    console.log(`✅ Download result for ${symbol}:`, response.data);
    return response.data;
    
  } catch (error) {
    console.error(`💥 Download error for ${symbol}:`, error.message);
    throw error;
  }
};

// Get all available symbols
export const getAllSymbols = async () => {
  try {
    if (!backendAvailable && !(await checkBackendHealth())) {
      throw new Error('Backend service unavailable');
    }
    
    const response = await axios.get(`${API_BASE_URL}/symbols`);
    return response.data || [];
    
  } catch (error) {
    console.error('💥 Error fetching symbols:', error.message);
    return [];
  }
};

// Force refresh data for a symbol/interval
export const refreshData = async (symbol, interval) => {
  try {
    console.log(`🔄 Forcing refresh for ${symbol}@${interval}...`);
    
    if (!backendAvailable && !(await checkBackendHealth())) {
      throw new Error('Backend service unavailable');
    }
    
    const response = await axios.post(`${API_BASE_URL}/refresh/${symbol}/${interval}`);
    console.log(`✅ Refresh result:`, response.data);
    return response.data;
    
  } catch (error) {
    console.error(`💥 Refresh error for ${symbol}@${interval}:`, error.message);
    throw error;
  }
};

// Backend health check
export const checkBackend = async () => {
  return await checkBackendHealth();
};