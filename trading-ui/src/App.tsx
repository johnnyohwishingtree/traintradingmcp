import React, { useState, useEffect } from 'react';
import DrawingToolbar from './components/DrawingToolbar';
import IndicatorsButton from './components/IndicatorsButton';
import SimpleSymbolDisplay from './components/SimpleSymbolDisplay';
import TradingViewChart from './components/TradingViewChart';
import './App.css';

const App: React.FC = () => {
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('SPY');
  const [chartData, setChartData] = useState([
    { date: '2024-08-26', open: 450, high: 458, low: 447, close: 455, volume: 12500000 },
    { date: '2024-08-27', open: 455, high: 462, low: 451, close: 459, volume: 11800000 },
    { date: '2024-08-28', open: 459, high: 465, low: 456, close: 463, volume: 13200000 },
    { date: '2024-08-29', open: 463, high: 469, low: 460, close: 467, volume: 14100000 },
    { date: '2024-08-30', open: 467, high: 472, low: 464, close: 470, volume: 12900000 }
  ]);
  const [loading, setLoading] = useState(false);

  // Mock data generator for different symbols
  const generateMockData = (symbol: string) => {
    const basePrices: { [key: string]: number } = {
      'SPY': 450,
      'AAPL': 175,
      'GOOGL': 140,
      'MSFT': 380,
      'TSLA': 250,
      'NVDA': 450
    };
    
    const basePrice = basePrices[symbol] || 100;
    const data = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      const variation = (Math.random() - 0.5) * 0.05; // ±2.5% daily variation
      const open = basePrice * (1 + variation);
      const volatility = basePrice * 0.02; // 2% intraday volatility
      
      const high = open + Math.random() * volatility;
      const low = open - Math.random() * volatility;
      const close = low + Math.random() * (high - low);
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 20000000) + 5000000
      });
    }
    
    return data;
  };

  // Load data when symbol changes
  useEffect(() => {
    const loadSymbolData = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newData = generateMockData(selectedSymbol);
      setChartData(newData);
      setLoading(false);
    };
    
    loadSymbolData();
  }, [selectedSymbol]);

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-left">
          <SimpleSymbolDisplay 
            selectedSymbol={selectedSymbol}
            onSymbolChange={setSelectedSymbol}
          />
        </div>
        <div className="header-center">
          <IndicatorsButton 
            selectedIndicators={selectedIndicators}
            onIndicatorToggle={setSelectedIndicators}
          />
        </div>
        <div className="header-right">
          <button className="header-btn">Alert</button>
          <button className="header-btn">Replay</button>
        </div>
      </div>

      <div className="app-main">
        <DrawingToolbar 
          activeDrawingTool={activeDrawingTool}
          onDrawingToolChange={setActiveDrawingTool}
        />
        
        <div className="chart-area">
          <TradingViewChart 
            data={chartData}
            selectedIndicators={selectedIndicators}
            activeDrawingTool={activeDrawingTool}
            symbol={selectedSymbol}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default App
