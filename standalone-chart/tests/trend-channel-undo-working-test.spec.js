const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Undo/Redo Working Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('should test trend channel creation and undo/redo', async ({ page }) => {
    console.log('🧪 Testing trend channel undo/redo with proper selectors...');

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/working-undo-initial.png' });

    // 1. Click line tools button to open dropdown
    console.log('📐 Opening line tools dropdown...');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/working-undo-dropdown-open.png' });

    // 2. Click on Trend Channel in dropdown
    console.log('📊 Selecting Trend Channel from dropdown...');
    await page.click('text=Trend Channel');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/working-undo-tool-selected.png' });

    // 3. Draw trend channel with 3 clicks
    console.log('🖱️ Drawing trend channel...');
    
    // Click 1: Start point
    await page.mouse.click(300, 200);
    await page.waitForTimeout(800);
    console.log('✅ First click completed');
    
    // Click 2: End of first ray
    await page.mouse.click(500, 250);
    await page.waitForTimeout(800);
    console.log('✅ Second click completed');
    
    // Click 3: Complete channel
    await page.mouse.click(400, 150);
    await page.waitForTimeout(1500);
    console.log('✅ Third click completed');
    
    await page.screenshot({ path: 'test-results/working-undo-channel-drawn.png' });

    // 4. Switch to cursor mode
    console.log('🖱️ Switching to cursor mode...');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/working-undo-cursor-mode.png' });
    console.log('✅ Trend channel created and cursor mode activated');

    // 5. Test undo - should remove the trend channel
    console.log('⏪ Testing undo of trend channel creation...');
    await page.keyboard.press('Meta+z'); // Cmd+Z on Mac
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/working-undo-after-undo.png' });
    console.log('✅ Undo executed - trend channel should be gone');

    // 6. Test redo - should restore the trend channel
    console.log('⏩ Testing redo of trend channel creation...');
    await page.keyboard.press('Meta+Shift+z'); // Cmd+Shift+Z on Mac
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/working-undo-after-redo.png' });
    console.log('✅ Redo executed - trend channel should be restored');

    // 7. Test deletion and undo
    console.log('🗑️ Testing deletion...');
    await page.mouse.click(400, 200); // Click on the channel area to select it
    await page.waitForTimeout(500);
    
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/working-undo-after-delete.png' });
    console.log('✅ Deletion executed');

    // 8. Test undo deletion
    console.log('⏪ Testing undo of deletion...');
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/working-undo-restored-from-delete.png' });
    console.log('✅ Undo deletion executed - trend channel should be restored');

    console.log('🎯 Trend channel undo/redo test completed successfully');
  });
});