import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Deterministic "slots left for today" per service (same day + same serviceId = same number).
 * Used for urgency messaging on book and checkout. Replace with real inventory when available.
 */
export function getSlotsLeftForToday(
  serviceId: string,
  min: number = 3,
  max: number = 12
): number {
  const today = new Date().toISOString().slice(0, 10);
  const seed = `${today}-${serviceId}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const range = max - min + 1;
  return min + (Math.abs(hash) % range);
}
