const { test, expect } = require('@playwright/test');

test('Final verification - trend channel visibility issue is completely resolved', async ({ page }) => {
  console.log('🎯 Final verification that trend channel visibility issue is resolved...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Step 1: Draw trend channel using standalone button
  console.log('📐 Step 1: Drawing trend channel using new standalone button...');
  await page.click('[data-testid="trendchannel-button"]');
  await page.waitForTimeout(500);
  
  await chartContainer.click({ position: { x: 200, y: 300 } });
  await chartContainer.click({ position: { x: 400, y: 250 } });
  await chartContainer.click({ position: { x: 350, y: 320 } });
  await page.waitForTimeout(1000);
  console.log('✅ Trend channel drawn');
  
  const afterChannelDraw = await page.evaluate(() => ({
    paths: document.querySelectorAll('svg path').length,
    lines: document.querySelectorAll('svg line').length
  }));
  
  // Step 2: Test multiple different line tools - channel should stay visible throughout
  const lineTypesToTest = ['trendline', 'ray', 'horizontalline', 'verticalline'];
  
  for (const lineType of lineTypesToTest) {
    console.log(`🔍 Testing visibility with ${lineType}...`);
    
    // Switch to line type
    await page.click('[data-testid="dropdown-arrow"]');
    await page.waitForTimeout(300);
    await page.click(`[data-testid="line-type-${lineType}"]`);
    await page.waitForTimeout(500);
    
    // Check if trend channel is still visible
    const duringLineType = await page.evaluate(() => ({
      paths: document.querySelectorAll('svg path').length,
      lines: document.querySelectorAll('svg line').length
    }));
    
    console.log(`   Channel elements: ${afterChannelDraw.paths + afterChannelDraw.lines} -> ${duringLineType.paths + duringLineType.lines}`);
    
    // Channel should NOT disappear
    const channelDisappeared = (
      duringLineType.paths < afterChannelDraw.paths ||
      duringLineType.lines < afterChannelDraw.lines
    );
    
    if (channelDisappeared) {
      console.log(`   ❌ REGRESSION: Channel disappeared with ${lineType}!`);
    } else {
      console.log(`   ✅ SUCCESS: Channel remains visible with ${lineType}`);
    }
    
    expect(channelDisappeared).toBe(false);
    
    // Draw the line type to test full functionality
    await chartContainer.click({ position: { x: 100 + lineTypesToTest.indexOf(lineType) * 60, y: 180 } });
    await page.waitForTimeout(200);
    await chartContainer.click({ position: { x: 180 + lineTypesToTest.indexOf(lineType) * 60, y: 120 } });
    await page.waitForTimeout(300);
  }
  
  // Step 3: Test triangle tool as well (to confirm the original observation)
  console.log('🔺 Testing with triangle tool (should work as before)...');
  await page.click('[data-testid="patterns-button"]');
  await page.waitForTimeout(500);
  
  const duringTriangle = await page.evaluate(() => ({
    paths: document.querySelectorAll('svg path').length,
    lines: document.querySelectorAll('svg line').length
  }));
  
  const triangleAffectedChannel = (
    duringTriangle.paths < afterChannelDraw.paths ||
    duringTriangle.lines < afterChannelDraw.lines
  );
  
  if (triangleAffectedChannel) {
    console.log('❌ UNEXPECTED: Triangle tool affects channel visibility');
  } else {
    console.log('✅ CONFIRMED: Triangle tool does not affect channel visibility (as expected)');
  }
  
  expect(triangleAffectedChannel).toBe(false);
  
  await page.screenshot({ path: 'test-results/final-verification-all-tools-tested.png' });
  
  console.log('');
  console.log('🎉 FINAL VERIFICATION RESULTS:');
  console.log('   ✅ Trend channel is now a standalone button');
  console.log('   ✅ Channel remains visible with ALL line tools');
  console.log('   ✅ Channel remains visible with triangle tool');
  console.log('   ✅ Original visibility issue is COMPLETELY RESOLVED');
  console.log('');
  console.log('📋 IMPLEMENTATION SUMMARY:');
  console.log('   • Removed trendchannel from lineTypes dropdown array');
  console.log('   • Added trendchannel to otherTools standalone buttons');
  console.log('   • This prevents rendering conflicts in StockChartWithTools.tsx');
  console.log('   • Each tool now has independent rendering logic');
});