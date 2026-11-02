import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontalIcon, PanelRightCloseIcon, PanelRightOpenIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useConversations } from '../../contexts/ConversationsContext';
import { useDismiss } from '../../hooks/useDismiss';
import { formatLongDate } from '../../utils/dates';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { TopBar } from '../layout/TopBar';
import { RenameConversationDialog } from './RenameConversationDialog';
import type { Conversation } from '../../types/conversation';

interface ConversationHeaderProps {
  conversation?: Conversation;
  hasConversation: boolean;
  contextOpen: boolean;
  onToggleContext: () => void;
}

export function ConversationHeader({ conversation, hasConversation, contextOpen, onToggleContext }: ConversationHeaderProps) {
  const { rename, remove } = useConversations();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<'rename' | 'delete' | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setMenuOpen(false), []);
  useDismiss(ref, menuOpen, close);

  const actions = hasConversation && conversation ?
  <>
      <div ref={ref} className="relative">
        <button type="button" className="icon-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Conversation options" aria-haspopup="menu" aria-expanded={menuOpen}>
          <MoreHorizontalIcon className="h-[18px] w-[18px]" />
        </button>
        {menuOpen &&
      <div role="menu" className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-line bg-surface p-1 shadow-lift">
            <button type="button" role="menuitem" className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-raised" onClick={() => {close();setDialog('rename');}}>
              <PencilIcon className="h-4 w-4 text-muted" aria-hidden="true" /> Rename
            </button>
            <button type="button" role="menuitem" className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-tint" onClick={() => {close();setDialog('delete');}}>
              <Trash2Icon className="h-4 w-4" aria-hidden="true" /> Delete
            </button>
          </div>
      }
      </div>
      <button
      type="button"
      className="icon-btn hidden xl:inline-flex"
      onClick={onToggleContext}
      aria-pressed={contextOpen}
      aria-label={contextOpen ? 'Hide conversation context' : 'Show conversation context'}>
      
        {contextOpen ? <PanelRightCloseIcon className="h-[18px] w-[18px]" /> : <PanelRightOpenIcon className="h-[18px] w-[18px]" />}
      </button>
    </> :
  null;

  return (
    <>
      <TopBar
        title={hasConversation ? conversation?.title ?? 'Conversation' : 'New conversation'}
        subtitle={conversation ? `Started ${formatLongDate(conversation.createdAt)}` : undefined}
        actions={actions} />
      
      {conversation &&
      <>
          <RenameConversationDialog open={dialog === 'rename'} currentTitle={conversation.title} onClose={() => setDialog(null)} onRename={(title) => rename(conversation.id, title)} />
          <ConfirmationDialog
          open={dialog === 'delete'}
          onClose={() => setDialog(null)}
          title="Delete this conversation?"
          description={`“${conversation.title}” and its messages will be permanently removed from your account once the server confirms.`}
          confirmLabel="Delete conversation"
          onConfirm={async () => {
            await remove(conversation.id);
            navigate('/app');
          }} />
        
        </>
      }
    </>);

}