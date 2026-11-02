import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../contexts/ConversationsContext';
import { ApiError } from '../services/apiClient';
import { describeError } from '../utils/apiErrors';
import type { DisplayMessage, MessageAnalysis, ReplyState, SendMessageResult } from '../types/conversation';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export function useConversation(conversationId: string | undefined) {
  const { api } = useAuth();
  const { touch, takePending } = useConversations();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, MessageAnalysis>>({});
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [replyState, setReplyState] = useState<ReplyState>('idle');
  const [reloadKey, setReloadKey] = useState(0);

  const busy = messages.some((m) => m.localStatus && m.localStatus !== 'failed');

  const patch = useCallback((id: string, update: Partial<DisplayMessage>) => {
    setMessages((list) => list.map((m) => m.id === id ? { ...m, ...update } : m));
  }, []);

  const applyResult = useCallback((localId: string, result: SendMessageResult) => {
    if (!conversationId) return;
    setMessages((list) => {
      const next = list.map((m) => m.id === localId ? { ...result.message } : m);
      return result.assistantMessage ? [...next, result.assistantMessage] : next;
    });
    if (result.analysis) {
      const analysis = result.analysis;
      setAnalyses((a) => ({ ...a, [result.message.id]: analysis }));
    }
    setReplyState(result.assistantMessage ? 'idle' : 'unavailable');
    touch(conversationId);
  }, [conversationId, touch]);

  const sendText = useCallback(async (content: string) => {
    if (!api || !conversationId) return;
    const localId = `local-${Date.now()}`;
    setMessages((list) => [
    ...list,
    { id: localId, conversationId, role: 'user', content, inputType: 'text', createdAt: new Date().toISOString(), hasAudio: false, localStatus: 'sending' }]
    );
    setReplyState('awaiting');
    try {
      applyResult(localId, await api.sendTextMessage(conversationId, content));
    } catch (error) {
      setReplyState('idle');
      patch(localId, {
        localStatus: 'failed',
        error: describeError(error).message,
        retry: () => {
          setReloadKey((key) => key + 1);
        }
      });
    }
  }, [api, conversationId, applyResult, patch]);

  const sendAudio = useCallback(async (file: File, duration: number) => {
    if (!api || !conversationId) return;
    const localId = `local-${Date.now()}`;
    setMessages((list) => [
    ...list,
    { id: localId, conversationId, role: 'user', content: '', inputType: 'audio', createdAt: new Date().toISOString(), hasAudio: true, localStatus: 'uploading', uploadProgress: 0, audioDuration: duration }]
    );
    setReplyState('awaiting');
    try {
      const result = await api.sendAudioMessage(conversationId, file, {
        onProgress: (fraction) => patch(localId, fraction >= 1 ? { localStatus: 'analyzing', uploadProgress: 1 } : { uploadProgress: fraction })
      });
      applyResult(localId, result);
    } catch (error) {
      setReplyState('idle');
      patch(localId, {
        localStatus: 'failed',
        error: describeError(error).message,
        retry: () => {
          setReloadKey((key) => key + 1);
        }
      });
    }
  }, [api, conversationId, applyResult, patch]);

  const sendTextRef = useRef(sendText);
  const sendAudioRef = useRef(sendAudio);
  sendTextRef.current = sendText;
  sendAudioRef.current = sendAudio;

  useEffect(() => {
    if (!api || !conversationId) {
      setMessages([]);
      setAnalyses({});
      setLoadState('idle');
      setReplyState('idle');
      return;
    }
    let cancelled = false;
    setLoadState('loading');
    setLoadError(null);
    setMessages([]);
    setReplyState('idle');
    api.
    listMessages(conversationId).
    then((res) => {
      if (cancelled) return;
      setMessages(res.messages);
      setAnalyses(res.analyses);
      setLoadState('ready');
      const pending = takePending(conversationId);
      if (pending?.kind === 'text') void sendTextRef.current(pending.content);
      if (pending?.kind === 'audio') void sendAudioRef.current(pending.file, pending.duration);
    }).
    catch((error: unknown) => {
      if (cancelled) return;
      setLoadError(error instanceof ApiError ? error : new ApiError('server', 'Unexpected error'));
      setLoadState('error');
    });
    return () => {
      cancelled = true;
    };
  }, [api, conversationId, takePending, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const dismissReplyNotice = useCallback(() => setReplyState('idle'), []);

  return { messages, analyses, loadState, loadError, replyState, busy, sendText, sendAudio, reload, dismissReplyNotice };
}