import React from 'react';
import './ChartTypePanel.css';

interface ChartTypePanelProps {
  currentChartType: 'candlestick' | 'ohlc' | 'line' | 'area';
  onChartTypeSelect: (type: 'candlestick' | 'ohlc' | 'line' | 'area') => void;
  onClose: () => void;
}

const ChartTypePanel: React.FC<ChartTypePanelProps> = ({ 
  currentChartType, 
  onChartTypeSelect, 
  onClose 
}) => {
  const chartTypes = [
    { 
      key: 'candlestick' as const, 
      label: 'Candlestick', 
      description: 'OHLC data as candlesticks',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24">
          <rect x="10" y="6" width="4" height="12" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
          <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="1"/>
          <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1"/>
        </svg>
      )
    },
    { 
      key: 'ohlc' as const, 
      label: 'OHLC Bars', 
      description: 'Traditional bar charts',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24">
          <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2"/>
          <line x1="8" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="2"/>
          <line x1="12" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      key: 'line' as const, 
      label: 'Line Chart', 
      description: 'Simple line connecting closes',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="3" cy="17" r="2" fill="currentColor"/>
          <circle cx="9" cy="11" r="2" fill="currentColor"/>
          <circle cx="13" cy="15" r="2" fill="currentColor"/>
          <circle cx="21" cy="7" r="2" fill="currentColor"/>
        </svg>
      )
    },
    { 
      key: 'area' as const, 
      label: 'Area Chart', 
      description: 'Line chart with filled area',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M3 17L9 11L13 15L21 7V20H3V17Z" fill="currentColor" opacity="0.3"/>
          <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      )
    }
  ];

  const handleItemClick = (type: 'candlestick' | 'ohlc' | 'line' | 'area') => {
    onChartTypeSelect(type);
  };

  return (
    <div className="chart-type-panel" data-testid="chart-type-panel">
      <div className="chart-type-header">
        <h3>📊 Chart Type</h3>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>
      
      <div className="chart-types-list">
        {chartTypes.map((chartTypeOption) => (
          <div 
            key={chartTypeOption.key}
            className={`chart-type-item ${currentChartType === chartTypeOption.key ? 'selected' : ''}`}
            onClick={() => handleItemClick(chartTypeOption.key)}
          >
            <div className="chart-type-icon">
              {chartTypeOption.icon}
            </div>
            <div className="chart-type-info">
              <div className="chart-type-label">{chartTypeOption.label}</div>
              <div className="chart-type-description">{chartTypeOption.description}</div>
            </div>
            {currentChartType === chartTypeOption.key && (
              <div className="chart-type-selected">✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartTypePanel;