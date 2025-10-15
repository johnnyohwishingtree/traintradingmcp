const { test, expect } = require('@playwright/test');

test('Find and test horizontal line tool', async ({ page }) => {
  console.log('🎯 Finding the horizontal line tool in the line tools dropdown...\n');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Take screenshot of initial state
  await page.screenshot({ path: 'test-results/find-horizontal-step1-initial.png' });

  // Click the line tools button to open dropdown
  console.log('📝 Step 1: Clicking line tools button...');
  await page.click('[data-testid="line-tools-button"]');
  await page.waitForTimeout(500);

  // Take screenshot after clicking line tools
  await page.screenshot({ path: 'test-results/find-horizontal-step2-dropdown.png' });

  // Look for all elements that might be in the dropdown
  const dropdownElements = await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               rect.width > 0 && rect.height > 0;
      })
      .filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        const testId = el.getAttribute('data-testid') || '';
        const className = el.className || '';
        const title = el.title?.toLowerCase() || '';
        
        return text.includes('horizontal') || 
               text.includes('line') ||
               testId.includes('horizontal') ||
               testId.includes('line') ||
               className.includes('line') ||
               title.includes('horizontal') ||
               title.includes('line');
      });
    
    return dropdownElements.map(el => ({
      tagName: el.tagName,
      text: el.textContent?.trim().substring(0, 50) || '',
      testId: el.getAttribute('data-testid') || '',
      className: el.className || '',
      title: el.title || '',
      id: el.id || '',
      position: {
        x: el.getBoundingClientRect().x,
        y: el.getBoundingClientRect().y,
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height
      }
    }));
  });

  console.log(`\n📋 Found ${dropdownElements.length} potential line-related elements after clicking:`);
  dropdownElements.forEach((el, i) => {
    console.log(`  Element ${i + 1}: ${el.tagName}`);
    console.log(`    Text: "${el.text}"`);
    console.log(`    data-testid: "${el.testId}"`);
    console.log(`    className: "${el.className}"`);
    console.log(`    title: "${el.title}"`);
    console.log(`    Position: (${Math.round(el.position.x)}, ${Math.round(el.position.y)}) ${Math.round(el.position.width)}x${Math.round(el.position.height)}`);
    console.log('');
  });

  // Look specifically for elements with horizontal in the name
  const horizontalElements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        const testId = el.getAttribute('data-testid') || '';
        const className = el.className || '';
        const title = el.title?.toLowerCase() || '';
        
        return text.includes('horizontal') ||
               testId.includes('horizontal') ||
               className.includes('horizontal') ||
               title.includes('horizontal');
      })
      .map(el => ({
        tagName: el.tagName,
        text: el.textContent?.trim() || '',
        testId: el.getAttribute('data-testid') || '',
        className: el.className || '',
        title: el.title || '',
        visible: window.getComputedStyle(el).display !== 'none'
      }));
  });

  console.log(`\n🎯 Found ${horizontalElements.length} elements specifically mentioning "horizontal":`);
  horizontalElements.forEach((el, i) => {
    console.log(`  Horizontal Element ${i + 1}: ${el.tagName} (visible: ${el.visible})`);
    console.log(`    Text: "${el.text}"`);
    console.log(`    data-testid: "${el.testId}"`);
    console.log(`    title: "${el.title}"`);
    console.log('');
  });

  // Try to find any dropdown menus or popup elements
  const possibleDropdowns = await page.evaluate(() => {
    const selectors = [
      '.dropdown', '.menu', '.popup', '.tooltip', 
      '[role="menu"]', '[role="listbox"]', '[role="tooltip"]',
      '.line-tools', '.tool-menu', '.submenu'
    ];
    
    let found = [];
    selectors.forEach(selector => {
      const elements = Array.from(document.querySelectorAll(selector));
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          found.push({
            selector: selector,
            tagName: el.tagName,
            className: el.className,
            innerHTML: el.innerHTML.substring(0, 200)
          });
        }
      });
    });
    
    return found;
  });

  console.log(`\n🔍 Found ${possibleDropdowns.length} possible dropdown/menu elements:`);
  possibleDropdowns.forEach((dropdown, i) => {
    console.log(`  Dropdown ${i + 1}: ${dropdown.tagName} (${dropdown.selector})`);
    console.log(`    className: "${dropdown.className}"`);
    console.log(`    innerHTML preview: "${dropdown.innerHTML}"`);
    console.log('');
  });

  console.log('\n✅ EXPLORATION COMPLETE - Check screenshots to see dropdown state');
});