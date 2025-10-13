const { test, expect } = require('@playwright/test');

test.describe('Triangle Cursor Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('should show move cursor when hovering over triangle area', async ({ page }) => {
    console.log('🧪 Testing triangle cursor behavior...');

    // 1. Click Patterns button to activate triangle tool
    await page.click('[data-testid="patterns-button"]');
    await page.waitForTimeout(500);
    console.log('✅ Patterns tool activated');

    // 2. Draw a triangle pattern
    console.log('🔺 Drawing triangle pattern...');
    await page.mouse.click(200, 300);
    await page.waitForTimeout(800);
    await page.mouse.click(400, 200);
    await page.waitForTimeout(800);
    await page.mouse.click(600, 350);
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'test-results/triangle-cursor-created.png' });
    console.log('✅ Triangle pattern created');

    // 3. Switch to cursor mode
    console.log('🖱️ Switching to cursor mode...');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);

    // 4. Test cursor behavior - hover over triangle center
    console.log('🎯 Testing cursor over triangle center...');
    await page.mouse.move(400, 280);
    await page.waitForTimeout(1000);
    
    // Take screenshot to see if cursor changes
    await page.screenshot({ path: 'test-results/triangle-cursor-hover-center.png' });
    
    // 5. Test cursor behavior - hover outside triangle
    console.log('🎯 Testing cursor outside triangle...');
    await page.mouse.move(100, 100);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/triangle-cursor-hover-outside.png' });

    // 6. Test cursor behavior - hover over trend channel area for comparison
    console.log('🎯 Drawing trend channel for cursor comparison...');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(500);
    
    // Draw trend channel
    await page.mouse.click(150, 400);
    await page.waitForTimeout(800);
    await page.mouse.click(350, 300);
    await page.waitForTimeout(1500);
    
    // Switch back to cursor mode
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    // Hover over trend channel area
    await page.mouse.move(250, 350);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/triangle-cursor-trendchannel-hover.png' });

    console.log('🎯 Cursor test completed');
  });
});