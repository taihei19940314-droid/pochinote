"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { use } from "react";

// TODO: 認証実装後、ログイン中のサロンIDに置き換える
const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export default function NewPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pet, setPet] = useState({
    name: "", breed: "", birth_date: "", weight_kg: "", rabies_vaccination_date: "", notes: "",
  });

  function setP(field: keyof typeof pet, value: string) {
    setPet((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pet.name.trim()) { setError("ペット名は必須です"); return; }
    setSaving(true);
    setError(null);

    const { error: err } = await createClient().from("pets").insert({
      salon_id: DEFAULT_SALON_ID,
      customer_id: id,
      name: pet.name.trim(),
      breed: pet.breed.trim() || null,
      birth_date: pet.birth_date || null,
      weight_kg: pet.weight_kg ? parseFloat(pet.weight_kg) : null,
      rabies_vaccination_date: pet.rabies_vaccination_date || null,
      notes: pet.notes.trim() || null,
    });

    if (err) {
      setError("登録に失敗しました: " + err.message);
      setSaving(false);
      return;
    }
    router.push(`/customers/${id}?updated=1`);
  }

  const inputClass = "w-full px-3 py-3 min-h-[48px] rounded-lg border text-base outline-none focus:ring-1";
  const inputStyle = { borderColor: "rgba(26,26,46,0.15)", background: "white" };
  const labelClass = "block text-xs font-medium mb-1.5";
  const labelStyle = { color: "var(--ink-soft)" };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href={`/customers/${id}`} className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        ← 顧客詳細に戻る
      </Link>
      <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight mb-8">ペットを追加</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <div className="space-y-4">
            <div>
              <label className={labelClass} style={labelStyle}>ペット名 <span style={{ color: "var(--terra)" }}>*</span></label>
              <input type="text" required value={pet.name} onChange={(e) => setP("name", e.target.value)}
                placeholder="モカ" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>犬種</label>
              <input type="text" value={pet.breed} onChange={(e) => setP("breed", e.target.value)}
                placeholder="トイプードル" className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={labelStyle}>生年月日</label>
                <input type="date" value={pet.birth_date} onChange={(e) => setP("birth_date", e.target.value)}
                  className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>体重 (kg)</label>
                <input type="number" step="0.1" min="0" value={pet.weight_kg} onChange={(e) => setP("weight_kg", e.target.value)}
                  placeholder="3.2" className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>狂犬病ワクチン接種日</label>
              <input type="date" value={pet.rabies_vaccination_date} onChange={(e) => setP("rabies_vaccination_date", e.target.value)}
                className={inputClass} style={inputStyle} />
              {pet.rabies_vaccination_date && Date.now() - new Date(pet.rabies_vaccination_date).getTime() > 365 * 24 * 60 * 60 * 1000 && (
                <p className="text-xs mt-1 font-medium" style={{ color: "#c0392b" }}>⚠ 接種から1年以上経過しています</p>
              )}
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>注意事項</label>
              <textarea value={pet.notes} onChange={(e) => setP("notes", e.target.value)}
                placeholder="例：噛み癖あり、シャンプー嫌い" rows={3}
                className={inputClass + " resize-none"} style={inputStyle} />
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(192,57,43,0.08)", color: "#c0392b" }}>{error}</div>
        )}

        <div className="flex gap-3">
          <Link href={`/customers/${id}`} className="flex-1">
            <span className="block w-full text-center px-5 py-3.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-black/5"
              style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink)" }}>
              キャンセル
            </span>
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 px-5 py-3.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--terra)", color: "white" }}>
            {saving ? "追加中…" : "ペットを追加"}
          </button>
        </div>
      </form>
    </div>
  );
}
