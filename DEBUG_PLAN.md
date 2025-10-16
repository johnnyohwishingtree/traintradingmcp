# Automated Debug Plan for Horizontal Line Drag Bug

## Date: October 15, 2025

## Current Status
- Bug: Horizontal line disappears when dragged
- Fix attempted: Modified BaseLine.handleDragLine to accept coordinates
- Result: Test still failing - line disappears after drag

## MCP Debug Setup Complete
✅ "Claude Debugs For You" extension installed
✅ MCP connection configured: http://localhost:4711/sse
⏳ Need Claude Code restart to load debug tools

## Automated Debug Strategy

Once debug tools are loaded, I will autonomously:

### Phase 1: Set Breakpoints
```javascript
// Breakpoint 1: Where coordinates are calculated
File: /Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/wrapper/EachHorizontalLineTrend.tsx
Line: 167 (handleLineDrag method)

// Breakpoint 2: Where coordinates should be received
File: /Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/BaseLine.tsx
Line: 295 (handleDragLine method)

// Breakpoint 3: Where override is used for rendering
File: /Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/HorizontalLine.tsx
Line: 53 (getValueFromOverride calls)
```

### Phase 2: Launch Debug Session
```javascript
// Use existing launch configuration
Configuration: "Debug Test Script" or create new Playwright test debug config
```

### Phase 3: Evaluate at Each Breakpoint

**At EachHorizontalLineTrend.handleLineDrag (line 167):**
```javascript
// Check what's being calculated
moreProps.yValue          // What Y coordinate from drag?
this.props.x1Value        // What X coordinates?
this.props.x2Value
this.props.index          // What index?

// Check what's being passed to onDrag
{
  x1Value: x1Value,
  y1Value: yValue,
  x2Value: x2Value,
  y2Value: yValue
}
```

**At BaseLine.handleDragLine (line 295):**
```javascript
// Check what was received
index                     // Was index passed?
moreProps                 // What's in moreProps?
typeof moreProps          // Is it an object?
'x1Value' in moreProps    // Does it have coordinates?
'y1Value' in moreProps
'x2Value' in moreProps
'y2Value' in moreProps

// Check what will be stored
this.state.override       // Current override before setState
// After setState:
this.state.override.index
this.state.override.x1Value
this.state.override.y1Value
this.state.override.x2Value
this.state.override.y2Value
```

**At HorizontalLine.renderLineItem (line 53):**
```javascript
// Check how override is used
override                  // What's in override object?
override.index            // Does it match our line?
getValueFromOverride(override, index, "y1Value", y)  // What does this return?

// Check final rendered coordinates
x1Value prop passed to EachHorizontalLineTrend
y1Value prop passed to EachHorizontalLineTrend
x2Value prop passed to EachHorizontalLineTrend
y2Value prop passed to EachHorizontalLineTrend
```

### Phase 4: Identify Root Cause

Based on evaluations, I will:
1. Confirm coordinates are calculated correctly in EachHorizontalLineTrend
2. Confirm coordinates are passed to onDrag callback
3. Verify what BaseLine.handleDragLine receives
4. Check if coordinates are stored in override
5. Verify getValueFromOverride returns correct values
6. **Find the exact point where coordinates are lost or become undefined**

### Phase 5: Implement Fix

Once I identify the exact issue:
1. Make the minimal code change to fix it
2. Set breakpoints again to verify fix
3. Run debug session to confirm coordinates flow correctly
4. Run integration test to confirm line doesn't disappear

## Expected Findings

Possible issues I might discover:
1. ✅ Coordinates not stored in override (already fixed, but may not be compiled)
2. Library not rebuilt after fix (compiled with old code)
3. moreProps structure different than expected
4. getValueFromOverride not checking override correctly
5. setState not updating properly
6. Render cycle issue where override is cleared too early

## Advantages Over Current Approach

**Current approach:** Write tests → guess → implement → rebuild → test → repeat
- Time: ~10-15 minutes per iteration
- Accuracy: Based on logical deduction

**MCP Debug approach:** Set breakpoints → run → inspect → fix
- Time: ~2-3 minutes total
- Accuracy: Based on actual runtime values

## Next Steps After Restart

1. Verify debug MCP tools are loaded (check available tools)
2. Execute Phase 1-5 autonomously
3. Report findings with exact values at each step
4. Implement targeted fix
5. Verify fix with debug session
6. Run integration test to confirm
