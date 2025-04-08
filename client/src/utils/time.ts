import { format, differenceInHours, differenceInMinutes, isAfter, isBefore } from "date-fns";

/**
 * Format a time range from start and end date objects
 * @param startTime The start time as a Date or ISO string
 * @param endTime The end time as a Date or ISO string
 * @returns Formatted time range string (e.g., "5:00 PM - 7:00 PM")
 */
export function formatTimeRange(
  startTime: Date | string,
  endTime: Date | string
): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
}

/**
 * Get the status of a deal based on its start and end times
 * @param startTime The start time as a Date or ISO string
 * @param endTime The end time as a Date or ISO string
 * @returns 'active', 'upcoming', or 'inactive'
 */
export function getDealStatus(
  startTime: Date | string,
  endTime: Date | string
): 'active' | 'upcoming' | 'inactive' {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();
  
  if (isAfter(start, now)) {
    return "upcoming";
  } else if (isBefore(end, now)) {
    return "inactive";
  } else {
    return "active";
  }
}

/**
 * Format time remaining or until start for a deal
 * @param startTime The start time as a Date or ISO string
 * @param endTime The end time as a Date or ISO string
 * @returns Formatted time display string
 */
export function formatTimeDisplay(
  startTime: Date | string,
  endTime: Date | string
): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();
  const status = getDealStatus(start, end);
  
  if (status === 'active') {
    const hoursLeft = differenceInHours(end, now);
    const minutesLeft = differenceInMinutes(end, now) % 60;
    
    if (hoursLeft > 0) {
      return `Ends in ${hoursLeft}h ${minutesLeft}m`;
    } else {
      return `Ends in ${minutesLeft}m`;
    }
  } else if (status === 'upcoming') {
    const hoursUntil = differenceInHours(start, now);
    
    if (hoursUntil < 1) {
      const minutesUntil = differenceInMinutes(start, now);
      return `Starts in ${minutesUntil}m`;
    } else if (hoursUntil < 24) {
      return `Starts in ${hoursUntil}h`;
    } else {
      return `Starts ${format(start, "EEE")} at ${format(start, "h:mm a")}`;
    }
  } else {
    // Inactive deal
    return `Next: ${format(start, "EEE")} at ${format(start, "h:mm a")}`;
  }
}

/**
 * Get days of week as a string from a numeric array
 * @param daysArray Array of day numbers (0-6, where 0 is Sunday)
 * @returns Comma-separated string of day names
 */
export function getDaysOfWeekString(daysArray: number[]): string {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return daysArray.map(day => dayNames[day]).join(", ");
}

/**
 * Get short form days of week
 * @param daysArray Array of day numbers (0-6, where 0 is Sunday)
 * @returns Comma-separated string of short day names
 */
export function getShortDaysOfWeekString(daysArray: number[]): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return daysArray.map(day => dayNames[day]).join(", ");
}
