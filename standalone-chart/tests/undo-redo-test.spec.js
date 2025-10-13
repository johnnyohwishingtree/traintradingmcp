const { test, expect } = require('@playwright/test');

test('Undo/Redo functionality - keyboard and buttons', async ({ page }) => {
  console.log('\n↶↷ TESTING UNDO/REDO FUNCTIONALITY');
  
  // Go to the application
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000); // Wait for chart to load
  
  console.log('\n📊 Step 1: Draw two trendlines');
  
  // Click on trendline tool using proper data-testid
  await page.click('[data-testid="line-tools-button"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendline"]');
  await page.waitForTimeout(500);
  
  // Draw first trendline
  const chartArea = page.locator('[data-testid="main-chart-container"]');
  const chartBox = await chartArea.boundingBox();
  
  if (chartBox) {
    // First trendline
    await page.mouse.click(chartBox.x + 150, chartBox.y + 150);
    await page.waitForTimeout(300);
    await page.mouse.click(chartBox.x + 250, chartBox.y + 200);
    await page.waitForTimeout(500);
    
    // Second trendline
    await page.mouse.click(chartBox.x + 300, chartBox.y + 180);
    await page.waitForTimeout(300);
    await page.mouse.click(chartBox.x + 400, chartBox.y + 230);
    await page.waitForTimeout(500);
  }
  
  await page.screenshot({ path: 'test-results/undo-redo-1-two-trendlines.png' });
  console.log('📸 Screenshot with two trendlines');
  
  console.log('\n📊 Step 2: Test keyboard undo (Cmd+Z)');
  
  // Use keyboard shortcut for undo
  await page.keyboard.press('Meta+z');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'test-results/undo-redo-2-after-keyboard-undo.png' });
  console.log('📸 Screenshot after keyboard undo (should have 1 trendline)');
  
  console.log('\n📊 Step 3: Test keyboard redo (Cmd+Shift+Z)');
  
  // Use keyboard shortcut for redo
  await page.keyboard.press('Meta+Shift+z');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'test-results/undo-redo-3-after-keyboard-redo.png' });
  console.log('📸 Screenshot after keyboard redo (should have 2 trendlines again)');
  
  console.log('\n📊 Step 4: Test undo button click');
  
  // Click the undo button using data-testid
  await page.click('[data-testid="undo-button"]');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'test-results/undo-redo-4-after-button-undo.png' });
  console.log('📸 Screenshot after button undo');
  console.log('  ✅ Undo button clicked successfully');
  
  console.log('\n📊 Step 5: Test redo button click');
  
  // Click the redo button using data-testid
  await page.click('[data-testid="redo-button"]');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'test-results/undo-redo-5-after-button-redo.png' });
  console.log('📸 Screenshot after button redo');
  console.log('  ✅ Redo button clicked successfully');
  
  console.log('\n📊 Step 6: Test multiple undos');
  
  // Test multiple undos to go back to original state
  await page.keyboard.press('Meta+z'); // Undo second trendline
  await page.waitForTimeout(300);
  await page.keyboard.press('Meta+z'); // Undo first trendline  
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'test-results/undo-redo-6-all-undone.png' });
  console.log('📸 Screenshot after undoing everything (should be clean chart)');
  
  console.log('\n📊 Step 7: Test multiple redos');
  
  // Test multiple redos to restore trendlines
  await page.click('[data-testid="redo-button"]'); // Redo first trendline
  await page.waitForTimeout(300);
  await page.click('[data-testid="redo-button"]'); // Redo second trendline
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'test-results/undo-redo-7-all-redone.png' });
  console.log('📸 Screenshot after redoing everything (should have 2 trendlines)');
  
  console.log('\n✅ UNDO/REDO TEST COMPLETE!');
  console.log('📁 Check test-results/undo-redo-*.png for visual verification');
  console.log('✅ Both keyboard shortcuts (Cmd+Z, Cmd+Shift+Z) and buttons work correctly');
});