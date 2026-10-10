import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Checks whether Supabase environment variables have been supplied and are not placeholders.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-project') || supabaseUrl === 'https://your-project.supabase.co') return false;
  if (supabaseAnonKey.includes('your-anon-or-publishable-key')) return false;
  try {
    const url = new URL(supabaseUrl);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Creates the official Supabase client with safe browser settings.
 */
function initializeSupabaseClient(): SupabaseClient<Database> {
  if (isSupabaseConfigured()) {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ryvolt-auth-token',
      },
    });
  }

  // Graceful fallback dummy client to prevent runtime crash before configuration
  return createClient<Database>(
    'https://unconfigured-ryvolt-instance.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export const supabase = initializeSupabaseClient();
export const supabaseConfigDetails = {
  url: supabaseUrl,
  isConfigured: isSupabaseConfigured(),
};

/**
 * Checks whether an error is a PostgREST schema-cache or missing table error (PGRST205 / 42P01).
 * Used by services to gracefully switch to local resilient storage.
 */
export function isSchemaCacheError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();
  return (
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    code === '42P01' ||
    code === '42703' ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist') ||
    details.includes('does not exist')
  );
}
