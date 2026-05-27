const TZ = "Asia/Tokyo";

function dateStr(d: Date): string {
  return d.toLocaleDateString("ja-JP", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
}

function timeStr(d: Date): string {
  return d.toLocaleTimeString("ja-JP", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatBookingRange(
  scheduledAt: string,
  durationMin: number | null,
  defaultSlotMinutes: number,
): { start: string; end: string } {
  const startDate = new Date(scheduledAt);
  const end = new Date(startDate.getTime() + (durationMin ?? defaultSlotMinutes) * 60_000);
  return { start: timeStr(startDate), end: timeStr(end) };
}

export function formatBookingTime(scheduledAt: string, durationMin: number | null): string {
  const start = new Date(scheduledAt);
  const datePart = dateStr(start);
  const startTime = timeStr(start);

  if (durationMin == null) {
    return `${datePart} ${startTime} 〜`;
  }

  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  return `${datePart} ${startTime} 〜 ${timeStr(end)}`;
}
