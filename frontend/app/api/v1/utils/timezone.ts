/**
 * Get current day of week (0 = Sunday, 6 = Saturday) and time (HH:mm) in Africa/Lagos.
 * Use this for barber availability so it matches Nigerian local time even when server is in UTC.
 */
export function getNowInLagos(): { currentDay: number; currentTime: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  const y = parseInt(get('year'), 10);
  const m = parseInt(get('month'), 10) - 1;
  const d = parseInt(get('day'), 10);
  const currentDay = new Date(y, m, d).getDay();
  const currentTime = `${get('hour')}:${get('minute')}`;
  return { currentDay, currentTime };
}

/**
 * Format a Prisma Time (Date) as "HH:mm". Prisma returns TIME columns as Date with epoch date;
 * use UTC hours/minutes to get the stored time.
 */
export function formatTimeHHmm(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}
