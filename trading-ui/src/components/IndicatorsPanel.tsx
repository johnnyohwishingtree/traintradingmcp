import React from 'react';
import type { SelectedIndicators } from '../App';

interface IndicatorsPanelProps {
  selectedIndicators: SelectedIndicators;
  onIndicatorChange: (indicators: SelectedIndicators) => void;
}

const indicators = [
  { key: 'ema' as keyof SelectedIndicators, label: 'EMA', description: 'Exponential Moving Average' },
  { key: 'sma' as keyof SelectedIndicators, label: 'SMA', description: 'Simple Moving Average' },
  { key: 'wma' as keyof SelectedIndicators, label: 'WMA', description: 'Weighted Moving Average' },
  { key: 'tma' as keyof SelectedIndicators, label: 'TMA', description: 'Triangular Moving Average' },
  { key: 'bollingerBand' as keyof SelectedIndicators, label: 'Bollinger Bands', description: 'Bollinger Bands' },
  { key: 'sar' as keyof SelectedIndicators, label: 'SAR', description: 'Parabolic SAR' },
  { key: 'macd' as keyof SelectedIndicators, label: 'MACD', description: 'Moving Average Convergence Divergence' },
  { key: 'rsi' as keyof SelectedIndicators, label: 'RSI', description: 'Relative Strength Index' },
  { key: 'atr' as keyof SelectedIndicators, label: 'ATR', description: 'Average True Range' },
  { key: 'stochasticFast' as keyof SelectedIndicators, label: 'Stochastic Fast', description: 'Stochastic Fast' },
  { key: 'stochasticSlow' as keyof SelectedIndicators, label: 'Stochastic Slow', description: 'Stochastic Slow' },
  { key: 'stochasticFull' as keyof SelectedIndicators, label: 'Stochastic Full', description: 'Stochastic Full' },
  { key: 'forceIndex' as keyof SelectedIndicators, label: 'Force Index', description: 'Force Index' },
  { key: 'elderRay' as keyof SelectedIndicators, label: 'Elder Ray', description: 'Elder Ray Index' },
  { key: 'elderImpulse' as keyof SelectedIndicators, label: 'Elder Impulse', description: 'Elder Impulse System' },
];

const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({
  selectedIndicators,
  onIndicatorChange,
}) => {
  const toggleIndicator = (key: keyof SelectedIndicators) => {
    onIndicatorChange({
      ...selectedIndicators,
      [key]: !selectedIndicators[key],
    });
  };

  return (
    <div className="indicators-panel">
      {indicators.map((indicator) => (
        <div key={indicator.key} className="indicator-item">
          <label className="indicator-checkbox">
            <input
              type="checkbox"
              checked={selectedIndicators[indicator.key]}
              onChange={() => toggleIndicator(indicator.key)}
            />
            <span className="indicator-label">{indicator.label}</span>
          </label>
          <div className="indicator-description">{indicator.description}</div>
        </div>
      ))}
    </div>
  );
};

export default IndicatorsPanel;