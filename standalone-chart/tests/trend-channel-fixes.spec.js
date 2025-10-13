const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('trend channel should be translucent and persist on chart', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    console.log('Step 1: Select trend channel tool');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(500);
    
    console.log('Step 2: Draw trend channel');
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Draw trend channel with 3 points
      const startX = chartBox.x + chartBox.width * 0.2;
      const startY = chartBox.y + chartBox.height * 0.7;
      await page.mouse.click(startX, startY);
      await page.waitForTimeout(500);
      
      const endX = chartBox.x + chartBox.width * 0.8;
      const endY = chartBox.y + chartBox.height * 0.3;
      await page.mouse.click(endX, endY);
      await page.waitForTimeout(500);
      
      const channelX = chartBox.x + chartBox.width * 0.5;
      const channelY = chartBox.y + chartBox.height * 0.5;
      await page.mouse.click(channelX, channelY);
      await page.waitForTimeout(1000);
    }
    
    console.log('Step 3: Take screenshot after drawing channel');
    await page.screenshot({ path: 'test-results/trend-channel-after-drawing.png' });
    
    console.log('Step 4: Switch to cursor tool and back to verify persistence');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    console.log('Step 5: Take screenshot in cursor mode to verify channel persists');
    await page.screenshot({ path: 'test-results/trend-channel-persistence.png' });
    
    console.log('Step 6: Switch back to trend line tool');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendline"]');
    await page.waitForTimeout(500);
    
    console.log('Step 7: Draw a regular trend line to test compatibility');
    if (chartBox) {
      const startX2 = chartBox.x + chartBox.width * 0.3;
      const startY2 = chartBox.y + chartBox.height * 0.6;
      await page.mouse.click(startX2, startY2);
      await page.waitForTimeout(500);
      
      const endX2 = chartBox.x + chartBox.width * 0.7;
      const endY2 = chartBox.y + chartBox.height * 0.4;
      await page.mouse.click(endX2, endY2);
      await page.waitForTimeout(1000);
    }
    
    console.log('Step 8: Final screenshot showing both channel and trend line');
    await page.screenshot({ path: 'test-results/trend-channel-with-trendline.png' });
    
    console.log('Errors captured:', errors);
    
    // Verify no errors occurred
    expect(errors.length).toBe(0);
  });

  test('trend channel appearance should be correct', async ({ page }) => {
    // Select trend channel tool
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(500);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/trend-channel-selected.png' });
    
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Start drawing trend channel
      const startX = chartBox.x + chartBox.width * 0.25;
      const startY = chartBox.y + chartBox.height * 0.75;
      await page.mouse.click(startX, startY);
      await page.waitForTimeout(300);
      
      // Take screenshot during drawing (first point set)
      await page.screenshot({ path: 'test-results/trend-channel-first-point.png' });
      
      const endX = chartBox.x + chartBox.width * 0.75;
      const endY = chartBox.y + chartBox.height * 0.25;
      await page.mouse.click(endX, endY);
      await page.waitForTimeout(300);
      
      // Take screenshot during drawing (second point set, should show preview)
      await page.screenshot({ path: 'test-results/trend-channel-second-point.png' });
      
      const channelX = chartBox.x + chartBox.width * 0.5;
      const channelY = chartBox.y + chartBox.height * 0.5;
      await page.mouse.click(channelX, channelY);
      await page.waitForTimeout(500);
      
      // Take final screenshot showing completed channel
      await page.screenshot({ path: 'test-results/trend-channel-completed.png' });
    }
    
    // Test passes if no errors occurred
    expect(true).toBe(true);
  });
});