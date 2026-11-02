import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../contexts/ConversationsContext';
import { describeError } from '../utils/apiErrors';
import { formatEmotionLabel } from '../utils/emotion';
import type { ReflectionEntry } from '../types/conversation';

export const REFLECTION_CONVERSATION_LIMIT = 12;

/**
 * Builds reflections from real, authorized data only: the user's own messages
 * and the model-estimated labels already stored in message_analysis.
 * Replace with a dedicated endpoint (e.g. GET /reflections) once available.
 */
export function useReflections() {
  const { api } = useAuth();
  const { conversations, status: listStatus, error: listError } = useConversations();
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [failedCount, setFailedCount] = useState(0);

  const load = useCallback(async () => {
    if (!api) return;
    setStatus('loading');
    setError(null);
    const recent = conversations.slice(0, REFLECTION_CONVERSATION_LIMIT);
    const results = await Promise.allSettled(recent.map((c) => api.listMessages(c.id)));
    const collected: ReflectionEntry[] = [];
    let failed = 0;
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failed += 1;
        return;
      }
      const convo = recent[index];
      result.value.messages.forEach((m) => {
        const analysis = result.value.analyses[m.id];
        if (m.role !== 'user' || !analysis?.predictedEmotion) return;
        collected.push({
          id: m.id,
          conversationId: convo.id,
          conversationTitle: convo.title,
          content: m.content,
          inputType: m.inputType,
          createdAt: m.createdAt,
          emotion: formatEmotionLabel(analysis.predictedEmotion)
        });
      });
    });
    collected.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFailedCount(failed);
    if (failed > 0 && failed === recent.length) {
      const firstFailure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
      setError(describeError(firstFailure?.reason).message);
      setStatus('error');
      return;
    }
    setEntries(collected);
    setStatus('ready');
  }, [api, conversations]);

  useEffect(() => {
    if (listStatus === 'ready') void load();
    if (listStatus === 'error') {
      setError(listError);
      setStatus('error');
    }
  }, [listStatus, listError, load]);

  return { entries, status, error, failedCount, reload: load, totalConversations: conversations.length };
}