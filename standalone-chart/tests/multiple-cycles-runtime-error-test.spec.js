const { test, expect } = require('@playwright/test');

test.describe('Multiple Draw/Delete Cycles Runtime Error Prevention', () => {
  test('should handle rapid draw/delete cycles without runtime errors', async ({ page }) => {
    console.log('🔄 Testing multiple draw/delete cycles for runtime error prevention');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Track runtime errors
    const runtimeErrors = [];
    page.on('pageerror', error => {
      runtimeErrors.push(error.message);
      console.log('❌ Runtime error:', error.message);
    });

    // Track console logs for defensive programming warnings
    const defensiveLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('handleKeyDown: currentState or arrays not ready')) {
        defensiveLogs.push(text);
        console.log('🛡️ Defensive check triggered:', text);
      }
    });

    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();

    if (!chartBox) {
      throw new Error('Chart container not found');
    }

    console.log('🔄 Performing rapid draw/delete cycles...');
    
    // Perform 10 rapid cycles of: draw triangle → select → delete
    for (let cycle = 1; cycle <= 10; cycle++) {
      console.log(`\n🔄 Cycle ${cycle}/10:`);
      
      // Draw triangle
      console.log(`  📐 Drawing triangle ${cycle}...`);
      await page.click('[data-testid="patterns-button"]');
      await page.waitForTimeout(100);
      
      // Draw three points quickly
      await page.mouse.click(chartBox.x + 200 + (cycle * 20), chartBox.y + 300);
      await page.waitForTimeout(50);
      await page.mouse.click(chartBox.x + 350 + (cycle * 20), chartBox.y + 200);
      await page.waitForTimeout(50);
      await page.mouse.click(chartBox.x + 500 + (cycle * 20), chartBox.y + 350);
      await page.waitForTimeout(100);
      
      // Switch to cursor and select
      console.log(`  🖱️ Selecting triangle ${cycle}...`);
      await page.click('[data-testid="cursor-button"]');
      await page.waitForTimeout(50);
      
      // Click on triangle area to select
      await page.mouse.click(chartBox.x + 350 + (cycle * 20), chartBox.y + 280);
      await page.waitForTimeout(50);
      
      // Delete immediately
      console.log(`  🗑️ Deleting triangle ${cycle}...`);
      await page.keyboard.press('Delete');
      await page.waitForTimeout(50);
      
      // Check for errors after each cycle
      if (runtimeErrors.length > 0) {
        console.log(`❌ Runtime errors detected in cycle ${cycle}:`, runtimeErrors);
        break;
      }
    }
    
    console.log('\n🔄 Performing rapid draw/delete cycles with Fibonacci...');
    
    // Perform 5 cycles with Fibonacci for variety
    for (let cycle = 1; cycle <= 5; cycle++) {
      console.log(`\n📏 Fibonacci Cycle ${cycle}/5:`);
      
      // Draw Fibonacci
      await page.click('[data-testid="fibonacci-button"]');
      await page.waitForTimeout(50);
      
      await page.mouse.click(chartBox.x + 150 + (cycle * 30), chartBox.y + 320);
      await page.waitForTimeout(50);
      await page.mouse.click(chartBox.x + 450 + (cycle * 30), chartBox.y + 180);
      await page.waitForTimeout(100);
      
      // Select and delete
      await page.click('[data-testid="cursor-button"]');
      await page.waitForTimeout(50);
      await page.mouse.click(chartBox.x + 300 + (cycle * 30), chartBox.y + 250);
      await page.waitForTimeout(50);
      await page.keyboard.press('Delete');
      await page.waitForTimeout(50);
    }
    
    console.log('\n🔄 Performing rapid draw/delete cycles with TrendLines...');
    
    // Perform 5 cycles with TrendLines
    for (let cycle = 1; cycle <= 5; cycle++) {
      console.log(`\n📈 TrendLine Cycle ${cycle}/5:`);
      
      // Draw TrendLine
      await page.click('[data-testid="trendline-button"]');
      await page.waitForTimeout(50);
      
      await page.mouse.click(chartBox.x + 180 + (cycle * 25), chartBox.y + 300);
      await page.waitForTimeout(50);
      await page.mouse.click(chartBox.x + 420 + (cycle * 25), chartBox.y + 200);
      await page.waitForTimeout(100);
      
      // Select and delete
      await page.click('[data-testid="cursor-button"]');
      await page.waitForTimeout(50);
      await page.mouse.click(chartBox.x + 300 + (cycle * 25), chartBox.y + 250);
      await page.waitForTimeout(50);
      await page.keyboard.press('Backspace'); // Try Backspace instead of Delete
      await page.waitForTimeout(50);
    }
    
    await page.screenshot({ path: 'test-results/multiple-cycles-final.png' });
    
    console.log('\n📊 Test Results:');
    console.log(`  Runtime errors: ${runtimeErrors.length}`);
    console.log(`  Defensive programming triggers: ${defensiveLogs.length}`);
    
    if (runtimeErrors.length > 0) {
      console.log('\n❌ Runtime errors encountered:');
      runtimeErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (defensiveLogs.length > 0) {
      console.log('\n🛡️ Defensive programming activations:');
      defensiveLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log}`);
      });
    }
    
    // Test passes if no runtime errors occurred
    expect(runtimeErrors.length).toBe(0);
    console.log('✅ Multiple draw/delete cycles completed without runtime errors');
  });

  test('should handle simultaneous state updates gracefully', async ({ page }) => {
    console.log('⚡ Testing simultaneous state updates during deletion');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const runtimeErrors = [];
    page.on('pageerror', error => {
      runtimeErrors.push(error.message);
    });

    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();

    if (!chartBox) {
      throw new Error('Chart container not found');
    }

    // Draw multiple triangles quickly
    console.log('📐 Drawing multiple triangles rapidly...');
    await page.click('[data-testid="patterns-button"]');
    
    for (let i = 0; i < 3; i++) {
      await page.mouse.click(chartBox.x + 200 + (i * 100), chartBox.y + 300);
      await page.waitForTimeout(20);
      await page.mouse.click(chartBox.x + 300 + (i * 100), chartBox.y + 200);
      await page.waitForTimeout(20);
      await page.mouse.click(chartBox.x + 400 + (i * 100), chartBox.y + 350);
      await page.waitForTimeout(20);
    }
    
    // Switch to cursor mode and try to delete rapidly
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(100);
    
    console.log('⚡ Attempting rapid simultaneous deletions...');
    
    // Simulate rapid clicking and deleting without proper waits
    // This should trigger the defensive programming
    await page.mouse.click(chartBox.x + 250, chartBox.y + 280);
    await page.keyboard.press('Delete');
    await page.keyboard.press('Delete'); // Double press without wait
    await page.keyboard.press('Delete'); // Triple press
    await page.waitForTimeout(50);
    
    await page.mouse.click(chartBox.x + 350, chartBox.y + 280);
    await page.keyboard.press('Delete');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(50);
    
    await page.mouse.click(chartBox.x + 450, chartBox.y + 280);
    await page.keyboard.press('Delete');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);
    
    console.log(`📊 Runtime errors after simultaneous operations: ${runtimeErrors.length}`);
    
    // Should handle rapid operations without crashing
    expect(runtimeErrors.length).toBe(0);
    console.log('✅ Simultaneous state updates handled gracefully');
  });
});