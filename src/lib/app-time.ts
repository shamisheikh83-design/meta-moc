// The app runs on one clock everywhere: Pakistan Standard Time (GMT+5, no daylight saving).
// "Which day is it", "which day was this visit" and every shown date/time go through
// here, so a phone set to another time zone still files and reads visits on PKT days.

export const APP_TIME_ZONE = "Asia/Karachi";
export const APP_TIME_ZONE_LABEL = "PKT (GMT+5)";
const OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function shifted(input: string | Date) {
  return new Date(new Date(input).getTime() + OFFSET_MS);
}

/** yyyy-mm-dd of an instant on the app clock. A plain yyyy-mm-dd string is returned as is. */
export function appDateKey(input: string | Date = new Date()): string {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return shifted(input).toISOString().slice(0, 10);
}

/** yyyy-mm of an instant on the app clock. */
export function appMonthKey(input: string | Date = new Date()): string {
  return appDateKey(input).slice(0, 7);
}

/** Hour of the day (0-23) on the app clock. */
export function appHour(input: string | Date = new Date()): number {
  return shifted(input).getUTCHours();
}

/** Day of the week (0 = Sunday) of a yyyy-mm-dd key. */
export function dateKeyWeekday(key: string): number {
  return new Date(`${key}T00:00:00Z`).getUTCDay();
}

/** Move a yyyy-mm-dd key by whole days. */
export function addDaysToDateKey(key: string, days: number): string {
  return new Date(new Date(`${key}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Move a yyyy-mm key by whole months. */
export function addMonthsToMonthKey(monthKey: string, months: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return d.toISOString().slice(0, 7);
}

/** The instant an app-clock day starts (00:00 PKT), as epoch ms. */
export function appDayStartMs(key: string): number {
  return new Date(`${key}T00:00:00Z`).getTime() - OFFSET_MS;
}

/**
 * A device-local Date sitting on the same calendar day as the key. Use it only for
 * calendar widgets and date-only labels, which read the local year/month/day.
 */
export function localDateFromKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

/** ISO timestamp for "this app-clock date, at the current app-clock time of day". */
export function appTimestampOnDate(dateKey: string, now: Date = new Date()): string {
  const timeOfDay = shifted(now).toISOString().slice(11, 19);
  return new Date(`${dateKey}T${timeOfDay}+05:00`).toISOString();
}

export function formatAppDateTime(input: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(input).toLocaleString(undefined, { ...options, timeZone: APP_TIME_ZONE });
}

export function formatAppDate(input: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(input).toLocaleDateString(undefined, { ...options, timeZone: APP_TIME_ZONE });
}

export function formatAppTime(input: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(input).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", ...options, timeZone: APP_TIME_ZONE });
}
