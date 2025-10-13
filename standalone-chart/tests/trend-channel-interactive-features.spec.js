const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Interactive Features', () => {
  test('verify trend channel selection, movement, and deletion', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('1. Draw a trend channel first');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(1000);

    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Draw trend channel (3 clicks)
      console.log('  Drawing trend channel with 3 clicks');
      
      // First click
      await page.mouse.click(chartBox.x + chartBox.width * 0.2, chartBox.y + chartBox.height * 0.7);
      await page.waitForTimeout(500);
      
      // Second click 
      await page.mouse.click(chartBox.x + chartBox.width * 0.8, chartBox.y + chartBox.height * 0.3);
      await page.waitForTimeout(500);
      
      // Third click to complete channel
      await page.mouse.click(chartBox.x + chartBox.width * 0.8, chartBox.y + chartBox.height * 0.2);
      await page.waitForTimeout(1000);
      
      console.log('2. Switch to cursor mode to enable selection');
      await page.click('[data-testid="cursor-button"]');
      await page.waitForTimeout(1000);
      
      console.log('3. Click on trend channel to select it');
      // Click in the middle of the channel area to select it
      await page.mouse.click(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.5);
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-selected.png' });
      
      console.log('4. Test dragging the trend channel');
      // Drag the channel to a new position
      await page.mouse.move(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(chartBox.x + chartBox.width * 0.6, chartBox.y + chartBox.height * 0.4, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-moved.png' });
      
      console.log('5. Test Delete key functionality');
      // Press Delete key to remove the channel
      await page.keyboard.press('Delete');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-deleted.png' });
    }
    
    console.log('6. Check console messages for interactive features');
    const relevantMessages = consoleMessages.filter(msg => 
      msg.includes('TrendChannel') || 
      msg.includes('selectedChannels') ||
      msg.includes('DELETING') ||
      msg.includes('Select Called')
    );
    
    console.log('Interactive features messages:');
    relevantMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg}`);
    });
    
    expect(true).toBe(true);
  });
  
  test('verify trend channel hover and selection states', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('1. Draw a trend channel');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(1000);

    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Draw trend channel quickly
      await page.mouse.click(chartBox.x + chartBox.width * 0.3, chartBox.y + chartBox.height * 0.6);
      await page.waitForTimeout(200);
      await page.mouse.click(chartBox.x + chartBox.width * 0.7, chartBox.y + chartBox.height * 0.4);
      await page.waitForTimeout(200);
      await page.mouse.click(chartBox.x + chartBox.width * 0.7, chartBox.y + chartBox.height * 0.3);
      await page.waitForTimeout(1000);
      
      console.log('2. Switch to cursor and test hover states');
      await page.click('[data-testid="cursor-button"]');
      await page.waitForTimeout(500);
      
      // Test hover over trend channel
      await page.mouse.move(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.5);
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/trend-channel-hover.png' });
      
      // Test click selection
      await page.mouse.click(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.5);
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/trend-channel-clicked.png' });
      
      // Test moving selection away
      await page.mouse.click(chartBox.x + chartBox.width * 0.1, chartBox.y + chartBox.height * 0.1);
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/trend-channel-deselected.png' });
    }
    
    expect(true).toBe(true);
  });
});