// ================================================================
// 空き枠検出ロジック — 純粋関数
// DB アクセス・Date.now() 禁止。引数で全てを受け取る。
// タイムゾーン: JST(UTC+9)固定。ISO 8601 + "+09:00" 方式で変換。
// ================================================================

export type Booking = {
  scheduled_at: string; // ISO 8601 (timestamptz, UTC)
  duration_min: number | null;
  status: string;
};

export type BusinessSettings = {
  business_hours_start: string;    // "HH:MM" (JST)
  business_hours_end: string;      // "HH:MM" (JST)
  closed_weekdays: number[];       // 0=日曜, ..., 6=土曜
  default_slot_minutes: number;
  min_lead_time_minutes: number;
};

export type AvailableSlot = {
  date: string;             // "YYYY-MM-DD" (JST カレンダー日付)
  start: string;            // ISO 8601 (UTC)
  end: string;              // ISO 8601 (UTC)
  duration_minutes: number;
  slot_count: number;       // floor(duration_minutes / default_slot_minutes)
};

// JST カレンダー日付 + JST 時刻 → UTC の Date オブジェクト
// ISO 8601 の "+09:00" タイムゾーン指定を利用した明示的変換
export function jstDateTimeToUtc(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00+09:00`);
}

// Date オブジェクト → JST カレンダー日付文字列 "YYYY-MM-DD"
export function getJstDateStr(d: Date): string {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const Y = jst.getUTCFullYear();
  const M = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const D = String(jst.getUTCDate()).padStart(2, "0");
  return `${Y}-${M}-${D}`;
}

// "YYYY-MM-DD"(JST) の曜日を返す (0=日, 6=土)
// JST カレンダー日付は UTC midnight の曜日と同一
function getWeekdayOfJstDate(dateStr: string): number {
  const [Y, M, D] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(Y, M - 1, D)).getUTCDay();
}

// 占有区間のマージ (ソート済みを前提とする)
function mergeIntervals(
  intervals: { start: Date; end: Date }[]
): { start: Date; end: Date }[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: { start: Date; end: Date }[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start.getTime() <= last.end.getTime()) {
      last.end = new Date(Math.max(last.end.getTime(), sorted[i].end.getTime()));
    } else {
      merged.push({ start: sorted[i].start, end: sorted[i].end });
    }
  }
  return merged;
}

export function detectAvailableSlots(args: {
  targetDates: string[];  // "YYYY-MM-DD" (JST)
  now: Date;
  settings: BusinessSettings;
  bookings: Booking[];
}): AvailableSlot[] {
  const { targetDates, now, settings, bookings } = args;
  const {
    business_hours_start,
    business_hours_end,
    closed_weekdays,
    default_slot_minutes,
    min_lead_time_minutes,
  } = settings;

  const todayJst = getJstDateStr(now);
  const slotMs = default_slot_minutes * 60 * 1000;
  const leadTimeMs = min_lead_time_minutes * 60 * 1000;

  // cancelled 以外の予約だけを対象にする
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");

  const results: AvailableSlot[] = [];

  for (const date of targetDates) {
    // 定休日チェック
    if (closed_weekdays.includes(getWeekdayOfJstDate(date))) continue;

    // 営業開始・終了を UTC Date に変換
    const openUtc = jstDateTimeToUtc(date, business_hours_start);
    const closeUtc = jstDateTimeToUtc(date, business_hours_end);

    // 当日のみリードタイムを適用
    let effectiveOpen = openUtc;
    if (date === todayJst) {
      const minStart = new Date(now.getTime() + leadTimeMs);
      if (minStart.getTime() > effectiveOpen.getTime()) {
        effectiveOpen = minStart;
      }
    }

    // リードタイム適用後に営業時間が消えた場合はスキップ
    if (effectiveOpen.getTime() >= closeUtc.getTime()) continue;

    // 占有区間の収集
    const occupied: { start: Date; end: Date }[] = [];
    for (const booking of activeBookings) {
      const bStart = new Date(booking.scheduled_at);
      const durationMs =
        (booking.duration_min ?? default_slot_minutes) * 60 * 1000;
      const bEnd = new Date(bStart.getTime() + durationMs);

      // [effectiveOpen, closeUtc] と重ならないものはスキップ
      if (bEnd.getTime() <= effectiveOpen.getTime()) continue;
      if (bStart.getTime() >= closeUtc.getTime()) continue;

      occupied.push({
        start: new Date(Math.max(bStart.getTime(), effectiveOpen.getTime())),
        end: new Date(Math.min(bEnd.getTime(), closeUtc.getTime())),
      });
    }

    const merged = mergeIntervals(occupied);

    // 空き区間を計算
    let cursor = effectiveOpen;
    for (const interval of merged) {
      if (cursor.getTime() < interval.start.getTime()) {
        const durationMs = interval.start.getTime() - cursor.getTime();
        const durationMinutes = durationMs / 60000;
        if (durationMs >= slotMs) {
          results.push({
            date,
            start: cursor.toISOString(),
            end: interval.start.toISOString(),
            duration_minutes: durationMinutes,
            slot_count: Math.floor(durationMinutes / default_slot_minutes),
          });
        }
      }
      if (interval.end.getTime() > cursor.getTime()) {
        cursor = interval.end;
      }
    }

    // 最後の空き区間
    if (cursor.getTime() < closeUtc.getTime()) {
      const durationMs = closeUtc.getTime() - cursor.getTime();
      const durationMinutes = durationMs / 60000;
      if (durationMs >= slotMs) {
        results.push({
          date,
          start: cursor.toISOString(),
          end: closeUtc.toISOString(),
          duration_minutes: durationMinutes,
          slot_count: Math.floor(durationMinutes / default_slot_minutes),
        });
      }
    }
  }

  return results;
}
