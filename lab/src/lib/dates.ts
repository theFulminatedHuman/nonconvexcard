/**
 * Local-calendar date helpers.
 *
 * Progress is recorded against the learner's *local* calendar day, not UTC:
 * a problem solved at 23:30 belongs to that evening, not to tomorrow. All
 * functions therefore use the local components of `Date`, and dates are passed
 * around as `YYYY-MM-DD` strings, which sort lexicographically.
 */

export type IsoDate = string; // YYYY-MM-DD

export function toIsoDate(d: Date): IsoDate {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromIsoDate(s: IsoDate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function today(): IsoDate {
  return toIsoDate(new Date());
}

export function addDays(s: IsoDate, n: number): IsoDate {
  const d = fromIsoDate(s);
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

/** Whole days from `a` to `b`; negative when `b` precedes `a`. */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  const ms = fromIsoDate(b).getTime() - fromIsoDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(s: IsoDate): number {
  return fromIsoDate(s).getDay();
}

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function monthOf(s: IsoDate): number {
  return Number(s.slice(5, 7)) - 1;
}

export function yearOf(s: IsoDate): number {
  return Number(s.slice(0, 4));
}

export function formatLongDate(s: IsoDate): string {
  const d = fromIsoDate(s);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
