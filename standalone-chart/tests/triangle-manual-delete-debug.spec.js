const { test, expect } = require('@playwright/test');

test.describe('Triangle Manual Delete Debug', () => {
  test('debug triangle selection and deletion step by step', async ({ page }) => {
    console.log('🔍 DEBUGGING Triangle Delete - Step by Step');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Listen for all console logs to see what's happening
    const allLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(`[${msg.type()}] ${text}`);
      console.log(`CONSOLE: ${text}`);
    });

    // Listen for errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('❌ ERROR:', error.message);
    });

    console.log('\n📊 Step 1: Drawing triangle...');
    await page.click('[data-testid="patterns-button"]');
    await page.waitForTimeout(500);
    
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Draw triangle with specific coordinates
      console.log('  Drawing point 1...');
      await page.mouse.click(chartBox.x + 300, chartBox.y + 300);
      await page.waitForTimeout(500);
      
      console.log('  Drawing point 2...');
      await page.mouse.click(chartBox.x + 500, chartBox.y + 200);
      await page.waitForTimeout(500);
      
      console.log('  Drawing point 3 (completing triangle)...');
      await page.mouse.click(chartBox.x + 400, chartBox.y + 150);
      await page.waitForTimeout(1000);
    }
    
    console.log('\n📊 Step 2: Switching to cursor mode...');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    console.log('\n📊 Step 3: Clicking on triangle to select it...');
    if (chartBox) {
      const triangleCenterX = chartBox.x + 400;
      const triangleCenterY = chartBox.y + 220;
      console.log(`  Clicking at (${triangleCenterX}, ${triangleCenterY})`);
      await page.mouse.click(triangleCenterX, triangleCenterY);
      await page.waitForTimeout(1000);
    }
    
    // Take screenshot before deletion attempt
    await page.screenshot({ path: 'test-results/triangle-before-delete.png' });
    
    console.log('\n📊 Step 4: Checking triangle state before deletion...');
    // Check if triangle is actually selected by looking at the page state
    const stateBeforeDelete = await page.evaluate(() => {
      // Try to access any global state if available
      if (window.React && window.React.__DEBUG__) {
        return { hasDebugInfo: true };
      }
      return { hasDebugInfo: false };
    });
    console.log('State before delete:', stateBeforeDelete);
    
    console.log('\n📊 Step 5: Pressing Delete key...');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(1000);
    
    // Take screenshot after deletion attempt
    await page.screenshot({ path: 'test-results/triangle-after-delete.png' });
    
    console.log('\n📊 Step 6: Trying Backspace as alternative...');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/triangle-after-backspace.png' });
    
    console.log('\n📊 Analysis:');
    console.log(`Total console logs captured: ${allLogs.length}`);
    console.log(`Total errors: ${errors.length}`);
    
    // Show relevant logs about triangles/deletion
    const relevantLogs = allLogs.filter(log => 
      log.toLowerCase().includes('triangle') ||
      log.toLowerCase().includes('delete') ||
      log.toLowerCase().includes('select') ||
      log.toLowerCase().includes('🔺') ||
      log.toLowerCase().includes('🗑️')
    );
    
    console.log(`\nRelevant logs (${relevantLogs.length}):`);
    relevantLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });
    
    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // The test passes regardless - this is just for debugging
    expect(true).toBe(true);
    console.log('\n✅ Debug test completed - check console logs and screenshots');
  });
});