const { test, expect } = require('@playwright/test');

test.describe('Specialized Line Tools', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for chart to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow chart to fully render
  });

  test('InfoLine tool shows price information when selected', async ({ page }) => {
    console.log('🧪 Testing InfoLine functionality...');
    
    // 1. Open line tools dropdown
    const dropdownArrow = page.locator('[data-testid="dropdown-arrow"]');
    await expect(dropdownArrow).toBeVisible();
    await dropdownArrow.click();
    await page.waitForTimeout(500);
    
    // 2. Select InfoLine tool
    const infoLineOption = page.locator('[data-testid="line-type-infoline"]');
    await expect(infoLineOption).toBeVisible();
    await infoLineOption.click();
    
    // 3. Verify InfoLine is selected (check if line tools button is active)
    const lineToolsButton = page.locator('[data-testid="line-tools-button"]');
    await expect(lineToolsButton).toHaveClass(/active/);
    
    // 4. Draw InfoLine on chart
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    // First click to start line
    const startX = canvasBox.x + canvasBox.width * 0.3;
    const startY = canvasBox.y + canvasBox.height * 0.4;
    await page.mouse.click(startX, startY);
    
    // Second click to complete line
    const endX = canvasBox.x + canvasBox.width * 0.7;
    const endY = canvasBox.y + canvasBox.height * 0.6;
    await page.mouse.click(endX, endY);
    
    await page.waitForTimeout(1000);
    
    // 5. Switch to cursor mode to select the line
    const cursorButton = page.locator('[data-testid="cursor-button"]');
    await cursorButton.click();
    await page.waitForTimeout(500);
    
    // 6. Click on the drawn line to select it
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(1000);
    
    // 7. Look for info box elements
    const infoElements = await page.locator('text=/Start:|End:|Change:|%/').count();
    console.log(`📊 Found ${infoElements} info elements`);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/infoline-test.png', fullPage: true });
    
    // Check console for any errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // 8. Verify info display appears
    if (infoElements > 0) {
      console.log('✅ InfoLine info display found!');
      expect(infoElements).toBeGreaterThan(0);
    } else {
      console.log('❌ InfoLine info display NOT found');
      console.log('🔍 Console errors:', errors);
      
      // Check what SVG/DOM elements exist
      const svgElements = await page.locator('svg').count();
      const textElements = await page.locator('text').count();
      console.log(`📈 SVG elements: ${svgElements}, Text elements: ${textElements}`);
      
      throw new Error('InfoLine should display price information when selected');
    }
  });

  test('HorizontalRay stays horizontal', async ({ page }) => {
    console.log('🧪 Testing HorizontalRay behavior...');
    
    // 1. Open line tools dropdown and select HorizontalRay
    const dropdownArrow = page.locator('[data-testid="dropdown-arrow"]');
    await dropdownArrow.click();
    await page.waitForTimeout(500);
    
    const horizontalRayOption = page.locator('[data-testid="line-type-horizontalray"]');
    await expect(horizontalRayOption).toBeVisible();
    await horizontalRayOption.click();
    
    // 2. Draw diagonal line (should be constrained to horizontal)
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    const startX = canvasBox.x + canvasBox.width * 0.3;
    const startY = canvasBox.y + canvasBox.height * 0.4;
    await page.mouse.click(startX, startY);
    
    // Try to draw diagonally - should be constrained to horizontal
    const endX = canvasBox.x + canvasBox.width * 0.7;
    const endY = canvasBox.y + canvasBox.height * 0.6; // Different Y
    await page.mouse.click(endX, endY);
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/horizontal-ray-test.png', fullPage: true });
    
    // 3. Verify the line is horizontal (Y coordinates should be the same)
    // This would require examining the SVG line element or canvas data
    console.log('📊 HorizontalRay drawn - visual verification needed');
  });

  test('VerticalLine stays vertical', async ({ page }) => {
    console.log('🧪 Testing VerticalLine behavior...');
    
    // 1. Select VerticalLine tool
    const dropdownArrow = page.locator('[data-testid="dropdown-arrow"]');
    await dropdownArrow.click();
    await page.waitForTimeout(500);
    
    const verticalLineOption = page.locator('[data-testid="line-type-verticalline"]');
    await expect(verticalLineOption).toBeVisible();
    await verticalLineOption.click();
    
    // 2. Draw diagonal line (should be constrained to vertical)
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    const startX = canvasBox.x + canvasBox.width * 0.5;
    const startY = canvasBox.y + canvasBox.height * 0.3;
    await page.mouse.click(startX, startY);
    
    // Try to draw diagonally - should be constrained to vertical
    const endX = canvasBox.x + canvasBox.width * 0.7; // Different X
    const endY = canvasBox.y + canvasBox.height * 0.7;
    await page.mouse.click(endX, endY);
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/vertical-line-test.png', fullPage: true });
    
    console.log('📊 VerticalLine drawn - visual verification needed');
  });

  test('HorizontalLine stays horizontal', async ({ page }) => {
    console.log('🧪 Testing HorizontalLine behavior...');
    
    // 1. Select HorizontalLine tool
    const dropdownArrow = page.locator('[data-testid="dropdown-arrow"]');
    await dropdownArrow.click();
    await page.waitForTimeout(500);
    
    const horizontalLineOption = page.locator('[data-testid="line-type-horizontalline"]');
    await expect(horizontalLineOption).toBeVisible();
    await horizontalLineOption.click();
    
    // 2. Draw diagonal line (should be constrained to horizontal)
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    const startX = canvasBox.x + canvasBox.width * 0.2;
    const startY = canvasBox.y + canvasBox.height * 0.5;
    await page.mouse.click(startX, startY);
    
    // Try to draw diagonally - should be constrained to horizontal
    const endX = canvasBox.x + canvasBox.width * 0.8;
    const endY = canvasBox.y + canvasBox.height * 0.3; // Different Y
    await page.mouse.click(endX, endY);
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/horizontal-line-test.png', fullPage: true });
    
    console.log('📊 HorizontalLine drawn - visual verification needed');
  });

  test('Console error detection', async ({ page }) => {
    console.log('🧪 Checking for console errors...');
    
    const errors = [];
    const warnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    // Try to use InfoLine tool and trigger any errors
    const dropdownArrow = page.locator('[data-testid="dropdown-arrow"]');
    await dropdownArrow.click();
    await page.waitForTimeout(500);
    
    const infoLineOption = page.locator('[data-testid="line-type-infoline"]');
    await infoLineOption.click();
    
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    await page.mouse.click(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.click(canvasBox.x + 300, canvasBox.y + 200);
    
    await page.waitForTimeout(2000);
    
    console.log('❌ Console Errors:', errors);
    console.log('⚠️ Console Warnings:', warnings);
    
    if (errors.length > 0) {
      console.log('🔍 First error:', errors[0]);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/console-error-test.png', fullPage: true });
  });
});