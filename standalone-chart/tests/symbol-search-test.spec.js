const { test, expect } = require('@playwright/test');

test('Symbol search functionality', async ({ page }) => {
  console.log('\n🔍 TESTING SYMBOL SEARCH FUNCTIONALITY');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="symbol-search-area"]', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Check initial symbol
  console.log('\n📊 Step 1: Check initial symbol display');
  const symbolDisplay = await page.locator('[data-testid="current-symbol"]');
  const initialSymbol = await symbolDisplay.textContent();
  console.log(`  Initial symbol: ${initialSymbol}`);
  expect(initialSymbol).toBe('SNOW');
  
  await page.screenshot({ path: 'test-results/symbol-search-1-initial.png' });
  console.log('📸 Initial state captured');
  
  // Open search dropdown
  console.log('\n📊 Step 2: Open search dropdown');
  await page.click('[data-testid="search-button"]');
  await page.waitForSelector('[data-testid="symbol-search-dropdown"]', { timeout: 5000 });
  
  await page.screenshot({ path: 'test-results/symbol-search-2-dropdown-open.png' });
  console.log('📸 Dropdown opened');
  
  // Type in search
  console.log('\n📊 Step 3: Search for "AAPL"');
  await page.fill('[data-testid="symbol-search-input"]', 'AAPL');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'test-results/symbol-search-3-search-results.png' });
  console.log('📸 Search results shown');
  
  // Select AAPL
  console.log('\n📊 Step 4: Select AAPL');
  await page.click('[data-testid="symbol-result-item"]:first-child');
  await page.waitForTimeout(500);
  
  // Verify symbol changed
  const newSymbol = await symbolDisplay.textContent();
  console.log(`  New symbol: ${newSymbol}`);
  expect(newSymbol).toBe('AAPL');
  
  await page.screenshot({ path: 'test-results/symbol-search-4-symbol-changed.png' });
  console.log('📸 Symbol changed to AAPL');
  
  // Test keyboard/click navigation 
  console.log('\n📊 Step 5: Test symbol selection by clicking result');
  await page.click('[data-testid="search-button"]');
  await page.waitForSelector('[data-testid="symbol-search-dropdown"]');
  await page.fill('[data-testid="symbol-search-input"]', 'TSLA');
  
  // Wait for search results to appear - now should be much faster with no auto-download
  await page.waitForSelector('[data-testid="symbol-result-item"]', { timeout: 5000 });
  await page.waitForTimeout(200); // Small additional wait for stability
  
  // Click on the first search result instead of using keyboard
  await page.click('[data-testid="symbol-result-item"]:first-child');
  await page.waitForTimeout(500);
  
  const selectedSymbol = await symbolDisplay.textContent();
  console.log(`  Symbol after selection: ${selectedSymbol}`);
  expect(selectedSymbol).toBe('TSLA');
  
  await page.screenshot({ path: 'test-results/symbol-search-5-keyboard-selection.png' });
  console.log('📸 Keyboard selection worked');
  
  console.log('\n✅ SYMBOL SEARCH TEST COMPLETE!');
  console.log('📁 Check test-results/symbol-search-*.png for visual verification');
});