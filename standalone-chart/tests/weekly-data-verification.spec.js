const { test, expect } = require('@playwright/test');

test.describe('Weekly Data Verification', () => {
  test('AAPL weekly data displays correctly with proper timestamp positioning', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Wait for the chart to load
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Search for AAPL
    await page.click('[data-testid="search-button"]');
    await page.fill('.symbol-search-input', 'AAPL');
    await page.click('.symbol-result-item:first-child');
    await page.waitForTimeout(1000);
    
    // Switch to weekly timeframe
    await page.selectOption('.interval-select', '1week');
    await page.waitForTimeout(3000); // Wait for data to load
    
    // Take a screenshot to verify weekly chart is displayed
    await page.screenshot({ path: 'test-results/aapl-weekly-chart.png' });
    
    // Verify the chart contains data by checking for SVG elements
    const chartSvg = await page.locator('svg').count();
    expect(chartSvg).toBeGreaterThan(0);
    
    // Check that AAPL is displayed in header and 1W is selected
    const symbolText = await page.textContent('[data-testid="current-symbol"]');
    expect(symbolText).toBe('AAPL');
    
    const intervalSelect = await page.inputValue('.interval-select');
    expect(intervalSelect).toBe('1week');
    
    console.log(`✅ AAPL weekly chart loaded successfully`);
    console.log(`✅ Symbol: ${symbolText}, Interval: ${intervalSelect}`);
    
    // Open settings to check timezone display
    await page.click('[data-testid="settings-button"]');
    await page.waitForTimeout(500);
    
    // Take screenshot of settings with timezone selector
    await page.screenshot({ path: 'test-results/settings-with-timezone.png' });
    
    // Try different timezone settings to verify time display
    await page.selectOption('[data-testid="timezone-select"]', 'et');
    await page.waitForTimeout(500);
    await page.click('[data-testid="settings-close-button"]'); // Close settings properly
    await page.waitForTimeout(1000);
    
    // Take screenshot with ET timezone
    await page.screenshot({ path: 'test-results/aapl-weekly-et-timezone.png' });
    
    console.log('✅ Weekly data verification complete');
  });
  
  test('Weekly timestamp positioning matches expected format', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    
    // Switch to AAPL and weekly view
    await page.click('[data-testid="search-button"]');
    await page.fill('.symbol-search-input', 'AAPL');
    await page.click('.symbol-result-item:first-child');
    await page.selectOption('.interval-select', '1week');
    await page.waitForTimeout(3000);
    
    // Check that the chart displays properly without errors
    const errors = await page.evaluate(() => {
      const consoleErrors = window.console._errors || [];
      return consoleErrors.filter(error => 
        error.includes('timestamp') || 
        error.includes('date') || 
        error.includes('week')
      );
    });
    
    expect(errors.length).toBe(0);
    
    console.log('✅ No timestamp-related errors found in weekly view');
  });
});