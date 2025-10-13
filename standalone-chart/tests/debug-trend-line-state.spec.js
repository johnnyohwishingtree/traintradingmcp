const { test, expect } = require('@playwright/test');

test('Debug - check trend line drawing state and console logs', async ({ page }) => {
  console.log('🔍 Debugging trend line drawing state and console logs...');
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    console.log(`📝 Console: ${msg.type()} - ${msg.text()}`);
  });
  
  // Capture errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Check initial state
  console.log('📊 Step 1: Checking initial state...');
  
  // Try to access the app state to see what's happening
  const initialState = await page.evaluate(() => {
    // Try to find React components and their state
    return {
      bodyClasses: document.body.className,
      chartExists: !!document.querySelector('[data-testid="main-chart-container"]'),
      toolbarExists: !!document.querySelector('[data-testid="drawing-toolbar"]'),
      currentButtons: Array.from(document.querySelectorAll('[data-testid="drawing-toolbar"] button')).map(btn => ({
        testId: btn.getAttribute('data-testid'),
        active: btn.classList.contains('active'),
        title: btn.getAttribute('title')
      }))
    };
  });
  
  console.log('Initial state:', initialState);
  
  // Step 2: Activate trend line tool
  console.log('📐 Step 2: Activating trend line tool...');
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(500);
  await page.click('[data-testid="line-type-trendline"]');
  await page.waitForTimeout(1000);
  
  const afterActivation = await page.evaluate(() => {
    return {
      lineToolActive: document.querySelector('[data-testid="line-tools-button"]')?.classList.contains('active'),
      cursorActive: document.querySelector('[data-testid="cursor-button"]')?.classList.contains('active'),
    };
  });
  
  console.log('After activation:', afterActivation);
  
  // Step 3: Click on chart to start drawing
  console.log('📐 Step 3: First click to start drawing...');
  await chartContainer.click({ position: { x: 200, y: 300 } });
  await page.waitForTimeout(1000);
  
  // Step 4: Second click to complete line
  console.log('📐 Step 4: Second click to complete line...');
  await chartContainer.click({ position: { x: 400, y: 200 } });
  await page.waitForTimeout(2000);
  
  // Check what happened
  const afterDrawing = await page.evaluate(() => {
    const allLines = document.querySelectorAll('svg line');
    const allPaths = document.querySelectorAll('svg path');
    const allCircles = document.querySelectorAll('svg circle');
    
    return {
      lines: allLines.length,
      paths: allPaths.length,
      circles: allCircles.length,
      // Look for any elements that might be trend lines
      blueElements: Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        const stroke = el.getAttribute('stroke');
        return stroke === '#2196f3' || style.stroke === 'rgb(33, 150, 243)';
      }).map(el => ({
        tagName: el.tagName,
        attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
      }))
    };
  });
  
  console.log('After drawing attempt:', afterDrawing);
  
  await page.screenshot({ path: 'test-results/debug-trend-line-state.png' });
  
  // Check if any console logs mention trend lines
  const trendLineRelatedLogs = consoleLogs.filter(log => 
    log.toLowerCase().includes('trend') || 
    log.toLowerCase().includes('line') ||
    log.toLowerCase().includes('complete') ||
    log.toLowerCase().includes('click')
  );
  
  console.log('');
  console.log('📝 Trend line related console logs:');
  trendLineRelatedLogs.forEach(log => console.log(`   ${log}`));
  
  console.log('');
  console.log(`📊 Total console logs captured: ${consoleLogs.length}`);
  if (consoleLogs.length > 10) {
    console.log('Last 10 logs:');
    consoleLogs.slice(-10).forEach(log => console.log(`   ${log}`));
  }
});