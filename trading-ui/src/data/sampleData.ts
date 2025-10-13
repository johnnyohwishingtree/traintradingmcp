export interface OHLCVData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate sample OHLCV data for demonstration
export const generateSampleData = (days: number = 250): OHLCVData[] => {
  const data: OHLCVData[] = [];
  let currentPrice = 100;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Simple random walk for price generation
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
};

export const sampleData = generateSampleData();