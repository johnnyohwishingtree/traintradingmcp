const { test, expect } = require('@playwright/test');

test.describe('PineScript Chart Integration', () => {
  test('should show imported indicator panel and toggle functionality', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the main chart container to load
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 15000 });
    await page.waitForTimeout(3000); // Allow chart to fully render
    
    // Open PineScript importer
    await page.click('[data-testid="pinescript-button"]');
    await expect(page.locator('[data-testid="pinescript-importer"]')).toBeVisible();
    
    // Load COG Double Channel sample
    await page.click('[data-testid="sample-cog-double-channel"]');
    
    // Verify script is loaded
    const scriptContent = await page.locator('[data-testid="script-textarea"]').inputValue();
    expect(scriptContent).toContain('COG Double Channel');
    
    // Import the indicator
    await page.click('[data-testid="import-button"]');
    await page.waitForTimeout(2000); // Wait for import to complete
    
    // Close the importer
    await page.click('[data-testid="importer-close-button"]');
    await expect(page.locator('[data-testid="pinescript-importer"]')).not.toBeVisible();
    
    // Check if the chart indicators panel appears
    await expect(page.locator('[data-testid="chart-indicators-panel"]')).toBeVisible();
    
    // Verify the indicator is listed in the panel
    const indicatorToggle = page.locator('[data-testid="indicator-toggle-0"]');
    await expect(indicatorToggle).toBeVisible();
    
    // Check that the indicator is enabled by default (eye icon should show enabled state)
    const toggleButton = await indicatorToggle.textContent();
    expect(toggleButton).toBe('👁️'); // Enabled eye icon
    
    // Toggle the indicator off
    await indicatorToggle.click();
    await page.waitForTimeout(500);
    
    // Verify the eye icon changed to disabled state
    const toggleButtonAfter = await indicatorToggle.textContent();
    expect(toggleButtonAfter).toBe('👁️‍🗨️'); // Disabled eye icon
    
    // Toggle it back on
    await indicatorToggle.click();
    await page.waitForTimeout(500);
    
    const toggleButtonFinal = await indicatorToggle.textContent();
    expect(toggleButtonFinal).toBe('👁️'); // Back to enabled
    
    console.log('✅ PineScript chart integration test completed successfully');
  });

  test('should import multiple indicators and show them in panel', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the main chart container to load
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Import first indicator - COG Double Channel
    await page.click('[data-testid="pinescript-button"]');
    await page.click('[data-testid="sample-cog-double-channel"]');
    await page.click('[data-testid="import-button"]');
    await page.waitForTimeout(1000);
    
    // Import second indicator - RSI
    await page.click('[data-testid="sample-rsi-oscillator"]');
    await page.click('[data-testid="import-button"]');
    await page.waitForTimeout(1000);
    
    // Close importer
    await page.click('[data-testid="importer-close-button"]');
    
    // Verify panel shows both indicators
    await expect(page.locator('[data-testid="chart-indicators-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="indicator-toggle-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="indicator-toggle-1"]')).toBeVisible();
    
    console.log('✅ Multiple indicators import test completed successfully');
  });
});