const { test, expect } = require('@playwright/test');

test('Trend channel drag bug - enters drawing mode and waits for click', async ({ page }) => {
  console.log('🐛 Replicating trend channel drag bug that enters drawing mode...');
  
  // Navigate to the chart application
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  console.log('📊 Chart application loaded');
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Step 1: Select and activate Trend Channel tool
  console.log('🔧 Step 1: Selecting Trend Channel tool...');
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(500);
  await page.click('[data-testid="line-type-trendchannel"]');
  await page.waitForTimeout(500);
  console.log('✅ Trend Channel tool selected');
  
  // Step 2: Draw a trend channel
  console.log('📐 Step 2: Drawing trend channel...');
  await chartContainer.click({ position: { x: 200, y: 300 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 400, y: 250 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 350, y: 320 } });
  await page.waitForTimeout(1000);
  console.log('✅ Trend channel drawn');
  
  await page.screenshot({ path: 'test-results/channel-before-drag.png' });
  
  // Count initial elements
  const initialElements = await page.evaluate(() => {
    return {
      lines: document.querySelectorAll('svg line').length,
      circles: document.querySelectorAll('svg circle').length
    };
  });
  console.log(`📊 Initial state - Lines: ${initialElements.lines}, Circles: ${initialElements.circles}`);
  
  // Step 3: Switch to cursor mode
  console.log('🖱️ Step 3: Switching to cursor mode...');
  await page.click('[data-testid="cursor-button"]');
  await page.waitForTimeout(500);
  
  // Step 4: Select and drag the trend channel
  console.log('🔄 Step 4: Selecting and dragging trend channel...');
  await chartContainer.click({ position: { x: 300, y: 285 } });
  await page.waitForTimeout(500);
  
  await chartContainer.click({ position: { x: 300, y: 285 } });
  await page.mouse.down();
  await page.mouse.move(350, 260, { steps: 5 });
  await page.mouse.up();
  console.log('✅ Trend channel dragged');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'test-results/channel-after-drag.png' });
  
  // Step 5: THE BUG - Now the chart is in drawing mode waiting for a click
  console.log('🐛 Step 5: Testing if chart entered drawing mode after drag...');
  
  // Move mouse around to see if there's a line following the cursor
  await page.mouse.move(450, 200);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/mouse-moved-after-drag.png' });
  
  // Count elements after mouse move
  const afterMoveElements = await page.evaluate(() => {
    return {
      lines: document.querySelectorAll('svg line').length,
      circles: document.querySelectorAll('svg circle').length
    };
  });
  console.log(`📊 After mouse move - Lines: ${afterMoveElements.lines}, Circles: ${afterMoveElements.circles}`);
  
  // Step 6: Click somewhere to complete the unwanted trend line
  console.log('🖱️ Step 6: Clicking to see if it completes a trend line...');
  await chartContainer.click({ position: { x: 500, y: 200 } });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'test-results/after-click-completes-line.png' });
  
  // Count final elements
  const finalElements = await page.evaluate(() => {
    return {
      lines: document.querySelectorAll('svg line').length,
      circles: document.querySelectorAll('svg circle').length,
      // Try to identify if new trend line was created
      allLines: Array.from(document.querySelectorAll('svg line')).map(line => ({
        x1: line.getAttribute('x1'),
        y1: line.getAttribute('y1'),
        x2: line.getAttribute('x2'),
        y2: line.getAttribute('y2')
      }))
    };
  });
  
  console.log(`📊 Final state - Lines: ${finalElements.lines}, Circles: ${finalElements.circles}`);
  
  // Check if extra line was created
  const extraLinesCreated = finalElements.lines - initialElements.lines;
  
  console.log('🐛 BUG VERIFICATION:');
  console.log(`   - Initial lines: ${initialElements.lines}`);
  console.log(`   - Final lines: ${finalElements.lines}`);
  console.log(`   - Extra lines created: ${extraLinesCreated}`);
  
  if (extraLinesCreated > 0) {
    console.log('❌ BUG CONFIRMED: Extra trend line was created after dragging channel!');
    console.log('   The drag operation left the chart in drawing mode.');
    console.log('   One click created the first point, next click completed the line.');
  } else {
    console.log('✅ No bug found - drag operation did not create extra lines');
  }
  
  // Log all line positions for debugging
  console.log('📐 All lines in final DOM:', finalElements.allLines);
  
  // This test is expected to FAIL initially, confirming the bug exists
  // After the fix, it should PASS
  expect(extraLinesCreated).toBe(0); // Should be 0, but will likely be 1 or more due to bug
});

test('Verify drawing mode state after trend channel drag', async ({ page }) => {
  console.log('🔍 Verifying if trend channel drag leaves chart in drawing mode...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Set up console log capture
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'log') {
      consoleLogs.push(msg.text());
    }
  });
  
  // Draw trend channel
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendchannel"]');
  await page.waitForTimeout(300);
  
  await chartContainer.click({ position: { x: 200, y: 300 } });
  await chartContainer.click({ position: { x: 400, y: 250 } });
  await chartContainer.click({ position: { x: 350, y: 320 } });
  await page.waitForTimeout(1000);
  
  // Switch to cursor and drag
  await page.click('[data-testid="cursor-button"]');
  await chartContainer.click({ position: { x: 300, y: 285 } });
  await page.mouse.down();
  await page.mouse.move(320, 270, { steps: 3 });
  await page.mouse.up();
  await page.waitForTimeout(1000);
  
  // Check if tool is still active
  const isLineToolActive = await page.evaluate(() => {
    const lineToolButton = document.querySelector('[data-testid="line-tools-button"]');
    return lineToolButton?.classList.contains('active');
  });
  
  const isCursorActive = await page.evaluate(() => {
    const cursorButton = document.querySelector('[data-testid="cursor-button"]');
    return cursorButton?.classList.contains('active');
  });
  
  console.log('🔍 Tool State Check:');
  console.log(`   - Line tool active: ${isLineToolActive}`);
  console.log(`   - Cursor tool active: ${isCursorActive}`);
  console.log(`   - Recent console logs:`, consoleLogs.slice(-5));
  
  // The issue is that after dragging, the tool might still be in drawing mode
  if (isLineToolActive) {
    console.log('❌ BUG: Line tool is still active after drag!');
    console.log('   This means the next click will start drawing a new line.');
  } else if (isCursorActive) {
    console.log('✅ Correct: Cursor tool is active after drag');
  }
  
  // Try clicking to see what happens
  console.log('🖱️ Testing click behavior after drag...');
  const beforeClickLines = await page.evaluate(() => document.querySelectorAll('svg line').length);
  
  await chartContainer.click({ position: { x: 450, y: 220 } });
  await page.waitForTimeout(1000);
  
  const afterClickLines = await page.evaluate(() => document.querySelectorAll('svg line').length);
  
  if (afterClickLines > beforeClickLines) {
    console.log(`❌ Click started drawing! Lines increased from ${beforeClickLines} to ${afterClickLines}`);
  } else {
    console.log(`✅ Click did not start drawing. Lines remain at ${beforeClickLines}`);
  }
  
  expect(afterClickLines).toBe(beforeClickLines); // Should not increase
});