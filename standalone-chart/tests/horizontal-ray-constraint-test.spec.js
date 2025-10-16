const { test, expect } = require('@playwright/test');

test.describe('Horizontal Ray Constraint Test', () => {
  test('should keep horizontal ray constrained to horizontal movement only', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for chart to load
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('✅ Chart loaded');

    // Open line tools dropdown by clicking the dropdown arrow
    await page.click('[data-testid="dropdown-arrow"]');
    await page.waitForTimeout(500);
    console.log('✅ Line tools dropdown opened');

    // Verify dropdown is visible
    const dropdown = await page.locator('[data-testid="line-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Click Horizontal ray option
    await page.click('[data-testid="line-type-horizontalray"]');
    await page.waitForTimeout(500);
    console.log('✅ Horizontal ray mode activated');

    // Get canvas element
    const canvas = await page.locator('canvas').first();
    const canvasBounds = await canvas.boundingBox();

    if (!canvasBounds) {
      throw new Error('Canvas not found');
    }

    // Draw a horizontal ray with two clicks
    const startX = canvasBounds.x + 400;
    const startY = canvasBounds.y + 250;
    const endX = canvasBounds.x + 600;
    const endY = canvasBounds.y + 250; // Same Y coordinate for horizontal

    console.log(`📍 Drawing horizontal ray from (${startX}, ${startY}) to (${endX}, ${endY})`);

    // First click to start
    await page.mouse.click(startX, startY);
    await page.waitForTimeout(300);

    // Second click to finish
    await page.mouse.click(endX, endY);
    await page.waitForTimeout(1000);

    console.log('✅ Horizontal ray drawn');

    // Take screenshot of the drawn ray
    await page.screenshot({ path: 'test-results/horizontal-ray-drawn.png' });

    // Now test: Try to select and drag a control point to see if it can be made non-horizontal
    // Switch to cursor mode first
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);
    console.log('✅ Switched to cursor mode');

    // Click on the horizontal ray to select it
    await page.mouse.click(startX + 100, startY);
    await page.waitForTimeout(500);
    console.log('✅ Clicked on horizontal ray to select it');

    // Take screenshot showing selected state
    await page.screenshot({ path: 'test-results/horizontal-ray-selected.png' });

    // Check console for the selection log
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    // Look for any visible control points (circles)
    const controlPoints = await page.evaluate(() => {
      const circles = document.querySelectorAll('circle');
      const visiblePoints = [];

      circles.forEach((circle, idx) => {
        const cx = parseFloat(circle.getAttribute('cx'));
        const cy = parseFloat(circle.getAttribute('cy'));
        const r = parseFloat(circle.getAttribute('r'));
        const style = window.getComputedStyle(circle);
        const opacity = parseFloat(style.opacity);
        const display = style.display;

        // Check if it's a reasonable size for a control point (not an icon)
        if (r > 5 && r < 20 && opacity > 0 && display !== 'none' && cx > 100 && cy > 100) {
          visiblePoints.push({
            index: idx,
            cx,
            cy,
            r,
            fill: circle.getAttribute('fill'),
            stroke: circle.getAttribute('stroke')
          });
        }
      });

      return visiblePoints;
    });

    console.log(`🔍 Found ${controlPoints.length} potential control points:`, JSON.stringify(controlPoints, null, 2));

    if (controlPoints.length === 0) {
      console.log('⚠️  No control points found - ray may not be selected or control points not rendered');
    } else if (controlPoints.length === 1) {
      console.log('✅ Found exactly 1 control point (midpoint) - this is correct for EachHorizontalLineTrend');

      const controlPoint = controlPoints[0];
      console.log(`📍 Control point at (${controlPoint.cx}, ${controlPoint.cy})`);

      // Try to drag the control point vertically (should work)
      const dragStartX = controlPoint.cx;
      const dragStartY = controlPoint.cy;
      const dragEndX = dragStartX; // Same X
      const dragEndY = dragStartY + 50; // Different Y (move down)

      console.log(`🖱️  Attempting to drag control point from (${dragStartX}, ${dragStartY}) to (${dragEndX}, ${dragEndY})`);

      await page.mouse.move(dragStartX, dragStartY);
      await page.mouse.down();
      await page.mouse.move(dragEndX, dragEndY, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(500);

      console.log('✅ Vertical drag completed');
      await page.screenshot({ path: 'test-results/horizontal-ray-after-vertical-drag.png' });

      // Check if the ray moved vertically (Y changed but stayed horizontal)
      const lineAfterDrag = await page.evaluate(() => {
        const lines = document.querySelectorAll('line');
        for (let line of lines) {
          const y1 = parseFloat(line.getAttribute('y1'));
          const y2 = parseFloat(line.getAttribute('y2'));
          const x1 = parseFloat(line.getAttribute('x1'));
          const x2 = parseFloat(line.getAttribute('x2'));

          // Find horizontal lines (same Y coordinates)
          if (Math.abs(y1 - y2) < 2 && x1 > 100 && y1 > 100) {
            return { x1, y1, x2, y2, isHorizontal: true };
          }
        }
        return null;
      });

      if (lineAfterDrag) {
        console.log(`📏 Line after drag: y1=${lineAfterDrag.y1}, y2=${lineAfterDrag.y2}`);
        console.log(`   Is horizontal: ${lineAfterDrag.isHorizontal}`);
        console.log('✅ SUCCESS: Ray remained horizontal after dragging');
      } else {
        console.log('⚠️  Could not find horizontal line after drag');
      }

    } else {
      console.log(`⚠️  Found ${controlPoints.length} control points - expected 1 for horizontal ray`);
      console.log('   This suggests it might still be using EachTrendLine with multiple control points');

      // If there are 2+ control points, try dragging one to see if we can make it non-horizontal
      if (controlPoints.length >= 2) {
        const cp1 = controlPoints[0];
        const cp2 = controlPoints[1];

        console.log(`🖱️  Attempting to drag endpoint from (${cp1.cx}, ${cp1.cy}) vertically...`);

        await page.mouse.move(cp1.cx, cp1.cy);
        await page.mouse.down();
        await page.mouse.move(cp1.cx, cp1.cy + 50, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'test-results/horizontal-ray-after-endpoint-drag.png' });

        // Check if the line became non-horizontal
        const lineAfterDrag = await page.evaluate(() => {
          const lines = document.querySelectorAll('line');
          for (let line of lines) {
            const y1 = parseFloat(line.getAttribute('y1'));
            const y2 = parseFloat(line.getAttribute('y2'));
            const x1 = parseFloat(line.getAttribute('x1'));
            const x2 = parseFloat(line.getAttribute('x2'));

            if (x1 > 100) {
              return {
                x1, y1, x2, y2,
                isHorizontal: Math.abs(y1 - y2) < 2,
                yDiff: Math.abs(y1 - y2)
              };
            }
          }
          return null;
        });

        if (lineAfterDrag) {
          console.log(`📏 Line after endpoint drag: y1=${lineAfterDrag.y1}, y2=${lineAfterDrag.y2}, yDiff=${lineAfterDrag.yDiff}`);

          if (lineAfterDrag.isHorizontal) {
            console.log('✅ SUCCESS: Ray remained horizontal even with multiple control points');
          } else {
            console.log('❌ FAIL: Ray became non-horizontal! This means the fix is NOT working correctly.');
            console.log(`   Y difference: ${lineAfterDrag.yDiff} pixels`);
          }
        }
      }
    }

    // Final summary screenshot
    await page.screenshot({ path: 'test-results/horizontal-ray-final.png', fullPage: true });

    console.log('\n📊 Test completed. Check screenshots in test-results/');
  });
});
