import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ConversationsProvider } from '../../contexts/ConversationsContext';
import { AccountBanners } from './AccountBanners';
import { Sidebar } from './Sidebar';
import type { ShellContext } from '../../hooks/useShell';

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setNavOpen(false), [location.pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const openNav = useCallback(() => setNavOpen(true), []);
  const context = useMemo<ShellContext>(() => ({ openNav }), [openNav]);

  return (
    <ConversationsProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-canvas">
        <aside className="hidden w-[280px] shrink-0 border-r border-line bg-surface/70 lg:flex lg:flex-col">
          <Sidebar />
        </aside>

        <AnimatePresence>
          {navOpen &&
          <div className="fixed inset-0 z-40 lg:hidden">
              <motion.div
              className="absolute inset-0 bg-black/40 dark:bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => setNavOpen(false)}
              aria-hidden="true" />
            
              <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col bg-surface shadow-lift"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}>
              
                <Sidebar onClose={() => setNavOpen(false)} />
              </motion.aside>
            </div>
          }
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <AccountBanners />
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet context={context} />
          </div>
        </div>
      </div>
    </ConversationsProvider>);

}