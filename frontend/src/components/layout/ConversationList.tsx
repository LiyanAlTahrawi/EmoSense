import React, { useMemo, useState } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import { CloudOffIcon, MessagesSquareIcon, SearchXIcon } from 'lucide-react';
import { useConversations } from '../../contexts/ConversationsContext';
import { groupByDate } from '../../utils/dates';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { RenameConversationDialog } from '../chat/RenameConversationDialog';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '../../types/conversation';

export function ConversationList({ query }: {query: string;}) {
  const { conversations, status, error, refresh, rename, remove } = useConversations();
  const match = useMatch('/app/c/:conversationId');
  const activeId = match?.params.conversationId;
  const navigate = useNavigate();
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? conversations.filter((c) => c.title.toLowerCase().includes(q)) : conversations;
  }, [conversations, query]);
  const groups = useMemo(() => groupByDate(filtered, (c) => c.updatedAt), [filtered]);

  if (status === 'loading' && conversations.length === 0) {
    return (
      <div className="space-y-2 px-3 pt-2" role="status" aria-label="Loading conversations">
        {[72, 56, 84, 64, 48].map((w) =>
        <div key={w} className="h-4 animate-pulse rounded bg-raised" style={{ width: `${w}%` }} />
        )}
      </div>);

  }

  if (status === 'error') {
    return (
      <div className="mx-1 rounded-xl border border-line bg-surface p-4 text-center" role="alert">
        <CloudOffIcon className="mx-auto h-5 w-5 text-muted" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-ink">Couldn't load your history</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{error}</p>
        <button type="button" className="btn btn-secondary mt-3 h-8 px-3 text-xs" onClick={() => void refresh()}>Try again</button>
      </div>);

  }

  if (conversations.length === 0) {
    return (
      <div className="px-3 py-6 text-center">
        <MessagesSquareIcon className="mx-auto h-5 w-5 text-muted" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-ink">No conversations yet</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">Your saved conversations will appear here, ready whenever you come back.</p>
      </div>);

  }

  return (
    <>
      {filtered.length === 0 ?
      <div className="px-3 py-6 text-center">
          <SearchXIcon className="mx-auto h-5 w-5 text-muted" aria-hidden="true" />
          <p className="mt-2 text-sm text-muted">No conversations match “{query.trim()}”.</p>
        </div> :

      groups.map((group) =>
      <section key={group.label} className="mb-4" aria-label={group.label}>
            <h3 className="px-3 pb-1 text-xs font-medium text-muted">{group.label}</h3>
            <ul className="space-y-0.5">
              {group.items.map((c) =>
          <ConversationItem key={c.id} conversation={c} active={c.id === activeId} onRename={() => setRenameTarget(c)} onDelete={() => setDeleteTarget(c)} />
          )}
            </ul>
          </section>
      )
      }
      <RenameConversationDialog
        open={Boolean(renameTarget)}
        currentTitle={renameTarget?.title ?? ''}
        onClose={() => setRenameTarget(null)}
        onRename={(title) => rename(renameTarget?.id ?? '', title)} />
      
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this conversation?"
        description={`“${deleteTarget?.title ?? ''}” and its messages will be permanently removed from your account once the server confirms.`}
        confirmLabel="Delete conversation"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await remove(deleteTarget.id);
          if (deleteTarget.id === activeId) navigate('/app');
        }} />
      
    </>);

}