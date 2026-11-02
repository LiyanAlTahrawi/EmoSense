import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { ApiError, createApiClient } from '../services/apiClient';
import { createEmoSenseApi } from '../services/emosenseApi';
import { createDemoApi } from '../services/demoApi';
import { describeError } from '../utils/apiErrors';
import { isSupabaseConfigured } from '../utils/env';
import { useScreenInit } from '../useScreenInit.js';
import type { EmoSenseService } from '../types/api';
import type {
  AuthErrorCode,
  AuthMode,
  AuthResult,
  AuthStatus,
  AuthUser,
  Profile,
  ProfileStatus,
  SignUpInput,
  SignUpOutcome } from
'../types/auth';

interface AuthContextValue {
  status: AuthStatus;
  mode: AuthMode | null;
  user: AuthUser | null;
  profile: Profile | null;
  profileStatus: ProfileStatus;
  profileError: string | null;
  api: EmoSenseService | null;
  isConfigured: boolean;
  sessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult<SignUpOutcome>>;
  signOut: (options?: {everywhere?: boolean;}) => Promise<void>;
  resendVerification: (email: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  startDemo: () => void;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_USER: AuthUser = { id: 'demo-user', email: 'preview@emosense.demo' };
const NOT_CONFIGURED = {
  ok: false as const,
  code: 'not_configured' as const,
  message: 'Authentication isn’t configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
};

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [session, setSession] = useState<Session | null>(null);
  const screenInit = useScreenInit() as {demo?: boolean;};
  const [isDemo, setIsDemo] = useState(() => Boolean(screenInit.demo) && !isSupabaseConfigured);
  const [initializing, setInitializing] = useState(Boolean(supabase));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileKey, setProfileKey] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);
  const intentionalSignOut = useRef(false);
  const hadSession = useRef(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      hadSession.current = Boolean(data.session);
      setSession(data.session);
      setInitializing(false);
    });
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        if (hadSession.current && !intentionalSignOut.current) setSessionExpired(true);
        intentionalSignOut.current = false;
      }
      if (next) setSessionExpired(false);
      hadSession.current = Boolean(next);
      setSession(next);
      setInitializing(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = isDemo ? DEMO_USER.id : session?.user.id ?? null;
  const userEmail = isDemo ? DEMO_USER.email : session?.user.email ?? null;
  const user = useMemo<AuthUser | null>(() => userId ? { id: userId, email: userEmail } : null, [userId, userEmail]);

  const getAccessToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const handleUnauthorized = useCallback(() => {
    if (!supabase) return;
    setSessionExpired(true);
    void supabase.auth.signOut({ scope: 'local' });
  }, []);

  const api = useMemo<EmoSenseService | null>(() => {
    if (isDemo) return createDemoApi();
    if (userId) return createEmoSenseApi(createApiClient(getAccessToken, handleUnauthorized));
    return null;
  }, [isDemo, userId, getAccessToken, handleUnauthorized]);

  useEffect(() => {
    if (!api) {
      setProfile(null);
      setProfileStatus('idle');
      setProfileError(null);
      return;
    }
    let cancelled = false;
    setProfileStatus('loading');
    setProfileError(null);
    api.
    getProfile().
    then((p) => {
      if (cancelled) return;
      setProfile(p);
      setProfileStatus('ready');
    }).
    catch((error: unknown) => {
      if (cancelled) return;
      setProfile(null);
      if (error instanceof ApiError && error.code === 'not_found') {
        setProfileStatus('missing');
      } else {
        setProfileStatus('error');
        setProfileError(describeError(error).message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [api, profileKey]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { ok: false, ...mapAuthError(error) };
      return { ok: true, data: null };
    } catch {
      return { ok: false, code: 'network', message: "We couldn't reach the sign-in service. Check your connection." };
    }
  }, []);

  const signUp = useCallback(async (input: SignUpInput): Promise<AuthResult<SignUpOutcome>> => {
    if (!supabase) return NOT_CONFIGURED;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?verified=1`,
          data: {
            first_name: input.firstName.trim(),
            last_name: input.lastName.trim(),
            phone_number: input.phoneNumber?.trim() || null
          }
        }
      });
      if (error) return { ok: false, ...mapAuthError(error) };
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { ok: false, code: 'email_taken', message: 'An account with this email already exists.' };
      }
      if (!data.session) return { ok: true, data: { needsVerification: true, profileStatus: 'unknown' } };
      const token = data.session.access_token;
      const probe = createEmoSenseApi(createApiClient(async () => token, () => undefined));
      try {
        await probe.getProfile();
        return { ok: true, data: { needsVerification: false, profileStatus: 'ready' } };
      } catch {
        return { ok: true, data: { needsVerification: false, profileStatus: 'missing' } };
      }
    } catch {
      return { ok: false, code: 'network', message: "We couldn't reach the sign-up service. Check your connection." };
    }
  }, []);

  const signOut = useCallback(async (options?: {everywhere?: boolean;}) => {
    intentionalSignOut.current = true;
    setSessionExpired(false);
    setProfile(null);
    if (isDemo) {
      setIsDemo(false);
      intentionalSignOut.current = false;
      return;
    }
    if (supabase) await supabase.auth.signOut({ scope: options?.everywhere ? 'global' : 'local' });
  }, [isDemo]);

  const resendVerification = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (error) return { ok: false, ...mapAuthError(error) };
    return { ok: true, data: null };
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) return { ok: false, ...mapAuthError(error) };
      return { ok: true, data: null };
    } catch {
      return { ok: false, code: 'network', message: "We couldn't reach the server. Check your connection." };
    }
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, ...mapAuthError(error) };
    return { ok: true, data: null };
  }, []);

  const startDemo = useCallback(() => {
    if (isSupabaseConfigured) return;
    setIsDemo(true);
  }, []);

  const refreshProfile = useCallback(() => setProfileKey((k) => k + 1), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: initializing ? 'loading' : user ? 'authenticated' : 'unauthenticated',
      mode: isDemo ? 'demo' : user ? 'supabase' : null,
      user,
      profile,
      profileStatus,
      profileError,
      api,
      isConfigured: isSupabaseConfigured,
      sessionExpired,
      signIn,
      signUp,
      signOut,
      resendVerification,
      requestPasswordReset,
      updatePassword,
      startDemo,
      refreshProfile
    }),
    [initializing, user, isDemo, profile, profileStatus, profileError, api, sessionExpired, signIn, signUp, signOut, resendVerification, requestPasswordReset, updatePassword, startDemo, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function mapAuthError(error: AuthError): {code: AuthErrorCode;message: string;} {
  const code = (error as AuthError & {code?: string;}).code ?? '';
  const msg = error.message.toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login')) {
    return { code: 'invalid_credentials', message: "That email and password don't match an account." };
  }
  if (code === 'email_not_confirmed' || msg.includes('not confirmed')) {
    return { code: 'email_not_confirmed', message: 'Please confirm your email address before logging in.' };
  }
  if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) {
    return { code: 'email_taken', message: 'An account with this email already exists.' };
  }
  if (code === 'weak_password' || msg.includes('password should')) {
    return { code: 'weak_password', message: error.message };
  }
  if (code.startsWith('over_') || error.status === 429) {
    return { code: 'rate_limited', message: 'Too many attempts. Please wait a minute and try again.' };
  }
  if (error.name === 'AuthRetryableFetchError' || msg.includes('fetch')) {
    return { code: 'network', message: "We couldn't reach the server. Check your connection." };
  }
  return { code: 'unknown', message: error.message || 'Something went wrong. Please try again.' };
}