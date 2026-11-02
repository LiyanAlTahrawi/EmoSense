import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../common/Spinner';

export function AccountSettings() {
  const { user, mode, api, requestPasswordReset, signOut } = useAuth();
  const navigate = useNavigate();
  const [resetState, setResetState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resetError, setResetError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState<'local' | 'global' | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sendReset = async () => {
    if (!user?.email) return;
    setResetState('sending');
    setResetError(null);
    const result = await requestPasswordReset(user.email);
    if (result.ok) {
      setResetState('sent');
      toast.success('Password reset email sent.');
    } else {
      setResetState('idle');
      setResetError(result.message);
    }
  };

  const logout = async (everywhere: boolean) => {
    setSigningOut(everywhere ? 'global' : 'local');
    await signOut({ everywhere });
    toast.success('Signed out. Your conversations remain saved to your account.');
    navigate('/', { replace: true });
  };

  
  const handleDeleteAccount = async () => {
    if (!api || deleteConfirmation !== 'DELETE' || deletingAccount) {
      return;
    }

    setDeletingAccount(true);
    setDeleteError(null);

    try {
      await api.deleteAccount();

      toast.success('Your account has been deleted.');

      await signOut({ everywhere: false }).catch(() => {
        // The Auth account has already been deleted.
      });

      navigate('/', { replace: true });
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Unable to delete your account.'
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const rowClass = 'flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between';

  return (
    <section aria-labelledby="account-heading">
      <h2 id="account-heading" className="text-xl font-semibold tracking-tight text-ink">Account</h2>
      <p className="mt-1 text-sm text-muted">Signed in as <span className="font-medium text-ink">{user?.email}</span></p>

      <div className="mt-8 divide-y divide-line border-y border-line">
        <div className={rowClass}>
          <div>
            <p className="text-sm font-medium text-ink">Password</p>
            <p className="mt-1 text-sm text-muted">We'll email you a secure link to choose a new password.</p>
            {resetError && <p className="mt-2 text-[13px] text-danger" role="alert">{resetError}</p>}
          </div>
          <button type="button" className="btn btn-secondary shrink-0" onClick={sendReset} disabled={resetState !== 'idle'}>
            {resetState === 'sending' && <Spinner />}
            {resetState === 'sent' ? 'Email sent' : 'Send reset link'}
          </button>
        </div>
        <div className={rowClass}>
          <div>
            <p className="text-sm font-medium text-ink">Sessions</p>
            <p className="mt-1 text-sm text-muted">Logging out never deletes your saved conversations.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {mode === 'supabase' &&
            <button type="button" className="btn btn-ghost" onClick={() => logout(true)} disabled={Boolean(signingOut)}>
                {signingOut === 'global' && <Spinner />} Log out everywhere
              </button>
            }
            <button type="button" className="btn btn-secondary" onClick={() => logout(false)} disabled={Boolean(signingOut)}>
              {signingOut === 'local' && <Spinner />} {mode === 'demo' ? 'Exit preview' : 'Log out'}
            </button>
          </div>
        </div>
      </div>


<div className="mt-10">
  <h3 className="text-base font-semibold text-ink">
    Delete account
  </h3>

  <p className="mt-2 text-sm text-muted">
    Permanently delete your account, conversations,
    messages, and saved emotion analyses.
    This action cannot be undone.
  </p>

  {mode === 'supabase' && (
    <button
      type="button"
      className="btn btn-secondary mt-5 text-danger"
      onClick={() => {
        setShowDeleteConfirmation(true);
        setDeleteConfirmation('');
        setDeleteError(null);
      }}
    >
      Delete account
    </button>
  )}

  {showDeleteConfirmation && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="mt-5 rounded-2xl border border-danger/30 bg-surface p-5"
    >
      <h4
        id="delete-account-title"
        className="font-semibold text-ink"
      >
        Permanently delete your account?
      </h4>

      <p className="mt-2 text-sm text-muted">
        All your conversations and emotion analyses will be
        permanently removed. This cannot be undone.
      </p>

      <label className="mt-4 block text-sm font-medium text-ink">
        Type DELETE to confirm
        <input
          type="text"
          autoComplete="off"
          value={deleteConfirmation}
          disabled={deletingAccount}
          onChange={(event) =>
            setDeleteConfirmation(event.target.value)
          }
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink"
          placeholder="DELETE"
        />
      </label>

      {deleteError && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {deleteError}
        </p>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={deletingAccount}
          onClick={() => setShowDeleteConfirmation(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="btn btn-primary"
          disabled={
            deletingAccount ||
            deleteConfirmation !== 'DELETE' ||
            !api
          }
          onClick={handleDeleteAccount}
        >
          {deletingAccount
            ? 'Deleting account...'
            : 'Permanently delete account'}
        </button>
      </div>
    </div>
  )}
</div>

    </section>);

}