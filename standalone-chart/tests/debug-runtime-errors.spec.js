const { test, expect } = require('@playwright/test');

test('Debug runtime errors - check for JavaScript errors', async ({ page }) => {
  console.log('🔍 Debugging runtime errors...');
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ Page Error:', error.message);
  });
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000); // Give time for errors to surface
  
  // Check if main components are rendered
  const mainContainer = await page.locator('[data-testid="main-chart-container"]').count();
  const drawingToolbar = await page.locator('[data-testid="drawing-toolbar"]').count();
  
  console.log(`📊 Main container exists: ${mainContainer > 0}`);
  console.log(`📊 Drawing toolbar exists: ${drawingToolbar > 0}`);
  
  if (errors.length > 0) {
    console.log('');
    console.log(`❌ Found ${errors.length} errors:`);
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log('✅ No runtime errors detected');
  }
  
  await page.screenshot({ path: 'test-results/debug-runtime-state.png' });
});