const { test, expect } = require('@playwright/test');

test.describe('Fibonacci Delete Key Debug', () => {
  test('debug Fibonacci selection and deletion step by step', async ({ page }) => {
    console.log('🔍 DEBUGGING Fibonacci Delete - Step by Step');
    
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

    console.log('\n📊 Step 1: Drawing Fibonacci retracement...');
    await page.click('[data-testid="fibonacci-button"]');
    await page.waitForTimeout(500);
    
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Draw Fibonacci with specific coordinates
      console.log('  Drawing point 1...');
      await page.mouse.click(chartBox.x + 300, chartBox.y + 350);
      await page.waitForTimeout(500);
      
      console.log('  Drawing point 2 (completing Fibonacci)...');
      await page.mouse.click(chartBox.x + 500, chartBox.y + 150);
      await page.waitForTimeout(1000);
    }
    
    console.log('\n📊 Step 2: Switching to cursor mode...');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    console.log('\n📊 Step 3: Clicking on Fibonacci area to select it...');
    if (chartBox) {
      const fibAreaCenterX = chartBox.x + 400;
      const fibAreaCenterY = chartBox.y + 250;
      console.log(`  Clicking at (${fibAreaCenterX}, ${fibAreaCenterY})`);
      await page.mouse.click(fibAreaCenterX, fibAreaCenterY);
      await page.waitForTimeout(1000);
    }
    
    // Take screenshot before deletion attempt
    await page.screenshot({ path: 'test-results/fibonacci-before-delete.png' });
    
    console.log('\n📊 Step 4: Checking Fibonacci state before deletion...');
    // Check if Fibonacci is actually selected by looking at the page state
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
    await page.screenshot({ path: 'test-results/fibonacci-after-delete.png' });
    
    console.log('\n📊 Step 6: Trying Backspace as alternative...');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/fibonacci-after-backspace.png' });
    
    console.log('\n📊 Analysis:');
    console.log(`Total console logs captured: ${allLogs.length}`);
    console.log(`Total errors: ${errors.length}`);
    
    // Show relevant logs about Fibonacci/deletion
    const relevantLogs = allLogs.filter(log => 
      log.toLowerCase().includes('fibonacci') ||
      log.toLowerCase().includes('delete') ||
      log.toLowerCase().includes('select') ||
      log.toLowerCase().includes('fib') ||
      log.toLowerCase().includes('🗑️') ||
      log.toLowerCase().includes('selectedfibs')
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