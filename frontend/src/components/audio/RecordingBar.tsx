import React from 'react';
import { SquareIcon, XIcon } from 'lucide-react';
import { Spinner } from '../common/Spinner';
import { RecordingTimer } from './RecordingTimer';
import { Waveform } from './Waveform';
import { MAX_RECORDING_SECONDS, type RecorderStatus } from '../../hooks/useAudioRecorder';

interface RecordingBarProps {
  status: RecorderStatus;
  elapsed: number;
  levels: number[];
  onStop: () => void;
  onCancel: () => void;
}

export function RecordingBar({ status, elapsed, levels, onStop, onCancel }: RecordingBarProps) {
  if (status === 'requesting' || status === 'preparing') {
    return (
      <div className="flex min-h-[60px] items-center gap-3 px-4 py-2" role="status">
        <Spinner className="text-accent" />
        <p className="flex-1 text-sm text-muted">
          {status === 'requesting' ? 'Waiting for microphone permission…' : 'Preparing your recording…'}
        </p>
        {status === 'requesting' &&
        <button type="button" className="btn btn-ghost h-9" onClick={onCancel}>Cancel</button>
        }
      </div>);

  }

  return (
    <div className="flex min-h-[60px] items-center gap-2 p-2 sm:gap-3">
      <button type="button" onClick={onCancel} className="icon-btn h-11 w-11 rounded-xl" aria-label="Cancel recording and discard">
        <XIcon className="h-5 w-5" />
      </button>
      <div className="flex shrink-0 items-center gap-2" aria-live="polite">
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
        </span>
        <span className="text-sm font-medium text-ink">Recording</span>
      </div>
      <RecordingTimer elapsed={elapsed} max={MAX_RECORDING_SECONDS} />
      <Waveform levels={levels} />
      <button type="button" onClick={onStop} className="btn btn-primary h-11 shrink-0 px-3 sm:px-4" aria-label="Stop recording and send">
        <SquareIcon className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        <span className="hidden sm:inline">Stop & send</span>
      </button>
    </div>);

}