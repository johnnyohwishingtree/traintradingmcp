const { test, expect } = require('@playwright/test');

test('Verify refresh button performs simplified reset without data deletion', async ({ page }) => {
  console.log('\n🔄 TESTING SIMPLIFIED REFRESH BUTTON BEHAVIOR');
  
  // Go to the application
  await page.goto('http://localhost:3000', { timeout: 30000 });
  
  // Wait for chart to load
  await page.waitForSelector('.chart-container', { timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('📊 Chart loaded, capturing initial state...');
  
  // Monitor console logs to detect symbol corruption
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    
    // Look for the old corruption pattern
    if (text.includes('_refresh')) {
      console.log(`⚠️ Detected _refresh in logs: ${text}`);
    }
    
    // Look for proper delete operation
    if (text.includes('Delete All Data for') || text.includes('deleteSymbolData')) {
      console.log(`✅ Proper delete operation detected: ${text}`);
    }
    
    // Look for refresh operation
    if (text.includes('🔄 Refreshing chart')) {
      console.log(`🔄 Refresh operation detected: ${text}`);
    }
  });
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/refresh-fix-1-initial.png' });
  
  console.log('\n📊 Step 1: Find and click refresh button');
  
  // Look for the refresh/reset button in the chart area
  // The reset button should be part of the ZoomButtons component
  let refreshButton = null;
  
  // Try multiple selectors for the refresh button
  const selectors = [
    'circle.react-financial-charts-enable-interaction.reset',
    '[title*="Reset"]',
    '[title*="Refresh"]',
    'svg g circle[r="10"]', // Generic zoom button circle
  ];
  
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        console.log(`  Found refresh button with selector: ${selector}`);
        refreshButton = element;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  
  if (!refreshButton) {
    // List all buttons for debugging
    const allButtons = await page.$$('button, circle[r="10"]');
    console.log(`Found ${allButtons.length} interactive elements`);
    
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      try {
        const element = allButtons[i];
        const tagName = await element.evaluate(el => el.tagName);
        const className = await element.evaluate(el => el.className);
        const title = await element.getAttribute('title');
        console.log(`  Element ${i}: ${tagName}, class="${className}", title="${title}"`);
      } catch (e) {
        // Skip this element
      }
    }
    
    throw new Error('Refresh button not found');
  }
  
  console.log('📊 Step 2: Click refresh button and monitor for corruption');
  
  // Click the refresh button
  await refreshButton.click({ force: true });
  console.log('  ✅ Refresh button clicked');
  
  // Wait for operations to complete
  await page.waitForTimeout(3000);
  
  // Take screenshot after refresh
  await page.screenshot({ path: 'test-results/refresh-fix-2-after-refresh.png' });
  
  console.log('\n📊 Step 3: Analyze results');
  
  // Check if any logs contain the old corruption pattern
  const corruptionLogs = logs.filter(log => log.includes('_refresh') && !log.includes('replace'));
  const deleteLogs = logs.filter(log => log.includes('Delete All Data for') || log.includes('Successfully deleted'));
  
  console.log(`  Corruption patterns found: ${corruptionLogs.length}`);
  console.log(`  Proper delete operations found: ${deleteLogs.length}`);
  
  if (corruptionLogs.length > 0) {
    console.log('❌ CORRUPTION DETECTED:');
    corruptionLogs.forEach(log => console.log(`  - ${log}`));
  }
  
  if (deleteLogs.length > 0) {
    console.log('✅ PROPER DELETE OPERATIONS:');
    deleteLogs.forEach(log => console.log(`  - ${log}`));
  }
  
  // The test passes if we see NO corruption and NO delete operations (simplified refresh)
  expect(corruptionLogs.length).toBe(0);
  expect(deleteLogs.length).toBe(0); // Refresh should no longer delete data
  
  // Verify we got the expected simplified refresh message
  const refreshLogs = logs.filter(log => log.includes('🔄 Refreshing chart (resetting state only)'));
  expect(refreshLogs.length).toBeGreaterThan(0);
  
  console.log('\n✅ SIMPLIFIED REFRESH BUTTON VERIFIED!');
});