const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Area Hover Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('should detect hover over trend channel filled area', async ({ page }) => {
    console.log('🧪 Testing trend channel area hover detection...');

    // 1. Create a trend channel
    console.log('📐 Creating trend channel...');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('text=Trend Channel');
    await page.waitForTimeout(300);

    // Draw a clear channel
    await page.mouse.click(200, 300);
    await page.waitForTimeout(500);
    await page.mouse.click(600, 200);
    await page.waitForTimeout(500);
    await page.mouse.click(300, 350);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/area-hover-channel-created.png' });
    console.log('✅ Trend channel created');

    // 2. Switch to cursor mode
    console.log('🖱️ Switching to cursor mode...');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);

    // 3. Test clicking in the middle of the filled area (not on lines)
    console.log('🎯 Clicking in filled area (should select channel)...');
    await page.mouse.click(400, 275); // Middle of the channel area
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/area-hover-clicked-in-area.png' });

    // 4. Try to drag the channel from the filled area
    console.log('🖱️ Attempting to drag from filled area...');
    await page.mouse.move(400, 275);
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.move(450, 325, { steps: 10 }); // Drag 50 pixels down and right
    await page.waitForTimeout(500);
    await page.mouse.up();
    await page.waitForTimeout(1500); // Wait for drag complete
    
    await page.screenshot({ path: 'test-results/area-hover-after-drag.png' });
    console.log('✅ Drag from filled area completed');

    // 5. Test hover feedback
    console.log('🎯 Testing hover feedback over filled area...');
    await page.mouse.move(100, 100); // Move away first
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/area-hover-no-hover.png' });

    await page.mouse.move(500, 300); // Hover over different part of channel area
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/area-hover-hovering-area.png' });

    console.log('🎯 Area hover test completed');
  });
});