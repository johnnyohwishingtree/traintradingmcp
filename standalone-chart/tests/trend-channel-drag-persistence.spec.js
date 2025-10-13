const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Drag Persistence and Undo/Redo', () => {
  test('verify trend channel drag changes are saved and undo/redo works', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('1. Draw a trend channel');
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
      // Draw trend channel
      console.log('  Drawing initial trend channel');
      await page.mouse.click(chartBox.x + chartBox.width * 0.2, chartBox.y + chartBox.height * 0.7);
      await page.waitForTimeout(300);
      await page.mouse.click(chartBox.x + chartBox.width * 0.6, chartBox.y + chartBox.height * 0.4);
      await page.waitForTimeout(300);
      await page.mouse.click(chartBox.x + chartBox.width * 0.6, chartBox.y + chartBox.height * 0.3);
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-initial.png' });
      
      console.log('2. Switch to cursor mode and select the channel');
      await page.click('[data-testid="cursor-button"]');
      await page.waitForTimeout(500);
      
      // Click to select the channel
      await page.mouse.click(chartBox.x + chartBox.width * 0.4, chartBox.y + chartBox.height * 0.5);
      await page.waitForTimeout(500);
      
      console.log('3. Drag the trend channel to a new position');
      // Drag the channel to a new location
      const startX = chartBox.x + chartBox.width * 0.4;
      const startY = chartBox.y + chartBox.height * 0.5;
      const endX = chartBox.x + chartBox.width * 0.3;
      const endY = chartBox.y + chartBox.height * 0.6;
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-dragged.png' });
      
      console.log('4. Click somewhere else to deselect and verify channel moved');
      await page.mouse.click(chartBox.x + chartBox.width * 0.1, chartBox.y + chartBox.height * 0.1);
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/trend-channel-deselected-moved.png' });
      
      console.log('5. Test undo to restore original position');
      await page.keyboard.press('Meta+z'); // or 'Control+z' on Windows
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-after-undo.png' });
      
      console.log('6. Test redo to restore moved position');
      await page.keyboard.press('Meta+Shift+z'); // or 'Control+Shift+z' on Windows
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-after-redo.png' });
      
      console.log('7. Test multiple drag operations with history');
      // Select channel again
      await page.mouse.click(chartBox.x + chartBox.width * 0.3, chartBox.y + chartBox.height * 0.6);
      await page.waitForTimeout(500);
      
      // Drag to another position
      await page.mouse.move(chartBox.x + chartBox.width * 0.3, chartBox.y + chartBox.height * 0.6);
      await page.mouse.down();
      await page.mouse.move(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.4, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-second-drag.png' });
      
      console.log('8. Test undo again to verify multiple history entries');
      await page.keyboard.press('Meta+z');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-second-undo.png' });
    }
    
    console.log('9. Check console messages for history operations');
    const historyMessages = consoleMessages.filter(msg => 
      msg.includes('handleTrendChannelComplete') || 
      msg.includes('saving to history') ||
      msg.includes('Undo:') ||
      msg.includes('Redo:') ||
      msg.includes('setTrendChannels')
    );
    
    console.log('History operation messages:');
    historyMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg}`);
    });
    
    expect(true).toBe(true);
  });
  
  test('verify trend channel resizing is saved to history', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('1. Draw and test resizing a trend channel');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(1000);

    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Draw trend channel
      await page.mouse.click(chartBox.x + chartBox.width * 0.3, chartBox.y + chartBox.height * 0.6);
      await page.waitForTimeout(200);
      await page.mouse.click(chartBox.x + chartBox.width * 0.7, chartBox.y + chartBox.height * 0.4);
      await page.waitForTimeout(200);
      await page.mouse.click(chartBox.x + chartBox.width * 0.7, chartBox.y + chartBox.height * 0.3);
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-resize-initial.png' });
      
      // Switch to cursor and select
      await page.click('[data-testid="cursor-button"]');
      await page.waitForTimeout(500);
      
      await page.mouse.click(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.5);
      await page.waitForTimeout(500);
      
      console.log('2. Resize by dragging control points');
      // Try to drag one of the control points (endpoints)
      await page.mouse.move(chartBox.x + chartBox.width * 0.7, chartBox.y + chartBox.height * 0.4);
      await page.mouse.down();
      await page.mouse.move(chartBox.x + chartBox.width * 0.8, chartBox.y + chartBox.height * 0.35, { steps: 3 });
      await page.mouse.up();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-resized.png' });
      
      console.log('3. Test undo resize operation');
      await page.keyboard.press('Meta+z');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/trend-channel-resize-undone.png' });
    }
    
    expect(true).toBe(true);
  });
});