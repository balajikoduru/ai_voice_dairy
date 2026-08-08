/** Local calendar date as YYYY-MM-DD (not UTC — diary days follow the user's clock). */
export function localDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** "Today" / "Yesterday" / a locale-formatted long date for a YYYY-MM-DD string. */
export function formatDayLabel(
  dateStr: string,
  locale: string,
  todayLabel: string,
  yesterdayLabel: string
): string {
  const today = new Date();
  if (dateStr === localDateString(today)) return todayLabel;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dateStr === localDateString(yesterday)) return yesterdayLabel;

  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

/** "17:29"-style local time for an ISO timestamp. */
export function formatTimeOfDay(isoTimestamp: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoTimestamp));
}
