import { differenceInCalendarDays, format, isToday, isYesterday } from 'date-fns';

export type DateGroupLabel = 'Today' | 'Yesterday' | 'Previous 7 days' | 'Older';

export function groupByDate<T>(items: T[], getDate: (item: T) => string) {
  const order: DateGroupLabel[] = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];
  const buckets = new Map<DateGroupLabel, T[]>();
  items.forEach((item) => {
    const label = dateGroupFor(getDate(item));
    buckets.set(label, [...(buckets.get(label) ?? []), item]);
  });
  return order.
  filter((label) => buckets.has(label)).
  map((label) => ({ label, items: buckets.get(label) ?? [] }));
}

function dateGroupFor(iso: string): DateGroupLabel {
  const date = new Date(iso);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (differenceInCalendarDays(new Date(), date) <= 7) return 'Previous 7 days';
  return 'Older';
}

export function formatMessageTime(iso: string): string {
  return format(new Date(iso), 'h:mm a');
}

export function formatConversationDate(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return format(date, 'h:mm a');
  if (differenceInCalendarDays(new Date(), date) <= 7) return format(date, 'EEE');
  return format(date, 'MMM d');
}

export function formatDayHeading(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d');
}

export function formatLongDate(iso: string): string {
  return format(new Date(iso), 'MMMM d, yyyy');
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}