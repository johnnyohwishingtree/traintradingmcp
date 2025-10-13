const { test, expect } = require('@playwright/test');

test('Debug price precision', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    console.log('🔍 Looking for all SVG text elements...');
    
    // Get all text elements in SVGs
    const allTexts = await page.locator('svg text').all();
    console.log('📊 Total SVG text elements found:', allTexts.length);
    
    const allTextContents = [];
    for (let i = 0; i < allTexts.length; i++) {
        const text = await allTexts[i].textContent();
        if (text && text.trim()) {
            allTextContents.push(`[${i}]: "${text.trim()}"`);
            
            // Test the regex
            const matches = /^\d+\.\d{2}$/.test(text.trim());
            if (matches) {
                console.log('✅ FOUND DECIMAL MATCH:', text.trim());
            } else if (/\d+\.\d+/.test(text.trim())) {
                console.log('🟡 Found number with decimal but wrong format:', text.trim());
            } else if (/^\d+$/.test(text.trim())) {
                console.log('🟡 Found whole number:', text.trim());
            }
        }
    }
    
    console.log('📋 All text contents:');
    console.log(allTextContents.join('\n'));
    
    // Also check for text elements that might be outside SVG
    const allTextsNotInSVG = await page.locator('text:not(svg text)').all();
    console.log('📊 Non-SVG text elements found:', allTextsNotInSVG.length);
    
    // Look specifically for price-like patterns anywhere
    const bodyText = await page.textContent('body');
    const priceMatches = bodyText.match(/\d+\.\d{2}/g);
    console.log('💰 Price patterns found in body:', priceMatches);
});