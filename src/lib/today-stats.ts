import { getJstDayRange } from "./jst-helpers";

export type BookingForStats = {
  scheduled_at: string;
  duration_min: number | null;
  price: number | null;
  status: string;
};

function parseHHMM(hhmm: string): number {
  const parts = hhmm.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function isTodayJst(scheduledAt: string, dayStart: Date, dayEnd: Date): boolean {
  const ts = new Date(scheduledAt).getTime();
  return ts >= dayStart.getTime() && ts < dayEnd.getTime();
}

/**
 * 本日売上(見込)を計算する。
 * confirmed + in_progress + completed の price 合計(NULL は 0 扱い)。
 * in_progress = 施術中、当日中に completed になり売上計上される。
 */
export function calculateTodayRevenue(
  bookings: BookingForStats[],
  now: Date,
): number {
  const { dayStart, dayEnd } = getJstDayRange(now);
  return bookings.reduce((sum, b) => {
    if (!isTodayJst(b.scheduled_at, dayStart, dayEnd)) return sum;
    if (b.status !== "confirmed" && b.status !== "in_progress" && b.status !== "completed") return sum;
    return sum + (b.price ?? 0);
  }, 0);
}

/**
 * 本日の稼働率を %(0-100、整数)で返す。
 * 分子:cancelled 以外の duration_min 合計(NULL は defaultSlotMinutes で補完)
 * 分母:business hours の分換算
 * 100 超はクランプ。分母0の場合は 0 を返す。
 */
export function calculateTodayUtilization(
  bookings: BookingForStats[],
  businessHoursStart: string,
  businessHoursEnd: string,
  defaultSlotMinutes: number,
  now: Date,
): number {
  const denominator = parseHHMM(businessHoursEnd) - parseHHMM(businessHoursStart);
  if (denominator <= 0) return 0;

  const { dayStart, dayEnd } = getJstDayRange(now);
  const numerator = bookings.reduce((sum, b) => {
    if (!isTodayJst(b.scheduled_at, dayStart, dayEnd)) return sum;
    if (b.status === "cancelled") return sum;
    return sum + (b.duration_min ?? defaultSlotMinutes);
  }, 0);

  return Math.min(100, Math.round((numerator / denominator) * 100));
}
