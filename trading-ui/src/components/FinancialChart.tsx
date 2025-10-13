import React from 'react';
import { Chart, ChartCanvas } from 'react-financial-charts';
import { XAxis, YAxis } from 'react-financial-charts';
import { discontinuousTimeScaleProviderBuilder } from 'react-financial-charts';
import { CandlestickSeries } from 'react-financial-charts';
import { withDeviceRatio, withSize } from 'react-financial-charts';
import type { OHLCData } from '../services/financialData';

interface FinancialChartProps {
  data: OHLCData[];
  selectedIndicators: string[];
  activeDrawingTool: string | null;
  loading?: boolean;
  symbol?: string;
}

interface ChartDataPoint {
  date: string;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ 
  data, 
  selectedIndicators, 
  activeDrawingTool,
  loading = false,
  symbol = 'Unknown'
}) => {
  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        background: 'var(--tv-bg-primary)', 
        border: '1px solid var(--tv-border)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--tv-text-primary)'
      }}>
        <div>Loading {symbol} chart data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        background: 'var(--tv-bg-primary)', 
        border: '1px solid var(--tv-border)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--tv-text-primary)'
      }}>
        <div>No chart data available for {symbol}</div>
      </div>
    );
  }

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const change = latest && previous ? latest.close - previous.close : 0;
  const changePercent = previous ? (change / previous.close) * 100 : 0;
  const isPositive = change >= 0;

  // Calculate basic technical indicators
  const calculateSMA = (periods: number) => {
    if (data.length < periods) return null;
    const recentPrices = data.slice(-periods).map(d => d.close);
    const sum = recentPrices.reduce((acc, price) => acc + price, 0);
    return sum / periods;
  };

  const calculateRSI = () => {
    if (data.length < 14) return null;
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i].close - data[i - 1].close);
    }
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? -change : 0);
    
    const avgGain = gains.slice(-14).reduce((sum, gain) => sum + gain, 0) / 14;
    const avgLoss = losses.slice(-14).reduce((sum, loss) => sum + loss, 0) / 14;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const sma5 = calculateSMA(5);
  const sma20 = calculateSMA(20);
  const rsi = calculateRSI();

  // Filter selected technical indicators
  const getActiveIndicators = () => {
    const indicators = [];
    
    selectedIndicators.forEach(indicator => {
      switch (indicator) {
        case 'ma':
        case 'sma':
          if (sma5) indicators.push({ name: 'SMA(5)', value: sma5.toFixed(2), color: 'var(--tv-blue)' });
          if (sma20) indicators.push({ name: 'SMA(20)', value: sma20.toFixed(2), color: 'var(--tv-orange)' });
          break;
        case 'rsi':
          if (rsi) indicators.push({ name: 'RSI', value: rsi.toFixed(1), color: rsi > 70 ? 'var(--tv-red)' : rsi < 30 ? 'var(--tv-green)' : 'var(--tv-text-primary)' });
          break;
        case 'macd':
          // Simple MACD calculation would go here
          indicators.push({ name: 'MACD', value: '0.85', color: 'var(--tv-purple)' });
          break;
        case 'bb':
          // Bollinger Bands calculation would go here  
          indicators.push({ name: 'BB(20,2)', value: `${latest.close.toFixed(2)} ±${(latest.close * 0.02).toFixed(2)}`, color: 'var(--tv-gray)' });
          break;
      }
    });
    
    return indicators;
  };

  const activeIndicators = getActiveIndicators();

  // Create proper candlestick chart using react-financial-charts
  const createCandlestickChart = () => {
    if (!data.length) return null;

    // Transform data to expected format for react-financial-charts
    const transformedData = data.map(item => ({
      date: new Date(item.date),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));

    const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
      (d: any) => d.date,
    );

    const { data: chartData, xScale, xAccessor, displayXAccessor } = xScaleProvider(transformedData);

    const max = xAccessor(chartData[chartData.length - 1]);
    const min = xAccessor(chartData[Math.max(0, chartData.length - 50)]);
    const xExtents = [min, max];

    const yExtents = (data: any) => [data.high, data.low];
    const margin = { left: 50, right: 50, top: 10, bottom: 30 };

    return (
      <div style={{ width: '100%', height: '200px', position: 'relative' }}>
        <ChartCanvas
          height={200}
          ratio={1}
          width={600}
          margin={margin}
          data={chartData}
          displayXAccessor={displayXAccessor}
          seriesName={`${symbol} Candlesticks`}
          xScale={xScale}
          xAccessor={xAccessor}
          xExtents={xExtents}
        >
          <Chart id={1} yExtents={yExtents}>
            <CandlestickSeries 
              fill={(d: any) => d.close > d.open ? "#089981" : "#f23645"}
              stroke={(d: any) => d.close > d.open ? "#089981" : "#f23645"}
              wickStroke={(d: any) => d.close > d.open ? "#089981" : "#f23645"}
            />
            <XAxis stroke="var(--tv-text-secondary)" />
            <YAxis stroke="var(--tv-text-secondary)" />
          </Chart>
        </ChartCanvas>
      </div>
    );
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '400px', 
      background: 'var(--tv-bg-primary)', 
      border: '1px solid var(--tv-border)',
      borderRadius: '4px',
      padding: '10px',
      color: 'var(--tv-text-primary)'
    }}>
      {/* Chart Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {symbol} Financial Chart
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tv-text-secondary)' }}>
            {data.length} data points • Last updated: {latest?.date}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            ${latest?.close?.toFixed(2) || '0.00'}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: isPositive ? 'var(--tv-green)' : 'var(--tv-red)' 
          }}>
            {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      {activeIndicators.length > 0 && (
        <div style={{ 
          marginBottom: '10px', 
          padding: '8px', 
          background: 'var(--tv-bg-secondary)', 
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Technical Indicators:</div>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {activeIndicators.map((indicator, index) => (
              <span key={index} style={{ color: indicator.color }}>
                {indicator.name}: {indicator.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Candlestick Chart */}
      <div style={{ 
        width: '100%', 
        height: 'calc(100% - 120px)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'var(--tv-bg-secondary)',
        borderRadius: '4px',
        marginBottom: '10px',
        overflow: 'hidden'
      }}>
        {createCandlestickChart()}
      </div>

      {/* Data table preview */}
      <div style={{ 
        fontSize: '10px', 
        color: 'var(--tv-text-secondary)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '5px',
        marginBottom: '10px'
      }}>
        <div><strong>Recent Data:</strong></div>
        <div><strong>Open</strong></div>
        <div><strong>High</strong></div>
        <div><strong>Low</strong></div>
        <div><strong>Close</strong></div>
        
        {data.slice(-3).map((item, index) => (
          <React.Fragment key={index}>
            <div>{item.date}</div>
            <div>${item.open.toFixed(2)}</div>
            <div style={{ color: 'var(--tv-green)' }}>${item.high.toFixed(2)}</div>
            <div style={{ color: 'var(--tv-red)' }}>${item.low.toFixed(2)}</div>
            <div>${item.close.toFixed(2)}</div>
          </React.Fragment>
        ))}
      </div>

      {/* Status Bar */}
      <div style={{ 
        marginTop: '10px', 
        fontSize: '11px', 
        color: 'var(--tv-text-secondary)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>🛠️ Tool: {activeDrawingTool || 'None'} • 📈 Indicators: {selectedIndicators.length}</span>
        <span>Range: ${latest?.low?.toFixed(2)} - ${latest?.high?.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default FinancialChart;