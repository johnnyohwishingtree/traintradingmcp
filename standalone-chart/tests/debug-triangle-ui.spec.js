const { test, expect } = require('@playwright/test');

test.describe('Debug Triangle UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('should check available UI elements for triangle patterns', async ({ page }) => {
    console.log('🔍 Debugging triangle pattern UI elements...');

    // Take full page screenshot
    await page.screenshot({ path: 'test-results/debug-triangle-full-page.png', fullPage: true });

    // Check for drawing toolbar
    const toolbar = await page.locator('.drawing-toolbar');
    const toolbarVisible = await toolbar.isVisible();
    console.log('📐 Drawing toolbar visible:', toolbarVisible);
    
    if (toolbarVisible) {
      // Look for buttons
      const allButtons = await page.locator('.drawing-toolbar button').all();
      console.log('🔘 Buttons in toolbar:', allButtons.length);
      
      for (let i = 0; i < allButtons.length; i++) {
        const btnText = await allButtons[i].textContent();
        const btnVisible = await allButtons[i].isVisible();
        const btnTitle = await allButtons[i].getAttribute('title');
        console.log(`   Button ${i}: "${btnText}" - Title: "${btnTitle}" - Visible: ${btnVisible}`);
      }
    }

    // Check for any patterns-related elements
    const patternsElements = await page.locator('*').filter({ hasText: 'patterns' }).all();
    console.log('🔺 Elements containing "patterns":', patternsElements.length);
    
    const triangleElements = await page.locator('*').filter({ hasText: 'Triangle' }).all();
    console.log('🔺 Elements containing "Triangle":', triangleElements.length);

    // Try clicking on different areas that might activate patterns
    console.log('🎯 Trying to find patterns button...');
    
    // Check if there's a patterns button by data-testid or other selectors
    try {
      const patternsBtn = await page.locator('[data-testid*="patterns"]').first();
      if (await patternsBtn.isVisible()) {
        console.log('✅ Found patterns button by testid');
        await patternsBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/debug-triangle-patterns-clicked.png' });
      }
    } catch (e) {
      console.log('❌ No patterns button by testid');
    }

    // Try other approaches
    try {
      const triangleBtn = await page.locator('button').filter({ hasText: /triangle/i }).first();
      if (await triangleBtn.isVisible()) {
        console.log('✅ Found triangle button by text');
      }
    } catch (e) {
      console.log('❌ No triangle button by text');
    }

    console.log('✅ Triangle UI debug completed');
  });
});