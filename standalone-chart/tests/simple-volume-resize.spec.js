const { test, expect } = require('@playwright/test');

test.describe('Simple Volume Resize Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.chart-container', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Enable Volume indicator
    await page.click('button[title="Indicators"]');
    await page.waitForSelector('.indicators-panel');
    
    const volumeIndicator = page.locator('.indicator-item:has-text("Volume")');
    const volumeEnabled = await volumeIndicator.evaluate(el => el.classList.contains('enabled'));
    if (!volumeEnabled) {
      await volumeIndicator.click();
    }
    
    await page.click('.indicators-panel .close-button');
    await page.waitForTimeout(1000);
  });

  test('volume resize handle should be visible and functional', async ({ page }) => {
    // Check that volume resize handle exists
    const resizeHandle = page.locator('.volume-resize-handle');
    await expect(resizeHandle).toBeVisible();
    
    // Verify cursor style
    const cursorStyle = await resizeHandle.evaluate(el => 
      window.getComputedStyle(el).cursor
    );
    expect(cursorStyle).toBe('ns-resize');
    
    // Get handle position
    const handleBounds = await resizeHandle.boundingBox();
    expect(handleBounds).not.toBeNull();
    
    // Test basic drag functionality
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('Volume resize')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Perform a drag operation
    await page.mouse.move(handleBounds.x + handleBounds.width / 2, handleBounds.y + handleBounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBounds.x + handleBounds.width / 2, handleBounds.y + handleBounds.height / 2 + 30);
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Check that resize events were logged
    const startLogs = consoleLogs.filter(log => log.includes('Volume resize started'));
    const endLogs = consoleLogs.filter(log => log.includes('Volume resize ended'));
    
    expect(startLogs.length).toBeGreaterThan(0);
    expect(endLogs.length).toBeGreaterThan(0);
    
    // Verify handle is still visible after resize
    await expect(resizeHandle).toBeVisible();
  });

  test('volume resize handle should move after resizing', async ({ page }) => {
    const resizeHandle = page.locator('.volume-resize-handle');
    await expect(resizeHandle).toBeVisible();
    
    // Get initial position
    const initialBounds = await resizeHandle.boundingBox();
    
    // Drag down to increase volume height
    await page.mouse.move(initialBounds.x + initialBounds.width / 2, initialBounds.y + initialBounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(initialBounds.x + initialBounds.width / 2, initialBounds.y + initialBounds.height / 2 + 50);
    await page.mouse.up();
    
    await page.waitForTimeout(1000);
    
    // Get new position
    const newBounds = await resizeHandle.boundingBox();
    
    // Handle should have moved down (y position increased)
    expect(newBounds.y).toBeGreaterThan(initialBounds.y);
    
    // Drag up to decrease volume height
    await page.mouse.move(newBounds.x + newBounds.width / 2, newBounds.y + newBounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(newBounds.x + newBounds.width / 2, newBounds.y + newBounds.height / 2 - 30);
    await page.mouse.up();
    
    await page.waitForTimeout(1000);
    
    // Get final position
    const finalBounds = await resizeHandle.boundingBox();
    
    // Handle should have moved up (y position decreased)
    expect(finalBounds.y).toBeLessThan(newBounds.y);
    
    // Handle should still be functional
    await expect(resizeHandle).toBeVisible();
    const finalCursor = await resizeHandle.evaluate(el => 
      window.getComputedStyle(el).cursor
    );
    expect(finalCursor).toBe('ns-resize');
  });
});