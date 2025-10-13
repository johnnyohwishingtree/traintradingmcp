const { test, expect } = require('@playwright/test');

test.describe('Drawing Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('can draw trend line without errors', async ({ page }) => {
    // Select trend line tool
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendline"]');
    await page.waitForTimeout(300);
    
    // Draw a trend line by clicking two points on the chart
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Click first point (left side of chart)
      const startX = chartBox.x + chartBox.width * 0.2;
      const startY = chartBox.y + chartBox.height * 0.7;
      await page.mouse.click(startX, startY);
      await page.waitForTimeout(500);
      
      // Click second point (right side of chart)
      const endX = chartBox.x + chartBox.width * 0.8;
      const endY = chartBox.y + chartBox.height * 0.3;
      await page.mouse.click(endX, endY);
      await page.waitForTimeout(500);
    }
    
    // Take screenshot to verify line was drawn
    await page.screenshot({ path: 'test-results/trend-line-drawn.png' });
    
    // Check for any console errors
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    await page.waitForTimeout(1000);
    
    const errors = logs.filter(log => log.includes('ERROR') || log.includes('error'));
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    
    // Should not have runtime errors
    expect(errors.length).toBe(0);
  });

  test('can draw trend channel without errors', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Listen for uncaught exceptions
    page.on('pageerror', error => {
      errors.push(`Uncaught exception: ${error.message}`);
    });
    
    // Select trend channel tool
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(300);
    
    // Draw a trend channel by clicking three points on the chart
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Click first point (start of main trend line)
      const startX = chartBox.x + chartBox.width * 0.2;
      const startY = chartBox.y + chartBox.height * 0.7;
      await page.mouse.click(startX, startY);
      await page.waitForTimeout(500);
      
      // Click second point (end of main trend line)
      const endX = chartBox.x + chartBox.width * 0.8;
      const endY = chartBox.y + chartBox.height * 0.3;
      await page.mouse.click(endX, endY);
      await page.waitForTimeout(500);
      
      // Click third point (to define channel width)
      const channelX = chartBox.x + chartBox.width * 0.5;
      const channelY = chartBox.y + chartBox.height * 0.5;
      await page.mouse.click(channelX, channelY);
      await page.waitForTimeout(1000);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/trend-channel-drawn.png' });
    
    // Check for errors - this should catch the runtime error
    console.log('Errors captured:', errors);
    
    // This test should fail if there's a runtime error
    expect(errors.length).toBe(0);
  });

  test('can switch between different line types without errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(`Uncaught exception: ${error.message}`);
    });
    
    const lineTypes = ['trendline', 'ray', 'extendedline', 'horizontalline', 'verticalline'];
    
    for (const lineType of lineTypes) {
      console.log(`Testing line type: ${lineType}`);
      
      // Select the line type
      await page.click('[data-testid="line-tools-button"]');
      await page.waitForTimeout(300);
      await page.click(`[data-testid="line-type-${lineType}"]`);
      await page.waitForTimeout(300);
      
      // Draw a quick line
      const chart = page.locator('[data-testid="main-chart-container"]');
      const chartBox = await chart.boundingBox();
      
      if (chartBox) {
        const startX = chartBox.x + chartBox.width * 0.3;
        const startY = chartBox.y + chartBox.height * 0.6;
        const endX = chartBox.x + chartBox.width * 0.7;
        const endY = chartBox.y + chartBox.height * 0.4;
        
        await page.mouse.click(startX, startY);
        await page.waitForTimeout(300);
        await page.mouse.click(endX, endY);
        await page.waitForTimeout(500);
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/multiple-line-types.png' });
    
    // Should not have any errors
    console.log('All errors captured:', errors);
    expect(errors.length).toBe(0);
  });
});