import { ensureSupabaseConfigured, supabase } from './supabaseClient';

export async function fetchAllProfiles() {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchAllBookings() {
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
      profiles (
        id,
        full_name,
        email,
        role
      ),
      resources (
        id,
        resource_name,
        resource_type,
        room_number,
        capacity
      )
    `
    )
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchResourceUtilization(startDate, endDate) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.rpc('get_resource_utilization', {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  return data || [];
}
