/**
 * Time utilities for the Buzzd app
 * Handles time calculations and status checks for happy hour deals
 */

// Map day names to indices for easy comparison - with both uppercase and lowercase versions
const dayIndices: {[key: string]: number} = {
  // Title case versions
  'Mon': 0, 'Monday': 0,
  'Tue': 1, 'Tuesday': 1,
  'Wed': 2, 'Wednesday': 2,
  'Thu': 3, 'Thursday': 3,
  'Fri': 4, 'Friday': 4,
  'Sat': 5, 'Saturday': 5,
  'Sun': 6, 'Sunday': 6,
  
  // Lowercase versions
  'mon': 0, 'monday': 0,
  'tue': 1, 'tuesday': 1,
  'wed': 2, 'wednesday': 2,
  'thu': 3, 'thursday': 3,
  'fri': 4, 'friday': 4,
  'sat': 5, 'saturday': 5,
  'sun': 6, 'sunday': 6
};

// Days of the week for display and validation
export const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const shortDaysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const shortDaysOfWeekLowercase = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * Convert a date to Singapore time (GMT+8)
 * @param date Optional date to convert, defaults to current date/time
 * @returns Date object in Singapore time
 */
export function getSingaporeTime(date = new Date()): Date {
  const sgTimeString = date.toLocaleString('en-US', { 
    timeZone: 'Asia/Singapore',
    hour12: false 
  });
  
  return new Date(sgTimeString);
}

/**
 * Format a time string from 24-hour format to 12-hour format with AM/PM
 * @param timeString Time string in 24-hour format (HH:MM)
 * @returns Formatted time string in 12-hour format (h:MM AM/PM)
 */
export function formatTime(timeString: string): string {
  // Handle case where time is just a number (e.g. "1400")
  if (/^\d{3,4}$/.test(timeString)) {
    // Convert "1400" to "14:00"
    const hours = timeString.length === 3 
      ? timeString.substring(0, 1) 
      : timeString.substring(0, 2);
    const minutes = timeString.length === 3 
      ? timeString.substring(1, 3) 
      : timeString.substring(2, 4);
    timeString = `${hours}:${minutes}`;
  }
  
  // Parse the time string
  const [hourStr, minuteStr] = timeString.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr ? parseInt(minuteStr, 10) : 0;
  
  // Convert to 12-hour format
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour === 0 ? 12 : hour; // Handle midnight (0) as 12 AM
  
  // Format the time
  return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Parse a day range string into an array of day indices
 * @param dayRangeStr Day range string (e.g. "Mon-Fri", "All Days", "Weekends")
 * @returns Array of day indices (0 = Monday, 6 = Sunday)
 */
export function parseDaysOfWeek(dayRangeStr: string): number[] {
  // Handle common special cases
  if (dayRangeStr === 'All Days' || dayRangeStr === 'Everyday' || dayRangeStr === 'Daily') {
    return [0, 1, 2, 3, 4, 5, 6]; // All days
  }
  
  if (dayRangeStr === 'Weekdays') {
    return [0, 1, 2, 3, 4]; // Monday-Friday
  }
  
  if (dayRangeStr === 'Weekends') {
    return [5, 6]; // Saturday-Sunday
  }
  
  // Handle ranges (e.g. "Mon-Fri")
  if (dayRangeStr.includes('-')) {
    const [startDay, endDay] = dayRangeStr.split('-');
    const startIdx = dayIndices[startDay.trim()];
    const endIdx = dayIndices[endDay.trim()];
    
    if (startIdx !== undefined && endIdx !== undefined) {
      const days = [];
      for (let i = startIdx; i <= endIdx; i++) {
        days.push(i);
      }
      return days;
    }
  }
  
  // Handle comma-separated days (e.g. "Mon, Wed, Fri")
  if (dayRangeStr.includes(',')) {
    return dayRangeStr.split(',')
      .map(day => dayIndices[day.trim()])
      .filter(idx => idx !== undefined);
  }
  
  // Handle single day
  const singleDayIdx = dayIndices[dayRangeStr.trim()];
  return singleDayIdx !== undefined ? [singleDayIdx] : [];
}

/**
 * Check if a given time is within a happy hour range
 * This function supports two different call patterns:
 * 1. With a deal object: isWithinHappyHour(deal)
 * 2. With individual parameters: isWithinHappyHour(valid_days, hh_start_time, hh_end_time)
 */
export function isWithinHappyHour(
  deal: any | string, 
  hh_start_time?: string, 
  hh_end_time?: string,
  currentTime = getSingaporeTime()
): boolean {
  try {
    // Determine if we're using the deal object or individual parameters
    let startTime: string;
    let endTime: string;
    let validDays: string;
    
    if (typeof deal === 'object' && deal !== null) {
      // Deal object passed in - extract the properties
      validDays = deal.valid_days;
      startTime = deal.hh_start_time;
      endTime = deal.hh_end_time;
      
      // Log for debugging
      console.log(`Start time raw: "${startTime}", parsed: ${parseTimeToMinutes(startTime)}`);
      console.log(`End time raw: "${endTime}", parsed: ${parseTimeToMinutes(endTime)}`);
      
      // Current time for logging
      const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      console.log(`Current time value: ${currentTimeMinutes}`);
    } else {
      // Individual parameters passed in
      validDays = deal as string; // First parameter is valid_days
      startTime = hh_start_time || '';
      endTime = hh_end_time || '';
    }
    
    // Handle null or undefined inputs
    if (!startTime || !endTime || !validDays) {
      console.warn('Invalid happy hour inputs:', { startTime, endTime, validDays });
      return false;
    }
    
    // Standardize time format (convert "1400" to "14:00" if needed)
    let standardizedStartTime = String(startTime);
    let standardizedEndTime = String(endTime);
    
    if (/^\d{3,4}$/.test(standardizedStartTime)) {
      // Convert "1400" to "14:00"
      const hours = standardizedStartTime.length === 3 
        ? standardizedStartTime.substring(0, 1) 
        : standardizedStartTime.substring(0, 2);
      const minutes = standardizedStartTime.length === 3 
        ? standardizedStartTime.substring(1, 3) 
        : standardizedStartTime.substring(2, 4);
      standardizedStartTime = `${hours}:${minutes}`;
    }
    
    if (/^\d{3,4}$/.test(standardizedEndTime)) {
      // Convert "1900" to "19:00"
      const hours = standardizedEndTime.length === 3 
        ? standardizedEndTime.substring(0, 1) 
        : standardizedEndTime.substring(0, 2);
      const minutes = standardizedEndTime.length === 3 
        ? standardizedEndTime.substring(1, 3) 
        : standardizedEndTime.substring(2, 4);
      standardizedEndTime = `${hours}:${minutes}`;
    }
    
    // Check if today is a valid day using our case-insensitive utility
    if (!isValidDay(validDays, currentTime)) {
      return false;
    }
    
    // Parse start and end times
    const [startHourStr, startMinuteStr] = standardizedStartTime.split(':');
    const [endHourStr, endMinuteStr] = standardizedEndTime.split(':');
    
    if (!startHourStr || !endHourStr) {
      console.warn('Invalid time format:', { standardizedStartTime, standardizedEndTime });
      return false;
    }
    
    const startHour = parseInt(startHourStr, 10);
    const startMinute = parseInt(startMinuteStr || '0', 10);
    
    const endHour = parseInt(endHourStr, 10);
    const endMinute = parseInt(endMinuteStr || '0', 10);
    
    // Get current hour and minute in Singapore time
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    // Convert all times to minutes for easier comparison
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    // Check if current time is within range
    if (startTimeMinutes <= endTimeMinutes) {
      // Normal range (e.g., 12:00 - 18:00)
      const isActive = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
      
      // Log additional info
      if (typeof deal === 'object' && deal.drink_name) {
        if (isActive) {
          console.log(`Deal "${deal.drink_name}" from establishment ${deal.establishmentId} is ACTIVE (${currentTimeMinutes} is between ${startTimeMinutes} and ${endTimeMinutes})`);
        } else {
          console.log(`Deal "${deal.drink_name}" is NOT active: time ${currentTimeMinutes} is NOT between ${startTimeMinutes} and ${endTimeMinutes}`);
        }
      }
      
      return isActive;
    } else {
      // Overnight range (e.g., 22:00 - 02:00)
      const isActive = currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
      
      // Log additional info
      if (typeof deal === 'object' && deal.drink_name) {
        if (isActive) {
          console.log(`Deal "${deal.drink_name}" is ACTIVE (overnight: ${currentTimeMinutes} is outside ${endTimeMinutes}-${startTimeMinutes})`);
        } else {
          console.log(`Deal "${deal.drink_name}" is NOT active: time ${currentTimeMinutes} is not in overnight range (outside ${startTimeMinutes}-${endTimeMinutes})`);
        }
      }
      
      return isActive;
    }
  } catch (error) {
    console.error('Error checking happy hour status:', error);
    return false;
  }
}

/**
 * Helper function to parse time string to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  // Handle "1400" format
  if (/^\d{3,4}$/.test(timeStr)) {
    const hours = timeStr.length === 3 
      ? parseInt(timeStr.substring(0, 1), 10)
      : parseInt(timeStr.substring(0, 2), 10);
    const minutes = timeStr.length === 3 
      ? parseInt(timeStr.substring(1, 3), 10)
      : parseInt(timeStr.substring(2, 4), 10);
    return hours * 60 + minutes;
  }
  
  // Handle "14:00" format
  if (timeStr.includes(':')) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  // Default fallback
  return 0;
}

/**
 * Get display-friendly time range string
 * @param startTime Start time (format: HH:MM or HHMM)
 * @param endTime End time (format: HH:MM or HHMM)
 * @returns Formatted time range (e.g. "12:00 PM - 6:00 PM")
 */
export function getTimeRangeDisplay(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Get human-readable day range
 * @param validDays Days string (e.g. "Mon-Fri", "All Days")
 * @returns Formatted day range string
 */
export function getDaysDisplay(validDays: string): string {
  if (validDays === 'All Days' || validDays === 'Everyday' || validDays === 'Daily') {
    return 'Every day';
  }
  
  if (validDays === 'Weekdays') {
    return 'Mon-Fri';
  }
  
  if (validDays === 'Weekends') {
    return 'Sat-Sun';
  }
  
  return validDays;
}

/**
 * Validate if the current day is a valid day according to the specified day range
 * Works with both lowercase and uppercase day formats from the database
 * 
 * @param validDaysStr Day range string (e.g. "mon-fri", "Mon-Fri", "all days", "Daily", "weekends")
 * @param currentDate Optional date to check against (defaults to now)
 * @returns Boolean indicating if the current day is valid according to the schedule
 */
export function isValidDay(validDaysStr: string, currentDate = new Date()): boolean {
  if (!validDaysStr) return false;
  
  // Convert to lowercase for case-insensitive comparison
  const validDaysLower = validDaysStr.toLowerCase();
  
  // Adjust day index to make Sunday = 6, Monday = 0
  const currentDayIndex = (currentDate.getDay() + 6) % 7;
  const currentDay = shortDaysOfWeek[currentDayIndex];
  const currentDayLowercase = shortDaysOfWeekLowercase[currentDayIndex];
  
  // Handle common special cases
  if (validDaysLower === 'daily' || validDaysLower === 'all days' || validDaysLower === 'everyday') {
    return true;
  }
  
  if (validDaysLower === 'weekends') {
    return currentDayIndex === 5 || currentDayIndex === 6; // Saturday or Sunday
  }
  
  if (validDaysLower === 'weekdays') {
    return currentDayIndex >= 0 && currentDayIndex <= 4; // Monday-Friday
  }
  
  // Handle ranges like "mon-fri" or "Mon-Fri"
  if (validDaysLower.includes('-')) {
    const [startDay, endDay] = validDaysLower.split('-').map(d => d.trim());
    const startIdx = shortDaysOfWeekLowercase.indexOf(startDay);
    const endIdx = shortDaysOfWeekLowercase.indexOf(endDay);
    
    // Debug log
    console.log(`Range check: ${startIdx} <= ${currentDayIndex} <= ${endIdx} => ${
      startIdx <= currentDayIndex && currentDayIndex <= endIdx
    }`);
    
    if (startIdx !== -1 && endIdx !== -1) {
      if (startIdx <= endIdx) {
        return currentDayIndex >= startIdx && currentDayIndex <= endIdx;
      } else {
        // Handle wrapping around like "fri-sun" (includes Fri, Sat, Sun)
        return currentDayIndex >= startIdx || currentDayIndex <= endIdx;
      }
    }
  }
  
  // Handle comma-separated lists like "mon, wed, fri"
  if (validDaysLower.includes(',')) {
    const validDays = validDaysLower.split(',').map(d => d.trim());
    return validDays.includes(currentDayLowercase);
  }
  
  // Handle single day
  return validDaysLower.trim() === currentDayLowercase;
}