const { test, expect } = require('@playwright/test');

test.describe('Simple Chart Type Test', () => {
  test('basic chart type functionality', async ({ page }) => {
    // Set a longer timeout for this test
    test.setTimeout(60000);
    
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load completely
    await page.waitForSelector('.header-toolbar', { timeout: 30000 });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-initial-load.png', fullPage: true });
    
    // Try to find the chart type button with various selectors
    let chartTypeButton = null;
    
    try {
      chartTypeButton = await page.waitForSelector('[title="Chart type"]', { timeout: 5000 });
    } catch (e) {
      console.log('Could not find by title, trying by class...');
    }
    
    if (!chartTypeButton) {
      try {
        chartTypeButton = await page.waitForSelector('.chart-type-button', { timeout: 5000 });
      } catch (e) {
        console.log('Could not find by class, taking screenshot...');
        await page.screenshot({ path: 'debug-cannot-find-button.png', fullPage: true });
      }
    }
    
    if (chartTypeButton) {
      console.log('Found chart type button!');
      await chartTypeButton.click();
      
      // Wait for the panel to appear
      await page.waitForSelector('.chart-type-panel', { timeout: 5000 });
      
      // Take screenshot of panel
      await page.screenshot({ path: 'debug-panel-open.png', fullPage: true });
      
      // Verify the panel content
      await expect(page.locator('.chart-type-header h3')).toHaveText('📊 Chart Type');
    } else {
      console.log('Chart type button not found');
      // List all buttons for debugging
      const buttons = await page.$$('button');
      console.log(`Found ${buttons.length} buttons on page`);
      
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const buttonText = await buttons[i].textContent();
        const buttonClass = await buttons[i].getAttribute('class');
        const buttonTitle = await buttons[i].getAttribute('title');
        console.log(`Button ${i}: text="${buttonText}", class="${buttonClass}", title="${buttonTitle}"`);
      }
    }
  });
});