"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

// TODO: 認証実装後、ログイン中のサロンIDに置き換える
const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState({ name: "", phone: "", line_user_id: "" });

  useEffect(() => {
    params.then(({ id: resolvedId }) => {
      setId(resolvedId);
      createClient()
        .from("customers")
        .select("name, phone, line_user_id")
        .eq("id", resolvedId)
        .eq("salon_id", DEFAULT_SALON_ID)
        .single()
        .then(({ data: c }) => {
          if (!c) { router.replace("/customers"); return; }
          setOwner({ name: c.name ?? "", phone: c.phone ?? "", line_user_id: c.line_user_id ?? "" });
          setLoading(false);
        });
    });
  }, [params, router]);

  function setO(field: keyof typeof owner, value: string) {
    setOwner((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!owner.name.trim()) { setError("飼い主名は必須です"); return; }
    if (!id) return;

    setSaving(true);
    setError(null);
    const { error: cErr } = await createClient().from("customers").update({
      name: owner.name.trim(),
      phone: owner.phone.trim() || null,
      line_user_id: owner.line_user_id.trim() || null,
    }).eq("id", id);

    if (cErr) {
      setError("更新に失敗しました: " + cErr.message);
      setSaving(false);
      return;
    }
    router.push(`/customers/${id}?updated=1`);
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1";
  const inputStyle = { borderColor: "rgba(26,26,46,0.15)", background: "white" };
  const labelClass = "block text-xs font-medium mb-1.5";
  const labelStyle = { color: "var(--ink-soft)" };

  if (loading) return (
    <div className="max-w-2xl mx-auto py-8 px-4 text-sm" style={{ color: "var(--ink-soft)" }}>読み込み中…</div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href={`/customers/${id}`} className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        ← 詳細に戻る
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">飼い主情報を編集</h1>
      <p className="text-xs mb-8" style={{ color: "var(--ink-soft)" }}>
        ペット情報は顧客詳細画面の各ペットカードの「✏️ 編集」ボタンから個別に編集できます
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <div className="space-y-4">
            <div>
              <label className={labelClass} style={labelStyle}>名前 <span style={{ color: "var(--terra)" }}>*</span></label>
              <input type="text" required value={owner.name} onChange={(e) => setO("name", e.target.value)}
                placeholder="田中 花子" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>電話番号</label>
              <input type="tel" value={owner.phone} onChange={(e) => setO("phone", e.target.value)}
                placeholder="090-0000-0000" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>LINE ID</label>
              <input type="text" value={owner.line_user_id} onChange={(e) => setO("line_user_id", e.target.value)}
                placeholder="@hanako" className={inputClass} style={inputStyle} />
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(192,57,43,0.08)", color: "#c0392b" }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href={`/customers/${id}`} className="flex-1">
            <span className="block w-full text-center px-5 py-3 rounded-lg text-sm font-semibold border transition-colors hover:bg-black/5"
              style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink)" }}>
              キャンセル
            </span>
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 px-5 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--terra)", color: "white" }}>
            {saving ? "保存中…" : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
