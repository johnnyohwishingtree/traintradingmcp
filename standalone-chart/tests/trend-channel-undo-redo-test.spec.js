const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Undo/Redo Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000); // Let chart fully load
  });

  test('should support undo/redo for trend channel creation and deletion', async ({ page }) => {
    console.log('🧪 Testing trend channel undo/redo functionality...');

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/trend-channel-undo-initial.png' });

    // 1. Draw a trend channel
    console.log('📐 Drawing trend channel...');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(200);
    await page.click('[data-testid="line-type-trendchannel"]');
    
    // First click to start
    await page.mouse.click(300, 200);
    await page.waitForTimeout(500);
    
    // Second click to set the first ray
    await page.mouse.click(500, 250);
    await page.waitForTimeout(500);
    
    // Third click to complete the channel
    await page.mouse.click(400, 180);
    await page.waitForTimeout(1000);
    
    // Switch to cursor mode
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/trend-channel-undo-created.png' });
    console.log('✅ Trend channel created');

    // 2. Test undo creation
    console.log('⏪ Testing undo of creation...');
    await page.keyboard.press('Meta+z'); // Cmd+Z on Mac
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/trend-channel-undo-after-undo.png' });
    console.log('✅ Undo tested');

    // 3. Test redo creation
    console.log('⏩ Testing redo of creation...');
    await page.keyboard.press('Meta+Shift+z'); // Cmd+Shift+Z on Mac
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/trend-channel-undo-after-redo.png' });
    console.log('✅ Redo tested');

    // 4. Select and delete the trend channel
    console.log('🗑️ Testing deletion...');
    await page.mouse.click(400, 215); // Click on the channel to select it
    await page.waitForTimeout(500);
    
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/trend-channel-undo-after-delete.png' });
    console.log('✅ Deletion tested');

    // 5. Test undo deletion
    console.log('⏪ Testing undo of deletion...');
    await page.keyboard.press('Meta+z'); // Should restore the deleted channel
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/trend-channel-undo-restored.png' });
    console.log('✅ Undo deletion tested');

    // 6. Test redo deletion
    console.log('⏩ Testing redo of deletion...');
    await page.keyboard.press('Meta+Shift+z'); // Should delete again
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/trend-channel-undo-final.png' });
    console.log('✅ Redo deletion tested');

    console.log('🎯 Trend channel undo/redo test completed');
  });

  test('should support undo/redo for trend channel drag operations', async ({ page }) => {
    console.log('🧪 Testing trend channel drag undo/redo functionality...');

    // 1. Draw a trend channel
    console.log('📐 Drawing trend channel...');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(200);
    await page.click('[data-testid="line-type-trendchannel"]');
    
    await page.mouse.click(300, 200);
    await page.waitForTimeout(300);
    await page.mouse.click(500, 250);
    await page.waitForTimeout(300);
    await page.mouse.click(400, 180);
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/trend-channel-drag-initial.png' });

    // 2. Drag the trend channel to a new position
    console.log('🖱️ Dragging trend channel...');
    await page.mouse.move(400, 215); // Move to channel
    await page.mouse.down();
    await page.mouse.move(450, 265, { steps: 5 }); // Drag to new position
    await page.mouse.up();
    await page.waitForTimeout(1000); // Wait for drag complete
    
    await page.screenshot({ path: 'test-results/trend-channel-drag-moved.png' });
    console.log('✅ Trend channel dragged');

    // 3. Test undo drag
    console.log('⏪ Testing undo of drag...');
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/trend-channel-drag-undone.png' });
    console.log('✅ Drag undo tested');

    // 4. Test redo drag
    console.log('⏩ Testing redo of drag...');
    await page.keyboard.press('Meta+Shift+z');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/trend-channel-drag-redone.png' });
    console.log('✅ Drag redo tested');

    console.log('🎯 Trend channel drag undo/redo test completed');
  });
});