import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { describeError } from '../utils/apiErrors';
import { sortByRecent } from '../utils/conversations';
import type { Conversation, PendingPayload } from '../types/conversation';

interface ConversationsContextValue {
  conversations: Conversation[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  refresh: () => Promise<void>;
  create: (title: string) => Promise<Conversation>;
  rename: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  touch: (id: string) => void;
  queuePending: (id: string, payload: PendingPayload) => void;
  takePending: (id: string) => PendingPayload | undefined;
}

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

/**
 * Server-authoritative conversation list. Lives inside the authenticated shell,
 * so it's discarded from memory on sign-out and reloaded from the API on sign-in.
 */
export function ConversationsProvider({ children }: {children: React.ReactNode;}) {
  const { api } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(new Map<string, PendingPayload>());

  const refresh = useCallback(async () => {
    if (!api) return;
    setStatus('loading');
    setError(null);
    try {
      setConversations(sortByRecent(await api.listConversations()));
      setStatus('ready');
    } catch (e) {
      setError(describeError(e).message);
      setStatus('error');
    }
  }, [api]);

  useEffect(() => {
    setConversations([]);
    void refresh();
  }, [refresh]);

  const create = useCallback(async (title: string) => {
    if (!api) throw new Error('Not signed in');
    const convo = await api.createConversation(title);
    setConversations((list) => [convo, ...list.filter((c) => c.id !== convo.id)]);
    return convo;
  }, [api]);

  const rename = useCallback(async (id: string, title: string) => {
    if (!api) throw new Error('Not signed in');
    const updated = await api.renameConversation(id, title);
    setConversations((list) => list.map((c) => c.id === id ? updated : c));
  }, [api]);

  const remove = useCallback(async (id: string) => {
    if (!api) throw new Error('Not signed in');
    await api.deleteConversation(id);
    setConversations((list) => list.filter((c) => c.id !== id));
  }, [api]);

  const touch = useCallback((id: string) => {
    const now = new Date().toISOString();
    setConversations((list) => sortByRecent(list.map((c) => c.id === id ? { ...c, updatedAt: now } : c)));
  }, []);

  const queuePending = useCallback((id: string, payload: PendingPayload) => {
    pending.current.set(id, payload);
  }, []);

  const takePending = useCallback((id: string) => {
    const payload = pending.current.get(id);
    pending.current.delete(id);
    return payload;
  }, []);

  const value = useMemo(
    () => ({ conversations, status, error, refresh, create, rename, remove, touch, queuePending, takePending }),
    [conversations, status, error, refresh, create, rename, remove, touch, queuePending, takePending]
  );

  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>;
}

export function useConversations(): ConversationsContextValue {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error('useConversations must be used within ConversationsProvider');
  return ctx;
}