// Test script to debug monthly data issue
// This simulates the monthly timestamp calculation from yahoo-finance-incremental.js

function getFirstTradingDayOfMonth(timestamp) {
    const monthDate = new Date(timestamp);
    console.log(`Original timestamp: ${monthDate.toISOString()}`);
    console.log(`Original date: ${monthDate.toDateString()}`);
    
    // Current implementation - just sets to 1st of month
    monthDate.setDate(1);
    monthDate.setHours(9, 30, 0, 0);
    
    const dayOfWeek = monthDate.getDay();
    console.log(`First of month: ${monthDate.toDateString()}, Day: ${dayOfWeek}`);
    
    // Problem: The 1st might be a weekend!
    // We need to find the first trading day (Monday-Friday)
    
    return monthDate;
}

function getFirstTradingDayOfMonthFixed(timestamp) {
    const monthDate = new Date(timestamp);
    console.log(`\nFixed version:`);
    console.log(`Original timestamp: ${monthDate.toISOString()}`);
    
    // Set to first day of the month
    monthDate.setDate(1);
    monthDate.setHours(9, 30, 0, 0);
    
    // Find the first weekday (Monday-Friday)
    let dayOfWeek = monthDate.getDay();
    while (dayOfWeek === 0 || dayOfWeek === 6) { // Skip Sunday (0) and Saturday (6)
        monthDate.setDate(monthDate.getDate() + 1);
        dayOfWeek = monthDate.getDay();
    }
    
    console.log(`First trading day: ${monthDate.toDateString()}, Day: ${dayOfWeek}`);
    return monthDate;
}

// Test with various month timestamps
const testDates = [
    { timestamp: new Date('2024-09-30'), label: "September 2024 (ends Monday)" },
    { timestamp: new Date('2024-08-31'), label: "August 2024 (ends Saturday)" },
    { timestamp: new Date('2024-07-31'), label: "July 2024 (ends Wednesday)" },
    { timestamp: new Date('2024-06-30'), label: "June 2024 (ends Sunday)" },
    { timestamp: new Date('2024-05-31'), label: "May 2024 (ends Friday)" }
];

console.log("Testing monthly timestamp normalization:");
console.log("=========================================\n");

for (const testDate of testDates) {
    console.log(`\n${testDate.label}:`);
    console.log("---");
    
    console.log("Current implementation (buggy):");
    const currentResult = getFirstTradingDayOfMonth(testDate.timestamp);
    
    const fixedResult = getFirstTradingDayOfMonthFixed(testDate.timestamp);
    console.log("---");
}

console.log("\n\nAnalysis:");
console.log("==========");
console.log("September 1, 2024 is a Sunday - should move to Monday Sept 2");
console.log("August 1, 2024 is a Thursday - OK as is");
console.log("July 1, 2024 is a Monday - OK as is");
console.log("June 1, 2024 is a Saturday - should move to Monday June 3");
console.log("May 1, 2024 is a Wednesday - OK as is");