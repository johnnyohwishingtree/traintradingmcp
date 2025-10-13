// Utility functions for timezone conversion

export function convertToTimezone(date: Date, timezone: string): Date {
  // Get the UTC time
  const utcTime = date.getTime();
  
  if (timezone === 'utc') {
    // Return the date as-is for UTC
    return date;
  } else if (timezone === 'et') {
    // Convert to Eastern Time
    // ET is UTC-5 (EST) or UTC-4 (EDT)
    // For simplicity, we'll use UTC-4 during trading season (March-November)
    const month = date.getUTCMonth();
    const isDST = month >= 2 && month <= 10; // Rough DST calculation
    const etOffset = isDST ? -4 : -5;
    
    // Create a new date object adjusted for ET
    const etTime = new Date(utcTime);
    // Adjust the display by changing the local time to match ET
    const localOffset = date.getTimezoneOffset() / 60; // in hours
    const adjustmentHours = etOffset - (-localOffset);
    etTime.setHours(etTime.getHours() + adjustmentHours);
    
    return etTime;
  } else {
    // Return local time (default)
    return date;
  }
}

export function getTimezoneLabel(timezone: string): string {
  switch (timezone) {
    case 'et':
      return ' ET';
    case 'utc':
      return ' UTC';
    default:
      return ''; // Local time, no label needed
  }
}

// Format time for display with proper timezone
export function formatTimeWithTimezone(date: Date, timezone: string, includeTime: boolean = true): string {
  if (!includeTime) {
    // For daily charts, just return the date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  if (timezone === 'et') {
    // Show actual ET time
    const etString = date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return etString + ' ET';
  } else if (timezone === 'utc') {
    // Show UTC time
    const utcString = date.toLocaleString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
    return utcString + ' UTC';
  } else {
    // Show local time
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}