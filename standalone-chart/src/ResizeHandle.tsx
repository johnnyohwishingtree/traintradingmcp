import React from 'react';
import './ResizeHandle.css';

interface ResizeHandleProps {
  onResize: (deltaY: number) => void;
  position: 'top' | 'bottom';
  style?: React.CSSProperties;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize, position, style }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    e.preventDefault();
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      onResize(deltaY);
      setStartY(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, onResize]);

  return (
    <div 
      className={`resize-handle resize-handle-${position} ${isDragging ? 'dragging' : ''}`}
      style={{
        cursor: 'ns-resize',
        ...style
      }}
      onMouseDown={handleMouseDown}
      data-testid={`resize-handle-${position}`}
    >
      <div className="resize-handle-line" />
    </div>
  );
};

export default ResizeHandle;