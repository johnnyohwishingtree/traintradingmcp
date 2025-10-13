// Simple, safe financial data service without external dependencies
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class FinancialDataService {
  private static instance: FinancialDataService;
  private cache = new Map<string, { data: OHLCData[]; timestamp: number }>();
  
  static getInstance(): FinancialDataService {
    if (!this.instance) {
      this.instance = new FinancialDataService();
    }
    return this.instance;
  }

  // Safe method that always returns data (mock data for demo)
  async getHistoricalData(symbol: string, period: string = '30d'): Promise<OHLCData[]> {
    // Check cache first
    const cached = this.cache.get(symbol);
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    
    // Generate realistic mock data
    const data = this.generateRealisticData(symbol);
    
    // Cache the result
    this.cache.set(symbol, { data, timestamp: now });
    
    return data;
  }

  // Get current stock quote (mock data)
  async getStockQuote(symbol: string): Promise<StockData> {
    const data = await this.getHistoricalData(symbol);
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const change = latest.close - previous.close;
    const changePercent = (change / previous.close) * 100;
    
    return {
      symbol: symbol.toUpperCase(),
      name: this.getSymbolName(symbol),
      price: latest.close,
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
    };
  }

  // Search symbols (returns popular symbols filtered by query)
  async searchSymbols(query: string): Promise<StockData[]> {
    const popular = this.getPopularSymbols();
    const filtered = popular.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
    
    // Get current quotes for filtered symbols
    const withQuotes = await Promise.all(
      filtered.slice(0, 8).map(async (stock) => {
        const quote = await this.getStockQuote(stock.symbol);
        return { ...stock, ...quote };
      })
    );
    
    return withQuotes;
  }

  private generateRealisticData(symbol: string): OHLCData[] {
    const data: OHLCData[] = [];
    const basePrice = this.getSymbolBasePrice(symbol);
    let currentPrice = basePrice;
    const today = new Date();
    
    // Generate 30 days of realistic data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Market volatility simulation
      const volatility = 0.02; // 2% daily volatility
      const trend = Math.sin(i / 10) * 0.001; // Slight trending
      const change = (Math.random() - 0.5) * volatility * 2 + trend;
      
      const open = Number(currentPrice.toFixed(2));
      const close = Number((open * (1 + change)).toFixed(2));
      
      // High and low based on intraday volatility
      const intraday = Math.abs(change) * 2 + 0.005;
      const high = Number((Math.max(open, close) * (1 + intraday * Math.random())).toFixed(2));
      const low = Number((Math.min(open, close) * (1 - intraday * Math.random())).toFixed(2));
      const volume = Math.floor(Math.random() * 50000000) + 5000000;
      
      data.push({
        date: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume
      });
      
      currentPrice = close;
    }
    
    return data;
  }

  private getSymbolBasePrice(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'SPY': 450,
      'AAPL': 175,
      'GOOGL': 140,
      'MSFT': 380,
      'TSLA': 250,
      'NVDA': 450,
      'AMZN': 145,
      'META': 320,
      'BTC-USD': 43000,
      'ETH-USD': 2300
    };
    return basePrices[symbol.toUpperCase()] || (Math.random() * 200 + 50);
  }

  private getSymbolName(symbol: string): string {
    const names: { [key: string]: string } = {
      'SPY': 'SPDR S&P 500 ETF',
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corporation',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
      'BTC-USD': 'Bitcoin USD',
      'ETH-USD': 'Ethereum USD'
    };
    return names[symbol.toUpperCase()] || symbol.toUpperCase();
  }

  // Fallback popular symbols
  getPopularSymbols(): StockData[] {
    return [
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF', price: 0, change: 0, changePercent: 0 },
      { symbol: 'AAPL', name: 'Apple Inc.', price: 0, change: 0, changePercent: 0 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', price: 0, change: 0, changePercent: 0 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 0, change: 0, changePercent: 0 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 0, change: 0, changePercent: 0 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 0, change: 0, changePercent: 0 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 0, change: 0, changePercent: 0 },
      { symbol: 'META', name: 'Meta Platforms Inc.', price: 0, change: 0, changePercent: 0 },
      { symbol: 'BTC-USD', name: 'Bitcoin USD', price: 0, change: 0, changePercent: 0 },
      { symbol: 'ETH-USD', name: 'Ethereum USD', price: 0, change: 0, changePercent: 0 },
    ];
  }

  // Fallback quote data
  static getFallbackQuote(symbol: string): StockData {
    const popular = this.getPopularSymbols().find(s => s.symbol === symbol.toUpperCase());
    if (popular) {
      return {
        ...popular,
        price: Math.random() * 200 + 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
      };
    }
    
    return {
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      price: Math.random() * 200 + 50,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
    };
  }

  // Generate sample data as fallback
  static generateSampleData(symbol: string, days: number = 250): OHLCData[] {
    const data: OHLCData[] = [];
    let currentPrice = Math.random() * 200 + 50;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const change = (Math.random() - 0.5) * 4;
      currentPrice = Math.max(10, currentPrice + change);
      
      const open = currentPrice;
      const volatility = Math.random() * 2 + 0.5;
      const high = open + Math.random() * volatility;
      const low = open - Math.random() * volatility;
      const close = low + Math.random() * (high - low);
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      currentPrice = close;

      data.push({
        date,
        open,
        high,
        low,
        close,
        volume
      });
    }

    return data;
  }
}