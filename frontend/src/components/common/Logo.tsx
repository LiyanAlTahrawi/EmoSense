import React from 'react';
import { cn } from '../../utils/cn';

interface LogoMarkProps {
  className?: string;
}

/** Concentric ripple with a flowing emotional wave through its center. */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={cn('h-8 w-8 shrink-0', className)}>
      <circle cx="20" cy="20" r="19" className="fill-accent-tint" />
      <circle cx="20" cy="20" r="13.5" className="stroke-accent/30" strokeWidth="1.5" />
      <path
        d="M7.5 20.5c2.4 0 2.6-5.5 5.2-5.5s2.8 11 5.6 11 2.9-14 5.8-14 2.7 8.5 5.3 8.5c1.4 0 2-1 3.1-1"
        className="stroke-accent"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round" />
      
    </svg>);

}

interface LogoProps {
  className?: string;
  markClassName?: string;
}

export function Logo({ className, markClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      <span className="text-[17px] font-semibold tracking-tight text-ink">
        Emo<span className="text-accent">Sense</span>
      </span>
    </span>);

}