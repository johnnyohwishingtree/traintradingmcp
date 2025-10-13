# Claude Development Guidelines

## Testing Strategy for Playwright Tests

### 1. Always Add `data-testid` Attributes to Interactive Components
When creating new UI components, immediately add `data-testid` attributes:
```tsx
<button className="chart-type-button" data-testid="chart-type-button">
<div className="indicators-panel" data-testid="indicators-panel">
<input className="date-input" data-testid="start-date-input">
```

### 2. Use `data-testid` Selectors in Tests (Not Class Names)
```typescript
// ✅ GOOD - Reliable and explicit
await page.click('[data-testid="chart-type-button"]');
await expect(page.locator('[data-testid="indicators-panel"]')).toBeVisible();

// ❌ BAD - Fragile and can break with styling changes
await page.click('.chart-type-button');
await page.locator('.indicators-panel');
```

### 3. Create Dedicated Test Elements When Needed
For tests that verify specific data (like decimal precision), add dedicated test areas:
```tsx
<div data-testid="price-info-area">
  Symbol: {symbol} | Last Price: ${price} | Range: ${low} - ${high}
</div>
```

### 4. Handle Click Interactions Defensively
When elements might be overlapped or intercepted:
```typescript
// Use force when needed
await page.click('[data-testid="element"]', { force: true });

// Or click on guaranteed safe areas
await page.click('[data-testid="price-info-area"]'); // Instead of overlapped areas
```

### 5. Wait for Elements Properly
```typescript
// Always wait for the main container first
await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
await page.waitForTimeout(2000); // Allow render time

// Then verify elements are visible before interaction
await expect(element).toBeVisible();
```

### 6. Test Patterns to Follow

#### Component Creation Checklist:
- [ ] Add `data-testid` to the component
- [ ] Add `data-testid` to key child elements (buttons, inputs, panels)
- [ ] Create test-friendly display areas if the component shows dynamic data

#### Test Writing Checklist:
- [ ] Use `data-testid` selectors exclusively
- [ ] Wait for main container to load first
- [ ] Verify element visibility before interaction
- [ ] Use flexible assertions (e.g., `toBeGreaterThan(0)` not exact counts)
- [ ] Handle overlapping elements with `force: true` or alternative targets

### 7. Naming Convention for Test IDs
```
main-chart-container     // Main containers
chart-type-button        // Buttons
indicators-panel         // Panels/overlays
start-date-input        // Input fields
price-info-area         // Display areas
indicator-{key}         // Dynamic items (e.g., indicator-sma50)
```

### 8. Quick Reference Commands

Run specific test:
```bash
npx playwright test tests/chart-type-test.spec.js --project=chromium
```

Run with shorter timeout for faster feedback:
```bash
npx playwright test --timeout=20000
```

Debug failing test:
```bash
npx playwright test --headed --timeout=30000
```

## Key Principle
**Make the implementation test-friendly, don't make tests fight the implementation.**

Adding `data-testid` attributes takes seconds but saves hours of debugging flaky tests.