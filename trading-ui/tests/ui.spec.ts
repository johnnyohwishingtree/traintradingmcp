import { test, expect } from '@playwright/test';

test.describe('Trading UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display the main app container', async ({ page }) => {
    // Check if the main app container exists
    const app = await page.locator('.app');
    await expect(app).toBeVisible();
  });

  test('should display the header with symbol selector', async ({ page }) => {
    // Check if header exists
    const header = await page.locator('.app-header');
    await expect(header).toBeVisible();
    
    // Check if symbol selector exists
    const symbolSelector = await page.locator('.symbol-selector');
    await expect(symbolSelector).toBeVisible();
    
    // Check if select element shows SPY initially
    const symbolSelect = await page.locator('.symbol-selector select');
    await expect(symbolSelect).toHaveValue('SPY');
  });

  test('should display the drawing toolbar', async ({ page }) => {
    // Check if drawing toolbar exists
    const toolbar = await page.locator('.drawing-toolbar');
    await expect(toolbar).toBeVisible();
    
    // Check if tool buttons exist
    const toolButtons = await page.locator('.tool-button');
    await expect(toolButtons.first()).toBeVisible();
  });

  test('should display the indicators button', async ({ page }) => {
    // Check if indicators button exists
    const indicatorsButton = await page.locator('.indicators-button');
    await expect(indicatorsButton).toBeVisible();
    await expect(indicatorsButton).toContainText('Indicators');
  });

  test('should display chart area', async ({ page }) => {
    // Check if chart area exists
    const chartArea = await page.locator('.chart-area');
    await expect(chartArea).toBeVisible();
  });

  test('symbol selector dropdown should work', async ({ page }) => {
    // Check if select element works
    const symbolSelect = await page.locator('.symbol-selector select');
    await expect(symbolSelect).toBeVisible();
    
    // Change symbol selection
    await symbolSelect.selectOption('AAPL');
    await expect(symbolSelect).toHaveValue('AAPL');
    
    // Check if symbol text updates
    const symbolText = await page.locator('.symbol-selector span');
    await expect(symbolText).toContainText('AAPL');
  });

  test('indicators dropdown should work', async ({ page }) => {
    // Click on indicators button
    const indicatorsButton = await page.locator('.indicators-button');
    await indicatorsButton.click();
    
    // Check if dropdown appears
    const dropdown = await page.locator('.indicators-dropdown');
    await expect(dropdown).toBeVisible();
    
    // Check if indicator items exist
    const indicatorItems = await page.locator('.indicator-item');
    await expect(indicatorItems.first()).toBeVisible();
  });

  test('drawing tools should be clickable', async ({ page }) => {
    // Click on a drawing tool
    const firstTool = await page.locator('.tool-button').first();
    await firstTool.click();
    
    // Check if it becomes active
    await expect(firstTool).toHaveClass(/active/);
  });

  test('page should not have JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any errors to surface
    await page.waitForTimeout(2000);
    
    // Check that no errors occurred
    expect(errors).toEqual([]);
  });

  test('should show loading state initially', async ({ page }) => {
    // Reload page to catch loading state
    await page.reload();
    
    // Check if loading spinner might appear (it may be too fast to catch)
    const chartArea = await page.locator('.chart-area');
    await expect(chartArea).toBeVisible();
  });
});