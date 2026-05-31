import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => !!url && !!key;

export const supabase = isSupabaseConfigured()
  ? createClient(url!, key!)
  : null;

export async function syncTasksToCloud(tasks: unknown[]) {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.from('tasks').upsert(tasks, { onConflict: 'id' });
  return { error: error?.message };
}

export async function syncEquipmentToCloud(equipment: unknown[]) {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.from('equipment').upsert(equipment, { onConflict: 'id' });
  return { error: error?.message };
}

export async function syncIssuesToCloud(issues: unknown[]) {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.from('issues').upsert(issues, { onConflict: 'id' });
  return { error: error?.message };
}

export async function syncChecklistsToCloud(checklists: unknown[]) {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.from('checklists').upsert(checklists, { onConflict: 'id' });
  return { error: error?.message };
}

export async function downloadFromCloud(table: string) {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  const { data, error } = await supabase.from(table).select('*');
  return { data, error: error?.message };
}

export function subscribeToTasks(callback: (payload: unknown) => void) {
  if (!supabase) return null;
  return supabase
    .channel('tasks-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
    .subscribe();
}
