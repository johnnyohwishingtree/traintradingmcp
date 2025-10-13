const { test, expect } = require('@playwright/test');

test('Manual Y-axis drag test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.text().includes('Y-Axis') || msg.text().includes('Candle Extents') || msg.text().includes('App:')) {
      console.log('BROWSER:', msg.text());
      consoleMessages.push(msg.text());
    }
  });
  
  const handle = page.locator('[data-testid="y-axis-resize-handle"]');
  await expect(handle).toBeVisible();
  
  console.log('Starting drag test...');
  
  const bbox = await handle.boundingBox();
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;
  
  // Perform a drag down (should add padding/constrict Y-axis)
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  console.log('Mouse down at:', centerX, centerY);
  
  await page.mouse.move(centerX, centerY + 100); // Drag down 100px
  console.log('Dragged to:', centerX, centerY + 100);
  
  await page.waitForTimeout(500); // Give time for updates
  await page.mouse.up();
  
  await page.waitForTimeout(1000); // Wait for any async updates
  
  console.log('Collected', consoleMessages.length, 'console messages');
  consoleMessages.forEach((msg, i) => console.log(`${i + 1}:`, msg));
  
  // At minimum we should see drag messages and state changes
  expect(consoleMessages.length).toBeGreaterThan(0);
});