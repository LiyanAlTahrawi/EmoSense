import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isValidEmail } from '../../utils/validation';
import { Notice } from '../common/Notice';
import { PasswordField } from '../common/PasswordField';
import { Spinner } from '../common/Spinner';
import { TextField } from '../common/TextField';
import type { AuthErrorCode } from '../../types/auth';

export function LoginForm() {
  const { signIn, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{email?: string;password?: string;}>({});
  const [formError, setFormError] = useState<{code: AuthErrorCode;message: string;} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const from = (location.state as {from?: string;} | null)?.from ?? '/app';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: typeof fieldErrors = {};
    if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setSubmitting(true);
    setFormError(null);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.ok) navigate(from, { replace: true });else
    setFormError({ code: result.code, message: result.message });
  };

  const resend = async () => {
    setResendState('sending');
    const result = await resendVerification(email);
    setResendState(result.ok ? 'sent' : 'idle');
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {params.get('verified') && !formError &&
      <Notice tone="success" title="Email confirmed">
          Your email address is verified. Log in to continue.
        </Notice>
      }
      {formError &&
      <Notice
        tone={formError.code === 'email_not_confirmed' ? 'warning' : 'danger'}
        title={formError.code === 'email_not_confirmed' ? 'Confirm your email first' : "Couldn't log you in"}
        action={
        formError.code === 'email_not_confirmed' ?
        <button type="button" className="btn btn-secondary h-9" onClick={resend} disabled={resendState !== 'idle'}>
                {resendState === 'sending' && <Spinner />}
                {resendState === 'sent' ? 'Verification email sent' : 'Resend verification email'}
              </button> :
        undefined
        }>
        
          {formError.message}
        </Notice>
      }
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        placeholder="you@example.com" />
      
      <div>
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password} />
        
        <div className="mt-2 flex justify-end">
          <Link to="/forgot-password" className="focus-ring rounded text-sm font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
        {submitting && <Spinner />}
        {submitting ? 'Logging in…' : 'Log in'}
      </button>
      <p className="text-center text-xs text-muted">You'll stay signed in on this device until you log out.</p>
    </form>);

}