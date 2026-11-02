import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, UserRoundCogIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/** Persistent, honest context: preview mode and incomplete-profile states. */
export function AccountBanners() {
  const { mode, profileStatus, profileError, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {mode === 'demo' &&
      <div className="flex items-center gap-3 border-b border-lavender-ink/15 bg-lavender px-4 py-2 text-[13px] text-lavender-ink" role="status">
          <EyeIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">
            <span className="font-semibold">Preview mode</span>
            <span className="hidden sm:inline"> · Sample data only. No real account, API, or model inference is used.</span>
          </p>
          <button
          type="button"
          className="focus-ring shrink-0 rounded font-medium underline-offset-2 hover:underline"
          onClick={async () => {
            await signOut();
            navigate('/');
          }}>
          
            Exit preview
          </button>
        </div>
      }
      {(profileStatus === 'missing' || profileStatus === 'error') &&
      <div className="flex items-center gap-3 border-b border-warning/20 bg-warning-tint px-4 py-2 text-[13px] text-ink" role="status">
          <UserRoundCogIcon className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <p className="min-w-0 flex-1">
            {profileStatus === 'missing' ?
          "Your EmoSense profile hasn't been set up on the server yet, so we can't show your name." :
          `We couldn't load your profile. ${profileError ?? ''}`}
          </p>
          <button type="button" className="focus-ring shrink-0 rounded font-medium text-warning hover:underline" onClick={refreshProfile}>
            Retry
          </button>
        </div>
      }
    </>);

}