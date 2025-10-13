const { test, expect } = require('@playwright/test');

test('Trend lines should remain visible when trend channel tool is activated', async ({ page }) => {
  console.log('🎯 Testing that trend lines remain visible when trend channel tool is activated...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Step 1: Draw some trend lines first
  console.log('📐 Step 1: Drawing trend lines...');
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendline"]');
  await page.waitForTimeout(500);
  
  // Draw first trend line
  await chartContainer.click({ position: { x: 150, y: 250 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 250, y: 200 } });
  await page.waitForTimeout(500);
  
  // Draw second trend line
  await chartContainer.click({ position: { x: 300, y: 280 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 400, y: 230 } });
  await page.waitForTimeout(1000);
  
  console.log('✅ Trend lines drawn');
  
  // Count trend line elements after drawing
  const afterTrendLinesDrawn = await page.evaluate(() => {
    const allLines = document.querySelectorAll('svg line');
    const allPaths = document.querySelectorAll('svg path');
    return {
      lines: allLines.length,
      paths: allPaths.length,
      total: allLines.length + allPaths.length
    };
  });
  
  console.log(`📊 After drawing trend lines - Lines: ${afterTrendLinesDrawn.lines}, Paths: ${afterTrendLinesDrawn.paths}`);
  
  await page.screenshot({ path: 'test-results/trend-lines-drawn.png' });
  
  // Step 2: Draw a trend channel
  console.log('📐 Step 2: Drawing trend channel...');
  await page.click('[data-testid="trendchannel-button"]');
  await page.waitForTimeout(500);
  
  // Draw trend channel
  await chartContainer.click({ position: { x: 200, y: 320 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 350, y: 270 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 320, y: 340 } });
  await page.waitForTimeout(1000);
  
  console.log('✅ Trend channel drawn');
  
  const afterChannelDrawn = await page.evaluate(() => {
    const allLines = document.querySelectorAll('svg line');
    const allPaths = document.querySelectorAll('svg path');
    return {
      lines: allLines.length,
      paths: allPaths.length,
      total: allLines.length + allPaths.length
    };
  });
  
  console.log(`📊 After drawing channel - Lines: ${afterChannelDrawn.lines}, Paths: ${afterChannelDrawn.paths}`);
  
  await page.screenshot({ path: 'test-results/trend-lines-and-channel-drawn.png' });
  
  // Step 3: THE CRITICAL TEST - Click trend channel button to activate tool
  console.log('🔍 Step 3: CRITICAL TEST - Activating trend channel tool...');
  await page.click('[data-testid="trendchannel-button"]');
  await page.waitForTimeout(500);
  
  // Check if trend lines are still visible
  const duringChannelTool = await page.evaluate(() => {
    const allLines = document.querySelectorAll('svg line');
    const allPaths = document.querySelectorAll('svg path');
    return {
      lines: allLines.length,
      paths: allPaths.length,
      total: allLines.length + allPaths.length
    };
  });
  
  console.log(`📊 During channel tool active - Lines: ${duringChannelTool.lines}, Paths: ${duringChannelTool.paths}`);
  
  await page.screenshot({ path: 'test-results/trend-channel-tool-activated.png' });
  
  // Step 4: Test switching back to trend line tool
  console.log('🔍 Step 4: Switching back to trend line tool...');
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendline"]');
  await page.waitForTimeout(500);
  
  const backToTrendLine = await page.evaluate(() => {
    const allLines = document.querySelectorAll('svg line');
    const allPaths = document.querySelectorAll('svg path');
    return {
      lines: allLines.length,
      paths: allPaths.length,
      total: allLines.length + allPaths.length
    };
  });
  
  console.log(`📊 Back to trend line tool - Lines: ${backToTrendLine.lines}, Paths: ${backToTrendLine.paths}`);
  
  await page.screenshot({ path: 'test-results/back-to-trendline-tool.png' });
  
  // VERIFICATION: Check that trend lines never disappeared
  console.log('');
  console.log('🔍 VISIBILITY VERIFICATION:');
  console.log(`   After drawing trend lines: ${afterTrendLinesDrawn.total} elements`);
  console.log(`   After drawing channel: ${afterChannelDrawn.total} elements`);
  console.log(`   During channel tool active: ${duringChannelTool.total} elements`);
  console.log(`   Back to trend line tool: ${backToTrendLine.total} elements`);
  
  // The key test: trend lines should NOT disappear when channel tool is activated
  const trendLinesDisappearedDuringChannelTool = duringChannelTool.total < afterChannelDrawn.total;
  const trendChannelDisappearedDuringTrendLineTool = backToTrendLine.total < duringChannelTool.total;
  
  if (trendLinesDisappearedDuringChannelTool) {
    console.log('❌ BUG DETECTED: Trend lines disappeared when channel tool was activated!');
    console.log(`   Elements dropped from ${afterChannelDrawn.total} to ${duringChannelTool.total}`);
  } else {
    console.log('✅ SUCCESS: Trend lines remained visible when channel tool was activated');
  }
  
  if (trendChannelDisappearedDuringTrendLineTool) {
    console.log('❌ BUG DETECTED: Trend channel disappeared when trendline tool was activated!');
    console.log(`   Elements dropped from ${duringChannelTool.total} to ${backToTrendLine.total}`);
  } else {
    console.log('✅ SUCCESS: Trend channel remained visible when trendline tool was activated');
  }
  
  // Both should pass now with the persistent standalone components
  expect(trendLinesDisappearedDuringChannelTool).toBe(false);
  expect(trendChannelDisappearedDuringTrendLineTool).toBe(false);
  
  console.log('');
  console.log('🎉 PERSISTENT VISIBILITY TEST RESULTS:');
  console.log('   ✅ Trend lines remain visible when trend channel tool is active');
  console.log('   ✅ Trend channels remain visible when trend line tool is active');
  console.log('   ✅ All drawing tools now have independent, persistent displays');
});

test('Verify all combinations of tool switching maintain visibility', async ({ page }) => {
  console.log('🔄 Testing all tool switching combinations...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Draw one of each type
  console.log('📐 Drawing one of each type...');
  
  // 1. Draw trend line
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendline"]');
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 150, y: 250 } });
  await chartContainer.click({ position: { x: 250, y: 200 } });
  await page.waitForTimeout(500);
  
  // 2. Draw trend channel
  await page.click('[data-testid="trendchannel-button"]');
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 200, y: 320 } });
  await chartContainer.click({ position: { x: 350, y: 270 } });
  await chartContainer.click({ position: { x: 320, y: 340 } });
  await page.waitForTimeout(500);
  
  // 3. Draw fibonacci
  await page.click('[data-testid="fibonacci-button"]');
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 300, y: 300 } });
  await chartContainer.click({ position: { x: 450, y: 200 } });
  await page.waitForTimeout(500);
  
  // 4. Draw triangle
  await page.click('[data-testid="patterns-button"]');
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 100, y: 180 } });
  await chartContainer.click({ position: { x: 200, y: 180 } });
  await chartContainer.click({ position: { x: 150, y: 120 } });
  await page.waitForTimeout(1000);
  
  console.log('✅ All drawing types created');
  
  const allDrawn = await page.evaluate(() => {
    return {
      lines: document.querySelectorAll('svg line').length,
      paths: document.querySelectorAll('svg path').length
    };
  });
  
  console.log(`📊 All drawn - Lines: ${allDrawn.lines}, Paths: ${allDrawn.paths}`);
  
  // Test switching between each tool and verify nothing disappears
  const toolsToTest = [
    { name: 'cursor', testId: 'cursor-button', action: () => page.click('[data-testid="cursor-button"]') },
    { name: 'trendline', testId: 'line-type-trendline', action: async () => {
      await page.click('[data-testid="dropdown-arrow"]');
      await page.waitForTimeout(200);
      await page.click('[data-testid="line-type-trendline"]');
    }},
    { name: 'trendchannel', testId: 'trendchannel-button', action: () => page.click('[data-testid="trendchannel-button"]') },
    { name: 'fibonacci', testId: 'fibonacci-button', action: () => page.click('[data-testid="fibonacci-button"]') },
    { name: 'triangle', testId: 'patterns-button', action: () => page.click('[data-testid="patterns-button"]') },
  ];
  
  let allTestsPassed = true;
  
  for (const tool of toolsToTest) {
    console.log(`🔄 Testing switch to ${tool.name}...`);
    
    await tool.action();
    await page.waitForTimeout(500);
    
    const afterSwitch = await page.evaluate(() => {
      return {
        lines: document.querySelectorAll('svg line').length,
        paths: document.querySelectorAll('svg path').length
      };
    });
    
    const elementsLost = (afterSwitch.lines + afterSwitch.paths) < (allDrawn.lines + allDrawn.paths);
    
    if (elementsLost) {
      console.log(`   ❌ FAIL: Elements disappeared when switching to ${tool.name}`);
      console.log(`   Before: ${allDrawn.lines + allDrawn.paths}, After: ${afterSwitch.lines + afterSwitch.paths}`);
      allTestsPassed = false;
    } else {
      console.log(`   ✅ PASS: All elements remain visible with ${tool.name}`);
    }
  }
  
  expect(allTestsPassed).toBe(true);
  
  await page.screenshot({ path: 'test-results/all-tools-visibility-test.png' });
  console.log('✅ All tool switching combinations maintain visibility');
});