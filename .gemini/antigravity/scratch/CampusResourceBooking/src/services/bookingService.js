import { ensureSupabaseConfigured, supabase } from './supabaseClient';
import { normalizeSqlTime } from '../utils/bookingUtils';

export async function fetchMyBookings(userId) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      user_id,
      resource_id,
      booking_date,
      start_time,
      end_time,
      purpose,
      status,
      created_at,
      resources (
        id,
        resource_name,
        resource_type,
        room_number,
        capacity,
        is_active
      )
    `
    )
    .eq('user_id', userId)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchBookedSlotsForDate(resourceId, bookingDate) {
  if (!supabase || !resourceId || !bookingDate) return [];

  const { data, error } = await supabase.rpc('get_resource_booked_slots', {
    p_resource_id: resourceId,
    p_booking_date: bookingDate,
  });

  if (error) throw error;
  return data || [];
}

export async function createBookingRpc({
  resourceId,
  bookingDate,
  startTime,
  endTime,
  purpose,
}) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase.rpc('create_booking', {
    p_resource_id: resourceId,
    p_booking_date: bookingDate,
    p_start_time: normalizeSqlTime(startTime),
    p_end_time: normalizeSqlTime(endTime),
    p_purpose: purpose.trim(),
  });

  if (error) throw error;
  return data;
}

export async function cancelBookingRpc(bookingId) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId,
  });

  if (error) throw error;
  return data;
}
