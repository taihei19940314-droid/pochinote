/**
 * ブラウザ側で空き枠数をリアルタイム計算する純粋関数。
 * サーバー側の detectAvailableSlots とは独立。
 */
export function calculateSlotCount(
  startTime: string,
  endTime: string,
  slotMinutes: number,
): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (
    isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em) ||
    slotMinutes <= 0
  ) return 0;
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMinutes <= 0) return 0;
  return Math.floor(totalMinutes / slotMinutes);
}
