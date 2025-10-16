const { test, expect } = require('@playwright/test');

test.describe('Horizontal Line Control Points Investigation', () => {
  test('should investigate control points on horizontal line', async ({ page }) => {
    // 1. Navigate to the application
    await page.goto('http://localhost:3000');
    console.log('✅ Navigated to http://localhost:3000');

    // 2. Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded');

    // 3. Find and click the dropdown arrow to open line tools menu
    const dropdownArrow = await page.locator('[data-testid="dropdown-arrow"]');
    await dropdownArrow.click();
    console.log('✅ Clicked dropdown arrow to open line tools menu');
    await page.waitForTimeout(500);

    // 4. Wait for dropdown to appear and click on "Horizontal line" option
    await page.waitForSelector('[data-testid="line-dropdown"]');
    const horizontalLineButton = await page.locator('[data-testid="line-type-horizontalline"]');
    await horizontalLineButton.click();
    console.log('✅ Clicked Horizontal line option');
    await page.waitForTimeout(500);

    // 5. Click somewhere on the chart to place a horizontal line
    // Find the actual chart canvas (not toolbar)
    const chartCanvas = await page.locator('.react-financial-charts').first();
    const canvasBox = await chartCanvas.boundingBox();

    if (canvasBox) {
      // Click in a visible area of the chart (middle)
      const clickX = canvasBox.x + canvasBox.width / 2;
      const clickY = canvasBox.y + canvasBox.height / 2;

      await page.mouse.click(clickX, clickY);
      console.log(`✅ Placed horizontal line at (${clickX}, ${clickY})`);
      await page.waitForTimeout(1000); // Wait longer for line to be drawn

      // Take a screenshot after drawing
      await page.screenshot({ path: 'test-results/horizontal-line-drawn.png' });
      console.log('✅ Screenshot after drawing saved');
    }

    // 6. Switch to cursor mode (use force to avoid interception)
    const cursorButton = await page.locator('[data-testid="cursor-button"]');
    await cursorButton.click({ force: true });
    console.log('✅ Switched to Cursor mode');
    await page.waitForTimeout(500);

    // 7. Click on the horizontal line to select it (same position as where we drew it)
    if (canvasBox) {
      const clickX = canvasBox.x + canvasBox.width / 2;
      const clickY = canvasBox.y + canvasBox.height / 2;

      await page.mouse.click(clickX, clickY);
      console.log(`✅ Clicked horizontal line to select it at (${clickX}, ${clickY})`);
      await page.waitForTimeout(1000);
    }

    // 8. Take a screenshot showing the selected horizontal line
    const screenshotPath = 'test-results/horizontal-line-selected.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Screenshot saved to ${screenshotPath}`);

    // 9. Query circle elements specifically in the chart area (not toolbar icons)
    const circleInfo = await page.evaluate(() => {
      // Find the main chart container
      const chartContainer = document.querySelector('.react-financial-charts');
      if (!chartContainer) {
        return { count: 0, circles: [], message: 'Chart container not found' };
      }

      // Get all circles within the chart container
      const circles = chartContainer.querySelectorAll('circle');
      console.log('🔍 Total circles found in chart:', circles.length);

      const circleDetails = [];
      circles.forEach((circle, index) => {
        const cx = circle.getAttribute('cx');
        const cy = circle.getAttribute('cy');
        const r = circle.getAttribute('r');
        const className = circle.getAttribute('class');
        const fill = circle.getAttribute('fill');
        const stroke = circle.getAttribute('stroke');
        const opacity = circle.getAttribute('opacity');
        const display = window.getComputedStyle(circle).display;

        const detail = {
          index,
          cx, cy, r,
          className,
          fill, stroke, opacity,
          visible: display !== 'none',
          parent: circle.parentElement?.tagName,
          parentClass: circle.parentElement?.getAttribute('class')
        };

        console.log(`Circle ${index}:`, detail);
        circleDetails.push(detail);
      });

      return { count: circles.length, circles: circleDetails };
    });

    const circleCount = circleInfo.count;

    console.log(`\n📊 INVESTIGATION RESULTS:`);
    console.log(`Total circle elements (control points) in chart: ${circleCount}`);
    console.log(`Circle details:`, JSON.stringify(circleInfo.circles, null, 2));
    console.log(`Screenshot path: ${screenshotPath}`);

    // Get more detailed information about the horizontal line element in the chart
    const lineInfo = await page.evaluate(() => {
      const chartContainer = document.querySelector('.react-financial-charts');
      if (!chartContainer) {
        return { found: false, message: 'Chart container not found' };
      }

      const lines = chartContainer.querySelectorAll('line');
      const horizontalLines = [];

      lines.forEach((line, index) => {
        const y1 = parseFloat(line.getAttribute('y1') || '0');
        const y2 = parseFloat(line.getAttribute('y2') || '0');
        const x1 = parseFloat(line.getAttribute('x1') || '0');
        const x2 = parseFloat(line.getAttribute('x2') || '0');

        // Check if it's a drawn horizontal line (y1 === y2 and spans significant width)
        const isHorizontal = Math.abs(y1 - y2) < 1;
        const spansWidth = Math.abs(x2 - x1) > 100; // Significant width

        if (isHorizontal && spansWidth) {
          horizontalLines.push({
            index,
            x1, y1, x2, y2,
            className: line.getAttribute('class'),
            stroke: line.getAttribute('stroke'),
            strokeWidth: line.getAttribute('stroke-width'),
            opacity: line.getAttribute('opacity'),
            pointerEvents: window.getComputedStyle(line).pointerEvents,
            parent: line.parentElement?.tagName,
            parentClass: line.parentElement?.getAttribute('class')
          });
        }
      });

      return { found: true, horizontalLines };
    });

    console.log(`\n📏 Drawn horizontal line elements found:`, JSON.stringify(lineInfo, null, 2));

    // Assert expected behavior: should have exactly 1 control point for horizontal line
    console.log(`\n⚠️  Expected: 1 control point for horizontal line`);
    console.log(`⚠️  Actual: ${circleCount} control points`);

    if (circleCount !== 1) {
      console.log(`\n❌ ISSUE CONFIRMED: Horizontal line has ${circleCount} control points instead of 1`);
    } else {
      console.log(`\n✅ Horizontal line correctly has 1 control point`);
    }
  });
});
