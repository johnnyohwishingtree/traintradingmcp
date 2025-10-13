const { test, expect } = require('@playwright/test');

test.describe('Chart Type Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for the chart to load using data-testid
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should open and close chart type panel', async ({ page }) => {
    // Chart type panel should not be visible initially
    await expect(page.locator('[data-testid="chart-type-panel"]')).not.toBeVisible();
    
    // Click chart type button
    await page.click('[data-testid="chart-type-button"]');
    
    // Chart type panel should now be visible
    await expect(page.locator('[data-testid="chart-type-panel"]')).toBeVisible();
    await expect(page.locator('.chart-type-header h3')).toHaveText('📊 Chart Type');
    
    // Close using the X button
    await page.click('[data-testid="chart-type-panel"] .close-button');
    
    // Panel should be hidden
    await expect(page.locator('[data-testid="chart-type-panel"]')).not.toBeVisible();
  });

  test('should switch between different chart types', async ({ page }) => {
    // Open chart type panel
    await page.click('.chart-type-button');
    await expect(page.locator('.chart-type-panel')).toBeVisible();
    
    // Default should be candlestick selected
    await expect(page.locator('.chart-type-item.selected .chart-type-label')).toHaveText('Candlestick');
    
    // Switch to Line Chart
    await page.click('.chart-type-item:has(.chart-type-label:text("Line Chart"))');
    
    // Panel should close after selection
    await expect(page.locator('.chart-type-panel')).not.toBeVisible();
    
    // Open panel again to verify selection
    await page.click('.chart-type-button');
    await expect(page.locator('.chart-type-item.selected .chart-type-label')).toHaveText('Line Chart');
    
    // Switch to Area Chart
    await page.click('.chart-type-item:has(.chart-type-label:text("Area Chart"))');
    
    // Verify selection changed
    await page.click('.chart-type-button');
    await expect(page.locator('.chart-type-item.selected .chart-type-label')).toHaveText('Area Chart');
    
    // Switch to OHLC Bars
    await page.click('.chart-type-item:has(.chart-type-label:text("OHLC Bars"))');
    
    // Verify selection changed
    await page.click('.chart-type-button');
    await expect(page.locator('.chart-type-item.selected .chart-type-label')).toHaveText('OHLC Bars');
  });

  test('should show correct icons and descriptions for each chart type', async ({ page }) => {
    // Open chart type panel
    await page.click('.chart-type-button');
    
    // Check all chart types are present with correct descriptions
    const chartTypes = [
      { label: 'Candlestick', description: 'OHLC data as candlesticks' },
      { label: 'OHLC Bars', description: 'Traditional bar charts' },
      { label: 'Line Chart', description: 'Simple line connecting closes' },
      { label: 'Area Chart', description: 'Line chart with filled area' }
    ];
    
    for (const chartType of chartTypes) {
      const item = page.locator('.chart-type-item', { has: page.locator('.chart-type-label', { hasText: chartType.label }) });
      await expect(item.locator('.chart-type-label')).toHaveText(chartType.label);
      await expect(item.locator('.chart-type-description')).toHaveText(chartType.description);
      await expect(item.locator('.chart-type-icon svg')).toBeVisible();
    }
  });

  test('should close panel when clicking outside', async ({ page }) => {
    // Open chart type panel
    await page.click('[data-testid=\"chart-type-button\"]');
    await expect(page.locator('[data-testid=\"chart-type-panel\"]')).toBeVisible();
    
    // Click outside the panel on the price info area (guaranteed to be outside)
    await page.click('[data-testid=\"price-info-area\"]', { force: true });
    await page.waitForTimeout(300);
    
    // Panel should close
    await expect(page.locator('[data-testid=\"chart-type-panel\"]')).not.toBeVisible();
  });

  test('should show checkmark for selected chart type', async ({ page }) => {
    // Open chart type panel
    await page.click('.chart-type-button');
    
    // Default candlestick should show checkmark
    await expect(page.locator('.chart-type-item.selected .chart-type-selected')).toHaveText('✓');
    
    // Switch to line chart
    await page.click('.chart-type-item:has(.chart-type-label:text("Line Chart"))');
    
    // Open panel again and verify checkmark moved
    await page.click('.chart-type-button');
    await expect(page.locator('.chart-type-item.selected .chart-type-selected')).toHaveText('✓');
    await expect(page.locator('.chart-type-item.selected .chart-type-label')).toHaveText('Line Chart');
  });

  test('should apply visual selection styling', async ({ page }) => {
    // Open chart type panel
    await page.click('.chart-type-button');
    
    // Check selected item has the correct class and styling
    const selectedItem = page.locator('.chart-type-item.selected');
    await expect(selectedItem).toBeVisible();
    
    // Check that non-selected items don't have the selected class
    const nonSelectedItems = page.locator('.chart-type-item:not(.selected)');
    await expect(nonSelectedItems).toHaveCount(3); // Should be 3 non-selected items
  });
});