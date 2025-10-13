const { test, expect } = require('@playwright/test');

test.describe('TrendChannel onDragComplete Callback Debug', () => {
    test('should verify onDragComplete callback chain works correctly', async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:3000');
        await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
        await page.waitForTimeout(2000);

        // Capture all console logs for analysis
        const consoleLogs = [];
        page.on('console', msg => {
            const text = msg.text();
            consoleLogs.push(text);
            
            // Log relevant debugging messages
            if (text.includes('🔥') || 
                text.includes('EquidistantChannel') || 
                text.includes('onDragComplete') ||
                text.includes('handleDragChannelComplete') ||
                text.includes('StockChartWithTools') ||
                text.includes('handleTrendChannelComplete')) {
                console.log('🔍 DEBUG:', text);
            }
        });

        console.log('📊 Step 1: Drawing trend channel...');
        
        // Step 1: Click TrendChannel button
        await page.click('[data-testid="line-tools-button"]');
        await page.waitForTimeout(500);
        await page.click('text=Trend Channel');
        await page.waitForTimeout(500);

        // Step 2: Draw trend channel (3 clicks)
        const chartArea = page.locator('[data-testid="main-chart-container"]');
        const chartBox = await chartArea.boundingBox();
        
        const startX = chartBox.x + 250;
        const startY = chartBox.y + 200;
        const endX = chartBox.x + 450;
        const endY = chartBox.y + 250;
        const widthX = chartBox.x + 350;
        const widthY = chartBox.y + 150;

        // Draw channel
        await page.mouse.click(startX, startY);
        await page.waitForTimeout(500);
        await page.mouse.click(endX, endY);
        await page.waitForTimeout(500);
        await page.mouse.click(widthX, widthY);
        await page.waitForTimeout(1500);

        console.log('🖱️ Step 2: Switching to cursor mode...');
        
        // Step 3: Switch to cursor mode
        await page.click('[data-testid="cursor-button"]');
        await page.waitForTimeout(500);

        console.log('🔄 Step 3: Attempting to drag trend channel...');
        
        // Step 4: Try to drag the trend channel
        // Click to select first
        await page.mouse.click(startX + 50, startY + 10);
        await page.waitForTimeout(500);
        
        // Now drag it
        await page.mouse.move(startX + 50, startY + 10);
        await page.mouse.down();
        await page.waitForTimeout(300);
        await page.mouse.move(startX + 100, startY + 50, { steps: 8 });
        await page.waitForTimeout(300);
        await page.mouse.up();
        await page.waitForTimeout(2000); // Wait for all callbacks to complete

        // Step 5: Take screenshot
        await page.screenshot({ path: 'test-results/trend-channel-callback-debug.png', fullPage: true });

        console.log('\n📋 ANALYZING CONSOLE LOGS:');
        console.log('============================');

        // Analyze the console logs
        const renderLogs = consoleLogs.filter(log => log.includes('EquidistantChannel render'));
        const propReceivedLogs = consoleLogs.filter(log => log.includes('onDragComplete prop received'));
        const propsKeysLogs = consoleLogs.filter(log => log.includes('All props keys'));
        const dragHandlerLogs = consoleLogs.filter(log => log.includes('handleDragChannelComplete'));
        const callbackLogs = consoleLogs.filter(log => log.includes('About to call onDragComplete'));
        const appHandlerLogs = consoleLogs.filter(log => log.includes('handleTrendChannelComplete'));
        const stockChartLogs = consoleLogs.filter(log => log.includes('StockChartWithTools'));

        console.log(`🔍 Render events: ${renderLogs.length}`);
        renderLogs.forEach(log => console.log(`  → ${log}`));

        console.log(`🔍 Prop received logs: ${propReceivedLogs.length}`);
        propReceivedLogs.forEach(log => console.log(`  → ${log}`));

        console.log(`🔍 Props keys logs: ${propsKeysLogs.length}`);
        propsKeysLogs.forEach(log => console.log(`  → ${log}`));

        console.log(`🔍 Drag handler calls: ${dragHandlerLogs.length}`);
        dragHandlerLogs.forEach(log => console.log(`  → ${log}`));

        console.log(`🔍 Callback attempts: ${callbackLogs.length}`);
        callbackLogs.forEach(log => console.log(`  → ${log}`));

        console.log(`🔍 App handler calls: ${appHandlerLogs.length}`);
        appHandlerLogs.forEach(log => console.log(`  → ${log}`));

        console.log(`🔍 StockChart logs: ${stockChartLogs.length}`);
        stockChartLogs.forEach(log => console.log(`  → ${log}`));

        // Diagnostic checks
        let issues = [];

        // Check 1: Is the component rendering?
        if (renderLogs.length === 0) {
            issues.push('❌ EquidistantChannel is not rendering');
        } else {
            console.log('✅ EquidistantChannel is rendering');
        }

        // Check 2: Is onDragComplete prop being received?
        const hasOnDragCompleteProp = propReceivedLogs.some(log => log.includes('onDragComplete prop received: true'));
        if (!hasOnDragCompleteProp) {
            issues.push('❌ onDragComplete prop is NOT being received');
            
            // Show what props are available
            const latestPropsLog = propsKeysLogs[propsKeysLogs.length - 1];
            if (latestPropsLog) {
                console.log(`📝 Available props: ${latestPropsLog}`);
            }
        } else {
            console.log('✅ onDragComplete prop is being received');
        }

        // Check 3: Are drag handlers being called?
        if (dragHandlerLogs.length === 0) {
            issues.push('❌ handleDragChannelComplete is not being called (drag not working)');
        } else {
            console.log(`✅ handleDragChannelComplete called ${dragHandlerLogs.length} times`);
        }

        // Check 4: Are callbacks being attempted?
        if (callbackLogs.length === 0) {
            issues.push('❌ onDragComplete callback is not being attempted');
        } else {
            console.log(`✅ onDragComplete callback attempted ${callbackLogs.length} times`);
        }

        // Check 5: Is the App handler being called?
        if (appHandlerLogs.length === 0) {
            issues.push('❌ App.tsx handleTrendChannelComplete is not being called');
        } else {
            console.log(`✅ App.tsx handleTrendChannelComplete called ${appHandlerLogs.length} times`);
        }

        // Print issues summary
        console.log('\n🚨 ISSUES FOUND:');
        console.log('==================');
        if (issues.length === 0) {
            console.log('✅ No issues detected - callback chain should be working!');
        } else {
            issues.forEach(issue => console.log(issue));
        }

        // Print all console logs for complete debugging
        console.log('\n📝 ALL CONSOLE LOGS:');
        console.log('=====================');
        consoleLogs.forEach((log, index) => {
            console.log(`${index + 1}. ${log}`);
        });

        // Verify basic functionality
        expect(consoleLogs.length).toBeGreaterThan(0);
        
        // The test should pass regardless of the callback issue - we're debugging here
        console.log('\n✅ Debug test completed. Check console output above for analysis.');
    });
});