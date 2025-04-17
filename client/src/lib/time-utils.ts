/**
 * Utility functions for time calculations
 */

export interface Deal {
  valid_days: string;
  hh_start_time: string;
  hh_end_time: string;
}

/**
 * Check if a deal is currently active (within happy hour)
 * @param deal Deal object with valid_days, hh_start_time, and hh_end_time
 * @returns boolean indicating if the deal is currently active
 */
export function isWithinHappyHour(deal: any): boolean {
  if (!deal || !deal.valid_days || !deal.hh_start_time || !deal.hh_end_time) return false;
  
  // Get the current date in the user's local timezone
  const now = new Date();
  
  // Get current day name
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = days[now.getDay()];
  
  // Check if current day is in valid days
  let isDayValid = false;
  
  // Handle the "Daily" case
  if (deal.valid_days.toLowerCase() === 'daily' || deal.valid_days.toLowerCase() === 'all days') {
    isDayValid = true;
  } 
  // Handle "Weekends" case
  else if (deal.valid_days.toLowerCase() === 'weekends') {
    isDayValid = currentDay === 'Sat' || currentDay === 'Sun';
  }
  // Handle "Weekdays" case
  else if (deal.valid_days.toLowerCase() === 'weekdays') {
    isDayValid = currentDay !== 'Sat' && currentDay !== 'Sun';
  }
  // Handle ranges like "Mon-Fri"
  else if (deal.valid_days.includes('-')) {
    const [startDay, endDay] = deal.valid_days.split('-').map(d => d.trim());
    const startIdx = days.findIndex(d => d === startDay);
    const endIdx = days.findIndex(d => d === endDay);
    const currentIdx = now.getDay();
    
    if (startIdx <= endIdx) {
      isDayValid = currentIdx >= startIdx && currentIdx <= endIdx;
    } else {
      // Handle wrapping around like "Fri-Sun" (includes Fri, Sat, Sun)
      isDayValid = currentIdx >= startIdx || currentIdx <= endIdx;
    }
  }
  // Handle comma-separated lists like "Mon, Wed, Fri"
  else if (deal.valid_days.includes(',')) {
    const validDays = deal.valid_days.split(',').map(d => d.trim());
    isDayValid = validDays.includes(currentDay);
  }
  // Handle single day
  else {
    isDayValid = deal.valid_days.trim() === currentDay;
  }
  
  if (!isDayValid) return false;
  
  // Now check if current time is within happy hour
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // in minutes since midnight
  
  // Parse happy hour times
  // Handle different formats like "17:00", "17:00:00", "1700"
  let startTime = 0;
  let endTime = 0;
  
  // Parse start time
  if (deal.hh_start_time.includes(':')) {
    const [hours, minutes] = deal.hh_start_time.split(':').map(Number);
    startTime = hours * 60 + (minutes || 0);
  } else {
    // Format like "1700"
    const timeStr = deal.hh_start_time;
    // Handle possible formats
    if (timeStr.length <= 2) {
      // Just hours like "9" or "17"
      startTime = parseInt(timeStr) * 60;
    } else if (timeStr.length === 3) {
      // Format like "930" (9:30)
      const hours = parseInt(timeStr.substring(0, 1));
      const minutes = parseInt(timeStr.substring(1));
      startTime = hours * 60 + minutes;
    } else {
      // Format like "0930" or "1700"
      const hours = parseInt(timeStr.substring(0, 2));
      const minutes = parseInt(timeStr.substring(2));
      startTime = hours * 60 + minutes;
    }
  }
  
  // Parse end time
  if (deal.hh_end_time.includes(':')) {
    const [hours, minutes] = deal.hh_end_time.split(':').map(Number);
    endTime = hours * 60 + (minutes || 0);
  } else {
    // Format like "1700"
    const timeStr = deal.hh_end_time;
    // Handle possible formats
    if (timeStr.length <= 2) {
      // Just hours like "9" or "17"
      endTime = parseInt(timeStr) * 60;
    } else if (timeStr.length === 3) {
      // Format like "930" (9:30)
      const hours = parseInt(timeStr.substring(0, 1));
      const minutes = parseInt(timeStr.substring(1));
      endTime = hours * 60 + minutes;
    } else {
      // Format like "0930" or "1700"
      const hours = parseInt(timeStr.substring(0, 2));
      const minutes = parseInt(timeStr.substring(2));
      endTime = hours * 60 + minutes;
    }
  }
  
  // Check if current time is within happy hour range
  if (startTime <= endTime) {
    // Normal case: e.g. 17:00 - 20:00
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Overnight case: e.g. 22:00 - 02:00
    return currentTime >= startTime || currentTime <= endTime;
  }
}