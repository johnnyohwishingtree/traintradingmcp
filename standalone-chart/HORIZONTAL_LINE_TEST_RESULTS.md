# Horizontal Line Component - Test Results and Findings

## Date: October 15, 2025

## Summary
Tested the horizontal line component functionality using Playwright MCP server to verify drawing, selection, and movement capabilities.

## Test Results

### ✅ Successfully Completed
1. **Drawing**: Horizontal line can be drawn with a single click
2. **Tool Activation**: Horizontal line tool activates correctly via dropdown menu
3. **Visual Rendering**: Line renders correctly across the chart
4. **Cursor Mode Switch**: Can switch to cursor mode after drawing
5. **Selection**: Line shows "selected" state with label

### ❌ Issues Discovered

#### 1. No Control Points Visible
- **Expected**: When a horizontal line is selected, control points (circles) should appear to allow dragging
- **Actual**: No control points are visible on the selected horizontal line
- **Evidence**: Test found only 6 circles (all zoom buttons at cx/cy ~315, 514, 554, 610)
- **Impact**: Cannot visually identify where to drag the line

#### 2. Line Disappears After Drag Attempt
- **Expected**: Line should move to new Y position when dragged
- **Actual**: Line disappears completely after drag operation
- **Evidence**:
  - Before drag: Line visible at Y ~208.18 (drag-03-line-placed.png)
  - After drag: Line completely gone (drag-06-after-drag.png)
- **Root Cause**: Unknown - possibly deleted, moved off-screen, or drag handler issue

#### 3. Line Not Detectable via DOM Query
- **Issue**: Test selector `document.querySelectorAll('line')` with filter for horizontal lines (y1≈y2, width>100) returns `null`
- **Implication**: The horizontal line may be rendered differently than expected, or has unusual attributes

## Test Files Created

### 1. `tests/horizontal-line-mcp-test.spec.js`
- **Purpose**: Basic horizontal line drawing and selection test
- **Status**: ✅ PASSES
- **Coverage**:
  - Draw horizontal line
  - Switch to cursor mode
  - Click to select line
  - Count circles (control points)

### 2. `tests/horizontal-line-drag-test.spec.js`
- **Purpose**: Comprehensive drag functionality test
- **Status**: ❌ FAILS (line disappears)
- **Coverage**:
  - Draw horizontal line
  - Select line in cursor mode
  - Attempt drag operation
  - Verify line moved to new position

## Screenshots Generated

### Successful Drawing Test (mcp-*.png)
- `mcp-01-initial.png` - Initial chart state
- `mcp-02-dropdown-open.png` - Line tools dropdown open
- `mcp-03-tool-activated.png` - Horizontal line tool activated
- `mcp-04-line-placed.png` - ✅ Horizontal line successfully drawn
- `mcp-05-cursor-mode.png` - Switched to cursor mode
- `mcp-06-line-selected.png` - ✅ Line shows "selected" label
- `mcp-07-final.png` - Final state

### Drag Test (drag-*.png)
- `drag-01-initial.png` - Initial state
- `drag-02-tool-activated.png` - Tool activated
- `drag-03-line-placed.png` - ✅ Line visible at ~208.18
- `drag-04-cursor-mode.png` - Cursor mode active
- `drag-05-line-selected.png` - Line selected
- `drag-06-after-drag.png` - ❌ LINE DISAPPEARED
- `drag-07-final.png` - Line still missing

## Code Analysis

### HorizontalLine Component
**File**: `/financial-charts/src/interactive/HorizontalLine.tsx`

**Key Findings**:
- Extends `BaseLine` component
- Uses `EachHorizontalLineTrend` wrapper for rendering
- Implements single-click placement (override `handleEnd`)
- Has `applyConstraints` to lock Y-axis movement

### Expected Control Points
**File**: `/financial-charts/src/interactive/wrapper/EachHorizontalLineTrend.tsx` (needs investigation)

**Questions**:
- Does this wrapper render control points when selected?
- Are control points implemented for horizontal lines?
- Is there drag handling code?

## Recommended Next Steps

### Investigation Required

1. **Read EachHorizontalLineTrend.tsx Implementation**
   - Check if control points are rendered
   - Verify drag handlers exist
   - Compare with EachTrendLine.tsx (known working)

2. **Debug Line Rendering**
   - Add console logging to see actual line attributes
   - Check if line uses `<line>` element or custom SVG path
   - Verify stroke-width and visibility

3. **Test Control Point Rendering**
   - Manually inspect selected line in browser DevTools
   - Check if circles exist but are hidden (opacity: 0, display: none)
   - Verify CSS classes applied to control points

4. **Investigate Drag Behavior**
   - Add logging to onDragStart, onDrag, onDragComplete handlers
   - Check if drag moves line to invalid coordinates
   - Verify coordinate transformation from screen to data coordinates

### Potential Fixes

1. **If control points are missing**:
   - Add control point rendering to EachHorizontalLineTrend
   - Model after EachTrendLine implementation
   - Ensure control points have proper event handlers

2. **If drag handler is broken**:
   - Fix coordinate transformation
   - Add bounds checking to prevent off-screen moves
   - Ensure drag updates both line position and state

3. **If line deletion occurs**:
   - Check for accidental delete/clear logic in drag handlers
   - Verify drag completion doesn't remove line from array
   - Add validation before state updates

## Test Commands

```bash
# Run basic horizontal line test
npx playwright test tests/horizontal-line-mcp-test.spec.js --project=chromium --headed

# Run drag functionality test
npx playwright test tests/horizontal-line-drag-test.spec.js --project=chromium --headed

# View test results
npx playwright show-report
```

## Conclusion

The horizontal line component can be **drawn and selected**, but **cannot be moved** due to:
1. Missing or invisible control points
2. Drag operation causing line to disappear
3. DOM query unable to locate the rendered line

**Priority**: HIGH - This breaks the core interaction model for horizontal lines. Users expect to be able to move horizontal support/resistance lines after drawing them.

**Impact**: Horizontal lines are currently "draw-only" - once placed, they cannot be adjusted without deleting and redrawing.
