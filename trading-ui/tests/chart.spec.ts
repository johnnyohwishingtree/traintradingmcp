import { test, expect } from '@playwright/test';

test.describe('Chart Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('chart area should be ready for chart components', async ({ page }) => {
    const chartArea = page.locator('.chart-area');
    await expect(chartArea).toBeVisible();
    
    // Chart area should have content
    const hasContent = await chartArea.locator('*').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('chart should respond to indicator selections', async ({ page }) => {
    // Open indicators dropdown
    await page.locator('.indicators-button').click();
    
    // Select some indicators
    await page.locator('.indicator-item').first().click();
    await page.locator('.indicator-item').nth(1).click();
    
    // Chart area should still be visible and functional
    const chartArea = page.locator('.chart-area');
    await expect(chartArea).toBeVisible();
    
    // Indicator button should show count
    const indicatorsButton = page.locator('.indicators-button');
    await expect(indicatorsButton).toContainText('2');
  });

  test('chart should respond to drawing tool selections', async ({ page }) => {
    // Select a drawing tool
    const trendlineTool = page.locator('.tool-button[title*="Trend"]');
    if (await trendlineTool.count() > 0) {
      await trendlineTool.click();
      await expect(trendlineTool).toHaveClass(/active/);
    }
    
    // Chart area should still be functional
    const chartArea = page.locator('.chart-area');
    await expect(chartArea).toBeVisible();
  });

  test('chart should respond to symbol changes', async ({ page }) => {
    // Change symbol
    const symbolSelector = page.locator('.symbol-selector select');
    await symbolSelector.selectOption('AAPL');
    
    // Chart area should remain functional
    const chartArea = page.locator('.chart-area');
    await expect(chartArea).toBeVisible();
    
    // Symbol should be updated
    await expect(symbolSelector).toHaveValue('AAPL');
  });

  test('app should handle rapid interactions without breaking', async ({ page }) => {
    // Rapid tool selections
    const tools = page.locator('.tool-button');
    const toolCount = await tools.count();
    
    for (let i = 0; i < Math.min(5, toolCount); i++) {
      await tools.nth(i).click();
      await page.waitForTimeout(100);
    }
    
    // Rapid indicator selections
    await page.locator('.indicators-button').click();
    const indicators = page.locator('.indicator-item');
    const indicatorCount = await indicators.count();
    
    for (let i = 0; i < Math.min(3, indicatorCount); i++) {
      await indicators.nth(i).click();
      await page.waitForTimeout(100);
    }
    
    // App should still be functional
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.chart-area')).toBeVisible();
  });
});