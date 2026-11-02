
/// <reference types="vite/client" />

type EnvRecord = Record<string, string | undefined>;

// Read Vite environment variables directly.
// Vite recognizes the exact import.meta.env expression.
const raw = import.meta.env as unknown as EnvRecord;

export const env = {
  apiBaseUrl: (
    raw.VITE_EMOSENSE_API_URL ?? ''
  ).trim().replace(/\/+$/, ''),

  supabaseUrl: (
    raw.VITE_SUPABASE_URL ?? ''
  ).trim(),

  supabaseAnonKey: (
    raw.VITE_SUPABASE_ANON_KEY ??
    raw.VITE_SUPABASE_PUBLISHABLE_KEY ??
    ''
  ).trim(),

  contactEmail: (
    raw.VITE_EMOSENSE_CONTACT_EMAIL ??
    'team@emosense.app'
  ).trim()
};

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey
);

export const isApiConfigured = Boolean(
  env.apiBaseUrl
);