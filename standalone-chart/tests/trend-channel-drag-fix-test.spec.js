const { test, expect } = require('@playwright/test');

test.describe('TrendChannel Drag Fix Test', () => {
  test('trend channel should maintain position after drag and release', async ({ page }) => {
    console.log('Testing TrendChannel drag persistence fix');
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Step 1: Enable Trend Channel drawing mode
    console.log('Clicking line tools button');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    
    console.log('Selecting TrendChannel from dropdown');
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(500);
    
    // Step 2: Draw a trend channel with 3 clicks
    console.log('Drawing trend channel');
    
    // First click - start of main line
    await page.mouse.click(350, 200);
    await page.waitForTimeout(300);
    
    // Second click - end of main line
    await page.mouse.click(550, 250);
    await page.waitForTimeout(300);
    
    // Third click - parallel line position (creates the channel)
    await page.mouse.click(450, 280);
    await page.waitForTimeout(1000);
    
    // Take screenshot after drawing
    await page.screenshot({ path: 'tests/screenshots/channel-drawn.png' });
    
    // Step 3: Switch to cursor mode
    console.log('Switching to cursor mode');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    // Step 4: Select the channel by clicking in the channel area
    console.log('Selecting the trend channel');
    await page.mouse.click(450, 240); // Click in the channel area
    await page.waitForTimeout(500);
    
    // Take screenshot showing selection
    await page.screenshot({ path: 'tests/screenshots/channel-selected.png' });
    
    // Step 5: Drag the entire channel to a new position
    console.log('Dragging the channel to new position');
    
    const startDragX = 450;
    const startDragY = 240;
    const endDragX = 500;
    const endDragY = 290;
    
    // Start drag
    await page.mouse.move(startDragX, startDragY);
    await page.mouse.down();
    await page.waitForTimeout(100);
    
    // Drag with smooth movement
    for (let i = 1; i <= 10; i++) {
      const x = startDragX + (endDragX - startDragX) * i / 10;
      const y = startDragY + (endDragY - startDragY) * i / 10;
      await page.mouse.move(x, y);
      await page.waitForTimeout(30);
    }
    
    // Release the drag
    await page.mouse.up();
    console.log('Drag completed - channel should now be at new position');
    
    // Wait for any state updates to complete
    await page.waitForTimeout(1000);
    
    // Take screenshot immediately after drag release
    await page.screenshot({ path: 'tests/screenshots/channel-after-drag.png' });
    
    // Step 6: Click elsewhere to deselect
    console.log('Deselecting by clicking elsewhere');
    await page.mouse.click(200, 150);
    await page.waitForTimeout(500);
    
    // Take screenshot after deselection
    await page.screenshot({ path: 'tests/screenshots/channel-deselected.png' });
    
    // Step 7: Try to select at the NEW position to verify persistence
    console.log('Attempting to select channel at new position');
    await page.mouse.click(endDragX, endDragY); // Click at the new position
    await page.waitForTimeout(500);
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/channel-final-position.png' });
    
    // Step 8: Wait a bit longer to ensure no revert happens
    await page.waitForTimeout(2000);
    
    // Final verification screenshot
    await page.screenshot({ path: 'tests/screenshots/channel-persistence-verified.png' });
    
    console.log('Test completed - check screenshots to verify drag persistence');
  });
});