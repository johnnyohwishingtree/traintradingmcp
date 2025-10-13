import React, { useState } from 'react';
import './IndicatorSettingsPanel.css';

interface IndicatorSettings {
  length?: number;
  mult?: number;
  offset?: number;
  source?: string;
  [key: string]: any;
}

interface IndicatorSettingsPanelProps {
  indicatorName: string;
  currentSettings: IndicatorSettings;
  onSettingsChange: (settings: IndicatorSettings) => void;
  onClose: () => void;
}

const IndicatorSettingsPanel: React.FC<IndicatorSettingsPanelProps> = ({
  indicatorName,
  currentSettings,
  onSettingsChange,
  onClose
}) => {
  const [settings, setSettings] = useState<IndicatorSettings>(currentSettings);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const handleApply = () => {
    onSettingsChange(settings);
    onClose();
  };

  const handleReset = () => {
    // Reset to default values based on indicator type
    let defaults: IndicatorSettings = {};
    
    if (indicatorName.includes('COG')) {
      defaults = { length: 34, mult: 2.5, offset: 20 };
    } else if (indicatorName.includes('SMA')) {
      defaults = { length: 20, source: 'close' };
    } else if (indicatorName.includes('RSI')) {
      defaults = { length: 14, source: 'close' };
    }
    
    setSettings(defaults);
  };

  return (
    <div className="indicator-settings-overlay" data-testid="indicator-settings">
      <div className="indicator-settings-panel">
        <div className="settings-header">
          <h3>{indicatorName}</h3>
          <button className="close-button" onClick={onClose} data-testid="settings-close-button">
            ✕
          </button>
        </div>
        
        <div className="settings-content">
          <div className="settings-tabs">
            <button className="tab-button active">Inputs</button>
            <button className="tab-button">Style</button>
            <button className="tab-button">Visibility</button>
          </div>
          
          <div className="settings-form">
            {/* Dynamic settings based on indicator type */}
            {indicatorName.includes('COG') && (
              <>
                <div className="setting-group">
                  <label>Length</label>
                  <input
                    type="number"
                    value={settings.length || 34}
                    onChange={(e) => handleSettingChange('length', parseInt(e.target.value))}
                    data-testid="length-input"
                  />
                </div>
                
                <div className="setting-group">
                  <label>Mult</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.mult || 2.5}
                    onChange={(e) => handleSettingChange('mult', parseFloat(e.target.value))}
                    data-testid="mult-input"
                  />
                </div>
                
                <div className="setting-group">
                  <label>Offset</label>
                  <input
                    type="number"
                    value={settings.offset || 20}
                    onChange={(e) => handleSettingChange('offset', parseInt(e.target.value))}
                    data-testid="offset-input"
                  />
                </div>
              </>
            )}
            
            {(indicatorName.includes('SMA') || indicatorName.includes('RSI')) && (
              <>
                <div className="setting-group">
                  <label>Length</label>
                  <input
                    type="number"
                    value={settings.length || (indicatorName.includes('RSI') ? 14 : 20)}
                    onChange={(e) => handleSettingChange('length', parseInt(e.target.value))}
                    data-testid="length-input"
                  />
                </div>
                
                <div className="setting-group">
                  <label>Source</label>
                  <select
                    value={settings.source || 'close'}
                    onChange={(e) => handleSettingChange('source', e.target.value)}
                    data-testid="source-select"
                  >
                    <option value="close">Close</option>
                    <option value="open">Open</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                    <option value="hl2">HL2</option>
                    <option value="hlc3">HLC3</option>
                    <option value="ohlc4">OHLC4</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                />
                Inputs in status line
              </label>
            </div>
          </div>
        </div>
        
        <div className="settings-footer">
          <button className="defaults-button" onClick={handleReset} data-testid="defaults-button">
            Defaults ↓
          </button>
          <div className="action-buttons">
            <button className="cancel-button" onClick={onClose} data-testid="cancel-button">
              Cancel
            </button>
            <button className="ok-button" onClick={handleApply} data-testid="ok-button">
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndicatorSettingsPanel;