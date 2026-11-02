import { motion } from 'framer-motion';
import { AlertCircleIcon, MicIcon, RotateCcwIcon } from 'lucide-react';
import { LogoMark } from '../common/Logo';
import { Spinner } from '../common/Spinner';
import { formatDuration, formatMessageTime } from '../../utils/dates';
import { cn } from '../../utils/cn';
import type {
  DisplayMessage,
  MessageAnalysis
} from '../../types/conversation';


export function MessageBubble({
  message,
  analysis
}: {
  message: DisplayMessage;
  analysis?: MessageAnalysis | null;
}) {
  const entering = Boolean(message.localStatus);
  const motionProps = {
    initial: entering ? { opacity: 0, y: 6 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
  } as const;

  if (message.role === 'assistant') {
    return (
      <motion.article {...motionProps} className="flex gap-3" aria-label="EmoSense">
        <LogoMark className="mt-0.5 h-7 w-7" />
        <div className="min-w-0 max-w-[88%] sm:max-w-[80%]">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.7] text-ink">{message.content}</p>
          <time dateTime={message.createdAt} className="mt-1.5 block text-[11px] text-muted">
            {formatMessageTime(message.createdAt)}
          </time>
        </div>
      </motion.article>);

  }

  const failed = message.localStatus === 'failed';
  const processingAudio = message.localStatus === 'uploading' || message.localStatus === 'analyzing';

  return (
    <motion.article {...motionProps} className="flex justify-end" aria-label="You">
      <div className="flex min-w-0 max-w-[88%] flex-col items-end sm:max-w-[75%]">
        <div
          className={cn(
            'rounded-2xl rounded-br-md px-4 py-3 text-[15px] leading-relaxed',
            failed ? 'border border-danger/40 bg-surface text-ink' : 'bg-accent text-on-accent'
          )}>
          
          {message.hasAudio &&
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium opacity-80">
              <MicIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Voice message
              {message.audioDuration ? ` · ${formatDuration(message.audioDuration)}` : ''}
              {!processingAudio && message.content && !failed ? ' · transcript' : ''}
            </span>
          }
          {message.localStatus === 'uploading' && <UploadProgress value={message.uploadProgress ?? 0} />}
          {message.localStatus === 'analyzing' &&
          <span className="flex items-center gap-2 text-sm" role="status">
              <Spinner className="h-3.5 w-3.5" /> Transcribing and analyzing your voice…
            </span>
          }
          {failed && message.hasAudio && !message.content && <span className="text-sm">Your voice message wasn't processed.</span>}
          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        </div>
        
        {analysis?.predictedEmotion && !message.localStatus && (
          <div
            className="mt-2 flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted"
            aria-label="AI estimated emotion"
          >
            <span className="rounded-full border border-line bg-surface px-2.5 py-1">
              AI detected: {analysis.predictedEmotion}
              {typeof analysis.emotionConfidence === 'number' &&
                ` · Confidence: ${Math.round(analysis.emotionConfidence * 100)}%`}
            </span>
          </div>
        )}

        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted" aria-live="polite">
          {message.localStatus === 'sending' &&
          <span className="flex items-center gap-1.5"><Spinner className="h-3 w-3" /> Sending…</span>
          }
          {failed &&
          <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-danger" role="alert">
              <AlertCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {message.error ?? 'Not sent.'}
              {message.retry &&
            <button type="button" onClick={message.retry} className="focus-ring inline-flex items-center gap-1 rounded font-medium underline-offset-2 hover:underline">
                  <RotateCcwIcon className="h-3 w-3" aria-hidden="true" /> Retry
                </button>
            }
            </span>
          }
          {!message.localStatus && <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>}
        </div>
      </div>
    </motion.article>);

}

function UploadProgress({ value }: {value: number;}) {
  const pct = Math.round(value * 100);
  return (
    <div className="w-56 max-w-full" role="status">
      <div className="flex items-center justify-between text-sm">
        <span>Uploading…</span>
        <span className="tabular-nums opacity-80">{pct}%</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-on-accent/25"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Upload progress">
        
        <div className="h-full rounded-full bg-on-accent transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>);

}