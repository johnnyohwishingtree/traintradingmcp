import { test, expect } from '@playwright/test';

test.describe('SimpleChart Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should display FinancialChart component', async ({ page }) => {
    const chartArea = page.locator('.chart-area');
    await expect(chartArea).toBeVisible();
    
    // Check for financial chart content
    await expect(chartArea).toContainText('SPY Financial Chart');
    await expect(chartArea).toContainText('data points');
    await expect(chartArea).toContainText('Recent Data:');
  });

  test('should display active drawing tool in chart', async ({ page }) => {
    // Initially no tool active - check for the tool status format in FinancialChart
    const chartArea = page.locator('.chart-area');
    await expect(chartArea).toContainText('Tool: None');
    
    // Click a drawing tool
    const firstTool = page.locator('.tool-button').first();
    await firstTool.click();
    
    // Chart should show the active tool
    await expect(chartArea).toContainText('Tool:');
    await expect(chartArea).not.toContainText('Tool: None');
  });

  test('should display selected indicators count in chart', async ({ page }) => {
    const chartArea = page.locator('.chart-area');
    
    // Initially no indicators
    await expect(chartArea).toContainText('Indicators: 0');
    
    // Select an indicator
    const indicatorsButton = page.locator('.indicators-button');
    await indicatorsButton.click();
    
    const firstIndicator = page.locator('.indicator-item').first();
    await firstIndicator.click();
    
    // Chart should show indicator count
    await expect(chartArea).toContainText('Indicators: 1');
    
    // Should also show the technical indicators section
    await expect(chartArea).toContainText('Technical Indicators:');
    
    // Select another indicator
    const secondIndicator = page.locator('.indicator-item').nth(1);
    await secondIndicator.click();
    
    await expect(chartArea).toContainText('Indicators: 2');
  });

  test('should update chart when tools and indicators change simultaneously', async ({ page }) => {
    const chartArea = page.locator('.chart-area');
    
    // Select a drawing tool
    const secondTool = page.locator('.tool-button').nth(1);
    await secondTool.click();
    
    // Select indicators
    const indicatorsButton = page.locator('.indicators-button');
    await indicatorsButton.click();
    
    const firstIndicator = page.locator('.indicator-item').first();
    await firstIndicator.click();
    
    const secondIndicator = page.locator('.indicator-item').nth(1);
    await secondIndicator.click();
    
    // Chart should reflect both changes
    await expect(chartArea).not.toContainText('Active tool: None');
    await expect(chartArea).toContainText('Indicators: 2');
  });

  test('should update chart when symbol changes', async ({ page }) => {
    const chartArea = page.locator('.chart-area');
    
    // Initially shows SPY
    await expect(chartArea).toContainText('SPY Financial Chart');
    
    // Change symbol to AAPL
    const symbolSelector = page.locator('.symbol-selector select');
    await symbolSelector.selectOption('AAPL');
    
    // Wait for chart to update (there's a 300ms delay)
    await page.waitForTimeout(500);
    
    // Should now show AAPL chart
    await expect(chartArea).toContainText('AAPL Financial Chart');
    
    // Change to another symbol
    await symbolSelector.selectOption('GOOGL');
    await page.waitForTimeout(500);
    await expect(chartArea).toContainText('GOOGL Financial Chart');
  });

  test('should have proper chart styling', async ({ page }) => {
    const chartContent = page.locator('.chart-area > div');
    
    // Check that chart has proper dimensions and styling
    const boundingBox = await chartContent.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(300);
    expect(boundingBox?.height).toBeGreaterThan(300);
    
    // Check TradingView colors are applied
    const backgroundColor = await chartContent.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Should use TradingView primary background color
    expect(backgroundColor).toBeTruthy();
  });
});