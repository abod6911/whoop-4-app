/**
 * Generates local date key formatted as YYYY-MM-DD based on local system time.
 * Prevents UTC timezone rollover bugs where days roll over at 03:00 AM in UTC+3.
 */
export function localDateKey(d: Date | number = new Date()): string {
  const date = typeof d === 'number' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
