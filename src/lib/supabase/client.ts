import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey !== 'your-anon-key-here' &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface DatabaseStatus {
  isConfigured: boolean;
  url: string | null;
  statusText: string;
}

export const getDatabaseStatus = (): DatabaseStatus => {
  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    url: configured ? supabaseUrl : null,
    statusText: configured
      ? 'Connected (Live Supabase Database)'
      : 'Database not connected',
  };
};
