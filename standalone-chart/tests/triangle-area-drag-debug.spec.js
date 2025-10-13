const { test, expect } = require('@playwright/test');

test('Triangle area drag - debug event flow', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Wait for the chart container to load
    await page.waitForSelector('[data-testid="main-chart-container"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('🏁 Starting triangle area drag debug test');

    // Click on Patterns button to activate triangle tool using data-testid
    await page.click('[data-testid="patterns-button"]');
    await page.waitForTimeout(300);

    // Draw a triangle by clicking three points
    const point1 = { x: 200, y: 200 };
    const point2 = { x: 350, y: 150 };
    const point3 = { x: 300, y: 280 };

    console.log('📍 Drawing triangle with points:', { point1, point2, point3 });

    await page.mouse.click(point1.x, point1.y);
    await page.waitForTimeout(200);
    await page.mouse.click(point2.x, point2.y);
    await page.waitForTimeout(200);
    await page.mouse.click(point3.x, point3.y);
    await page.waitForTimeout(500);

    // Take screenshot after triangle creation
    await page.screenshot({ path: 'test-results/triangle-debug-created.png' });

    // Switch to cursor mode
    console.log('🔄 Switching to cursor mode');
    await page.click('[data-testid="cursor-button"]');
    await page.waitForTimeout(300);

    // Start monitoring console logs
    page.on('console', msg => {
        if (msg.text().includes('🔄') || msg.text().includes('🎯') || msg.text().includes('✅')) {
            console.log('🎧 Console log:', msg.text());
        }
    });

    // Try to drag the triangle from the center area
    const centerX = (point1.x + point2.x + point3.x) / 3;
    const centerY = (point1.y + point2.y + point3.y) / 3;
    
    console.log('🎯 Attempting to drag from triangle center:', { centerX, centerY });

    // First hover to see if cursor changes and control points appear
    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(500);
    
    // Take screenshot showing hover state
    await page.screenshot({ path: 'test-results/triangle-debug-hover.png' });
    
    // Perform the drag operation with mouse events
    console.log('🖱️ Starting drag operation...');
    await page.mouse.down();
    await page.waitForTimeout(200);
    
    // Drag to a new position
    const newCenterX = centerX + 100;
    const newCenterY = centerY + 50;
    
    console.log('🚀 Dragging to new position:', { newCenterX, newCenterY });
    
    // Move in steps to simulate smooth dragging
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
        const stepX = centerX + (newCenterX - centerX) * (i / steps);
        const stepY = centerY + (newCenterY - centerY) * (i / steps);
        await page.mouse.move(stepX, stepY);
        await page.waitForTimeout(20); // Small delay between steps
    }
    
    // Take screenshot during drag
    await page.screenshot({ path: 'test-results/triangle-debug-dragging.png' });
    
    // Release mouse
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/triangle-debug-final.png' });
    
    console.log('✅ Triangle area drag debug test completed');
});