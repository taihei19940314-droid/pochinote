export type LineFollowStatus = "followed" | "unfollowed" | "blocked" | null;
export type LineTone = "success" | "warning" | "muted";

export interface LineStatusResult {
  label: string;
  tone: LineTone;
}

export function formatLineStatus(
  lineUserId: string | null,
  lineFollowStatus: LineFollowStatus,
  lineFollowedAt: string | null
): LineStatusResult {
  if (lineFollowStatus === "followed") {
    const datePart = lineFollowedAt
      ? formatJst(lineFollowedAt)
      : "";
    const suffix = datePart ? `(${datePart} 友だち追加)` : "";
    return { label: `✅ 連携済み${suffix}`, tone: "success" };
  }

  if (lineFollowStatus === "unfollowed") {
    return { label: "⚠️ 連携解除済み", tone: "warning" };
  }

  if (lineFollowStatus === "blocked") {
    return { label: "⚠️ ブロック中", tone: "warning" };
  }

  if (!lineUserId && !lineFollowStatus) {
    return { label: "未連携", tone: "muted" };
  }

  // line_user_id はあるが status が未設定などの防御ケース
  return { label: "保留中", tone: "muted" };
}

function formatJst(isoString: string): string {
  return new Date(isoString).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function toneColor(tone: LineTone): string {
  switch (tone) {
    case "success": return "var(--sage)";
    case "warning": return "var(--terra)";
    case "muted":   return "var(--ink-soft)";
  }
}
