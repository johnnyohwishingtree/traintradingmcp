const { test, expect } = require('@playwright/test');

test.describe('Chart Basic Debug', () => {
  test('debug basic chart rendering', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(5000); // Give more time for chart to load

    // Check what's actually in the DOM
    const domStructure = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="main-chart-container"]');
      if (!container) return { error: 'No chart container found' };
      
      const svgs = document.querySelectorAll('svg');
      const canvases = document.querySelectorAll('canvas');
      
      return {
        containerExists: !!container,
        containerHTML: container.innerHTML.substring(0, 500), // First 500 chars
        containerChildren: container.children.length,
        totalSvgs: svgs.length,
        totalCanvases: canvases.length,
        svgDetails: Array.from(svgs).map((svg, index) => ({
          index,
          width: svg.getAttribute('width'),
          height: svg.getAttribute('height'),
          childCount: svg.children.length,
          classes: svg.className?.baseVal || ''
        }))
      };
    });
    
    console.log('DOM Structure Analysis:');
    console.log('Container exists:', domStructure.containerExists);
    console.log('Container children count:', domStructure.containerChildren);
    console.log('Total SVGs found:', domStructure.totalSvgs);
    console.log('Total Canvases found:', domStructure.totalCanvases);
    
    if (domStructure.svgDetails) {
      domStructure.svgDetails.forEach(svg => {
        console.log(`SVG ${svg.index}: ${svg.width}x${svg.height}, ${svg.childCount} children`);
      });
    }
    
    console.log('Container HTML preview:');
    console.log(domStructure.containerHTML);
    
    // Take screenshot to see what's actually rendered
    await page.screenshot({ path: 'test-results/chart-basic-debug.png' });
    
    // Check for any React errors
    const reactErrors = await page.evaluate(() => {
      return window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__?.latestError || null;
    });
    
    if (reactErrors) {
      console.log('React errors found:', reactErrors);
    }
    
    // The chart should have at least one SVG
    expect(domStructure.totalSvgs).toBeGreaterThan(0);
  });
});