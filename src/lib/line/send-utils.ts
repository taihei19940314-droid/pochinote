// ================================================================
// 送信ユーティリティ — 純粋関数
// DB アクセス・Date.now() 禁止。引数で全てを受け取る。
// ================================================================

// 再送禁止チェック: 最終送信から minIntervalDays 日未満なら true
export function isResendBlocked(
  lastSentAt: string | null,
  minIntervalDays: number,
  now: Date
): boolean {
  if (!lastSentAt) return false;
  const elapsed = now.getTime() - new Date(lastSentAt).getTime();
  return elapsed < minIntervalDays * 24 * 60 * 60 * 1000;
}

// UTC Date → JST 日付文字列 + 時刻文字列
export function toJstDatetime(utcDate: Date): { date: string; time: string } {
  const jst = new Date(utcDate.getTime() + 9 * 3600_000);
  const M = jst.getUTCMonth() + 1;
  const D = jst.getUTCDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const w = weekdays[jst.getUTCDay()];
  const h = String(jst.getUTCHours()).padStart(2, "0");
  const m = String(jst.getUTCMinutes()).padStart(2, "0");
  return { date: `${M}/${D}(${w})`, time: `${h}:${m}` };
}
