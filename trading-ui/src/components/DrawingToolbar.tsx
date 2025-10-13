import React from 'react';

interface DrawingToolbarProps {
  activeDrawingTool: string | null;
  onDrawingToolChange: (tool: string | null) => void;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeDrawingTool,
  onDrawingToolChange
}) => {
  const tools = [
    { id: 'cursor', icon: '↖️', title: 'Cursor' },
    { id: 'crosshair', icon: '✚', title: 'Crosshair' },
    null, // separator
    { id: 'trendline', icon: '📈', title: 'Trend Line' },
    { id: 'horizontal', icon: '━', title: 'Horizontal Line' },
    { id: 'vertical', icon: '┃', title: 'Vertical Line' },
    { id: 'ray', icon: '➡️', title: 'Ray' },
    null, // separator
    { id: 'rectangle', icon: '▭', title: 'Rectangle' },
    { id: 'circle', icon: '○', title: 'Circle' },
    { id: 'triangle', icon: '△', title: 'Triangle' },
    null, // separator
    { id: 'fibonacci', icon: '🌀', title: 'Fibonacci Retracement' },
    { id: 'fib-extension', icon: '🌊', title: 'Fibonacci Extension' },
    { id: 'channel', icon: '⫸', title: 'Parallel Channel' },
    null, // separator
    { id: 'arrow', icon: '→', title: 'Arrow' },
    { id: 'text', icon: 'T', title: 'Text' },
    { id: 'note', icon: '📝', title: 'Note' },
    null, // separator
    { id: 'measure', icon: '📏', title: 'Measure' },
    { id: 'zoom', icon: '🔍', title: 'Zoom' },
    { id: 'magnet', icon: '🧲', title: 'Magnet Mode' },
  ];

  const handleToolClick = (toolId: string) => {
    if (activeDrawingTool === toolId) {
      onDrawingToolChange(null);
    } else {
      onDrawingToolChange(toolId);
    }
  };

  return (
    <div className="drawing-toolbar">
      {tools.map((tool, index) => {
        if (tool === null) {
          return <div key={index} className="tool-separator" />;
        }

        return (
          <button
            key={tool.id}
            className={`tool-button ${activeDrawingTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolClick(tool.id)}
            title={tool.title}
          >
            {tool.icon}
          </button>
        );
      })}
    </div>
  );
};

export default DrawingToolbar;