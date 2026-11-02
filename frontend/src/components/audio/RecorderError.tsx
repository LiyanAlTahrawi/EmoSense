import React from 'react';
import { Notice } from '../common/Notice';
import { recorderErrorMessages, type RecorderErrorCode } from '../../hooks/useAudioRecorder';

interface RecorderErrorProps {
  code: RecorderErrorCode;
  onRetry: () => void;
  onDismiss: () => void;
}

export function RecorderError({ code, onRetry, onDismiss }: RecorderErrorProps) {
  const canRetry = code !== 'unsupported';
  return (
    <Notice
      tone={code === 'permission_denied' || code === 'unsupported' ? 'warning' : 'danger'}
      title={code === 'permission_denied' ? 'Microphone access needed' : "Voice message didn't record"}
      onDismiss={onDismiss}
      className="mb-3"
      action={canRetry ? <button type="button" className="btn btn-secondary h-8 px-3 text-xs" onClick={onRetry}>Try again</button> : undefined}>
      
      {recorderErrorMessages[code]}
    </Notice>);

}