const { test, expect } = require('@playwright/test');

test('Debug Y-axis drag after removing duplicate component', async ({ page }) => {
  console.log('🔍 Debugging Y-axis drag with fixed component...');
  
  // Capture all console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('Y-Axis') || text.includes('padding') || text.includes('Extents')) {
      console.log('📋 Console:', text);
    }
  });
  
  // Navigate to the chart application
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('✅ Chart loaded');
  
  // Find the Y-axis drag area (should now be the correct one)
  const yAxisHandle = page.locator('[data-testid="y-axis-resize-handle"]');
  await expect(yAxisHandle).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Found Y-axis handle');
  
  // Get its position and drag it significantly
  const handleBox = await yAxisHandle.boundingBox();
  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;
  const endY = startY + 800; // Very large drag
  
  console.log(`📏 Dragging from (${startX}, ${startY}) to (${startX}, ${endY})`);
  
  // Perform drag
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(startX, endY, { steps: 15 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  
  // Wait for updates
  await page.waitForTimeout(2000);
  
  console.log('📋 All Y-Axis related logs:');
  const yAxisLogs = logs.filter(log => 
    log.includes('Y-Axis') || 
    log.includes('padding') || 
    log.includes('Extents') ||
    log.includes('🎛️') ||
    log.includes('📊')
  );
  yAxisLogs.forEach(log => console.log('   ', log));
  
  if (yAxisLogs.length === 0) {
    console.log('❌ No Y-axis logs found - drag may not be working');
  } else {
    console.log(`✅ Found ${yAxisLogs.length} Y-axis related logs`);
  }
  
  // Check Y-axis values after drag
  const allText = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('text, tspan'));
    return elements
      .map(el => el.textContent?.trim())
      .filter(text => text && /^[\d,]+\.?\d*$/.test(text)) // Only numeric values
      .map(text => parseFloat(text.replace(/,/g, '')))
      .filter(num => !isNaN(num) && num > 0)
      .sort((a, b) => b - a); // Sort descending
  });
  
  console.log('📊 Y-axis values found:', allText.slice(0, 10)); // Show top 10 values
  
  // Check for values above 500 (easier target)
  const valuesAbove500 = allText.filter(val => val > 500);
  if (valuesAbove500.length > 0) {
    console.log(`✅ SUCCESS: Found values above 500: ${valuesAbove500}`);
  } else {
    console.log(`❌ No values above 500. Highest: ${Math.max(...allText)}`);
  }
  
  // Take screenshot
  await page.screenshot({ 
    path: 'test-results/debug-y-axis-drag-fixed.png',
    fullPage: true 
  });
  
  expect(true).toBe(true);
});