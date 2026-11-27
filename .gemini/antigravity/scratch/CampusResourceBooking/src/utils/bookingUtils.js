export const OPERATING_START_HOUR = 8;
export const OPERATING_END_HOUR = 18;
export const DAILY_OPERATING_HOURS = OPERATING_END_HOUR - OPERATING_START_HOUR; // 10 hours (8 AM - 6 PM)

export const RESOURCE_TYPES = [
  'Computer Lab',
  'Classroom',
  'Auditorium',
  'Meeting Room',
];

/**
 * Returns today's local date in YYYY-MM-DD format.
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a time string ("HH:MM" or "HH:MM:SS") to minutes since midnight.
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return NaN;
  const parts = String(timeStr).split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
}

/**
 * Overlap rule: newStart < existingEnd AND newEnd > existingStart.
 * Adjacent slots (e.g., 10:00-11:00 and 11:00-12:00) do NOT overlap.
 */
export function hasTimeOverlap(newStart, newEnd, existingStart, existingEnd) {
  const ns = timeToMinutes(newStart);
  const ne = timeToMinutes(newEnd);
  const es = timeToMinutes(existingStart);
  const ee = timeToMinutes(existingEnd);
  if ([ns, ne, es, ee].some(Number.isNaN)) return false;
  return ns < ee && ne > es;
}

/**
 * Finds the first active (non-cancelled) booking that conflicts with [newStart, newEnd].
 */
export function findBookingConflict(newStart, newEnd, existingBookings = []) {
  return (
    existingBookings.find((booking) => {
      if (booking.status && booking.status.toLowerCase() === 'cancelled') {
        return false;
      }
      return hasTimeOverlap(newStart, newEnd, booking.start_time, booking.end_time);
    }) || null
  );
}

/**
 * Validates booking form inputs before sending to Supabase RPC.
 */
export function validateBookingInput({
  resourceId,
  bookingDate,
  startTime,
  endTime,
  purpose,
  today = getTodayDateString(),
}) {
  if (!resourceId) {
    return { valid: false, error: 'Please select a campus resource.' };
  }
  if (!bookingDate) {
    return { valid: false, error: 'Please select a booking date.' };
  }
  if (bookingDate < today) {
    return { valid: false, error: 'Past dates are not allowed. Choose today or a future date.' };
  }
  if (!startTime || !endTime) {
    return { valid: false, error: 'Please select both start time and end time.' };
  }

  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (Number.isNaN(startMins) || Number.isNaN(endMins)) {
    return { valid: false, error: 'Invalid time format.' };
  }
  if (endMins <= startMins) {
    return { valid: false, error: 'End time must be later than start time.' };
  }

  const trimmedPurpose = (purpose || '').trim();
  if (trimmedPurpose.length < 3) {
    return { valid: false, error: 'Please enter a booking purpose (at least 3 characters).' };
  }

  return { valid: true, error: null };
}

/**
 * Calculates duration in hours between two HH:MM(:SS) strings.
 */
export function calculateDurationHours(startTime, endTime) {
  const diffMins = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (Number.isNaN(diffMins) || diffMins <= 0) return 0;
  return Number((diffMins / 60).toFixed(2));
}

/**
 * Formula: Utilization Percentage = (Total Booked Hours / Total Available Hours) * 100
 */
export function calculateUtilizationPercentage(totalBookedHours, totalAvailableHours) {
  if (!totalAvailableHours || totalAvailableHours <= 0) return 0;
  const pct = (Number(totalBookedHours || 0) / Number(totalAvailableHours)) * 100;
  return Number(pct.toFixed(1));
}

/**
 * Formats "YYYY-MM-DD" into a readable date string.
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats "HH:MM:SS" or "HH:MM" into 12-hour format (e.g. "09:00 AM").
 */
export function formatTimeDisplay(timeStr) {
  if (!timeStr) return '—';
  const [hStr, mStr] = String(timeStr).split(':');
  const h = Number(hStr);
  const m = Number(mStr || 0);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Shortens UUID for compact table display.
 */
export function formatShortId(uuid) {
  if (!uuid) return '—';
  return `BK-${String(uuid).slice(0, 8).toUpperCase()}`;
}

/**
 * Normalizes a time input ("HH:MM") to "HH:MM:00" for SQL comparisons.
 */
export function normalizeSqlTime(timeStr) {
  if (!timeStr) return '';
  const parts = String(timeStr).split(':');
  return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}:00`;
}
