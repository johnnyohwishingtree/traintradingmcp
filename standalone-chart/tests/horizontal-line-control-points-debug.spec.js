const { test, expect } = require('@playwright/test');

test.describe('Horizontal Line Control Points Debug', () => {
  test('should investigate how many control points are rendered', async ({ page }) => {
    // Navigate to the chart application
    await page.goto('http://localhost:3000');

    // Wait for the main chart container to be visible
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow chart to fully render

    console.log('🧪 Starting horizontal line control points investigation...');

    // Find the line tools dropdown and click it to open
    const lineDropdown = await page.locator('.line-tools-dropdown button').first();
    await lineDropdown.click();
    await page.waitForTimeout(500);

    // Find and click the horizontal line option
    const horizontalLineOption = await page.locator('button[title*="Horizontal line"]').first();
    await expect(horizontalLineOption).toBeVisible();
    await horizontalLineOption.click();
    await page.waitForTimeout(500);

    console.log('✅ Horizontal line tool activated');

    // Get chart area for clicking
    const chartArea = await page.locator('.react-financial-charts').first();
    await expect(chartArea).toBeVisible();

    // Get chart dimensions
    const chartBox = await chartArea.boundingBox();

    // Click once in the middle of the chart to place a horizontal line
    const clickX = chartBox.x + chartBox.width * 0.5;
    const clickY = chartBox.y + chartBox.height * 0.4;

    console.log(`🖱️ Clicking at (${clickX}, ${clickY}) to place horizontal line`);

    // Single click to place horizontal line
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000);

    console.log('✅ Horizontal line placed');

    // Switch to cursor mode to select the line
    const cursorButton = await page.locator('button:has-text("Cursor")').first();
    await cursorButton.click();
    await page.waitForTimeout(500);

    console.log('✅ Switched to cursor mode');

    // Click on the line to select it
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(500);

    console.log('✅ Line selected');

    // Take screenshot of selected line
    await page.screenshot({ path: 'test-results/horizontal-line-selected.png', fullPage: true });

    // Count all circle elements (control points)
    const allCircles = await page.locator('circle').count();
    console.log(`🔍 Total circle elements on page: ${allCircles}`);

    // Query DOM for circles related to horizontal line
    const circleInfo = await page.evaluate(() => {
      const circles = Array.from(document.querySelectorAll('circle'));
      return circles.map((circle, index) => {
        const cx = circle.getAttribute('cx');
        const cy = circle.getAttribute('cy');
        const r = circle.getAttribute('r');
        const fill = circle.getAttribute('fill');
        const stroke = circle.getAttribute('stroke');
        const style = window.getComputedStyle(circle);
        const display = style.display;
        const visibility = style.visibility;
        const opacity = style.opacity;

        return {
          index,
          cx,
          cy,
          r,
          fill,
          stroke,
          display,
          visibility,
          opacity,
          isVisible: display !== 'none' && visibility !== 'hidden' && opacity !== '0'
        };
      }).filter(c => c.isVisible && parseFloat(c.r) > 3); // Filter visible control-point-sized circles
    });

    console.log('🎯 Visible control point circles:', JSON.stringify(circleInfo, null, 2));
    console.log(`📊 Number of visible control point circles: ${circleInfo.length}`);

    // Check if there are exactly 1 or 2 control points
    if (circleInfo.length === 1) {
      console.log('✅ CORRECT: Only 1 control point found (midpoint)');
    } else if (circleInfo.length === 2) {
      console.log('❌ ISSUE CONFIRMED: 2 control points found (should be 1)');
      console.log('🔍 Control point positions:');
      circleInfo.forEach((circle, idx) => {
        console.log(`   Point ${idx + 1}: cx=${circle.cx}, cy=${circle.cy}, r=${circle.r}`);
      });
    } else {
      console.log(`⚠️ UNEXPECTED: ${circleInfo.length} control points found`);
    }

    // Take annotated screenshot
    await page.evaluate(() => {
      const circles = Array.from(document.querySelectorAll('circle'));
      circles.forEach((circle, index) => {
        const r = parseFloat(circle.getAttribute('r') || '0');
        const style = window.getComputedStyle(circle);
        if (r > 3 && style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0) {
          // Add a red outline to visible control points for debugging
          circle.setAttribute('stroke', 'red');
          circle.setAttribute('stroke-width', '3');
        }
      });
    });

    await page.screenshot({ path: 'test-results/horizontal-line-control-points-highlighted.png', fullPage: true });

    console.log('✅ Investigation complete. Check screenshots in test-results/');
  });
});
