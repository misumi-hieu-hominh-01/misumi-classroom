import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Get current date in JST (Asia/Tokyo) timezone
 */
export function getCurrentJST(): dayjs.Dayjs {
  return dayjs().tz('Asia/Tokyo');
}

/**
 * Format date as dateKey (YYYY-MM-DD) in JST
 */
export function formatDateKey(date?: dayjs.Dayjs): string {
  const jstDate = date ? date.tz('Asia/Tokyo') : getCurrentJST();
  return jstDate.format('YYYY-MM-DD');
}

/**
 * Get dateKey for today in JST
 */
export function getTodayDateKey(): string {
  return formatDateKey();
}

/**
 * Parse dateKey string to dayjs object in JST
 */
export function parseDateKey(dateKey: string): dayjs.Dayjs {
  return dayjs.tz(dateKey, 'Asia/Tokyo');
}
