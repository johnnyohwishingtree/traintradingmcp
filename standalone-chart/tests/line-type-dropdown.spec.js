const { test, expect } = require('@playwright/test');

test.describe('Line Type Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="drawing-toolbar"]', { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow app to fully load
  });

  test('opens and closes line type dropdown', async ({ page }) => {
    // Click line tools button to open dropdown
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    
    // Verify dropdown is visible
    await expect(page.locator('[data-testid="line-dropdown"]')).toBeVisible();
    
    // Verify all 8 line types are present
    await expect(page.locator('[data-testid="line-type-trendline"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-type-trendchannel"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-type-ray"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-type-extendedline"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-type-infoline"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-type-horizontalline"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-type-horizontalray"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-type-verticalline"]')).toBeVisible();
    
    // Take screenshot of open dropdown
    await page.screenshot({ path: 'test-results/line-dropdown-open.png' });
    
    // Click outside to close dropdown
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(300);
    
    // Verify dropdown is hidden
    await expect(page.locator('[data-testid="line-dropdown"]')).not.toBeVisible();
  });

  test('selects different line types', async ({ page }) => {
    // Open dropdown
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    
    // Select Ray line type
    await page.click('[data-testid="line-type-ray"]');
    await page.waitForTimeout(300);
    
    // Verify dropdown closes after selection
    await expect(page.locator('[data-testid="line-dropdown"]')).not.toBeVisible();
    
    // Verify line tools button is active (indicating a line tool is selected)
    await expect(page.locator('[data-testid="line-tools-button"]')).toHaveClass(/active/);
    
    // Open dropdown again to select different type
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    
    // Select Trend Channel
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(300);
    
    // Verify dropdown closes
    await expect(page.locator('[data-testid="line-dropdown"]')).not.toBeVisible();
    
    // Take screenshot of final state
    await page.screenshot({ path: 'test-results/line-type-selected.png' });
  });

  test('switches between cursor and line tools', async ({ page }) => {
    // Initially cursor should be active
    await expect(page.locator('[data-testid="cursor-button"]')).toHaveClass(/active/);
    
    // Click line tools button
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    
    // Verify line tools button is now active and cursor is not
    await expect(page.locator('[data-testid="line-tools-button"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="cursor-button"]')).not.toHaveClass(/active/);
    
    // Click cursor button
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(300);
    
    // Verify cursor is active and line tools is not
    await expect(page.locator('[data-testid="cursor-button"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="line-tools-button"]')).not.toHaveClass(/active/);
    
    // Take screenshot of cursor mode
    await page.screenshot({ path: 'test-results/cursor-mode-active.png' });
  });

  test('verifies line type titles and labels', async ({ page }) => {
    // Open dropdown
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    
    // Check that line type labels are correct
    const expectedLabels = [
      { testId: 'line-type-trendline', label: 'Trend line' },
      { testId: 'line-type-trendchannel', label: 'Trend channel' },
      { testId: 'line-type-ray', label: 'Ray' },
      { testId: 'line-type-extendedline', label: 'Extended line' },
      { testId: 'line-type-infoline', label: 'Info line' },
      { testId: 'line-type-horizontalline', label: 'Horizontal line' },
      { testId: 'line-type-horizontalray', label: 'Horizontal ray' },
      { testId: 'line-type-verticalline', label: 'Vertical line' }
    ];
    
    for (const item of expectedLabels) {
      const element = page.locator(`[data-testid="${item.testId}"]`);
      await expect(element).toBeVisible();
      await expect(element).toContainText(item.label);
    }
    
    // Take screenshot of dropdown with all labels visible
    await page.screenshot({ path: 'test-results/line-dropdown-labels.png' });
  });

  test('maintains line tool state across interactions', async ({ page }) => {
    // Select a specific line type
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-horizontalline"]');
    await page.waitForTimeout(300);
    
    // Switch to cursor
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(300);
    
    // Click line tools button again - should activate the previously selected line type
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    
    // Verify line tools is active
    await expect(page.locator('[data-testid="line-tools-button"]')).toHaveClass(/active/);
    
    // The dropdown should be open now since we activated the tool, so check the selected state
    const dropdown = page.locator('[data-testid="line-dropdown"]');
    if (await dropdown.count() > 0) {
      // The horizontal line button should have the 'selected' class
      await expect(page.locator('[data-testid="line-type-horizontalline"]')).toHaveClass(/selected/);
    } else {
      // If dropdown is not open, click the button again to open it
      await page.click('[data-testid="line-tools-button"]');
      await page.waitForTimeout(300);
      await expect(page.locator('[data-testid="line-type-horizontalline"]')).toHaveClass(/selected/);
    }
    
    // Take screenshot of state persistence
    await page.screenshot({ path: 'test-results/line-type-state-persistence.png' });
  });
});