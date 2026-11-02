const LABELS: Record<string, string> = {
  neu: 'Neutral',
  neutral: 'Neutral',
  hap: 'Happiness',
  happy: 'Happiness',
  joy: 'Joy',
  sad: 'Sadness',
  sadness: 'Sadness',
  ang: 'Anger',
  angry: 'Anger',
  anger: 'Anger',
  fea: 'Fear',
  fear: 'Fear',
  fearful: 'Fear',
  sur: 'Surprise',
  surprise: 'Surprise',
  surprised: 'Surprise',
  dis: 'Disgust',
  disgust: 'Disgust',
  disgusted: 'Disgust',
  calm: 'Calm'
};

/** Human-readable label for a model-estimated emotion. No scores are ever shown. */
export function formatEmotionLabel(raw: string | null | undefined): string {
  if (!raw) return 'Unlabeled';
  const key = raw.trim().toLowerCase().split(/[\s/_-]+/).pop() ?? '';
  if (LABELS[key]) return LABELS[key];
  const clean = raw.replace(/[_-]+/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}