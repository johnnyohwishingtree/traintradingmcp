import React, { useState } from 'react';
import './SettingsPanel.css';

interface SettingsPanelProps {
  zoomMultiplier: number;
  onZoomMultiplierChange: (value: number) => void;
  displayTimezone?: string;
  onTimezoneChange?: (timezone: string) => void;
  currentSymbol?: string;
  onRefreshSymbolData?: (symbol: string) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  zoomMultiplier, 
  onZoomMultiplierChange,
  displayTimezone = 'local',
  onTimezoneChange,
  currentSymbol,
  onRefreshSymbolData,
  onClose 
}) => {
  // Convert multiplier to percentage for display (e.g., 1.05 -> 5%)
  const zoomPercentage = Math.round((zoomMultiplier - 1) * 100);
  
  // Get current timezone info
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currentTime = new Date();
  
  const timezoneOptions = [
    { value: 'local', label: `Local (${localTimezone})`, example: currentTime.toLocaleString() },
    { value: 'et', label: 'Eastern Time (ET)', example: currentTime.toLocaleString('en-US', {timeZone: 'America/New_York'}) },
    { value: 'utc', label: 'UTC', example: currentTime.toISOString().replace('T', ' ').slice(0, 19) + ' UTC' }
  ];
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseInt(e.target.value);
    const multiplier = 1 + (percentage / 100);
    onZoomMultiplierChange(multiplier);
  };

  const presetValues = [
    { label: 'Very Smooth', value: 1.01, percentage: 1 },
    { label: 'Smooth', value: 1.03, percentage: 3 },
    { label: 'Normal', value: 1.05, percentage: 5 },
    { label: 'Fast', value: 1.10, percentage: 10 },
    { label: 'Very Fast', value: 1.20, percentage: 20 },
  ];

  return (
    <div className="settings-panel" data-testid="settings-panel">
      <div className="settings-header">
        <h3>⚙️ Settings</h3>
        <button className="close-button" onClick={onClose} data-testid="settings-close-button">✕</button>
      </div>
      
      <div className="settings-content">
        <div className="setting-group">
          <label className="setting-label">Zoom Sensitivity</label>
          <div className="setting-description">
            Adjust how much the chart zooms with each scroll
          </div>
          
          <div className="zoom-control">
            <div className="zoom-slider-container">
              <input
                type="range"
                className="zoom-slider"
                data-testid="zoom-slider"
                min="1"
                max="30"
                value={zoomPercentage}
                onChange={handleSliderChange}
              />
              <div className="zoom-value" data-testid="zoom-value">{zoomPercentage}%</div>
            </div>
            
            <div className="zoom-presets">
              {presetValues.map((preset) => (
                <button
                  key={preset.value}
                  className={`preset-button ${Math.abs(zoomMultiplier - preset.value) < 0.001 ? 'active' : ''}`}
                  data-testid={`preset-${preset.label.toLowerCase().replace(' ', '-')}`}
                  onClick={() => onZoomMultiplierChange(preset.value)}
                >
                  {preset.label}
                  <span className="preset-value">{preset.percentage}%</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="setting-info">
            <div className="info-item">
              <span className="info-label">Current multiplier:</span>
              <span className="info-value">{zoomMultiplier.toFixed(3)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Zoom per scroll:</span>
              <span className="info-value">{zoomPercentage}%</span>
            </div>
          </div>
        </div>
        
        <div className="setting-group">
          <label className="setting-label">Timezone Display</label>
          <div className="setting-description">
            Choose how timestamps are displayed on the chart
          </div>
          
          <div className="timezone-control">
            <select
              className="timezone-select"
              data-testid="timezone-select"
              value={displayTimezone}
              onChange={(e) => onTimezoneChange?.(e.target.value)}
            >
              {timezoneOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <div className="timezone-info">
              <div className="info-item">
                <span className="info-label">Current time in selected zone:</span>
                <span className="info-value">
                  {timezoneOptions.find(opt => opt.value === displayTimezone)?.example}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Market hours (ET):</span>
                <span className="info-value">9:30 AM - 4:00 PM</span>
              </div>
              <div className="info-item">
                <span className="info-label">Data timezone:</span>
                <span className="info-value">UTC (stored) → {displayTimezone === 'local' ? localTimezone : displayTimezone === 'et' ? 'America/New_York' : 'UTC'} (displayed)</span>
              </div>
            </div>
          </div>
        </div>
        
        {currentSymbol && (
          <div className="setting-group">
            <label className="setting-label">Data Management</label>
            <div className="setting-description">
              Manage cached data for the current symbol
            </div>
            
            <div className="data-management">
              <div className="current-symbol-info">
                <span className="info-label">Current symbol:</span>
                <span className="info-value symbol-highlight">{currentSymbol}</span>
              </div>
              
              <button
                className="refresh-data-button"
                onClick={() => {
                  if (window.confirm(`Refresh all data for ${currentSymbol}? This will fetch the complete historical dataset from Yahoo Finance and may take a few moments.`)) {
                    onRefreshSymbolData?.(currentSymbol);
                  }
                }}
                title={`Refresh all data for ${currentSymbol} from Yahoo Finance`}
              >
                🔄 Refresh All Data for {currentSymbol}
              </button>
              
              <div className="data-management-info">
                <div className="info-item">
                  <span className="info-label">🔄 Action:</span>
                  <span className="info-value">Fetches complete historical data from Yahoo Finance</span>
                </div>
                <div className="info-item">
                  <span className="info-label">📊 Coverage:</span>
                  <span className="info-value">Updates all timeframes (1D, 1W, 1M, 1h, 30m, 15m, 5m) with latest data</span>
                </div>
                <div className="info-item">
                  <span className="info-label">⏱️ Duration:</span>
                  <span className="info-value">May take 30-60 seconds depending on data size</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;