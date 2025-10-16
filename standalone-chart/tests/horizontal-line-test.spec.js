const { test, expect } = require('@playwright/test');

test.describe('Horizontal Line Tool', () => {
  test('should place horizontal line with single click', async ({ page }) => {
    const consoleLogs = [];
    
    // Capture console logs about horizontal lines
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('HorizontalLine')) {
        consoleLogs.push(msg.text());
        console.log('Console:', msg.text());
      }
    });
    
    // Navigate to the chart application
    await page.goto('http://localhost:3000');
    
    // Wait for the main chart container to be visible
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow chart to fully render
    
    console.log('🧪 Testing horizontal line single-click placement...');
    
    // Take screenshot before activating tool
    await page.screenshot({ path: 'test-results/before-horizontal-line.png' });
    
    // Find the line tools dropdown and click it to open
    const lineDropdown = await page.locator('.line-tools-dropdown button').first();
    await lineDropdown.click();
    await page.waitForTimeout(500);
    
    // Find and click the horizontal line option
    const horizontalLineOption = await page.locator('button[title*="Horizontal line"]').first();
    await expect(horizontalLineOption).toBeVisible();
    await horizontalLineOption.click();
    await page.waitForTimeout(500);
    
    console.log('✅ Horizontal line tool activated');
    
    // Take screenshot after activating tool
    await page.screenshot({ path: 'test-results/after-horizontal-line-activate.png' });
    
    // Get chart area for clicking
    const chartArea = await page.locator('.react-financial-charts').first();
    await expect(chartArea).toBeVisible();
    
    // Get chart dimensions
    const chartBox = await chartArea.boundingBox();
    console.log('📊 Chart dimensions:', chartBox);
    
    // Click once in the middle of the chart to place a horizontal line
    const clickX = chartBox.x + chartBox.width * 0.5;
    const clickY = chartBox.y + chartBox.height * 0.4; // Upper portion
    
    console.log(`🖱️ Single-clicking at (${clickX}, ${clickY}) to place horizontal line`);
    
    // Single click to place horizontal line
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000); // Wait for line to appear
    
    // Take screenshot after click
    await page.screenshot({ path: 'test-results/after-horizontal-line-click.png' });
    
    // Check for SVG line elements that could be our horizontal line
    const lineElements = await page.locator('line').count();
    console.log(`📏 Total line elements after click: ${lineElements}`);
    
    // Check console logs for single-click confirmation
    const hasSingleClickLog = consoleLogs.some(log => log.includes('single-click'));
    console.log('🎯 Found single-click log:', hasSingleClickLog);
    
    if (hasSingleClickLog) {
      console.log('✅ Horizontal line single-click handler was triggered');
    }
    
    console.log('📋 All captured console logs:', consoleLogs);
    
    console.log('✅ Horizontal line test completed');
    
    // Verify that only ONE click was needed (no second click)
    expect(hasSingleClickLog).toBeTruthy();
  });
});