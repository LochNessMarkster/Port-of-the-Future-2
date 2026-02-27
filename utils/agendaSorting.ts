
/**
 * Utility functions for sorting agenda items
 */

interface AgendaItem {
  date: string;
  time: string;
  type: string;
  [key: string]: any;
}

/**
 * Parse time string to comparable number (minutes since midnight)
 */
export function parseTime(timeStr: string): number {
  try {
    if (!timeStr || timeStr.trim() === '') return 0;
    
    // Handle various time formats: "9:00 AM", "09:00", "9:00AM", "9:30 AM", etc.
    const cleanTime = timeStr.trim().toUpperCase();
    
    // Extract hours and minutes
    const match = cleanTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/);
    if (!match) {
      console.log('[agendaSorting] Could not parse time:', timeStr);
      return 0;
    }
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2] || '0', 10);
    const period = match[3];
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes;
  } catch (err) {
    console.error('[agendaSorting] Error parsing time:', timeStr, err);
    return 0;
  }
}

/**
 * Parse date string to comparable number (YYYYMMDD format)
 */
export function parseDate(dateStr: string): number {
  try {
    if (!dateStr || dateStr.trim() === '') return 0;
    
    const cleanDate = dateStr.toLowerCase();
    
    // Extract day number (23, 24, or 25)
    let day = 24; // default
    if (cleanDate.includes('23')) {
      day = 23;
    } else if (cleanDate.includes('24')) {
      day = 24;
    } else if (cleanDate.includes('25')) {
      day = 25;
    }
    
    // Return as YYYYMMDD format for easy comparison
    // Assuming March 2026
    return 20260300 + day;
  } catch (err) {
    console.error('[agendaSorting] Error parsing date:', dateStr, err);
    return 0;
  }
}

/**
 * Extract track number from Type/Track field
 * Examples: "Track 1" -> 1, "Track 2 - Developing Ports" -> 2
 */
export function extractTrackNumber(typeTrack: string): number | null {
  const match = typeTrack.match(/Track\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Get sort priority for Type/Track field
 * Lower numbers = higher priority (appear first)
 */
export function getTypeTrackPriority(typeTrack: string): number {
  const cleanType = typeTrack.trim();
  
  // 1. Keynote & Plenary (and variations)
  if (cleanType.toLowerCase().includes('keynote') && cleanType.toLowerCase().includes('plenary')) {
    return 1;
  }
  
  // 2. Pre-Conference (and variations)
  if (cleanType.toLowerCase().includes('pre-conference')) {
    return 2;
  }
  
  // 3. Track items (sorted by track number)
  const trackNumber = extractTrackNumber(cleanType);
  if (trackNumber !== null) {
    return 100 + trackNumber; // Track 1 = 101, Track 2 = 102, etc.
  }
  
  // 4. Special Event
  if (cleanType.toLowerCase().includes('special event')) {
    return 200;
  }
  
  // 5. Break
  if (cleanType.toLowerCase() === 'break') {
    return 300;
  }
  
  // 6. Luncheon
  if (cleanType.toLowerCase().includes('luncheon')) {
    return 400;
  }
  
  // 7. Everything else (items without track numbers)
  return 500;
}

/**
 * Sort agenda items by date/time (primary) and Type/Track (secondary)
 */
export function sortAgendaItems<T extends AgendaItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // Primary sort: Date and Time (earliest first)
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    
    const timeA = parseTime(a.time);
    const timeB = parseTime(a.time);
    
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    
    // Secondary sort: Type/Track priority
    const priorityA = getTypeTrackPriority(a.type);
    const priorityB = getTypeTrackPriority(b.type);
    
    return priorityA - priorityB;
  });
}
