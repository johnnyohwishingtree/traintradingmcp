const { test, expect } = require('@playwright/test');

test.describe('Label Drawing Tool', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chart application
    await page.goto('http://localhost:3000');
    
    // Wait for the main chart container to be visible
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow chart to fully render
  });

  test('should activate label tool and show cursor change', async ({ page }) => {
    console.log('🧪 Testing label tool activation...');
    
    // Take screenshot before activation
    await page.screenshot({ path: 'test-results/before-label-activation.png' });
    
    // Find and click the label button (it's in a dropdown)
    // First click the line tools dropdown
    const lineDropdown = await page.locator('button').filter({ hasText: /line tools/i }).first();
    if (await lineDropdown.isVisible()) {
      await lineDropdown.click();
      await page.waitForTimeout(500);
    }
    
    // Now find the label button by its title attribute or text
    const labelButton = await page.locator('button[title*="Label"], [title*="text annotations"]').first();
    await expect(labelButton).toBeVisible();
    
    await labelButton.click();
    await page.waitForTimeout(500);
    
    // Take screenshot after activation
    await page.screenshot({ path: 'test-results/after-label-activation.png' });
    
    console.log('✅ Label tool activated');
  });

  test('should place label when clicking on chart', async ({ page }) => {
    console.log('🧪 Testing label placement...');
    
    // Activate label tool
    // First click the line tools dropdown
    const lineDropdown = await page.locator('button').filter({ hasText: /line tools/i }).first();
    if (await lineDropdown.isVisible()) {
      await lineDropdown.click();
      await page.waitForTimeout(500);
    }
    
    const labelButton = await page.locator('button[title*="Label"], [title*="text annotations"]').first();
    await labelButton.click();
    await page.waitForTimeout(500);
    
    // Get chart area for clicking
    const chartArea = await page.locator('.react-financial-charts').first();
    await expect(chartArea).toBeVisible();
    
    // Get chart dimensions
    const chartBox = await chartArea.boundingBox();
    console.log('📊 Chart dimensions:', chartBox);
    
    // Click in the middle of the chart area
    const clickX = chartBox.x + chartBox.width * 0.5;
    const clickY = chartBox.y + chartBox.height * 0.4;
    
    console.log(`🖱️ Clicking at (${clickX}, ${clickY})`);
    
    // Take screenshot before click
    await page.screenshot({ path: 'test-results/before-label-click.png' });
    
    // Click to place label
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000); // Wait for label to appear
    
    // Take screenshot after click
    await page.screenshot({ path: 'test-results/after-label-click.png' });
    
    // Check console for any errors
    const consoleMessages = await page.evaluate(() => {
      return window.lastConsoleMessages || [];
    });
    console.log('📝 Console messages:', consoleMessages);
    
    // Check if any text elements appeared
    const textElements = await page.locator('text, tspan').count();
    console.log(`📄 Total text elements found: ${textElements}`);
    
    // Look for specific label-related elements
    const labelElements = await page.locator('[class*="label"], [class*="text"], tspan').count();
    console.log(`🏷️ Label-related elements found: ${labelElements}`);
    
    // Check if InteractiveText component is present in DOM
    const interactiveTextPresent = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      for (let element of allElements) {
        if (element.constructor.name.includes('InteractiveText') || 
            element.__reactInternalInstance || 
            element._reactInternalFiber) {
          return true;
        }
      }
      return false;
    });
    console.log('🎯 InteractiveText component present:', interactiveTextPresent);
    
    console.log('✅ Label placement test completed');
  });

  test('should debug label tool state and events', async ({ page }) => {
    console.log('🔍 Debugging label tool state...');
    
    // Add console message capturing
    await page.addInitScript(() => {
      window.lastConsoleMessages = [];
      const originalLog = console.log;
      console.log = (...args) => {
        window.lastConsoleMessages.push(args.join(' '));
        originalLog.apply(console, args);
      };
    });
    
    // Activate label tool
    // First click the line tools dropdown
    const lineDropdown = await page.locator('button').filter({ hasText: /line tools/i }).first();
    if (await lineDropdown.isVisible()) {
      await lineDropdown.click();
      await page.waitForTimeout(500);
    }
    
    const labelButton = await page.locator('button[title*="Label"], [title*="text annotations"]').first();
    await labelButton.click();
    await page.waitForTimeout(500);
    
    // Check the current tool state
    const currentToolState = await page.evaluate(() => {
      // Try to find React component state
      const reactElements = document.querySelectorAll('[data-reactroot] *');
      for (let element of reactElements) {
        if (element._reactInternalInstance || element.__reactInternalInstance) {
          const instance = element._reactInternalInstance || element.__reactInternalInstance;
          if (instance.memoizedProps && instance.memoizedProps.currentTool) {
            return instance.memoizedProps.currentTool;
          }
        }
      }
      return 'unknown';
    });
    
    console.log('🎯 Current tool state:', currentToolState);
    
    // Check for InteractiveText props
    const interactiveTextProps = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let element of elements) {
        if (element._reactInternalInstance || element.__reactInternalInstance) {
          const instance = element._reactInternalInstance || element.__reactInternalInstance;
          if (instance.type && instance.type.name === 'InteractiveText') {
            return {
              enabled: instance.memoizedProps?.enabled,
              textList: instance.memoizedProps?.textList,
              onChoosePosition: !!instance.memoizedProps?.onChoosePosition
            };
          }
        }
      }
      return null;
    });
    
    console.log('📝 InteractiveText props:', interactiveTextProps);
    
    // Get chart area and try clicking with more detailed logging
    const chartArea = await page.locator('.react-financial-charts').first();
    const chartBox = await chartArea.boundingBox();
    
    const clickX = chartBox.x + chartBox.width * 0.5;
    const clickY = chartBox.y + chartBox.height * 0.4;
    
    // Listen for mouse events
    await page.evaluate(() => {
      document.addEventListener('click', (e) => {
        console.log('🖱️ Click detected at:', e.clientX, e.clientY);
        console.log('🎯 Target element:', e.target.tagName, e.target.className);
      });
    });
    
    console.log(`🖱️ Attempting click at (${clickX}, ${clickY})`);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1500);
    
    // Get final console messages
    const finalMessages = await page.evaluate(() => window.lastConsoleMessages || []);
    console.log('📋 All console messages:', finalMessages);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/label-debug-final.png' });
    
    console.log('🔍 Debug test completed');
  });

  test('should verify label data structure and callbacks', async ({ page }) => {
    console.log('🧪 Testing label data structure...');
    
    // Check if labels array exists in component props
    const labelsData = await page.evaluate(() => {
      // Look for the main chart component
      const chartElements = document.querySelectorAll('[data-testid="main-chart-container"] *');
      for (let element of chartElements) {
        if (element._reactInternalInstance || element.__reactInternalInstance) {
          const instance = element._reactInternalInstance || element.__reactInternalInstance;
          if (instance.memoizedProps && 'labels' in instance.memoizedProps) {
            return {
              labels: instance.memoizedProps.labels,
              onLabelComplete: !!instance.memoizedProps.onLabelComplete,
              currentTool: instance.memoizedProps.currentTool
            };
          }
        }
      }
      return null;
    });
    
    console.log('📊 Labels data structure:', labelsData);
    
    // Verify the labels prop is an array
    if (labelsData && labelsData.labels) {
      console.log(`✅ Labels array found with ${labelsData.labels.length} items`);
      console.log(`✅ onLabelComplete callback: ${labelsData.onLabelComplete ? 'present' : 'missing'}`);
    } else {
      console.log('❌ Labels data not found in component props');
    }
    
    console.log('✅ Label data structure test completed');
  });
});