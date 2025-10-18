# Claude Code Development Guidelines

## ⚠️ CRITICAL: The Problem We're Solving

**Claude Code struggles with debugging because it can't "see" what's happening in the browser.**

This document provides a systematic workflow to overcome this limitation using Chrome MCP and Playwright MCP.

---

## Core Philosophy: Data-Driven Debugging

**NEVER guess at fixes. ALWAYS gather data first.**

### Why Debugging Fails

1. **No runtime visibility** - Claude can't see the browser state
2. **Compounding errors** - One wrong guess leads to cascading failures
3. **Context degradation** - After 3-4 failed attempts, loses track of root cause
4. **Blind fixes** - Changes code without verification

### The Solution

Use **Chrome MCP** and **Playwright MCP** to make the invisible visible.

---

## Before Writing ANY Code

### 1. Break Tasks Into Tiny Pieces
- **Maximum 50 lines of code per task**
- One feature at a time
- One file at a time when possible

### 2. Write Tests First (TDD)
```typescript
// 1. Write test that describes what SHOULD happen
test('button click opens modal', async ({ page }) => {
  await page.click('[data-testid="button"]');
  await expect(page.locator('[data-testid="modal"]')).toBeVisible();
});

// 2. Run test - it should FAIL
// 3. Write minimum code to pass test
// 4. Run test - it should PASS
// 5. Use Chrome MCP to verify visually
```

### 3. Use Chrome MCP to Understand Current State
```javascript
// Before changing anything, inspect:
- DOM structure
- Console errors
- Network requests
- Event listeners
- Component state
```

---

## When Code Doesn't Work

### STOP. Follow This Process:

#### Step 1: Use Chrome MCP to Inspect Browser
```javascript
// Check console errors
mcp__chrome-devtools__list_console_messages

// Take screenshot
mcp__chrome-devtools__take_screenshot

// Evaluate JavaScript to inspect state
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const button = document.querySelector('[data-testid="button"]');
    return {
      exists: !!button,
      visible: button?.offsetParent !== null,
      disabled: button?.disabled,
      listeners: getEventListeners(button)
    };
  }`
})
```

#### Step 2: Use Playwright to Run Tests
```bash
# Run specific test
npx playwright test tests/feature-test.spec.ts

# Debug mode with headed browser
npx playwright test --headed --debug
```

#### Step 3: Analyze ACTUAL Error
- Read the error message carefully
- Check what Chrome MCP shows vs what you expected
- Don't assume - verify with data

#### Step 4: Make ONE Small Fix
- Change ONE thing at a time
- No "while I'm here" refactoring
- No multiple unrelated changes

#### Step 5: Verify Immediately
```bash
# Rebuild if library code changed
cd financial-charts && npm run build

# Restart servers
./restart-servers.sh

# Use Chrome MCP to verify
# Run Playwright test to confirm
```

#### Step 6: Repeat If Needed
- If still broken, go back to Step 1
- Don't make another guess - gather more data

---

## Development Rules

### ✅ DO:

- **Break tasks into < 50 line chunks**
- **Write test first** (TDD approach)
- **Use Chrome MCP after every change**
- **Add console.log with emoji markers**:
  ```javascript
  console.log('🎯 Component clicked:', { id, state });
  console.log('📝 Form submitted:', formData);
  console.log('🔍 State updated:', newState);
  console.log('❌ Error occurred:', error);
  console.log('✅ Success:', result);
  ```
- **Use data-testid for all interactive elements**
- **Keep a debug log** of what was tried and why it failed

### ❌ NEVER:

- **Make multiple changes at once**
- **Guess without checking browser first**
- **Skip testing after changes**
- **Rewrite large sections without understanding root cause**
- **Remove debugging code until feature fully works**
- **Use CSS class selectors in tests** (use data-testid)

---

## Testing Strategy

### All Interactive Components MUST Have:

#### 1. data-testid Attributes
```tsx
// ✅ GOOD
<button data-testid="submit-button">Submit</button>
<div data-testid="modal">...</div>

// ❌ BAD
<button className="submit-btn">Submit</button>
```

#### 2. Playwright Tests
```typescript
test('Feature name - expected behavior', async ({ page }) => {
  // 1. Setup
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="container"]');

  // 2. Action
  await page.click('[data-testid="button"]');

  // 3. Assert
  await expect(page.locator('[data-testid="result"]')).toBeVisible();

  // 4. Screenshot for debugging
  await page.screenshot({ path: 'test-results/test.png' });
});
```

#### 3. Console Logging for Debugging
```typescript
// Use emoji markers for easy filtering
console.log('🔘 Button render:', { show, enabled });
console.log('🖱️ Click detected:', { x, y, target });
console.log('📝 State change:', { before, after });
```

---

## Chrome MCP Usage Patterns

### Check If Element Exists and Is Clickable
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const el = document.querySelector('[data-testid="button"]');
    return {
      exists: !!el,
      visible: el?.offsetParent !== null,
      disabled: el?.disabled,
      rect: el?.getBoundingClientRect(),
      computed: window.getComputedStyle(el)
    };
  }`
})
```

### Monitor Click Events
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    window.clickLog = [];
    document.addEventListener('click', (e) => {
      window.clickLog.push({
        target: e.target.tagName,
        position: { x: e.clientX, y: e.clientY },
        timestamp: Date.now()
      });
    }, true);
    return { message: 'Click monitoring enabled' };
  }`
})

// Later, check what was clicked
mcp__chrome-devtools__evaluate_script({
  function: `() => window.clickLog`
})
```

### Check React Component State
```javascript
// If element has React Fiber
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const el = document.querySelector('[data-testid="component"]');
    const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
    const fiber = el[fiberKey];
    return {
      props: fiber?.memoizedProps,
      state: fiber?.memoizedState
    };
  }`
})
```

---

## Playwright Testing Guidelines

### Test Naming Convention
```
[component]-[action]-[result].spec.ts

Examples:
- button-click-opens-modal.spec.ts
- form-submit-saves-data.spec.ts
- trendline-drag-updates-position.spec.ts
```

### Test Structure Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-container"]');
  });

  test('should do expected behavior', async ({ page }) => {
    // Arrange
    const button = page.locator('[data-testid="button"]');
    await expect(button).toBeVisible();

    // Act
    await button.click();
    await page.waitForTimeout(300); // Allow for animations

    // Assert
    const result = page.locator('[data-testid="result"]');
    await expect(result).toBeVisible();
    await expect(result).toContainText('Success');

    // Debug screenshot
    await page.screenshot({
      path: 'test-results/feature-success.png'
    });
  });
});
```

---

## Project-Specific Patterns

### File Structure
```
/src
  /components
    /FeatureName
      FeatureName.tsx
      FeatureName.test.tsx (Playwright)
      FeatureName.module.css
```

### Component Creation Checklist
- [ ] Add data-testid to main element
- [ ] Add data-testid to all interactive children
- [ ] Add console.log with emoji markers
- [ ] Write Playwright test
- [ ] Verify with Chrome MCP

### Event Handler Pattern
```typescript
const handleClick = (e: React.MouseEvent) => {
  console.log('🖱️ Button clicked:', {
    id: props.id,
    state: currentState
  });

  // Check preconditions
  if (!isReady) {
    console.log('❌ Not ready:', { reason: 'loading' });
    return;
  }

  // Perform action
  try {
    doSomething();
    console.log('✅ Action succeeded');
  } catch (error) {
    console.log('❌ Action failed:', error);
  }
};
```

---

## Common Pitfalls to Avoid

### React-Specific
- **Don't mutate state directly** - Use setState
- **Always handle null/undefined** - TypeScript strict mode is on
- **Don't use useEffect for event handlers** - Use onClick, onSubmit

### Event Handling
- **Check event.stopPropagation()** - May be blocking clicks
- **Verify hover before click** - Some handlers require hover first
- **Use onClick not onClickWhenHover** - Unless hover truly required

### Testing
- **Don't use CSS selectors** - Use data-testid
- **Wait for elements** before clicking
- **Check for overlapping elements** - Use { force: true } if needed

---

## Debug Log Template

Maintain this log when debugging:

```markdown
## Debug Session - [Feature Name]
Date: [Date]

### Attempt 1
- **What was tried:** [Description]
- **Result:** [What happened]
- **Chrome MCP showed:** [Actual browser state]
- **Why it failed:** [Root cause]

### Attempt 2
- **What was tried:** [New approach]
- **Result:** [What happened]
- **Chrome MCP showed:** [Browser state]
- **Fix applied:** [Solution]
- **Verification:** [How confirmed it works]
```

---

## When You're Stuck

After 2-3 failed attempts:

1. **Step back** - Reread error message
2. **Use Chrome MCP** - Inspect ACTUAL state, not what you think it is
3. **Simplify** - Remove code until you find what works
4. **Check similar code** - Find working examples in codebase
5. **Ask for help** - Describe what Chrome MCP shows vs expectations

---

## Build and Test Workflow

### After Library Changes
```bash
# Rebuild library
cd financial-charts
npm run build

# Restart servers
cd ..
./restart-servers.sh
```

### Run Tests
```bash
# All tests
npx playwright test

# Specific test
npx playwright test tests/feature.spec.ts

# Debug mode
npx playwright test --headed --debug

# Show report
npx playwright show-report
```

---

## Success Criteria

A task is complete ONLY when:

- ✅ TypeScript compiles without errors
- ✅ Playwright tests pass
- ✅ Chrome MCP shows feature working
- ✅ Console has no errors
- ✅ Manual testing confirms workflow
- ✅ No regressions in existing features

---

## Quick Reference: Chrome MCP Commands

```javascript
// List console messages
mcp__chrome-devtools__list_console_messages

// Take screenshot
mcp__chrome-devtools__take_screenshot

// Evaluate JavaScript
mcp__chrome-devtools__evaluate_script

// Take page snapshot (accessibility tree)
mcp__chrome-devtools__take_snapshot

// Click element
mcp__chrome-devtools__click

// Navigate
mcp__chrome-devtools__navigate_page
```

---

## Remember

**The browser is the source of truth.**

**When code doesn't work: Chrome MCP first, fixes second.**

**Small changes. Immediate verification. Always.**
