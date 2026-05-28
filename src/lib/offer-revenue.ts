const OFFER_MEMO = "LINE オファー経由";
const VALID_STATUSES = new Set(["confirmed", "completed"]);
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function calculateMonthlyOfferRevenue(
  bookings: { scheduled_at: string; status: string; price: number | null; memo: string | null }[],
  now: Date,
): number {
  // availability.ts と同方式: +9h して getUTC* で JST の年月を取得
  const nowJst = new Date(now.getTime() + JST_OFFSET_MS);
  const y = nowJst.getUTCFullYear();
  const m = nowJst.getUTCMonth();

  // JST 月初 00:00 / 翌月初 00:00 を UTC ms で算出
  const monthStartMs = Date.UTC(y, m, 1) - JST_OFFSET_MS;
  const nextMonthStartMs = Date.UTC(y, m + 1, 1) - JST_OFFSET_MS;

  return bookings.reduce((sum, b) => {
    if (b.memo !== OFFER_MEMO) return sum;
    if (!VALID_STATUSES.has(b.status)) return sum;
    const ts = new Date(b.scheduled_at).getTime();
    if (ts < monthStartMs || ts >= nextMonthStartMs) return sum;
    return sum + (b.price ?? 0);
  }, 0);
}
