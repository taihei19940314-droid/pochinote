"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { createClient } from "@/utils/supabase/client";
import { STATUS_OPTIONS } from "@/lib/booking-status";

// TODO: 認証実装後、ログイン中のサロンIDに置き換える
const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

const SERVICE_OPTIONS = [
  { value: "full_course",   label: "フルコース" },
  { value: "partial_cut",   label: "部分カット" },
  { value: "nail",          label: "爪切り" },
  { value: "shampoo",       label: "シャンプーのみ" },
  { value: "ear_cleaning",  label: "耳掃除" },
];

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  d.setSeconds(0, 0);
  // ISO → local datetime-local value
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Pet   { id: string; name: string; breed: string | null }
interface Staff { id: string; name: string }

export default function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pets, setPets] = useState<Pet[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customerId, setCustomerId] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [petId, setPetId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [durationMin, setDurationMin] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("bookings")
      .select("scheduled_at, status, pet_id, staff_id, services, price, duration_min, customer_id")
      .eq("id", id)
      .single()
      .then(async ({ data: b }) => {
        if (!b) { router.replace("/customers"); return; }
        setCustomerId(b.customer_id);
        setScheduledAt(toLocalDatetime(b.scheduled_at));
        setStatus(b.status ?? "confirmed");
        setPetId(b.pet_id ?? "");
        setStaffId(b.staff_id ?? "");
        setServices((b.services as string[] | null) ?? []);
        setPrice(b.price != null ? String(b.price) : "");
        setDurationMin(b.duration_min != null ? String(b.duration_min) : "");

        const [{ data: petList }, { data: staffList }] = await Promise.all([
          supabase.from("pets").select("id, name, breed").eq("customer_id", b.customer_id),
          supabase.from("staff").select("id, name").eq("salon_id", DEFAULT_SALON_ID),
        ]);
        setPets(petList ?? []);
        setStaff(staffList ?? []);
        setLoading(false);
      });
  }, [id, router]);

  function toggleService(val: string) {
    setServices((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: err } = await createClient()
      .from("bookings")
      .update({
        scheduled_at: new Date(scheduledAt).toISOString(),
        status,
        pet_id: petId || null,
        staff_id: staffId || null,
        services: services.length > 0 ? services : null,
        price: price ? parseInt(price, 10) : null,
        duration_min: durationMin ? parseInt(durationMin, 10) : null,
      })
      .eq("id", id);

    if (err) {
      setError("更新に失敗しました: " + err.message);
      setSaving(false);
      return;
    }
    router.push(`/bookings/${id}?updated=1`);
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
      <Link href={`/bookings/${id}`} className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        ← 予約詳細に戻る
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-8">予約情報を編集</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* 基本情報 */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold mb-4">基本情報</h2>
          <div className="space-y-4">

            <div>
              <label className={labelClass} style={labelStyle}>来店日時 <span style={{ color: "var(--terra)" }}>*</span></label>
              <input type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                className={inputClass} style={inputStyle} />
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>ステータス <span style={{ color: "var(--terra)" }}>*</span></label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className={inputClass} style={{ ...inputStyle, appearance: "auto" }}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {pets.length > 0 && (
              <div>
                <label className={labelClass} style={labelStyle}>ペット</label>
                <select value={petId} onChange={(e) => setPetId(e.target.value)}
                  className={inputClass} style={{ ...inputStyle, appearance: "auto" }}>
                  <option value="">未指定</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}{p.breed ? ` (${p.breed})` : ""}</option>
                  ))}
                </select>
              </div>
            )}

          </div>
        </div>

        {/* 詳細 */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold mb-4">詳細(任意)</h2>
          <div className="space-y-4">

            <div>
              <label className={labelClass} style={labelStyle}>担当スタッフ</label>
              <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
                className={inputClass} style={{ ...inputStyle, appearance: "auto" }}>
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
                  <label key={o.value}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors select-none"
                    style={services.includes(o.value)
                      ? { background: "var(--terra)", color: "white" }
                      : { background: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }}
                  >
                    <input type="checkbox" className="hidden"
                      checked={services.includes(o.value)}
                      onChange={() => toggleService(o.value)} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={labelStyle}>料金 (円)</label>
                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="8800" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>所要時間 (分)</label>
                <input type="number" min="0" value={durationMin} onChange={(e) => setDurationMin(e.target.value)}
                  placeholder="90" className={inputClass} style={inputStyle} />
              </div>
            </div>

          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(192,57,43,0.08)", color: "#c0392b" }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href={`/bookings/${id}`} className="flex-1">
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
