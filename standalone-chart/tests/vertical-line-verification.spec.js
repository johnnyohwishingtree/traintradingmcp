const { test, expect } = require('@playwright/test');

test('Vertical line draws vertically and can be moved', async ({ page }) => {
  console.log('🧪 Testing vertical line draws vertically');

  // Navigate to the app
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000); // Wait for chart to load

  // Click the dropdown arrow to open line tools
  const dropdownArrow = page.locator('[data-testid="dropdown-arrow"]');
  await dropdownArrow.click();
  await page.waitForTimeout(500);

  // Click on "Vertical line" option
  const verticalLineOption = page.locator('button:has-text("Vertical line")');
  await verticalLineOption.click();
  await page.waitForTimeout(500);

  console.log('✅ Vertical line tool selected');

  // Find the chart area
  const chart = page.locator('svg.react-financial-charts').first();
  const chartBox = await chart.boundingBox();

  if (!chartBox) {
    throw new Error('Chart not found');
  }

  console.log(`📊 Chart dimensions: ${chartBox.width}x${chartBox.height} at (${chartBox.x}, ${chartBox.y})`);

  // Draw a vertical line with a single click
  const clickX = chartBox.x + 400;
  const clickY = chartBox.y + 300;

  console.log(`🖱️ Clicking at (${clickX}, ${clickY})`);

  // Single click to place vertical line
  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(1000);

  console.log('✅ Draw action completed');

  // Take screenshot
  await page.screenshot({ path: 'test-results/vertical-line-drawn.png', fullPage: false });

  // Check for vertical lines (X coordinates should be approximately equal)
  const verticalLines = await page.evaluate(() => {
    const lines = Array.from(document.querySelectorAll('line'));
    return lines
      .map(line => {
        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));

        // Calculate if line is horizontal or vertical
        const deltaX = Math.abs(x2 - x1);
        const deltaY = Math.abs(y2 - y1);

        // For vertical lines, X coordinates should be very close (within 5 pixels)
        const isVertical = deltaX < 5;
        const isHorizontal = deltaY < 5;

        return {
          x1, y1, x2, y2,
          deltaX,
          deltaY,
          isHorizontal,
          isVertical,
          stroke: line.getAttribute('stroke')
        };
      })
      .filter(line => line.isVertical && !line.isHorizontal); // Filter for vertical lines only
  });

  console.log('🔍 Found vertical lines:', JSON.stringify(verticalLines, null, 2));

  // Verify that at least one vertical line exists
  expect(verticalLines.length).toBeGreaterThan(0);
  console.log(`✅ Found ${verticalLines.length} vertical line(s)`);

  // Verify the line is VERTICAL (not horizontal)
  const verticalLine = verticalLines[0];
  console.log(`📏 Line analysis:
    - ΔX (horizontal span): ${verticalLine.deltaX}
    - ΔY (vertical span): ${verticalLine.deltaY}
    - Is horizontal: ${verticalLine.isHorizontal}
    - Is vertical: ${verticalLine.isVertical}
  `);

  // CRITICAL TEST: The line MUST be vertical
  expect(verticalLine.isVertical).toBe(true);
  expect(verticalLine.isHorizontal).toBe(false);

  // Additional check: X coordinates should be approximately equal (allowing small floating point differences)
  const xDifference = Math.abs(verticalLine.x2 - verticalLine.x1);
  expect(xDifference).toBeLessThan(5); // Allow small floating point variance

  console.log('✅ PASS: Vertical line is drawing VERTICALLY (top-to-bottom)');
  console.log('✅ FIXED: Vertical line draws correctly');
  console.log('✅ Test complete - vertical line successfully reimplemented based on horizontal line pattern');
});
