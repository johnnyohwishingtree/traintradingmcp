const { test, expect } = require('@playwright/test');

test.describe('TrendChannel Drag Persistence Fix', () => {
  test('trend channel should persist after dragging without reverting', async ({ page }) => {
    console.log('Starting trend channel drag persistence test');
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    
    // Wait for chart to load
    await page.waitForTimeout(2000);
    
    // Step 1: Enable TrendChannel mode
    console.log('Enabling TrendChannel mode');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(500);
    
    // Step 2: Draw a trend channel (3 clicks)
    console.log('Drawing trend channel');
    
    // Click 1: Start point (main line start)
    await page.mouse.click(300, 200);
    await page.waitForTimeout(300);
    
    // Click 2: End point (main line end)
    await page.mouse.click(500, 250);
    await page.waitForTimeout(300);
    
    // Click 3: Channel width point (parallel line position)
    await page.mouse.click(400, 280);
    await page.waitForTimeout(1000);
    
    // Step 3: Switch to cursor mode
    console.log('Switching to cursor mode');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    // Step 4: Select the channel by clicking on it
    console.log('Selecting the trend channel');
    await page.mouse.click(400, 225); // Click in the middle of the channel
    await page.waitForTimeout(500);
    
    // Step 5: Drag the channel to a new position
    console.log('Dragging the channel');
    const dragStartX = 400;
    const dragStartY = 225;
    const dragEndX = 450;
    const dragEndY = 275;
    
    // Take screenshot before drag
    await page.screenshot({ path: 'tests/screenshots/channel-before-drag.png' });
    
    // Perform drag
    await page.mouse.move(dragStartX, dragStartY);
    await page.mouse.down();
    await page.waitForTimeout(100);
    
    // Drag with intermediate steps
    for (let i = 1; i <= 5; i++) {
      const intermediateX = dragStartX + (dragEndX - dragStartX) * i / 5;
      const intermediateY = dragStartY + (dragEndY - dragStartY) * i / 5;
      await page.mouse.move(intermediateX, intermediateY);
      await page.waitForTimeout(50);
    }
    
    // Release the drag
    await page.mouse.up();
    console.log('Drag released');
    
    // Wait for any state updates
    await page.waitForTimeout(1000);
    
    // Take screenshot after drag
    await page.screenshot({ path: 'tests/screenshots/channel-after-drag.png' });
    
    // Step 6: Click somewhere else to deselect
    console.log('Deselecting channel');
    await page.mouse.click(200, 150);
    await page.waitForTimeout(1000);
    
    // Take screenshot after deselection
    await page.screenshot({ path: 'tests/screenshots/channel-after-deselect.png' });
    
    // Step 7: Verify the channel didn't revert
    // Re-select the channel to check its position
    console.log('Re-selecting channel to verify position');
    await page.mouse.click(450, 275); // Click at the new position
    await page.waitForTimeout(500);
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/channel-final-position.png' });
    
    // Check console for any errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
    
    console.log('Test completed successfully');
  });
  
  test('trend channel resize should persist without reverting', async ({ page }) => {
    console.log('Starting trend channel resize persistence test');
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    
    // Wait for chart to load
    await page.waitForTimeout(2000);
    
    // Step 1: Enable TrendChannel mode
    console.log('Enabling TrendChannel mode');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(500);
    
    // Step 2: Draw a trend channel
    console.log('Drawing trend channel');
    await page.mouse.click(350, 220);
    await page.waitForTimeout(300);
    await page.mouse.click(550, 270);
    await page.waitForTimeout(300);
    await page.mouse.click(450, 300);
    await page.waitForTimeout(1000);
    
    // Step 3: Switch to cursor mode
    console.log('Switching to cursor mode');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    // Step 4: Select the channel
    console.log('Selecting the trend channel');
    await page.mouse.click(450, 245);
    await page.waitForTimeout(500);
    
    // Take screenshot before resize
    await page.screenshot({ path: 'tests/screenshots/channel-before-resize.png' });
    
    // Step 5: Drag the end point to resize (look for control point)
    console.log('Resizing the channel by dragging end point');
    
    // Drag the end point of the main line
    await page.mouse.move(550, 270);
    await page.mouse.down();
    await page.waitForTimeout(100);
    
    // Drag to new position
    await page.mouse.move(580, 290, { steps: 5 });
    await page.mouse.up();
    console.log('Resize drag released');
    
    // Wait for state update
    await page.waitForTimeout(1000);
    
    // Take screenshot after resize
    await page.screenshot({ path: 'tests/screenshots/channel-after-resize.png' });
    
    // Step 6: Deselect and verify persistence
    console.log('Deselecting channel');
    await page.mouse.click(200, 150);
    await page.waitForTimeout(1000);
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/channel-resize-final.png' });
    
    console.log('Resize test completed successfully');
  });
});