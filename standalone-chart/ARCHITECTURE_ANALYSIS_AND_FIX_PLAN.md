# Horizontal Line Architecture Analysis & Fix Plan

## Problem Statement

The horizontal line component cannot be moved after being drawn. The line disappears when attempting to drag it.

## Root Cause Analysis

### 1. **Signature Mismatch in Drag Handlers** ⚠️ CRITICAL

**EachHorizontalLineTrend.tsx** expects `onDrag` with this signature:
```typescript
// Line 18 - Expected signature
readonly onDrag: (e: React.MouseEvent, index: number | undefined, moreProps: any) => void;

// Line 167-182 - How it's called
private readonly handleLineDrag = (e: React.MouseEvent, moreProps: any) => {
    const { index, onDrag, x1Value, x2Value } = this.props;
    const { yValue } = moreProps;

    if (onDrag) {
        onDrag(e, index, {  // ❌ WRONG: Passing object as 3rd param
            x1Value: x1Value,
            y1Value: yValue,
            x2Value: x2Value,
            y2Value: yValue,
        });
    }
};
```

**BaseLine.tsx** provides `handleDragLine` with different expectations:
```typescript
// Line 295-306 - What it actually does
protected readonly handleDragLine = (e: React.MouseEvent, index: number | undefined, moreProps: any) => {
    if (index !== undefined) {
        console.log('🖱️ Line drag start, index:', index);
        this.setState({
            override: {
                index,  // ❌ ONLY sets index, expects coordinates elsewhere
            },
        });
    }
};
```

**The Problem**:
- `EachHorizontalLineTrend.handleLineDrag` passes NEW coordinates in `moreProps` (3rd parameter)
- `BaseLine.handleDragLine` IGNORES the 3rd parameter's coordinates
- `BaseLine.handleDragLine` only sets `override.index` without any coordinate data
- `getValueFromOverride` then fails to find coordinates and returns original values
- Result: Line doesn't move, or disappears due to invalid state

### 2. **Missing Coordinate Passing** ⚠️ CRITICAL

**Current Flow (BROKEN)**:
```
User drags midpoint
  ↓
EachHorizontalLineTrend.handleMidpointDrag
  ↓
EachHorizontalLineTrend.handleLineDrag (gets yValue from moreProps)
  ↓
Calls onDrag(e, index, { x1Value, y1Value: yValue, x2Value, y2Value: yValue })
  ↓
BaseLine.handleDragLine receives (e, index, coordinatesObject)
  ↓
❌ IGNORES coordinatesObject, only sets override.index
  ↓
Render calls getValueFromOverride(override, index, "y1Value", y)
  ↓
❌ override has no y1Value, returns original y
  ↓
Line doesn't move OR disappears
```

**Expected Flow (FIXED)**:
```
User drags midpoint
  ↓
EachHorizontalLineTrend.handleMidpointDrag
  ↓
Calls onDrag with NEW coordinates
  ↓
BaseLine.handleDragLine STORES the new coordinates in override
  ↓
Render uses override coordinates
  ↓
Line moves to new position
```

### 3. **Architecture Design Flaw**

The current design has a fundamental mismatch:

**BaseLine** expects:
- Wrapper components handle drag internally
- Wrapper updates via `override` state
- BaseLine reads from `override` in render

**EachHorizontalLineTrend** does:
- Calculates new coordinates during drag
- Passes coordinates TO BaseLine via `onDrag`
- Expects BaseLine to update state

**This is a coordination mismatch!**

## Comparison with Working Component

Let me check how TrendLine does it (which works):

### How TrendLine Works

**EachTrendLine.tsx** (working):
- Has its own drag handling with coordinate tracking
- Uses direct DOM event handlers
- Updates coordinates via callbacks
- Manages its own `selected` state

**TrendLine.tsx** (working):
- Receives updated coordinates from EachTrendLine
- Passes complete line objects to wrapper
- Callbacks update parent state directly

## Fix Plan

### Option 1: Fix BaseLine.handleDragLine (RECOMMENDED)

**Change**: Make `BaseLine.handleDragLine` accept and store coordinates from wrapper

**File**: `/financial-charts/src/interactive/BaseLine.tsx`

```typescript
// BEFORE (Line 295-306)
protected readonly handleDragLine = (e: React.MouseEvent, index: number | undefined, moreProps: any) => {
    if (index !== undefined) {
        console.log('🖱️ Line drag start, index:', index);
        this.setState({
            override: {
                index,
            },
        });
    }
};

// AFTER (FIXED)
protected readonly handleDragLine = (e: React.MouseEvent, index: number | undefined, moreProps: any) => {
    if (index !== undefined) {
        console.log('🖱️ Line drag, index:', index, 'coordinates:', moreProps);

        // Accept coordinates from wrapper component
        const coordinates = typeof moreProps === 'object' &&
                          'x1Value' in moreProps ? moreProps : {};

        this.setState({
            override: {
                index,
                ...coordinates,  // Spread the coordinates (x1Value, y1Value, x2Value, y2Value)
            },
        });
    }
};
```

**Pros**:
- Minimal change
- Fixes the immediate issue
- Backwards compatible (checks if moreProps has coordinates)
- Works with EachHorizontalLineTrend's current implementation

**Cons**:
- Relies on convention (moreProps can be coordinates)
- Not type-safe

### Option 2: Change EachHorizontalLineTrend to Match Architecture

**Change**: Make EachHorizontalLineTrend handle drag internally like EachTrendLine

**File**: `/financial-charts/src/interactive/wrapper/EachHorizontalLineTrend.tsx`

This would require:
1. Add internal state for drag tracking
2. Handle coordinate updates internally
3. Only call `onDragComplete` with final coordinates
4. Change `onDrag` signature to match what BaseLine expects

**Pros**:
- Cleaner architecture
- More self-contained component
- Matches EachTrendLine pattern

**Cons**:
- Larger refactor
- More complex component
- Need to understand coordinate transformation
- Higher risk of introducing bugs

### Option 3: Hybrid - Fix Both Sides

**Change**: Improve both components for clarity

1. **BaseLine.handleDragLine**: Accept coordinates properly
2. **EachHorizontalLineTrend**: Add better type safety and documentation

**Pros**:
- Most robust solution
- Clear contract between components
- Type-safe

**Cons**:
- More work
- Touches more code

## Recommended Solution

### **Go with Option 1** - Fix BaseLine.handleDragLine

**Why**:
1. **Smallest change** - Only one method in one file
2. **Immediate fix** - Solves the disappearing line issue
3. **Low risk** - Simple conditional logic
4. **Backwards compatible** - Won't break existing components
5. **Can be enhanced later** - Doesn't prevent future refactoring

### Implementation Steps

1. **Modify BaseLine.tsx**:
   ```typescript
   protected readonly handleDragLine = (e: React.MouseEvent, index: number | undefined, moreProps: any) => {
       if (index !== undefined) {
           console.log('🖱️ Line drag, index:', index);

           // Check if moreProps contains coordinate updates
           const hasCoordinates = typeof moreProps === 'object' &&
                                ('x1Value' in moreProps || 'y1Value' in moreProps);

           if (hasCoordinates) {
               // Wrapper is providing new coordinates (e.g., EachHorizontalLineTrend)
               console.log('   Coordinates:', moreProps);
               this.setState({
                   override: {
                       index,
                       x1Value: moreProps.x1Value,
                       y1Value: moreProps.y1Value,
                       x2Value: moreProps.x2Value,
                       y2Value: moreProps.y2Value,
                   },
               });
           } else {
               // Legacy behavior - just set index
               this.setState({
                   override: {
                       index,
                   },
               });
           }
       }
   };
   ```

2. **Test the fix**:
   ```bash
   # Rebuild library
   cd financial-charts && npm run build

   # Restart app
   ./restart-servers.sh

   # Run drag test
   npx playwright test tests/horizontal-line-drag-test.spec.js
   ```

3. **Verify**:
   - Line should remain visible after drag
   - Line should move to new Y position
   - Control point should be visible when selected
   - No console errors

## Additional Investigation Needed

### Why is control point not visible?

**Check**:
1. Is `r` (radius) being passed correctly? (Line 64 in HorizontalLine.tsx)
2. Is `selected` state being set? (Line 52 in HorizontalLine.tsx)
3. Are `edgeFill` and `edgeStroke` colors visible? (Lines 61-62)
4. Is ClickableCircle rendering? (Line 116-129 in EachHorizontalLineTrend.tsx)

**Debug**:
```typescript
// Add to EachHorizontalLineTrend.render() after line 82
console.log(`🎯 Rendering horizontal line: selected=${selected}, hover=${hover}, r=${r}, midX=${midX}, midY=${horizontalY}`);
console.log(`   Edge: fill=${edgeFill}, stroke=${edgeStroke}, width=${edgeStrokeWidth}`);
```

### Why does line use different X coordinates?

**Issue**: Line is drawn with `start: [x, y], end: [x + 1, y]`

This means x1 = x, x2 = x + 1 (only 1 pixel wide!)

For XLINE (infinite horizontal), this should probably be the full chart width, not x+1.

**Investigate**: Does InteractiveStraightLine handle XLINE type specially to extend infinitely?

## Success Criteria

After implementing the fix:

✅ Horizontal line can be drawn with single click
✅ Line shows control point when selected
✅ Control point can be dragged up/down
✅ Line moves to new Y position during drag
✅ Line persists after drag (doesn't disappear)
✅ Drag complete callback updates parent state
✅ Line can be selected again after dragging

## Timeline

- **Fix implementation**: 15 minutes
- **Build and test**: 10 minutes
- **Verification**: 10 minutes
- **Total**: ~35 minutes

## Risks

**Low Risk** - The fix is isolated to one method and adds conditional logic. Existing components that don't pass coordinates in `moreProps` will continue to work with legacy behavior.

