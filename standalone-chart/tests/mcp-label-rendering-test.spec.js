const { test, expect } = require('@playwright/test');

test.describe('MCP Label Rendering Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Wait for chart to load
    await page.waitForSelector('svg', { timeout: 10000 });
    console.log('✅ Chart SVG loaded');
  });

  test('should render MCP labels on chart after clicking', async ({ page }) => {
    console.log('🧪 Starting MCP label rendering test...');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/initial-chart.png', fullPage: true });
    
    // Check console messages for MCP processing
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('MCP') || text.includes('label') || text.includes('🎨') || text.includes('📊')) {
        console.log('📝 Console:', text);
      }
    });
    
    // Click somewhere on the chart to trigger MCP analysis
    const chartSvg = await page.locator('svg').first();
    const chartBox = await chartSvg.boundingBox();
    
    if (!chartBox) {
      throw new Error('Could not get chart bounding box');
    }
    
    // Click in the middle of the chart
    const clickX = chartBox.x + chartBox.width / 2;
    const clickY = chartBox.y + chartBox.height / 2;
    
    console.log(`🖱️ Clicking chart at (${clickX}, ${clickY})`);
    await page.mouse.click(clickX, clickY);
    
    // Wait for MCP processing
    await page.waitForTimeout(2000);
    
    // Take screenshot after click
    await page.screenshot({ path: 'test-results/after-click.png', fullPage: true });
    
    // Check for label-related console logs
    const mcpLogs = consoleLogs.filter(log => 
      log.includes('MCP Labels found') || 
      log.includes('Converted labels') ||
      log.includes('TrendLine render')
    );
    
    console.log('📊 MCP-related console logs:', mcpLogs);
    
    // Look for InteractiveText components in DOM
    const interactiveTextElements = await page.locator('g').filter({ hasText: /Label|Top|Bottom/ }).count();
    console.log(`🔍 Found ${interactiveTextElements} potential label elements in DOM`);
    
    // Check for text elements that might be labels
    const textElements = await page.locator('text').all();
    console.log(`📝 Found ${textElements.length} text elements in SVG`);
    
    let labelTexts = [];
    for (const textEl of textElements) {
      const text = await textEl.textContent();
      const bbox = await textEl.boundingBox();
      if (text && (text.includes('Top') || text.includes('Bottom') || text.includes('Label'))) {
        labelTexts.push({ text, bbox });
        console.log(`📍 Found potential label: "${text}" at`, bbox);
      }
    }
    
    // Check for rect elements (label backgrounds)
    const rectElements = await page.locator('rect').all();
    console.log(`🟩 Found ${rectElements.length} rect elements (potential label backgrounds)`);
    
    let labelRects = [];
    for (const rectEl of rectElements) {
      const bbox = await rectEl.boundingBox();
      const fill = await rectEl.getAttribute('fill');
      const stroke = await rectEl.getAttribute('stroke');
      
      // Check if this looks like a label background
      if (fill && (fill.includes('#D3D3D3') || fill.includes('lightgray'))) {
        labelRects.push({ bbox, fill, stroke });
        console.log(`🏷️ Found label background rect:`, { bbox, fill, stroke });
      }
    }
    
    // Test the half-covered text issue in top-left corner
    const topLeftElements = await page.locator('text').filter({
      hasText: /.+/ // Any text
    }).all();
    
    for (const el of topLeftElements) {
      const bbox = await el.boundingBox();
      if (bbox && bbox.x < 100 && bbox.y < 100) {
        const text = await el.textContent();
        console.log(`⚠️ Top-left text found: "${text}" at (${bbox.x}, ${bbox.y})`);
        
        // Check if it's partially clipped
        const styles = await page.evaluate((element) => {
          const computed = window.getComputedStyle(element);
          return {
            overflow: computed.overflow,
            clipPath: computed.clipPath,
            transform: computed.transform,
            position: computed.position
          };
        }, el);
        console.log(`🎨 Top-left text styles:`, styles);
      }
    }
    
    // Detailed DOM inspection for debugging
    const svgContent = await page.locator('svg').first().innerHTML();
    const hasInteractiveText = svgContent.includes('InteractiveText') || svgContent.includes('data-testid');
    console.log(`🔍 SVG contains InteractiveText markers: ${hasInteractiveText}`);
    
    // Check if TrendLine component rendered with MCP elements
    const trendLineGroups = await page.locator('g').filter({ has: page.locator('line') }).count();
    console.log(`📏 Found ${trendLineGroups} groups with lines (potential TrendLine components)`);
    
    // Take final screenshot for manual inspection
    await page.screenshot({ path: 'test-results/final-state.png', fullPage: true });
    
    // Create a detailed report
    const report = {
      consoleLogs: mcpLogs,
      labelTexts: labelTexts,
      labelRects: labelRects,
      totalTextElements: textElements.length,
      totalRectElements: rectElements.length,
      interactiveTextCount: interactiveTextElements,
      trendLineGroups: trendLineGroups
    };
    
    console.log('📋 Test Report:', JSON.stringify(report, null, 2));
    
    // Write report to file for analysis
    await page.evaluate((reportData) => {
      console.log('📄 FINAL LABEL RENDERING REPORT:', reportData);
    }, report);
    
    // Assertions based on expected behavior
    if (mcpLogs.length > 0) {
      console.log('✅ MCP processing detected in console logs');
    } else {
      console.log('❌ No MCP processing detected in console logs');
    }
    
    if (labelTexts.length > 0) {
      console.log(`✅ Found ${labelTexts.length} potential label texts in DOM`);
    } else {
      console.log('❌ No label texts found in DOM');
    }
    
    if (labelRects.length > 0) {
      console.log(`✅ Found ${labelRects.length} potential label backgrounds in DOM`);
    } else {
      console.log('❌ No label backgrounds found in DOM');
    }
    
    // The test passes if we can generate the diagnostic report
    // We'll use this data to debug the actual rendering issue
    expect(report).toBeDefined();
  });
  
  test('should investigate InteractiveText component rendering', async ({ page }) => {
    console.log('🔍 Investigating InteractiveText component rendering...');
    
    // Navigate and wait for load
    await page.goto('http://localhost:3000');
    await page.waitForSelector('svg');
    
    // Click to trigger MCP
    const chartSvg = await page.locator('svg').first();
    const chartBox = await chartSvg.boundingBox();
    await page.mouse.click(chartBox.x + chartBox.width / 2, chartBox.y + chartBox.height / 2);
    await page.waitForTimeout(2000);
    
    // Inject debugging script to inspect React components
    const componentInfo = await page.evaluate(() => {
      // Look for React Fiber nodes to inspect component state
      const findReactFiber = (element) => {
        for (let key in element) {
          if (key.startsWith('__reactInternalInstance$') || key.startsWith('__reactFiber$')) {
            return element[key];
          }
        }
        return null;
      };
      
      const svgElement = document.querySelector('svg');
      if (!svgElement) return { error: 'No SVG found' };
      
      const fiber = findReactFiber(svgElement);
      
      // Try to find TrendLine and InteractiveText components in the tree
      const findComponents = (fiber, componentTypes = []) => {
        if (!fiber) return componentTypes;
        
        if (fiber.type && fiber.type.name) {
          if (fiber.type.name === 'TrendLine' || fiber.type.name === 'InteractiveText') {
            componentTypes.push({
              name: fiber.type.name,
              props: fiber.memoizedProps ? Object.keys(fiber.memoizedProps) : [],
              state: fiber.memoizedState ? 'hasState' : 'noState'
            });
          }
        }
        
        // Recursively search children and sibling
        if (fiber.child) findComponents(fiber.child, componentTypes);
        if (fiber.sibling) findComponents(fiber.sibling, componentTypes);
        
        return componentTypes;
      };
      
      const components = findComponents(fiber);
      
      return {
        foundComponents: components,
        svgChildCount: svgElement.children.length,
        svgHTML: svgElement.innerHTML.substring(0, 1000) // First 1000 chars
      };
    });
    
    console.log('🔬 React Component Analysis:', JSON.stringify(componentInfo, null, 2));
    
    expect(componentInfo).toBeDefined();
  });
});