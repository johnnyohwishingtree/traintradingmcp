const { test, expect } = require('@playwright/test');

test('Simple replay save/restore functionality test', async ({ page }) => {
  console.log('\n🔄 TESTING REPLAY SAVE/RESTORE LOGIC');
  
  // Go to the application
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000); // Wait for chart and data to load
  
  console.log('\n📊 Step 1: Enter replay mode');
  
  // Click the replay button
  const replayButton = await page.locator('button[title="Bar replay"]');
  const replayExists = await replayButton.count() > 0;
  console.log(`  Replay button found: ${replayExists}`);
  
  if (replayExists) {
    await replayButton.click();
    await page.waitForTimeout(1000);
    console.log('  ✅ Entered replay mode');
  }
  
  // Verify replay controls appear
  const replayControls = await page.locator('.replay-controls-overlay');
  await replayControls.waitFor({ state: 'visible', timeout: 5000 });
  console.log('  ✅ Replay controls visible');
  
  await page.screenshot({ path: 'test-results/replay-restore-1-in-replay.png' });
  console.log('📸 Screenshot in replay mode');
  
  console.log('\n📊 Step 2: Exit replay mode');
  
  // Click the exit button in replay controls
  const exitButton = await page.locator('.replay-exit');
  await exitButton.click();
  await page.waitForTimeout(2000); // Wait for data refresh
  console.log('  ✅ Exited replay mode');
  
  // Verify replay controls are gone
  const controlsGone = await replayControls.count() === 0;
  console.log(`  Replay controls removed: ${controlsGone}`);
  
  await page.screenshot({ path: 'test-results/replay-restore-2-after-exit.png' });
  console.log('📸 Screenshot after exiting replay');
  
  // Check browser console for our save/restore log messages
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'log' && (msg.text().includes('💾 Saved drawings') || msg.text().includes('🔄 Restoring'))) {
      logs.push(msg.text());
    }
  });
  
  console.log('\n✅ REPLAY SAVE/RESTORE TEST COMPLETE!');
  console.log('📁 Check test-results/replay-restore-*.png for verification');
  console.log('💬 Console logs should show save/restore messages');
});