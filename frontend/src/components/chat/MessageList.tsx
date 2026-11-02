import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { ReplyStatus } from './ReplyStatus';
import { formatDayHeading, isSameDay } from '../../utils/dates';
import type {
  DisplayMessage,
  MessageAnalysis,
  ReplyState
} from '../../types/conversation';



interface MessageListProps {
  messages: DisplayMessage[];
  analyses?: Record<string, MessageAnalysis>;
  replyState: ReplyState;
  onDismissReply: () => void;
}

export function MessageList({
  messages,
  analyses = {},
  replyState,
  onDismissReply
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const reduce = useReducedMotion();
  const lastStatus = messages[messages.length - 1]?.localStatus;

  useEffect(() => {
    const behavior = firstRender.current || reduce ? 'auto' : 'smooth';
    firstRender.current = false;
    endRef.current?.scrollIntoView({ block: 'end', behavior });
  }, [messages.length, replyState, lastStatus, reduce]);

  return (
    <div role="log" aria-label="Conversation messages" className="mx-auto w-full max-w-3xl space-y-7 px-4 py-8 sm:px-6">
      {messages.map((message, i) => {
        const showDay = i === 0 || !isSameDay(messages[i - 1].createdAt, message.createdAt);
        return (
          <React.Fragment key={message.id}>
            {showDay &&
            <div className="flex items-center gap-3" role="separator" aria-label={formatDayHeading(message.createdAt)}>
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs font-medium text-muted">{formatDayHeading(message.createdAt)}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
            }
            <MessageBubble
              message={message}
              analysis={analyses[message.id] ?? null}
            />
          </React.Fragment>);

      })}
      <ReplyStatus state={replyState} onDismiss={onDismissReply} />
      <div ref={endRef} />
    </div>);

}