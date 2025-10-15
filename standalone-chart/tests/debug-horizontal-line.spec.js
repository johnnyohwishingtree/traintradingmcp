const { test, expect } = require('@playwright/test');

test('Debug HorizontalLine console logs', async ({ page }) => {
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
  });

  await page.goto('http://localhost:3000');
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Click horizontal line tool
  await page.click('[data-testid="horizontal-line-tool"]');
  await page.waitForTimeout(500);

  // Draw a horizontal line
  await page.mouse.click(500, 300);
  await page.waitForTimeout(1000);

  // Check console logs for our debug message
  console.log('🔍 Console logs captured:');
  consoleLogs.forEach(log => {
    console.log(`  ${log}`);
  });

  // Look for our debug message
  const hasDebugMessage = consoleLogs.some(log => 
    log.includes('🎯 HorizontalLine.renderLineItem called')
  );

  console.log(`\n📋 Debug message found: ${hasDebugMessage}`);
  
  // Take screenshot to see the actual control points
  await page.screenshot({ path: 'debug-horizontal-line-controls.png' });
});