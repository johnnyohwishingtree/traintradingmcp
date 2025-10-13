const { test, expect } = require('@playwright/test');

test('Exact user workflow - draw trendChannel, draw trendLines, click trendChannel icon', async ({ page }) => {
  console.log('👤 Replicating exact user workflow described in the issue...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Step 1: Draw a trendChannel (exactly as user described)
  console.log('📐 Step 1: Draw a trendChannel...');
  await page.click('[data-testid="trendchannel-button"]');
  await page.waitForTimeout(500);
  
  await chartContainer.click({ position: { x: 200, y: 300 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 400, y: 250 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 350, y: 320 } });
  await page.waitForTimeout(1000);
  console.log('✅ Trend channel drawn');
  
  await page.screenshot({ path: 'test-results/user-workflow-1-trendchannel-drawn.png' });
  
  // Step 2: Draw some trendLines (exactly as user described)
  console.log('📐 Step 2: Draw some trendLines...');
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendline"]');
  await page.waitForTimeout(500);
  
  // Draw first trend line
  await chartContainer.click({ position: { x: 150, y: 280 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 300, y: 220 } });
  await page.waitForTimeout(500);
  
  // Draw second trend line
  await chartContainer.click({ position: { x: 250, y: 350 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 450, y: 280 } });
  await page.waitForTimeout(1000);
  console.log('✅ Trend lines drawn');
  
  await page.screenshot({ path: 'test-results/user-workflow-2-trendlines-drawn.png' });
  
  // Count elements before the critical action
  const beforeClickingChannel = await page.evaluate(() => {
    const lines = document.querySelectorAll('svg line');
    const paths = document.querySelectorAll('svg path');
    return {
      lines: lines.length,
      paths: paths.length,
      total: lines.length + paths.length,
      // Try to identify specific elements
      trendChannelElements: Array.from(paths).filter(path => 
        path.getAttribute('stroke') === '#9c27b0' // Channel color
      ).length,
      trendLineElements: Array.from(lines).filter(line => 
        line.getAttribute('stroke') === '#2196f3' // Trendline color
      ).length
    };
  });
  
  console.log('📊 Before clicking trendChannel icon:');
  console.log(`   Total elements: ${beforeClickingChannel.total}`);
  console.log(`   Lines: ${beforeClickingChannel.lines}, Paths: ${beforeClickingChannel.paths}`);
  console.log(`   Trend channel elements: ${beforeClickingChannel.trendChannelElements}`);
  console.log(`   Trend line elements: ${beforeClickingChannel.trendLineElements}`);
  
  // Step 3: Click back on the trendChannel icon (THE CRITICAL MOMENT)
  console.log('🎯 Step 3: CRITICAL - Click back on trendChannel icon...');
  await page.click('[data-testid="trendchannel-button"]');
  await page.waitForTimeout(1000); // Give time for any flickering/disappearing
  
  const duringChannelIconClick = await page.evaluate(() => {
    const lines = document.querySelectorAll('svg line');
    const paths = document.querySelectorAll('svg path');
    return {
      lines: lines.length,
      paths: paths.length,
      total: lines.length + paths.length,
      trendChannelElements: Array.from(paths).filter(path => 
        path.getAttribute('stroke') === '#9c27b0'
      ).length,
      trendLineElements: Array.from(lines).filter(line => 
        line.getAttribute('stroke') === '#2196f3'
      ).length
    };
  });
  
  console.log('📊 After clicking trendChannel icon:');
  console.log(`   Total elements: ${duringChannelIconClick.total}`);
  console.log(`   Lines: ${duringChannelIconClick.lines}, Paths: ${duringChannelIconClick.paths}`);
  console.log(`   Trend channel elements: ${duringChannelIconClick.trendChannelElements}`);
  console.log(`   Trend line elements: ${duringChannelIconClick.trendLineElements}`);
  
  await page.screenshot({ path: 'test-results/user-workflow-3-after-clicking-channel-icon.png' });
  
  // Check if trendLines temporarily disappeared (the original issue)
  const trendLinesDisappeared = duringChannelIconClick.trendLineElements < beforeClickingChannel.trendLineElements;
  const totalElementsDecreased = duringChannelIconClick.total < beforeClickingChannel.total;
  
  console.log('');
  console.log('🔍 ISSUE VERIFICATION:');
  if (trendLinesDisappeared) {
    console.log('❌ ISSUE REPRODUCED: Trend lines disappeared when clicking trendChannel icon!');
    console.log(`   Trend lines: ${beforeClickingChannel.trendLineElements} → ${duringChannelIconClick.trendLineElements}`);
  } else {
    console.log('✅ ISSUE FIXED: Trend lines remained visible when clicking trendChannel icon');
  }
  
  if (totalElementsDecreased) {
    console.log('❌ ISSUE REPRODUCED: Total elements decreased!');
    console.log(`   Total elements: ${beforeClickingChannel.total} → ${duringChannelIconClick.total}`);
  } else {
    console.log('✅ ISSUE FIXED: Total elements remained stable');
  }
  
  // Step 4: Test finishing drawing or switching tools (as user mentioned)
  console.log('🔄 Step 4: Testing tool switching to see if elements reappear...');
  
  // Switch to cursor tool
  await page.click('[data-testid="cursor-button"]');
  await page.waitForTimeout(500);
  
  const afterSwitchingToCursor = await page.evaluate(() => {
    const lines = document.querySelectorAll('svg line');
    const paths = document.querySelectorAll('svg path');
    return {
      lines: lines.length,
      paths: paths.length,
      total: lines.length + paths.length
    };
  });
  
  console.log(`📊 After switching to cursor: ${afterSwitchingToCursor.total} elements`);
  
  await page.screenshot({ path: 'test-results/user-workflow-4-after-cursor-switch.png' });
  
  // The test should pass - no temporary disappearing should occur
  expect(trendLinesDisappeared).toBe(false);
  expect(totalElementsDecreased).toBe(false);
  
  console.log('');
  console.log('🎉 USER WORKFLOW TEST RESULTS:');
  console.log('   ✅ Trend lines do NOT disappear when clicking trendChannel icon');
  console.log('   ✅ All drawn elements remain persistently visible');
  console.log('   ✅ No temporary disappearing behavior');
  console.log('   ✅ Original user issue is RESOLVED');
});