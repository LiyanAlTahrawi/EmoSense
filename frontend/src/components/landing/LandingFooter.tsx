import React from 'react';
import { Logo } from '../common/Logo';
import { env } from '../../utils/env';

export function LandingFooter() {
  const links = [
  { href: '#how', label: 'About' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#responsible', label: 'Terms' },
  { href: `mailto:${env.contactEmail}`, label: 'Contact' }];

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-muted">An emotion-aware AI companion.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((l) =>
            <li key={l.label}>
                <a href={l.href} className="focus-ring rounded text-sm text-muted transition-colors duration-150 ease-out hover:text-ink">{l.label}</a>
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-8 text-xs text-muted sm:px-8">© {new Date().getFullYear()} EmoSense. Not a medical device or a substitute for professional care.</div>
    </footer>);

}