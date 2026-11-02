import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useDismiss } from '../../hooks/useDismiss';
import { formatConversationDate } from '../../utils/dates';
import { cn } from '../../utils/cn';
import type { Conversation } from '../../types/conversation';

interface ConversationItemProps {
  conversation: Conversation;
  active: boolean;
  onRename: () => void;
  onDelete: () => void;
}

export function ConversationItem({ conversation, active, onRename, onDelete }: ConversationItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const close = useCallback(() => setMenuOpen(false), []);
  useDismiss(ref, menuOpen, close);

  return (
    <li ref={ref} className="group relative">
      <Link
        to={`/app/c/${conversation.id}`}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'focus-ring flex items-center gap-2 rounded-lg py-2 pl-3 pr-10 text-sm transition-colors duration-150 ease-out',
          active ? 'bg-accent-tint font-medium text-ink' : 'text-ink/85 hover:bg-raised'
        )}>
        
        <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
        <time dateTime={conversation.updatedAt} className={cn('hidden shrink-0 text-xs text-muted lg:inline lg:group-hover:invisible', menuOpen && 'lg:invisible')}>
          {formatConversationDate(conversation.updatedAt)}
        </time>
      </Link>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className={cn(
          'icon-btn absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 lg:opacity-0 lg:focus-visible:opacity-100 lg:group-hover:opacity-100',
          menuOpen && 'lg:opacity-100'
        )}
        aria-label={`Options for ${conversation.title}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}>
        
        <MoreHorizontalIcon className="h-4 w-4" />
      </button>
      {menuOpen &&
      <div role="menu" className="absolute right-1 top-10 z-20 w-44 rounded-xl border border-line bg-surface p-1 shadow-lift">
          <button type="button" role="menuitem" className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-raised" onClick={() => {close();onRename();}}>
            <PencilIcon className="h-4 w-4 text-muted" aria-hidden="true" /> Rename
          </button>
          <button type="button" role="menuitem" className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-tint" onClick={() => {close();onDelete();}}>
            <Trash2Icon className="h-4 w-4" aria-hidden="true" /> Delete
          </button>
        </div>
      }
    </li>);

}