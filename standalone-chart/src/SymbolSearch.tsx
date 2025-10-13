import React, { useState, useRef, useEffect } from 'react';
import './SymbolSearch.css';

interface SymbolSearchProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

// Popular stock symbols for demo purposes
const POPULAR_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE' },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE' },
  { symbol: 'DIS', name: 'The Walt Disney Company', exchange: 'NYSE' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ' },
  { symbol: 'BA', name: 'Boeing Company', exchange: 'NYSE' },
  { symbol: 'SNOW', name: 'Snowflake Inc.', exchange: 'NYSE' },
];

const SymbolSearch: React.FC<SymbolSearchProps> = ({ currentSymbol, onSymbolChange }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSymbols, setFilteredSymbols] = useState(POPULAR_SYMBOLS);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = POPULAR_SYMBOLS.filter(
        item =>
          item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSymbols(filtered);
    } else {
      setFilteredSymbols(POPULAR_SYMBOLS);
    }
  }, [searchTerm]);

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange(symbol);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredSymbols.length > 0) {
      handleSymbolSelect(filteredSymbols[0].symbol);
    }
  };

  return (
    <div className="symbol-search-container" ref={searchRef}>
      <div 
        className="symbol-display"
        onClick={() => setIsSearchOpen(!isSearchOpen)}
      >
        <span className="symbol-text">{currentSymbol}</span>
        <svg className="dropdown-arrow" width="10" height="6" viewBox="0 0 10 6">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>
      
      {isSearchOpen && (
        <div className="search-dropdown">
          <div className="search-input-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          
          <div className="search-results">
            {filteredSymbols.length > 0 ? (
              filteredSymbols.map((item) => (
                <div
                  key={item.symbol}
                  className="search-result-item"
                  onClick={() => handleSymbolSelect(item.symbol)}
                >
                  <div className="symbol-info">
                    <span className="result-symbol">{item.symbol}</span>
                    <span className="result-exchange">{item.exchange}</span>
                  </div>
                  <div className="result-name">{item.name}</div>
                </div>
              ))
            ) : (
              <div className="no-results">No symbols found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SymbolSearch;