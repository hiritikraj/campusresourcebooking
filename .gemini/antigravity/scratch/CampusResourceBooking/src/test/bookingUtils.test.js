import { describe, it, expect } from 'vitest';
import {
  hasTimeOverlap,
  findBookingConflict,
  validateBookingInput,
  calculateUtilizationPercentage,
  timeToMinutes,
  formatTimeDisplay,
  formatShortId,
  getTodayDateString,
} from '../utils/bookingUtils';

// ──────────────────────────────────────────────────────────────────────────────
// Overlap detection
// ──────────────────────────────────────────────────────────────────────────────
describe('hasTimeOverlap', () => {
  it('detects a full overlap', () => {
    expect(hasTimeOverlap('09:00', '11:00', '08:00', '12:00')).toBe(true);
  });

  it('detects a partial overlap — new booking starts inside existing', () => {
    expect(hasTimeOverlap('10:00', '12:00', '09:00', '11:00')).toBe(true);
  });

  it('detects a partial overlap — new booking ends inside existing', () => {
    expect(hasTimeOverlap('08:00', '10:00', '09:00', '11:00')).toBe(true);
  });

  it('allows adjacent bookings (new starts exactly when existing ends)', () => {
    // LAB101: 09:00–11:00 already booked. New booking 11:00–12:00 must NOT conflict.
    expect(hasTimeOverlap('11:00', '12:00', '09:00', '11:00')).toBe(false);
  });

  it('allows adjacent bookings (new ends exactly when existing starts)', () => {
    // LAB101: 11:00–13:00 already booked. New booking 09:00–11:00 must NOT conflict.
    expect(hasTimeOverlap('09:00', '11:00', '11:00', '13:00')).toBe(false);
  });

  it('no overlap — booking is completely before', () => {
    expect(hasTimeOverlap('08:00', '09:00', '10:00', '12:00')).toBe(false);
  });

  it('no overlap — booking is completely after', () => {
    expect(hasTimeOverlap('13:00', '15:00', '09:00', '11:00')).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Conflict detection (cancelled bookings must not block)
// ──────────────────────────────────────────────────────────────────────────────
describe('findBookingConflict', () => {
  const existingBookings = [
    { id: '1', start_time: '09:00', end_time: '11:00', status: 'confirmed' },
    { id: '2', start_time: '14:00', end_time: '16:00', status: 'cancelled' },
  ];

  it('finds a conflict with a confirmed booking', () => {
    const conflict = findBookingConflict('10:00', '12:00', existingBookings);
    expect(conflict).not.toBeNull();
    expect(conflict?.id).toBe('1');
  });

  it('does NOT find a conflict with a cancelled booking', () => {
    // Slot 14:00–16:00 is cancelled — should be freely bookable
    const conflict = findBookingConflict('14:00', '16:00', existingBookings);
    expect(conflict).toBeNull();
  });

  it('allows an adjacent booking after a confirmed booking', () => {
    const conflict = findBookingConflict('11:00', '12:00', existingBookings);
    expect(conflict).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Booking form validation
// ──────────────────────────────────────────────────────────────────────────────
describe('validateBookingInput', () => {
  const today = getTodayDateString();
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const validInput = {
    resourceId: 'abc-123',
    bookingDate: tomorrow,
    startTime: '09:00',
    endTime: '11:00',
    purpose: 'Java Lab session',
    today,
  };

  it('passes valid input', () => {
    expect(validateBookingInput(validInput).valid).toBe(true);
  });

  it('fails when resourceId is missing', () => {
    const result = validateBookingInput({ ...validInput, resourceId: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/resource/i);
  });

  it('fails for a past date', () => {
    const result = validateBookingInput({ ...validInput, bookingDate: '2020-01-01', today });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/past/i);
  });

  it('fails when end time is before start time', () => {
    const result = validateBookingInput({ ...validInput, startTime: '11:00', endTime: '09:00' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/end time/i);
  });

  it('fails when end time equals start time', () => {
    const result = validateBookingInput({ ...validInput, startTime: '09:00', endTime: '09:00' });
    expect(result.valid).toBe(false);
  });

  it('fails when purpose is too short', () => {
    const result = validateBookingInput({ ...validInput, purpose: 'ab' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/purpose/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Utilization calculation
// ──────────────────────────────────────────────────────────────────────────────
describe('calculateUtilizationPercentage', () => {
  it('calculates 50% utilization correctly', () => {
    expect(calculateUtilizationPercentage(5, 10)).toBe(50);
  });

  it('returns 0 when no hours are booked', () => {
    expect(calculateUtilizationPercentage(0, 10)).toBe(0);
  });

  it('returns 100 when fully booked', () => {
    expect(calculateUtilizationPercentage(10, 10)).toBe(100);
  });

  it('returns 0 when available hours is 0 (division guard)', () => {
    expect(calculateUtilizationPercentage(5, 0)).toBe(0);
  });

  it('rounds to 1 decimal place', () => {
    expect(calculateUtilizationPercentage(1, 3)).toBe(33.3);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ──────────────────────────────────────────────────────────────────────────────
describe('timeToMinutes', () => {
  it('converts 09:00 to 540', () => expect(timeToMinutes('09:00')).toBe(540));
  it('converts 18:00 to 1080', () => expect(timeToMinutes('18:00')).toBe(1080));
  it('converts 09:30 to 570', () => expect(timeToMinutes('09:30')).toBe(570));
  it('returns NaN for invalid input', () => expect(Number.isNaN(timeToMinutes(null))).toBe(true));
});

describe('formatTimeDisplay', () => {
  it('formats 09:00 as 9:00 AM', () => expect(formatTimeDisplay('09:00')).toBe('9:00 AM'));
  it('formats 13:00 as 1:00 PM', () => expect(formatTimeDisplay('13:00')).toBe('1:00 PM'));
  it('formats 00:00 as 12:00 AM', () => expect(formatTimeDisplay('00:00')).toBe('12:00 AM'));
  it('formats 12:00 as 12:00 PM', () => expect(formatTimeDisplay('12:00')).toBe('12:00 PM'));
});

describe('formatShortId', () => {
  it('formats a UUID into a BK- prefixed short ID', () => {
    expect(formatShortId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe('BK-A1B2C3D4');
  });
  it('returns — for null', () => expect(formatShortId(null)).toBe('—'));
});
