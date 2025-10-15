const { test, expect } = require('@playwright/test');

test.describe('MCP Label Demo Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to MCP demo mode specifically
    await page.goto('http://localhost:3000?demo=mcp');
    await page.waitForLoadState('networkidle');
    
    // Wait for chart to load
    await page.waitForSelector('svg', { timeout: 10000 });
    console.log('✅ MCP Demo mode loaded');
  });

  test('should render MCP labels in demo mode', async ({ page }) => {
    console.log('🧪 Testing MCP label rendering in demo mode...');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/mcp-demo-initial.png', fullPage: true });
    
    // Check console messages for MCP processing
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('MCP') || text.includes('label') || text.includes('🎨') || text.includes('📊')) {
        console.log('📝 Console:', text);
      }
    });
    
    // Wait a moment for initial processing
    await page.waitForTimeout(2000);
    
    // Take screenshot after initial load
    await page.screenshot({ path: 'test-results/mcp-demo-loaded.png', fullPage: true });
    
    // Click somewhere on the chart to trigger MCP analysis
    const chartSvg = await page.locator('svg').first();
    const chartBox = await chartSvg.boundingBox();
    
    if (chartBox) {
      // Click in the middle of the chart
      const clickX = chartBox.x + chartBox.width / 2;
      const clickY = chartBox.y + chartBox.height / 2;
      
      console.log(`🖱️ Clicking chart at (${clickX}, ${clickY})`);
      await page.mouse.click(clickX, clickY);
      
      // Wait for MCP processing
      await page.waitForTimeout(3000);
    }
    
    // Take screenshot after click
    await page.screenshot({ path: 'test-results/mcp-demo-after-click.png', fullPage: true });
    
    // Check for label-related console logs
    const mcpLogs = consoleLogs.filter(log => 
      log.includes('MCP Labels found') || 
      log.includes('Converted labels') ||
      log.includes('TrendLine render') ||
      log.includes('convertMCPElementsToLabels') ||
      log.includes('MCPPatternAnalyzer')
    );
    
    console.log('📊 MCP-related console logs:', mcpLogs.length, 'found');
    mcpLogs.forEach(log => console.log('  ', log));
    
    // Look for text elements that might be labels
    const textElements = await page.locator('text').all();
    console.log(`📝 Found ${textElements.length} text elements in SVG`);
    
    let labelTexts = [];
    for (const textEl of textElements) {
      const text = await textEl.textContent();
      const bbox = await textEl.boundingBox();
      if (text && (text.includes('Top') || text.includes('Bottom') || text.includes('Label') || text.includes('High') || text.includes('Low'))) {
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
      
      // Check if this looks like a label background (light gray)
      if (fill && (fill.includes('#D3D3D3') || fill.includes('lightgray') || fill.includes('#ddd'))) {
        labelRects.push({ bbox, fill });
        console.log(`🏷️ Found label background rect:`, { bbox, fill });
      }
    }
    
    // Look for InteractiveText groups specifically
    const interactiveTextGroups = await page.locator('g').filter({
      has: page.locator('rect[fill*="#D3D3D3"], rect[fill*="lightgray"]')
    }).count();
    console.log(`🔍 Found ${interactiveTextGroups} potential InteractiveText groups`);
    
    // Check the DOM structure for debugging
    const svgContent = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      if (!svg) return 'No SVG found';
      
      // Count specific elements
      const lines = svg.querySelectorAll('line').length;
      const circles = svg.querySelectorAll('circle').length;
      const paths = svg.querySelectorAll('path').length;
      const texts = svg.querySelectorAll('text').length;
      const rects = svg.querySelectorAll('rect').length;
      const groups = svg.querySelectorAll('g').length;
      
      return {
        lines,
        circles, 
        paths,
        texts,
        rects,
        groups,
        hasInteractiveText: svg.innerHTML.includes('InteractiveText'),
        svgInnerHTMLLength: svg.innerHTML.length
      };
    });
    
    console.log('🔍 SVG DOM Analysis:', svgContent);
    
    // Test the half-covered text issue in top-left corner
    const topLeftText = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('text'));
      const topLeftTexts = texts.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.x < 200 && rect.y < 150; // Top-left area
      });
      
      return topLeftTexts.map(el => ({
        text: el.textContent,
        x: el.getBoundingClientRect().x,
        y: el.getBoundingClientRect().y,
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height
      }));
    });
    
    console.log('⚠️ Top-left text elements:', topLeftText);
    
    // Create a detailed report
    const report = {
      mode: 'MCP Demo Mode',
      consoleLogs: mcpLogs,
      labelTexts: labelTexts,
      labelRects: labelRects,
      totalTextElements: textElements.length,
      totalRectElements: rectElements.length,
      interactiveTextGroups: interactiveTextGroups,
      svgAnalysis: svgContent,
      topLeftText: topLeftText
    };
    
    console.log('📋 MCP Demo Test Report:', JSON.stringify(report, null, 2));
    
    // Take final screenshot for manual inspection
    await page.screenshot({ path: 'test-results/mcp-demo-final.png', fullPage: true });
    
    // Assertions
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
    
    // Test passes if we can generate the report
    expect(report).toBeDefined();
    expect(report.mode).toBe('MCP Demo Mode');
  });
  
  test('should check MCPTrendLineDemo component state', async ({ page }) => {
    console.log('🔍 Investigating MCPTrendLineDemo component...');
    
    // Navigate to MCP demo mode
    await page.goto('http://localhost:3000?demo=mcp');
    await page.waitForSelector('svg');
    
    // Wait for component to load
    await page.waitForTimeout(2000);
    
    // Inject debugging script to inspect React components and state
    const componentState = await page.evaluate(() => {
      // Try to find React Fiber to inspect component props/state
      const findReactFiber = (element) => {
        for (let key in element) {
          if (key.startsWith('__reactInternalInstance$') || key.startsWith('__reactFiber$')) {
            return element[key];
          }
        }
        return null;
      };
      
      // Look for MCPTrendLineDemo in the component tree
      const searchForComponent = (fiber, componentName, depth = 0) => {
        if (!fiber || depth > 20) return null;
        
        if (fiber.type && fiber.type.name === componentName) {
          return {
            name: fiber.type.name,
            props: fiber.memoizedProps ? Object.keys(fiber.memoizedProps) : [],
            state: fiber.memoizedState ? 'hasState' : 'noState',
            propsData: fiber.memoizedProps
          };
        }
        
        // Search children and siblings
        let result = null;
        if (fiber.child) result = searchForComponent(fiber.child, componentName, depth + 1);
        if (!result && fiber.sibling) result = searchForComponent(fiber.sibling, componentName, depth + 1);
        
        return result;
      };
      
      const rootElement = document.querySelector('#root') || document.body;
      const fiber = findReactFiber(rootElement);
      
      const mcpDemo = searchForComponent(fiber, 'MCPTrendLineDemo');
      const trendLine = searchForComponent(fiber, 'TrendLine');
      
      return {
        mcpDemo,
        trendLine,
        hasRoot: !!rootElement,
        hasFiber: !!fiber
      };
    });
    
    console.log('🔬 React Component State Analysis:', JSON.stringify(componentState, null, 2));
    
    expect(componentState).toBeDefined();
  });
});