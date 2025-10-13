const { test, expect } = require('@playwright/test');

test('Debug - what trend line elements are actually created', async ({ page }) => {
  console.log('🔍 Debugging what trend line elements are actually in the DOM...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const chartContainer = page.locator('[data-testid="main-chart-container"]');
  
  // Count initial elements
  const initial = await page.evaluate(() => {
    const allLines = document.querySelectorAll('svg line');
    const allPaths = document.querySelectorAll('svg path');
    return {
      lines: allLines.length,
      paths: allPaths.length,
      lineDetails: Array.from(allLines).map((line, i) => ({
        index: i,
        x1: line.getAttribute('x1'),
        y1: line.getAttribute('y1'),
        x2: line.getAttribute('x2'),
        y2: line.getAttribute('y2'),
        stroke: line.getAttribute('stroke'),
        strokeWidth: line.getAttribute('stroke-width'),
        className: line.className.baseVal
      }))
    };
  });
  
  console.log('📊 Initial DOM state:');
  console.log(`   Lines: ${initial.lines}, Paths: ${initial.paths}`);
  console.log('   Line details:', initial.lineDetails.slice(0, 5)); // First 5 for brevity
  
  // Draw a trend line
  console.log('📐 Drawing a trend line...');
  await page.click('[data-testid="dropdown-arrow"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="line-type-trendline"]');
  await page.waitForTimeout(500);
  
  await chartContainer.click({ position: { x: 200, y: 300 } });
  await page.waitForTimeout(300);
  await chartContainer.click({ position: { x: 400, y: 200 } });
  await page.waitForTimeout(1000);
  
  // Check what was added
  const afterDraw = await page.evaluate(() => {
    const allLines = document.querySelectorAll('svg line');
    const allPaths = document.querySelectorAll('svg path');
    return {
      lines: allLines.length,
      paths: allPaths.length,
      lineDetails: Array.from(allLines).map((line, i) => ({
        index: i,
        x1: line.getAttribute('x1'),
        y1: line.getAttribute('y1'),
        x2: line.getAttribute('x2'),
        y2: line.getAttribute('y2'),
        stroke: line.getAttribute('stroke'),
        strokeWidth: line.getAttribute('stroke-width'),
        className: line.className.baseVal
      }))
    };
  });
  
  console.log('📊 After drawing trend line:');
  console.log(`   Lines: ${afterDraw.lines}, Paths: ${afterDraw.paths}`);
  console.log(`   New lines added: ${afterDraw.lines - initial.lines}`);
  
  // Find new lines
  const newLines = afterDraw.lineDetails.filter((line, index) => 
    index >= initial.lines || 
    JSON.stringify(line) !== JSON.stringify(initial.lineDetails[index])
  );
  
  console.log('📐 New/changed line elements:');
  newLines.forEach((line, i) => {
    console.log(`   ${i + 1}. x1=${line.x1}, y1=${line.y1}, x2=${line.x2}, y2=${line.y2}`);
    console.log(`       stroke=${line.stroke}, strokeWidth=${line.strokeWidth}`);
    console.log(`       className="${line.className}"`);
  });
  
  // Look for lines that might be trend lines
  const potentialTrendLines = afterDraw.lineDetails.filter(line => {
    const isBlue = line.stroke === '#2196f3';
    const isNotAxis = line.x1 !== '0' && line.y1 !== '0';
    const hasDiagonal = line.x1 !== line.x2 && line.y1 !== line.y2;
    return isBlue || (isNotAxis && hasDiagonal);
  });
  
  console.log('🎯 Potential trend line elements:');
  potentialTrendLines.forEach((line, i) => {
    console.log(`   ${i + 1}. x1=${line.x1}, y1=${line.y1}, x2=${line.x2}, y2=${line.y2}`);
    console.log(`       stroke=${line.stroke}, className="${line.className}"`);
  });
  
  await page.screenshot({ path: 'test-results/debug-trend-line-elements.png' });
  
  // Test switching to cursor mode
  console.log('🖱️ Switching to cursor mode...');
  await page.click('[data-testid="cursor-button"]');
  await page.waitForTimeout(500);
  
  const afterCursor = await page.evaluate(() => {
    const allLines = document.querySelectorAll('svg line');
    return {
      lines: allLines.length,
      lineDetails: Array.from(allLines).map((line, i) => ({
        index: i,
        x1: line.getAttribute('x1'),
        y1: line.getAttribute('y1'),
        x2: line.getAttribute('x2'),
        y2: line.getAttribute('y2'),
        stroke: line.getAttribute('stroke'),
        className: line.className.baseVal
      }))
    };
  });
  
  console.log('📊 After switching to cursor mode:');
  console.log(`   Lines: ${afterCursor.lines} (was ${afterDraw.lines})`);
  
  const linesChangedAfterCursor = afterCursor.lines !== afterDraw.lines;
  if (linesChangedAfterCursor) {
    console.log('❗ Line count changed when switching to cursor mode!');
  }
  
  // Check if any elements have interactive attributes
  const interactiveElements = await page.evaluate(() => {
    const allElements = document.querySelectorAll('svg *[style*="cursor"], svg *[class*="interactive"], svg *[class*="hover"]');
    return Array.from(allElements).map(el => ({
      tagName: el.tagName,
      className: el.className.baseVal,
      style: el.getAttribute('style'),
      attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
    }));
  });
  
  console.log('🎯 Interactive elements found:');
  interactiveElements.forEach((el, i) => {
    console.log(`   ${i + 1}. ${el.tagName} class="${el.className}"`);
    console.log(`       style="${el.style}"`);
  });
});