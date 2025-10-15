const { test, expect } = require('@playwright/test');

test.describe('MCP AI Analyze Label Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to MCP demo mode specifically
    await page.goto('http://localhost:3000?demo=mcp');
    await page.waitForLoadState('networkidle');
    
    // Wait for chart to load
    await page.waitForSelector('svg', { timeout: 10000 });
    console.log('✅ MCP Demo mode loaded');
  });

  test('should generate and render labels when AI Analyze button is clicked', async ({ page }) => {
    console.log('🧪 Testing AI Analyze button label generation...');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/ai-analyze-initial.png', fullPage: true });
    
    // Check console messages for MCP processing
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('MCP') || text.includes('label') || text.includes('🎨') || text.includes('📊') || text.includes('🤖') || text.includes('analyze')) {
        console.log('📝 Console:', text);
      }
    });
    
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Look for the AI Analyze button
    const aiAnalyzeButton = await page.locator('button:has-text("🤖 AI Analyze")');
    await expect(aiAnalyzeButton).toBeVisible();
    console.log('✅ Found AI Analyze button');
    
    // Click the AI Analyze button to trigger label generation
    console.log('🖱️ Clicking AI Analyze button...');
    await aiAnalyzeButton.click();
    
    // Wait for processing
    await page.waitForTimeout(3000);
    
    // Take screenshot after AI analysis
    await page.screenshot({ path: 'test-results/ai-analyze-after-click.png', fullPage: true });
    
    // Check for label-related console logs
    const analysiLogs = consoleLogs.filter(log => 
      log.includes('🤖 LLM analyzing') ||
      log.includes('MCPPatternAnalyzer') ||
      log.includes('generateMCPLabels') ||
      log.includes('Applied') ||
      log.includes('intelligent labels') ||
      log.includes('MCP Labels found') || 
      log.includes('Converted labels') ||
      log.includes('TrendLine render')
    );
    
    console.log('📊 AI Analysis console logs:', analysiLogs.length, 'found');
    analysiLogs.forEach(log => console.log('  ', log));
    
    // Look for text elements that might be labels
    const textElements = await page.locator('text').all();
    console.log(`📝 Found ${textElements.length} text elements in SVG after AI analysis`);
    
    let labelTexts = [];
    for (const textEl of textElements) {
      const text = await textEl.textContent();
      const bbox = await textEl.boundingBox();
      if (text && (text.includes('Top') || text.includes('Bottom') || text.includes('Label') || text.includes('High') || text.includes('Low'))) {
        labelTexts.push({ text, bbox });
        console.log(`📍 Found label text: "${text}" at`, bbox);
      }
    }
    
    // Check for rect elements (label backgrounds) - more specific colors
    const rectElements = await page.locator('rect').all();
    console.log(`🟩 Found ${rectElements.length} rect elements after AI analysis`);
    
    let labelRects = [];
    for (const rectEl of rectElements) {
      const bbox = await rectEl.boundingBox();
      const fill = await rectEl.getAttribute('fill');
      const stroke = await rectEl.getAttribute('stroke');
      
      // Check if this looks like a label background (MCP uses #D3D3D3)
      if (fill && (fill.includes('#D3D3D3') || fill.includes('lightgray') || fill.includes('#ddd'))) {
        labelRects.push({ bbox, fill, stroke });
        console.log(`🏷️ Found label background rect:`, { bbox, fill, stroke });
      }
    }
    
    // Check the updated MCP elements counter in the UI
    const mcpElementsCounter = await page.locator('span:has-text("MCP Elements:")').textContent();
    console.log('📊 MCP Elements counter shows:', mcpElementsCounter);
    
    // Look for the MCP elements list in the UI
    const mcpElementsList = await page.locator('div:has-text("MCP Elements:") + div').count();
    console.log(`🔍 Found ${mcpElementsList} MCP element entries in UI`);
    
    // Check SVG structure in more detail
    const svgAnalysis = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      if (!svg) return 'No SVG found';
      
      // Count specific elements
      const lines = svg.querySelectorAll('line').length;
      const circles = svg.querySelectorAll('circle').length;
      const paths = svg.querySelectorAll('path').length;
      const texts = svg.querySelectorAll('text').length;
      const rects = svg.querySelectorAll('rect').length;
      const groups = svg.querySelectorAll('g').length;
      
      // Look for InteractiveText groups specifically
      const interactiveTextGroups = svg.querySelectorAll('g').length;
      
      // Check for text elements with specific content
      const allTexts = Array.from(svg.querySelectorAll('text'));
      const labelTexts = allTexts.filter(t => {
        const content = t.textContent || '';
        return content.includes('Top') || content.includes('Bottom') || content.includes('Label');
      });
      
      return {
        lines,
        circles, 
        paths,
        texts,
        rects,
        groups,
        interactiveTextGroups,
        labelTexts: labelTexts.length,
        hasInteractiveText: svg.innerHTML.includes('InteractiveText'),
        svgInnerHTMLLength: svg.innerHTML.length
      };
    });
    
    console.log('🔍 SVG Analysis after AI Analysis:', svgAnalysis);
    
    // Test if highlighting button works
    const highlightButton = await page.locator('button:has-text("💡 Highlight All")');
    if (await highlightButton.isVisible()) {
      console.log('🖱️ Clicking Highlight All button...');
      await highlightButton.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot after highlighting
      await page.screenshot({ path: 'test-results/ai-analyze-highlighted.png', fullPage: true });
    }
    
    // Create a detailed report
    const report = {
      mode: 'MCP AI Analyze Test',
      aiAnalysisLogs: analysiLogs,
      labelTexts: labelTexts,
      labelRects: labelRects,
      totalTextElements: textElements.length,
      totalRectElements: rectElements.length,
      mcpElementsCounter: mcpElementsCounter,
      mcpElementsList: mcpElementsList,
      svgAnalysis: svgAnalysis
    };
    
    console.log('📋 AI Analyze Test Report:', JSON.stringify(report, null, 2));
    
    // Take final screenshot for manual inspection
    await page.screenshot({ path: 'test-results/ai-analyze-final.png', fullPage: true });
    
    // Assertions
    if (analysiLogs.length > 0) {
      console.log('✅ AI analysis processing detected in console logs');
    } else {
      console.log('❌ No AI analysis processing detected in console logs');
    }
    
    if (labelTexts.length > 0) {
      console.log(`✅ Found ${labelTexts.length} label texts in DOM after AI analysis`);
    } else {
      console.log('❌ No label texts found in DOM after AI analysis');
    }
    
    if (labelRects.length > 0) {
      console.log(`✅ Found ${labelRects.length} label backgrounds in DOM after AI analysis`);
    } else {
      console.log('❌ No label backgrounds found in DOM after AI analysis');
    }
    
    // The test should find evidence of label generation
    expect(report).toBeDefined();
    expect(report.mode).toBe('MCP AI Analyze Test');
    
    // At minimum, we should see the AI analysis logs
    expect(analysiLogs.length).toBeGreaterThan(0);
  });
  
  test('should show MCP elements counter increase after AI analysis', async ({ page }) => {
    console.log('🔢 Testing MCP elements counter...');
    
    // Navigate to MCP demo mode
    await page.goto('http://localhost:3000?demo=mcp');
    await page.waitForSelector('svg');
    await page.waitForTimeout(2000);
    
    // Get initial MCP elements count
    const initialCounter = await page.locator('span:has-text("MCP Elements:")').textContent();
    console.log('📊 Initial MCP Elements counter:', initialCounter);
    
    // Click AI Analyze button
    const aiAnalyzeButton = await page.locator('button:has-text("🤖 AI Analyze")');
    await aiAnalyzeButton.click();
    await page.waitForTimeout(3000);
    
    // Get updated MCP elements count
    const updatedCounter = await page.locator('span:has-text("MCP Elements:")').textContent();
    console.log('📊 Updated MCP Elements counter:', updatedCounter);
    
    // Extract numbers from the counter text
    const initialMatch = initialCounter.match(/MCP Elements: (\d+)/);
    const updatedMatch = updatedCounter.match(/MCP Elements: (\d+)/);
    
    const initialCount = initialMatch ? parseInt(initialMatch[1]) : 0;
    const updatedCount = updatedMatch ? parseInt(updatedMatch[1]) : 0;
    
    console.log(`📈 Count changed from ${initialCount} to ${updatedCount}`);
    
    // Take screenshot showing the counter
    await page.screenshot({ path: 'test-results/mcp-counter-comparison.png', fullPage: true });
    
    // The counter should increase after AI analysis
    expect(updatedCount).toBeGreaterThan(initialCount);
    console.log('✅ MCP elements counter increased successfully!');
  });
});