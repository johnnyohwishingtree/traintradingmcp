const { test, expect } = require('@playwright/test');

test('Verify HorizontalLine control points and colors', async ({ page }) => {
  console.log('🔍 Testing actual HorizontalLine control point implementation...\n');
  
  // Capture console logs to verify which component is rendering
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.text().includes('Horizontal') || msg.text().includes('control') || msg.text().includes('🖱️')) {
      consoleLogs.push(msg.text());
    }
  });

  await page.goto('http://localhost:3000');
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Click horizontal line tool
  await page.click('[data-testid="horizontal-line-tool"]');
  await page.waitForTimeout(500);

  // Draw a horizontal line
  await page.mouse.click(500, 300);
  await page.waitForTimeout(1000);

  // Switch to cursor mode to select the line
  await page.click('[data-testid="cursor-tool"]');
  await page.waitForTimeout(500);

  // Click on the line to select it
  await page.mouse.click(500, 300);
  await page.waitForTimeout(1000);

  // Take screenshot to see actual control points
  await page.screenshot({ path: 'test-results/horizontal-line-actual-controls.png' });

  // Get all SVG circles (control points) that are visible
  const controlPoints = await page.evaluate(() => {
    const circles = Array.from(document.querySelectorAll('circle'));
    return circles.filter(c => {
      const display = window.getComputedStyle(c).display;
      const opacity = window.getComputedStyle(c).opacity;
      return display !== 'none' && opacity !== '0';
    }).map(circle => ({
      cx: circle.getAttribute('cx'),
      cy: circle.getAttribute('cy'),
      r: circle.getAttribute('r'),
      fill: window.getComputedStyle(circle).fill || circle.getAttribute('fill'),
      stroke: window.getComputedStyle(circle).stroke || circle.getAttribute('stroke'),
    }));
  });

  console.log(`\n📊 Found ${controlPoints.length} visible control points:`);
  controlPoints.forEach((point, i) => {
    console.log(`  Control Point ${i + 1}:`);
    console.log(`    Position: (${point.cx}, ${point.cy})`);
    console.log(`    Radius: ${point.r}`);
    console.log(`    Fill: ${point.fill}`);
    console.log(`    Stroke: ${point.stroke}`);
    
    // Check if it's yellow (our intended change)
    if (point.fill && point.fill.includes('255, 255, 0')) {
      console.log(`    ✅ This is the YELLOW control point!`);
    } else if (point.fill && point.fill.includes('ffff00')) {
      console.log(`    ✅ This is the YELLOW control point!`);
    } else {
      console.log(`    ❌ This is NOT yellow`);
    }
  });

  // Check if EachHorizontalLineTrend or EachTrendLine is being used
  const componentInfo = await page.evaluate(() => {
    // Try to find evidence of which component is rendering
    const lineElements = document.querySelectorAll('line');
    const gElements = document.querySelectorAll('g');
    
    // Look for React component names in the DOM
    let componentType = 'unknown';
    for (const el of gElements) {
      const reactKey = Object.keys(el).find(key => key.startsWith('__react'));
      if (reactKey && el[reactKey]) {
        const fiber = el[reactKey];
        if (fiber && fiber.elementType && fiber.elementType.name) {
          if (fiber.elementType.name.includes('Horizontal')) {
            componentType = fiber.elementType.name;
            break;
          }
        }
      }
    }
    
    return {
      lineCount: lineElements.length,
      gCount: gElements.length,
      componentType
    };
  });

  console.log(`\n🔧 Component Analysis:`);
  console.log(`  Lines found: ${componentInfo.lineCount}`);
  console.log(`  G elements: ${componentInfo.gCount}`);
  console.log(`  Component type detected: ${componentInfo.componentType}`);

  console.log(`\n📝 Console logs captured:`);
  consoleLogs.forEach(log => console.log(`  ${log}`));

  // VERDICT
  console.log('\n' + '='.repeat(60));
  if (controlPoints.length === 1 && controlPoints.some(p => p.fill && (p.fill.includes('255, 255, 0') || p.fill.includes('ffff00')))) {
    console.log('✅ SUCCESS: Single yellow control point found as intended!');
  } else if (controlPoints.length === 2) {
    console.log('❌ FAILURE: Still showing TWO control points (not fixed yet)');
  } else if (controlPoints.length === 1) {
    console.log('⚠️ PARTIAL: Single control point found but it\'s not yellow');
  } else {
    console.log(`❓ UNEXPECTED: Found ${controlPoints.length} control points`);
  }
  console.log('='.repeat(60));
});