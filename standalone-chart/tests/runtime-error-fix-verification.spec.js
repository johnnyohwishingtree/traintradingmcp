const { test, expect } = require('@playwright/test');

test.describe('Runtime Error Fix Verification', () => {
  test('should handle rapid delete operations without runtime errors', async ({ page }) => {
    console.log('🛡️ Testing runtime error fix for rapid delete operations');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Track runtime errors specifically for the length access issue
    const runtimeErrors = [];
    page.on('pageerror', error => {
      runtimeErrors.push(error.message);
      console.log('❌ Runtime error:', error.message);
    });

    // Track defensive programming activations
    const defensiveLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('handleKeyDown: currentState or arrays not ready')) {
        defensiveLogs.push(text);
        console.log('🛡️ Defensive check activated:', text);
      }
    });

    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();

    if (!chartBox) {
      throw new Error('Chart container not found');
    }

    console.log('🔄 Drawing and deleting triangles rapidly...');
    
    // Quick test: 3 rapid cycles
    for (let cycle = 1; cycle <= 3; cycle++) {
      console.log(`\n🔄 Quick Cycle ${cycle}/3:`);
      
      // Draw triangle
      await page.click('[data-testid="patterns-button"]');
      await page.waitForTimeout(100);
      
      await page.mouse.click(chartBox.x + 200 + (cycle * 50), chartBox.y + 300);
      await page.waitForTimeout(50);
      await page.mouse.click(chartBox.x + 350 + (cycle * 50), chartBox.y + 200);
      await page.waitForTimeout(50);
      await page.mouse.click(chartBox.x + 500 + (cycle * 50), chartBox.y + 350);
      await page.waitForTimeout(100);
      
      // Switch to cursor and delete quickly
      await page.click('[data-testid="cursor-button"]');
      await page.waitForTimeout(50);
      await page.mouse.click(chartBox.x + 350 + (cycle * 50), chartBox.y + 280);
      await page.waitForTimeout(50);
      
      // Rapid delete key presses to stress test
      await page.keyboard.press('Delete');
      await page.keyboard.press('Delete'); // Double press
      await page.waitForTimeout(100);
    }
    
    console.log('\n⚡ Testing rapid simultaneous key presses...');
    
    // Draw one more triangle and test rapid deletion
    await page.click('[data-testid="patterns-button"]');
    await page.waitForTimeout(100);
    
    await page.mouse.click(chartBox.x + 250, chartBox.y + 300);
    await page.waitForTimeout(50);
    await page.mouse.click(chartBox.x + 400, chartBox.y + 200);
    await page.waitForTimeout(50);
    await page.mouse.click(chartBox.x + 550, chartBox.y + 350);
    await page.waitForTimeout(100);
    
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(50);
    await page.mouse.click(chartBox.x + 400, chartBox.y + 280);
    await page.waitForTimeout(50);
    
    // Multiple rapid key presses without waits
    await page.keyboard.press('Delete');
    await page.keyboard.press('Delete');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);
    
    await page.screenshot({ path: 'test-results/runtime-error-fix-verification.png' });
    
    console.log('\n📊 Test Results:');
    console.log(`  Runtime errors: ${runtimeErrors.length}`);
    console.log(`  Defensive programming activations: ${defensiveLogs.length}`);
    
    if (runtimeErrors.length > 0) {
      console.log('\n❌ Runtime errors:');
      runtimeErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (defensiveLogs.length > 0) {
      console.log('\n🛡️ Defensive programming worked:');
      defensiveLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log}`);
      });
    }
    
    // Test passes if no runtime errors occurred
    expect(runtimeErrors.length).toBe(0);
    console.log('✅ Runtime error fix verification successful - no "Cannot read properties of undefined (reading \'length\')" errors');
  });
});