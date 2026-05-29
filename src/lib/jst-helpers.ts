const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 与えられた UTC Date から、JST における当日の開始(00:00 JST)と
 * 翌日の開始(00:00 JST)を UTC Date で返す。
 * +9h して getUTC* を使うため Vercel(UTC実行環境)でも正しく動く。
 */
export function getJstDayRange(now: Date): { dayStart: Date; dayEnd: Date } {
  const jstShifted = new Date(now.getTime() + JST_OFFSET_MS);
  const y = jstShifted.getUTCFullYear();
  const m = jstShifted.getUTCMonth();
  const d = jstShifted.getUTCDate();
  const dayStart = new Date(Date.UTC(y, m, d) - JST_OFFSET_MS);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  return { dayStart, dayEnd };
}
