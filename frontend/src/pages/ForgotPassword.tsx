import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheckIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { isValidEmail } from '../utils/validation';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Notice } from '../components/common/Notice';
import { Spinner } from '../components/common/Spinner';
import { TextField } from '../components/common/TextField';

export function ForgotPasswordPage() {
  useDocumentTitle('Reset your password');
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidEmail(email)) return setFieldError('Enter a valid email address.');
    setFieldError(undefined);
    setError(null);
    setState('sending');
    const result = await requestPasswordReset(email);
    if (result.ok) setState('sent');else
    {
      setState('idle');
      setError(result.message);
    }
  };

  return (
    <AuthLayout
      title={state === 'sent' ? 'Check your inbox' : 'Forgot your password?'}
      subtitle={state === 'sent' ? undefined : "Enter your account email and we'll send you a secure link to choose a new password."}
      footer={<Link to="/login" className="font-medium text-accent hover:underline">Back to log in</Link>}>
      
      {state === 'sent' ?
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft" role="status">
          <MailCheckIcon className="h-6 w-6 text-accent" aria-hidden="true" />
          <p className="mt-3 text-[15px] leading-relaxed text-ink">
            If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way. It may take a minute to arrive.
          </p>
          <button type="button" className="btn btn-ghost mt-4 px-0 hover:bg-transparent" onClick={() => setState('idle')}>
            Use a different email
          </button>
        </div> :

      <form onSubmit={submit} noValidate className="space-y-5">
          {error && <Notice tone="danger" title="We couldn't send the link">{error}</Notice>}
          <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldError} placeholder="you@example.com" />
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={state === 'sending'}>
            {state === 'sending' && <Spinner />}
            {state === 'sending' ? 'Sending link…' : 'Send reset link'}
          </button>
        </form>
      }
    </AuthLayout>);

}