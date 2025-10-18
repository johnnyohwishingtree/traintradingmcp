const { test, expect } = require('@playwright/test');

/**
 * Test: Trendline text should persist after editing
 *
 * This test reproduces the issue where user cannot change the text
 * of a trendline and have it persist.
 *
 * Expected behavior:
 * 1. User draws a trendline
 * 2. Trendline is selected automatically (shows control points)
 * 3. "T+ Add text" button appears above the trendline
 * 4. User clicks "Add text" button
 * 5. Inline text editor appears with default text "Text"
 * 6. User edits the text to "My Label"
 * 7. User presses Enter to save
 * 8. Text label "My Label" appears on the trendline
 * 9. User clicks away to deselect
 * 10. User clicks on trendline again
 * 11. Text label "My Label" should still be there (PERSISTENCE CHECK)
 */

test.describe('Trendline text persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for chart to load
    await page.waitForSelector('svg', { timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for data to load
  });

  test('should persist text label after editing', async ({ page }) => {
    console.log('📝 Starting text persistence test');

    // Step 1: Click the line tools button to activate drawing mode
    console.log('  1️⃣ Activating trendline drawing mode');
    // The button has data-testid="line-tools-button"
    const trendlineButton = page.locator('[data-testid="line-tools-button"]');
    await trendlineButton.click();
    await page.waitForTimeout(300);

    // Step 2: Find the chart canvas and draw a trendline
    console.log('  2️⃣ Drawing trendline on chart');
    const svgs = await page.locator('svg').all();

    // Find the largest SVG (the chart)
    let chartSvg = null;
    let maxArea = 0;
    for (const svg of svgs) {
      const box = await svg.boundingBox();
      if (box) {
        const area = box.width * box.height;
        if (area > maxArea) {
          maxArea = area;
          chartSvg = svg;
        }
      }
    }

    expect(chartSvg).not.toBeNull();
    const chartBox = await chartSvg.boundingBox();

    // Calculate drawing positions
    const startX = chartBox.x + chartBox.width * 0.3;
    const startY = chartBox.y + chartBox.height * 0.7;
    const endX = chartBox.x + chartBox.width * 0.7;
    const endY = chartBox.y + chartBox.height * 0.3;

    console.log(`  📍 Drawing from (${Math.round(startX)}, ${Math.round(startY)}) to (${Math.round(endX)}, ${Math.round(endY)})`);

    // Draw the trendline: click start, then click end
    await page.mouse.click(startX, startY);
    await page.waitForTimeout(100);
    await page.mouse.click(endX, endY);
    await page.waitForTimeout(500);

    // Step 3: Take screenshot of trendline (should be selected with control points)
    await page.screenshot({ path: 'test-results/01-trendline-drawn.png', fullPage: true });
    console.log('  ✅ Trendline drawn, screenshot saved');

    // Step 4: Check if trendline exists and is selected
    console.log('  3️⃣ Checking if trendline is selected');
    const circles = await page.locator('circle').count();
    console.log(`  ⭕ Found ${circles} circle elements (control points)`);

    // Control points should be visible (at least 2 for start/end)
    expect(circles).toBeGreaterThanOrEqual(2);

    // Step 5: Look for the "Add text" button
    console.log('  4️⃣ Looking for "Add text" button');

    // The AddTextButton renders as SVG text elements with "T+" and "Add text"
    const allText = await page.locator('text').allTextContents();
    console.log(`  📄 All text elements:`, allText);

    const hasAddTextButton = allText.some(t => t.includes('T+') || t.includes('Add text'));
    console.log(`  🔍 Add text button found: ${hasAddTextButton}`);

    if (!hasAddTextButton) {
      console.log('  ❌ Add text button NOT found - this is the bug!');
      console.log('  📸 Taking screenshot of current state');
      await page.screenshot({ path: 'test-results/02-add-text-button-missing.png', fullPage: true });

      // Check console for errors
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));
      console.log('  📋 Console logs:', consoleLogs.filter(log =>
        log.includes('🔘') || log.includes('📝') || log.includes('AddTextButton')
      ));
    }

    // For now, we expect the button to be present
    // If this test fails, it means the AddTextButton is not rendering
    expect(hasAddTextButton).toBe(true);

    // Step 6: Click the "Add text" button
    console.log('  5️⃣ Clicking "Add text" button');

    // Try to click on the "T+" or "Add text" text element
    // Since it's SVG, we need to find it carefully
    const addTextElements = await page.locator('text').all();
    let addTextButton = null;
    for (const el of addTextElements) {
      const text = await el.textContent();
      if (text && text.includes('Add text')) {
        addTextButton = el;
        break;
      }
    }

    expect(addTextButton).not.toBeNull();
    await addTextButton.click();
    await page.waitForTimeout(500);

    // Step 7: Inline editor should appear
    console.log('  6️⃣ Checking for inline text editor');
    await page.screenshot({ path: 'test-results/03-inline-editor-opened.png', fullPage: true });

    const inlineEditor = page.locator('[data-testid="inline-text-editor"]');
    await expect(inlineEditor).toBeVisible({ timeout: 2000 });
    console.log('  ✅ Inline editor is visible');

    // Step 8: Edit the text
    console.log('  7️⃣ Editing text to "My Label"');
    const textInput = page.locator('[data-testid="inline-text-input"]');
    await textInput.fill('My Label');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Step 9: Check if text label appears
    console.log('  8️⃣ Checking if text label "My Label" appears on trendline');
    await page.screenshot({ path: 'test-results/04-text-label-added.png', fullPage: true });

    const allTextAfterEdit = await page.locator('text').allTextContents();
    console.log(`  📄 All text after edit:`, allTextAfterEdit);

    const hasMyLabel = allTextAfterEdit.some(t => t.includes('My Label'));
    console.log(`  🔍 "My Label" found: ${hasMyLabel}`);
    expect(hasMyLabel).toBe(true);

    // Step 10: Click away to deselect
    console.log('  9️⃣ Clicking away to deselect trendline');
    await page.mouse.click(chartBox.x + 100, chartBox.y + 100);
    await page.waitForTimeout(500);

    // Step 11: Click back on the trendline to re-select it
    console.log('  🔟 Re-selecting trendline');
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(500);

    // Step 12: PERSISTENCE CHECK - text label should still be there
    console.log('  ✅ PERSISTENCE CHECK: Verifying "My Label" still exists');
    await page.screenshot({ path: 'test-results/05-persistence-check.png', fullPage: true });

    const allTextFinal = await page.locator('text').allTextContents();
    console.log(`  📄 All text after re-selection:`, allTextFinal);

    const hasMyLabelPersisted = allTextFinal.some(t => t.includes('My Label'));
    console.log(`  🔍 "My Label" persisted: ${hasMyLabelPersisted}`);

    // THIS IS THE CRITICAL CHECK - if this fails, text is not persisting
    expect(hasMyLabelPersisted).toBe(true);

    console.log('  🎉 Test passed! Text persisted correctly');
  });
});
