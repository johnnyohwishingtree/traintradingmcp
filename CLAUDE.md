# Claude Development Guidelines

## Testing and Compilation Requirements

### CRITICAL: Always Verify Compilation After Changes
**MANDATORY WORKFLOW**: After ANY change to files in `financial-charts/src/`:

1. **IMMEDIATELY build the library** - Do not proceed without confirming compilation succeeds
2. **IMMEDIATELY restart the dev server** - Kill and restart to pick up changes
3. **IMMEDIATELY verify the app loads** - Check that module resolution works
4. **Test the fix** - Run automated tests to validate the solution
5. **Verify no regressions** - Check that existing functionality still works

**⚠️ NEVER SKIP STEP 1-3**: If you make changes but don't verify compilation, the user will see broken module resolution errors.

### Build and Link Process

**Quick Restart (Recommended):**
```bash
# Use the automated restart script (builds, links, and starts both servers)
./restart-servers.sh
```

**Manual Process:**
```bash
# 1. Build the library
cd /Users/johnnyhuang/personal/traintradingmcp/financial-charts
npm run build

# 2. Re-link the library to the standalone app
cd /Users/johnnyhuang/personal/traintradingmcp/standalone-chart
npm link ../financial-charts

# 3. Start the backend server
cd /Users/johnnyhuang/personal/traintradingmcp/standalone-chart/backend
node server.js &

# 4. Start the frontend development server
cd /Users/johnnyhuang/personal/traintradingmcp/standalone-chart
NODE_OPTIONS='--openssl-legacy-provider' npm start
```

### Common Issues and Solutions

#### Module Resolution Error
If you see: `Module not found: Error: Can't resolve '@slowclap/financial-charts'`

**Root Cause**: The library build failed or the symlink is broken

**Solution**:
```bash
# Quick fix: Run the restart script
./restart-servers.sh

# OR manually:
# Check if lib directory exists
ls /Users/johnnyhuang/personal/traintradingmcp/financial-charts/lib

# If missing, rebuild
cd /Users/johnnyhuang/personal/traintradingmcp/financial-charts
npm run build

# Re-link to standalone app
cd /Users/johnnyhuang/personal/traintradingmcp/standalone-chart
npm link ../financial-charts

# Restart servers
cd backend && node server.js &
cd .. && NODE_OPTIONS='--openssl-legacy-provider' npm start
```

### Test Requirements

#### For Selection/Interaction Fixes
- Create Playwright tests that simulate actual user interactions
- Test both positive cases (clicks should work) and negative cases (clicks should be ignored)
- Verify coordinate detection is precise
- Example test files: `tests/trendline-selection-debug.spec.js`

#### For UI/Visual Fixes  
- Take screenshots at key steps
- Verify DOM element counts match expectations
- Test both drawing and deleting workflows
- Example test files: `tests/comprehensive-visual-test.spec.js`

#### Interactive Indicator Requirements
**All interactive indicators MUST support Select/Move/Delete:**

##### Selection Testing:
```javascript
// Test: Draw indicator → Switch to cursor mode → Click indicator → Verify selection
test('Indicator selection', async ({ page }) => {
  // 1. Draw indicator (trendline, triangle, fibonacci, etc.)
  await page.click('button:has-text("TrendLine")'); // or Patterns, Fibonacci
  await drawIndicator(page); // Draw with required clicks
  
  // 2. Switch to cursor mode
  await page.click('button:has-text("Cursor")');
  
  // 3. Click on indicator to select
  await page.mouse.click(indicatorX, indicatorY);
  await page.waitForTimeout(300);
  
  // 4. Verify visual selection state (control points visible, highlight)
  await page.screenshot({ path: 'test-results/indicator-selected.png' });
});
```

##### Movement Testing:
```javascript
// Test: Select indicator → Drag control point → Verify position change
test('Indicator movement', async ({ page }) => {
  await selectIndicator(page);
  
  // Drag a control point or edge
  await page.mouse.move(controlPointX, controlPointY);
  await page.mouse.down();
  await page.mouse.move(controlPointX + 50, controlPointY + 30, { steps: 5 });
  await page.mouse.up();
  
  // Verify indicator moved
  await page.screenshot({ path: 'test-results/indicator-moved.png' });
});
```

##### Deletion Testing:
```javascript
// Test: Select indicator → Press Delete key → Verify removal
test('Indicator deletion', async ({ page }) => {
  await selectIndicator(page);
  
  // Press Delete key
  await page.keyboard.press('Delete');
  await page.waitForTimeout(300);
  
  // Verify indicator is gone
  await page.screenshot({ path: 'test-results/indicator-deleted.png' });
});
```

##### Required Event Logging:
All interactive indicators should log these console events for debugging:
- `🎯 [Indicator] hover check:` - Mouse hover detection with coordinates
- `📌 [Indicator] clicked:` - Click detection with selection logic  
- `🖱️ [Indicator] drag start:` - Drag operation initiation
- `🏁 [Indicator] drag complete:` - Drag operation completion
- `🗑️ [Indicator] deleted:` - Deletion via Delete key

### Validation Checklist

Before marking any task complete:

- [ ] Library compiles without errors (`npm run build` succeeds)
- [ ] Standalone app starts without module resolution errors
- [ ] Automated tests pass and demonstrate the fix working
- [ ] Manual testing confirms user workflow is restored
- [ ] No regressions in existing functionality

#### For Interactive Indicators:
- [ ] **Selection**: Indicator can be clicked and shows visual selection state
- [ ] **Movement**: Selected indicator can be dragged to new position
- [ ] **Deletion**: Selected indicator can be deleted with Delete/Backspace key
- [ ] **Hover Feedback**: Indicator shows hover state when mouse is over it
- [ ] **Coordinate System**: Uses proper chart data coordinates with screen coordinate transformation
- [ ] **Interface Compliance**: Follows `InteractiveIndicatorProps` interface from `src/interactive/types.ts`

### Current Project Structure

```
traintradingmcp/
├── financial-charts/               # Library source code
│   ├── src/                        # TypeScript source
│   ├── lib/                        # Compiled JavaScript (auto-generated)
│   └── package.json
├── standalone-chart/               # Test application
│   ├── src/
│   ├── tests/                      # Playwright test files
│   └── package.json
└── CLAUDE.md                       # This file
```

### Recent Fixes Applied

#### Trendline Selection Issue (Fixed)
- **Problem**: Clicking first trendline selected second trendline instead
- **Root Cause**: Both `EachTrendLine` components received click events
- **Solution**: Implemented Y-coordinate aware click detection in `EachTrendLine.tsx`
- **File**: `/financial-charts/src/interactive/wrapper/EachTrendLine.tsx:309-331`
- **Test**: `tests/trendline-selection-debug.spec.js` validates fix

#### Line Completion Issue (Fixed)  
- **Problem**: Lines wouldn't complete when drawn with automated testing
- **Root Cause**: Required `mouseMoved` flag wasn't set during programmatic interactions
- **Solution**: Removed `mouseMoved` requirement from completion logic
- **File**: `/financial-charts/src/interactive/TrendLine.tsx:315`

#### Weekly OHLC Data Mapping Issue (Fixed)
- **Problem**: Weekly candles showing wrong colors (September 8th should be red, September 15th should be green)
- **Root Cause**: Sunday timestamps were being mapped to wrong Monday week (6 days back vs 1 day forward)
- **Solution**: Fixed week calculation for Sunday timestamps to go forward to next Monday
- **File**: `/standalone-chart/backend/yahoo-finance-incremental.js:112-113`
- **Debug Method**: Systematic debug script comparing raw Yahoo Finance data vs processed database data
- **Verification**: `debug-weekly-ohlc.js` confirmed September weeks now match Yahoo Finance exactly

### Debugging Best Practices

#### Preferred Debugging Methods (In Order of Preference)

**1. SYSTEMATIC DEBUG SCRIPTS (MOST EFFECTIVE)**
Create dedicated debug scripts to isolate and analyze issues:
```javascript
// Example: debug-weekly-ohlc.js - Compare processed vs raw data
async function debugWeeklyOHLC() {
    // 1. Fetch raw Yahoo Finance data directly
    const rawData = await fetchRawYahooData(symbol, interval);
    
    // 2. Fetch our processed data from database  
    const processedData = await db.getOHLCData(symbol, interval);
    
    // 3. Compare side-by-side with detailed logging
    console.log('Raw Yahoo data:', rawData);
    console.log('Our processed data:', processedData);
    
    // 4. Identify specific discrepancies
    const discrepancies = findDiscrepancies(rawData, processedData);
    console.log('Discrepancies found:', discrepancies);
}
```

**2. CODE ANALYSIS AND LOGICAL DEDUCTION**
Read the actual implementation to understand the logic:
```javascript
// Study timestamp normalization logic
if (interval === '1week') {
    const dayOfWeek = weekDate.getDay();
    let daysToMonday;
    if (dayOfWeek === 0) { // Sunday - POTENTIAL BUG HERE
        daysToMonday = 6; // Going back 6 days vs forward 1 day?
    }
}
```

**3. STRATEGIC CONSOLE LOGGING (TEMPORARY)**
Use targeted logging to trace data flow:
```javascript
// GOOD - Strategic checkpoints
console.log(`🔍 Week calculation: ${dayOfWeek} -> ${daysToMonday} days`);
console.log(`📅 Original timestamp: ${originalTimestamp}`);
console.log(`📅 Normalized timestamp: ${normalizedTimestamp}`);

// BAD - Excessive logging everywhere
console.log('Debug 1:', value1);
console.log('Debug 2:', value2);
// ... 50 more console.logs
```

**4. MCP INTERACTIVE DEBUGGING (MOST POWERFUL - ZERO USER INTERACTION)**
Autonomous debugging with complete control via MCP integration:

**Initial Setup (One-time):**
1. Install "Claude Debugs For You" extension in VS Code
2. Ensure VS Code is running with the extension active
3. Configure Claude Code MCP connection:
```bash
# Run this command in terminal
claude mcp add debug --transport sse http://localhost:4711/sse
```
4. Restart Claude Code to load MCP debug tools
5. Create `.vscode/launch.json` with debug configurations:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Debug Script",
            "program": "${workspaceFolder}/your-script.js",
            "console": "integratedTerminal",
            "stopOnEntry": false
        }
    ]
}
```

**Using MCP Debug Integration (Fully Autonomous):**
```javascript
// Example: Debug a function to understand its behavior
// Claude Code can do this completely autonomously:

// 1. List available files
mcp__debug__listFiles({ includePatterns: ["*.js"] })

// 2. Get file content to understand code
mcp__debug__getFileContent({ path: "/absolute/path/to/file.js" })

// 3. Set breakpoints and launch debug session
mcp__debug__debug({
    steps: [
        { type: "setBreakpoint", file: "/path/to/file.js", line: 42 },
        { type: "setBreakpoint", file: "/path/to/file.js", line: 67 },
        { type: "launch", file: "/path/to/file.js" }
    ]
})

// 4. When stopped at breakpoint, evaluate expressions
mcp__debug__debug({
    steps: [
        { type: "evaluate", file: "/path/to/file.js", expression: "variableName" },
        { type: "evaluate", file: "/path/to/file.js", expression: "object.property" },
        { type: "evaluate", file: "/path/to/file.js", expression: "functionCall()" }
    ]
})

// 5. Continue to next breakpoint
mcp__debug__debug({
    steps: [{ type: "continue", file: "/path/to/file.js" }]
})

// 6. Remove breakpoints when done
mcp__debug__debug({
    steps: [
        { type: "removeBreakpoint", file: "/path/to/file.js", line: 42 },
        { type: "removeBreakpoint", file: "/path/to/file.js", line: 67 }
    ]
})
```

**Key Advantages of MCP Debugging:**
- **Zero User Interaction**: Claude Code controls entire debug session autonomously
- **Full Context Access**: Evaluate any expression in the current scope
- **Systematic Analysis**: Step through code methodically to understand behavior
- **Bug Discovery**: Find exact line where issues occur by examining state at each step
- **No Console.log Pollution**: Debug without modifying source code

**Real Example - Debugging Weekly OHLC Calculation:**
```javascript
// Claude Code can autonomously debug the week calculation issue:
mcp__debug__debug({
    steps: [
        // Set breakpoint where week is calculated
        { type: "setBreakpoint", file: "/path/to/yahoo-finance.js", line: 112 },
        // Launch with test data
        { type: "launch", file: "/path/to/yahoo-finance.js" },
        // Check the day of week calculation
        { type: "evaluate", file: "/path/to/yahoo-finance.js", expression: "dayOfWeek" },
        // Check the days to Monday calculation
        { type: "evaluate", file: "/path/to/yahoo-finance.js", expression: "daysToMonday" },
        // Check final week start date
        { type: "evaluate", file: "/path/to/yahoo-finance.js", expression: "weekDate.toISOString()" },
        // Continue execution
        { type: "continue", file: "/path/to/yahoo-finance.js" }
    ]
})
```

**When to Use MCP Debugging:**
- Complex logic issues requiring step-by-step analysis
- Understanding unfamiliar codebases
- Finding exact location of runtime errors
- Verifying data transformations at each step
- Debugging without modifying source code

**5. PLAYWRIGHT DEBUGGING (FOR FRONTEND ISSUES)**
```javascript
// Use Playwright's debugging features
await page.pause();  // Opens Playwright Inspector
PWDEBUG=1 npx playwright test  // Run with inspector

// Use debugger statements in browser
await page.evaluate(() => {
  debugger;  // Breaks in browser DevTools
});
```

#### Real-World Debugging Success Story
**Weekly OHLC Data Issue (Fixed):**

1. **Problem**: September weeks showing wrong candle colors vs Yahoo Finance
2. **Debug Script**: Created `debug-weekly-ohlc.js` to compare raw vs processed data
3. **Discovery**: OHLC values were correct but mapped to wrong weeks
4. **Code Analysis**: Found Sunday timestamp calculation error in `yahoo-finance-incremental.js:112`
5. **Fix**: Changed `daysToMonday = 6` to `daysToMonday = -1` for Sundays
6. **Verification**: Re-ran debug script to confirm fix

**Key Insight**: The debug script revealed the exact nature of the bug (week mapping vs OHLC values), which led directly to the solution.

#### When Tests Don't Match Manual Behavior

If automated tests fail but manual testing works:

1. **Analyze the implementation** - Check what event system is used:
   ```javascript
   // Check pointer-events, event handlers, drag implementation
   const implementation = await page.evaluate(() => {
     return {
       hasD3: typeof window.d3 !== 'undefined',
       pointerEvents: window.getComputedStyle(element).pointerEvents,
       // etc.
     };
   });
   ```

2. **Use proper selectors** - Get actual rendered positions:
   ```javascript
   // Don't assume positions, query them
   const actualPosition = await page.evaluate(() => {
     const element = document.querySelector('line');
     return element.getBoundingClientRect();
   });
   ```

3. **Understand React's event system** - React synthetic events may not trigger with simple dispatchEvent

4. **Accept test limitations** - Some interactions (complex drags, hover states) may not be perfectly testable with automation

#### Testing Process Validation
**ALWAYS follow this sequence after implementing interactive indicators:**

1. **Build and Link** (Critical - Required by CLAUDE.md):
   ```bash
   # Quick method: Use restart script
   ./restart-servers.sh

   # OR manually:
   cd financial-charts && npm run build
   cd ../standalone-chart && npm link ../financial-charts
   cd backend && node server.js &
   cd .. && NODE_OPTIONS='--openssl-legacy-provider' npm start
   ```

2. **Runtime Error Check** - Before testing functionality, verify no runtime errors:
   - Open browser to http://localhost:3000
   - Open DevTools Console
   - Test basic drawing sequence (activate pattern, draw indicator)
   - Look for errors like "Reduce of empty array" or "Cannot read property"

3. **Manual Verification** - If runtime errors occur, fix before automated testing:
   - Check that `isHover` method is properly implemented
   - Verify `saveNodeType` bindings if using generic utilities
   - Consider custom hover implementation for complex shapes (triangles, polygons)

4. **Progressive Testing** - Start simple, then add complexity:
   ```bash
   # First: Basic drawing functionality
   npx playwright test tests/[indicator]-drawing-test.spec.js
   
   # Second: Selection/interaction (if drawing works)
   npx playwright test tests/[indicator]-selection.spec.js
   
   # Third: Full CLAUDE.md validation (if selection works)
   npx playwright test tests/[indicator]-claude-md-validation.spec.js
   ```

### Notes for Future Development

- Always use TypeScript with proper typing
- Prefer editing existing files over creating new ones
- Test thoroughly with both manual and automated methods
- Document coordinate systems and transformations clearly
- Use debugger/breakpoints instead of console.log for debugging
- Verify manual testing when automated tests show different behavior