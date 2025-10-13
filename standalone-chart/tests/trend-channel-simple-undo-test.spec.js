const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Simple Undo Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Let chart fully load
  });

  test('should create trend channel and test basic undo', async ({ page }) => {
    console.log('🧪 Testing basic trend channel undo functionality...');

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/simple-undo-initial.png' });

    // 1. Click Trend Channel button
    console.log('📐 Activating trend channel tool...');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(200);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/simple-undo-tool-selected.png' });

    // 2. Draw trend channel with 3 clicks
    console.log('🖱️ Drawing trend channel with 3 clicks...');
    
    // Click 1: Start point
    await page.mouse.click(300, 200);
    await page.waitForTimeout(1000);
    console.log('✅ First click completed');
    await page.screenshot({ path: 'test-results/simple-undo-click1.png' });
    
    // Click 2: End of first ray
    await page.mouse.click(500, 250);
    await page.waitForTimeout(1000);
    console.log('✅ Second click completed');
    await page.screenshot({ path: 'test-results/simple-undo-click2.png' });
    
    // Click 3: Complete channel
    await page.mouse.click(400, 150);
    await page.waitForTimeout(2000);
    console.log('✅ Third click completed');
    await page.screenshot({ path: 'test-results/simple-undo-click3.png' });

    // 3. Switch to cursor mode
    console.log('🖱️ Switching to cursor mode...');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/simple-undo-channel-created.png' });
    console.log('✅ Trend channel created and cursor mode activated');

    // 4. Test undo
    console.log('⏪ Testing undo...');
    await page.keyboard.press('Meta+z'); // Cmd+Z on Mac
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/simple-undo-after-undo.png' });
    console.log('✅ Undo command executed');

    // 5. Test redo
    console.log('⏩ Testing redo...');
    await page.keyboard.press('Meta+Shift+z'); // Cmd+Shift+Z on Mac
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/simple-undo-after-redo.png' });
    console.log('✅ Redo command executed');

    console.log('🎯 Simple trend channel undo test completed');
  });
});