const { test, expect } = require('@playwright/test');

test.describe('HoverTextNearMouse Infinite Loop Fix', () => {
    test('should not cause infinite loop when dragging trend channels multiple times', async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:3000');
        await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
        await page.waitForTimeout(2000);

        // Listen for console errors
        const errors = [];
        page.on('pageerror', error => {
            errors.push(error.message);
            console.log('❌ Page error:', error.message);
        });

        console.log('📊 Drawing trend channel...');
        
        // Draw a trend channel
        await page.click('[data-testid="line-tools-button"]');
        await page.waitForTimeout(300);
        await page.click('text=Trend Channel');
        await page.waitForTimeout(300);

        await page.mouse.click(250, 250);
        await page.waitForTimeout(300);
        await page.mouse.click(450, 200);
        await page.waitForTimeout(300);
        await page.mouse.click(350, 350);
        await page.waitForTimeout(1000);

        console.log('🖱️ Switching to cursor mode...');
        
        // Switch to cursor mode
        await page.click('[data-testid="cursor-button"]');
        await page.waitForTimeout(500);

        console.log('🔄 Testing multiple drags without infinite loop...');
        
        // Perform multiple drags to trigger the hover text
        for (let i = 0; i < 5; i++) {
            console.log(`   Drag ${i + 1}/5...`);
            
            // Select and drag the channel
            await page.mouse.click(300, 275);
            await page.waitForTimeout(200);
            
            await page.mouse.move(300, 275);
            await page.mouse.down();
            await page.waitForTimeout(100);
            await page.mouse.move(300 + (i * 20), 275 + (i * 10), { steps: 3 });
            await page.waitForTimeout(100);
            await page.mouse.up();
            await page.waitForTimeout(500);
            
            // Move mouse around to trigger hover text updates
            await page.mouse.move(400, 300);
            await page.waitForTimeout(100);
            await page.mouse.move(500, 350);
            await page.waitForTimeout(100);
        }

        console.log('✅ Multiple drags completed successfully!');

        // Take final screenshot
        await page.screenshot({ path: 'test-results/hover-text-no-infinite-loop.png', fullPage: true });

        // Check that no React errors occurred
        console.log(`📋 Total page errors: ${errors.length}`);
        errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
        });

        // Verify no infinite loop errors
        const infiniteLoopErrors = errors.filter(error => 
            error.includes('Maximum update depth exceeded') ||
            error.includes('setState inside componentDidUpdate') ||
            error.includes('nested updates')
        );

        console.log(`🔍 Infinite loop errors: ${infiniteLoopErrors.length}`);
        
        if (infiniteLoopErrors.length === 0) {
            console.log('✅ No infinite loop errors detected - fix successful!');
        } else {
            console.log('❌ Infinite loop errors still present:');
            infiniteLoopErrors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        // Test should pass if no infinite loop errors occurred
        expect(infiniteLoopErrors.length).toBe(0);
    });
});