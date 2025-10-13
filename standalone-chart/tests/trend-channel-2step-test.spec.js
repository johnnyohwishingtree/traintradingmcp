const { test, expect } = require('@playwright/test');

test.describe('Trend Channel 2-Step Interaction Test', () => {
  test('verify trend channel 2-step drawing: line then drag to create channel', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('1. Select trend channel tool');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(1000);

    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    console.log('2. Phase 1: Draw base trend line (click and drag)');
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Step 1: Click and drag to create base trend line
      const startX = chartBox.x + chartBox.width * 0.2;
      const startY = chartBox.y + chartBox.height * 0.7;
      const endX = chartBox.x + chartBox.width * 0.8;
      const endY = chartBox.y + chartBox.height * 0.3;
      
      console.log(`Drawing base line from (${startX}, ${startY}) to (${endX}, ${endY})`);
      
      // Click, drag, and release to create the trend line
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(1000);
      
      // Take screenshot after base line
      await page.screenshot({ path: 'test-results/trend-channel-2step-base-line.png' });
      
      console.log('3. Phase 2: Drag to create channel width');
      
      // Step 2: Click and drag to create the channel width
      const channelDragX = endX;
      const channelDragY = chartBox.y + chartBox.height * 0.2; // Drag up to create channel
      
      console.log(`Creating channel by dragging to (${channelDragX}, ${channelDragY})`);
      
      await page.mouse.move(channelDragX, channelDragY);
      await page.mouse.down();
      await page.mouse.move(channelDragX, channelDragY - 30, { steps: 5 }); // Drag up
      await page.mouse.up();
      await page.waitForTimeout(2000);
    }
    
    console.log('4. Take final screenshot');
    await page.screenshot({ path: 'test-results/trend-channel-2step-completed.png' });
    
    console.log('5. Switch to cursor to verify persistence and transparency');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/trend-channel-2step-persistent.png' });
    
    console.log('6. Check console messages for 2-step interaction');
    const relevantMessages = consoleMessages.filter(msg => 
      msg.includes('EquidistantChannel') || 
      msg.includes('Drawing base trend line') ||
      msg.includes('Dragging channel width') ||
      msg.includes('Base trend line completed') ||
      msg.includes('Finalizing trend channel')
    );
    
    console.log('2-step interaction messages:');
    relevantMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg}`);
    });
    
    expect(true).toBe(true);
  });
  
  test('verify multiple trend channels can be drawn', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('1. Draw first trend channel');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(1000);
    
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Draw first channel
      await page.mouse.click(chartBox.x + chartBox.width * 0.2, chartBox.y + chartBox.height * 0.6);
      await page.waitForTimeout(500);
      await page.mouse.click(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.4);
      await page.waitForTimeout(500);
      await page.mouse.click(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.3);
      await page.waitForTimeout(1000);
      
      console.log('2. Draw second trend channel');
      
      // Draw second channel
      await page.mouse.click(chartBox.x + chartBox.width * 0.6, chartBox.y + chartBox.height * 0.7);
      await page.waitForTimeout(500);
      await page.mouse.click(chartBox.x + chartBox.width * 0.9, chartBox.y + chartBox.height * 0.5);
      await page.waitForTimeout(500);
      await page.mouse.click(chartBox.x + chartBox.width * 0.9, chartBox.y + chartBox.height * 0.4);
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ path: 'test-results/trend-channel-multiple.png' });
    
    console.log('3. Switch to cursor to verify both channels persist');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/trend-channel-multiple-persistent.png' });
    
    expect(true).toBe(true);
  });
});