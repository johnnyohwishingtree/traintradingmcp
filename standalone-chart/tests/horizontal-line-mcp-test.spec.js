const { test, expect } = require('@playwright/test');

test.describe('Horizontal Line MCP Test', () => {
  test('should draw and select horizontal line correctly', async ({ page }) => {
    // Navigate to the chart application
    await page.goto('http://localhost:3000');

    // Wait for the main chart container to be visible
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow chart to fully render

    console.log('🧪 Testing horizontal line functionality with MCP...');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/mcp-01-initial.png' });

    // Click the dropdown arrow to open line tools menu
    const dropdownArrow = await page.locator('[data-testid="dropdown-arrow"]');
    await dropdownArrow.click();
    await page.waitForTimeout(500);

    console.log('✅ Opened line tools dropdown');
    await page.screenshot({ path: 'test-results/mcp-02-dropdown-open.png' });

    // Click on horizontal line option
    const horizontalLineButton = await page.locator('[data-testid="line-type-horizontalline"]');
    await expect(horizontalLineButton).toBeVisible();
    await horizontalLineButton.click();
    await page.waitForTimeout(500);

    console.log('✅ Horizontal line tool activated');
    await page.screenshot({ path: 'test-results/mcp-03-tool-activated.png' });

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
    await page.screenshot({ path: 'test-results/mcp-04-line-placed.png' });

    // Count horizontal lines
    const lineElements = await page.locator('line').count();
    console.log(`📏 Total line elements: ${lineElements}`);

    // Switch to cursor mode to select the line
    const cursorButton = await page.locator('[data-testid="cursor-button"]');
    await cursorButton.click();
    await page.waitForTimeout(500);

    console.log('✅ Switched to cursor mode');
    await page.screenshot({ path: 'test-results/mcp-05-cursor-mode.png' });

    // Click on the line to select it
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(500);

    console.log('✅ Clicked on line for selection');
    await page.screenshot({ path: 'test-results/mcp-06-line-selected.png' });

    // Count ALL circles to see what's being rendered
    const allCirclesInfo = await page.evaluate(() => {
      const circles = Array.from(document.querySelectorAll('circle'));

      return {
        totalCount: circles.length,
        allCircles: circles.map((circle, i) => {
          const style = window.getComputedStyle(circle);
          return {
            index: i,
            cx: circle.getAttribute('cx'),
            cy: circle.getAttribute('cy'),
            r: circle.getAttribute('r'),
            fill: circle.getAttribute('fill'),
            stroke: circle.getAttribute('stroke'),
            class: circle.getAttribute('class'),
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity
          };
        })
      };
    });

    console.log(`🎯 Total circles: ${allCirclesInfo.totalCount}`);
    console.log('📊 ALL circles:', JSON.stringify(allCirclesInfo.allCircles, null, 2));

    // Final screenshot
    await page.screenshot({ path: 'test-results/mcp-07-final.png', fullPage: true });

    console.log('✅ MCP test completed');

    // Verify horizontal line was drawn
    expect(allCirclesInfo.totalCount).toBeGreaterThan(0);
  });
});
