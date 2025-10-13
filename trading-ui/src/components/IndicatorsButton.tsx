import React, { useState, useEffect, useRef } from 'react';

interface IndicatorsButtonProps {
  selectedIndicators: string[];
  onIndicatorToggle: (indicators: string[]) => void;
}

const IndicatorsButton: React.FC<IndicatorsButtonProps> = ({
  selectedIndicators,
  onIndicatorToggle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const indicators = [
    { id: 'ma', name: 'Moving Average', category: 'trend' },
    { id: 'ema', name: 'Exponential Moving Average', category: 'trend' },
    { id: 'bollinger', name: 'Bollinger Bands', category: 'volatility' },
    { id: 'rsi', name: 'RSI', category: 'momentum' },
    { id: 'macd', name: 'MACD', category: 'momentum' },
    { id: 'stochastic', name: 'Stochastic', category: 'momentum' },
    { id: 'volume', name: 'Volume', category: 'volume' },
    { id: 'atr', name: 'Average True Range', category: 'volatility' },
    { id: 'cci', name: 'Commodity Channel Index', category: 'momentum' },
    { id: 'williams', name: 'Williams %R', category: 'momentum' },
    { id: 'sar', name: 'Parabolic SAR', category: 'trend' },
    { id: 'ichimoku', name: 'Ichimoku Cloud', category: 'trend' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleIndicatorToggle = (indicatorId: string) => {
    const newIndicators = selectedIndicators.includes(indicatorId)
      ? selectedIndicators.filter(id => id !== indicatorId)
      : [...selectedIndicators, indicatorId];
    onIndicatorToggle(newIndicators);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        className={`indicators-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>📊</span>
        <span>Indicators</span>
        {selectedIndicators.length > 0 && (
          <span className="indicator-count">{selectedIndicators.length}</span>
        )}
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {isOpen && (
        <div ref={dropdownRef} className="indicators-dropdown">
          <div className="dropdown-header">
            Technical Indicators
          </div>
          <div className="indicators-list">
            {indicators.map((indicator) => (
              <div
                key={indicator.id}
                className="indicator-item"
                onClick={() => handleIndicatorToggle(indicator.id)}
              >
                <div className={`indicator-checkbox ${selectedIndicators.includes(indicator.id) ? 'checked' : ''}`}>
                  {selectedIndicators.includes(indicator.id) && (
                    <span className="checkmark">✓</span>
                  )}
                </div>
                <span className="indicator-name">{indicator.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorsButton;