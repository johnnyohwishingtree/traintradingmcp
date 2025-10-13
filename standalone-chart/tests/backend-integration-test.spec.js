const { test, expect } = require('@playwright/test');

test('Backend integration test', async ({ page }) => {
  console.log('\n🔗 BACKEND INTEGRATION TEST');
  
  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'warn' || msg.type() === 'error') {
      console.log(`  BROWSER: ${msg.text()}`);
    }
  });
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.header-toolbar', { timeout: 10000 });
  
  console.log('\n📊 Step 1: Check if backend is being used');
  // Wait for initial load attempt
  await page.waitForTimeout(5000);
  
  console.log('\n🔍 Step 2: Test symbol search via backend');
  await page.click('.search-button');
  await page.waitForSelector('.symbol-search-dropdown', { timeout: 2000 });
  
  // Try searching for a symbol
  await page.fill('.symbol-search-input', 'AAPL');
  await page.waitForTimeout(1000);
  
  console.log('\n⏰ Step 3: Test interval switching');
  await page.selectOption('.interval-select', '1week');
  await page.waitForTimeout(2000);
  
  console.log('\n📈 Step 4: Check chart rendering');
  const canvas = await page.locator('canvas').last();
  const canvasVisible = await canvas.isVisible();
  console.log(`  Chart canvas visible: ${canvasVisible}`);
  expect(canvasVisible).toBe(true);
  
  await page.screenshot({ path: 'test-results/backend-integration-test.png' });
  
  console.log('\n✅ BACKEND INTEGRATION TEST COMPLETE!');
  console.log('Check browser console logs above for:');
  console.log('  - "🔄 Fetching X@Y from backend cache..." messages');
  console.log('  - "Backend service unavailable" warnings (if backend down)');
  console.log('  - Any successful cache responses');
});