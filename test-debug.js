// Test script for debugging weekly OHLC calculation
// This mimics the logic from yahoo-finance-incremental.js

function calculateWeekStart(timestamp) {
    const date = new Date(timestamp * 1000);
    const dayOfWeek = date.getDay();
    
    console.log(`Original date: ${date.toISOString()}`);
    console.log(`Day of week: ${dayOfWeek} (0=Sunday, 6=Saturday)`);
    
    let daysToMonday;
    if (dayOfWeek === 0) { // Sunday
        // This was the bug: going back 6 days instead of forward 1
        daysToMonday = -1; // Fixed: Go forward to next Monday
        // daysToMonday = 6; // Bug: Goes back to previous Monday
    } else {
        daysToMonday = 1 - dayOfWeek;
    }
    
    const weekDate = new Date(date);
    weekDate.setDate(weekDate.getDate() + daysToMonday);
    weekDate.setHours(0, 0, 0, 0);
    
    console.log(`Days to Monday: ${daysToMonday}`);
    console.log(`Week start: ${weekDate.toISOString()}`);
    
    return weekDate;
}

// Test with September dates
const testDates = [
    { timestamp: 1725148800, label: "September 1, 2024 (Sunday)" },
    { timestamp: 1725753600, label: "September 8, 2024 (Sunday)" },
    { timestamp: 1726358400, label: "September 15, 2024 (Sunday)" },
    { timestamp: 1726531200, label: "September 17, 2024 (Tuesday)" }
];

console.log("Testing weekly calculation:");
console.log("===========================\n");

for (const testDate of testDates) {
    console.log(`Testing: ${testDate.label}`);
    const weekStart = calculateWeekStart(testDate.timestamp);
    console.log("---\n");
}

console.log("Script completed!");