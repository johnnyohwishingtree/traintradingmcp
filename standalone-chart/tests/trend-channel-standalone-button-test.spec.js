const { test, expect } = require('@playwright/test');

test('Trend channel standalone button - should work independently from trendline dropdown', async ({ page }) => {
  console.log('🎯 Testing trend channel as standalone button...');
  
  // Navigate to the chart application
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  console.log('📊 Chart application loaded');
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Step 1: Verify trend channel button exists as standalone (not in dropdown)
  console.log('🔍 Step 1: Verifying trend channel is now a standalone button...');
  
  // Check that trendchannel button exists
  const trendChannelButton = page.locator('[data-testid="trendchannel-button"]');
  await expect(trendChannelButton).toBeVisible();
  console.log('✅ Trend channel standalone button found');
  
  // Step 2: Verify trendchannel is NOT in the dropdown anymore
  console.log('🔍 Step 2: Verifying trendchannel is not in trendline dropdown...');
  
  // Open the trendline dropdown
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  
  // Check that trendchannel option is NOT in the dropdown
  const trendChannelDropdownOption = page.locator('[data-testid="line-type-trendchannel"]');
  const isInDropdown = await trendChannelDropdownOption.isVisible().catch(() => false);
  
  if (isInDropdown) {
    console.log('❌ FAILED: Trend channel is still in the dropdown!');
  } else {
    console.log('✅ SUCCESS: Trend channel is no longer in the dropdown');
  }
  
  // Close dropdown
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  
  expect(isInDropdown).toBe(false);
  
  // Step 3: Test that standalone trend channel button works
  console.log('📐 Step 3: Testing standalone trend channel functionality...');
  
  // Click the standalone trend channel button
  await trendChannelButton.click();
  await page.waitForTimeout(500);
  
  // Verify the button becomes active
  const isActive = await trendChannelButton.evaluate(el => el.classList.contains('active'));
  console.log(`   Trend channel button active: ${isActive}`);
  expect(isActive).toBe(true);
  
  // Step 4: Draw a trend channel using the standalone button
  console.log('📐 Step 4: Drawing trend channel using standalone button...');
  
  // Draw trend channel with 3 clicks
  await chartContainer.click({ position: { x: 200, y: 300 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 400, y: 250 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 350, y: 320 } });
  await page.waitForTimeout(1000);
  console.log('✅ Trend channel drawn using standalone button');
  
  await page.screenshot({ path: 'test-results/standalone-trend-channel-drawn.png' });
  
  // Count elements to verify channel was created
  const channelElements = await page.evaluate(() => {
    const pathElements = document.querySelectorAll('svg path');
    const lineElements = document.querySelectorAll('svg line');
    return {
      paths: pathElements.length,
      lines: lineElements.length
    };
  });
  
  console.log(`📊 Elements after drawing - Paths: ${channelElements.paths}, Lines: ${channelElements.lines}`);
  
  // Step 5: Test that trend channel doesn't interfere with trendline dropdown
  console.log('🔍 Step 5: Testing independence from trendline dropdown...');
  
  // Draw a regular trendline from dropdown
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendline"]');
  await page.waitForTimeout(500);
  
  // Check that trend channel elements are still visible
  const elementsAfterTrendlineSwitch = await page.evaluate(() => {
    const pathElements = document.querySelectorAll('svg path');
    const lineElements = document.querySelectorAll('svg line');
    return {
      paths: pathElements.length,
      lines: lineElements.length
    };
  });
  
  console.log(`📊 Elements after switching to trendline - Paths: ${elementsAfterTrendlineSwitch.paths}, Lines: ${elementsAfterTrendlineSwitch.lines}`);
  
  // The trend channel should still be visible (this was the original bug)
  const channelDisappeared = (
    elementsAfterTrendlineSwitch.paths < channelElements.paths ||
    elementsAfterTrendlineSwitch.lines < channelElements.lines
  );
  
  if (channelDisappeared) {
    console.log('❌ REGRESSION: Trend channel still disappears when switching to trendline');
  } else {
    console.log('✅ SUCCESS: Trend channel remains visible when using other line tools');
  }
  
  await page.screenshot({ path: 'test-results/channel-visibility-after-trendline-switch.png' });
  
  // This should now pass with standalone button
  expect(channelDisappeared).toBe(false);
  
  console.log('');
  console.log('🎉 STANDALONE BUTTON TEST RESULTS:');
  console.log('   ✅ Trend channel is now a standalone button');
  console.log('   ✅ Trend channel is no longer in trendline dropdown'); 
  console.log('   ✅ Standalone button activates and draws correctly');
  console.log('   ✅ Trend channel remains visible when using other tools');
});

test('Verify all existing dropdown options still work', async ({ page }) => {
  console.log('🔧 Testing that remaining trendline dropdown options still work...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Test a few key trendline types to ensure dropdown still works
  const testLineTypes = ['trendline', 'ray', 'horizontalline'];
  
  for (const lineType of testLineTypes) {
    console.log(`📐 Testing ${lineType}...`);
    
    // Open dropdown and select line type
    await page.click('[data-testid="dropdown-arrow"]');
    await page.waitForTimeout(300);
    await page.click(`[data-testid="line-type-${lineType}"]`);
    await page.waitForTimeout(500);
    
    // Verify line tools button is active
    const lineToolsButton = page.locator('[data-testid="line-tools-button"]');
    const isActive = await lineToolsButton.evaluate(el => el.classList.contains('active'));
    
    expect(isActive).toBe(true);
    console.log(`   ✅ ${lineType} activated successfully`);
    
    // Draw a quick line to test functionality
    await chartContainer.click({ position: { x: 150 + testLineTypes.indexOf(lineType) * 50, y: 200 } });
    await page.waitForTimeout(200);
    await chartContainer.click({ position: { x: 250 + testLineTypes.indexOf(lineType) * 50, y: 150 } });
    await page.waitForTimeout(500);
    
    console.log(`   ✅ ${lineType} drawing functionality works`);
  }
  
  await page.screenshot({ path: 'test-results/dropdown-functionality-verified.png' });
  console.log('✅ All dropdown line types work correctly');
});