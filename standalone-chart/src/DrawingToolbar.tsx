import React, { useState, useRef, useEffect } from 'react';
import './DrawingToolbar.css';

interface DrawingToolbarProps {
  currentTool: string | null;
  onToolSelect: (tool: string | null) => void;
}

// Custom SVG Icons matching TradingView style
const CursorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 2l4.5 10.5L8 9l3.5 1.5L2 2z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.8"/>
  </svg>
);

const TrendLineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="12" x2="13" y2="4" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="13" cy="4" r="1.5" fill="currentColor"/>
  </svg>
);

// New line type icons
const TrendChannelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="2" y1="12" x2="12" y2="4" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="4" y1="14" x2="14" y2="6" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="2" cy="12" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="4" r="1.2" fill="currentColor"/>
    <circle cx="4" cy="14" r="1.2" fill="currentColor"/>
  </svg>
);

const RayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="12" x2="13" y2="4" stroke="currentColor" strokeWidth="1.5"/>
    <polygon points="11,3 13,4 11,5" fill="currentColor"/>
    <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);

const ExtendedLineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="1" y1="10" x2="15" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2,1"/>
    <line x1="4" y1="9" x2="12" y2="7" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="8.5" r="1.5" fill="currentColor"/>
    <circle cx="10" cy="7.5" r="1.5" fill="currentColor"/>
  </svg>
);

const InfoLineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="12" x2="13" y2="4" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1"/>
    <text x="8" y="9" fontSize="3" fill="currentColor" textAnchor="middle">i</text>
    <circle cx="3" cy="12" r="1.2" fill="currentColor"/>
    <circle cx="13" cy="4" r="1.2" fill="currentColor"/>
  </svg>
);

const HorizontalRayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5"/>
    <polygon points="12,7 14,8 12,9" fill="currentColor"/>
    <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
  </svg>
);

const DropdownArrowIcon = () => (
  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
    <path d="M1 2L4 5L7 2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FibonacciIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    {/* Fibonacci retracement levels */}
    <line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="2" y1="5.5" x2="14" y2="5.5" stroke="currentColor" strokeWidth="1" opacity="0.8"/>
    <line x1="2" y1="7.5" x2="14" y2="7.5" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
    <line x1="2" y1="9.5" x2="14" y2="9.5" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
    <line x1="2" y1="11.5" x2="14" y2="11.5" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="2" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="1.5"/>
    {/* Base line points */}
    <circle cx="2" cy="3" r="1" fill="currentColor"/>
    <circle cx="14" cy="13" r="1" fill="currentColor"/>
  </svg>
);

const TrianglePatternIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 12L8 4L13 12L3 12z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="8" cy="4" r="1.5" fill="currentColor"/>
    <circle cx="13" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);

// Additional trading icons for a more comprehensive toolbar
const HorizontalLineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="2" cy="8" r="1" fill="currentColor"/>
    <circle cx="14" cy="8" r="1" fill="currentColor"/>
  </svg>
);

const VerticalLineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="2" r="1" fill="currentColor"/>
    <circle cx="8" cy="14" r="1" fill="currentColor"/>
  </svg>
);

const RectangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="5" width="10" height="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="3" cy="5" r="1" fill="currentColor"/>
    <circle cx="13" cy="11" r="1" fill="currentColor"/>
  </svg>
);

const CircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="8" cy="3" r="1" fill="currentColor"/>
    <circle cx="8" cy="13" r="1" fill="currentColor"/>
  </svg>
);

const TextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 3h8M8 3v10M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const MeasureIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="11" x2="13" y2="5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="3" y1="9" x2="3" y2="13" stroke="currentColor" strokeWidth="1"/>
    <line x1="13" y1="3" x2="13" y2="7" stroke="currentColor" strokeWidth="1"/>
    <circle cx="3" cy="11" r="1" fill="currentColor"/>
    <circle cx="13" cy="5" r="1" fill="currentColor"/>
    <text x="7" y="9" fontSize="4" fill="currentColor" textAnchor="middle">L</text>
  </svg>
);

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({ currentTool, onToolSelect }) => {
  const [isLineDropdownOpen, setIsLineDropdownOpen] = useState(false);
  const [selectedLineType, setSelectedLineType] = useState('trendline');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Line types for the dropdown (removed trendchannel - now standalone)
  const lineTypes = [
    { id: 'trendline', icon: <TrendLineIcon />, title: 'Trend line' },
    { id: 'ray', icon: <RayIcon />, title: 'Ray' },
    { id: 'extendedline', icon: <ExtendedLineIcon />, title: 'Extended line' },
    { id: 'infoline', icon: <InfoLineIcon />, title: 'Info line' },
    { id: 'horizontalline', icon: <HorizontalLineIcon />, title: 'Horizontal line' },
    { id: 'horizontalray', icon: <HorizontalRayIcon />, title: 'Horizontal ray' },
    { id: 'verticalline', icon: <VerticalLineIcon />, title: 'Vertical line' },
  ];

  const otherTools = [
    { id: 'cursor', icon: <CursorIcon />, title: 'Selection Tool - Select and move objects' },
    { id: 'trendchannel', icon: <TrendChannelIcon />, title: 'Trend Channel - Draw parallel trend lines' },
    { id: 'fibonacci', icon: <FibonacciIcon />, title: 'Fibonacci Retracement - Draw Fibonacci retracement levels' },
    { id: 'patterns', icon: <TrianglePatternIcon />, title: 'Triangle Pattern - Draw triangle chart patterns' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLineDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLineTypeSelect = (lineType: string) => {
    setSelectedLineType(lineType);
    onToolSelect(lineType);
    setIsLineDropdownOpen(false);
  };

  const handleLineButtonClick = () => {
    // Main button area - always activate the selected line type
    onToolSelect(selectedLineType);
  };

  const handleDropdownArrowClick = (e: React.MouseEvent) => {
    // Prevent the main button click from firing
    e.stopPropagation();
    // Toggle dropdown
    setIsLineDropdownOpen(!isLineDropdownOpen);
  };

  const getCurrentLineIcon = () => {
    const currentLineType = lineTypes.find(line => line.id === selectedLineType);
    return currentLineType ? currentLineType.icon : <TrendLineIcon />;
  };

  const isLineToolActive = () => {
    return currentTool && lineTypes.some(line => line.id === currentTool);
  };

  return (
    <div className="drawing-toolbar" data-testid="drawing-toolbar">
      {/* Cursor tool */}
      <button
        className={`tool-button ${currentTool === null ? 'active' : ''}`}
        onClick={() => onToolSelect(null)}
        title="Selection Tool - Select and move objects"
        data-testid="cursor-button"
      >
        <span className="tool-icon"><CursorIcon /></span>
      </button>

      {/* Line tools with dropdown */}
      <div className="line-tool-container" ref={dropdownRef} data-testid="line-tool-container">
        <button
          className={`tool-button line-tool-button ${isLineToolActive() ? 'active' : ''}`}
          onClick={handleLineButtonClick}
          title={lineTypes.find(line => line.id === selectedLineType)?.title || 'Line Tools'}
          data-testid="line-tools-button"
        >
          <span className="tool-icon">{getCurrentLineIcon()}</span>
          <span 
            className="dropdown-arrow"
            onClick={handleDropdownArrowClick}
            title="Show line type options"
            data-testid="dropdown-arrow"
          >
            <DropdownArrowIcon />
          </span>
        </button>

        {isLineDropdownOpen && (
          <div className="line-dropdown" data-testid="line-dropdown">
            {lineTypes.map((lineType) => (
              <button
                key={lineType.id}
                className={`dropdown-item ${selectedLineType === lineType.id ? 'selected' : ''}`}
                onClick={() => handleLineTypeSelect(lineType.id)}
                title={lineType.title}
                data-testid={`line-type-${lineType.id}`}
              >
                <span className="dropdown-icon">{lineType.icon}</span>
                <span className="dropdown-label">{lineType.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Other tools */}
      {otherTools.slice(1).map((tool) => (
        <button
          key={tool.id}
          className={`tool-button ${currentTool === tool.id ? 'active' : ''}`}
          onClick={() => onToolSelect(tool.id)}
          title={tool.title}
          data-testid={`${tool.id}-button`}
        >
          <span className="tool-icon">{tool.icon}</span>
        </button>
      ))}
    </div>
  );
};

export default DrawingToolbar;