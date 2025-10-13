import React from 'react';
import type { InteractiveIndicators } from '../App';

interface InteractiveIndicatorsPanelProps {
  selectedIndicators: InteractiveIndicators;
  onIndicatorChange: (indicators: InteractiveIndicators) => void;
}

const interactiveIndicators = [
  { key: 'trendline' as keyof InteractiveIndicators, label: 'Trendline', description: 'Draw trend lines', icon: '📈' },
  { key: 'fibonacciRetracements' as keyof InteractiveIndicators, label: 'Fibonacci Retracements', description: 'Fibonacci retracement levels', icon: '🌀' },
  { key: 'gannFan' as keyof InteractiveIndicators, label: 'Gann Fan', description: 'Gann fan lines', icon: '🎯' },
  { key: 'channel' as keyof InteractiveIndicators, label: 'Channel', description: 'Price channels', icon: '⫸' },
  { key: 'linearRegressionChannel' as keyof InteractiveIndicators, label: 'Linear Regression Channel', description: 'Linear regression channels', icon: '📊' },
];

const InteractiveIndicatorsPanel: React.FC<InteractiveIndicatorsPanelProps> = ({
  selectedIndicators,
  onIndicatorChange,
}) => {
  const toggleIndicator = (key: keyof InteractiveIndicators) => {
    onIndicatorChange({
      ...selectedIndicators,
      [key]: !selectedIndicators[key],
    });
  };

  return (
    <div className="interactive-indicators-panel">
      {interactiveIndicators.map((indicator) => (
        <div key={indicator.key} className="interactive-indicator-item">
          <button
            className={`interactive-indicator-btn ${selectedIndicators[indicator.key] ? 'active' : ''}`}
            onClick={() => toggleIndicator(indicator.key)}
          >
            <span className="indicator-icon">{indicator.icon}</span>
            <span className="indicator-label">{indicator.label}</span>
          </button>
          <div className="indicator-description">{indicator.description}</div>
        </div>
      ))}
    </div>
  );
};

export default InteractiveIndicatorsPanel;