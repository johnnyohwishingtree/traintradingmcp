const { test, expect } = require('@playwright/test');

test.describe('Drawing Toolbar Basic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow app to fully load
  });

  test('basic toolbar elements are present', async ({ page }) => {
    // Take screenshot first to see what's on screen
    await page.screenshot({ path: 'test-results/toolbar-basic-initial.png' });
    
    // Check if drawing toolbar exists
    const toolbar = page.locator('[data-testid="drawing-toolbar"]');
    console.log('Looking for drawing-toolbar...');
    
    // First check if it exists
    const toolbarCount = await toolbar.count();
    console.log('Toolbar count:', toolbarCount);
    
    if (toolbarCount > 0) {
      // Check if it's visible
      const isVisible = await toolbar.isVisible();
      console.log('Toolbar visible:', isVisible);
      
      // Check cursor button
      const cursorButton = page.locator('[data-testid="cursor-button"]');
      const cursorCount = await cursorButton.count();
      console.log('Cursor button count:', cursorCount);
      
      if (cursorCount > 0) {
        const cursorVisible = await cursorButton.isVisible();
        console.log('Cursor button visible:', cursorVisible);
      }
      
      // Check line tools button
      const lineButton = page.locator('[data-testid="line-tools-button"]');
      const lineCount = await lineButton.count();
      console.log('Line tools button count:', lineCount);
      
      if (lineCount > 0) {
        const lineVisible = await lineButton.isVisible();
        console.log('Line tools button visible:', lineVisible);
        
        // Try clicking it
        console.log('Attempting to click line tools button...');
        await lineButton.click();
        await page.waitForTimeout(500);
        
        // Check for dropdown
        const dropdown = page.locator('[data-testid="line-dropdown"]');
        const dropdownCount = await dropdown.count();
        console.log('Dropdown count after click:', dropdownCount);
        
        if (dropdownCount > 0) {
          const dropdownVisible = await dropdown.isVisible();
          console.log('Dropdown visible after click:', dropdownVisible);
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/toolbar-basic-final.png' });
  });
});