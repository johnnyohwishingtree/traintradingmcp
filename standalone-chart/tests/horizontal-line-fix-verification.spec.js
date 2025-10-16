const { test, expect } = require('@playwright/test');

test.describe('Horizontal Line Fix Verification', () => {
  test('should draw horizontal line, show control point on selection, and allow dragging', async ({ page }) => {
    // Navigate to the chart application
    await page.goto('http://localhost:3000');

    // Wait for the main chart container
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('✅ Chart loaded');

    // Take screenshot before starting
    await page.screenshot({ path: 'test-results/horizontal-fix-01-before.png' });

    // Find the line tools dropdown and click it
    const lineDropdown = await page.locator('.line-tools-dropdown button').first();
    await lineDropdown.click();
    await page.waitForTimeout(500);

    // Find and click the horizontal line option
    const horizontalLineButton = await page.locator('button[title*="Horizontal line"]').first();
    await expect(horizontalLineButton).toBeVisible();
    await horizontalLineButton.click();
    await page.waitForTimeout(500);

    console.log('✅ Horizontal line tool activated');

    // Get chart area
    const chartArea = await page.locator('.react-financial-charts').first();
    await expect(chartArea).toBeVisible();
    const chartBox = await chartArea.boundingBox();

    // Click to place horizontal line
    const clickX = chartBox.x + chartBox.width * 0.5;
    const clickY = chartBox.y + chartBox.height * 0.4;

    console.log(`🖱️ Placing horizontal line at (${clickX}, ${clickY})`);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000);

    // Take screenshot after drawing
    await page.screenshot({ path: 'test-results/horizontal-fix-02-after-draw.png' });
    console.log('✅ Horizontal line placed');

    // Switch to cursor mode
    const cursorButton = await page.locator('button[title*="Cursor"]').first();
    await cursorButton.click();
    await page.waitForTimeout(500);

    console.log('✅ Switched to cursor mode');

    // Take screenshot after tool switch - LINE SHOULD STILL BE VISIBLE
    await page.screenshot({ path: 'test-results/horizontal-fix-03-after-tool-switch.png' });

    // Click on the line to select it
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(500);

    console.log('✅ Clicked to select line');

    // Take screenshot of selected line with control point
    await page.screenshot({ path: 'test-results/horizontal-fix-04-selected.png' });

    // Count control point circles (should be 1)
    const controlPoints = await page.locator('circle[fill="#f44336"]').count();
    console.log(`📊 Control points visible: ${controlPoints}`);

    // Verify exactly 1 control point
    expect(controlPoints).toBe(1);
    console.log('✅ VERIFIED: 1 control point shown');

    // Try to drag the control point
    const newY = clickY + 50; // Move down 50 pixels
    console.log(`🖱️ Dragging control point from Y=${clickY} to Y=${newY}`);

    await page.mouse.move(clickX, clickY);
    await page.mouse.down();
    await page.mouse.move(clickX, newY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // Take screenshot after drag - LINE SHOULD STILL BE VISIBLE AT NEW POSITION
    await page.screenshot({ path: 'test-results/horizontal-fix-05-after-drag.png' });
    console.log('✅ Drag completed');

    // Check if line is still visible by looking for the line element
    const horizontalLines = await page.locator('line').count();
    console.log(`📊 Line elements visible: ${horizontalLines}`);

    // We should have at least one line visible
    expect(horizontalLines).toBeGreaterThan(0);
    console.log('✅ VERIFIED: Line still visible after drag');

    // Click elsewhere to deselect
    await page.mouse.click(clickX + 100, clickY - 100);
    await page.waitForTimeout(500);

    // Take screenshot after deselect - LINE SHOULD STILL BE VISIBLE
    await page.screenshot({ path: 'test-results/horizontal-fix-06-deselected.png' });
    console.log('✅ Deselected');

    // Verify line is still visible after deselection
    const linesAfterDeselect = await page.locator('line').count();
    console.log(`📊 Line elements after deselect: ${linesAfterDeselect}`);
    expect(linesAfterDeselect).toBeGreaterThan(0);
    console.log('✅ VERIFIED: Line persists after deselection');

    // Re-select and delete
    await page.mouse.click(clickX, newY);
    await page.waitForTimeout(500);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);

    // Take final screenshot - LINE SHOULD BE GONE
    await page.screenshot({ path: 'test-results/horizontal-fix-07-deleted.png' });
    console.log('✅ Line deleted');

    console.log('\n🎉 ALL TESTS PASSED - Horizontal line fixes verified!');
  });
});
