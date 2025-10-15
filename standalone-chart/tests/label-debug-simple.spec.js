const { test, expect } = require('@playwright/test');

test.describe('Label Debug', () => {
  test('should show console logs when activating label tool', async ({ page }) => {
    const consoleLogs = [];
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('🏷️')) {
        consoleLogs.push(msg.text());
        console.log('Console:', msg.text());
      }
    });
    
    // Navigate to the chart application
    await page.goto('http://localhost:3000');
    
    // Wait for the main chart container to be visible
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow chart to fully render
    
    console.log('🧪 Activating label tool...');
    
    // Find the label button using data-testid (should be label-button based on the code)
    const labelButton = await page.locator('[data-testid="label-button"]');
    
    console.log('🔍 Looking for label button...');
    await expect(labelButton).toBeVisible();
    
    console.log('✅ Found label button, clicking...');
    await labelButton.click();
    await page.waitForTimeout(1000);
    
    console.log('📋 Captured console logs:', consoleLogs);
    
    // Check if we got the debug log
    const hasLabelLog = consoleLogs.some(log => log.includes('InteractiveText render'));
    console.log('🎯 Found InteractiveText render log:', hasLabelLog);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/label-debug-activated.png' });
  });
});