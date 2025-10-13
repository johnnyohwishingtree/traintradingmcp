import React, { useState, useRef, useEffect } from 'react';
import './HeaderToolbar.css';
import { searchSymbols } from './services/backendAPI';

interface HeaderToolbarProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
  currentInterval: string;
  onIntervalChange: (interval: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onReplay?: () => void;
  onIndicatorsClick?: () => void;
  onChartTypeClick?: () => void;
  onSettingsClick?: () => void;
  onPineScriptImport?: () => void;
}

// Extended stock symbols for better search
const POPULAR_SYMBOLS = [
  { symbol: 'AAPL', shortName: 'Apple Inc.', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', shortName: 'Alphabet Inc.', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'MSFT', shortName: 'Microsoft Corporation', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'AMZN', shortName: 'Amazon.com Inc.', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'TSLA', shortName: 'Tesla Inc.', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'SNOW', shortName: 'Snowflake Inc.', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'WDAY', shortName: 'Workday Inc.', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'META', shortName: 'Meta Platforms Inc.', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'NVDA', shortName: 'NVIDIA Corporation', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'JPM', shortName: 'JPMorgan Chase & Co.', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'V', shortName: 'Visa Inc.', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'WMT', shortName: 'Walmart Inc.', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'DIS', shortName: 'The Walt Disney Company', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'NFLX', shortName: 'Netflix Inc.', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'AMD', shortName: 'Advanced Micro Devices', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'BA', shortName: 'Boeing Company', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'CRM', shortName: 'Salesforce Inc.', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'UBER', shortName: 'Uber Technologies Inc.', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'ABNB', shortName: 'Airbnb Inc.', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'SHOP', shortName: 'Shopify Inc.', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'SPOT', shortName: 'Spotify Technology S.A.', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'COIN', shortName: 'Coinbase Global Inc.', typeDisp: 'Stock', exchange: 'NASDAQ' },
  { symbol: 'GME', shortName: 'GameStop Corp.', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'AMC', shortName: 'AMC Entertainment Holdings', typeDisp: 'Stock', exchange: 'NYSE' },
  { symbol: 'PLTR', shortName: 'Palantir Technologies Inc.', typeDisp: 'Stock', exchange: 'NYSE' },
];

const HeaderToolbar: React.FC<HeaderToolbarProps> = ({ currentSymbol, onSymbolChange, currentInterval, onIntervalChange, onUndo, onRedo, onReplay, onIndicatorsClick, onChartTypeClick, onSettingsClick, onPineScriptImport }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSymbols, setFilteredSymbols] = useState(POPULAR_SYMBOLS);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim()) {
      setIsLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Disable auto-download for search to make it fast - we'll download when symbol is selected
          const results = await searchSymbols(searchTerm.trim(), false);
          if (results.length > 0) {
            setFilteredSymbols(results);
          } else {
            // If no backend results, fall back to local popular symbols
            const filtered = POPULAR_SYMBOLS.filter(
              item =>
                item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.shortName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredSymbols(filtered);
          }
        } catch (error) {
          console.error('Search failed:', error);
          // Fall back to local filtering of popular symbols
          const filtered = POPULAR_SYMBOLS.filter(
            item =>
              item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.shortName.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setFilteredSymbols(filtered);
        } finally {
          setIsLoading(false);
        }
      }, 300); // Debounce search by 300ms (faster response than backend delay)
    } else {
      setFilteredSymbols(POPULAR_SYMBOLS);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange(symbol);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredSymbols.length > 0) {
        handleSymbolSelect(filteredSymbols[0].symbol);
      } else if (searchTerm.trim()) {
        // Allow entering any symbol directly
        handleSymbolSelect(searchTerm.trim().toUpperCase());
      }
    }
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  return (
    <div className="header-toolbar">
      <div className="header-left">
        {/* Symbol Search */}
        <div className="symbol-search-area" ref={searchRef} data-testid="symbol-search-area">
          <button 
            className="search-button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Search symbols"
            data-testid="search-button"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M11 11L16 16" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          
          <div className="symbol-display">
            <span className="current-symbol" data-testid="current-symbol">{currentSymbol}</span>
          </div>

          {isSearchOpen && (
            <div className="symbol-search-dropdown" data-testid="symbol-search-dropdown">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="symbol-search-input"
                  placeholder="Search symbol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  data-testid="symbol-search-input"
                  autoFocus
                />
              </div>
              
              <div className="symbol-results">
                {isLoading ? (
                  <div className="loading-message">Searching...</div>
                ) : (
                  <>
                    {filteredSymbols.length > 0 ? (
                      filteredSymbols.map((item) => (
                        <div
                          key={item.symbol}
                          className="symbol-result-item"
                          onClick={() => handleSymbolSelect(item.symbol)}
                          data-testid="symbol-result-item"
                        >
                          <div className="symbol-info">
                            <span className="symbol-ticker">{item.symbol}</span>
                            <span className="symbol-exchange">{item.exchange || ''}</span>
                            <span className="symbol-type">{item.typeDisp}</span>
                          </div>
                          <div className="symbol-name">{item.shortName}</div>
                        </div>
                      ))
                    ) : searchTerm.trim() ? (
                      <div 
                        className="symbol-result-item"
                        onClick={() => handleSymbolSelect(searchTerm.trim().toUpperCase())}
                        data-testid="symbol-result-item"
                      >
                        <div className="symbol-info">
                          <span className="symbol-ticker">{searchTerm.trim().toUpperCase()}</span>
                          <span className="symbol-type">Enter to select</span>
                        </div>
                        <div className="symbol-name">Load {searchTerm.trim().toUpperCase()} data</div>
                      </div>
                    ) : (
                      <div className="no-results">Popular symbols</div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="toolbar-separator" />

        {/* Time Interval Dropdown */}
        <div className="time-interval-dropdown">
          <select 
            className="interval-select"
            data-testid="interval-select"
            value={currentInterval}
            onChange={(e) => onIntervalChange(e.target.value)}
          >
            <optgroup label="Intraday (Last 30 days)">
              <option value="1min">1m</option>
              <option value="5min">5m</option>
              <option value="15min">15m</option>
              <option value="30min">30m</option>
              <option value="60min">1h</option>
            </optgroup>
            <optgroup label="Daily, Weekly & Monthly (20+ years)">
              <option value="1day">1D</option>
              <option value="1week">1W</option>
              <option value="1month">1M</option>
            </optgroup>
          </select>
        </div>

        <div className="toolbar-separator" />

        {/* Chart Type */}
        <button className="chart-type-button" title="Chart type" onClick={onChartTypeClick} data-testid="chart-type-button">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <rect x="4" y="12" width="2" height="4" fill="currentColor"/>
            <rect x="8" y="8" width="2" height="8" fill="currentColor"/>
            <rect x="12" y="10" width="2" height="6" fill="currentColor"/>
          </svg>
        </button>

        {/* Indicators */}
        <button className="indicators-button" title="Indicators" onClick={onIndicatorsClick} data-testid="indicators-button">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M3 9L7 5L11 9L15 3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="15" cy="3" r="1.5" fill="currentColor"/>
            <circle cx="11" cy="9" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="3" cy="9" r="1.5" fill="currentColor"/>
          </svg>
          <span>Indicators</span>
        </button>

        {/* PineScript Import */}
        <button className="pinescript-button" title="Import PineScript" onClick={onPineScriptImport} data-testid="pinescript-button">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M2 2h14v14H2V2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M6 6h6M6 9h4M6 12h5" stroke="currentColor" strokeWidth="1"/>
          </svg>
          <span>PineScript</span>
        </button>
      </div>

      <div className="header-right">
        {/* Replay */}
        <button className="header-icon-button" title="Bar replay" onClick={onReplay} data-testid="replay-button">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M3 9L3 5L7 5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M15 9C15 12.314 12.314 15 9 15C6.5 15 4.5 13.5 3.5 11.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M3 9C3 5.686 5.686 3 9 3C11.5 3 13.5 4.5 14.5 6.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
          <span>Replay</span>
        </button>

        {/* Undo/Redo */}
        <button className="header-icon-button" title="Undo (⌘Z)" onClick={onUndo} data-testid="undo-button">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M4 8H12C14 8 15 9 15 11C15 13 14 14 12 14H8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M6 6L4 8L6 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </button>
        
        <button className="header-icon-button" title="Redo (⌘⇧Z)" onClick={onRedo} data-testid="redo-button">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M14 8H6C4 8 3 9 3 11C3 13 4 14 6 14H10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M12 6L14 8L12 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </button>

        {/* Settings */}
        <button className="header-icon-button" title="Settings" data-testid="settings-button" onClick={onSettingsClick}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M9 11.5C10.38 11.5 11.5 10.38 11.5 9C11.5 7.62 10.38 6.5 9 6.5C7.62 6.5 6.5 7.62 6.5 9C6.5 10.38 7.62 11.5 9 11.5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M14.5 9C14.5 9.3 14.48 9.59 14.44 9.87L16.07 11.13C16.21 11.24 16.25 11.44 16.16 11.6L14.66 14.4C14.57 14.56 14.37 14.62 14.2 14.56L12.27 13.77C11.87 14.06 11.44 14.3 10.97 14.48L10.69 16.54C10.66 16.72 10.51 16.85 10.32 16.85H7.32C7.13 16.85 6.98 16.72 6.95 16.54L6.67 14.48C6.2 14.3 5.77 14.07 5.37 13.77L3.44 14.56C3.27 14.63 3.07 14.56 2.98 14.4L1.48 11.6C1.39 11.44 1.43 11.24 1.57 11.13L3.2 9.87C3.16 9.59 3.14 9.29 3.14 9C3.14 8.71 3.16 8.41 3.2 8.13L1.57 6.87C1.43 6.76 1.39 6.56 1.48 6.4L2.98 3.6C3.07 3.44 3.27 3.38 3.44 3.44L5.37 4.23C5.77 3.94 6.2 3.7 6.67 3.52L6.95 1.46C6.98 1.28 7.13 1.15 7.32 1.15H10.32C10.51 1.15 10.66 1.28 10.69 1.46L10.97 3.52C11.44 3.7 11.87 3.93 12.27 4.23L14.2 3.44C14.37 3.37 14.57 3.44 14.66 3.6L16.16 6.4C16.25 6.56 16.21 6.76 16.07 6.87L14.44 8.13C14.48 8.41 14.5 8.7 14.5 9Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HeaderToolbar;