import React from 'react';
import { Navigate, NavLink, useParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { settingsSections, type SettingsSectionId } from '../data/settingsSections';
import { TopBar } from '../components/layout/TopBar';
import { AccountSettings } from '../components/settings/AccountSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { PrivacySettings } from '../components/settings/PrivacySettings';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { cn } from '../utils/cn';

const panels: Record<SettingsSectionId, React.ComponentType> = {
  profile: ProfileSettings,
  appearance: AppearanceSettings,
  privacy: PrivacySettings,
  account: AccountSettings
};

export function SettingsPage() {
  const { section } = useParams();
  useDocumentTitle('Settings');
  const active = settingsSections.find((s) => s.id === section);
  if (!active) return <Navigate to="/app/settings/profile" replace />;
  const Panel = panels[active.id];

  return (
    <>
      <TopBar title="Settings" />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-[200px_minmax(0,1fr)] md:gap-12 md:py-12">
          <nav aria-label="Settings sections" className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
            <ul className="flex gap-1 md:flex-col">
              {settingsSections.map(({ id, label, icon: Icon }) =>
              <li key={id} className="shrink-0">
                  <NavLink
                  to={`/app/settings/${id}`}
                  className={({ isActive }) =>
                  cn(
                    'focus-ring flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors duration-150 ease-out',
                    isActive ? 'bg-accent-tint font-medium text-ink' : 'text-muted hover:bg-raised hover:text-ink'
                  )
                  }>
                  
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>
          <div className="min-w-0 pb-12">
            <Panel />
          </div>
        </div>
      </main>
    </>);

}