const { test, expect } = require('@playwright/test');

test.describe('Top-Left Text Debug', () => {
  test('should investigate top-left text clipping issue', async ({ page }) => {
    console.log('🔍 Investigating top-left text clipping...');
    
    // Navigate to regular chart (not demo mode)
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('svg', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/regular-chart-top-left.png', fullPage: true });
    
    // Look for text elements in the top-left area (first 200x200 pixels)
    const topLeftText = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('text, div, span'));
      const topLeftElements = texts.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.x < 200 && rect.y < 200; // Top-left area
      });
      
      return topLeftElements.map(el => ({
        tagName: el.tagName.toLowerCase(),
        text: el.textContent?.trim() || '',
        x: el.getBoundingClientRect().x,
        y: el.getBoundingClientRect().y,
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
        className: el.className || '',
        id: el.id || '',
        styles: {
          position: window.getComputedStyle(el).position,
          zIndex: window.getComputedStyle(el).zIndex,
          overflow: window.getComputedStyle(el).overflow,
          clipPath: window.getComputedStyle(el).clipPath,
          transform: window.getComputedStyle(el).transform,
          visibility: window.getComputedStyle(el).visibility,
          opacity: window.getComputedStyle(el).opacity
        }
      }));
    });
    
    console.log('⚠️ Top-left elements found:', topLeftText.length);
    topLeftText.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName}: "${el.text}" at (${el.x.toFixed(1)}, ${el.y.toFixed(1)}) ${el.width.toFixed(1)}x${el.height.toFixed(1)}`);
      console.log(`     className: "${el.className}", id: "${el.id}"`);
      console.log(`     styles:`, el.styles);
    });
    
    // Check if there are any overlapping elements
    const overlappingElements = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      const topLeftArea = { x: 0, y: 0, width: 200, height: 200 };
      
      const overlapping = allElements.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.x < topLeftArea.width && 
               rect.y < topLeftArea.height && 
               (rect.x + rect.width) > 0 && 
               (rect.y + rect.height) > 0 &&
               rect.width > 0 && rect.height > 0;
      });
      
      return overlapping.slice(0, 10).map(el => ({ // Limit to first 10
        tagName: el.tagName.toLowerCase(),
        text: el.textContent?.slice(0, 50) || '',
        className: el.className || '',
        id: el.id || '',
        rect: {
          x: el.getBoundingClientRect().x,
          y: el.getBoundingClientRect().y,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height
        }
      }));
    });
    
    console.log('🔍 Elements overlapping top-left area:', overlappingElements.length);
    overlappingElements.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName}[${el.className}]: "${el.text}" at (${el.rect.x.toFixed(1)}, ${el.rect.y.toFixed(1)})`);
    });
    
    // Take a cropped screenshot of just the top-left area
    await page.screenshot({ 
      path: 'test-results/top-left-crop.png',
      clip: { x: 0, y: 0, width: 300, height: 300 }
    });
    
    expect(topLeftText).toBeDefined();
  });
});