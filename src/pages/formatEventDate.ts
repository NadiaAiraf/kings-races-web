const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format an ISO date (YYYY-MM-DD) as "Sat 14 Nov 2026", with no timezone shifts. */
export function formatEventDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]} ${d} ${MONTHS[m - 1]} ${y}`;
}
