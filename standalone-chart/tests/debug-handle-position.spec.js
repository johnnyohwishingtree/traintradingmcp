const { test, expect } = require('@playwright/test');

test.describe('Debug Handle Position', () => {
  test('Check handle position and container structure', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Get the main chart container info
    const chartContainer = page.locator('[data-testid="main-chart-container"]');
    const chartBbox = await chartContainer.boundingBox();
    console.log('Chart container bbox:', chartBbox);
    
    // Get the handle info
    const handle = page.locator('[data-testid="y-axis-resize-handle"]');
    await expect(handle).toBeVisible();
    
    const handleBbox = await handle.boundingBox();
    console.log('Handle bbox:', handleBbox);
    
    // Get window dimensions
    const windowWidth = await page.evaluate(() => window.innerWidth);
    const windowHeight = await page.evaluate(() => window.innerHeight);
    console.log('Window dimensions:', { width: windowWidth, height: windowHeight });
    
    // Check if handle is actually visible in the viewport
    const isInViewport = handleBbox.x >= 0 && 
                        handleBbox.x + handleBbox.width <= windowWidth &&
                        handleBbox.y >= 0 && 
                        handleBbox.y + handleBbox.height <= windowHeight;
    
    console.log('Handle is in viewport:', isInViewport);
    
    // Take screenshot to see what's happening
    await page.screenshot({ path: 'debug-handle-position.png', fullPage: true });
  });
});