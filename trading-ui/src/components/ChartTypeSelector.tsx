import React from 'react';
import type { ChartType } from '../App';

interface ChartTypeSelectorProps {
  selectedType: ChartType;
  onTypeChange: (type: ChartType) => void;
}

const chartTypes: { value: ChartType; label: string; icon: string }[] = [
  { value: 'scatter', label: 'Scatter', icon: '•' },
  { value: 'area', label: 'Area', icon: '▲' },
  { value: 'line', label: 'Line', icon: '📈' },
  { value: 'candlestick', label: 'Candlestick', icon: '🕯' },
  { value: 'ohlc', label: 'OHLC', icon: '├' },
  { value: 'heikenashi', label: 'Heiken Ashi', icon: '🏮' },
  { value: 'renko', label: 'Renko', icon: '■' },
  { value: 'kagi', label: 'Kagi', icon: '📊' },
  { value: 'pointfigure', label: 'Point & Figure', icon: '×○' },
];

const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  return (
    <div className="chart-type-selector">
      {chartTypes.map((type) => (
        <button
          key={type.value}
          className={`chart-type-btn ${selectedType === type.value ? 'active' : ''}`}
          onClick={() => onTypeChange(type.value)}
        >
          <span className="chart-type-icon">{type.icon}</span>
          <span className="chart-type-label">{type.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ChartTypeSelector;