import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { authTrustPoints } from '../../data/landing';

interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-[100dvh] w-full bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <main className="flex flex-col px-6 py-5 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="focus-ring rounded-lg" aria-label="EmoSense home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">
            <h1 className="text-[28px] font-semibold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-muted">{footer}</div>}
          </div>
        </div>
      </main>
      <aside className="hidden flex-col justify-between border-l border-line bg-accent-tint/60 p-12 lg:flex">
        <p className="text-sm font-medium text-accent">EmoSense</p>
        <div>
          <blockquote className="max-w-md text-[34px] font-semibold leading-[1.15] tracking-tight text-ink">
            Your emotions matter. Your voice deserves to be heard.
          </blockquote>
          <ul className="mt-12 space-y-6">
            {authTrustPoints.map((point) =>
            <li key={point.title} className="max-w-sm border-l-2 border-accent/40 pl-4">
                <p className="text-sm font-semibold text-ink">{point.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{point.body}</p>
              </li>
            )}
          </ul>
        </div>
        <p className="text-xs text-muted">If you're in crisis or danger, contact your local emergency services.</p>
      </aside>
    </div>);

}