/**
 * Debug test for AddTextButton visibility
 * This test captures console logs to understand why the button isn't showing
 */

const { test, expect } = require('@playwright/test');

test.describe('AddTextButton Debug', () => {
    test('should log button render calls when trendline is selected', async ({ page }) => {
        const consoleLogs = [];

        // Capture all console logs
        page.on('console', msg => {
            const text = msg.text();
            consoleLogs.push(text);
            console.log('BROWSER LOG:', text);
        });

        // Navigate to the app
        await page.goto('http://localhost:3000');
        await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
        await page.waitForTimeout(2000);

        console.log('\n📝 Step 1: Activate trendline mode');
        await page.click('[data-testid="dropdown-arrow"]');
        await page.waitForTimeout(300);
        await page.click('[data-testid="line-type-trendline"]');
        await page.waitForTimeout(300);

        console.log('\n📝 Step 2: Draw a trendline');
        const chartArea = await page.locator('[data-testid="main-chart-container"]').boundingBox();
        const startX = chartArea.x + chartArea.width * 0.3;
        const startY = chartArea.y + chartArea.height * 0.5;
        const endX = chartArea.x + chartArea.width * 0.7;
        const endY = chartArea.y + chartArea.height * 0.4;

        await page.mouse.click(startX, startY);
        await page.waitForTimeout(100);
        await page.mouse.click(endX, endY);
        await page.waitForTimeout(500);

        console.log('\n📝 Step 3: Switch to cursor mode and select trendline');
        await page.click('[data-testid="cursor-button"]');
        await page.waitForTimeout(300);

        const trendlineMidX = (startX + endX) / 2;
        const trendlineMidY = (startY + endY) / 2;
        await page.mouse.click(trendlineMidX, trendlineMidY);
        await page.waitForTimeout(1000); // Wait longer to see all render logs

        // Take screenshot
        await page.screenshot({ path: 'test-results/button-debug.png' });

        console.log('\n📊 CONSOLE LOG ANALYSIS:');
        console.log('Total console messages:', consoleLogs.length);

        // Find button-related logs
        const buttonLogs = consoleLogs.filter(log => log.includes('AddTextButton'));
        console.log('Button render logs:', buttonLogs.length);
        buttonLogs.forEach(log => console.log('  -', log));

        // Find visibility logs
        const visibilityLogs = consoleLogs.filter(log => log.includes('AddTextButton visibility'));
        console.log('\nVisibility check logs:', visibilityLogs.length);
        visibilityLogs.forEach(log => console.log('  -', log));

        // Check if button was ever shown
        const showTrue = consoleLogs.some(log => log.includes('show: true') || log.includes('shouldShow: true'));
        const showFalse = consoleLogs.some(log => log.includes('show: false') || log.includes('shouldShow: false'));

        console.log('\nButton show status:');
        console.log('  show=true found:', showTrue);
        console.log('  show=false found:', showFalse);

        // This test is for debugging - we just want to see the logs
        console.log('\n✅ Debug test complete - check logs above');
    });
});
