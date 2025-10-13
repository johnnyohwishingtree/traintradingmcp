import React from 'react';

interface SimpleChartProps {
  data: any[];
  selectedIndicators: string[];
  activeDrawingTool: string | null;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ 
  data, 
  selectedIndicators, 
  activeDrawingTool 
}) => {
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
      flexDirection: 'column',
      color: 'var(--tv-text-primary)'
    }}>
      <h3>Simple Chart Placeholder</h3>
      <p>Data points: {data.length}</p>
      <p>Active tool: {activeDrawingTool || 'None'}</p>
      <p>Indicators: {selectedIndicators.length}</p>
      <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--tv-text-secondary)' }}>
        This proves chart area works - ready for real chart!
      </div>
    </div>
  );
};

export default SimpleChart;