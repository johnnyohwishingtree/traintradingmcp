import React, { useState, useRef, useEffect } from 'react';
import './ContextualTextOverlay.css';

interface ContextualTextOverlayProps {
  // Detect which component is selected and being hovered
  selectedComponent: {
    type: string;
    index: number;
    bounds?: DOMRect; // Screen bounds of the component
  } | null;

  // Callback when text is added
  onTextAdd: (componentType: string, componentIndex: number, text: string) => void;
}

const ContextualTextOverlay: React.FC<ContextualTextOverlayProps> = ({
  selectedComponent,
  onTextAdd
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Reset when component changes
  useEffect(() => {
    setIsEditing(false);
    setText('');
  }, [selectedComponent?.type, selectedComponent?.index]);

  if (!selectedComponent || !selectedComponent.bounds) {
    return null;
  }

  const handleAddTextClick = () => {
    setIsEditing(true);
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onTextAdd(selectedComponent.type, selectedComponent.index, text.trim());
      setText('');
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setText('');
    }
  };

  const bounds = selectedComponent.bounds;

  // Position overlay very close to the component with a hover buffer zone
  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${bounds.left + bounds.width / 2}px`,
    top: `${bounds.top - 50}px`, // Positioned above with buffer
    transform: 'translateX(-50%)',
    pointerEvents: 'auto',
    zIndex: 1000,
  };

  // Add a hover buffer zone that extends from the component to the button
  const bufferZoneStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${bounds.left}px`,
    top: `${bounds.top - 50}px`,
    width: `${bounds.width}px`,
    height: '50px', // Buffer zone from button to component
    pointerEvents: 'none', // Don't interfere with other interactions
    zIndex: 999,
  };

  return (
    <>
      {/* Invisible buffer zone to prevent hover loss when moving toward button */}
      <div style={bufferZoneStyle} />

      <div
        ref={overlayRef}
        className="contextual-text-overlay"
        style={overlayStyle}
      >
        {!isEditing ? (
          <button
            className="add-text-button"
            onClick={handleAddTextClick}
            data-testid="add-text-button"
          >
            <span className="add-text-icon">T+</span>
            <span className="add-text-label">Add text</span>
          </button>
        ) : (
          <div className="text-input-container">
            <input
              ref={inputRef}
              type="text"
              className="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              placeholder="Type text and press Enter"
              data-testid="text-input"
              maxLength={50}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ContextualTextOverlay;
