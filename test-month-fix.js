// Test to verify the fix is working
const testTimestamp = new Date('2024-09-30T23:59:59Z'); // End of September

console.log('Original timestamp:', testTimestamp.toISOString());
console.log('Original date:', testTimestamp.toDateString());

// Simulate the fix
const monthDate = new Date(testTimestamp);

// Set to first day of the month  
monthDate.setDate(1);
monthDate.setHours(9, 30, 0, 0); // Set to market open time

console.log('\nAfter setting to 1st of month:');
console.log('Date:', monthDate.toDateString());
console.log('Day of week:', monthDate.getDay(), '(0=Sunday)');

// Find the first trading day (skip weekends)
let dayOfWeek = monthDate.getDay();
while (dayOfWeek === 0 || dayOfWeek === 6) { // Skip Sunday (0) and Saturday (6)
  console.log(`  Skipping ${monthDate.toDateString()} (day ${dayOfWeek})`);
  monthDate.setDate(monthDate.getDate() + 1);
  dayOfWeek = monthDate.getDay();
}

console.log('\nFirst trading day:');
console.log('Date:', monthDate.toDateString());
console.log('Day of week:', dayOfWeek);
console.log('ISO String:', monthDate.toISOString());

// Check what's happening with UTC vs local time
console.log('\nUTC vs Local time analysis:');
console.log('UTC Date:', monthDate.toUTCString());
console.log('Local Date:', monthDate.toString());