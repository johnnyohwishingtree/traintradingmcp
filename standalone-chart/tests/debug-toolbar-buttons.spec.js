const { test, expect } = require('@playwright/test');

test('Debug toolbar buttons - what buttons are actually rendered', async ({ page }) => {
  console.log('🔍 Debugging what buttons are actually rendered in toolbar...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Get all buttons in the drawing toolbar
  const allButtons = await page.locator('[data-testid="drawing-toolbar"] button').all();
  
  console.log(`📊 Total buttons found: ${allButtons.length}`);
  
  for (let i = 0; i < allButtons.length; i++) {
    const button = allButtons[i];
    const testId = await button.getAttribute('data-testid');
    const title = await button.getAttribute('title');
    const isVisible = await button.isVisible();
    
    console.log(`   ${i + 1}. data-testid="${testId}" title="${title}" visible=${isVisible}`);
  }
  
  // Specifically look for trendchannel button
  const trendChannelButton = page.locator('[data-testid="trendchannel-button"]');
  const trendChannelExists = await trendChannelButton.count();
  const trendChannelVisible = trendChannelExists > 0 ? await trendChannelButton.isVisible() : false;
  
  console.log('');
  console.log(`🎯 Trend channel button exists: ${trendChannelExists > 0}`);
  console.log(`🎯 Trend channel button visible: ${trendChannelVisible}`);
  
  await page.screenshot({ path: 'test-results/debug-toolbar-buttons.png' });
});