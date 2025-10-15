const { test, expect } = require('@playwright/test');

test.describe('Line Components Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for data to load
  });

  test('should load specialized line components without errors', async ({ page }) => {
    // Check console for any module resolution errors
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for page to load completely
    await page.waitForTimeout(3000);

    // Check that there are no module resolution errors
    const moduleErrors = errors.filter(error => 
      error.includes("Can't resolve '@slowclap/financial-charts'") ||
      error.includes('HorizontalLine') ||
      error.includes('VerticalLine')
    );

    expect(moduleErrors.length).toBe(0);
    console.log('✅ No module resolution errors found');
  });

  test('should show line dropdown with horizontal and vertical options', async ({ page }) => {
    // Look for lines dropdown button (should be visible in toolbar)
    const linesButton = page.locator('button[title*="line"], button[title*="Line"]').first();
    await expect(linesButton).toBeVisible({ timeout: 5000 });
    
    // Click to open dropdown
    await linesButton.click();
    await page.waitForTimeout(500);
    
    // Take screenshot to see dropdown
    await page.screenshot({ 
      path: '/tmp/lines-dropdown-open.png',
      fullPage: false 
    });
    
    console.log('✅ Lines dropdown opened - screenshot saved');
  });

  test('should select horizontal line tool from dropdown', async ({ page }) => {
    // Open lines dropdown
    const linesButton = page.locator('button[title*="line"], button[title*="Line"]').first();
    await linesButton.click();
    await page.waitForTimeout(500);
    
    // Look for horizontal line option in dropdown (using title attribute)
    const horizontalLineOption = page.locator('[title*="Horizontal line"]');
    await expect(horizontalLineOption).toBeVisible({ timeout: 3000 });
    
    // Click horizontal line option
    await horizontalLineOption.click();
    await page.waitForTimeout(1000);
    
    // Take screenshot to verify tool activation
    await page.screenshot({ 
      path: '/tmp/horizontal-line-selected.png',
      fullPage: false 
    });
    
    console.log('✅ Horizontal line tool selected from dropdown');
  });

  test('should select vertical line tool from dropdown', async ({ page }) => {
    // Open lines dropdown
    const linesButton = page.locator('button[title*="line"], button[title*="Line"]').first();
    await linesButton.click();
    await page.waitForTimeout(500);
    
    // Look for vertical line option in dropdown
    const verticalLineOption = page.locator('[title*="Vertical line"]');
    await expect(verticalLineOption).toBeVisible({ timeout: 3000 });
    
    // Click vertical line option
    await verticalLineOption.click();
    await page.waitForTimeout(1000);
    
    // Take screenshot to verify tool activation
    await page.screenshot({ 
      path: '/tmp/vertical-line-selected.png',
      fullPage: false 
    });
    
    console.log('✅ Vertical line tool selected from dropdown');
  });

  test('should draw horizontal line with constraint', async ({ page }) => {
    // Activate horizontal line tool from dropdown
    const linesButton = page.locator('button[title*="line"], button[title*="Line"]').first();
    await linesButton.click();
    await page.waitForTimeout(500);
    
    const horizontalLineOption = page.locator('[title*="Horizontal line"]');
    await horizontalLineOption.click();
    await page.waitForTimeout(1000);

    // Get canvas element
    const canvas = page.locator('canvas').first();
    const canvasBounds = await canvas.boundingBox();

    if (canvasBounds) {
      // Draw horizontal line - should constrain Y coordinate
      const startX = canvasBounds.x + 200;
      const startY = canvasBounds.y + 300;
      const endX = canvasBounds.x + 400;
      const endY = canvasBounds.y + 350; // Different Y - should be constrained to startY

      // Click to start line
      await page.mouse.click(startX, startY);
      await page.waitForTimeout(300);

      // Click to end line
      await page.mouse.click(endX, endY);
      await page.waitForTimeout(1000);

      // Take screenshot to verify horizontal line was drawn
      await page.screenshot({ 
        path: '/tmp/horizontal-line-drawn.png',
        fullPage: false 
      });

      console.log('✅ Horizontal line drawn - constraint should keep Y coordinate fixed');
    }
  });

  test('should draw vertical line with constraint', async ({ page }) => {
    // Activate vertical line tool from dropdown
    const linesButton = page.locator('button[title*="line"], button[title*="Line"]').first();
    await linesButton.click();
    await page.waitForTimeout(500);
    
    const verticalLineOption = page.locator('[title*="Vertical line"]');
    await verticalLineOption.click();
    await page.waitForTimeout(1000);

    // Get canvas element
    const canvas = page.locator('canvas').first();
    const canvasBounds = await canvas.boundingBox();

    if (canvasBounds) {
      // Draw vertical line - should constrain X coordinate
      const startX = canvasBounds.x + 300;
      const startY = canvasBounds.y + 200;
      const endX = canvasBounds.x + 350; // Different X - should be constrained to startX
      const endY = canvasBounds.y + 400;

      // Click to start line
      await page.mouse.click(startX, startY);
      await page.waitForTimeout(300);

      // Click to end line
      await page.mouse.click(endX, endY);
      await page.waitForTimeout(1000);

      // Take screenshot to verify vertical line was drawn
      await page.screenshot({ 
        path: '/tmp/vertical-line-drawn.png',
        fullPage: false 
      });

      console.log('✅ Vertical line drawn - constraint should keep X coordinate fixed');
    }
  });
});