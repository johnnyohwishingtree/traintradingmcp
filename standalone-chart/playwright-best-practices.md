# Playwright Test Best Practices

## 1. Reliable Element Selection

### ✅ Good Practices:
```typescript
// Use data-testid attributes
await page.locator('[data-testid="main-chart-container"]')

// Use specific, stable selectors
await page.locator('.chart-container canvas')

// Multiple fallback selectors
const element = page.locator('[data-testid="chart"], .chart-container').first()
```

### ❌ Avoid:
```typescript
// Generic selectors
await page.locator('svg').first()
await page.locator('div').nth(3)

// Brittle selectors dependent on structure
await page.locator('div > div > span:nth-child(2)')
```

## 2. Defensive Waiting

### ✅ Good Practices:
```typescript
// Wait for specific states
await page.waitForSelector('[data-testid="chart"]', { timeout: 10000 });
await expect(page.locator('[data-testid="chart"]')).toBeVisible();
await page.waitForLoadState('networkidle');

// Wait for content to be ready
await expect(page.locator('.price-label')).toContainText(/\$\d+/);
```

### ❌ Avoid:
```typescript
// Fixed arbitrary timeouts
await page.waitForTimeout(5000);

// No verification element exists
await page.click('.some-button'); // May not exist yet
```

## 3. Interaction Best Practices

### ✅ Good Practices:
```typescript
// Check element is interactable first
await expect(button).toBeVisible();
await expect(button).toBeEnabled();
await button.click();

// Use force when dealing with overlapped elements
await page.click('[data-testid="safe-area"]', { force: true });

// Keyboard alternatives for difficult interactions
await page.keyboard.press('Escape');
```

### ❌ Avoid:
```typescript
// Direct interaction without verification
await page.click('.button'); // May be covered or disabled

// Complex coordinate-based interactions
await page.click('.container', { position: { x: 123, y: 456 } });
```

## 4. Flexible Assertions

### ✅ Good Practices:
```typescript
// Test functionality, not exact counts
expect(priceLabels.length).toBeGreaterThan(0);

// Use pattern matching for dynamic content
await expect(page.locator('.price')).toContainText(/\$\d+\.\d{2}/);

// Test presence, not exact text
await expect(page.locator('.tooltip')).toBeVisible();
```

### ❌ Avoid:
```typescript
// Brittle exact counts
expect(elements.length).toBe(7);

// Exact text matching for dynamic content
await expect(element).toHaveText('Price: $123.45');
```

## 5. Component-Specific Data Test IDs

Add these to your components:

```tsx
// Main containers
<div className="chart-container" data-testid="main-chart-container">

// Interactive elements  
<button className="chart-type-button" data-testid="chart-type-button">

// Panels and overlays
<div className="chart-type-panel" data-testid="chart-type-panel">

// Dynamic content areas
<div className="price-display" data-testid="current-price">
```

## 6. Test Structure Template

```typescript
test('should perform action', async ({ page }) => {
  // 1. Navigate and wait for load
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(1000); // Allow render
  
  // 2. Verify initial state
  await expect(page.locator('[data-testid="chart"]')).toBeVisible();
  
  // 3. Perform action with verification
  const button = page.locator('[data-testid="action-button"]');
  await expect(button).toBeVisible();
  await button.click();
  
  // 4. Wait for result and verify
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

## 7. Error Recovery Patterns

```typescript
// Retry pattern
await test.step('Click button with retry', async () => {
  for (let i = 0; i < 3; i++) {
    try {
      await page.click('[data-testid="button"]');
      break;
    } catch (error) {
      if (i === 2) throw error;
      await page.waitForTimeout(1000);
    }
  }
});

// Alternative action pattern  
test('should close panel', async ({ page }) => {
  // Try primary method
  try {
    await page.click('[data-testid="close-button"]');
  } catch {
    // Fallback method
    await page.keyboard.press('Escape');
  }
  
  await expect(page.locator('[data-testid="panel"]')).not.toBeVisible();
});
```

## 8. Configuration Best Practices

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30000,
  expect: { timeout: 10000 },
  retries: 2,
  workers: process.env.CI ? 1 : 4,
  
  use: {
    actionTimeout: 5000,
    navigationTimeout: 15000,
  }
});
```