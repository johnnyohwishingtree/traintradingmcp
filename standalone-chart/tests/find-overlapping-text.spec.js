const { test, expect } = require('@playwright/test');

test.describe('Find Overlapping Text', () => {
  test('should find the specific overlapping text ending with enned', async ({ page }) => {
    console.log('🔍 Looking for overlapping text ending with "enned"...');
    
    // Navigate to regular chart
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('svg', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/overlapping-text-search.png', fullPage: true });
    
    // Search for text elements that might contain "enned" or similar
    const suspiciousText = await page.evaluate(() => {
      // Get all text-containing elements
      const allElements = Array.from(document.querySelectorAll('*'));
      const textElements = allElements.filter(el => {
        const text = el.textContent || el.innerText || '';
        return text.trim().length > 0;
      });
      
      // Look for elements with text that might end with "enned" or contain partial words
      const suspicious = textElements.filter(el => {
        const text = (el.textContent || '').toLowerCase();
        const rect = el.getBoundingClientRect();
        
        // Focus on top-left area where the issue is
        const inTopLeft = rect.x < 400 && rect.y < 200;
        
        // Look for potential partial text or words ending in "enned"
        const hasPartialText = text.includes('enned') || 
                              text.includes('abled') || 
                              text.includes('abled') ||
                              text.includes('isabled') ||
                              text.includes('enabled') ||
                              text.includes('disabled') ||
                              text.match(/\w*enned/) ||
                              text.match(/\w*abled/) ||
                              // Look for any text that seems cut off
                              text.match(/\w{3,}$/) && text.length < 20;
        
        return inTopLeft && (hasPartialText || text.length > 50);
      });
      
      return suspicious.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tagName: el.tagName.toLowerCase(),
          text: (el.textContent || '').slice(0, 200), // First 200 chars
          className: el.className || '',
          id: el.id || '',
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          zIndex: window.getComputedStyle(el).zIndex,
          position: window.getComputedStyle(el).position,
          overflow: window.getComputedStyle(el).overflow,
          visibility: window.getComputedStyle(el).visibility,
          opacity: window.getComputedStyle(el).opacity
        };
      });
    });
    
    console.log('🕵️ Suspicious text elements found:', suspiciousText.length);
    suspiciousText.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName}[${el.className}]: "${el.text}"`);
      console.log(`     Position: (${el.x.toFixed(1)}, ${el.y.toFixed(1)}) ${el.width.toFixed(1)}x${el.height.toFixed(1)}`);
      console.log(`     Styles: z-index=${el.zIndex}, position=${el.position}, overflow=${el.overflow}`);
      console.log('');
    });
    
    // Look specifically for elements that might be clipping the OHLC text
    const ohlcArea = await page.evaluate(() => {
      // Find the OHLC text element
      const ohlcText = Array.from(document.querySelectorAll('text')).find(el => {
        const text = el.textContent || '';
        return text.includes('O:') && text.includes('H:') && text.includes('L:') && text.includes('C:');
      });
      
      if (!ohlcText) return null;
      
      const ohlcRect = ohlcText.getBoundingClientRect();
      
      // Find all elements that overlap with the OHLC text area
      const allElements = Array.from(document.querySelectorAll('*'));
      const overlapping = allElements.filter(el => {
        const rect = el.getBoundingClientRect();
        
        // Check if this element overlaps with OHLC text
        const overlaps = rect.x < (ohlcRect.x + ohlcRect.width) &&
                        (rect.x + rect.width) > ohlcRect.x &&
                        rect.y < (ohlcRect.y + ohlcRect.height) &&
                        (rect.y + rect.height) > ohlcRect.y &&
                        el !== ohlcText; // Don't include the OHLC text itself
        
        return overlaps && rect.width > 0 && rect.height > 0;
      });
      
      return {
        ohlcText: {
          text: ohlcText.textContent,
          x: ohlcRect.x,
          y: ohlcRect.y,
          width: ohlcRect.width,
          height: ohlcRect.height
        },
        overlappingElements: overlapping.slice(0, 5).map(el => ({ // Limit to first 5
          tagName: el.tagName.toLowerCase(),
          text: (el.textContent || '').slice(0, 100),
          className: el.className || '',
          id: el.id || '',
          rect: {
            x: el.getBoundingClientRect().x,
            y: el.getBoundingClientRect().y,
            width: el.getBoundingClientRect().width,
            height: el.getBoundingClientRect().height
          },
          styles: {
            zIndex: window.getComputedStyle(el).zIndex,
            position: window.getComputedStyle(el).position,
            backgroundColor: window.getComputedStyle(el).backgroundColor,
            color: window.getComputedStyle(el).color
          }
        }))
      };
    });
    
    if (ohlcArea) {
      console.log('📊 OHLC Text Analysis:');
      console.log(`  OHLC Text: "${ohlcArea.ohlcText.text}"`);
      console.log(`  Position: (${ohlcArea.ohlcText.x.toFixed(1)}, ${ohlcArea.ohlcText.y.toFixed(1)}) ${ohlcArea.ohlcText.width.toFixed(1)}x${ohlcArea.ohlcText.height.toFixed(1)}`);
      console.log('');
      console.log(`  ${ohlcArea.overlappingElements.length} elements overlapping OHLC area:`);
      ohlcArea.overlappingElements.forEach((el, i) => {
        console.log(`    ${i + 1}. ${el.tagName}[${el.className}]: "${el.text}"`);
        console.log(`       Position: (${el.rect.x.toFixed(1)}, ${el.rect.y.toFixed(1)}) ${el.rect.width.toFixed(1)}x${el.rect.height.toFixed(1)}`);
        console.log(`       Styles:`, el.styles);
      });
    }
    
    // Take a very zoomed-in screenshot of the problem area
    await page.screenshot({ 
      path: 'test-results/ohlc-overlap-zoom.png',
      clip: { x: 50, y: 80, width: 400, height: 150 }
    });
    
    expect(suspiciousText).toBeDefined();
  });
});