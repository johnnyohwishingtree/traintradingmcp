const { test, expect } = require('@playwright/test');

test('Debug Y-axis drag functionality', async ({ page }) => {
  console.log('🔍 Debugging Y-axis drag functionality...');
  
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
  
  // Look for any draggable Y-axis elements
  console.log('🔍 Looking for Y-axis drag elements...');
  
  // Try multiple selectors for Y-axis drag areas
  const possibleSelectors = [
    '[data-testid="y-axis-resize-handle"]',
    '.y-axis-drag',
    '.y-axis-resize',
    '[title*="Y-Axis"]',
    'text[text-anchor="start"]' // Y-axis labels might be draggable
  ];
  
  let dragElement = null;
  for (const selector of possibleSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        console.log(`✅ Found drag element: ${selector}`);
        dragElement = element;
        break;
      }
    } catch (e) {
      console.log(`❌ Not found: ${selector}`);
    }
  }
  
  if (!dragElement) {
    console.log('⚠️ No specific drag element found, trying chart area drag...');
    
    // Try dragging anywhere in the Y-axis area (right side of chart)
    const chartContainer = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chartContainer.boundingBox();
    
    // Click and drag in the right side of the chart (Y-axis area)
    const dragX = chartBox.x + chartBox.width * 0.9; // Far right side
    const startY = chartBox.y + chartBox.height * 0.3; // Upper area
    const endY = chartBox.y + chartBox.height * 0.8;   // Lower area
    
    console.log(`📏 Attempting chart area drag from (${dragX}, ${startY}) to (${dragX}, ${endY})`);
    
    await page.mouse.move(dragX, startY);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(dragX, endY, { steps: 10 });
    await page.waitForTimeout(100);
    await page.mouse.up();
    
  } else {
    console.log('🎯 Testing specific drag element...');
    
    const dragBox = await dragElement.boundingBox();
    const startX = dragBox.x + dragBox.width / 2;
    const startY = dragBox.y + dragBox.height / 2;
    const endY = startY + 300; // Large drag distance
    
    console.log(`📏 Dragging element from (${startX}, ${startY}) to (${startX}, ${endY})`);
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(startX, endY, { steps: 10 });
    await page.waitForTimeout(100);
    await page.mouse.up();
  }
  
  // Wait for any updates
  await page.waitForTimeout(1000);
  
  console.log('📋 All Y-Axis related console logs:');
  const yAxisLogs = logs.filter(log => 
    log.includes('Y-Axis') || 
    log.includes('padding') || 
    log.includes('Extents') ||
    log.includes('🎛️')
  );
  yAxisLogs.forEach(log => console.log('   ', log));
  
  if (yAxisLogs.length === 0) {
    console.log('❌ No Y-axis logs found - drag detection may not be working');
  } else {
    console.log(`✅ Found ${yAxisLogs.length} Y-axis related logs`);
  }
  
  // Take screenshot for visual verification
  await page.screenshot({ 
    path: 'test-results/debug-y-axis-drag.png',
    fullPage: true 
  });
  
  expect(true).toBe(true);
});