export type AuthMode = 'supabase' | 'demo';
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error';

export interface AuthUser {
  id: string;
  email: string | null;
}

/** Mirrors the `profiles` table (user_id, first_name, last_name, phone_number). */
export interface Profile {
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export type AuthErrorCode =
'invalid_credentials' |
'email_not_confirmed' |
'email_taken' |
'weak_password' |
'rate_limited' |
'not_configured' |
'network' |
'unknown';

export type AuthResult<T = null> =
{ok: true;data: T;} |
{ok: false;code: AuthErrorCode;message: string;};

export interface SignUpOutcome {
  /** True when Supabase requires email confirmation before a session exists. */
  needsVerification: boolean;
  /** Whether the linked `profiles` row could be confirmed via GET /auth/me/profile. */
  profileStatus: 'ready' | 'missing' | 'unknown';
}