# Debug Session Plan - After Restart

## Date: October 15, 2025

## Context
User requested automated bug fixing using MCP debug server instead of guessing.
- ✅ "Claude Debugs For You" extension installed
- ✅ MCP connection configured: `claude mcp add debug --transport sse http://localhost:4711/sse`
- ✅ Debug server running on port 4711
- ⏳ Need restart to load `mcp__debug__*` tools into Claude Code

## The Bug
**Horizontal line disappears when dragged**
- Integration test: `tests/horizontal-line-drag-test.spec.js` FAILS
- Unit tests: Expose the architecture problem in `tests/unit/BaseLine.handleDragLine.test.ts`
- Fix attempted: Modified `BaseLine.tsx` lines 294-333 to accept coordinates from wrapper
- Status: Library rebuilt, servers restarted, but test still failing

## What Claude Should Do Immediately After Restart

### Step 1: Verify Debug Tools Available
Check that `mcp__debug__*` tools are now in the function list. Expected tools:
- `mcp__debug__debug` - Main debug tool for setting breakpoints, evaluating expressions, launching sessions

### Step 2: Set Breakpoints (Autonomous)
Use the debug tool to set breakpoints in these locations:

```javascript
// Breakpoint 1: Where coordinates are calculated
{
  type: "setBreakpoint",
  file: "/Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/wrapper/EachHorizontalLineTrend.tsx",
  line: 167  // handleLineDrag method
}

// Breakpoint 2: Where coordinates should be received
{
  type: "setBreakpoint",
  file: "/Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/BaseLine.tsx",
  line: 295  // handleDragLine method
}

// Breakpoint 3: Where override is used for rendering
{
  type: "setBreakpoint",
  file: "/Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/HorizontalLine.tsx",
  line: 53  // renderLineItem - getValueFromOverride calls
}
```

### Step 3: Create Debug Test Script
Create a minimal test script that triggers the drag operation:

```javascript
// /Users/johnnyhuang/personal/traintradingmcp/debug-horizontal-drag.js
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(3000);

  // Open dropdown and select horizontal line
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(500);
  await page.click('[data-testid="line-type-horizontalline"]');
  await page.waitForTimeout(500);

  // Draw horizontal line
  const chartArea = await page.locator('.react-financial-charts').first();
  const chartBox = await chartArea.boundingBox();
  const clickX = chartBox.x + chartBox.width * 0.5;
  const clickY = chartBox.y + chartBox.height * 0.4;

  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(1000);

  // Switch to cursor mode and select line
  await page.click('[data-testid="cursor-button"]');
  await page.waitForTimeout(500);
  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(500);

  // Drag the line (THIS IS WHERE BREAKPOINTS WILL TRIGGER)
  await page.mouse.move(clickX, clickY);
  await page.mouse.down();
  await page.waitForTimeout(100);

  const dragEndY = chartBox.y + chartBox.height * 0.6;
  await page.mouse.move(clickX, dragEndY, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(2000);

  console.log('✅ Debug test complete - check breakpoints');
  await browser.close();
})();
```

**OR** use existing Playwright test with debugger attached.

### Step 4: Launch Debug Session
Use the debug tool to launch the session:

```javascript
{
  type: "launch",
  file: "/Users/johnnyhuang/personal/traintradingmcp/debug-horizontal-drag.js"
  // OR use the existing launch.json configuration
}
```

### Step 5: Evaluate at Each Breakpoint

**When stopped at EachHorizontalLineTrend.tsx:167:**
```javascript
// Evaluate these expressions:
{
  type: "evaluate",
  file: "/Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/wrapper/EachHorizontalLineTrend.tsx",
  expression: "moreProps"
}
// Check: moreProps.yValue, this.props.x1Value, this.props.x2Value, this.props.index

// Check what's being passed to onDrag:
{
  type: "evaluate",
  expression: "{ x1Value: x1Value, y1Value: yValue, x2Value: x2Value, y2Value: yValue }"
}
```

**When stopped at BaseLine.tsx:295:**
```javascript
// Check what was received:
{
  type: "evaluate",
  file: "/Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/BaseLine.tsx",
  expression: "index"
}
{
  type: "evaluate",
  expression: "moreProps"
}
{
  type: "evaluate",
  expression: "typeof moreProps"
}
{
  type: "evaluate",
  expression: "'x1Value' in moreProps && 'y1Value' in moreProps"
}

// Check what will be stored:
{
  type: "evaluate",
  expression: "this.state.override"
}
```

**After setState completes:**
```javascript
{
  type: "evaluate",
  expression: "this.state.override"
}
// Should now contain: { index, x1Value, y1Value, x2Value, y2Value }
```

**When stopped at HorizontalLine.tsx:53:**
```javascript
// Check rendering:
{
  type: "evaluate",
  file: "/Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/HorizontalLine.tsx",
  expression: "override"
}
{
  type: "evaluate",
  expression: "index"
}
{
  type: "evaluate",
  expression: "getValueFromOverride(override, index, 'y1Value', y)"
}
```

### Step 6: Identify the Problem
Based on the evaluated values, determine:
1. ✅ Are coordinates calculated correctly in EachHorizontalLineTrend?
2. ✅ Are they passed to onDrag callback?
3. ❓ Does BaseLine.handleDragLine receive them?
4. ❓ Are they stored in this.state.override?
5. ❓ Does getValueFromOverride return the correct values?
6. ❓ **Where exactly do the coordinates get lost?**

### Step 7: Implement Precise Fix
Once the exact issue is identified:
1. Make the minimal necessary code change
2. Rebuild library: `cd financial-charts && npm run build`
3. Set breakpoints again
4. Run debug session to verify fix
5. Run integration test: `npx playwright test tests/horizontal-line-drag-test.spec.js`

## Possible Findings

### Scenario A: Library Not Rebuilt
**Symptom:** BaseLine.handleDragLine code still shows old version (no coordinate checking)
**Fix:** Rebuild financial-charts library
```bash
cd /Users/johnnyhuang/personal/traintradingmcp/financial-charts
npm run build
```

### Scenario B: moreProps Structure Different
**Symptom:** moreProps doesn't contain x1Value, y1Value, etc.
**Fix:** Adjust how coordinates are passed from EachHorizontalLineTrend

### Scenario C: Override Cleared Too Early
**Symptom:** override has coordinates but gets cleared before render
**Fix:** Adjust when override is cleared in the state lifecycle

### Scenario D: getValueFromOverride Not Working
**Symptom:** override has values but getValueFromOverride returns undefined
**Fix:** Fix the getValueFromOverride logic

### Scenario E: TypeScript Compilation Issue
**Symptom:** Code looks correct in source but debugger shows old code
**Fix:** Check lib/ directory for actual compiled code

## Success Criteria
✅ Debug session shows coordinates flowing correctly from child to parent
✅ this.state.override contains { index, x1Value, y1Value, x2Value, y2Value }
✅ getValueFromOverride returns dragged Y coordinate
✅ Integration test passes - line stays visible and moves

## Files to Monitor
- `/Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/BaseLine.tsx`
- `/Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/HorizontalLine.tsx`
- `/Users/johnnyhuang/personal/traintradingmcp/financial-charts/src/interactive/wrapper/EachHorizontalLineTrend.tsx`
- `/Users/johnnyhuang/personal/traintradingmcp/financial-charts/lib/interactive/BaseLine.js` (compiled)

## Current Server Status
- Backend server: Should be running on port 3001
- Frontend server: Should be running on port 3000 (with NODE_OPTIONS='--openssl-legacy-provider')
- Check with: `lsof -i :3000` and `lsof -i :3001`

## If Servers Not Running
```bash
cd /Users/johnnyhuang/personal/traintradingmcp
./restart-servers.sh
```

## Key Advantage of This Approach
**Before:** Guess → Implement → Test → Repeat (10-15 min per iteration)
**Now:** Debug → See actual values → Fix precisely (2-3 min total)

## Important Notes
1. **Run debug session FIRST** - Don't guess, inspect actual runtime values
2. **Library must be rebuilt** after any changes to financial-charts/src/
3. **Servers must be restarted** after library rebuild
4. **Check compiled JS** in lib/ directory if source looks correct but behavior is wrong

## Expected Timeline
- Set breakpoints: 30 seconds
- Launch debug session: 30 seconds
- Evaluate expressions: 1 minute
- Identify issue: 30 seconds
- Implement fix: 1 minute
- Rebuild & test: 2 minutes
**Total: ~5 minutes to root cause and fix**

## User's Original Request
"I want to automate our bug fixing as best we can with MCP servers instead you guessing."

This debug session demonstrates fully automated debugging:
- No manual intervention needed
- No guessing about data flow
- Direct inspection of runtime values
- Precise identification of bug location
- Targeted fix implementation
