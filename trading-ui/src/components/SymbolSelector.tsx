import React, { useState, useEffect, useRef } from 'react';
import { FinancialDataService, StockData } from '../services/financialData';

interface SymbolSelectorProps {
  selectedSymbol: StockData;
  onSymbolChange: (symbol: StockData) => void;
}

const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  selectedSymbol,
  onSymbolChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [popularSymbols] = useState<StockData[]>(FinancialDataService.getPopularSymbols());
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.length > 1) {
      searchSymbols(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchSymbols = async (term: string) => {
    setIsLoading(true);
    try {
      const results = await FinancialDataService.searchSymbols(term);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymbolSelect = async (symbol: StockData) => {
    setIsLoading(true);
    try {
      // Fetch current quote data
      const quote = await FinancialDataService.getStockQuote(symbol.symbol);
      onSymbolChange(quote);
      setIsOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error selecting symbol:', error);
      onSymbolChange(symbol);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const displaySymbols = searchTerm.length > 1 ? searchResults : popularSymbols;

  return (
    <div className="symbol-selector" ref={dropdownRef}>
      <button
        className={`symbol-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="symbol-main">
          <span className="symbol-ticker">{selectedSymbol.symbol}</span>
          <span className="symbol-name">{selectedSymbol.name}</span>
        </div>
        <div className="symbol-price-info">
          <span className="symbol-price">${selectedSymbol.price.toFixed(2)}</span>
          <span className={`symbol-change ${selectedSymbol.change >= 0 ? 'price-up' : 'price-down'}`}>
            {selectedSymbol.change >= 0 ? '+' : ''}{selectedSymbol.change.toFixed(2)} 
            ({selectedSymbol.change >= 0 ? '+' : ''}{selectedSymbol.changePercent.toFixed(2)}%)
          </span>
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'up' : 'down'}`}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="symbol-dropdown">
          <div className="symbol-search">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search symbols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="symbol-list">
            {isLoading && (
              <div className="loading-item">
                <span>Searching...</span>
              </div>
            )}
            
            {!isLoading && displaySymbols.length === 0 && searchTerm.length > 1 && (
              <div className="no-results">
                <span>No symbols found</span>
              </div>
            )}
            
            {!isLoading && displaySymbols.map((symbol) => (
              <div
                key={symbol.symbol}
                className={`symbol-item ${selectedSymbol.symbol === symbol.symbol ? 'active' : ''}`}
                onClick={() => handleSymbolSelect(symbol)}
              >
                <div className="symbol-info">
                  <div className="symbol-left">
                    <span className="item-ticker">{symbol.symbol}</span>
                    <span className="item-name">{symbol.name}</span>
                  </div>
                  {symbol.price > 0 && (
                    <div className="symbol-right">
                      <span className="item-price">${symbol.price.toFixed(2)}</span>
                      <span className={`item-change ${symbol.change >= 0 ? 'price-up' : 'price-down'}`}>
                        {symbol.change >= 0 ? '+' : ''}{symbol.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SymbolSelector;