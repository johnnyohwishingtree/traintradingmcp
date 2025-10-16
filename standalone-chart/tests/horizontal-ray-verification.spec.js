const { test, expect } = require('@playwright/test');

test('Horizontal ray draws horizontally (not vertically)', async ({ page }) => {
  console.log('🧪 Testing horizontal ray draws horizontally');

  // Navigate to the app
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000); // Wait for chart to load

  // Click the dropdown arrow to open line tools
  const dropdownArrow = page.locator('[data-testid="dropdown-arrow"]');
  await dropdownArrow.click();
  await page.waitForTimeout(500);

  // Click on "Horizontal ray" option
  const horizontalRayOption = page.locator('button:has-text("Horizontal ray")');
  await horizontalRayOption.click();
  await page.waitForTimeout(500);

  console.log('✅ Horizontal ray tool selected');

  // Find the chart area
  const chart = page.locator('svg.react-financial-charts').first();
  const chartBox = await chart.boundingBox();

  if (!chartBox) {
    throw new Error('Chart not found');
  }

  console.log(`📊 Chart dimensions: ${chartBox.width}x${chartBox.height} at (${chartBox.x}, ${chartBox.y})`);

  // Draw a horizontal ray with a single click
  const clickX = chartBox.x + 400;
  const clickY = chartBox.y + 300;

  console.log(`🖱️ Clicking at (${clickX}, ${clickY})`);

  // Single click to place horizontal ray
  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(1000);

  console.log('✅ Draw action completed');

  // Take screenshot
  await page.screenshot({ path: 'test-results/horizontal-ray-drawn.png', fullPage: false });

  // Check for horizontal ray (brown line)
  const brownLines = await page.evaluate(() => {
    const lines = Array.from(document.querySelectorAll('line'));
    return lines
      .filter(line => {
        const stroke = line.getAttribute('stroke');
        return stroke && stroke.includes('#795548'); // Brown color
      })
      .map(line => {
        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));

        // Calculate if line is horizontal or vertical
        const deltaX = Math.abs(x2 - x1);
        const deltaY = Math.abs(y2 - y1);
        const isHorizontal = deltaX > deltaY;
        const isVertical = deltaY > deltaX;

        return {
          x1, y1, x2, y2,
          deltaX,
          deltaY,
          isHorizontal,
          isVertical,
          stroke: line.getAttribute('stroke')
        };
      });
  });

  console.log('🔍 Found brown lines:', JSON.stringify(brownLines, null, 2));

  // Verify that at least one brown line exists
  expect(brownLines.length).toBeGreaterThan(0);
  console.log(`✅ Found ${brownLines.length} brown line(s)`);

  // Verify the line is HORIZONTAL (not vertical)
  const horizontalRay = brownLines[0];
  console.log(`📏 Line analysis:
    - ΔX (horizontal span): ${horizontalRay.deltaX}
    - ΔY (vertical span): ${horizontalRay.deltaY}
    - Is horizontal: ${horizontalRay.isHorizontal}
    - Is vertical: ${horizontalRay.isVertical}
  `);

  // CRITICAL TEST: The line MUST be horizontal
  expect(horizontalRay.isHorizontal).toBe(true);
  expect(horizontalRay.isVertical).toBe(false);

  // Additional check: Y coordinates should be approximately equal (allowing small floating point differences)
  const yDifference = Math.abs(horizontalRay.y2 - horizontalRay.y1);
  expect(yDifference).toBeLessThan(5); // Allow small floating point variance

  console.log('✅ PASS: Horizontal ray is drawing HORIZONTALLY (left-to-right)');
  console.log('✅ FIXED: Horizontal ray no longer draws vertically');
});
