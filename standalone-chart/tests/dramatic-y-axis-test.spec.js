const { test, expect } = require('@playwright/test');

test('Dramatic Y-axis resize test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(5000);
  
  // Take initial screenshot
  await page.screenshot({ 
    path: 'test-results/dramatic-before.png', 
    fullPage: false,
    clip: { x: 0, y: 60, width: 1280, height: 600 }
  });
  
  const handle = page.locator('[data-testid="y-axis-resize-handle"]');
  await expect(handle).toBeVisible();
  
  const bbox = await handle.boundingBox();
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;
  
  console.log('Testing dramatic Y-axis scaling...');
  
  // Test VERY small drag first - should have big effect now
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  
  // Small drag down - should create dramatic padding now
  await page.mouse.move(centerX, centerY + 50);
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'test-results/dramatic-small-drag.png', 
    fullPage: false,
    clip: { x: 0, y: 60, width: 1280, height: 600 }
  });
  
  // Larger drag down
  await page.mouse.move(centerX, centerY + 100);
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'test-results/dramatic-large-drag.png', 
    fullPage: false,
    clip: { x: 0, y: 60, width: 1280, height: 600 }
  });
  
  await page.mouse.up();
  
  // Now test drag UP to reduce padding dramatically
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  
  // Drag way up to minimize padding
  await page.mouse.move(centerX, centerY - 80);
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'test-results/dramatic-drag-up.png', 
    fullPage: false,
    clip: { x: 0, y: 60, width: 1280, height: 600 }
  });
  
  await page.mouse.up();
  
  console.log('Screenshots saved - check for dramatic differences:');
  console.log('- dramatic-before.png');
  console.log('- dramatic-small-drag.png (should show significant padding increase)');
  console.log('- dramatic-large-drag.png (should show even more padding)');
  console.log('- dramatic-drag-up.png (should show minimal padding, chart fills space)');
});