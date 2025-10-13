import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import type { ChartType, SelectedIndicators, InteractiveIndicators } from '../App';
import type { OHLCVData } from '../data/sampleData';

interface ChartContainerProps {
  data: OHLCVData[];
  chartType: ChartType;
  indicators: SelectedIndicators;
  interactiveIndicators: InteractiveIndicators;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  data,
  chartType,
  indicators,
  interactiveIndicators,
}) => {
  const activeIndicators = Object.entries(indicators)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name.toUpperCase());

  const activeInteractiveIndicators = Object.entries(interactiveIndicators)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name.replace(/([A-Z])/g, ' $1').trim());

  const lastDataPoint = data[data.length - 1];
  const priceChange = lastDataPoint ? lastDataPoint.close - lastDataPoint.open : 0;
  const priceChangePercent = lastDataPoint ? (priceChange / lastDataPoint.open) * 100 : 0;

  // Prepare data for charts
  const chartData = data.map((point, index) => ({
    ...point,
    name: point.date.toISOString().split('T')[0],
    timestamp: point.date.getTime(),
    index,
    // Add some simple indicators for demo
    sma: calculateSMA(data, index, 20),
    ema: calculateEMA(data, index, 20),
    bollinger: calculateBollingerBands(data, index, 20),
  }));

  // Simple Moving Average calculation
  function calculateSMA(data: OHLCVData[], currentIndex: number, period: number): number | null {
    if (currentIndex < period - 1) return null;
    const sum = data.slice(currentIndex - period + 1, currentIndex + 1)
      .reduce((acc, point) => acc + point.close, 0);
    return sum / period;
  }

  // Simple EMA calculation
  function calculateEMA(data: OHLCVData[], currentIndex: number, period: number): number | null {
    if (currentIndex === 0) return data[0].close;
    if (currentIndex < period - 1) return null;
    
    const multiplier = 2 / (period + 1);
    const previousEMA = calculateEMA(data, currentIndex - 1, period) || data[currentIndex - 1].close;
    return (data[currentIndex].close - previousEMA) * multiplier + previousEMA;
  }

  // Simple Bollinger Bands calculation
  function calculateBollingerBands(data: OHLCVData[], currentIndex: number, period: number) {
    const sma = calculateSMA(data, currentIndex, period);
    if (!sma || currentIndex < period - 1) return null;
    
    const variance = data.slice(currentIndex - period + 1, currentIndex + 1)
      .reduce((acc, point) => acc + Math.pow(point.close - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * 2),
      middle: sma,
      lower: sma - (stdDev * 2),
    };
  }

  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height: 400,
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" />
              <XAxis 
                dataKey="name" 
                stroke="#868993" 
                fontSize={11}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                stroke="#868993" 
                fontSize={11}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e222d', 
                  border: '1px solid #2a2e39',
                  borderRadius: '4px',
                  color: '#d1d4dc'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Close']}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#2962ff" 
                strokeWidth={2}
                dot={false}
              />
              {indicators.sma && (
                <Line 
                  type="monotone" 
                  dataKey="sma" 
                  stroke="#ff9800" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
              {indicators.ema && (
                <Line 
                  type="monotone" 
                  dataKey="ema" 
                  stroke="#4caf50" 
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" />
              <XAxis 
                dataKey="name" 
                stroke="#868993" 
                fontSize={11}
              />
              <YAxis 
                stroke="#868993" 
                fontSize={11}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e222d', 
                  border: '1px solid #2a2e39',
                  borderRadius: '4px',
                  color: '#d1d4dc'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke="#2962ff" 
                fill="url(#colorGradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2962ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2962ff" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer {...commonProps}>
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" />
              <XAxis 
                dataKey="index" 
                stroke="#868993" 
                fontSize={11}
              />
              <YAxis 
                stroke="#868993" 
                fontSize={11}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e222d', 
                  border: '1px solid #2a2e39',
                  borderRadius: '4px',
                  color: '#d1d4dc'
                }}
              />
              <Scatter 
                dataKey="close" 
                fill="#2962ff"
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'candlestick':
      case 'ohlc':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" />
              <XAxis 
                dataKey="name" 
                stroke="#868993" 
                fontSize={11}
              />
              <YAxis 
                stroke="#868993" 
                fontSize={11}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e222d', 
                  border: '1px solid #2a2e39',
                  borderRadius: '4px',
                  color: '#d1d4dc'
                }}
                content={({ payload, label }) => {
                  if (!payload || !payload[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div style={{ 
                      backgroundColor: '#1e222d', 
                      border: '1px solid #2a2e39',
                      borderRadius: '4px',
                      padding: '8px',
                      color: '#d1d4dc'
                    }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#868993' }}>{label}</p>
                      <p style={{ margin: '4px 0', color: '#d1d4dc' }}>
                        <span style={{ color: '#868993' }}>O:</span> ${data.open.toFixed(2)} 
                        <span style={{ color: '#4CAF50', marginLeft: '8px' }}>H:</span> ${data.high.toFixed(2)}
                      </p>
                      <p style={{ margin: '4px 0', color: '#d1d4dc' }}>
                        <span style={{ color: '#f44336' }}>L:</span> ${data.low.toFixed(2)} 
                        <span style={{ color: '#d1d4dc', marginLeft: '8px' }}>C:</span> ${data.close.toFixed(2)}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#868993' }}>
                        Volume: {data.volume.toLocaleString()}
                      </p>
                    </div>
                  );
                }}
              />
              {/* OHLC visualization using multiple lines */}
              <Line 
                type="monotone" 
                dataKey="high" 
                stroke="#4CAF50" 
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                name="High"
              />
              <Line 
                type="monotone" 
                dataKey="low" 
                stroke="#f44336" 
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                name="Low"
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#2962ff" 
                strokeWidth={2}
                dot={{ fill: '#2962ff', strokeWidth: 0, r: 2 }}
                name="Close"
              />
              <Line 
                type="monotone" 
                dataKey="open" 
                stroke="#ff9800" 
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                name="Open"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="chart-placeholder">
            <div className="placeholder-content">
              <div className="chart-icon">🚧</div>
              <h3>Chart type "{chartType}" coming soon!</h3>
              <p>This chart type is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="chart-info">
          <span className="symbol">SAMPLE</span>
          <span className="chart-type">{chartType.toUpperCase()}</span>
          {lastDataPoint && (
            <div className="price-info">
              <span className={`price ${priceChange >= 0 ? 'price-up' : 'price-down'}`}>
                ${lastDataPoint.close.toFixed(2)}
              </span>
              <span className={`change ${priceChange >= 0 ? 'price-up' : 'price-down'}`}>
                {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} 
                ({priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <div className="chart-controls">
          {activeIndicators.length > 0 && (
            <div className="active-indicators">
              <span className="indicators-label">Indicators:</span>
              <span className="indicators-list">{activeIndicators.join(', ')}</span>
            </div>
          )}
          {activeInteractiveIndicators.length > 0 && (
            <div className="active-interactive">
              <span className="interactive-label">Drawing Tools:</span>
              <span className="interactive-list">{activeInteractiveIndicators.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="chart-area">
        <div className="actual-chart">
          {renderChart()}
        </div>
        
        <div className="chart-info-panel">
          <div className="data-summary">
            <span>Data Points: {data.length}</span>
            <span>Period: {Math.floor(data.length / 30)} months</span>
            {lastDataPoint && (
              <span>Volume: {lastDataPoint.volume.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;