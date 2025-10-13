const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Debug', () => {
  test('debug trend channel completion and data flow', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
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
      console.log(`Clicking point 1: (${startX}, ${startY})`);
      await page.mouse.click(startX, startY);
      await page.waitForTimeout(1000);
      
      const endX = chartBox.x + chartBox.width * 0.8;
      const endY = chartBox.y + chartBox.height * 0.3;
      console.log(`Clicking point 2: (${endX}, ${endY})`);
      await page.mouse.click(endX, endY);
      await page.waitForTimeout(1000);
      
      const channelX = chartBox.x + chartBox.width * 0.5;
      const channelY = chartBox.y + chartBox.height * 0.5;
      console.log(`Clicking point 3: (${channelX}, ${channelY})`);
      await page.mouse.click(channelX, channelY);
      await page.waitForTimeout(2000);
    }
    
    console.log('Console messages captured:');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg}`);
    });
    
    // Check if our onComplete was called
    const completionMessages = consoleMessages.filter(msg => 
      msg.includes('Trend channel completed') || 
      msg.includes('onComplete') ||
      msg.includes('✅')
    );
    
    console.log('Completion messages:', completionMessages);
    
    await page.screenshot({ path: 'test-results/trend-channel-debug.png' });
    
    // This test should help us understand what's happening
    expect(true).toBe(true);
  });
});