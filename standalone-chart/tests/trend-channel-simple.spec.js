const { test, expect } = require('@playwright/test');

test.describe('Simple Trend Channel Test', () => {
  test('verify trend channel tool selection and basic rendering', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Add some debugging JavaScript to the page
    await page.addInitScript(() => {
      window.debugInfo = {
        consoleLogs: [],
        mouseEvents: []
      };
      
      // Override console.log to capture our debug messages
      const originalLog = console.log;
      console.log = function(...args) {
        window.debugInfo.consoleLogs.push(args.join(' '));
        originalLog.apply(console, arguments);
      };
    });

    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    console.log('1. Select trend channel tool');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(1000);
    
    // Check the state after tool selection
    const toolState = await page.evaluate(() => {
      return {
        activeButton: document.querySelector('[data-testid="line-tools-button"]')?.classList.contains('active'),
        currentTool: window.currentTool, // If exposed
        debugLogs: window.debugInfo?.consoleLogs || []
      };
    });
    
    console.log('Tool state after selection:', toolState);
    
    console.log('2. Inspect the chart SVG structure for EquidistantChannel elements');
    const svgStructure = await page.evaluate(() => {
      const chartSvg = document.querySelector('svg');
      if (!chartSvg) return { error: 'No SVG found' };
      
      const groups = chartSvg.querySelectorAll('g');
      const structures = [];
      
      groups.forEach((group, index) => {
        const children = Array.from(group.children).map(child => child.tagName.toLowerCase());
        const classes = group.className?.baseVal || '';
        structures.push({
          index,
          tag: group.tagName,
          classes,
          childCount: group.children.length,
          children: children.slice(0, 5) // First 5 children
        });
      });
      
      return {
        totalGroups: groups.length,
        structures: structures.slice(-10) // Last 10 groups (most likely to contain our component)
      };
    });
    
    console.log('SVG structure analysis:');
    console.log('Total groups:', svgStructure.totalGroups);
    svgStructure.structures.forEach(struct => {
      console.log(`Group ${struct.index}: ${struct.children.length} children - ${struct.children.join(', ')}`);
    });
    
    console.log('3. Try a single click to see if any handlers are triggered');
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      const clickX = chartBox.x + chartBox.width * 0.5;
      const clickY = chartBox.y + chartBox.height * 0.5;
      console.log(`Clicking at: (${clickX}, ${clickY})`);
      
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(1000);
    }
    
    // Check for any new console messages after the click
    console.log('Console messages after click:');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg}`);
    });
    
    await page.screenshot({ path: 'test-results/trend-channel-simple-test.png' });
    
    // Just verify the tool was selected successfully
    expect(toolState.activeButton).toBe(true);
  });
});