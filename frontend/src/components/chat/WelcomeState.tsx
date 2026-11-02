import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from '../common/Logo';
import { conversationStarters } from '../../data/conversationStarters';

interface WelcomeStateProps {
  firstName: string | null;
  loadingName: boolean;
  onPick: (text: string) => void;
}

export function WelcomeState({ firstName, loadingName, onPick }: WelcomeStateProps) {
  const reduce = useReducedMotion();
  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-5 py-12 sm:px-8">
      <LogoMark className="h-11 w-11" />
      <h2 className="mt-6 text-[30px] font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
        {loadingName ?
        <span className="inline-block h-9 w-72 max-w-full animate-pulse rounded-lg bg-raised align-middle" aria-label="Loading your name" /> :
        firstName ?
        `Welcome back, ${firstName}.` :

        'Welcome to EmoSense.'
        }
      </h2>
      <p className="mt-2 text-lg text-muted">What's on your mind today?</p>

      <div className="mt-10">
        <p className="mb-3 text-sm text-muted">If it helps, start with one of these</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {conversationStarters.map((starter, i) =>
          <motion.button
            key={starter}
            type="button"
            onClick={() => onPick(starter)}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.04 * i, ease: [0.23, 1, 0.32, 1] }}
            className="focus-ring rounded-xl border border-line bg-surface px-4 py-3.5 text-left text-[15px] text-ink transition-colors duration-150 ease-out hover:border-accent/50 hover:bg-accent-tint/60">
            
              {starter}
            </motion.button>
          )}
        </div>
      </div>
      <p className="mt-8 text-xs leading-relaxed text-muted">
        Speak or type. Emotion analysis only happens after you choose to share something.
      </p>
    </div>);

}