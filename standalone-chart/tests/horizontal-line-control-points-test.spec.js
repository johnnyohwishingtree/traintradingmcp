const { test, expect } = require('@playwright/test');

test('Test HorizontalLine control points via dropdown', async ({ page }) => {
  console.log('🎯 Testing HorizontalLine control points through proper UI flow...\n');
  
  // Capture console logs to verify which component is rendering
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.text().includes('Horizontal') || msg.text().includes('control') || msg.text().includes('🔥') || msg.text().includes('🖱️')) {
      consoleLogs.push(msg.text());
    }
  });

  await page.goto('http://localhost:3000');
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Step 1: Click the dropdown arrow to open line tools menu
  console.log('📝 Step 1: Opening line tools dropdown...');
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/horizontal-step1-dropdown-open.png' });

  // Step 2: Click horizontal line option from dropdown
  console.log('📝 Step 2: Selecting horizontal line from dropdown...');
  await page.click('[data-testid="line-type-horizontalline"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/horizontal-step2-tool-selected.png' });

  // Step 3: Draw a horizontal line
  console.log('📝 Step 3: Drawing horizontal line...');
  await page.mouse.click(500, 300);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/horizontal-step3-line-drawn.png' });

  // Step 4: Switch to cursor mode to select the line
  console.log('📝 Step 4: Switching to cursor mode...');
  await page.click('[data-testid="cursor-button"]');
  await page.waitForTimeout(500);

  // Step 5: Click on the line to select it
  console.log('📝 Step 5: Clicking to select the horizontal line...');
  await page.mouse.click(500, 300);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/horizontal-step5-line-selected.png' });

  // Step 6: Analyze the control points
  console.log('📝 Step 6: Analyzing control points...');
  const controlPoints = await page.evaluate(() => {
    const circles = Array.from(document.querySelectorAll('circle'));
    return circles.filter(c => {
      const display = window.getComputedStyle(c).display;
      const opacity = window.getComputedStyle(c).opacity;
      return display !== 'none' && opacity !== '0' && parseFloat(opacity) > 0.5;
    }).map(circle => {
      const computedStyle = window.getComputedStyle(circle);
      return {
        cx: parseFloat(circle.getAttribute('cx')),
        cy: parseFloat(circle.getAttribute('cy')),
        r: parseFloat(circle.getAttribute('r')),
        fill: computedStyle.fill || circle.getAttribute('fill') || 'unknown',
        stroke: computedStyle.stroke || circle.getAttribute('stroke') || 'unknown',
        fillStyle: circle.getAttribute('fillStyle') || 'unknown',
        isVisible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden'
      };
    });
  });

  console.log(`\n📊 Found ${controlPoints.length} visible control points:`);
  controlPoints.forEach((point, i) => {
    console.log(`  Control Point ${i + 1}:`);
    console.log(`    Position: (${point.cx}, ${point.cy})`);
    console.log(`    Radius: ${point.r}`);
    console.log(`    Fill: ${point.fill}`);
    console.log(`    FillStyle attr: ${point.fillStyle}`);
    console.log(`    Stroke: ${point.stroke}`);
    console.log(`    Visible: ${point.isVisible}`);
    
    // Check for yellow color in different formats
    const isYellow = point.fill.includes('255, 255, 0') || 
                     point.fill.includes('ffff00') || 
                     point.fill.includes('yellow') ||
                     point.fillStyle.includes('ffff00') ||
                     point.fillStyle.includes('yellow');
    
    if (isYellow) {
      console.log(`    ✅ This appears to be the YELLOW control point!`);
    } else {
      console.log(`    ❌ This is NOT yellow`);
    }
    console.log('');
  });

  // Check which component is actually being used
  const componentInfo = await page.evaluate(() => {
    // Look for specific debug messages or component signatures
    const gElements = Array.from(document.querySelectorAll('g'));
    let componentEvidence = [];
    
    // Check for any elements that might indicate which component is being used
    gElements.forEach(g => {
      const children = Array.from(g.children);
      if (children.some(child => child.tagName === 'line') && 
          children.some(child => child.tagName === 'circle')) {
        
        const circles = children.filter(child => child.tagName === 'circle');
        const lines = children.filter(child => child.tagName === 'line');
        
        componentEvidence.push({
          circleCount: circles.length,
          lineCount: lines.length,
          circleColors: circles.map(c => ({
            fill: window.getComputedStyle(c).fill || c.getAttribute('fill'),
            fillStyle: c.getAttribute('fillStyle')
          }))
        });
      }
    });
    
    return componentEvidence;
  });

  console.log(`\n🔧 Component Analysis:`);
  console.log(`   Found ${componentInfo.length} line+circle groups`);
  componentInfo.forEach((info, i) => {
    console.log(`   Group ${i + 1}: ${info.lineCount} lines, ${info.circleCount} circles`);
    info.circleColors.forEach((color, j) => {
      console.log(`     Circle ${j + 1}: fill="${color.fill}", fillStyle="${color.fillStyle}"`);
    });
  });

  console.log(`\n📝 Console logs captured:`);
  consoleLogs.forEach(log => console.log(`  ${log}`));

  // FINAL ANALYSIS
  console.log('\n' + '='.repeat(80));
  if (controlPoints.length === 1) {
    const isYellow = controlPoints.some(p => 
      p.fill.includes('255, 255, 0') || 
      p.fill.includes('ffff00') || 
      p.fillStyle.includes('ffff00')
    );
    
    if (isYellow) {
      console.log('✅ SUCCESS: Single yellow control point found as intended!');
    } else {
      console.log('⚠️ PARTIAL: Single control point found but it is NOT yellow');
      console.log(`   Color found: ${controlPoints[0].fill} / ${controlPoints[0].fillStyle}`);
    }
  } else if (controlPoints.length === 2) {
    console.log('❌ FAILURE: Still showing TWO control points instead of one');
    console.log('   This means EachHorizontalLineTrend is not being used correctly');
  } else {
    console.log(`❓ UNEXPECTED: Found ${controlPoints.length} control points`);
  }
  console.log('='.repeat(80));
});