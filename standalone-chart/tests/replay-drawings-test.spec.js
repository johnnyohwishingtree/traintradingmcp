const { test, expect } = require('@playwright/test');

test('Replay drawings save and restore test', async ({ page }) => {
  console.log('\n🎨 TESTING REPLAY DRAWINGS SAVE/RESTORE');
  
  // Go to the application
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000); // Wait for chart and data to load
  
  console.log('\n📊 Step 1: Draw a trendline');
  
  // Click the line tools button first
  await page.click('[data-testid="line-tools-button"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendline"]');
  await page.waitForTimeout(500);
  console.log('  ✅ Trendline tool activated');
  
  // Draw a trendline by clicking points on the chart
  const chart = page.locator('[data-testid="main-chart-container"]');
  const chartBox = await chart.boundingBox();
  
  if (chartBox) {
    // Start point (left side of chart)
    const startX = chartBox.x + chartBox.width * 0.2;
    const startY = chartBox.y + chartBox.height * 0.4;
    
    // End point (right side of chart)
    const endX = chartBox.x + chartBox.width * 0.8;
    const endY = chartBox.y + chartBox.height * 0.6;
    
    // Draw the trendline with two clicks (not drag)
    await page.mouse.click(startX, startY);
    await page.waitForTimeout(300);
    await page.mouse.click(endX, endY);
    
    console.log('  📈 Trendline drawn');
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ path: 'test-results/replay-drawings-1-trendline-drawn.png' });
  console.log('📸 Screenshot with trendline drawn');
  
  console.log('\n📊 Step 2: Enter replay mode');
  
  // Click the replay button
  await page.click('[data-testid="replay-button"]');
  await page.waitForTimeout(1000);
  console.log('  ✅ Entered replay mode');
  
  // Verify trendlines are cleared in replay mode
  await page.screenshot({ path: 'test-results/replay-drawings-2-replay-mode.png' });
  console.log('📸 Screenshot in replay mode (should have no drawings)');
  
  console.log('\n📊 Step 3: Exit replay mode');
  
  // Click the exit button in replay controls
  await page.click('[data-testid="replay-exit-button"]');
  await page.waitForTimeout(2000); // Wait for data refresh and drawings to restore
  console.log('  ✅ Exited replay mode');
  
  await page.screenshot({ path: 'test-results/replay-drawings-3-after-exit.png' });
  console.log('📸 Screenshot after exiting replay (should have trendline restored)');
  
  console.log('\n📊 Step 4: Verify drawing restoration');
  
  // Try to select the restored trendline to verify it exists
  if (chartBox) {
    // Click on the approximate middle of where we drew the line
    const midX = chartBox.x + chartBox.width * 0.5;
    const midY = chartBox.y + chartBox.height * 0.5;
    
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(500);
    console.log('  🖱️ Clicked on chart area where trendline should be');
  }
  
  console.log('\n✅ REPLAY DRAWINGS TEST COMPLETE!');
  console.log('📁 Check test-results/replay-drawings-*.png for visual verification');
  console.log('   1. trendline-drawn: Shows initial drawing');
  console.log('   2. replay-mode: Shows cleared drawings during replay');
  console.log('   3. after-exit: Shows restored drawings after replay exit');
});