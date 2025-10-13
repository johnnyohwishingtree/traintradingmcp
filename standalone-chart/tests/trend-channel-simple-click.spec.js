const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Simple Click Test', () => {
  test('test trend channel with simple click pattern', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:3000');
    
    // Wait for chart to load
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    console.log('1. Select trend channel tool');
    
    // Select trend channel tool
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(1000);
    
    console.log('2. Take screenshot before drawing');
    await page.screenshot({ path: 'test-results/trend-channel-before.png' });
    
    console.log('3. Perform three clicks for trend channel');
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Click 1 - Start point
      const x1 = chartBox.x + chartBox.width * 0.3;
      const y1 = chartBox.y + chartBox.height * 0.6;
      console.log(`Click 1 at: (${x1}, ${y1})`);
      await page.mouse.click(x1, y1);
      await page.waitForTimeout(1000);
      
      // Click 2 - End point
      const x2 = chartBox.x + chartBox.width * 0.7;
      const y2 = chartBox.y + chartBox.height * 0.4;
      console.log(`Click 2 at: (${x2}, ${y2})`);
      await page.mouse.click(x2, y2);
      await page.waitForTimeout(1000);
      
      // Click 3 - Channel width
      const x3 = chartBox.x + chartBox.width * 0.7;
      const y3 = chartBox.y + chartBox.height * 0.3;
      console.log(`Click 3 at: (${x3}, ${y3})`);
      await page.mouse.click(x3, y3);
      await page.waitForTimeout(2000);
    }
    
    console.log('4. Take screenshot after drawing');
    await page.screenshot({ path: 'test-results/trend-channel-after.png' });
    
    console.log('5. Check for relevant console messages');
    const relevantMessages = consoleMessages.filter(msg => 
      msg.includes('TrendChannel') || 
      msg.includes('EquidistantChannel') || 
      msg.includes('handleTrendChannelComplete') ||
      msg.includes('channel')
    );
    
    console.log('Relevant console messages:');
    relevantMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg}`);
    });
    
    console.log('6. All console messages:');
    consoleMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg}`);
    });
    
    // The test should pass regardless - we're just gathering info
    expect(true).toBe(true);
  });
});