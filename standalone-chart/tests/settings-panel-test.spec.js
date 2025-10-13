const { test, expect } = require('@playwright/test');

test.describe('Settings Panel', () => {
  test('settings button and zoom control', async ({ page }) => {
    // Set a longer timeout
    test.setTimeout(30000);
    
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Find and click the settings button
    await page.click('[data-testid="settings-button"]');
    
    // Verify settings panel opened
    await expect(page.locator('[data-testid="settings-panel"]')).toBeVisible();
    await expect(page.locator('.settings-header h3')).toHaveText('⚙️ Settings');
    
    // Check zoom control is present
    await expect(page.locator('.setting-label').first()).toHaveText('Zoom Sensitivity');
    
    // Test preset buttons using data-testid
    await page.click('[data-testid="preset-smooth"]');
    
    // Verify the zoom value updated
    await expect(page.locator('[data-testid="zoom-value"]')).toHaveText('3%');
    
    // Test the slider
    await page.locator('[data-testid="zoom-slider"]').fill('10');
    await expect(page.locator('[data-testid="zoom-value"]')).toHaveText('10%');
    
    // Close the panel
    await page.click('[data-testid="settings-close-button"]');
    await expect(page.locator('[data-testid="settings-panel"]')).not.toBeVisible();
    
    console.log('✅ Settings panel test passed!');
  });
});