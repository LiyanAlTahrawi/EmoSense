import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpenIcon, PlusIcon, SearchIcon, SettingsIcon, XIcon } from 'lucide-react';
import { Logo } from '../common/Logo';
import { ConversationList } from './ConversationList';
import { cn } from '../../utils/cn';

export function Sidebar({ onClose }: {onClose?: () => void;}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const navClass = ({ isActive }: {isActive: boolean;}) =>
  cn(
    'focus-ring flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ease-out',
    isActive ? 'bg-accent-tint font-medium text-ink' : 'text-muted hover:bg-raised hover:text-ink'
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <Link to="/app" className="focus-ring rounded-lg" aria-label="EmoSense — new conversation">
          <Logo />
        </Link>
        {onClose &&
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close navigation">
            <XIcon className="h-5 w-5" />
          </button>
        }
      </div>

      <div className="shrink-0 px-3">
        <button type="button" className="btn btn-primary w-full" onClick={() => navigate('/app')}>
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          New conversation
        </button>
        <div className="relative mt-3">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="input h-10 bg-canvas pl-9 text-sm" />
          
        </div>
      </div>

      <nav aria-label="Conversation history" className="mt-4 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <ConversationList query={query} />
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-line p-2">
        <NavLink to="/app/reflections" className={navClass}>
          <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
          My Reflections
        </NavLink>
        <NavLink to="/app/settings" className={navClass}>
          <SettingsIcon className="h-4 w-4" aria-hidden="true" />
          Settings
        </NavLink>
      </div>
    </div>);

}