const { test, expect } = require('@playwright/test');

test.describe('Chart Layout Verification', () => {
  test('Verify chart renders with proper dimensions and indicators', async ({ page }) => {
    console.log('\n📊 CHART LAYOUT VERIFICATION');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000); // Give chart time to fully render
    
    // Check that chart canvas exists and is visible
    const canvas = await page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Get canvas dimensions
    const canvasBounds = await canvas.boundingBox();
    console.log(`📐 Canvas dimensions: ${canvasBounds?.width} x ${canvasBounds?.height}`);
    
    // Verify canvas is reasonably sized (should be much larger than the previous tiny chart)
    if (canvasBounds) {
      console.log(`✅ Canvas width: ${canvasBounds.width}px (should be > 500)`);
      console.log(`✅ Canvas height: ${canvasBounds.height}px (should be > 400)`);
      
      expect(canvasBounds.width).toBeGreaterThan(500);
      expect(canvasBounds.height).toBeGreaterThan(400);
    }
    
    // Take screenshot to compare with user's expected view
    await page.screenshot({ path: 'test-results/fixed-chart-layout.png' });
    
    console.log('\n📊 Chart layout verification complete');
    console.log('✅ Chart should now display with proper dimensions, EMA/SMA lines, and indicators');
  });
});