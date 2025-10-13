import React from 'react';
import './IndicatorsPanel.css';

interface IndicatorsPanelProps {
  enabledIndicators: {
    ema10: boolean;
    ema12: boolean;
    ema26: boolean;
    ema50: boolean;
    ema200: boolean;
    sma10: boolean;
    sma50: boolean;
    sma200: boolean;
    bollingerBands: boolean;
    elderRay: boolean;
    volume: boolean;
  };
  onToggleIndicator: (key: string) => void;
  onClose: () => void;
}

const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({ 
  enabledIndicators, 
  onToggleIndicator, 
  onClose 
}) => {
  const indicators = [
    { key: 'ema10', label: 'EMA 10 days', type: 'EMA' },
    { key: 'ema12', label: 'EMA 12 days', type: 'EMA' },
    { key: 'ema26', label: 'EMA 26 days', type: 'EMA' },
    { key: 'ema50', label: 'EMA 50 days', type: 'EMA' },
    { key: 'ema200', label: 'EMA 200 days', type: 'EMA' },
    { key: 'sma10', label: 'SMA 10 days', type: 'SMA' },
    { key: 'sma50', label: 'SMA 50 days', type: 'SMA' },
    { key: 'sma200', label: 'SMA 200 days', type: 'SMA' },
    { key: 'bollingerBands', label: 'Bollinger Bands®', type: 'BB' },
    { key: 'elderRay', label: 'Elder Ray', type: 'Momentum' },
    { key: 'volume', label: 'Volume', type: 'Volume' },
  ];

  const handleItemClick = (key: string) => {
    onToggleIndicator(key);
  };

  return (
    <div className="indicators-panel" data-testid="indicators-panel">
      <div className="indicators-header">
        <h3>📊 Indicators</h3>
        <button className="close-button" onClick={onClose} data-testid="indicators-close-button">✕</button>
      </div>
      
      <div className="indicators-section">
        <h4>All indicators</h4>
        <div className="indicators-list">
          {indicators.map((indicator) => (
            <div 
              key={indicator.key}
              className={`indicator-item ${enabledIndicators[indicator.key] ? 'enabled' : ''}`}
              onClick={() => handleItemClick(indicator.key)}
              data-testid={`indicator-${indicator.key}`}
            >
              <div className="indicator-checkbox">
                {enabledIndicators[indicator.key] && <span>✓</span>}
              </div>
              <span className="indicator-label">{indicator.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IndicatorsPanel;