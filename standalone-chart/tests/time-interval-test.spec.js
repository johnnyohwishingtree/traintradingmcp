const { test, expect } = require('@playwright/test');

test('Time interval dropdown functionality test', async ({ page }) => {
  console.log('\n⏰ TIME INTERVAL FUNCTIONALITY TEST');
  
  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'warn' || msg.type() === 'error') {
      console.log(`  BROWSER: ${msg.text()}`);
    }
  });
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.header-toolbar', { timeout: 10000 });
  await page.waitForTimeout(1000); // Reduced initial wait
  
  console.log('\n📊 Step 1: Check initial setup');
  const intervalSelect = await page.locator('[data-testid="interval-select"]');
  await expect(intervalSelect).toBeVisible();
  
  const initialInterval = await intervalSelect.inputValue();
  console.log(`  Initial interval: ${initialInterval}`);
  expect(initialInterval).toBe('1day');
  
  console.log('\n🔍 Step 2: Test daily interval change');
  await intervalSelect.selectOption('1week');
  await page.waitForTimeout(500); // Reduced wait
  
  const weeklyInterval = await intervalSelect.inputValue();
  console.log(`  Changed to: ${weeklyInterval}`);
  expect(weeklyInterval).toBe('1week');
  
  console.log('\n📈 Step 3: Test intraday intervals');
  // Test 5-minute interval
  await intervalSelect.selectOption('5min');
  await page.waitForTimeout(1000); // Reduced intraday wait
  
  const fiveMinInterval = await intervalSelect.inputValue();
  console.log(`  Changed to: ${fiveMinInterval}`);
  expect(fiveMinInterval).toBe('5min');
  
  console.log('\n⚡ Step 4: Test 1-minute interval (highest resolution)');
  await intervalSelect.selectOption('1min');
  await page.waitForTimeout(1000); // Reduced wait
  
  const oneMinInterval = await intervalSelect.inputValue();
  console.log(`  Changed to: ${oneMinInterval}`);
  expect(oneMinInterval).toBe('1min');
  
  console.log('\n📊 Step 5: Test monthly interval (longest timeframe)');
  await intervalSelect.selectOption('1month');
  await page.waitForTimeout(500); // Reduced timeout for faster test
  
  const monthlyInterval = await intervalSelect.inputValue();
  console.log(`  Changed to: ${monthlyInterval}`);
  expect(monthlyInterval).toBe('1month');
  
  console.log('\n🔄 Step 6: Test with symbol change');
  // Change symbol to see if interval persists
  await page.click('[data-testid="search-button"]');
  await page.waitForSelector('[data-testid="symbol-search-dropdown"]', { timeout: 2000 });
  await page.fill('[data-testid="symbol-search-input"]', 'IBM');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000); // Reduced wait for symbol change
  
  const intervalAfterSymbolChange = await intervalSelect.inputValue();
  console.log(`  Interval after symbol change: ${intervalAfterSymbolChange}`);
  expect(intervalAfterSymbolChange).toBe('1month'); // Should persist
  
  console.log('\n📊 Step 7: Verify chart is still displaying');
  const canvas = await page.locator('canvas').last();
  const canvasVisible = await canvas.isVisible();
  console.log(`  Chart canvas visible: ${canvasVisible}`);
  expect(canvasVisible).toBe(true);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/time-interval-functionality.png' });
  console.log('📸 Screenshot saved: test-results/time-interval-functionality.png');
  
  console.log('\n✅ TIME INTERVAL TEST COMPLETE!');
  console.log('Check browser console logs above for:');
  console.log('  - "⏰ Interval changed to: X" messages');
  console.log('  - "🔄 Fetching real data for SYMBOL @ INTERVAL" messages');
  console.log('  - Data loading confirmations for each interval');
  console.log('  - Different data volumes for different intervals');
});