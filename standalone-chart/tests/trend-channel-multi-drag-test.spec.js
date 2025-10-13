const { test, expect } = require('@playwright/test');

test.describe('Multiple TrendChannel Drag Test', () => {
  test('multiple trend channels should maintain independent positions', async ({ page }) => {
    console.log('Testing multiple TrendChannel drag independence');
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Enable console logging to debug the issue
    page.on('console', msg => {
      if (msg.text().includes('🔶') || msg.text().includes('handleTrendChannelComplete')) {
        console.log('🎧 Console:', msg.text());
      }
    });
    
    // Step 1: Draw first trend channel
    console.log('1. Drawing first trend channel');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(500);
    
    // First channel - top area
    await page.mouse.click(250, 200);
    await page.waitForTimeout(300);
    await page.mouse.click(450, 250);
    await page.waitForTimeout(300);
    await page.mouse.click(350, 280);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'tests/screenshots/multi-channel-1-drawn.png' });
    
    // Step 2: Draw second trend channel
    console.log('2. Drawing second trend channel');
    await page.mouse.click(300, 350);
    await page.waitForTimeout(300);
    await page.mouse.click(500, 400);
    await page.waitForTimeout(300);
    await page.mouse.click(400, 430);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'tests/screenshots/multi-channel-2-drawn.png' });
    
    // Step 3: Switch to cursor mode
    console.log('3. Switching to cursor mode');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    // Step 4: Drag first channel
    console.log('4. Dragging first channel');
    await page.mouse.click(350, 225); // Select first channel
    await page.waitForTimeout(500);
    
    // Drag first channel to the right
    await page.mouse.move(350, 225);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(450, 275, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'tests/screenshots/multi-channel-1-dragged.png' });
    
    // Step 5: Drag second channel (this is where the bug occurs)
    console.log('5. Dragging second channel');
    await page.mouse.click(400, 375); // Select second channel
    await page.waitForTimeout(500);
    
    // Drag second channel to the left
    await page.mouse.move(400, 375);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(300, 325, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'tests/screenshots/multi-channel-2-dragged-bug.png' });
    
    // Step 6: Click somewhere else to deselect
    console.log('6. Deselecting all channels');
    await page.mouse.click(200, 150);
    await page.waitForTimeout(1000);
    
    // Step 7: Final screenshot to verify both channels maintained their positions
    await page.screenshot({ path: 'tests/screenshots/multi-channel-final-positions.png' });
    
    // Step 8: Try to select each channel at their NEW positions (not original)
    console.log('7. Verifying first channel stayed at new position');
    await page.mouse.click(450, 275); // Try to select first channel at new position
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/multi-channel-verify-1.png' });
    
    console.log('8. Verifying second channel stayed at new position');
    await page.mouse.click(300, 325); // Try to select second channel at new position
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/multi-channel-verify-2.png' });
    
    console.log('Test completed - check screenshots for position persistence');
  });
  
  test('re-selecting channel after drag should not reset position', async ({ page }) => {
    console.log('Testing channel position persistence after re-selection');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('🔶') || msg.text().includes('handleTrendChannelComplete')) {
        console.log('🎧 Console:', msg.text());
      }
    });
    
    // Step 1: Draw one trend channel
    console.log('1. Drawing trend channel');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(500);
    
    await page.mouse.click(300, 200);
    await page.waitForTimeout(300);
    await page.mouse.click(500, 250);
    await page.waitForTimeout(300);
    await page.mouse.click(400, 280);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'tests/screenshots/single-channel-drawn.png' });
    
    // Step 2: Switch to cursor and drag
    console.log('2. Dragging channel');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    await page.mouse.click(400, 225);
    await page.waitForTimeout(500);
    
    // Drag to new position
    await page.mouse.move(400, 225);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(500, 275, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'tests/screenshots/single-channel-dragged.png' });
    
    // Step 3: Deselect
    console.log('3. Deselecting');
    await page.mouse.click(200, 150);
    await page.waitForTimeout(1000);
    
    // Step 4: Re-select the channel (this triggers the bug)
    console.log('4. Re-selecting channel - this should NOT reset position');
    await page.mouse.click(500, 275); // Click at NEW position
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'tests/screenshots/single-channel-reselected.png' });
    
    console.log('Test completed - channel should still be at dragged position');
  });
});