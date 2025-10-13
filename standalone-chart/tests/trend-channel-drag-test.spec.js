const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Drag and Resize Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Set up console logging to capture debug messages
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('🔍 TrendChannel Select') ||
        msg.text().includes('🖱️ [Channel]') ||
        msg.text().includes('📌 [Channel]') ||
        msg.text().includes('🎯 [Channel]') ||
        msg.text().includes('✅ Trend channel drag')
      )) {
        console.log('🎧 Browser:', msg.text());
      }
    });
  });

  test('should be able to select and drag trend channel', async ({ page }) => {
    console.log('🧪 Testing trend channel selection and dragging...');

    // 1. Create a trend channel first
    console.log('📐 Creating trend channel...');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('text=Trend Channel');
    await page.waitForTimeout(300);

    // Draw the channel
    await page.mouse.click(300, 200);
    await page.waitForTimeout(500);
    await page.mouse.click(500, 250);
    await page.waitForTimeout(500);
    await page.mouse.click(400, 150);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/drag-test-channel-created.png' });

    // 2. Switch to cursor mode
    console.log('🖱️ Switching to cursor mode...');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);

    // 3. Try to select the trend channel by clicking on it
    console.log('🎯 Attempting to select trend channel...');
    await page.mouse.click(400, 200); // Click in the middle of the channel area
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/drag-test-channel-selected.png' });

    // 4. Try dragging the entire channel
    console.log('🖱️ Attempting to drag entire channel...');
    await page.mouse.move(400, 200);
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.move(450, 250, { steps: 10 }); // Drag to new position
    await page.waitForTimeout(500);
    await page.mouse.up();
    await page.waitForTimeout(1500); // Wait for drag complete
    
    await page.screenshot({ path: 'test-results/drag-test-channel-dragged.png' });
    console.log('✅ Channel drag attempt completed');

    // 5. Try dragging a control point (resize)
    console.log('🔄 Attempting to resize by dragging control point...');
    // Click on one of the edge circles to select it
    await page.mouse.click(300, 200); // Click on start point
    await page.waitForTimeout(500);
    
    // Drag the control point
    await page.mouse.move(300, 200);
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.move(320, 180, { steps: 5 }); // Small resize drag
    await page.waitForTimeout(500);
    await page.mouse.up();
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'test-results/drag-test-channel-resized.png' });
    console.log('✅ Resize attempt completed');

    console.log('🎯 Drag and resize test completed');
  });

  test('should show visual feedback when hovering over trend channel', async ({ page }) => {
    console.log('🧪 Testing trend channel hover feedback...');

    // Create a trend channel
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('text=Trend Channel');
    await page.waitForTimeout(300);

    await page.mouse.click(300, 200);
    await page.waitForTimeout(500);
    await page.mouse.click(500, 250);
    await page.waitForTimeout(500);
    await page.mouse.click(400, 150);
    await page.waitForTimeout(1000);
    
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(500);

    // Test hover behavior
    console.log('🎯 Testing hover feedback...');
    await page.mouse.move(100, 100); // Move away first
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/hover-test-no-hover.png' });

    await page.mouse.move(400, 200); // Hover over channel
    await page.waitForTimeout(800); // Give time for hover state
    await page.screenshot({ path: 'test-results/hover-test-hovering.png' });

    console.log('✅ Hover test completed');
  });
});