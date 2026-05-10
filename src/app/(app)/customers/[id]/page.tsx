import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const { updated } = await searchParams;
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

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, scheduled_at, services, price, status, memo, staff:staff_id(name)")
    .eq("customer_id", id)
    .in("status", ["completed", "in_progress"])
    .order("scheduled_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        ← 顧客カルテに戻る
      </Link>

      {updated === "1" && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}>
          ✓ 更新しました
        </div>
      )}

      {/* Section 1: 飼い主情報 */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">飼い主情報</h2>
          <Link href={`/customers/${id}/edit`}>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/5"
              style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink-soft)" }}>
              ✏️ 編集
            </span>
          </Link>
        </div>
        <h1 className="font-display text-3xl font-light tracking-tight mb-4">{customer.name}</h1>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--ink-soft)" }}>電話番号</span>
            <span className="font-medium">{customer.phone ?? "未登録"}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--ink-soft)" }}>LINE ID</span>
            <span className="font-medium">{customer.line_user_id ?? "未登録"}</span>
          </div>
        </div>
      </div>

      {/* Section 2: ペット情報 */}
      <div className="space-y-4 mb-5">
        {(pets ?? []).length === 0 ? (
          <div className="card p-6 text-sm text-center" style={{ color: "var(--ink-soft)" }}>
            ペット情報がありません
          </div>
        ) : (
          (pets ?? []).map((pet) => {
            const warn = rabiesExpired(pet.rabies_vaccination_date);
            return (
              <div key={pet.id} className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ background: "var(--paper-warm)" }}>🐕</div>
                  <div>
                    <div className="font-display text-xl font-semibold">{pet.name}</div>
                    {pet.breed && <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{pet.breed}</div>}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {pet.birth_date && (
                    <div className="flex justify-between">
                      <span style={{ color: "var(--ink-soft)" }}>年齢</span>
                      <span className="font-medium">{calcAge(pet.birth_date)}</span>
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
          })
        )}
      </div>

      {/* Section 3: 来店履歴 */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(26,26,46,0.06)" }}>
          <h2 className="font-display text-lg font-semibold">来店履歴</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>{(bookings ?? []).length} 件</span>
            <Link href={`/customers/${id}/bookings/new`}>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
                style={{ background: "var(--terra)", color: "white" }}>
                + 来店記録
              </span>
            </Link>
          </div>
        </div>
        {(bookings ?? []).length === 0 ? (
          <div className="px-6 py-12 text-center text-sm" style={{ color: "var(--ink-soft)" }}>
            まだ来店履歴がありません
          </div>
        ) : (
          <div>
            {(bookings ?? []).map((b, i) => {
              const staff = (b.staff as unknown) as { name: string } | null;
              const services = (b.services as string[] | null) ?? [];
              return (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="block px-6 py-4 transition-colors hover:bg-[rgba(217,119,87,0.04)]"
                  style={{ borderTop: i > 0 ? "1px solid rgba(26,26,46,0.05)" : undefined }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{formatDate(b.scheduled_at)}</span>
                        {b.status === "in_progress" ? (
                          <span className="pill text-[10px]" style={{ background: "rgba(217,119,87,0.15)", color: "var(--terra-deep)" }}>施術中</span>
                        ) : (
                          <span className="pill text-[10px]" style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}>完了</span>
                        )}
                      </div>
                      {services.length > 0 && (
                        <div className="text-sm mb-0.5">{services.join("・")}</div>
                      )}
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--ink-soft)" }}>
                        {staff?.name && <span>担当: {staff.name}</span>}
                        {b.memo && <span>{b.memo}</span>}
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
  );
}
