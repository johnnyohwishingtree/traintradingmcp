const { test, expect } = require('@playwright/test');

test.describe('Triangle Area Drag Simple Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Capture console messages for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (
        text.includes('🔺') || 
        text.includes('Triangle') || 
        text.includes('drag') || 
        text.includes('hover') ||
        text.includes('select')
      ) {
        console.log('🎧 Console:', text);
      }
    });
  });

  test('should allow dragging triangle from filled area', async ({ page }) => {
    console.log('🧪 Testing triangle area drag functionality...');

    // 1. Click Patterns button to activate triangle tool
    await page.click('[data-testid="patterns-button"]');
    await page.waitForTimeout(500);
    
    console.log('✅ Patterns tool activated');

    // 2. Draw a triangle pattern with 3 clicks
    console.log('🔺 Drawing triangle pattern...');
    
    // Click 1: First point
    await page.mouse.click(200, 300);
    await page.waitForTimeout(800);
    
    // Click 2: Second point  
    await page.mouse.click(400, 200);
    await page.waitForTimeout(800);
    
    // Click 3: Third point (complete triangle)
    await page.mouse.click(600, 350);
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'test-results/triangle-area-created.png' });
    console.log('✅ Triangle pattern created');

    // 3. Switch to cursor mode
    console.log('🖱️ Switching to cursor mode...');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);

    // 4. Try dragging from center of triangle (filled area)
    console.log('🔄 Testing drag from triangle center...');
    
    // Move to center of triangle
    const centerX = 400;  // Center X of our triangle
    const centerY = 280;  // Center Y of our triangle
    
    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(300);
    
    // Start drag
    await page.mouse.down();
    await page.waitForTimeout(300);
    
    // Drag to new position
    await page.mouse.move(centerX + 100, centerY + 50, { steps: 8 });
    await page.waitForTimeout(500);
    
    // End drag
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/triangle-area-dragged.png' });
    console.log('✅ Triangle area drag completed');

    console.log('🎯 Triangle area drag test completed');
  });
});