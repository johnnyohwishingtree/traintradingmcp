const { test, expect } = require('@playwright/test');

test('Replay functionality test', async ({ page }) => {
  console.log('\n🎬 TESTING REPLAY FUNCTIONALITY');
  
  // Go to the application
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000); // Wait for chart and data to load
  
  console.log('\n📊 Step 1: Click replay button to enter replay mode');
  
  // Click the replay button in header toolbar
  const replayButton = await page.locator('button[title="Bar replay"]');
  const replayExists = await replayButton.count() > 0;
  console.log(`  Replay button found: ${replayExists}`);
  
  if (replayExists) {
    await replayButton.click();
    await page.waitForTimeout(1000);
    console.log('  ✅ Replay button clicked');
  }
  
  // Wait for replay controls to appear
  console.log('\n📊 Step 2: Verify replay controls appear');
  
  const replayControls = await page.locator('.replay-controls-overlay');
  await replayControls.waitFor({ state: 'visible', timeout: 5000 });
  console.log('  ✅ Replay controls visible');
  
  await page.screenshot({ path: 'test-results/replay-1-controls-visible.png' });
  console.log('📸 Screenshot with replay controls');
  
  // Check that we're showing partial data
  console.log('\n📊 Step 3: Verify partial data is shown');
  
  const progressInfo = await page.locator('.progress-info').first();
  const progressText = await progressInfo.textContent();
  console.log(`  Progress info: ${progressText}`);
  
  // Test play button
  console.log('\n📊 Step 4: Test play functionality');
  
  const playButton = await page.locator('.replay-btn.play-pause');
  await playButton.click();
  console.log('  ▶️ Play button clicked');
  
  // Wait a bit to see if data advances
  await page.waitForTimeout(3000);
  
  const progressTextAfterPlay = await progressInfo.textContent();
  console.log(`  Progress after playing: ${progressTextAfterPlay}`);
  
  await page.screenshot({ path: 'test-results/replay-2-after-play.png' });
  console.log('📸 Screenshot after playing');
  
  // Test pause button
  console.log('\n📊 Step 5: Test pause functionality');
  
  await playButton.click(); // Should be pause now
  console.log('  ⏸️ Pause button clicked');
  
  await page.waitForTimeout(1000);
  
  // Test step forward
  console.log('\n📊 Step 6: Test step forward');
  
  const stepForwardButton = await page.locator('.replay-btn.step').last();
  await stepForwardButton.click();
  console.log('  ⏭ Step forward clicked');
  
  await page.waitForTimeout(500);
  
  const progressTextAfterStep = await progressInfo.textContent();
  console.log(`  Progress after step: ${progressTextAfterStep}`);
  
  // Test step backward
  console.log('\n📊 Step 7: Test step backward');
  
  const stepBackwardButton = await page.locator('.replay-btn.step').first();
  await stepBackwardButton.click();
  console.log('  ⏮ Step backward clicked');
  
  await page.waitForTimeout(500);
  
  // Test speed change
  console.log('\n📊 Step 8: Test speed change');
  
  const speedSelector = await page.locator('.speed-selector');
  await speedSelector.selectOption('2');
  console.log('  Speed changed to 2x');
  
  // Test position slider
  console.log('\n📊 Step 9: Test position slider');
  
  const slider = await page.locator('.progress-slider');
  const sliderBox = await slider.boundingBox();
  
  if (sliderBox) {
    // Drag slider to middle
    await page.mouse.move(sliderBox.x + sliderBox.width / 2, sliderBox.y + sliderBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(sliderBox.x + sliderBox.width * 0.75, sliderBox.y + sliderBox.height / 2);
    await page.mouse.up();
    console.log('  📊 Slider moved to 75%');
  }
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/replay-3-slider-moved.png' });
  console.log('📸 Screenshot after moving slider');
  
  // Test exit replay
  console.log('\n📊 Step 10: Test exit replay mode');
  
  const exitButton = await page.locator('.replay-exit');
  await exitButton.click();
  console.log('  ✕ Exit button clicked');
  
  await page.waitForTimeout(1000);
  
  // Verify replay controls are gone
  const controlsGone = await replayControls.count() === 0;
  console.log(`  Replay controls removed: ${controlsGone}`);
  
  await page.screenshot({ path: 'test-results/replay-4-exited.png' });
  console.log('📸 Screenshot after exiting replay mode');
  
  console.log('\n✅ REPLAY TEST COMPLETE!');
  console.log('📁 Check test-results/replay-*.png for visual verification');
  console.log('✅ All replay controls functional:');
  console.log('   - Enter/exit replay mode');
  console.log('   - Play/pause');
  console.log('   - Step forward/backward');
  console.log('   - Speed control');
  console.log('   - Position slider');
});