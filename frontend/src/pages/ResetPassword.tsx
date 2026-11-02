import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { isPasswordAcceptable } from '../utils/validation';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { FullScreenLoader } from '../components/common/FullScreenLoader';
import { Notice } from '../components/common/Notice';
import { PasswordField } from '../components/common/PasswordField';
import { Spinner } from '../components/common/Spinner';

export function ResetPasswordPage() {
  useDocumentTitle('Choose a new password');
  const { status, mode, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{password?: string;confirm?: string;}>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (status === 'loading') return <FullScreenLoader label="Verifying your reset link…" />;

  if (status !== 'authenticated' || mode !== 'supabase') {
    return (
      <AuthLayout title="This link isn't valid anymore" subtitle="Password reset links expire after a short time and can only be used once.">
        <Link to="/forgot-password" className="btn btn-primary btn-lg w-full">Request a new link</Link>
        <Link to="/login" className="btn btn-ghost mt-2 w-full">Back to log in</Link>
      </AuthLayout>);

  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!isPasswordAcceptable(password)) next.password = 'Use at least 8 characters with a mix of letters, numbers, or symbols.';
    if (confirm !== password) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setFormError(null);
    const result = await updatePassword(password);
    setSaving(false);
    if (!result.ok) return setFormError(result.message);
    toast.success('Your password has been updated.');
    navigate('/app', { replace: true });
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Pick something strong that you don't use elsewhere.">
      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && <Notice tone="danger" title="Password not updated">{formError}</Notice>}
        <div>
          <PasswordField label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          <PasswordStrength password={password} />
        </div>
        <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={saving}>
          {saving && <Spinner />}
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>);

}