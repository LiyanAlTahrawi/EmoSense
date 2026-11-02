import React from 'react';
import { Link } from 'react-router-dom';
import { MenuIcon } from 'lucide-react';
import { useShell } from '../../hooks/useShell';
import { LogoMark } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { UserMenu } from './UserMenu';

interface TopBarProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { openNav } = useShell();
  return (
    <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-line bg-canvas px-2 sm:px-4">
      <button type="button" className="icon-btn lg:hidden" onClick={openNav} aria-label="Open navigation">
        <MenuIcon className="h-5 w-5" />
      </button>
      <Link to="/app" className="focus-ring rounded-full lg:hidden" aria-label="EmoSense — new conversation">
        <LogoMark className="h-7 w-7" />
      </Link>
      <div className="min-w-0 flex-1 px-1.5">
        <h1 className="truncate text-[15px] font-semibold text-ink">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1">
        {actions}
        <ThemeToggle />
        <div className="ml-1">
          <UserMenu />
        </div>
      </div>
    </header>);

}