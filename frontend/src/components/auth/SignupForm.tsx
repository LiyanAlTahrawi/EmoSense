import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailCheckIcon, UserRoundCogIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isPasswordAcceptable, isValidEmail, isValidPhone } from '../../utils/validation';
import { Notice } from '../common/Notice';
import { PasswordField } from '../common/PasswordField';
import { Spinner } from '../common/Spinner';
import { TextField } from '../common/TextField';
import { PasswordStrength } from './PasswordStrength';

type Field = 'firstName' | 'lastName' | 'email' | 'password' | 'confirm' | 'phone' | 'terms';
type Outcome = {kind: 'verify';} | {kind: 'profile_missing';} | null;

export function SignupForm() {
  const { signUp, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '', phone: '' });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [resent, setResent] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (!values.firstName.trim()) next.firstName = 'Enter your first name.';
    if (!values.lastName.trim()) next.lastName = 'Enter your last name.';
    if (!isValidEmail(values.email)) next.email = 'Enter a valid email address.';
    if (!isPasswordAcceptable(values.password)) next.password = 'Use at least 8 characters with a mix of letters, numbers, or symbols.';
    if (values.confirm !== values.password) next.confirm = "Passwords don't match.";
    if (!values.confirm) next.confirm = 'Confirm your password.';
    if (!isValidPhone(values.phone)) next.phone = 'Enter a valid phone number, or leave it blank.';
    if (!terms) next.terms = 'Please accept the Terms and Privacy notice to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setFormError(null);
    const result = await signUp({ firstName: values.firstName, lastName: values.lastName, email: values.email, password: values.password, phoneNumber: values.phone });
    setSubmitting(false);
    if (!result.ok) {
      if (result.code === 'email_taken') setErrors((e) => ({ ...e, email: result.message }));else
      if (result.code === 'weak_password') setErrors((e) => ({ ...e, password: result.message }));else
      setFormError(result.message);
      return;
    }
    if (result.data.needsVerification) setOutcome({ kind: 'verify' });else
    if (result.data.profileStatus === 'missing') setOutcome({ kind: 'profile_missing' });else
    navigate('/app', { replace: true });
  };

  if (outcome?.kind === 'verify') {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-soft" role="status">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-tint text-accent">
          <MailCheckIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink">Check your inbox</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We sent a confirmation link to <span className="font-medium text-ink">{values.email}</span>. Your account becomes active once you confirm it.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/login" className="btn btn-primary w-full">Go to log in</Link>
          <button
            type="button"
            className="btn btn-ghost w-full"
            disabled={resent}
            onClick={async () => {
              const r = await resendVerification(values.email);
              if (r.ok) setResent(true);
            }}>
            
            {resent ? 'Confirmation email sent again' : 'Resend confirmation email'}
          </button>
        </div>
      </div>);

  }

  if (outcome?.kind === 'profile_missing') {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft" role="status">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-tint text-warning">
          <UserRoundCogIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink">Your account is created, but setup isn't finished</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You can sign in, but we couldn't confirm your EmoSense profile (name and phone number). Until it's created on the server, parts of the app may not show your details.
        </p>
        <Notice tone="integration" title="Profile creation pending" className="mt-4" contract="profiles row for auth user (trigger or POST /auth/me/profile)" />
        <button type="button" className="btn btn-primary mt-6 w-full" onClick={() => navigate('/app', { replace: true })}>
          Continue to EmoSense
        </button>
      </div>);

  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && <Notice tone="danger" title="We couldn't create your account">{formError}</Notice>}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="First name" autoComplete="given-name" value={values.firstName} onChange={set('firstName')} error={errors.firstName} />
        <TextField label="Last name" autoComplete="family-name" value={values.lastName} onChange={set('lastName')} error={errors.lastName} />
      </div>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={set('email')}
        error={errors.email}
        placeholder="you@example.com"
        hint={errors.email?.includes('already') ? undefined : 'We’ll send a confirmation link if required.'} />
      
      {errors.email?.includes('already') &&
      <p className="-mt-3 text-[13px] text-muted">
          <Link to="/login" className="font-medium text-accent hover:underline">Log in</Link> or{' '}
          <Link to="/forgot-password" className="font-medium text-accent hover:underline">reset your password</Link>.
        </p>
      }
      <TextField label="Phone number" optional type="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} error={errors.phone} placeholder="+1 555 010 0100" />
      <div>
        <PasswordField label="Password" autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} />
        <PasswordStrength password={values.password} />
      </div>
      <PasswordField label="Confirm password" autoComplete="new-password" value={values.confirm} onChange={set('confirm')} error={errors.confirm} />
      <div>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="focus-ring mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-line accent-[rgb(var(--accent))]"
            aria-invalid={Boolean(errors.terms)} />
          
          <span>
            I agree to the <Link to="/#responsible" className="font-medium text-accent hover:underline">Terms</Link> and{' '}
            <Link to="/#privacy" className="font-medium text-accent hover:underline">Privacy notice</Link>, and understand EmoSense is not a substitute for professional care.
          </span>
        </label>
        {errors.terms && <p className="mt-1.5 text-[13px] text-danger">{errors.terms}</p>}
      </div>
      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
        {submitting && <Spinner />}
        {submitting ? 'Creating your account…' : 'Create account'}
      </button>
    </form>);

}