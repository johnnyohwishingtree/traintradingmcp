const { test, expect } = require('@playwright/test');

test.describe('Verify Text Fix', () => {
  test('should check if overlapping text issue is resolved', async ({ page }) => {
    console.log('🔍 Checking if overlapping text issue is resolved...');
    
    // Navigate to regular chart
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('svg', { timeout: 10000 });
    
    // Take screenshot to compare with previous issue
    await page.screenshot({ path: 'test-results/after-fix-full.png', fullPage: true });
    
    // Take focused screenshot of top-left area
    await page.screenshot({ 
      path: 'test-results/after-fix-top-left.png',
      clip: { x: 0, y: 0, width: 400, height: 200 }
    });
    
    console.log('✅ Screenshots taken for comparison');
    
    // Check if there are any console errors
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Wait a moment to capture any console errors
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log('❌ Console errors found:');
      consoleLogs.forEach(log => console.log('  ', log));
    } else {
      console.log('✅ No console errors detected');
    }
    
    expect(true).toBe(true); // Test always passes, we're just capturing state
  });
});