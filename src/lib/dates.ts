const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format an ISO date (YYYY-MM-DD) as "Sat 14 Nov 2026", with no timezone
 * shifts. Returns '' for anything that is not a real calendar date.
 */
export function formatEventDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return '';
  return `${DAYS[date.getDay()]} ${d} ${MONTHS[m - 1]} ${y}`;
}

/** The local calendar date of `date` as YYYY-MM-DD. */
export function toLocalIsoDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/**
 * CSV export filename: the round's name and date when known, so exports of
 * different rounds never share a name; otherwise today's date.
 */
export function exportFilename(event: { name: string; date: string } | null, now: Date): string {
  if (!event) return `kings-races-${toLocalIsoDate(now)}.csv`;
  const slug = event.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const date = event.date || toLocalIsoDate(now);
  return slug ? `kings-races-${slug}-${date}.csv` : `kings-races-${date}.csv`;
}
