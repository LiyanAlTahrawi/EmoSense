import React, { useLayoutEffect } from 'react';
import { ArrowUpIcon, MicIcon } from 'lucide-react';
import { useAudioRecorder, type RecordedAudio } from '../../hooks/useAudioRecorder';
import { RecorderError } from '../audio/RecorderError';
import { RecordingBar } from '../audio/RecordingBar';
import { cn } from '../../utils/cn';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSendText: (text: string) => void;
  onSendAudio: (audio: RecordedAudio) => void;
  disabled?: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function ChatComposer({ value, onChange, onSendText, onSendAudio, disabled, textareaRef }: ChatComposerProps) {
  const recorder = useAudioRecorder(onSendAudio);
  const recording = recorder.status !== 'idle';
  const canSend = value.trim().length > 0 && !disabled;

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value, textareaRef]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSendText(text);
    onChange('');
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="shrink-0 bg-canvas px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-5">
      <div className="mx-auto w-full max-w-3xl">
        {recorder.error && <RecorderError code={recorder.error} onRetry={() => void recorder.start()} onDismiss={recorder.dismissError} />}
        <div className={cn('rounded-2xl border bg-surface shadow-soft transition-[border-color] duration-150 ease-out', recording ? 'border-accent/50' : 'border-line focus-within:border-accent/60')}>
          {recording ?
          <RecordingBar status={recorder.status} elapsed={recorder.elapsed} levels={recorder.levels} onStop={recorder.stop} onCancel={recorder.cancel} /> :

          <form
            className="flex items-end gap-1.5 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}>
            
              <label htmlFor="composer" className="sr-only">Message EmoSense</label>
              <textarea
              id="composer"
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Share what's on your mind…"
              aria-describedby="composer-hint"
              className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-muted focus:outline-none" />
            
              <button
              type="button"
              onClick={() => void recorder.start()}
              disabled={disabled}
              className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink transition-[background-color,transform] duration-150 ease-out hover:bg-raised active:scale-95 disabled:opacity-40"
              aria-label="Record a voice message"
              title="Record a voice message">
              
                <MicIcon className="h-5 w-5" />
              </button>
              <button
              type="submit"
              disabled={!canSend}
              className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-accent/90 active:scale-95 disabled:opacity-35"
              aria-label="Send message">
              
                <ArrowUpIcon className="h-5 w-5" />
              </button>
            </form>
          }
        </div>
        <p id="composer-hint" className="mt-2 hidden text-center text-xs text-muted sm:block">
          Enter to send · Shift + Enter for a new line · EmoSense is not a substitute for professional care.
        </p>
      </div>
    </div>);

}