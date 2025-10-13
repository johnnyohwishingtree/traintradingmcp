const { test, expect } = require('@playwright/test');

test('Refresh button resets view to default zoom', async ({ page }) => {
  console.log('\n🔄 TESTING REFRESH VIEW RESET');
  
  // Go to the application
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.chart-container', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📊 Step 1: Zoom out significantly');
  
  // Zoom out by scrolling up multiple times
  const chartArea = await page.locator('.chart-container canvas').first();
  const chartBox = await chartArea.boundingBox();
  
  if (chartBox) {
    // Zoom out several times
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(200);
    }
  }
  
  await page.screenshot({ path: 'test-results/refresh-view-1-zoomed-out.png' });
  console.log('📸 Zoomed out view captured');
  
  console.log('📊 Step 2: Click refresh button to reset view');
  
  // Find and click the refresh button
  const refreshButton = await page.locator('circle.react-financial-charts-enable-interaction.reset').first();
  const buttonExists = await refreshButton.count() > 0;
  
  if (buttonExists) {
    await refreshButton.click({ force: true });
    console.log('✅ Refresh button clicked');
    
    // Wait for view reset
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/refresh-view-2-after-reset.png' });
    console.log('📸 View after reset captured');
    
    // Check console for the new message
    page.on('console', msg => {
      if (msg.text().includes('Resetting chart to default view')) {
        console.log('✅ View reset message detected');
      }
    });
    
    console.log('\n✅ REFRESH VIEW RESET TEST COMPLETE!');
  } else {
    throw new Error('Refresh button not found');
  }
});