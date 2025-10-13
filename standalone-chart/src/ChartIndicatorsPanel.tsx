import React from 'react';
import './ChartIndicatorsPanel.css';

interface IndicatorItem {
  name: string;
  enabled: boolean;
  color?: string;
  plots?: number;
}

interface ChartIndicatorsPanelProps {
  indicators: IndicatorItem[];
  onToggleIndicator: (index: number) => void;
  onSettingsClick?: (index: number) => void;
}

const ChartIndicatorsPanel: React.FC<ChartIndicatorsPanelProps> = ({ 
  indicators, 
  onToggleIndicator,
  onSettingsClick
}) => {
  if (indicators.length === 0) {
    return null;
  }

  return (
    <div className="chart-indicators-panel" data-testid="chart-indicators-panel">
      <div className="indicators-header">
        <span className="indicators-title">Indicators</span>
      </div>
      <div className="indicators-list">
        {indicators.map((indicator, index) => (
          <div key={index} className="indicator-row">
            <button
              className="indicator-toggle"
              onClick={() => onToggleIndicator(index)}
              data-testid={`indicator-toggle-${index}`}
              title="Toggle visibility"
            >
              {indicator.enabled ? '👁️' : '👁️‍🗨️'}
            </button>
            <span className={`indicator-label ${!indicator.enabled ? 'disabled' : ''}`}>
              {indicator.name}
            </span>
            <div className="indicator-controls">
              {indicator.color && (
                <span 
                  className="indicator-color-dot" 
                  style={{ backgroundColor: indicator.color }}
                />
              )}
              {onSettingsClick && (
                <button
                  className="indicator-settings"
                  onClick={() => onSettingsClick(index)}
                  data-testid={`indicator-settings-${index}`}
                  title="Settings"
                >
                  ⚙️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartIndicatorsPanel;