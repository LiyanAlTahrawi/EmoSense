
import { useEffect, useState, type FormEvent } from 'react';
import { CloudOffIcon, UserRoundCogIcon } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { EmptyState } from '../common/EmptyState';

export function ProfileSettings() {
  const {
    api,
    profile,
    profileStatus,
    profileError,
    user,
    refreshProfile
  } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profileStatus === 'ready' && profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhoneNumber(profile.phoneNumber ?? '');
    }
  }, [profile, profileStatus]);

  const hasChanges = Boolean(
    profile &&
    (
      firstName.trim() !== profile.firstName ||
      lastName.trim() !== profile.lastName ||
      (phoneNumber.trim() || null) !== profile.phoneNumber
    )
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!api || !profile || saving || !hasChanges) return;

    setSaveError(null);
    setSaveSuccess(false);

    if (!firstName.trim() || !lastName.trim()) {
      setSaveError('First name and last name are required.');
      return;
    }

    setSaving(true);

    try {
      await api.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || null
      });

      await refreshProfile();
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to save your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'mt-2 block w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-colors focus:border-accent disabled:opacity-60';

  return (
    <section aria-labelledby="profile-heading">
      <h2
        id="profile-heading"
        className="text-xl font-semibold tracking-tight text-ink"
      >
        Profile
      </h2>

      <p className="mt-1 text-sm text-muted">
        The details linked to your EmoSense account.
      </p>

      <div className="mt-8">
        {profileStatus === 'loading' && (
          <div
            className="grid gap-5 sm:grid-cols-2"
            role="status"
            aria-label="Loading profile"
          >
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-raised" />
                <div className="h-11 animate-pulse rounded-xl bg-raised" />
              </div>
            ))}
          </div>
        )}

        {profileStatus === 'missing' && (
          <EmptyState
            icon={UserRoundCogIcon}
            title="Your profile hasn't been created yet"
            description="Your account exists, but there's no matching profile on the server."
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={refreshProfile}
              >
                Check again
              </button>
            }
          />
        )}

        {profileStatus === 'error' && (
          <EmptyState
            icon={CloudOffIcon}
            tone="danger"
            title="We couldn't load your profile"
            description={profileError ?? 'Please try again.'}
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={refreshProfile}
              >
                Try again
              </button>
            }
          />
        )}

        {profileStatus === 'ready' && profile && (
          <form onSubmit={handleSave}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink">
                First name
                <input
                  type="text"
                  className={inputClass}
                  value={firstName}
                  maxLength={100}
                  required
                  disabled={saving}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setSaveSuccess(false);
                  }}
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Last name
                <input
                  type="text"
                  className={inputClass}
                  value={lastName}
                  maxLength={100}
                  required
                  disabled={saving}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setSaveSuccess(false);
                  }}
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Email
                <input
                  type="email"
                  className={inputClass}
                  value={user?.email ?? ''}
                  readOnly
                />
                <span className="mt-1 block text-xs font-normal text-muted">
                  Managed by your sign-in account.
                </span>
              </label>

              <label className="block text-sm font-medium text-ink">
                Phone number
                <span className="ml-1 font-normal text-muted">
                  (optional)
                </span>
                <input
                  type="tel"
                  className={inputClass}
                  value={phoneNumber}
                  maxLength={30}
                  placeholder="Not provided"
                  disabled={saving}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setSaveSuccess(false);
                  }}
                />
              </label>
            </div>

            {saveError && (
              <p
                role="alert"
                className="mt-5 text-sm text-danger"
              >
                {saveError}
              </p>
            )}

            {saveSuccess && (
              <p
                role="status"
                className="mt-5 text-sm text-accent"
              >
                Profile updated successfully.
              </p>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !hasChanges}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
