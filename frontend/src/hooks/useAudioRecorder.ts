import { useCallback, useEffect, useRef, useState } from 'react';
import { convertToWav } from '../utils/wav';

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'preparing';
export type RecorderErrorCode =
'permission_denied' |
'no_microphone' |
'unsupported' |
'recording_failed' |
'empty' |
'silent' |
'too_large' |
'conversion_failed';

export interface RecordedAudio {
  file: File;
  duration: number;
}

export const MAX_RECORDING_SECONDS = 300;
const MAX_BYTES = 20 * 1024 * 1024;
const BAR_COUNT = 36;

export const recorderErrorMessages: Record<RecorderErrorCode, string> = {
  permission_denied: "Microphone access was blocked. Allow microphone access in your browser's site settings, then try again.",
  no_microphone: 'No microphone was found. Connect one and try again.',
  unsupported: "This browser doesn't support voice recording. You can still type your message.",
  recording_failed: 'Recording stopped unexpectedly. Please try again.',
  empty: 'That recording was too short. Try speaking for at least a second.',
  silent: "We couldn't hear anything in that recording. Check your microphone and try again.",
  too_large: 'That recording is over the 20 MB limit. Try a shorter message.',
  conversion_failed: "We couldn't prepare that recording for upload. Please try again."
};

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type));
}

export function useAudioRecorder(onComplete: (audio: RecordedAudio) => void) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<RecorderErrorCode | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0));

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const releaseDevices = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== 'closed') void ctxRef.current.close();
    ctxRef.current = null;
  }, []);

  const fail = useCallback((code: RecorderErrorCode) => {
    releaseDevices();
    setError(code);
    setStatus('idle');
  }, [releaseDevices]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      cancelledRef.current = false;
      recorder.stop();
    }
  }, []);

  const handleStop = useCallback(async () => {
    const duration = (performance.now() - startRef.current) / 1000;
    const mimeType = recorderRef.current?.mimeType || 'audio/webm';
    releaseDevices();
    setLevels(Array(BAR_COUNT).fill(0));
    if (cancelledRef.current) return;
    const blob = new Blob(chunksRef.current, { type: mimeType });
    if (blob.size === 0 || duration < 0.8) return fail('empty');
    setStatus('preparing');
    try {
      const wav = await convertToWav(blob);
      if (wav.peak < 0.004) return fail('silent');
      if (wav.blob.size > MAX_BYTES) return fail('too_large');
      const file = new File([wav.blob], `emosense-voice-${Date.now()}.wav`, { type: 'audio/wav' });
      setStatus('idle');
      onCompleteRef.current({ file, duration: wav.duration });
    } catch {
      fail('conversion_failed');
    }
  }, [fail, releaseDevices]);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('unsupported');
      return;
    }
    setStatus('requesting');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
    } catch (e) {
      const name = (e as DOMException).name;
      if (name === 'NotAllowedError' || name === 'SecurityError') return fail('permission_denied');
      if (name === 'NotFoundError' || name === 'OverconstrainedError') return fail('no_microphone');
      return fail('recording_failed');
    }
    streamRef.current = stream;
    try {
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      cancelledRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => void handleStop();
      recorder.onerror = () => fail('recording_failed');

      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buffer = new Uint8Array(analyser.fftSize);
      let lastSample = 0;

      const tick = (now: number) => {
        const seconds = (now - startRef.current) / 1000;
        if (now - lastSample > 70) {
          lastSample = now;
          analyser.getByteTimeDomainData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i += 1) {
            const v = (buffer[i] - 128) / 128;
            sum += v * v;
          }
          const level = Math.min(1, Math.sqrt(sum / buffer.length) * 4);
          setLevels((prev) => [...prev.slice(1), level]);
          setElapsed(seconds);
        }
        if (seconds >= MAX_RECORDING_SECONDS) {
          stop();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      startRef.current = performance.now();
      setElapsed(0);
      recorder.start(250);
      setStatus('recording');
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      fail('recording_failed');
    }
  }, [fail, handleStop, stop]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    releaseDevices();
    setLevels(Array(BAR_COUNT).fill(0));
    setStatus('idle');
  }, [releaseDevices]);

  const dismissError = useCallback(() => setError(null), []);

  useEffect(() => () => {
    cancelledRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    releaseDevices();
  }, [releaseDevices]);

  return { status, error, elapsed, levels, start, stop, cancel, dismissError };
}