import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';

const links = [
{ href: '#how', label: 'How it works' },
{ href: '#privacy', label: 'Privacy' },
{ href: '#responsible', label: 'Responsible use' }];


export function LandingHeader() {
  const { status } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link to="/" className="focus-ring rounded-lg" aria-label="EmoSense home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((l) =>
          <a key={l.href} href={l.href} className="focus-ring rounded-lg px-3 py-2 text-sm text-muted transition-colors duration-150 ease-out hover:text-ink">
              {l.label}
            </a>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {status === 'authenticated' ?
          <Link to="/app" className="btn btn-primary">Open EmoSense</Link> :

          <>
              <Link to="/login" className="btn btn-ghost hidden sm:inline-flex">Log in</Link>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
            </>
          }
        </div>
      </div>
    </header>);

}