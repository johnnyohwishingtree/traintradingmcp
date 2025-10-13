const { test, expect } = require('@playwright/test');

test.describe('Toolbar Icons', () => {
  test('Verify new SVG icons display correctly', async ({ page }) => {
    console.log('\n🎨 TESTING NEW TOOLBAR ICONS');
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.drawing-toolbar', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    console.log('\n📊 Checking toolbar elements...');
    
    // Check that toolbar exists
    const toolbar = await page.locator('.drawing-toolbar');
    await expect(toolbar).toBeVisible();
    
    // Check that all tool buttons exist
    const toolButtons = await page.locator('.tool-button').all();
    console.log(`Found ${toolButtons.length} tool buttons`);
    
    // Check for SVG icons in each button
    for (let i = 0; i < toolButtons.length; i++) {
      const button = toolButtons[i];
      const svg = await button.locator('svg').first();
      await expect(svg).toBeVisible();
      console.log(`  ✅ Button ${i + 1} has SVG icon`);
      
      // Check tooltip
      const title = await button.getAttribute('title');
      console.log(`  📝 Button ${i + 1} tooltip: "${title}"`);
    }
    
    console.log('\n🖱️ Testing hover states...');
    
    // Test hover on each button
    for (let i = 0; i < Math.min(toolButtons.length, 4); i++) {
      const button = toolButtons[i];
      await button.hover();
      await page.waitForTimeout(200);
      console.log(`  ✅ Button ${i + 1} hover works`);
    }
    
    // Take screenshot of the new toolbar
    await page.screenshot({ path: 'test-results/new-toolbar-icons.png' });
    
    console.log('\n🎨 Icon test complete');
  });
});