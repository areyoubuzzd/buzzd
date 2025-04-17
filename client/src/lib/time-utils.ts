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
 * @param hh_start_time Start time of happy hour (format: HH:MM or HHMM)
 * @param hh_end_time End time of happy hour (format: HH:MM or HHMM)
 * @param valid_days Days when happy hour is valid (e.g., "Mon-Fri")
 * @param currentTime Optional current time to check against (defaults to now in Singapore time)
 * @returns Boolean indicating if current time is within happy hour
 */
export function isWithinHappyHour(
  hh_start_time: string, 
  hh_end_time: string, 
  valid_days: string,
  currentTime = getSingaporeTime()
): boolean {
  try {
    // Handle null or undefined inputs
    if (!hh_start_time || !hh_end_time || !valid_days) {
      console.warn('Invalid happy hour inputs:', { hh_start_time, hh_end_time, valid_days });
      return false;
    }
    
    // Standardize time format (convert "1400" to "14:00" if needed)
    let startTime = String(hh_start_time);
    let endTime = String(hh_end_time);
    
    if (/^\d{3,4}$/.test(startTime)) {
      // Convert "1400" to "14:00"
      const hours = startTime.length === 3 
        ? startTime.substring(0, 1) 
        : startTime.substring(0, 2);
      const minutes = startTime.length === 3 
        ? startTime.substring(1, 3) 
        : startTime.substring(2, 4);
      startTime = `${hours}:${minutes}`;
    }
    
    if (/^\d{3,4}$/.test(endTime)) {
      // Convert "1900" to "19:00"
      const hours = endTime.length === 3 
        ? endTime.substring(0, 1) 
        : endTime.substring(0, 2);
      const minutes = endTime.length === 3 
        ? endTime.substring(1, 3) 
        : endTime.substring(2, 4);
      endTime = `${hours}:${minutes}`;
    }
    
    // Check if today is a valid day using our case-insensitive utility
    if (!isValidDay(valid_days, currentTime)) {
      return false;
    }
    
    // Parse start and end times
    const [startHourStr, startMinuteStr] = startTime.split(':');
    const [endHourStr, endMinuteStr] = endTime.split(':');
    
    if (!startHourStr || !endHourStr) {
      console.warn('Invalid time format:', { startTime, endTime });
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
      return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
    } else {
      // Overnight range (e.g., 22:00 - 02:00)
      return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
    }
  } catch (error) {
    console.error('Error checking happy hour status:', error, { hh_start_time, hh_end_time, valid_days });
    return false;
  }
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