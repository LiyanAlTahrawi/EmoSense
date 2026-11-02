import { useEffect } from 'react';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · EmoSense` : 'EmoSense — Emotion-aware AI companion';
  }, [title]);
}