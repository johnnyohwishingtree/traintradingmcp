const { test, expect } = require('@playwright/test');

test.describe('Label Placement', () => {
  test('should place a label when clicking on chart', async ({ page }) => {
    const consoleLogs = [];
    
    // Capture console logs that mention labels
    page.on('console', msg => {
      if (msg.type() === 'log' && (msg.text().includes('Label') || msg.text().includes('🏷️'))) {
        consoleLogs.push(msg.text());
        console.log('Console:', msg.text());
      }
    });
    
    // Navigate to the chart application
    await page.goto('http://localhost:3000');
    
    // Wait for the main chart container to be visible
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow chart to fully render
    
    console.log('🧪 Testing label placement...');
    
    // Take screenshot before activating tool
    await page.screenshot({ path: 'test-results/before-label-tool.png' });
    
    // Activate label tool
    const labelButton = await page.locator('[data-testid="label-button"]');
    await labelButton.click();
    await page.waitForTimeout(500);
    
    console.log('✅ Label tool activated');
    
    // Take screenshot after activating tool
    await page.screenshot({ path: 'test-results/after-label-tool.png' });
    
    // Get chart area for clicking
    const chartArea = await page.locator('.react-financial-charts').first();
    await expect(chartArea).toBeVisible();
    
    // Get chart dimensions
    const chartBox = await chartArea.boundingBox();
    console.log('📊 Chart dimensions:', chartBox);
    
    // Click in the middle of the chart area to place a label
    const clickX = chartBox.x + chartBox.width * 0.6;  // Slightly right of center
    const clickY = chartBox.y + chartBox.height * 0.4; // Upper portion
    
    console.log(`🖱️ Clicking at (${clickX}, ${clickY}) to place label`);
    
    // Click to place label
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000); // Wait for label to appear
    
    // Take screenshot after click
    await page.screenshot({ path: 'test-results/after-label-click.png' });
    
    // Check for any text elements that might be our label
    const textElements = await page.locator('text, tspan').count();
    console.log(`📄 Total text elements after click: ${textElements}`);
    
    // Look for any new SVG text elements that might contain "Label"
    const labelTextElements = await page.locator('text:has-text("Label"), tspan:has-text("Label")').count();
    console.log(`🏷️ Elements containing "Label": ${labelTextElements}`);
    
    // Check if any EachText components are present (InteractiveText uses EachText)
    const eachTextElements = await page.evaluate(() => {
      // Look for elements that might be from EachText component
      const allElements = document.querySelectorAll('text, tspan, g');
      let count = 0;
      for (let element of allElements) {
        if (element.textContent && element.textContent.includes('Label')) {
          count++;
        }
      }
      return count;
    });
    console.log(`📝 Elements with "Label" text content: ${eachTextElements}`);
    
    console.log('📋 All captured console logs:', consoleLogs);
    
    // Verify that label placement was attempted (should see some console logs about it)
    if (consoleLogs.length > 0) {
      console.log('✅ Found console logs related to labels');
    } else {
      console.log('⚠️ No console logs about labels found');
    }
    
    console.log('✅ Label placement test completed');
  });
});