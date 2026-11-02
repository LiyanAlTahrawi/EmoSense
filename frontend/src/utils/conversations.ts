import type { Conversation } from '../types/conversation';

export function sortByRecent(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function deriveTitle(text: string): string {
  const firstLine = text.trim().split('\n')[0].replace(/\s+/g, ' ');
  if (firstLine.length <= 48) return firstLine || 'New conversation';
  const cut = firstLine.slice(0, 48);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 24 ? lastSpace : 48)}…`;
}

export function initialsFor(first?: string | null, last?: string | null, email?: string | null): string {
  const a = first?.trim()?.[0] ?? '';
  const b = last?.trim()?.[0] ?? '';
  const fromName = `${a}${b}`.toUpperCase();
  if (fromName) return fromName;
  return (email?.[0] ?? '?').toUpperCase();
}