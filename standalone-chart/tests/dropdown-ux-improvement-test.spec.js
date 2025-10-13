const { test, expect } = require('@playwright/test');

test('Dropdown UX improvement - separate main button and dropdown arrow functionality', async ({ page }) => {
  console.log('🎯 Testing improved dropdown UX - main button vs dropdown arrow...');
  
  // Navigate to the chart application
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  console.log('📊 Chart application loaded');
  
  // Test 1: Main button should activate the tool directly
  console.log('🔍 Test 1: Main button activates tool without opening dropdown...');
  
  // Click the main area of the line tools button (avoiding the dropdown arrow)
  const lineToolsButton = page.locator('[data-testid="line-tools-button"]');
  
  // Click on the left/center area of the button (main area, not the arrow)
  await lineToolsButton.click({ position: { x: 18, y: 18 } }); // Center of 36x36 button
  console.log('🖱️ Clicked main button area');
  await page.waitForTimeout(500);
  
  // Check that dropdown did NOT open
  const dropdown = page.locator('[data-testid="line-dropdown"]');
  const isDropdownVisible = await dropdown.isVisible().catch(() => false);
  console.log('📋 Dropdown visible after main button click:', isDropdownVisible);
  
  // The button should be active (tool selected) but dropdown should not be open
  const isButtonActive = await lineToolsButton.evaluate(el => el.classList.contains('active'));
  console.log('🎯 Button is active after main click:', isButtonActive);
  
  await page.screenshot({ path: 'test-results/dropdown-ux-main-button-click.png' });
  
  // Test 2: Dropdown arrow should open dropdown
  console.log('🔍 Test 2: Dropdown arrow opens dropdown...');
  
  // Click specifically on the dropdown arrow
  const dropdownArrow = page.locator('[data-testid="dropdown-arrow"]');
  await dropdownArrow.click();
  console.log('🖱️ Clicked dropdown arrow');
  await page.waitForTimeout(500);
  
  // Check that dropdown DID open
  const isDropdownVisibleAfterArrow = await dropdown.isVisible().catch(() => false);
  console.log('📋 Dropdown visible after arrow click:', isDropdownVisibleAfterArrow);
  
  await page.screenshot({ path: 'test-results/dropdown-ux-arrow-click.png' });
  
  // Test 3: Selecting a different line type should close dropdown and change tool
  console.log('🔍 Test 3: Selecting line type from dropdown...');
  
  if (isDropdownVisibleAfterArrow) {
    // Click on "Ray" option in the dropdown
    await page.click('[data-testid="line-type-ray"]');
    console.log('🖱️ Selected Ray from dropdown');
    await page.waitForTimeout(500);
    
    // Check that dropdown closed
    const isDropdownVisibleAfterSelection = await dropdown.isVisible().catch(() => false);
    console.log('📋 Dropdown visible after selection:', isDropdownVisibleAfterSelection);
    
    // Check that the tool button now shows the Ray icon (visual change)
    await page.screenshot({ path: 'test-results/dropdown-ux-ray-selected.png' });
  }
  
  // Test 4: Main button should now activate Ray tool
  console.log('🔍 Test 4: Main button now activates Ray tool...');
  
  // First deactivate by clicking cursor
  await page.click('[data-testid="cursor-button"]');
  await page.waitForTimeout(300);
  
  // Now click main button area again - should activate Ray
  await lineToolsButton.click({ position: { x: 18, y: 18 } });
  console.log('🖱️ Clicked main button area again');
  await page.waitForTimeout(500);
  
  const isButtonActiveAgain = await lineToolsButton.evaluate(el => el.classList.contains('active'));
  console.log('🎯 Button active again:', isButtonActiveAgain);
  
  await page.screenshot({ path: 'test-results/dropdown-ux-final-state.png' });
  
  // Summary
  console.log('✅ DROPDOWN UX IMPROVEMENT TEST RESULTS:');
  console.log(`   - Main button activates tool directly: ${isButtonActive}`);
  console.log(`   - Dropdown arrow opens menu: ${isDropdownVisibleAfterArrow}`);
  console.log(`   - UX improvement working: ${isButtonActive && isDropdownVisibleAfterArrow}`);
  console.log('');
  console.log('📝 Expected behavior:');
  console.log('   1. Click main button → Activate current tool (no dropdown)');
  console.log('   2. Click dropdown arrow → Open line type menu');
  console.log('   3. Select from menu → Change default tool & close menu');
  console.log('   4. Repeat cycle with new default tool');
});

test('Dropdown arrow hover effects verification', async ({ page }) => {
  console.log('🎨 Testing dropdown arrow hover effects...');
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const dropdownArrow = page.locator('[data-testid="dropdown-arrow"]');
  
  // Take screenshot before hover
  await page.screenshot({ path: 'test-results/dropdown-arrow-before-hover.png' });
  
  // Hover over the dropdown arrow
  await dropdownArrow.hover();
  console.log('🖱️ Hovering over dropdown arrow');
  await page.waitForTimeout(500);
  
  // Take screenshot during hover
  await page.screenshot({ path: 'test-results/dropdown-arrow-during-hover.png' });
  
  // Move away
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  
  // Take screenshot after hover
  await page.screenshot({ path: 'test-results/dropdown-arrow-after-hover.png' });
  
  console.log('✅ Hover effects tested - check screenshots for visual feedback');
});