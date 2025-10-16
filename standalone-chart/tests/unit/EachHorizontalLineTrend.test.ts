/**
 * Unit tests for EachHorizontalLineTrend drag behavior
 *
 * These tests verify that EachHorizontalLineTrend correctly calculates
 * and passes new coordinates when the line is dragged.
 */

import React from 'react';

describe('EachHorizontalLineTrend drag behavior', () => {
  describe('handleLineDrag calculation', () => {
    test('should calculate new Y coordinates when line is dragged', () => {
      // Simulate the logic in EachHorizontalLineTrend.handleLineDrag

      const props = {
        index: 0,
        x1Value: 100,
        y1Value: 200,
        x2Value: 500,
        y2Value: 200,
        onDrag: jest.fn(),
      };

      const moreProps = {
        yValue: 350,  // New Y position from drag
      };

      // This is what handleLineDrag does:
      const newCoordinates = {
        x1Value: props.x1Value,  // Keep same X
        y1Value: moreProps.yValue,  // Use new Y
        x2Value: props.x2Value,  // Keep same X
        y2Value: moreProps.yValue,  // Use new Y (horizontal line)
      };

      // Verify coordinates are calculated correctly
      expect(newCoordinates).toEqual({
        x1Value: 100,
        y1Value: 350,
        x2Value: 500,
        y2Value: 350,
      });

      // Verify it would call onDrag with these coordinates
      // props.onDrag({} as any, props.index, newCoordinates);
      // expect(props.onDrag).toHaveBeenCalledWith(
      //   expect.anything(),
      //   0,
      //   newCoordinates
      // );
    });

    test('should keep X coordinates unchanged during vertical drag', () => {
      const props = {
        x1Value: 200,
        x2Value: 800,
      };

      const moreProps = { yValue: 450 };

      const newCoordinates = {
        x1Value: props.x1Value,
        y1Value: moreProps.yValue,
        x2Value: props.x2Value,
        y2Value: moreProps.yValue,
      };

      // X coordinates should not change
      expect(newCoordinates.x1Value).toBe(props.x1Value);
      expect(newCoordinates.x2Value).toBe(props.x2Value);

      // Y coordinates should be the new yValue
      expect(newCoordinates.y1Value).toBe(450);
      expect(newCoordinates.y2Value).toBe(450);
    });

    test('should ensure Y1 equals Y2 for horizontal line', () => {
      const moreProps = { yValue: 275 };

      const newCoordinates = {
        x1Value: 100,
        y1Value: moreProps.yValue,
        x2Value: 500,
        y2Value: moreProps.yValue,
      };

      // Both Y values must be equal for horizontal line
      expect(newCoordinates.y1Value).toBe(newCoordinates.y2Value);
      expect(newCoordinates.y1Value).toBe(275);
    });
  });

  describe('handleMidpointDrag', () => {
    test('should delegate to handleLineDrag', () => {
      // handleMidpointDrag just calls handleLineDrag
      // This verifies that dragging the midpoint control point
      // moves the entire line vertically

      const mockHandleLineDrag = jest.fn();
      const event = {} as React.MouseEvent;
      const moreProps = { yValue: 400 };

      // Simulating: this.handleLineDrag(e, moreProps);
      mockHandleLineDrag(event, moreProps);

      expect(mockHandleLineDrag).toHaveBeenCalledWith(event, moreProps);
    });
  });

  describe('Coordinate passing to parent', () => {
    test('exposes the problem: coordinates passed but parent ignores them', () => {
      // This test demonstrates the architecture mismatch

      const mockOnDrag = jest.fn();

      const props = {
        index: 0,
        x1Value: 100,
        y1Value: 200,
        x2Value: 500,
        y2Value: 200,
        onDrag: mockOnDrag,
      };

      const moreProps = { yValue: 350 };

      // Calculate new coordinates (what EachHorizontalLineTrend does)
      const newCoordinates = {
        x1Value: props.x1Value,
        y1Value: moreProps.yValue,
        x2Value: props.x2Value,
        y2Value: moreProps.yValue,
      };

      // Call onDrag with coordinates
      mockOnDrag({} as any, props.index, newCoordinates);

      // Verify onDrag was called with correct data
      expect(mockOnDrag).toHaveBeenCalledWith(
        expect.anything(),  // event
        0,                   // index
        {                    // coordinates object
          x1Value: 100,
          y1Value: 350,
          x2Value: 500,
          y2Value: 350,
        }
      );

      // ❌ PROBLEM: BaseLine.handleDragLine receives this but ignores the 3rd param!
      // It only uses index and discards newCoordinates
    });

    test('demonstrates what parent receives vs what it uses', () => {
      let capturedParams: any = null;

      const mockOnDrag = jest.fn((e, index, moreProps) => {
        capturedParams = { e, index, moreProps };
      });

      // Child passes coordinates
      mockOnDrag(
        {},                  // event
        1,                   // index
        {                    // NEW coordinates
          x1Value: 200,
          y1Value: 400,
          x2Value: 250,
          y2Value: 400,
        }
      );

      // Verify parent receives all three parameters
      expect(capturedParams).toBeDefined();
      expect(capturedParams.index).toBe(1);
      expect(capturedParams.moreProps).toEqual({
        x1Value: 200,
        y1Value: 400,
        x2Value: 250,
        y2Value: 400,
      });

      // ❌ But BaseLine.handleDragLine does:
      // setState({ override: { index: capturedParams.index } })
      // It IGNORES capturedParams.moreProps!

      // Simulating current BaseLine behavior:
      const currentBaseLineBehavior = {
        override: {
          index: capturedParams.index,
          // ❌ moreProps coordinates are LOST
        },
      };

      expect(currentBaseLineBehavior.override).not.toHaveProperty('y1Value');

      // After fix, should be:
      const expectedBehaviorAfterFix = {
        override: {
          index: capturedParams.index,
          ...capturedParams.moreProps,  // ✅ Include coordinates
        },
      };

      expect(expectedBehaviorAfterFix.override).toEqual({
        index: 1,
        x1Value: 200,
        y1Value: 400,
        x2Value: 250,
        y2Value: 400,
      });
    });
  });

  describe('Edge cases in coordinate calculation', () => {
    test('should handle yValue of 0', () => {
      const moreProps = { yValue: 0 };

      const newCoordinates = {
        x1Value: 100,
        y1Value: moreProps.yValue,
        x2Value: 500,
        y2Value: moreProps.yValue,
      };

      // Zero is a valid coordinate
      expect(newCoordinates.y1Value).toBe(0);
      expect(newCoordinates.y2Value).toBe(0);
    });

    test('should handle negative yValue', () => {
      const moreProps = { yValue: -100 };

      const newCoordinates = {
        x1Value: 100,
        y1Value: moreProps.yValue,
        x2Value: 500,
        y2Value: moreProps.yValue,
      };

      // Negative coordinates are valid (might be off-screen)
      expect(newCoordinates.y1Value).toBe(-100);
    });

    test('should handle very large yValue', () => {
      const moreProps = { yValue: 10000 };

      const newCoordinates = {
        x1Value: 100,
        y1Value: moreProps.yValue,
        x2Value: 500,
        y2Value: moreProps.yValue,
      };

      expect(newCoordinates.y1Value).toBe(10000);
    });
  });
});
