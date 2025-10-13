const { test, expect } = require('@playwright/test');

test.describe('Y-Axis Resize Handle', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chart page
    await page.goto('http://localhost:3000');
    
    // Wait for the chart to load
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Give time for chart to fully render
  });

  test('Y-axis resize handle is visible', async ({ page }) => {
    // Check if the Y-axis resize handle is present
    const handle = page.locator('[data-testid="y-axis-resize-handle"]');
    await expect(handle).toBeVisible();
    
    // Verify it has the correct cursor style
    const cursor = await handle.evaluate(el => getComputedStyle(el).cursor);
    expect(cursor).toBe('ns-resize');
  });

  test('Y-axis resize handle position is correct', async ({ page }) => {
    const handle = page.locator('[data-testid="y-axis-resize-handle"]');
    
    // Check that the handle is positioned on the right side
    const bbox = await handle.boundingBox();
    expect(bbox).toBeTruthy();
    
    // Should be on the right side of the chart
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bbox.x).toBeGreaterThan(windowWidth * 0.7); // Should be in right portion
  });

  test('Y-axis resize handle shows tooltip on hover', async ({ page }) => {
    const handle = page.locator('[data-testid="y-axis-resize-handle"]');
    
    // Hover over the handle
    await handle.hover();
    
    // Check tooltip (using title attribute)
    const title = await handle.getAttribute('title');
    expect(title).toContain('Y-Axis Scaling');
    expect(title).toMatch(/\d+% padding/); // Should show percentage
  });

  test('Y-axis resize handle can be dragged to zoom out', async ({ page }) => {
    const handle = page.locator('[data-testid="y-axis-resize-handle"]');
    
    // Get initial position
    const initialBBox = await handle.boundingBox();
    expect(initialBBox).toBeTruthy();
    
    // Listen for console logs to verify the drag is working
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.text().includes('Y-Axis')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Perform drag down (should increase padding = zoom out)
    const startX = initialBBox.x + initialBBox.width / 2;
    const startY = initialBBox.y + initialBBox.height / 2;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // Drag down 50 pixels
    await page.mouse.move(startX, startY + 50);
    await page.waitForTimeout(100); // Small delay to let the drag register
    
    await page.mouse.up();
    
    // Wait a moment for state updates
    await page.waitForTimeout(500);
    
    // Verify console logs show the drag operation
    const dragLogs = consoleMessages.filter(msg => msg.includes('Y-Axis Resize:'));
    expect(dragLogs.length).toBeGreaterThan(0);
    
    // Check that padding changed logs appear
    const paddingLogs = consoleMessages.filter(msg => msg.includes('Y-Axis Padding changed'));
    expect(paddingLogs.length).toBeGreaterThan(0);
  });

  test('Y-axis resize handle can be dragged to zoom in', async ({ page }) => {
    const handle = page.locator('[data-testid="y-axis-resize-handle"]');
    
    // Get initial position
    const initialBBox = await handle.boundingBox();
    expect(initialBBox).toBeTruthy();
    
    // Listen for console logs
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.text().includes('Y-Axis')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Perform drag up (should decrease padding = zoom in)
    const startX = initialBBox.x + initialBBox.width / 2;
    const startY = initialBBox.y + initialBBox.height / 2;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // Drag up 30 pixels
    await page.mouse.move(startX, startY - 30);
    await page.waitForTimeout(100);
    
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Verify console logs show drag operation with negative deltaY
    const dragLogs = consoleMessages.filter(msg => msg.includes('Y-Axis Resize:') && msg.includes('deltaY=-'));
    expect(dragLogs.length).toBeGreaterThan(0);
  });

  test('Y-axis resize handle updates chart extents', async ({ page }) => {
    const handle = page.locator('[data-testid="y-axis-resize-handle"]');
    
    // Listen for extent calculation logs
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.text().includes('Y-Axis Extents:')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Get initial position and perform a drag
    const initialBBox = await handle.boundingBox();
    const startX = initialBBox.x + initialBBox.width / 2;
    const startY = initialBBox.y + initialBBox.height / 2;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 40); // Drag down to zoom out
    await page.mouse.up();
    
    // Wait for chart to recalculate
    await page.waitForTimeout(1000);
    
    // Trigger chart update by moving mouse over chart (should call candleChartExtents)
    const chartContainer = page.locator('[data-testid="main-chart-container"]');
    await chartContainer.hover();
    
    // Check that extent calculations occurred with the new padding
    await page.waitForTimeout(500);
    
    // We should see extent calculations in the console
    expect(consoleMessages.length).toBeGreaterThan(0);
    
    // At least one log should show padding > 10% (initial was 10%)
    const highPaddingLogs = consoleMessages.filter(msg => {
      const match = msg.match(/padding=(\d+\.?\d*)%/);
      return match && parseFloat(match[1]) > 10;
    });
    expect(highPaddingLogs.length).toBeGreaterThan(0);
  });

  test('Y-axis resize handle has visual feedback during drag', async ({ page }) => {
    const handle = page.locator('[data-testid="y-axis-resize-handle"]');
    
    // Get initial style
    const initialBg = await handle.evaluate(el => getComputedStyle(el).background);
    
    // Start dragging
    const bbox = await handle.boundingBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    
    // Check if background changed during drag (should be brighter)
    const dragBg = await handle.evaluate(el => getComputedStyle(el).background);
    
    await page.mouse.up();
    
    // Background should have changed during drag
    expect(dragBg).not.toBe(initialBg);
  });

  test('Y-axis padding is constrained to valid range', async ({ page }) => {
    const handle = page.locator('[data-testid="y-axis-resize-handle"]');
    
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.text().includes('newPadding=')) {
        consoleMessages.push(msg.text());
      }
    });
    
    const bbox = await handle.boundingBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    
    // Try to drag way up (should be constrained to 0%)
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX, centerY - 500); // Large upward drag
    await page.mouse.up();
    await page.waitForTimeout(200);
    
    // Try to drag way down (should be constrained to 100%)
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX, centerY + 500); // Large downward drag
    await page.mouse.up();
    await page.waitForTimeout(200);
    
    // Check that padding values are within 0-100% range
    const paddingValues = consoleMessages.map(msg => {
      const match = msg.match(/newPadding=(\d+\.?\d*)%/);
      return match ? parseFloat(match[1]) : null;
    }).filter(val => val !== null);
    
    expect(paddingValues.length).toBeGreaterThan(0);
    
    // All values should be within 0-100 range
    paddingValues.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });
});