import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DrawingToolbar from './DrawingToolbar';

describe('DrawingToolbar', () => {
  const mockOnToolSelect = jest.fn();
  const defaultProps = {
    currentTool: null,
    onToolSelect: mockOnToolSelect,
  };

  beforeEach(() => {
    mockOnToolSelect.mockClear();
  });

  it('renders cursor button', () => {
    render(<DrawingToolbar {...defaultProps} />);
    expect(screen.getByText('Cursor')).toBeInTheDocument();
  });

  it('renders line tools button', () => {
    render(<DrawingToolbar {...defaultProps} />);
    expect(screen.getByText('Line Tools')).toBeInTheDocument();
  });

  it('calls onToolSelect when cursor is clicked', () => {
    render(<DrawingToolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Cursor'));
    expect(mockOnToolSelect).toHaveBeenCalledWith(null);
  });

  it('opens dropdown when line tools button is clicked', () => {
    render(<DrawingToolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Line Tools'));
    expect(screen.getByText('Trend line')).toBeInTheDocument();
    expect(screen.getByText('Trend channel')).toBeInTheDocument();
    expect(screen.getByText('Ray')).toBeInTheDocument();
  });

  it('calls onToolSelect with correct line type when dropdown item is clicked', () => {
    render(<DrawingToolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Line Tools'));
    fireEvent.click(screen.getByText('Ray'));
    expect(mockOnToolSelect).toHaveBeenCalledWith('ray');
  });

  it('closes dropdown when clicking outside', () => {
    render(<DrawingToolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Line Tools'));
    expect(screen.getByText('Trend line')).toBeInTheDocument();
    
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Trend line')).not.toBeInTheDocument();
  });

  it('shows all 8 line types in dropdown', () => {
    render(<DrawingToolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Line Tools'));
    
    const expectedLineTypes = [
      'Trend line',
      'Trend channel', 
      'Ray',
      'Extended line',
      'Info line',
      'Horizontal line',
      'Horizontal ray',
      'Vertical line'
    ];

    expectedLineTypes.forEach(lineType => {
      expect(screen.getByText(lineType)).toBeInTheDocument();
    });
  });

  it('highlights current tool when selected', () => {
    render(<DrawingToolbar {...defaultProps} currentTool="trendline" />);
    const lineToolsButton = screen.getByText('Line Tools').closest('button');
    expect(lineToolsButton).toHaveClass('active');
  });
});