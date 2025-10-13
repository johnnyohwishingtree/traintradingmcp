const { test, expect } = require('@playwright/test');

test('Visual Y-axis resize test with screenshots', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(5000); // Give extra time for chart to fully load
  
  // Take screenshot of initial state
  await page.screenshot({ 
    path: 'test-results/y-axis-before-drag.png', 
    fullPage: false,
    clip: { x: 0, y: 60, width: 1280, height: 600 } // Focus on chart area
  });
  
  const handle = page.locator('[data-testid="y-axis-resize-handle"]');
  await expect(handle).toBeVisible();
  
  // Get handle position
  const bbox = await handle.boundingBox();
  console.log('Handle position:', bbox);
  
  // Perform drag down (should add padding)
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;
  
  console.log('Starting drag from:', centerX, centerY);
  
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  
  // Drag down 150px to really increase padding
  const targetY = centerY + 150;
  await page.mouse.move(centerX, targetY);
  console.log('Dragged to:', centerX, targetY);
  
  await page.waitForTimeout(1000); // Wait for changes to apply
  
  // Take screenshot after drag
  await page.screenshot({ 
    path: 'test-results/y-axis-after-drag-down.png', 
    fullPage: false,
    clip: { x: 0, y: 60, width: 1280, height: 600 }
  });
  
  await page.mouse.up();
  await page.waitForTimeout(1000);
  
  // Now drag up to reduce padding
  await page.mouse.move(centerX, targetY);
  await page.mouse.down();
  
  // Drag up past original position
  const targetY2 = centerY - 100;
  await page.mouse.move(centerX, targetY2);
  console.log('Dragged up to:', centerX, targetY2);
  
  await page.waitForTimeout(1000);
  
  // Take screenshot after drag up
  await page.screenshot({ 
    path: 'test-results/y-axis-after-drag-up.png', 
    fullPage: false,
    clip: { x: 0, y: 60, width: 1280, height: 600 }
  });
  
  await page.mouse.up();
  
  console.log('Screenshots saved. Check test-results/ folder to compare:');
  console.log('- y-axis-before-drag.png (initial state)');
  console.log('- y-axis-after-drag-down.png (should show more padding/compressed Y-axis)');
  console.log('- y-axis-after-drag-up.png (should show less padding/expanded Y-axis)');
});