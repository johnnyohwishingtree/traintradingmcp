import React, { useState } from 'react';
import './TradingViewApp.css';
import TradingHeader from './components/TradingView/TradingHeader';
import LeftSidebar from './components/TradingView/LeftSidebar';
import ChartArea from './components/TradingView/ChartArea';
import RightSidebar from './components/TradingView/RightSidebar';
import BottomPanel from './components/TradingView/BottomPanel';
import { sampleData } from './data/sampleData';

export interface DrawingTool {
  id: string;
  type: 'trendline' | 'fibonacci' | 'rectangle' | 'channel' | 'gann';
  active: boolean;
}

export interface TimeFrame {
  label: string;
  value: string;
  active: boolean;
}

export interface Symbol {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const TradingViewApp: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol>({
    symbol: 'AAPL',
    price: 175.43,
    change: 2.17,
    changePercent: 1.25
  });

  const [timeframes] = useState<TimeFrame[]>([
    { label: '1m', value: '1m', active: false },
    { label: '5m', value: '5m', active: false },
    { label: '15m', value: '15m', active: false },
    { label: '1H', value: '1H', active: false },
    { label: '4H', value: '4H', active: false },
    { label: '1D', value: '1D', active: true },
    { label: '1W', value: '1W', active: false },
    { label: '1M', value: '1M', active: false },
  ]);

  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area' | 'bars'>('candlestick');
  const [showVolume, setShowVolume] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);

  return (
    <div className="tradingview-app">
      <TradingHeader
        symbol={selectedSymbol}
        timeframes={timeframes}
        onSymbolChange={setSelectedSymbol}
        chartType={chartType}
        onChartTypeChange={setChartType}
      />
      
      <div className="tradingview-main">
        <LeftSidebar
          activeDrawingTool={activeDrawingTool}
          onDrawingToolChange={setActiveDrawingTool}
          selectedIndicators={selectedIndicators}
          onIndicatorToggle={setSelectedIndicators}
        />
        
        <div className="tradingview-center">
          <ChartArea
            data={sampleData}
            symbol={selectedSymbol}
            chartType={chartType}
            activeDrawingTool={activeDrawingTool}
            selectedIndicators={selectedIndicators}
            showVolume={showVolume}
          />
          
          {showVolume && (
            <BottomPanel
              data={sampleData}
              selectedIndicators={selectedIndicators}
            />
          )}
        </div>
        
        <RightSidebar
          symbol={selectedSymbol}
        />
      </div>
    </div>
  );
};

export default TradingViewApp;