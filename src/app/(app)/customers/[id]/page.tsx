import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { formatBookingTime } from "@/lib/format-booking-time";
import { getStatusBadge } from "@/lib/booking-status";

// TODO: 認証実装後、ログイン中のサロンIDに置き換える
const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

function calcAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  return `${years}歳${months}ヶ月`;
}

function rabiesExpired(date: string | null): boolean {
  if (!date) return false;
  return Date.now() - new Date(date).getTime() > 365 * 24 * 60 * 60 * 1000;
}

const TZ = "Asia/Tokyo";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("ja-JP", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const time = d.toLocaleTimeString("ja-JP", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} ${time}`;
}

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; deleted?: string }>;
}) {
  const { id } = await params;
  const { updated, deleted } = await searchParams;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, phone, line_user_id, notes")
    .eq("id", id)
    .eq("salon_id", DEFAULT_SALON_ID)
    .single();

  if (!customer) notFound();

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, breed, gender, birth_date, weight_kg, notes, rabies_vaccination_date")
    .eq("customer_id", id);

  const [{ data: bookings }, { data: upcomingBookings }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, scheduled_at, services, price, status, duration_min, memo, staff:staff_id(name)")
      .eq("customer_id", id)
      .in("status", ["completed", "in_progress", "cancelled"])
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("id, scheduled_at, services, price, status, duration_min, staff:staff_id(name)")
      .eq("customer_id", id)
      .eq("status", "confirmed")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true }),
  ]);

  // キャンセル率の集計 (confirmed は除く)
  const allBookings = bookings ?? [];
  const visitCount = allBookings.filter((b) => b.status === "completed" || b.status === "in_progress").length;
  const cancelCount = allBookings.filter((b) => b.status === "cancelled").length;
  const totalForRate = visitCount + cancelCount;
  const cancelRate = totalForRate > 0 ? Math.round((cancelCount / totalForRate) * 100) : 0;
  const showStats = totalForRate >= 3;

  return (
    <div>
      {/* Sticky compact header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-3 lg:px-4 border-b"
        style={{ background: "var(--paper)", minHeight: 48, boxShadow: "0 1px 0 rgba(26,26,46,0.08)" }}>
        <Link href="/customers" className="flex items-center gap-1.5 text-sm font-medium py-2 pr-4"
          style={{ color: "var(--ink-soft)" }}>
          ← {customer.name}
        </Link>
        <Link href={`/customers/${id}/edit`}>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/5"
            style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink-soft)" }}>
            ✏️ 編集
          </span>
        </Link>
      </div>

    <div className="max-w-3xl mx-auto pt-2 pb-6 lg:py-8 px-3 lg:px-4">
      <Link href="/customers" className="hidden lg:inline-flex items-center gap-1 text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        ← 顧客カルテに戻る
      </Link>

      {updated === "1" && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}>
          ✓ 更新しました
        </div>
      )}
      {deleted === "1" && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "rgba(26,26,46,0.07)", color: "var(--ink-soft)" }}>
          予約を削除しました
        </div>
      )}

      {/* Section 1: 飼い主情報 */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">飼い主情報</h2>
          {/* 編集ボタンは PC のみ表示(モバイルは sticky バーに表示) */}
          <Link href={`/customers/${id}/edit`} className="hidden lg:block">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/5"
              style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink-soft)" }}>
              ✏️ 編集
            </span>
          </Link>
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-light tracking-tight mb-4">{customer.name}</h1>
        <div className="space-y-2 text-base lg:text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--ink-soft)" }}>電話番号</span>
            <span className="font-medium">{customer.phone ?? "未登録"}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--ink-soft)" }}>LINE ID</span>
            <span className="font-medium">{customer.line_user_id ?? "未登録"}</span>
          </div>
          {showStats && (
            <div className="flex justify-between pt-2 mt-2" style={{ borderTop: "1px solid rgba(26,26,46,0.06)" }}>
              <span style={{ color: "var(--ink-soft)" }}>来店統計</span>
              <span
                className="font-medium text-right"
                style={{ color: cancelRate >= 30 ? "#c0392b" : "var(--ink-soft)" }}
              >
                来店 {visitCount} 回 / キャンセル {cancelCount} 回
                <span className="ml-1 text-xs">(キャンセル率 {cancelRate}%)</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: ペット情報 */}
      <div className="space-y-4 mb-5">
        {(pets ?? []).map((pet) => {
          const warn = rabiesExpired(pet.rabies_vaccination_date);
          return (
            <div key={pet.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ background: "var(--paper-warm)" }}>🐕</div>
                  <div>
                    <div className="font-display text-xl font-semibold">{pet.name}</div>
                    {pet.breed && <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{pet.breed}</div>}
                  </div>
                </div>
                <Link href={`/customers/${id}/pets/${pet.id}/edit`}>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/5"
                    style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink-soft)" }}>
                    ✏️ 編集
                  </span>
                </Link>
              </div>
              <div className="space-y-2 text-sm">
                {pet.birth_date && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--ink-soft)" }}>年齢</span>
                    <span className="font-medium">
                        {calcAge(pet.birth_date)}
                        <span className="font-normal text-xs ml-1" style={{ color: "var(--ink-soft)" }}>({formatDate(pet.birth_date)}生)</span>
                      </span>
                  </div>
                )}
                {pet.weight_kg != null && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--ink-soft)" }}>体重</span>
                    <span className="font-medium">{pet.weight_kg} kg</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--ink-soft)" }}>狂犬病ワクチン</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {pet.rabies_vaccination_date ? formatDate(pet.rabies_vaccination_date) : "未登録"}
                    </span>
                    {warn && (
                      <span className="pill text-[10px]" style={{ background: "rgba(192,57,43,0.12)", color: "#c0392b" }}>
                        ⚠ 期限切れ
                      </span>
                    )}
                  </div>
                </div>
                {pet.notes && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(26,26,46,0.06)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--ink-soft)" }}>注意事項</div>
                    <span className="pill text-[11px]" style={{ background: "rgba(200,155,60,0.15)", color: "var(--gold)" }}>
                      ⚠ {pet.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ペット追加カード */}
        <Link href={`/customers/${id}/pets/new`}>
          <div className="rounded-xl p-5 flex items-center gap-3 cursor-pointer transition-colors hover:bg-[rgba(217,119,87,0.04)]"
            style={{ border: "2px dashed rgba(217,119,87,0.35)" }}>
            <div className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ background: "rgba(217,119,87,0.08)" }}>
              <span className="text-xl" style={{ color: "var(--terra)" }}>+</span>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--terra)" }}>ペットを追加</div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>2匹目以降のペットを登録できます</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Section 3: 次回予約 */}
      <div className="card overflow-hidden mb-5">
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(26,26,46,0.06)" }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="font-display text-lg font-semibold">次回予約</h2>
            <span className="text-xs font-mono flex-shrink-0" style={{ color: "var(--ink-soft)" }}>{(upcomingBookings ?? []).length} 件</span>
          </div>
          <Link href={`/customers/${id}/bookings/new?mode=booking`} className="block">
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "var(--terra)", color: "white" }}>
              + 予約を作成
            </span>
          </Link>
        </div>
        {(upcomingBookings ?? []).length === 0 ? (
          <div className="px-6 py-8 text-center text-sm" style={{ color: "var(--ink-soft)" }}>
            次回予約はありません
          </div>
        ) : (
          <div>
            {(upcomingBookings ?? []).map((b, i) => {
              const staff = (b.staff as unknown) as { name: string } | null;
              const services = (b.services as string[] | null) ?? [];
              return (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="block px-6 py-4 transition-colors hover:bg-[rgba(58,58,106,0.04)]"
                  style={{ borderTop: i > 0 ? "1px solid rgba(26,26,46,0.05)" : undefined }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{formatBookingTime(b.scheduled_at, b.duration_min as number | null)}</span>
                        <span className="pill text-[10px]" style={{ background: "rgba(58,58,106,0.12)", color: "var(--indigo)" }}>予約確定</span>
                      </div>
                      {services.length > 0 && (
                        <div className="text-sm mb-0.5">{services.join("・")}</div>
                      )}
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--ink-soft)" }}>
                        {staff?.name && <span>担当: {staff.name}</span>}
                        {(b.duration_min as number | null) != null && <span>{b.duration_min as number}分</span>}
                      </div>
                    </div>
                    {(b.price as number | null) != null && (
                      <div className="font-mono text-sm font-semibold flex-shrink-0">
                        ¥{(b.price as number).toLocaleString()}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 4: 来店履歴 */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(26,26,46,0.06)" }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="font-display text-lg font-semibold">来店履歴</h2>
            <span className="text-xs font-mono flex-shrink-0" style={{ color: "var(--ink-soft)" }}>
              {allBookings.length} 件{cancelCount > 0 && `(キャンセル ${cancelCount})`}
            </span>
          </div>
          <Link href={`/customers/${id}/bookings/new`} className="block">
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "var(--terra)", color: "white" }}>
              + 来店記録を追加
            </span>
          </Link>
        </div>
        {allBookings.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm" style={{ color: "var(--ink-soft)" }}>
            まだ来店履歴がありません
          </div>
        ) : (
          <div>
            {allBookings.map((b, i) => {
              const isCancelled = b.status === "cancelled";
              const staff = (b.staff as unknown) as { name: string } | null;
              const services = (b.services as string[] | null) ?? [];
              return (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="block px-6 py-4 transition-colors hover:bg-[rgba(217,119,87,0.04)]"
                  style={{
                    borderTop: i > 0 ? "1px solid rgba(26,26,46,0.05)" : undefined,
                    opacity: isCancelled ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{formatBookingTime(b.scheduled_at, b.duration_min as number | null)}</span>
                        {(() => { const badge = getStatusBadge(b.status as string); return (
                          <span className="pill text-[10px]" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                        ); })()}
                      </div>
                      {services.length > 0 && (
                        <div className="text-sm mb-0.5">{services.join("・")}</div>
                      )}
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--ink-soft)" }}>
                        {staff?.name && <span>担当: {staff.name}</span>}
                        {b.memo && <span className="truncate max-w-[160px]">{b.memo}</span>}
                      </div>
                    </div>
                    {b.price != null && (
                      <div className="font-mono text-sm font-semibold flex-shrink-0">
                        ¥{(b.price as number).toLocaleString()}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
