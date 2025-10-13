import React, { useState } from 'react';
import { pineEngine, PineScriptIndicatorData, PineScriptOutput, MarketData } from './PineScriptEngine';

interface PineScriptImporterProps {
  onIndicatorImported: (output: PineScriptOutput, name: string) => void;
  onClose: () => void;
  marketData?: any[]; // OHLC chart data
}

interface ImportedIndicator {
  name: string;
  script: string;
  output: PineScriptOutput;
  enabled: boolean;
}

const PineScriptImporter: React.FC<PineScriptImporterProps> = ({ 
  onIndicatorImported, 
  onClose,
  marketData
}) => {
  const [script, setScript] = useState('');
  const [indicatorName, setIndicatorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [importedIndicators, setImportedIndicators] = useState<ImportedIndicator[]>([]);

  // Sample PineScript indicators for testing
  const sampleIndicators = {
    'COG Double Channel': `study("COG Double Channel [LazyBear]", shorttitle="COGChannel_LB", overlay=true)
src = close
length = input(34)
median=0
mult=input(2.5)
offset = input(20)

tr_custom() => 
    x1=high-low
    x2=abs(high-close[1])
    x3=abs(low-close[1])
    max(x1, max(x2,x3))
    
atr_custom(x,y) => 
    sma(x,y)
    
dev = (mult * stdev(src, length))
basis=linreg(src, length, median)
ul = (basis + dev)
ll = (basis - dev)
tr_v = tr_custom()
acustom=(2*atr_custom(tr_v, length))
uls=basis+acustom
lls=basis-acustom

plot(basis, linewidth=1, color=navy, style=line, linewidth=1, title="Median")
plot(ul, color=red, linewidth=1, title="BB+", style=dashed)
plot(ll, color=green, linewidth=1, title="BB-", style=dashed)
plot(uls, color=red, linewidth=1, title="Starc+", style=circles)
plot(lls, color=green, linewidth=1, title="Star-", style=circles)`,

    'Simple Moving Average': `study("Simple SMA", overlay=true)
length = input(20, title="Length")
src = input(close, title="Source")
sma_value = sma(src, length)
plot(sma_value, color=blue, linewidth=2, title="SMA")`,

    'RSI Oscillator': `study("RSI", shorttitle="RSI")
length = input(14, title="Length") 
src = input(close, title="Source")
rsi_value = rsi(src, length)
plot(rsi_value, color=purple, linewidth=2, title="RSI")
hline(70, "Overbought", color=red)
hline(30, "Oversold", color=green)`
  };

  const handleValidateScript = async () => {
    if (!script.trim()) {
      setValidationResult({ valid: false, errors: ['Script cannot be empty'] });
      return;
    }

    setIsLoading(true);
    try {
      const result = await pineEngine.validateScript(script);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({ 
        valid: false, 
        errors: [error instanceof Error ? error.message : 'Validation failed'] 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportIndicator = async () => {
    if (!script.trim() || !indicatorName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const indicatorData: PineScriptIndicatorData = {
        name: indicatorName,
        script: script,
        parameters: {}
      };

      // Convert chart data to MarketData format if available
      let convertedMarketData: MarketData[] | undefined;
      if (marketData && marketData.length > 0) {
        convertedMarketData = marketData.map((item: any) => ({
          timestamp: item.date?.getTime() || Date.now(),
          open: item.open || 0,
          high: item.high || 0,
          low: item.low || 0,
          close: item.close || 0,
          volume: item.volume || 0
        }));
        console.log(`📊 Passing ${convertedMarketData.length} market data points to indicator calculation`);
      } else {
        console.log('⚠️ No market data available for indicator calculation');
      }

      const output = await pineEngine.executeIndicator(indicatorData, convertedMarketData);
      
      const newIndicator: ImportedIndicator = {
        name: indicatorName,
        script: script,
        output: output,
        enabled: true
      };

      setImportedIndicators(prev => [...prev, newIndicator]);
      onIndicatorImported(output, indicatorName);
      
      // Clear form
      setScript('');
      setIndicatorName('');
      setValidationResult(null);

    } catch (error) {
      setValidationResult({ 
        valid: false, 
        errors: [error instanceof Error ? error.message : 'Import failed'] 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleIndicator = (name: string) => {
    setScript(sampleIndicators[name as keyof typeof sampleIndicators]);
    setIndicatorName(name);
    setValidationResult(null);
  };

  const toggleIndicator = (index: number) => {
    setImportedIndicators(prev => 
      prev.map((indicator, i) => 
        i === index 
          ? { ...indicator, enabled: !indicator.enabled }
          : indicator
      )
    );
  };

  return (
    <div className="pinescript-importer-overlay" data-testid="pinescript-importer">
      <div className="pinescript-importer-panel">
        <div className="importer-header">
          <h3>📈 Import PineScript Indicator</h3>
          <button className="close-button" onClick={onClose} data-testid="importer-close-button">✕</button>
        </div>
        
        <div className="importer-content">
          {/* Sample Indicators */}
          <div className="sample-indicators">
            <h4>📋 Sample Indicators</h4>
            <div className="sample-buttons">
              {Object.keys(sampleIndicators).map(name => (
                <button
                  key={name}
                  className="sample-button"
                  onClick={() => loadSampleIndicator(name)}
                  data-testid={`sample-${name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Script Input */}
          <div className="script-input-section">
            <h4>📝 PineScript Code</h4>
            <div className="input-group">
              <label>Indicator Name:</label>
              <input
                type="text"
                value={indicatorName}
                onChange={(e) => setIndicatorName(e.target.value)}
                placeholder="Enter indicator name"
                data-testid="indicator-name-input"
              />
            </div>
            
            <div className="script-textarea-container">
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste your PineScript code here..."
                rows={12}
                className="script-textarea"
                data-testid="script-textarea"
              />
            </div>
            
            <div className="script-actions">
              <button
                onClick={handleValidateScript}
                disabled={isLoading || !script.trim()}
                className="validate-button"
                data-testid="validate-button"
              >
                {isLoading ? '⏳ Validating...' : '✓ Validate Script'}
              </button>
              
              <button
                onClick={handleImportIndicator}
                disabled={isLoading || !script.trim() || !indicatorName.trim() || (validationResult && !validationResult.valid)}
                className="import-button"
                data-testid="import-button"
              >
                {isLoading ? '⏳ Importing...' : '📈 Import Indicator'}
              </button>
            </div>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
              {validationResult.valid ? (
                <div className="validation-success">
                  ✅ Script is valid and ready to import
                </div>
              ) : (
                <div className="validation-errors">
                  <h5>❌ Validation Errors:</h5>
                  <ul>
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Imported Indicators */}
          {importedIndicators.length > 0 && (
            <div className="imported-indicators">
              <h4>📊 Imported Indicators</h4>
              <div className="indicators-list">
                {importedIndicators.map((indicator, index) => (
                  <div key={index} className={`indicator-item ${indicator.enabled ? 'enabled' : 'disabled'}`}>
                    <div className="indicator-info">
                      <span className="indicator-name">{indicator.name}</span>
                      <span className="indicator-plots">{indicator.output.plots.length} plots</span>
                    </div>
                    <button
                      onClick={() => toggleIndicator(index)}
                      className="toggle-button"
                      data-testid={`toggle-indicator-${index}`}
                    >
                      {indicator.enabled ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Built-in Functions Reference */}
          <div className="builtin-functions">
            <h4>🔧 Available Functions</h4>
            <div className="functions-grid">
              {pineEngine.getBuiltinFunctions().slice(0, 12).map(func => (
                <span key={func} className="function-tag">{func}</span>
              ))}
              <span className="function-more">+{pineEngine.getBuiltinFunctions().length - 12} more...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PineScriptImporter;