const { test, expect } = require('@playwright/test');

test('Trend channel drag - verify NO additional trendline element in DOM', async ({ page }) => {
  console.log('🎯 Testing trend channel drag and verifying DOM for no extra trendline elements...');
  
  // Navigate to the chart application
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  console.log('📊 Chart application loaded');
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Step 1: Count initial trendline-related elements in the DOM
  console.log('📊 Step 1: Counting initial elements in DOM...');
  
  // Count initial line elements (before drawing anything)
  const initialLineElements = await page.evaluate(() => {
    // Count SVG line elements that could be trendlines
    const svgLines = document.querySelectorAll('svg line');
    const pathElements = document.querySelectorAll('svg path');
    const circleElements = document.querySelectorAll('svg circle');
    
    return {
      lines: svgLines.length,
      paths: pathElements.length,
      circles: circleElements.length,
      total: svgLines.length + pathElements.length
    };
  });
  
  console.log('📈 Initial DOM state:');
  console.log(`   - Line elements: ${initialLineElements.lines}`);
  console.log(`   - Path elements: ${initialLineElements.paths}`);
  console.log(`   - Circle elements: ${initialLineElements.circles}`);
  
  // Step 2: Select and activate Trend Channel tool
  console.log('🔧 Step 2: Selecting Trend Channel tool...');
  
  // Click the dropdown arrow to open menu
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(500);
  
  // Select Trend Channel from the dropdown
  await page.click('[data-testid="line-type-trendchannel"]');
  await page.waitForTimeout(500);
  console.log('✅ Trend Channel tool selected');
  
  // Step 3: Draw a trend channel
  console.log('📐 Step 3: Drawing trend channel...');
  
  // Draw trend channel with 3 clicks
  await chartContainer.click({ position: { x: 200, y: 300 } });
  console.log('   Click 1: Start point');
  await page.waitForTimeout(300);
  
  await chartContainer.click({ position: { x: 400, y: 250 } });
  console.log('   Click 2: End point');
  await page.waitForTimeout(300);
  
  await chartContainer.click({ position: { x: 350, y: 320 } });
  console.log('   Click 3: Width point');
  await page.waitForTimeout(1000);
  
  console.log('✅ Trend channel drawn');
  
  // Step 4: Count elements after drawing trend channel
  console.log('📊 Step 4: Counting elements after drawing trend channel...');
  
  const afterChannelElements = await page.evaluate(() => {
    const svgLines = document.querySelectorAll('svg line');
    const pathElements = document.querySelectorAll('svg path');
    const circleElements = document.querySelectorAll('svg circle');
    
    // Also look for specific trend-related classes
    const trendRelated = document.querySelectorAll('[class*="trend"], [class*="channel"], [class*="line"]');
    
    return {
      lines: svgLines.length,
      paths: pathElements.length,
      circles: circleElements.length,
      trendRelated: trendRelated.length,
      total: svgLines.length + pathElements.length
    };
  });
  
  console.log('📈 After drawing trend channel:');
  console.log(`   - Line elements: ${afterChannelElements.lines} (was ${initialLineElements.lines})`);
  console.log(`   - Path elements: ${afterChannelElements.paths} (was ${initialLineElements.paths})`);
  console.log(`   - Circle elements: ${afterChannelElements.circles} (was ${initialLineElements.circles})`);
  console.log(`   - Trend-related elements: ${afterChannelElements.trendRelated}`);
  
  // Calculate expected increases (trend channel should add 2 lines + control points)
  const linesAddedByChannel = afterChannelElements.lines - initialLineElements.lines;
  console.log(`   📊 Lines added by trend channel: ${linesAddedByChannel}`);
  
  // Step 5: Switch to cursor mode
  console.log('🖱️ Step 5: Switching to cursor mode...');
  await page.click('[data-testid="cursor-button"]');
  await page.waitForTimeout(500);
  
  // Step 6: Select the trend channel
  console.log('🎯 Step 6: Selecting the trend channel...');
  await chartContainer.click({ position: { x: 300, y: 285 } }); // Click in the middle
  await page.waitForTimeout(500);
  
  // Step 7: Drag the trend channel (THIS IS WHERE THE BUG WOULD OCCUR)
  console.log('🔄 Step 7: Dragging trend channel (critical test moment)...');
  
  await chartContainer.click({ position: { x: 300, y: 285 } });
  await page.mouse.down();
  await page.mouse.move(350, 260, { steps: 5 });
  await page.mouse.up();
  console.log('✅ Trend channel dragged');
  await page.waitForTimeout(1000);
  
  // Step 8: Count elements after dragging - THIS IS THE KEY VERIFICATION
  console.log('🔍 Step 8: CRITICAL - Counting elements after drag...');
  
  const afterDragElements = await page.evaluate(() => {
    const svgLines = document.querySelectorAll('svg line');
    const pathElements = document.querySelectorAll('svg path');
    const circleElements = document.querySelectorAll('svg circle');
    
    // Get more detailed info about line elements
    const lineDetails = Array.from(svgLines).map(line => ({
      x1: line.getAttribute('x1'),
      y1: line.getAttribute('y1'),
      x2: line.getAttribute('x2'),
      y2: line.getAttribute('y2'),
      stroke: line.getAttribute('stroke'),
      className: line.className.baseVal
    }));
    
    return {
      lines: svgLines.length,
      paths: pathElements.length,
      circles: circleElements.length,
      lineDetails: lineDetails,
      total: svgLines.length + pathElements.length
    };
  });
  
  console.log('📈 After dragging trend channel:');
  console.log(`   - Line elements: ${afterDragElements.lines} (was ${afterChannelElements.lines})`);
  console.log(`   - Path elements: ${afterDragElements.paths} (was ${afterChannelElements.paths})`);
  console.log(`   - Circle elements: ${afterDragElements.circles} (was ${afterChannelElements.circles})`);
  
  // Step 9: VERIFICATION - Ensure no extra lines were added during drag
  console.log('✅ VERIFICATION RESULTS:');
  
  const extraLinesAfterDrag = afterDragElements.lines - afterChannelElements.lines;
  const extraPathsAfterDrag = afterDragElements.paths - afterChannelElements.paths;
  
  console.log(`   📊 Extra lines added during drag: ${extraLinesAfterDrag}`);
  console.log(`   📊 Extra paths added during drag: ${extraPathsAfterDrag}`);
  
  // The critical assertion - no extra lines should be added during drag
  if (extraLinesAfterDrag > 0) {
    console.error('❌ FAIL: Extra line elements were added during drag!');
    console.log('   Line details after drag:', afterDragElements.lineDetails);
  } else {
    console.log('✅ SUCCESS: No extra line elements added during drag!');
  }
  
  // Take screenshots for visual verification
  await page.screenshot({ path: 'test-results/trend-channel-dom-verification.png' });
  
  // Assert that no extra lines were created
  expect(extraLinesAfterDrag).toBeLessThanOrEqual(0);
  expect(extraPathsAfterDrag).toBeLessThanOrEqual(0);
  
  console.log('');
  console.log('🎉 TEST COMPLETE: Trend channel drag verification successful!');
  console.log('📝 Summary:');
  console.log(`   - Initial lines: ${initialLineElements.lines}`);
  console.log(`   - After channel drawn: ${afterChannelElements.lines} (+${linesAddedByChannel})`);
  console.log(`   - After drag: ${afterDragElements.lines} (+${extraLinesAfterDrag})`);
  console.log('   - Result: NO additional trendline elements created during drag ✅');
});

test('Detailed DOM inspection - verify no TrendLine component when TrendChannel active', async ({ page }) => {
  console.log('🔬 Deep DOM inspection to verify component separation...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Activate Trend Channel tool
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendchannel"]');
  await page.waitForTimeout(300);
  
  // Draw trend channel
  await chartContainer.click({ position: { x: 200, y: 300 } });
  await chartContainer.click({ position: { x: 400, y: 250 } });
  await chartContainer.click({ position: { x: 350, y: 320 } });
  await page.waitForTimeout(1000);
  
  // Inspect React component tree (if accessible)
  const componentInfo = await page.evaluate(() => {
    // Try to find React fiber information
    const findReactComponents = (element) => {
      const components = [];
      const reactKey = Object.keys(element).find(key => key.startsWith('__react'));
      if (reactKey) {
        const fiber = element[reactKey];
        if (fiber && fiber.memoizedProps) {
          components.push({
            type: fiber.type?.name || 'Unknown',
            props: Object.keys(fiber.memoizedProps || {})
          });
        }
      }
      return components;
    };
    
    // Count specific element patterns
    const svgElements = document.querySelectorAll('svg');
    let trendLinePatterns = 0;
    let channelPatterns = 0;
    
    svgElements.forEach(svg => {
      const lines = svg.querySelectorAll('line');
      const circles = svg.querySelectorAll('circle');
      
      // Pattern for trend channel: usually has 2 parallel lines
      if (lines.length >= 2) {
        channelPatterns++;
      }
      
      // Pattern for standalone trend line: single line with 2 circles
      if (lines.length === 1 && circles.length === 2) {
        trendLinePatterns++;
      }
    });
    
    return {
      svgCount: svgElements.length,
      trendLinePatterns,
      channelPatterns,
      totalLines: document.querySelectorAll('svg line').length,
      totalCircles: document.querySelectorAll('svg circle').length
    };
  });
  
  console.log('🔬 Component analysis:');
  console.log(`   - SVG containers: ${componentInfo.svgCount}`);
  console.log(`   - TrendLine patterns detected: ${componentInfo.trendLinePatterns}`);
  console.log(`   - Channel patterns detected: ${componentInfo.channelPatterns}`);
  console.log(`   - Total lines in DOM: ${componentInfo.totalLines}`);
  console.log(`   - Total circles in DOM: ${componentInfo.totalCircles}`);
  
  // The key assertion - when trend channel is active, no trendline pattern should exist
  expect(componentInfo.trendLinePatterns).toBe(0);
  
  console.log('');
  console.log('✅ Verification complete: No TrendLine component rendered when TrendChannel is active');
});