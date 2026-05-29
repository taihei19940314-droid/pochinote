"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface Props {
  bookingId: string;
  customerId: string;
  status: string;
}

export function CancelButton({ bookingId, status }: Pick<Props, "bookingId" | "status">) {
  const router = useRouter();
  const pathname = usePathname();
  const isDemoMode = pathname.startsWith("/demo");
  const [loading, setLoading] = useState(false);

  if (status !== "confirmed" && status !== "in_progress") return null;

  async function handleCancel() {
    if (isDemoMode) {
      alert("デモ画面のため、この操作はできません");
      return;
    }
    if (!window.confirm("この予約をキャンセルしますか?")) return;
    setLoading(true);
    const { error } = await createClient()
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    if (error) {
      alert("キャンセルに失敗しました: " + error.message);
      setLoading(false);
      return;
    }
    router.push(`/bookings/${bookingId}?cancelled=1`);
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading || isDemoMode}
      title={isDemoMode ? "デモ画面のため操作できません" : undefined}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink-soft)" }}
    >
      {loading ? "処理中…" : "⊘ キャンセル"}
    </button>
  );
}

export function DeleteButton({ bookingId, customerId }: Pick<Props, "bookingId" | "customerId">) {
  const router = useRouter();
  const pathname = usePathname();
  const isDemoMode = pathname.startsWith("/demo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (isDemoMode) {
      alert("デモ画面のため、この操作はできません");
      return;
    }
    if (!window.confirm(
      "本当に削除しますか?\nこの操作は取り消せません。\nキャンセルの場合は「⊘ キャンセル」ボタンを使ってください。"
    )) return;
    setLoading(true);
    setError(null);
    const { error: err } = await createClient()
      .from("bookings")
      .delete()
      .eq("id", bookingId);
    if (err) {
      setError("削除に失敗しました: " + err.message);
      setLoading(false);
      return;
    }
    router.push(`/customers/${customerId}?deleted=1`);
  }

  return (
    <div className="mt-6 mb-8 text-center">
      {error && (
        <p className="text-xs mb-2" style={{ color: "#c0392b" }}>{error}</p>
      )}
      <button
        onClick={handleDelete}
        disabled={loading || isDemoMode}
        title={isDemoMode ? "デモ画面のため操作できません" : undefined}
        className="text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-70"
        style={{ color: "#78716c" }}
      >
        {loading ? "削除中…" : "🗑️ この予約を完全に削除する"}
      </button>
    </div>
  );
}
