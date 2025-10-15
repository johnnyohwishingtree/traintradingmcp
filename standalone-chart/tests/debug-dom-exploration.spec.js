const { test, expect } = require('@playwright/test');

test('Debug DOM to find horizontal line tool', async ({ page }) => {
  console.log('🔍 Exploring DOM to find where the horizontal line tool is...\n');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({ path: 'test-results/debug-initial-page.png' });

  // Look for all buttons that might be drawing tools
  const buttons = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], span[data-testid], div[data-testid]'));
    return allButtons.map(btn => ({
      text: btn.textContent?.trim() || '',
      tagName: btn.tagName,
      id: btn.id || '',
      className: btn.className || '',
      dataTestId: btn.getAttribute('data-testid') || '',
      title: btn.title || '',
      innerHTML: btn.innerHTML.substring(0, 100) // First 100 chars only
    })).filter(btn => 
      btn.text.toLowerCase().includes('line') || 
      btn.text.toLowerCase().includes('horizontal') ||
      btn.dataTestId.includes('line') ||
      btn.dataTestId.includes('horizontal') ||
      btn.className.includes('tool') ||
      btn.innerHTML.includes('tool')
    );
  });

  console.log(`\n📋 Found ${buttons.length} potential line/horizontal tool buttons:`);
  buttons.forEach((btn, i) => {
    console.log(`  Button ${i + 1}:`);
    console.log(`    Text: "${btn.text}"`);
    console.log(`    Tag: ${btn.tagName}`);
    console.log(`    data-testid: "${btn.dataTestId}"`);
    console.log(`    className: "${btn.className}"`);
    console.log(`    id: "${btn.id}"`);
    console.log(`    title: "${btn.title}"`);
    console.log('');
  });

  // Look for ALL data-testid attributes on the page
  const allTestIds = await page.evaluate(() => {
    const elementsWithTestId = Array.from(document.querySelectorAll('[data-testid]'));
    return elementsWithTestId.map(el => ({
      testId: el.getAttribute('data-testid'),
      text: el.textContent?.trim().substring(0, 50) || '',
      tagName: el.tagName
    }));
  });

  console.log(`\n🏷️ Found ${allTestIds.length} elements with data-testid:`);
  allTestIds.forEach(item => {
    console.log(`  ${item.testId} (${item.tagName}): "${item.text}"`);
  });

  // Look for any elements that might contain drawing tools
  const toolContainers = await page.evaluate(() => {
    const containers = Array.from(document.querySelectorAll('div, span, nav, section'))
      .filter(el => {
        const className = el.className || '';
        const id = el.id || '';
        return className.toLowerCase().includes('tool') || 
               className.toLowerCase().includes('draw') ||
               className.toLowerCase().includes('menu') ||
               id.toLowerCase().includes('tool') ||
               id.toLowerCase().includes('draw');
      });
    
    return containers.map(container => ({
      tagName: container.tagName,
      className: container.className,
      id: container.id,
      childCount: container.children.length,
      hasButtons: container.querySelectorAll('button').length
    }));
  });

  console.log(`\n🔧 Found ${toolContainers.length} potential tool containers:`);
  toolContainers.forEach((container, i) => {
    console.log(`  Container ${i + 1}: ${container.tagName} (${container.childCount} children, ${container.hasButtons} buttons)`);
    console.log(`    className: "${container.className}"`);
    console.log(`    id: "${container.id}"`);
  });

  console.log('\n🎯 CONCLUSION: Need to understand the actual UI structure to find drawing tools');
});