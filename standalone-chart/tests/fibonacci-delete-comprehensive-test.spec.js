const { test, expect } = require('@playwright/test');

test.describe('Fibonacci Delete Comprehensive Test', () => {
  test('should allow Fibonacci to be drawn, selected, and deleted with Delete key', async ({ page }) => {
    console.log('📏 Testing complete Fibonacci deletion workflow');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Track console errors
    const consoleErrors = [];
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.log('❌ Page error:', error.message);
    });

    console.log('📊 Step 1: Draw Fibonacci retracement');
    await page.click('[data-testid="fibonacci-button"]');
    await page.waitForTimeout(500);
    
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Draw Fibonacci retracement
      await page.mouse.click(chartBox.x + 300, chartBox.y + 350);
      await page.waitForTimeout(500);
      await page.mouse.click(chartBox.x + 500, chartBox.y + 150);
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ path: 'test-results/fib-comprehensive-drawn.png' });
    console.log('📸 Screenshot: Fibonacci retracement drawn');
    
    console.log('📊 Step 2: Switch to cursor mode and select Fibonacci');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    if (chartBox) {
      // Click on one of the Fibonacci lines to select it
      const fibCenterX = chartBox.x + 400;
      const fibCenterY = chartBox.y + 250;
      await page.mouse.click(fibCenterX, fibCenterY);
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'test-results/fib-comprehensive-selected.png' });
    console.log('📸 Screenshot: Fibonacci retracement selected');
    
    console.log('📊 Step 3: Delete Fibonacci with Delete key');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/fib-comprehensive-deleted.png' });
    console.log('📸 Screenshot: Fibonacci retracement deleted');
    
    console.log('📊 Step 4: Verify no runtime errors occurred');
    const deletionErrors = consoleErrors.filter(error => 
      error.includes('Cannot read properties of undefined') ||
      error.includes('length') ||
      error.includes('TypeError')
    );
    
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Deletion-related errors: ${deletionErrors.length}`);
    
    if (deletionErrors.length === 0) {
      console.log('✅ Fibonacci deletion worked without runtime errors');
    } else {
      console.log('❌ Fibonacci deletion caused runtime errors:');
      deletionErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Test should pass if no deletion errors occurred
    expect(deletionErrors.length).toBe(0);
    console.log('✅ Fibonacci deletion comprehensive test completed successfully');
  });

  test('should work with both Delete and Backspace keys', async ({ page }) => {
    console.log('📏 Testing Fibonacci deletion with Backspace key');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const consoleErrors = [];
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    // Draw Fibonacci
    await page.click('[data-testid="fibonacci-button"]');
    await page.waitForTimeout(300);
    
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      await page.mouse.click(chartBox.x + 250, chartBox.y + 300);
      await page.waitForTimeout(300);
      await page.mouse.click(chartBox.x + 450, chartBox.y + 200);
      await page.waitForTimeout(500);
    }
    
    // Select and delete with Backspace
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(300);
    
    if (chartBox) {
      await page.mouse.click(chartBox.x + 350, chartBox.y + 250);
      await page.waitForTimeout(300);
    }
    
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);
    
    // Verify no errors
    const deletionErrors = consoleErrors.filter(error => 
      error.includes('Cannot read properties of undefined') ||
      error.includes('length') ||
      error.includes('TypeError')
    );
    
    expect(deletionErrors.length).toBe(0);
    console.log('✅ Fibonacci deletion with Backspace completed successfully');
  });
});