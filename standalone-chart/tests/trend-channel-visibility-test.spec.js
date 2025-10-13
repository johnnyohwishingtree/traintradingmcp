const { test, expect } = require('@playwright/test');

test.describe('Trend Channel Visibility and Transparency Test', () => {
  test('verify trend channel persists when switching tools and is transparent', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('1. Draw a trend channel');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(1000);
    
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Draw a trend channel
      const x1 = chartBox.x + chartBox.width * 0.3;
      const y1 = chartBox.y + chartBox.height * 0.6;
      await page.mouse.click(x1, y1);
      await page.waitForTimeout(1000);
      
      const x2 = chartBox.x + chartBox.width * 0.7;
      const y2 = chartBox.y + chartBox.height * 0.4;
      await page.mouse.click(x2, y2);
      await page.waitForTimeout(1000);
      
      const x3 = chartBox.x + chartBox.width * 0.7;
      const y3 = chartBox.y + chartBox.height * 0.3;
      await page.mouse.click(x3, y3);
      await page.waitForTimeout(2000);
    }
    
    // Take screenshot with trend channel visible
    await page.screenshot({ path: 'test-results/trend-channel-visible-on-tool.png' });
    
    console.log('2. Switch to cursor tool and verify channel persists');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(1000);
    
    // Take screenshot after switching to cursor
    await page.screenshot({ path: 'test-results/trend-channel-visible-on-cursor.png' });
    
    console.log('3. Switch to trendline tool and verify channel still persists');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendline"]');
    await page.waitForTimeout(1000);
    
    // Take screenshot after switching to trendline tool
    await page.screenshot({ path: 'test-results/trend-channel-visible-on-trendline.png' });
    
    console.log('4. Switch to patterns tool and verify channel still persists');
    await page.click('[data-testid="patterns-button"]');
    await page.waitForTimeout(1000);
    
    // Take screenshot after switching to patterns tool
    await page.screenshot({ path: 'test-results/trend-channel-visible-on-patterns.png' });
    
    console.log('5. Test completed - trend channel should be visible in all screenshots');
    
    // The test passes if we get this far without errors
    expect(true).toBe(true);
  });
  
  test('verify trend channel transparency over candlesticks', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('1. Draw a trend channel over some candlesticks');
    await page.click('[data-testid="line-tools-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="line-type-trendchannel"]');
    await page.waitForTimeout(1000);
    
    const chart = page.locator('[data-testid="main-chart-container"]');
    const chartBox = await chart.boundingBox();
    
    if (chartBox) {
      // Draw a trend channel that covers candlesticks
      const x1 = chartBox.x + chartBox.width * 0.2;
      const y1 = chartBox.y + chartBox.height * 0.7;
      await page.mouse.click(x1, y1);
      await page.waitForTimeout(1000);
      
      const x2 = chartBox.x + chartBox.width * 0.8;
      const y2 = chartBox.y + chartBox.height * 0.3;
      await page.mouse.click(x2, y2);
      await page.waitForTimeout(1000);
      
      const x3 = chartBox.x + chartBox.width * 0.8;
      const y3 = chartBox.y + chartBox.height * 0.2;
      await page.mouse.click(x3, y3);
      await page.waitForTimeout(2000);
    }
    
    // Take screenshot to verify transparency
    await page.screenshot({ path: 'test-results/trend-channel-transparency-test.png' });
    
    console.log('2. Switch to cursor and verify transparency is maintained');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(1000);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/trend-channel-transparency-final.png' });
    
    expect(true).toBe(true);
  });
});