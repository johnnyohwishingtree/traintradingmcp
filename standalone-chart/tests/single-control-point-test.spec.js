const { test, expect } = require('@playwright/test');

test.describe('Single Control Point vs Two Control Points', () => {
  test('HorizontalLine should have ONE control point, TrendLine should have TWO control points', async ({ page }) => {
    const consoleLogs = [];
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'log' && (msg.text().includes('control') || msg.text().includes('Control'))) {
        consoleLogs.push(msg.text());
        console.log('Console:', msg.text());
      }
    });
    
    // Navigate to the chart application
    await page.goto('http://localhost:3000');
    
    // Wait for the main chart container to be visible
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow chart to fully render
    
    console.log('🧪 Testing single control point vs two control points...');
    
    // Take screenshot before any actions
    await page.screenshot({ path: 'test-results/before-control-point-test.png' });
    
    // === TEST 1: HORIZONTAL LINE (Should have 1 control point) ===
    console.log('📏 Testing HorizontalLine - should have 1 control point');
    
    // Find and activate horizontal line
    const lineDropdown = await page.locator('.line-tools-dropdown button').first();
    await lineDropdown.click();
    await page.waitForTimeout(500);
    
    const horizontalLineOption = await page.locator('button[title*="Horizontal line"]').first();
    await expect(horizontalLineOption).toBeVisible();
    await horizontalLineOption.click();
    await page.waitForTimeout(500);
    
    // Get chart area and click to place horizontal line
    const chartArea = await page.locator('.react-financial-charts').first();
    await expect(chartArea).toBeVisible();
    const chartBox = await chartArea.boundingBox();
    
    const clickX = chartBox.x + chartBox.width * 0.5;
    const clickY = chartBox.y + chartBox.height * 0.4;
    
    console.log(`🖱️ Placing horizontal line at (${clickX}, ${clickY})`);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000);
    
    // Take screenshot after placing horizontal line
    await page.screenshot({ path: 'test-results/horizontal-line-placed.png' });
    
    // Switch to cursor mode to select the line
    const cursorButton = await page.locator('button[title*="Cursor"]').first();
    await cursorButton.click();
    await page.waitForTimeout(500);
    
    // Click on the horizontal line to select it
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000);
    
    // Take screenshot of selected horizontal line with control points
    await page.screenshot({ path: 'test-results/horizontal-line-selected.png' });
    
    // Count control points for horizontal line (should be 1 yellow circle)
    const horizontalControlPoints = await page.locator('circle[fill="#ffff00"]').count();
    console.log(`📊 Horizontal line control points: ${horizontalControlPoints}`);
    
    // === TEST 2: TREND LINE (Should have 2 control points) ===
    console.log('📈 Testing TrendLine - should have 2 control points');
    
    // Click on trend line button to activate it
    const trendLineButton = await page.locator('button[title*="Trend Line"]').first();
    await trendLineButton.click();
    await page.waitForTimeout(500);
    
    // Draw a trend line with two clicks
    const startX = chartBox.x + chartBox.width * 0.3;
    const startY = chartBox.y + chartBox.height * 0.6;
    const endX = chartBox.x + chartBox.width * 0.7;
    const endY = chartBox.y + chartBox.height * 0.3;
    
    console.log(`🖱️ Drawing trend line from (${startX}, ${startY}) to (${endX}, ${endY})`);
    
    // First click - start point
    await page.mouse.click(startX, startY);
    await page.waitForTimeout(500);
    
    // Second click - end point
    await page.mouse.click(endX, endY);
    await page.waitForTimeout(1000);
    
    // Take screenshot after placing trend line
    await page.screenshot({ path: 'test-results/trend-line-placed.png' });
    
    // Switch to cursor mode to select the trend line
    await cursorButton.click();
    await page.waitForTimeout(500);
    
    // Click on the trend line to select it
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(1000);
    
    // Take screenshot of selected trend line with control points
    await page.screenshot({ path: 'test-results/trend-line-selected.png' });
    
    // Count control points for trend line (should be 2 circles)
    const trendControlPoints = await page.locator('circle[fill="#FFFFFF"]').count();
    console.log(`📊 Trend line control points: ${trendControlPoints}`);
    
    // === VERIFICATION ===
    
    // Verify horizontal line has exactly 1 control point
    expect(horizontalControlPoints).toBe(1);
    console.log('✅ HorizontalLine has 1 control point (yellow)');
    
    // Verify trend line has exactly 2 control points  
    expect(trendControlPoints).toBe(2);
    console.log('✅ TrendLine has 2 control points (white)');
    
    console.log('📋 All captured console logs:', consoleLogs);
    
    // Take final screenshot showing both elements
    await page.screenshot({ path: 'test-results/final-control-point-comparison.png' });
    
    console.log('✅ Control point test completed successfully');
  });
});