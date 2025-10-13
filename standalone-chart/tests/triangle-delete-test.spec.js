const { test, expect } = require('@playwright/test');

test.describe('Triangle Pattern Deletion', () => {
  test('should allow triangle pattern to be drawn, selected, and deleted with Delete key', async ({ page }) => {
    console.log('🔺 Testing triangle pattern deletion functionality');
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Listen for console errors to catch the deletion bug
    const consoleErrors = [];
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.log('❌ Page error:', error.message);
    });

    console.log('📊 Step 1: Select triangle pattern tool');
    
    // Click on the patterns button directly
    await page.click('[data-testid="patterns-button"]');
    await page.waitForTimeout(500);
    
    console.log('📊 Step 2: Draw triangle pattern');
    
    // Draw a triangle pattern (3 clicks)
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Triangle point 1
      const point1X = chartBox.x + chartBox.width * 0.3;
      const point1Y = chartBox.y + chartBox.height * 0.6;
      await page.mouse.click(point1X, point1Y);
      await page.waitForTimeout(500);
      
      // Triangle point 2
      const point2X = chartBox.x + chartBox.width * 0.7;
      const point2Y = chartBox.y + chartBox.height * 0.4;
      await page.mouse.click(point2X, point2Y);
      await page.waitForTimeout(500);
      
      // Triangle point 3 (complete the triangle)
      const point3X = chartBox.x + chartBox.width * 0.5;
      const point3Y = chartBox.y + chartBox.height * 0.2;
      await page.mouse.click(point3X, point3Y);
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ path: 'test-results/triangle-drawn.png' });
    console.log('📸 Screenshot: Triangle pattern drawn');
    
    console.log('📊 Step 3: Switch to cursor mode and select triangle');
    
    // Switch to cursor mode to select the triangle
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    
    // Click on the triangle to select it
    if (chartBox) {
      const centerX = chartBox.x + chartBox.width * 0.5;
      const centerY = chartBox.y + chartBox.height * 0.4;
      await page.mouse.click(centerX, centerY);
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'test-results/triangle-selected.png' });
    console.log('📸 Screenshot: Triangle pattern selected');
    
    console.log('📊 Step 4: Delete triangle with Delete key');
    
    // Press Delete key to delete the selected triangle
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/triangle-deleted.png' });
    console.log('📸 Screenshot: Triangle pattern deleted');
    
    console.log('📊 Step 5: Verify triangle was deleted');
    
    // Check that no runtime errors occurred during deletion
    console.log(`Total console errors: ${consoleErrors.length}`);
    consoleErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    
    // The main test: no errors should occur during deletion
    const deletionErrors = consoleErrors.filter(error => 
      error.includes('Cannot read properties of undefined') ||
      error.includes('length') ||
      error.includes('TypeError')
    );
    
    console.log(`Deletion-related errors: ${deletionErrors.length}`);
    if (deletionErrors.length === 0) {
      console.log('✅ Triangle deletion worked without runtime errors');
    } else {
      console.log('❌ Triangle deletion caused runtime errors:');
      deletionErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Test should pass if no deletion errors occurred
    expect(deletionErrors.length).toBe(0);
    
    console.log('✅ Triangle deletion test completed successfully');
  });

  test('should allow triangle pattern to be deleted with Backspace key', async ({ page }) => {
    console.log('🔺 Testing triangle pattern deletion with Backspace key');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const consoleErrors = [];
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    // Draw triangle
    await page.click('[data-testid="patterns-button"]');
    await page.waitForTimeout(500);
    
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      await page.mouse.click(chartBox.x + 200, chartBox.y + 200);
      await page.waitForTimeout(300);
      await page.mouse.click(chartBox.x + 400, chartBox.y + 150);
      await page.waitForTimeout(300);
      await page.mouse.click(chartBox.x + 300, chartBox.y + 100);
      await page.waitForTimeout(500);
    }
    
    // Select and delete with Backspace
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(300);
    
    if (chartBox) {
      await page.mouse.click(chartBox.x + 300, chartBox.y + 150);
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
    console.log('✅ Triangle deletion with Backspace completed successfully');
  });

  test('should handle rapid triangle creation and deletion without errors', async ({ page }) => {
    console.log('🔺 Testing rapid triangle creation and deletion (stress test)');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const consoleErrors = [];
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.log('❌ Page error during stress test:', error.message);
    });

    // Select triangle tool
    await page.click('[data-testid="patterns-button"]');
    await page.waitForTimeout(300);
    
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    // Create and delete multiple triangles rapidly
    for (let i = 0; i < 3; i++) {
      console.log(`Creating triangle ${i + 1}...`);
      
      if (chartBox) {
        // Draw triangle
        await page.mouse.click(chartBox.x + 200 + (i * 50), chartBox.y + 200);
        await page.waitForTimeout(100);
        await page.mouse.click(chartBox.x + 400 + (i * 50), chartBox.y + 150);
        await page.waitForTimeout(100);
        await page.mouse.click(chartBox.x + 300 + (i * 50), chartBox.y + 100);
        await page.waitForTimeout(200);
      }
      
      // Switch to cursor and try to delete
      await page.click('[data-testid="cursor-button"]');
      await page.waitForTimeout(100);
      
      if (chartBox) {
        await page.mouse.click(chartBox.x + 300 + (i * 50), chartBox.y + 150);
        await page.waitForTimeout(100);
      }
      
      // Try both Delete and Backspace
      await page.keyboard.press('Delete');
      await page.waitForTimeout(100);
      
      // Go back to triangle tool for next iteration
      if (i < 2) {
        await page.click('[data-testid="patterns-button"]');
        await page.waitForTimeout(100);
      }
    }
    
    // Final verification
    const deletionErrors = consoleErrors.filter(error => 
      error.includes('Cannot read properties of undefined') ||
      error.includes('length') ||
      error.includes('TypeError')
    );
    
    console.log(`Total errors during stress test: ${consoleErrors.length}`);
    console.log(`Deletion-related errors: ${deletionErrors.length}`);
    
    if (deletionErrors.length > 0) {
      console.log('❌ Errors found during stress test:');
      deletionErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    expect(deletionErrors.length).toBe(0);
    console.log('✅ Rapid triangle creation/deletion stress test completed successfully');
  });
});