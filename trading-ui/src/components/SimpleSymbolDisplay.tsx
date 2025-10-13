import React, { useState } from 'react';

interface SimpleSymbolDisplayProps {
  selectedSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

const SimpleSymbolDisplay: React.FC<SimpleSymbolDisplayProps> = ({ 
  selectedSymbol: propSymbol = 'SPY', 
  onSymbolChange 
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState(propSymbol);
  
  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
    onSymbolChange?.(newSymbol);
  };
  
  const popularSymbols = ['SPY', 'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];

  return (
    <div className="symbol-selector">
      <select 
        value={selectedSymbol} 
        onChange={(e) => handleSymbolChange(e.target.value)}
        style={{
          background: 'var(--tv-bg-tertiary)',
          border: '1px solid var(--tv-border)',
          color: 'var(--tv-text-primary)',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        {popularSymbols.map(symbol => (
          <option key={symbol} value={symbol}>{symbol}</option>
        ))}
      </select>
      <span style={{color: 'white', marginLeft: '12px', fontSize: '14px'}}>
        Selected: {selectedSymbol}
      </span>
    </div>
  );
};

export default SimpleSymbolDisplay;