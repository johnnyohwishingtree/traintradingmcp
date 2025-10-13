const { test, expect } = require('@playwright/test');

test.describe('Debug UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('should verify UI elements are visible', async ({ page }) => {
    console.log('🔍 Debugging UI visibility...');

    // Take full page screenshot
    await page.screenshot({ path: 'test-results/debug-full-page.png', fullPage: true });

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Check for drawing toolbar
    const toolbar = await page.locator('.drawing-toolbar');
    const toolbarVisible = await toolbar.isVisible();
    console.log('📐 Drawing toolbar visible:', toolbarVisible);
    
    if (toolbarVisible) {
      const toolbarBox = await toolbar.boundingBox();
      console.log('📐 Toolbar position:', toolbarBox);
      
      // Look for specific buttons
      const cursorBtn = await page.locator('button').filter({ hasText: 'Cursor' });
      const trendChannelBtn = await page.locator('button').filter({ hasText: 'Trend Channel' });
      
      console.log('🖱️ Cursor button exists:', await cursorBtn.count());
      console.log('📊 Trend Channel button exists:', await trendChannelBtn.count());
      
      // Check all buttons in toolbar
      const allButtons = await page.locator('.drawing-toolbar button').all();
      console.log('🔘 Total buttons in toolbar:', allButtons.length);
      
      for (let i = 0; i < allButtons.length; i++) {
        const btnText = await allButtons[i].textContent();
        const btnVisible = await allButtons[i].isVisible();
        console.log(`   Button ${i}: "${btnText}" - Visible: ${btnVisible}`);
      }
    }

    // Check alternative selectors
    const allButtons = await page.locator('button').all();
    console.log('🔘 Total buttons on page:', allButtons.length);
    
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const btnText = await allButtons[i].textContent();
      const btnVisible = await allButtons[i].isVisible();
      console.log(`   Page Button ${i}: "${btnText}" - Visible: ${btnVisible}`);
    }

    // Try to find trend channel by other means
    const trendChannelElements = await page.locator('*').filter({ hasText: 'Trend Channel' }).all();
    console.log('📊 Elements containing "Trend Channel":', trendChannelElements.length);

    // Print any console errors
    if (errors.length > 0) {
      console.log('❌ Console errors found:', errors);
    }

    // Final screenshot with debug overlay
    await page.screenshot({ path: 'test-results/debug-final.png' });
  });
});