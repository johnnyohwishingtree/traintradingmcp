import React from 'react';
import './ReplayControls.css';

interface ReplayControlsProps {
  isPlaying: boolean;
  replayPosition: number;
  totalBars: number;
  replaySpeed: number;
  data?: any[];
  replayEndPosition?: number | null;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSpeedChange: (speed: number) => void;
  onPositionChange: (position: number) => void;
  onExit: () => void;
  onDateSelect?: (position: number) => void;
  onEndDateSelect?: (position: number) => void;
  onClearEndDate?: () => void;
}

const ReplayControls: React.FC<ReplayControlsProps> = ({
  isPlaying,
  replayPosition,
  totalBars,
  replaySpeed,
  data,
  replayEndPosition,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onSpeedChange,
  onPositionChange,
  onExit,
  onDateSelect,
  onEndDateSelect,
  onClearEndDate
}) => {
  const effectiveTotal = replayEndPosition || totalBars;
  const progressPercentage = (replayPosition / effectiveTotal) * 100;
  
  const formatDate = (position: number) => {
    // Get actual date from data if available
    if (data && data[position - 1]) {
      const dataPoint = data[position - 1];
      if (dataPoint.date) {
        return new Date(dataPoint.date).toLocaleDateString();
      }
    }
    // Fallback calculation
    const date = new Date();
    date.setDate(date.getDate() - (totalBars - position));
    return date.toLocaleDateString();
  };
  
  const formatDateTime = (position: number) => {
    if (data && data[position - 1]) {
      const dataPoint = data[position - 1];
      if (dataPoint.date) {
        const d = new Date(dataPoint.date);
        return d.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    return formatDate(position);
  };
  
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    if (data) {
      // Find the closest data point to the selected date
      let closestIndex = 0;
      let minDiff = Infinity;
      
      data.forEach((point, index) => {
        if (point.date) {
          const pointDate = new Date(point.date);
          const diff = Math.abs(selectedDate.getTime() - pointDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = index;
          }
        }
      });
      
      if (onDateSelect) {
        onDateSelect(closestIndex + 1);
      } else {
        onPositionChange(closestIndex + 1);
      }
    }
  };

  const handleEndDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    if (data && onEndDateSelect) {
      // Find the closest data point to the selected date
      let closestIndex = 0;
      let minDiff = Infinity;
      
      data.forEach((point, index) => {
        if (point.date) {
          const pointDate = new Date(point.date);
          const diff = Math.abs(selectedDate.getTime() - pointDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = index;
          }
        }
      });
      
      onEndDateSelect(closestIndex + 1);
    }
  };

  const getEndDateValue = () => {
    if (data && replayEndPosition && data[replayEndPosition - 1]) {
      const dataPoint = data[replayEndPosition - 1];
      if (dataPoint.date) {
        const d = new Date(dataPoint.date);
        return d.toISOString().split('T')[0];
      }
    }
    // Default to last date in dataset
    if (data && data.length > 0) {
      const lastPoint = data[data.length - 1];
      if (lastPoint.date) {
        const d = new Date(lastPoint.date);
        return d.toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0];
  };
  
  const getCurrentDateValue = () => {
    if (data && data[replayPosition - 1]) {
      const dataPoint = data[replayPosition - 1];
      if (dataPoint.date) {
        const d = new Date(dataPoint.date);
        // Format as YYYY-MM-DD for input[type="date"]
        return d.toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="replay-controls-overlay" data-testid="replay-controls-overlay">
      <div className="replay-controls" data-testid="replay-controls">
        <div className="replay-header">
          <span className="replay-title">📊 Replay Mode</span>
          <button className="replay-exit" onClick={onExit} title="Exit replay" data-testid="replay-exit-button">
            ✕
          </button>
        </div>
        
        <div className="replay-date-picker" data-testid="start-date-picker">
          <label>Start Date:</label>
          <input 
            type="date" 
            className="date-input"
            value={getCurrentDateValue()}
            onChange={handleDateInputChange}
            data-testid="start-date-input"
          />
          <span className="current-datetime">{formatDateTime(replayPosition)}</span>
        </div>
        
        <div className="replay-date-picker" data-testid="end-date-picker">
          <label>End Date:</label>
          <input 
            type="date" 
            className="date-input"
            value={getEndDateValue()}
            onChange={handleEndDateInputChange}
            data-testid="end-date-input"
          />
          {replayEndPosition && onClearEndDate && (
            <button 
              className="clear-end-date-btn"
              onClick={onClearEndDate}
              title="Clear end date limit"
            >
              ✕
            </button>
          )}
          <span className="end-datetime">
            {replayEndPosition ? formatDateTime(replayEndPosition) : 'No limit'}
          </span>
        </div>
        
        <div className="replay-progress">
          <div className="progress-info">
            <span>Bar {replayPosition} / {replayEndPosition || totalBars}</span>
            <span>{formatDate(replayPosition)}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
            <input 
              type="range"
              className="progress-slider"
              min="1"
              max={effectiveTotal}
              value={replayPosition}
              onChange={(e) => onPositionChange(parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div className="replay-buttons">
          <button 
            className="replay-btn step"
            onClick={onStepBackward}
            title="Step backward"
          >
            ⏮
          </button>
          
          {isPlaying ? (
            <button 
              className="replay-btn play-pause"
              onClick={onPause}
              title="Pause"
            >
              ⏸
            </button>
          ) : (
            <button 
              className="replay-btn play-pause"
              onClick={onPlay}
              title="Play"
            >
              ▶
            </button>
          )}
          
          <button 
            className="replay-btn step"
            onClick={onStepForward}
            title="Step forward"
          >
            ⏭
          </button>
        </div>
        
        <div className="replay-speed">
          <label>Speed:</label>
          <select 
            value={replaySpeed} 
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="speed-selector"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReplayControls;