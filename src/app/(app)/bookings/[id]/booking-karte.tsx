"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function BookingKarte({
  bookingId,
  initialMemo,
}: {
  bookingId: string;
  initialMemo: string | null;
}) {
  const [memo, setMemo] = useState(initialMemo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("bookings")
      .update({ memo: memo || null })
      .eq("id", bookingId);

    setSaving(false);
    if (err) {
      setError("保存に失敗しました: " + err.message);
    } else {
      setSaved(true);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold">カルテ</h2>
        {saved && (
          <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}>
            ✓ 保存しました
          </span>
        )}
      </div>

      <textarea
        value={memo}
        onChange={(e) => { setMemo(e.target.value); setSaved(false); }}
        rows={8}
        placeholder="まだカルテが記入されていません。次回への申し送りや当日の様子を記録できます。"
        className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none focus:ring-1 leading-relaxed"
        style={{ borderColor: "rgba(26,26,46,0.15)", background: "var(--paper-warm)", color: "var(--ink)" }}
      />

      {error && (
        <p className="text-xs mt-2" style={{ color: "#c0392b" }}>{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "var(--terra)", color: "white" }}
      >
        {saving ? "保存中…" : "保存する"}
      </button>
    </div>
  );
}
