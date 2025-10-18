const { test, expect } = require('@playwright/test');

test.describe('Text Label Functionality', () => {
  test('should add text label to trendline', async ({ page }) => {
    // Capture console logs
    page.on('console', msg => {
      if (msg.text().includes('label') || msg.text().includes('text') || msg.text().includes('InteractiveText')) {
        console.log('🔍 Browser console:', msg.text());
      }
    });

    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for chart to load
    await page.waitForSelector('text=Volume', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('✅ Chart loaded');

    // Click trendline tool
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(500);

    console.log('✅ Trendline tool activated');

    // Draw a trendline using mouse drag
    const startX = 300;
    const startY = 400;
    const endX = 800;
    const endY = 250;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    console.log('✅ Trendline drawn');

    // Click cursor/selection tool
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);

    console.log('✅ Selection tool activated');

    // Click on the trendline to select it
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    await page.mouse.click(midX, midY);
    await page.waitForTimeout(1000);

    console.log('✅ Clicked on trendline');

    // Take a screenshot to see if trendline is selected
    await page.screenshot({ path: 'test-results/trendline-selected.png' });

    console.log('✅ Screenshot taken');

    // Look for "Add text" button - it should appear above selected trendline
    // The button position is at the midpoint, offset by -40px in Y
    const buttonX = midX;
    const buttonY = midY - 40;

    // Try clicking where the button should be
    await page.mouse.click(buttonX, buttonY);
    await page.waitForTimeout(500);

    console.log('✅ Clicked add text button area');

    // Wait for inline editor to appear
    const inlineEditor = page.locator('[data-testid="inline-text-editor"]');
    await inlineEditor.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Inline editor appeared');

    // Find the input field and type text
    const input = page.locator('[data-testid="inline-text-input"]');
    await input.waitFor({ state: 'visible', timeout: 2000 });

    // Clear the default text and type new text
    await input.fill('Custom Label');
    console.log('✅ Typed "Custom Label" into inline editor');

    // Press Enter to save
    await input.press('Enter');
    await page.waitForTimeout(500);

    console.log('✅ Pressed Enter to save');

    // Verify inline editor is gone
    await inlineEditor.waitFor({ state: 'hidden', timeout: 2000 });
    console.log('✅ Inline editor closed');

    // Take final screenshot
    await page.screenshot({ path: 'test-results/text-label-added.png' });

    console.log('✅ Test complete - check screenshots');
  });
});
