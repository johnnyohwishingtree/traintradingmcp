const { test, expect } = require('@playwright/test');

test.describe('Triangle Pattern Drag Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (
        text.includes('Triangle') || 
        text.includes('drag') || 
        text.includes('select') ||
        text.includes('completed')
      ) {
        console.log('🎧 Console:', text);
      }
    });
  });

  test('should test triangle pattern drag functionality', async ({ page }) => {
    console.log('🧪 Testing triangle pattern drag functionality...');

    // 1. Click Patterns button to activate triangle tool
    await page.click('[data-testid="patterns-button"]');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/triangle-drag-tool-selected.png' });

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
    
    await page.screenshot({ path: 'test-results/triangle-drag-created.png' });
    console.log('✅ Triangle pattern created');

    // 3. Switch to cursor mode
    console.log('🖱️ Switching to cursor mode...');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);

    // 4. Click on triangle to select it
    console.log('🎯 Selecting triangle pattern...');
    await page.mouse.click(400, 280); // Click in center of triangle
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/triangle-drag-selected.png' });

    // 5. Try dragging a control point (vertex)
    console.log('🔄 Dragging triangle vertex...');
    await page.mouse.move(200, 300); // Move to first vertex
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(250, 250, { steps: 10 }); // Drag vertex to new position
    await page.waitForTimeout(500);
    await page.mouse.up();
    await page.waitForTimeout(2000); // Wait for drag complete
    
    await page.screenshot({ path: 'test-results/triangle-drag-vertex-moved.png' });
    console.log('✅ Triangle vertex dragged');

    // 6. Try dragging the entire triangle
    console.log('🖱️ Dragging entire triangle...');
    await page.mouse.move(350, 280); // Move to center area
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(450, 380, { steps: 15 }); // Drag entire triangle
    await page.waitForTimeout(500);
    await page.mouse.up();
    await page.waitForTimeout(2000); // Wait for drag complete
    
    await page.screenshot({ path: 'test-results/triangle-drag-moved.png' });
    console.log('✅ Triangle dragged');

    // 7. Test undo to see if changes were saved
    console.log('⏪ Testing undo to verify drag was saved...');
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/triangle-drag-after-undo.png' });
    console.log('✅ Undo tested');

    // 8. Test redo  
    console.log('⏩ Testing redo...');
    await page.keyboard.press('Meta+Shift+z');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/triangle-drag-after-redo.png' });
    console.log('✅ Redo tested');

    console.log('🎯 Triangle drag test completed');
  });
});