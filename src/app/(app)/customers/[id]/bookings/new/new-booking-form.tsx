"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const SERVICE_OPTIONS = [
  { value: "full_course", label: "フルコース" },
  { value: "partial_cut", label: "部分カット" },
  { value: "nail", label: "爪切り" },
  { value: "shampoo", label: "シャンプーのみ" },
  { value: "ear_cleaning", label: "耳掃除" },
];

const STATUS_OPTIONS = [
  { value: "completed", label: "完了" },
  { value: "in_progress", label: "施術中" },
  { value: "confirmed", label: "予約確定" },
];

function toJstValue(d: Date): string {
  // Shift to JST wall-clock, then read via UTC getters — environment-independent
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}T${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
}

function defaultDatetime(mode: "booking" | "record"): string {
  if (mode === "booking") {
    // Tomorrow 10:00 JST
    const now = new Date();
    const tomorrowJst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    tomorrowJst.setUTCDate(tomorrowJst.getUTCDate() + 1);
    tomorrowJst.setUTCHours(10, 0, 0, 0);
    // tomorrowJst now holds JST 10:00 as UTC values; un-shift to get real UTC
    const utc = new Date(tomorrowJst.getTime() - 9 * 60 * 60 * 1000);
    return toJstValue(utc);
  }
  return toJstValue(new Date());
}

interface Pet { id: string; name: string; breed: string | null }
interface Staff { id: string; name: string }

export default function NewBookingForm({
  customerId,
  salonId,
  pets,
  staff,
  mode = "record",
}: {
  customerId: string;
  salonId: string;
  pets: Pet[];
  staff: Staff[];
  mode?: "booking" | "record";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scheduledAt, setScheduledAt] = useState(() => defaultDatetime(mode));
  const [petId, setPetId] = useState(pets[0]?.id ?? "");
  const [status, setStatus] = useState(mode === "booking" ? "confirmed" : "completed");
  const [staffId, setStaffId] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [memo, setMemo] = useState("");

  function toggleService(val: string) {
    setServices((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!petId) { setError("ペットを選択してください"); return; }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("bookings")
      .insert({
        salon_id: salonId,
        customer_id: customerId,
        pet_id: petId,
        staff_id: staffId || null,
        scheduled_at: scheduledAt + ":00+09:00",
        status,
        services: services.length > 0 ? services : null,
        price: price ? parseInt(price, 10) : null,
        duration_min: durationMin ? parseInt(durationMin, 10) : null,
        memo: memo.trim() || null,
      })
      .select("id")
      .single();

    if (err || !data) {
      setError("登録に失敗しました: " + (err?.message ?? "不明なエラー"));
      setLoading(false);
      return;
    }

    router.push(`/bookings/${data.id}?created=1`);
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1";
  const inputStyle = { borderColor: "rgba(26,26,46,0.15)", background: "white" };
  const labelClass = "block text-xs font-medium mb-1.5";
  const labelStyle = { color: "var(--ink-soft)" };

  if (pets.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm mb-4" style={{ color: "var(--ink-soft)" }}>
          先にペットを登録してください。
        </p>
        <Link href={`/customers/${customerId}/edit`}>
          <span className="inline-flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--terra)", color: "white" }}>
            顧客情報を編集する
          </span>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* 必須項目 */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold mb-4">基本情報</h2>
        <div className="space-y-4">

          <div>
            <label className={labelClass} style={labelStyle}>
              来店日時 <span style={{ color: "var(--terra)" }}>*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              ペット <span style={{ color: "var(--terra)" }}>*</span>
            </label>
            <select
              required
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              disabled={pets.length === 1}
              className={inputClass}
              style={{ ...inputStyle, appearance: "auto" }}
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.breed ? ` (${p.breed})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              ステータス <span style={{ color: "var(--terra)" }}>*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
              style={{ ...inputStyle, appearance: "auto" }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 任意項目 */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold mb-4">詳細(任意)</h2>
        <div className="space-y-4">

          <div>
            <label className={labelClass} style={labelStyle}>担当スタッフ</label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className={inputClass}
              style={{ ...inputStyle, appearance: "auto" }}
            >
              <option value="">未指定</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>メニュー</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SERVICE_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors select-none"
                  style={
                    services.includes(o.value)
                      ? { background: "var(--terra)", color: "white" }
                      : { background: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }
                  }
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={services.includes(o.value)}
                    onChange={() => toggleService(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>料金 (円)</label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="8800"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>所要時間 (分)</label>
              <input
                type="number"
                min="0"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="90"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>備考</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="当日の様子など"
              className={inputClass + " resize-none"}
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
              カルテは登録後にゆっくり書けます
            </p>
          </div>

        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(192,57,43,0.08)", color: "#c0392b" }}>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/customers/${customerId}`} className="flex-1">
          <span className="block w-full text-center px-5 py-3 rounded-lg text-sm font-semibold border transition-colors hover:bg-black/5"
            style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink)" }}>
            キャンセル
          </span>
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-5 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--terra)", color: "white" }}
        >
          {loading ? "登録中…" : mode === "booking" ? "予約を作成" : "来店記録を追加"}
        </button>
      </div>

    </form>
  );
}
