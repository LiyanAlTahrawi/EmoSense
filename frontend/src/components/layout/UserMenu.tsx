import React, { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpenIcon, LogOutIcon, ShieldCheckIcon, UserRoundIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useDismiss } from '../../hooks/useDismiss';
import { initialsFor } from '../../utils/conversations';

export function UserMenu() {
  const { profile, user, mode, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';
  const initials = initialsFor(profile?.firstName, profile?.lastName, user?.email);

  const logout = async () => {
    close();
    await signOut();
    toast.success(mode === 'demo' ? 'You left the preview.' : 'Signed out. Your conversations remain saved to your account.');
    navigate('/', { replace: true });
  };

  const items = [
  { to: '/app/settings/profile', label: 'Profile', icon: UserRoundIcon },
  { to: '/app/reflections', label: 'My Reflections', icon: BookOpenIcon },
  { to: '/app/settings/privacy', label: 'Privacy & data', icon: ShieldCheckIcon }];


  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-lavender text-xs font-semibold text-lavender-ink transition-transform duration-150 ease-out active:scale-95"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu">
        
        {initials}
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          role="menu"
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: 'top right' }}
          className="absolute right-0 top-11 z-30 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-lift">
          
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-ink">{name || 'Your account'}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            {items.map(({ to, label, icon: Icon }) =>
          <Link key={to} to={to} role="menuitem" onClick={close} className="focus-ring flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-raised">
                <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
                {label}
              </Link>
          )}
            <div className="my-1 h-px bg-line" />
            <button type="button" role="menuitem" onClick={logout} className="focus-ring flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-raised">
              <LogOutIcon className="h-4 w-4 text-muted" aria-hidden="true" />
              {mode === 'demo' ? 'Exit preview' : 'Log out'}
            </button>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}