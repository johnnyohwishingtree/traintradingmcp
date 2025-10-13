const { test, expect } = require('@playwright/test');

test('Debug trend channel tool state during drag operations', async ({ page }) => {
  console.log('🔍 Debugging tool state during trend channel operations...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Capture console logs for debugging
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'log' && (
        msg.text().includes('auto-switching') ||
        msg.text().includes('drag/modify') ||
        msg.text().includes('completion') ||
        msg.text().includes('🎯') ||
        msg.text().includes('🔄') ||
        msg.text().includes('✅')
      )) {
      consoleLogs.push(msg.text());
      console.log('📊 CONSOLE:', msg.text());
    }
  });
  
  // Helper function to get tool states
  const getToolStates = async () => {
    return await page.evaluate(() => {
      return {
        currentTool: window.currentTool || 'unknown', // This might not work but let's try
        lineToolActive: document.querySelector('[data-testid="line-tools-button"]')?.classList.contains('active'),
        cursorActive: document.querySelector('[data-testid="cursor-button"]')?.classList.contains('active'),
        trendlineButton: document.querySelector('[data-testid="trendline-button"]')?.classList.contains('active'),
        enableTrendLine: window.enableTrendLine || 'unknown' // This might not work but let's try
      };
    });
  };
  
  // Step 1: Initial state
  console.log('📊 Step 1: Initial tool state');
  let toolState = await getToolStates();
  console.log('   Initial state:', toolState);
  
  // Step 2: Select trend channel tool
  console.log('📊 Step 2: Selecting trend channel tool');
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendchannel"]');
  await page.waitForTimeout(500);
  
  toolState = await getToolStates();
  console.log('   After selecting trend channel:', toolState);
  
  // Step 3: Draw trend channel
  console.log('📊 Step 3: Drawing trend channel');
  await chartContainer.click({ position: { x: 200, y: 300 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 400, y: 250 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 350, y: 320 } });
  await page.waitForTimeout(1000);
  
  toolState = await getToolStates();
  console.log('   After drawing trend channel:', toolState);
  console.log('   Console logs after drawing:', consoleLogs.slice(-3));
  
  // Step 4: Switch to cursor
  console.log('📊 Step 4: Switching to cursor mode');
  await page.click('[data-testid="cursor-button"]');
  await page.waitForTimeout(500);
  
  toolState = await getToolStates();
  console.log('   After switching to cursor:', toolState);
  
  // Step 5: Drag the trend channel (THIS IS THE CRITICAL MOMENT)
  console.log('📊 Step 5: Dragging trend channel - CRITICAL MOMENT');
  await chartContainer.click({ position: { x: 300, y: 285 } });
  await page.waitForTimeout(300);
  
  console.log('   Before drag start:', await getToolStates());
  
  await chartContainer.click({ position: { x: 300, y: 285 } });
  await page.mouse.down();
  await page.waitForTimeout(200);
  
  console.log('   During drag:', await getToolStates());
  
  await page.mouse.move(350, 260, { steps: 3 });
  await page.waitForTimeout(200);
  
  console.log('   After move:', await getToolStates());
  
  await page.mouse.up();
  await page.waitForTimeout(1000);
  
  toolState = await getToolStates();
  console.log('   After drag complete:', toolState);
  console.log('   Console logs after drag:', consoleLogs.slice(-5));
  
  // Step 6: Test what happens with next click
  console.log('📊 Step 6: Testing next click behavior');
  
  const beforeClick = {
    lines: await page.evaluate(() => document.querySelectorAll('svg line').length),
    toolState: await getToolStates()
  };
  
  console.log('   Before test click:', beforeClick);
  
  await chartContainer.click({ position: { x: 450, y: 200 } });
  await page.waitForTimeout(1000);
  
  const afterClick = {
    lines: await page.evaluate(() => document.querySelectorAll('svg line').length),
    toolState: await getToolStates()
  };
  
  console.log('   After test click:', afterClick);
  console.log('   Console logs after click:', consoleLogs.slice(-3));
  
  // Analysis
  console.log('');
  console.log('🔍 ANALYSIS:');
  console.log(`   Lines before click: ${beforeClick.lines}`);
  console.log(`   Lines after click: ${afterClick.lines}`);
  console.log(`   Lines increased: ${afterClick.lines > beforeClick.lines}`);
  console.log(`   Tool state changed: ${JSON.stringify(beforeClick.toolState) !== JSON.stringify(afterClick.toolState)}`);
  
  if (afterClick.lines > beforeClick.lines) {
    console.log('❌ BUG DETECTED: Click created new line elements!');
    console.log('   This suggests the chart was left in drawing mode after drag.');
  } else {
    console.log('✅ No unwanted drawing detected');
  }
  
  console.log('');
  console.log('📝 All captured console logs:');
  consoleLogs.forEach((log, index) => {
    console.log(`   ${index + 1}. ${log}`);
  });
});

test('Test manual reproduction scenario - exact user workflow', async ({ page }) => {
  console.log('👤 Simulating exact manual user workflow...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Exactly replicate manual testing workflow
  console.log('1. User clicks trendline button dropdown');
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(500);
  
  console.log('2. User selects trend channel');
  await page.click('[data-testid="line-type-trendchannel"]');
  await page.waitForTimeout(500);
  
  console.log('3. User draws trend channel (3 clicks)');
  await chartContainer.click({ position: { x: 200, y: 300 } });
  await page.waitForTimeout(500);
  await chartContainer.click({ position: { x: 400, y: 250 } });
  await page.waitForTimeout(500);
  await chartContainer.click({ position: { x: 350, y: 320 } });
  await page.waitForTimeout(1000);
  
  console.log('4. User sees channel is complete, tries to move it');
  // User might not explicitly switch to cursor, they just try to drag
  await chartContainer.click({ position: { x: 300, y: 285 } });
  await page.mouse.down();
  await page.mouse.move(350, 260, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(1000);
  
  console.log('5. User clicks somewhere else (this is where the bug might manifest)');
  const beforeBugClick = await page.evaluate(() => document.querySelectorAll('svg line').length);
  
  await chartContainer.click({ position: { x: 500, y: 180 } });
  await page.waitForTimeout(1000);
  
  console.log('6. User clicks again (completing the unwanted line)');
  await chartContainer.click({ position: { x: 550, y: 150 } });
  await page.waitForTimeout(1000);
  
  const afterBugClick = await page.evaluate(() => document.querySelectorAll('svg line').length);
  
  console.log('');
  console.log('🐛 Manual workflow test results:');
  console.log(`   Lines before clicks: ${beforeBugClick}`);
  console.log(`   Lines after clicks: ${afterBugClick}`);
  console.log(`   Extra lines created: ${afterBugClick - beforeBugClick}`);
  
  if (afterBugClick > beforeBugClick) {
    console.log('❌ MANUAL BUG CONFIRMED: Extra lines created by post-drag clicks!');
  } else {
    console.log('✅ No manual bug detected');
  }
  
  await page.screenshot({ path: 'test-results/manual-workflow-final.png' });
});