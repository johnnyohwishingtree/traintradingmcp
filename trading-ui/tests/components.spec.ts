import { test, expect } from '@playwright/test';

test.describe('Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('all core components should be visible and functional', async ({ page }) => {
    // Test main app container
    await expect(page.locator('.app')).toBeVisible();
    
    // Test header components
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.header-left')).toBeVisible();
    await expect(page.locator('.header-center')).toBeVisible();
    await expect(page.locator('.header-right')).toBeVisible();
    
    // Test main content area
    await expect(page.locator('.app-main')).toBeVisible();
    await expect(page.locator('.chart-area')).toBeVisible();
  });

  test('drawing toolbar should be functional', async ({ page }) => {
    const toolbar = page.locator('.drawing-toolbar');
    await expect(toolbar).toBeVisible();
    
    // Test that tool buttons exist and are clickable
    const toolButtons = page.locator('.tool-button');
    const buttonCount = await toolButtons.count();
    expect(buttonCount).toBeGreaterThan(10); // Should have many drawing tools
    
    // Test clicking first tool activates it
    const firstTool = toolButtons.first();
    await firstTool.click();
    await expect(firstTool).toHaveClass(/active/);
    
    // Test clicking same tool deactivates it
    await firstTool.click();
    await expect(firstTool).not.toHaveClass(/active/);
    
    // Test clicking different tool switches selection
    const secondTool = toolButtons.nth(1);
    await secondTool.click();
    await expect(secondTool).toHaveClass(/active/);
    await expect(firstTool).not.toHaveClass(/active/);
  });

  test('indicators button should work with dropdown', async ({ page }) => {
    const indicatorsButton = page.locator('.indicators-button');
    await expect(indicatorsButton).toBeVisible();
    await expect(indicatorsButton).toContainText('Indicators');
    
    // Test dropdown opens
    await indicatorsButton.click();
    const dropdown = page.locator('.indicators-dropdown');
    await expect(dropdown).toBeVisible();
    
    // Test dropdown contains indicators
    const indicatorItems = page.locator('.indicator-item');
    const itemCount = await indicatorItems.count();
    expect(itemCount).toBeGreaterThan(5); // Should have several indicators
    
    // Test selecting an indicator
    const firstIndicator = indicatorItems.first();
    await firstIndicator.click();
    
    // Test indicator count updates in button
    await expect(indicatorsButton).toContainText('1');
    
    // Test selecting another indicator
    const secondIndicator = indicatorItems.nth(1);
    await secondIndicator.click();
    await expect(indicatorsButton).toContainText('2');
  });

  test('symbol selector should work', async ({ page }) => {
    const symbolSelector = page.locator('.symbol-selector select');
    await expect(symbolSelector).toBeVisible();
    
    // Test initial selection
    await expect(symbolSelector).toHaveValue('SPY');
    
    // Test changing symbol
    await symbolSelector.selectOption('AAPL');
    await expect(symbolSelector).toHaveValue('AAPL');
    
    // Test symbol display updates
    const symbolText = page.locator('.symbol-selector span');
    await expect(symbolText).toContainText('AAPL');
  });

  test('chart area should be present and ready for charts', async ({ page }) => {
    const chartArea = page.locator('.chart-area');
    await expect(chartArea).toBeVisible();
    
    // Chart area should have some content (either placeholder or actual chart)
    const chartContent = chartArea.locator('> *').first();
    await expect(chartContent).toBeVisible();
  });

  test('app state should update when interacting with components', async ({ page }) => {
    // Test drawing tool state
    const firstTool = page.locator('.tool-button').first();
    await firstTool.click();
    
    // Test indicator state  
    const indicatorsButton = page.locator('.indicators-button');
    await indicatorsButton.click();
    const firstIndicator = page.locator('.indicator-item').first();
    await firstIndicator.click();
    
    // Test symbol state
    const symbolSelector = page.locator('.symbol-selector select');
    await symbolSelector.selectOption('AAPL');
    
    // Verify states are maintained
    await expect(firstTool).toHaveClass(/active/);
    await expect(indicatorsButton).toContainText('1');
    await expect(symbolSelector).toHaveValue('AAPL');
  });

  test('should handle errors gracefully', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Perform various interactions
    await page.locator('.tool-button').first().click();
    await page.locator('.indicators-button').click();
    await page.locator('.indicator-item').first().click();
    
    // Wait for any async errors
    await page.waitForTimeout(1000);
    
    // Should have no JavaScript errors
    expect(errors).toEqual([]);
  });
});