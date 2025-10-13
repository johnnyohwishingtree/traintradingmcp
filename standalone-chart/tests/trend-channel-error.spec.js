const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Error Reproduction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('reproduces trend channel error by drawing channel then switching to trendline', async ({ page }) => {
    const errors = [];
    const warnings = [];
    
    // Capture all console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
      if (msg.text().includes('Cannot read properties of undefined')) {
        errors.push(`Cannot read properties error: ${msg.text()}`);
      }
    });
    
    // Capture uncaught exceptions
    page.on('pageerror', error => {
      errors.push(`Uncaught exception: ${error.message}`);
      console.log('Page error captured:', error.message);
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
    
    console.log('Step 3: Switch to regular trend line tool');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendline"]');
    await page.waitForTimeout(1000);
    
    console.log('Step 4: Try to draw a regular trend line');
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
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/trend-channel-error-reproduction.png' });
    
    console.log('All errors captured:', errors);
    
    // Check for the specific error
    const hasStructureError = errors.some(error => 
      error.includes('Cannot read properties of undefined') ||
      error.includes('reading \'0\'') ||
      error.includes('each.start')
    );
    
    if (hasStructureError) {
      console.log('✅ Successfully reproduced the error!');
      console.log('Error details:', errors.filter(e => e.includes('Cannot read properties')));
    } else {
      console.log('❌ Did not reproduce the expected error');
    }
    
    // This test should fail if the error exists, pass if it's fixed
    expect(hasStructureError).toBe(false);
  });

  test('verifies trend channel data structure compatibility', async ({ page }) => {
    // This test checks if trend channels and trend lines have compatible data structures
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Draw multiple different line types to test data structure compatibility
    const lineTypes = ['trendline', 'trendchannel', 'ray', 'trendline'];
    
    for (let i = 0; i < lineTypes.length; i++) {
      const lineType = lineTypes[i];
      console.log(`Drawing ${lineType} (${i + 1}/${lineTypes.length})`);
      
      await page.click('[data-testid="line-tools-button"]');
      await page.waitForTimeout(300);
      await page.click(`[data-testid="line-type-${lineType}"]`);
      await page.waitForTimeout(300);
      
      const chart = page.locator('[data-testid="main-chart-container"]');
      const chartBox = await chart.boundingBox();
      
      if (chartBox) {
        const startX = chartBox.x + chartBox.width * (0.1 + i * 0.2);
        const startY = chartBox.y + chartBox.height * 0.7;
        const endX = chartBox.x + chartBox.width * (0.3 + i * 0.2);
        const endY = chartBox.y + chartBox.height * 0.3;
        
        await page.mouse.click(startX, startY);
        await page.waitForTimeout(300);
        await page.mouse.click(endX, endY);
        await page.waitForTimeout(300);
        
        // For trend channel, add third point
        if (lineType === 'trendchannel') {
          const channelX = chartBox.x + chartBox.width * (0.2 + i * 0.2);
          const channelY = chartBox.y + chartBox.height * 0.5;
          await page.mouse.click(channelX, channelY);
          await page.waitForTimeout(300);
        }
      }
      
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'test-results/mixed-line-types.png' });
    
    console.log('Data structure compatibility errors:', errors);
    expect(errors.length).toBe(0);
  });
});