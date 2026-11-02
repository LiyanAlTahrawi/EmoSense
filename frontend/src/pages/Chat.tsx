import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageCircleIcon, MessageSquareOffIcon, CloudOffIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../contexts/ConversationsContext';
import { useConversation } from '../hooks/useConversation';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useScreenInit } from '../useScreenInit.js';
import { describeError } from '../utils/apiErrors';
import { deriveTitle } from '../utils/conversations';
import { ChatComposer } from '../components/chat/ChatComposer';
import { ContextPanel } from '../components/chat/ContextPanel';
import { ConversationHeader } from '../components/chat/ConversationHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessagesSkeleton } from '../components/chat/MessagesSkeleton';
import { WelcomeState } from '../components/chat/WelcomeState';
import { EmptyState } from '../components/common/EmptyState';
import { Notice } from '../components/common/Notice';
import { Spinner } from '../components/common/Spinner';
import type { RecordedAudio } from '../hooks/useAudioRecorder';
import type { PendingPayload } from '../types/conversation';

export function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { profile, profileStatus } = useAuth();
  const { conversations, create, queuePending } = useConversations();
  const convo = useConversation(conversationId);
  const [draft, setDraft] = useState('');
  const screenInit = useScreenInit() as {contextOpen?: boolean;};
  const [contextOpen, setContextOpen] = useState(Boolean(screenInit.contextOpen));
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  useDocumentTitle(conversationId ? conversation?.title ?? 'Conversation' : 'New conversation');

  useEffect(() => {
    setStartError(null);
    if (window.matchMedia('(min-width: 1024px)').matches) textareaRef.current?.focus();
  }, [conversationId]);

  useEffect(() => {
    if (convo.loadError?.code === 'forbidden') navigate('/unauthorized', { replace: true });
  }, [convo.loadError, navigate]);

  const startConversation = async (payload: PendingPayload) => {
    setStarting(true);
    setStartError(null);
    try {
      const title = payload.kind === 'text' ? deriveTitle(payload.content) : 'Voice conversation';
      const created = await create(title);
      queuePending(created.id, payload);
      navigate(`/app/c/${created.id}`);
    } catch (error) {
      setStartError(describeError(error).message);
      if (payload.kind === 'text') setDraft(payload.content);
    } finally {
      setStarting(false);
    }
  };

  const handleText = (text: string) => {
    if (conversationId) void convo.sendText(text);else
    void startConversation({ kind: 'text', content: text });
  };

  const handleAudio = (audio: RecordedAudio) => {
    if (conversationId) void convo.sendAudio(audio.file, audio.duration);else
    void startConversation({ kind: 'audio', file: audio.file, duration: audio.duration });
  };

  const pickStarter = (text: string) => {
    setDraft(text);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const renderBody = () => {
    if (!conversationId) {
      return <WelcomeState firstName={profile?.firstName || null} loadingName={profileStatus === 'loading'} onPick={pickStarter} />;
    }
    if (convo.loadState === 'loading' || convo.loadState === 'idle') return <MessagesSkeleton />;
    if (convo.loadState === 'error' && convo.loadError) {
      const notFound = convo.loadError.code === 'not_found';
      const info = describeError(convo.loadError);
      return (
        <EmptyState
          className="min-h-full justify-center"
          icon={notFound ? MessageSquareOffIcon : CloudOffIcon}
          tone={notFound ? 'neutral' : 'danger'}
          title={notFound ? "This conversation isn't available" : "We couldn't load this conversation"}
          description={notFound ? 'It may have been removed, or the link is incorrect.' : info.message}
          action={
          notFound ?
          <Link to="/app" className="btn btn-primary">Start a new conversation</Link> :

          <button type="button" className="btn btn-primary" onClick={convo.reload}>Try again</button>

          } />);


    }
    if (convo.messages.length === 0 && convo.replyState === 'idle') {
      return (
        <EmptyState
          className="min-h-full justify-center"
          icon={MessageCircleIcon}
          title="A fresh start"
          description="Share what's on your mind — by voice or text — whenever you're ready." />);


    }
    return <MessageList messages={convo.messages} analyses={convo.analyses} replyState={convo.replyState} onDismissReply={convo.dismissReplyNotice} />;
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <ConversationHeader
          conversation={conversation}
          hasConversation={Boolean(conversationId)}
          contextOpen={contextOpen}
          onToggleContext={() => setContextOpen((o) => !o)} />
        
        <main className="min-h-0 flex-1 overflow-y-auto">{renderBody()}</main>
        {(starting || startError) &&
        <div className="mx-auto w-full max-w-3xl px-3 sm:px-6">
            {starting ?
          <p className="flex items-center gap-2 py-2 text-sm text-muted" role="status">
                <Spinner /> Starting a new conversation…
              </p> :

          <Notice tone="danger" title="We couldn't start a conversation" onDismiss={() => setStartError(null)}>
                {startError}
              </Notice>
          }
          </div>
        }
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSendText={handleText}
          onSendAudio={handleAudio}
          disabled={convo.busy || starting || convo.loadState === 'loading'}
          textareaRef={textareaRef} />
        
      </div>
      {contextOpen && conversationId &&
      <ContextPanel conversation={conversation} messages={convo.messages} analyses={convo.analyses} onClose={() => setContextOpen(false)} />
      }
    </div>);

}