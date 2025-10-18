# Standalone Chart Testing Guidelines

This file contains specific testing patterns for the standalone-chart application.

**See main [CLAUDE.md](../CLAUDE.md) for complete development guidelines.**

## Quick Testing Commands

```bash
# Run all Playwright tests
npx playwright test

# Run specific test
npx playwright test tests/[test-name].spec.js

# Debug mode (headed browser)
npx playwright test --headed --debug

# Show test report
npx playwright show-report
```

## data-testid Naming Convention

All interactive components in standalone-chart should use these test IDs:

```
main-chart-container     // Main chart canvas
chart-type-button        // Chart type selector button
indicators-panel         // Indicators overlay panel
start-date-input         // Date range start input
end-date-input           // Date range end input
price-info-area          // Price information display
trend-line-button        // TrendLine drawing tool button
cursor-button            // Selection tool button
```

## Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Always wait for main chart container
    await page.waitForSelector('[data-testid="main-chart-container"]', {
      timeout: 10000
    });
  });

  test('should do expected behavior', async ({ page }) => {
    // Test implementation
  });
});
```

## Common Test Patterns

### Drawing a Trendline
```typescript
// 1. Activate trendline mode
await page.click('[data-testid="trend-line-button"]');

// 2. Draw the line
const chart = page.locator('[data-testid="main-chart-container"]');
const box = await chart.boundingBox();

await page.mouse.click(box.x + 200, box.y + 300); // First point
await page.mouse.move(box.x + 400, box.y + 200);  // Second point
await page.mouse.click(box.x + 400, box.y + 200);

// 3. Wait for render
await page.waitForTimeout(300);

// 4. Verify with screenshot
await page.screenshot({
  path: 'test-results/trendline-drawn.png'
});
```

### Selecting an Indicator
```typescript
// 1. Switch to cursor mode
await page.click('[data-testid="cursor-button"]');

// 2. Click on indicator
await page.mouse.click(indicatorX, indicatorY);

// 3. Verify selection state (control points visible)
await page.screenshot({
  path: 'test-results/indicator-selected.png'
});
```

## Debug Chrome MCP Integration

When tests fail, use Chrome MCP to inspect the actual browser state:

```javascript
// Check if element exists
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const el = document.querySelector('[data-testid="trend-line-button"]');
    return {
      exists: !!el,
      visible: el?.offsetParent !== null,
      rect: el?.getBoundingClientRect()
    };
  }`
})

// Check for console errors
mcp__chrome-devtools__list_console_messages

// Take screenshot
mcp__chrome-devtools__take_screenshot
```

## Remember

- **Always use data-testid selectors** - Never CSS classes
- **Wait for main container** before any interactions
- **Take screenshots** at key steps for debugging
- **Use Chrome MCP** when tests fail to see actual browser state

See [../CLAUDE.md](../CLAUDE.md) for complete debugging workflow.
