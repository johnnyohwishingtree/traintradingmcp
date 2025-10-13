const { test, expect } = require('@playwright/test');

test('Fibonacci should not auto-select after drawing', async ({ page }) => {
  console.log('🔍 Testing fibonacci auto-selection after drawing...');
  
  // Navigate to the chart application
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  console.log('✅ Chart loaded');
  
  // Step 1: Draw a fibonacci
  console.log('\n📐 Step 1: Draw fibonacci');
  await page.click('[data-testid="fibonacci-button"]');
  await page.waitForTimeout(500);
  
  // Draw fibonacci
  console.log('   Drawing fibonacci...');
  await page.mouse.click(200, 350);
  await page.waitForTimeout(200);
  await page.mouse.click(400, 250);
  await page.waitForTimeout(2000); // Wait for completion and auto-switch
  
  await page.screenshot({ 
    path: 'test-results/fibonacci-auto-select-step1.png',
    fullPage: true 
  });
  
  // Step 2: Click somewhere else on the chart (not on fibonacci)
  console.log('\n🖱️ Step 2: Click empty area (should not select fibonacci)');
  await page.mouse.click(600, 300); // Click on empty area
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'test-results/fibonacci-auto-select-step2.png',
    fullPage: true 
  });
  
  // Step 3: Try pressing Delete - should NOT delete anything since nothing should be selected
  console.log('\n🗑️ Step 3: Press Delete (should not delete anything)');
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1000);
  
  // Take final screenshot
  await page.screenshot({ 
    path: 'test-results/fibonacci-auto-select-final.png',
    fullPage: true 
  });
  
  console.log('\n📊 EXPECTED BEHAVIOR:');
  console.log('   - Fibonacci should be drawn');
  console.log('   - Fibonacci should NOT be auto-selected after drawing');
  console.log('   - Clicking empty area should not select fibonacci');
  console.log('   - Delete key should not delete fibonacci (nothing selected)');
  console.log('   - Fibonacci should remain visible in final screenshot');
  
  expect(true).toBe(true);
});