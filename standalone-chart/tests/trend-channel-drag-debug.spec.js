const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Drag Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      if (
        text.includes('drag') || 
        text.includes('Drag') ||
        text.includes('select') ||
        text.includes('Select') ||
        text.includes('TrendChannel') ||
        text.includes('onDragComplete') ||
        text.includes('Channel') ||
        text.includes('DELETING') ||
        text.includes('completed')
      ) {
        console.log('🎧 Console:', text);
      }
    });
  });

  test('should debug trend channel drag operations', async ({ page }) => {
    console.log('🧪 Debugging trend channel drag operations...');

    // 1. Create a trend channel
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('text=Trend Channel');
    await page.waitForTimeout(300);

    // Create a clear, large channel for easy testing
    await page.mouse.click(200, 300);
    await page.waitForTimeout(800);
    await page.mouse.click(600, 200);
    await page.waitForTimeout(800);
    await page.mouse.click(300, 400);
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'test-results/drag-debug-created.png' });

    // 2. Switch to cursor mode
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);

    // 3. Try clicking on the filled area to select
    console.log('🎯 Clicking to select channel...');
    await page.mouse.click(400, 350); // In the filled area
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/drag-debug-selected.png' });

    // 4. Try dragging from a control point (edge circle)
    console.log('🔄 Trying to drag control point...');
    await page.mouse.move(200, 300); // Move to start point
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(250, 250, { steps: 10 }); // Drag control point
    await page.waitForTimeout(500);
    await page.mouse.up();
    await page.waitForTimeout(2000); // Wait for drag complete
    
    await page.screenshot({ path: 'test-results/drag-debug-control-dragged.png' });

    // 5. Try dragging the entire channel from filled area
    console.log('🖱️ Trying to drag entire channel...');
    await page.mouse.move(450, 350); // Move to filled area
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(500, 400, { steps: 15 }); // Drag entire channel
    await page.waitForTimeout(500);
    await page.mouse.up();
    await page.waitForTimeout(2000); // Wait for drag complete
    
    await page.screenshot({ path: 'test-results/drag-debug-channel-dragged.png' });

    // 6. Test undo to see if changes were saved
    console.log('⏪ Testing undo to verify drag was saved...');
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/drag-debug-after-undo.png' });

    console.log('🎯 Drag debug test completed');
  });
});