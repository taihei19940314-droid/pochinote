export type BookingStatus = "completed" | "in_progress" | "confirmed" | "cancelled";

export const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  completed:   { label: "完了",     bg: "rgba(107,142,127,0.15)", color: "var(--sage)" },
  in_progress: { label: "施術中",   bg: "rgba(217,119,87,0.15)",  color: "var(--terra-deep)" },
  confirmed:   { label: "予約確定", bg: "rgba(58,58,106,0.12)",   color: "var(--indigo)" },
  cancelled:   { label: "キャンセル", bg: "rgba(26,26,46,0.08)",  color: "var(--ink-soft)" },
};

export function getStatusBadge(status: string) {
  return STATUS_BADGE[status] ?? { label: status, bg: "rgba(26,26,46,0.08)", color: "var(--ink-soft)" };
}

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "confirmed",   label: "予約確定" },
  { value: "completed",   label: "完了" },
  { value: "in_progress", label: "施術中" },
  { value: "cancelled",   label: "キャンセル" },
];
