import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../utils/env';

/**
 * Supabase is used for authentication only, with the public URL + anon/publishable key.
 * Application data is read and written exclusively through the FastAPI backend.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured ?
createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) :
null;