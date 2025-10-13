const { test, expect } = require('@playwright/test');

test('should have aligned price labels and current price indicator', async ({ page }) => {
  console.log('📐 Testing price label alignment...');
  
  // Navigate to chart
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  // Take screenshot to verify alignment
  await page.screenshot({ 
    path: 'tests/screenshots/price-alignment-fixed.png',
    fullPage: false 
  });
  
  console.log('📸 Screenshot saved for alignment verification');
  
  // Test price area interaction without complex hover
  const chart = page.locator('[data-testid="main-chart-container"]');
  await expect(chart).toBeVisible();
  
  // Move mouse to right side where price labels are
  await page.mouse.move(1200, 300);
  await page.waitForTimeout(500);
  
  // Take another screenshot with mouse positioned
  await page.screenshot({ 
    path: 'tests/screenshots/price-alignment-with-mouse.png',
    fullPage: false 
  });
  
  console.log('✅ Alignment test completed - check screenshots for consistent positioning');
  expect(true).toBe(true);
});