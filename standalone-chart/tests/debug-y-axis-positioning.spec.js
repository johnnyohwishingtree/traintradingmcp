const { test, expect } = require('@playwright/test');

test('Debug Y-axis drag area positioning and click detection', async ({ page }) => {
  console.log('🔍 Debugging Y-axis drag area positioning...');
  
  // Capture all console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('Y-Axis') || text.includes('🎛️')) {
      console.log('📋 Console:', text);
    }
  });
  
  // Navigate to the chart application
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('✅ Chart loaded');
  
  // Get the Y-axis drag area element
  const yAxisHandle = page.locator('[data-testid="y-axis-resize-handle"]');
  await expect(yAxisHandle).toBeVisible({ timeout: 5000 });
  
  // Get detailed positioning info
  const handleBox = await yAxisHandle.boundingBox();
  console.log(`📏 Y-axis drag area position:`, handleBox);
  
  // Also get the main chart container for comparison
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  const chartBox = await chartContainer.boundingBox();
  console.log(`📊 Main chart container position:`, chartBox);
  
  // Calculate relative position
  const relativeLeft = handleBox.x - chartBox.x;
  const relativeTop = handleBox.y - chartBox.y;
  console.log(`📐 Relative position: left=${relativeLeft}px, top=${relativeTop}px`);
  console.log(`📐 Drag area size: ${handleBox.width}x${handleBox.height}px`);
  
  // Test if the element can receive mouse events by adding a click listener
  await page.evaluate(() => {
    const element = document.querySelector('[data-testid="y-axis-resize-handle"]');
    if (element) {
      element.addEventListener('mousedown', (e) => {
        console.log('🎯 MOUSEDOWN detected on Y-axis handle at:', e.clientX, e.clientY);
      });
      element.addEventListener('click', (e) => {
        console.log('🎯 CLICK detected on Y-axis handle at:', e.clientX, e.clientY);
      });
    }
  });
  
  // Test a simple click first (should trigger mousedown if working)
  const testX = handleBox.x + handleBox.width / 2;
  const testY = handleBox.y + handleBox.height / 2;
  
  console.log(`🎯 Testing click at (${testX}, ${testY})`);
  await page.mouse.click(testX, testY);
  await page.waitForTimeout(500);
  
  // Check for any drag-related logs
  const dragLogs = logs.filter(log => 
    log.includes('🎛️') || 
    log.includes('MOUSEDOWN') || 
    log.includes('CLICK')
  );
  
  if (dragLogs.length > 0) {
    console.log('✅ Drag area is receiving mouse events:');
    dragLogs.forEach(log => console.log('   ', log));
  } else {
    console.log('❌ No mouse events detected on drag area');
    
    // Check if there are overlapping elements
    const elementAtPoint = await page.evaluate(({x, y}) => {
      const element = document.elementFromPoint(x, y);
      const rect = element?.getBoundingClientRect();
      return {
        tagName: element?.tagName,
        className: element?.className,
        testId: element?.getAttribute('data-testid'),
        zIndex: window.getComputedStyle(element).zIndex,
        position: window.getComputedStyle(element).position,
        pointerEvents: window.getComputedStyle(element).pointerEvents,
        boundingBox: rect ? {x: rect.x, y: rect.y, width: rect.width, height: rect.height} : null
      };
    }, {x: testX, y: testY});
    
    console.log('🔍 Element at click point:', elementAtPoint);
    
    // Check if the Y-axis drag area is even visible at this point
    const yAxisElementInfo = await page.evaluate(() => {
      const yAxisElement = document.querySelector('[data-testid="y-axis-resize-handle"]');
      if (!yAxisElement) return { found: false };
      
      const rect = yAxisElement.getBoundingClientRect();
      const styles = window.getComputedStyle(yAxisElement);
      
      return {
        found: true,
        zIndex: styles.zIndex,
        position: styles.position,
        pointerEvents: styles.pointerEvents,
        display: styles.display,
        visibility: styles.visibility,
        boundingBox: {x: rect.x, y: rect.y, width: rect.width, height: rect.height}
      };
    });
    
    console.log('📋 Y-axis drag area info:', yAxisElementInfo);
  }
  
  // Take screenshot
  await page.screenshot({ 
    path: 'test-results/debug-y-axis-positioning.png',
    fullPage: true 
  });
  
  expect(true).toBe(true);
});