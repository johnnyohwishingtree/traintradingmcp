/**
 * Unit test for clicking on trendline text to open inline editor
 *
 * This test verifies that:
 * 1. Text labels are rendered on trendlines
 * 2. Clicking on text labels opens the inline editor
 * 3. The editor pre-fills with the existing text
 */

const { test, expect } = require('@playwright/test');

test.describe('Trendline Text Click to Edit', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:3000');

        // Wait for chart to load
        await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
        await page.waitForTimeout(2000);
    });

    test('should open inline editor when clicking on text label', async ({ page }) => {
        console.log('🧪 Test: Click text label to edit');

        // Capture console logs for debugging
        const consoleLogs = [];
        page.on('console', msg => {
            const text = msg.text();
            consoleLogs.push(text);
            console.log('BROWSER:', text);
        });

        // Step 1: Draw a trendline
        console.log('\n📝 Step 1: Draw trendline');
        await page.click('[data-testid="dropdown-arrow"]');
        await page.waitForTimeout(300);
        await page.click('[data-testid="line-type-trendline"]');
        await page.waitForTimeout(300);

        const chartArea = await page.locator('[data-testid="main-chart-container"]').boundingBox();
        const startX = chartArea.x + chartArea.width * 0.3;
        const startY = chartArea.y + chartArea.height * 0.5;
        const endX = chartArea.x + chartArea.width * 0.7;
        const endY = chartArea.y + chartArea.height * 0.4;

        await page.mouse.click(startX, startY);
        await page.waitForTimeout(100);
        await page.mouse.click(endX, endY);
        await page.waitForTimeout(500);
        console.log('✅ Trendline drawn');

        // Step 2: Select the trendline
        console.log('\n📝 Step 2: Select trendline');
        await page.click('[data-testid="cursor-button"]');
        await page.waitForTimeout(300);

        const trendlineMidX = (startX + endX) / 2;
        const trendlineMidY = (startY + endY) / 2;
        await page.mouse.click(trendlineMidX, trendlineMidY);
        await page.waitForTimeout(500);
        console.log('✅ Trendline selected');

        // Step 3: Click "Add text" button
        console.log('\n📝 Step 3: Click Add text button');
        await page.mouse.move(trendlineMidX, trendlineMidY);
        await page.waitForTimeout(300);

        const buttonY = trendlineMidY - 40;
        await page.mouse.click(trendlineMidX, buttonY);
        await page.waitForTimeout(500);
        console.log('✅ Add text button clicked');

        // Step 4: Add initial text
        console.log('\n📝 Step 4: Add initial text');
        const textInput = page.locator('[data-testid="inline-text-input"]');

        // Check if editor appeared
        const editorVisible = await page.locator('[data-testid="inline-text-editor"]').isVisible().catch(() => false);
        console.log('Editor visible after button click:', editorVisible);

        if (!editorVisible) {
            console.log('❌ Editor did not appear after clicking Add text button');
            console.log('Taking screenshot for debugging...');
            await page.screenshot({ path: 'test-results/no-editor-after-button.png' });

            // Print relevant console logs
            console.log('\n📊 Console logs related to text:');
            consoleLogs.filter(log => log.includes('text') || log.includes('Add') || log.includes('inline'))
                .forEach(log => console.log('  -', log));
        }

        await textInput.fill('Initial Text');
        await textInput.press('Enter');
        await page.waitForTimeout(500);
        console.log('✅ Initial text added: "Initial Text"');

        // Verify editor closed
        const editorClosed = await page.locator('[data-testid="inline-text-editor"]').isHidden().catch(() => true);
        console.log('Editor closed after Enter:', editorClosed);

        // Take screenshot showing text label
        await page.screenshot({ path: 'test-results/text-label-visible.png' });

        // Step 5: Click on the text label itself to edit
        console.log('\n📝 Step 5: Click on text label to edit');

        // Text is positioned 50px above the midpoint
        const textX = trendlineMidX;
        const textY = trendlineMidY - 50;

        console.log(`Clicking on text at (${textX}, ${textY})`);
        await page.mouse.click(textX, textY);
        await page.waitForTimeout(1000);

        // Take screenshot after clicking text
        await page.screenshot({ path: 'test-results/after-text-click.png' });

        // Check if editor reopened
        const inlineEditor = page.locator('[data-testid="inline-text-editor"]');
        const editorReopened = await inlineEditor.isVisible().catch(() => false);

        console.log('Editor reopened after text click:', editorReopened);

        if (!editorReopened) {
            console.log('❌ FAILED: Editor did not reopen when clicking on text label');

            // Debug: Check what elements exist
            const svgTexts = await page.locator('svg text').count();
            console.log('SVG text elements found:', svgTexts);

            // Debug: Try to get text content
            if (svgTexts > 0) {
                const textContent = await page.locator('svg text').first().textContent();
                console.log('First SVG text content:', textContent);
            }

            // Print console logs related to text click
            console.log('\n📊 Console logs after text click:');
            consoleLogs.filter(log => log.includes('Text label clicked') || log.includes('Add text button'))
                .forEach(log => console.log('  -', log));

            // Check if the click handler was invoked
            const textClickLogs = consoleLogs.filter(log => log.includes('📝 Text label clicked'));
            if (textClickLogs.length === 0) {
                console.log('⚠️  No "Text label clicked" log found - click handler not invoked');
            }
        } else {
            console.log('✅ Editor reopened successfully!');

            // Verify the text input has the existing text
            const inputValue = await textInput.inputValue();
            console.log('Input value:', inputValue);

            expect(inputValue).toBe('Initial Text');
            console.log('✅ Input pre-filled with existing text');
        }

        // This test expects the editor to reopen
        await expect(inlineEditor).toBeVisible({ timeout: 2000 });
    });

    test('should detect text label in DOM', async ({ page }) => {
        console.log('🧪 Test: Verify text label exists in DOM');

        // Draw trendline with text (shortened version)
        await page.click('[data-testid="dropdown-arrow"]');
        await page.waitForTimeout(300);
        await page.click('[data-testid="line-type-trendline"]');
        await page.waitForTimeout(300);

        const chartArea = await page.locator('[data-testid="main-chart-container"]').boundingBox();
        const startX = chartArea.x + chartArea.width * 0.3;
        const startY = chartArea.y + chartArea.height * 0.5;
        const endX = chartArea.x + chartArea.width * 0.7;
        const endY = chartArea.y + chartArea.height * 0.4;

        await page.mouse.click(startX, startY);
        await page.waitForTimeout(100);
        await page.mouse.click(endX, endY);
        await page.waitForTimeout(500);

        await page.click('[data-testid="cursor-button"]');
        await page.waitForTimeout(300);

        const trendlineMidX = (startX + endX) / 2;
        const trendlineMidY = (startY + endY) / 2;
        await page.mouse.click(trendlineMidX, trendlineMidY);
        await page.waitForTimeout(500);

        await page.mouse.move(trendlineMidX, trendlineMidY);
        await page.waitForTimeout(300);
        await page.mouse.click(trendlineMidX, trendlineMidY - 40);
        await page.waitForTimeout(500);

        const textInput = page.locator('[data-testid="inline-text-input"]');
        await textInput.fill('Test Label');
        await textInput.press('Enter');
        await page.waitForTimeout(500);

        // Check if text label appears in DOM
        const svgTexts = await page.locator('svg text').all();
        console.log(`Found ${svgTexts.length} SVG text elements`);

        let foundTestLabel = false;
        for (let i = 0; i < svgTexts.length; i++) {
            const text = await svgTexts[i].textContent();
            console.log(`  SVG text[${i}]: "${text}"`);
            if (text === 'Test Label') {
                foundTestLabel = true;

                // Check if it's visible
                const isVisible = await svgTexts[i].isVisible();
                console.log(`  ✓ "Test Label" found and visible: ${isVisible}`);

                // Check bounding box
                const box = await svgTexts[i].boundingBox();
                if (box) {
                    console.log(`  ✓ Position: (${box.x}, ${box.y}), Size: ${box.width}x${box.height}`);
                }
            }
        }

        expect(foundTestLabel).toBe(true);
        console.log(foundTestLabel ? '✅ Test label found in DOM' : '❌ Test label NOT found in DOM');
    });
});
