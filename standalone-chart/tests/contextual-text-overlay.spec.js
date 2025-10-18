const { test, expect } = require('@playwright/test');

/**
 * Contextual Text Overlay Test
 *
 * Tests the new contextual "Add text" feature that appears when hovering
 * over selected interactive components (trendlines, fibonacci, triangles, etc.)
 *
 * Expected Behavior:
 * 1. User draws an interactive component (e.g., trendline)
 * 2. User switches to cursor mode and selects the component
 * 3. User hovers over the selected component
 * 4. A green "Add text" button appears above the component
 * 5. User clicks the button
 * 6. Text input field appears
 * 7. User types text and presses Enter
 * 8. Text label is added to the chart at the component's position
 */

test.describe('Contextual Text Overlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for chart to fully load
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('✅ Chart loaded successfully');
  });

  test('should show "Add text" button when hovering over selected trendline', async ({ page }) => {
    console.log('🧪 TEST: Contextual Text Overlay - Trendline');

    // Step 1: Draw a trendline (open dropdown and select trendline)
    console.log('📝 Step 1: Drawing trendline...');

    // Click the dropdown arrow to open line tools
    await page.click('[data-testid="dropdown-arrow"]');
    await page.waitForTimeout(300);

    // Select "Trend line" from dropdown
    await page.click('[data-testid="line-type-trendline"]');
    await page.waitForTimeout(300);

    const chartCanvas = await page.locator('canvas').first();
    const boundingBox = await chartCanvas.boundingBox();

    // Draw line from (100, 300) to (200, 250)
    const startX = boundingBox.x + 100;
    const startY = boundingBox.y + 300;
    const endX = boundingBox.x + 200;
    const endY = boundingBox.y + 250;

    await page.mouse.click(startX, startY);
    await page.mouse.click(endX, endY);
    await page.waitForTimeout(500);

    console.log('✅ Trendline drawn');

    // Step 2: Switch to cursor mode to select the trendline
    console.log('📝 Step 2: Switching to cursor mode...');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(300);

    // Step 3: Click on the trendline to select it
    console.log('📝 Step 3: Selecting trendline...');
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(500);

    console.log('✅ Trendline selected');

    // Step 4: Hover over the selected trendline
    console.log('📝 Step 4: Hovering over selected trendline...');
    await page.mouse.move(midX, midY);
    await page.waitForTimeout(300);

    // Step 5: Verify "Add text" button appears
    console.log('📝 Step 5: Verifying "Add text" button appears...');
    const addTextButton = page.locator('[data-testid="add-text-button"]');

    // Wait for button to appear (with timeout)
    try {
      await addTextButton.waitFor({ state: 'visible', timeout: 2000 });
      console.log('✅ "Add text" button is visible');
    } catch (error) {
      console.error('❌ "Add text" button did not appear');

      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/contextual-text-button-not-visible.png' });

      throw new Error('Contextual "Add text" button did not appear when hovering over selected trendline');
    }

    // Verify button text
    await expect(addTextButton).toContainText('Add text');
    console.log('✅ Button text verified');

    // Step 6: Click the "Add text" button
    console.log('📝 Step 6: Clicking "Add text" button...');
    await addTextButton.click();
    await page.waitForTimeout(300);

    // Step 7: Verify text input appears
    console.log('📝 Step 7: Verifying text input appears...');
    const textInput = page.locator('[data-testid="text-input"]');
    await expect(textInput).toBeVisible();
    console.log('✅ Text input is visible');

    // Step 8: Type text and press Enter
    console.log('📝 Step 8: Typing text and pressing Enter...');
    const testText = 'Support Level';
    await textInput.fill(testText);
    await textInput.press('Enter');
    await page.waitForTimeout(500);

    console.log('✅ Text submitted');

    // Step 9: Verify text input is hidden after submission
    console.log('📝 Step 9: Verifying text input is hidden...');
    await expect(textInput).not.toBeVisible();
    console.log('✅ Text input hidden');

    // Step 10: Take final screenshot
    await page.screenshot({ path: 'test-results/contextual-text-added.png' });
    console.log('✅ Screenshot saved: test-results/contextual-text-added.png');

    console.log('🎉 TEST PASSED: Contextual text overlay works correctly!');
  });

  test('should hide "Add text" button when moving mouse away from selected component', async ({ page }) => {
    console.log('🧪 TEST: Contextual Text Button Hiding Behavior');

    // Draw and select a trendline (open dropdown and select trendline)
    await page.click('[data-testid="dropdown-arrow"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendline"]');
    await page.waitForTimeout(300);

    const chartCanvas = await page.locator('canvas').first();
    const boundingBox = await chartCanvas.boundingBox();

    const startX = boundingBox.x + 100;
    const startY = boundingBox.y + 300;
    const endX = boundingBox.x + 200;
    const endY = boundingBox.y + 250;

    await page.mouse.click(startX, startY);
    await page.mouse.click(endX, endY);
    await page.waitForTimeout(500);

    // Switch to cursor mode and select
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(300);

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(500);

    // Hover to show button
    await page.mouse.move(midX, midY);
    await page.waitForTimeout(300);

    const addTextButton = page.locator('[data-testid="add-text-button"]');
    await expect(addTextButton).toBeVisible();
    console.log('✅ Button appeared on hover');

    // Move mouse away from the trendline
    await page.mouse.move(boundingBox.x + 400, boundingBox.y + 100);
    await page.waitForTimeout(500);

    // Button should be hidden
    await expect(addTextButton).not.toBeVisible();
    console.log('✅ Button hidden when mouse moved away');

    console.log('🎉 TEST PASSED: Button hiding behavior works correctly!');
  });

  test('should allow canceling text input with Escape key', async ({ page }) => {
    console.log('🧪 TEST: Cancel Text Input with Escape');

    // Draw and select a trendline (open dropdown and select trendline)
    await page.click('[data-testid="dropdown-arrow"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendline"]');
    await page.waitForTimeout(300);

    const chartCanvas = await page.locator('canvas').first();
    const boundingBox = await chartCanvas.boundingBox();

    const startX = boundingBox.x + 100;
    const startY = boundingBox.y + 300;
    const endX = boundingBox.x + 200;
    const endY = boundingBox.y + 250;

    await page.mouse.click(startX, startY);
    await page.mouse.click(endX, endY);
    await page.waitForTimeout(500);

    // Switch to cursor mode and select
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(300);

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(500);

    // Hover and click "Add text" button
    await page.mouse.move(midX, midY);
    await page.waitForTimeout(300);

    const addTextButton = page.locator('[data-testid="add-text-button"]');
    await addTextButton.click();
    await page.waitForTimeout(300);

    // Type some text
    const textInput = page.locator('[data-testid="text-input"]');
    await textInput.fill('This text should be canceled');

    // Press Escape to cancel
    await textInput.press('Escape');
    await page.waitForTimeout(300);

    // Verify input is hidden
    await expect(textInput).not.toBeVisible();
    console.log('✅ Text input hidden after Escape');

    // Verify "Add text" button reappears when hovering again
    await page.mouse.move(midX + 10, midY + 10); // Move slightly away
    await page.mouse.move(midX, midY); // Move back
    await page.waitForTimeout(300);

    await expect(addTextButton).toBeVisible();
    console.log('✅ "Add text" button reappeared after cancel');

    console.log('🎉 TEST PASSED: Escape key cancellation works correctly!');
  });
});
