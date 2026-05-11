function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

function timeStr(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
