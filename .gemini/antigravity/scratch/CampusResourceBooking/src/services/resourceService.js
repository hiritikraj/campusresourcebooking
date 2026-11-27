import { ensureSupabaseConfigured, isSupabaseConfigured, supabase } from './supabaseClient';

export async function fetchResources({ includeInactive = true } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  let query = supabase
    .from('resources')
    .select('*')
    .order('room_number', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createResource(payload) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from('resources')
    .insert([
      {
        resource_name: payload.resource_name.trim(),
        resource_type: payload.resource_type,
        room_number: payload.room_number.trim().toUpperCase(),
        capacity: Number(payload.capacity),
        description: (payload.description || '').trim(),
        is_active: payload.is_active ?? true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateResource(id, payload) {
  ensureSupabaseConfigured();
  const updates = {
    resource_name: payload.resource_name.trim(),
    resource_type: payload.resource_type,
    room_number: payload.room_number.trim().toUpperCase(),
    capacity: Number(payload.capacity),
    description: (payload.description || '').trim(),
    is_active: Boolean(payload.is_active),
  };

  const { data, error } = await supabase
    .from('resources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleResourceStatus(id, isActive) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from('resources')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResource(id) {
  ensureSupabaseConfigured();
  const { error } = await supabase.from('resources').delete().eq('id', id);
  if (error) throw error;
  return true;
}
