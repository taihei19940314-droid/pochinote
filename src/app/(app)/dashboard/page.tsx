import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { OfferEngineWidget } from "./offer-engine-widget";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";
const SALON_NAME = "ぽちのてトリミング";

export const dynamic = "force-dynamic";

// ---- helpers ----

function getJstNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 11) return "おはようございます";
  if (hour >= 11 && hour < 18) return "こんにちは";
  return "こんばんは"; // 18:00〜4:59
}

function getDateLabel(jst: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const y = jst.getFullYear();
  const m = String(jst.getMonth() + 1).padStart(2, "0");
  const d = String(jst.getDate()).padStart(2, "0");
  return `${y} / ${m} / ${d} — ${days[jst.getDay()]}`;
}

function toHHMM(iso: string): string {
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;
}

function calcAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = new Date();
  let y = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) y--;
  return `${y}歳`;
}

const SERVICE_LABELS: Record<string, string> = {
  full_course: "フルコース",
  partial_cut: "部分カット",
  nail: "爪切り",
  shampoo: "シャンプーのみ",
  ear_cleaning: "耳掃除",
};

const GENDER_MARK: Record<string, string> = { male: "♂", female: "♀" };

// ---- page ----

export default async function DashboardPage() {
  const supabase = await createClient();

  // JST today range in UTC
  const jstNow = getJstNow();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstMidnightUtc = new Date(
    Date.UTC(jstNow.getFullYear(), jstNow.getMonth(), jstNow.getDate()) - jstOffset
  );
  const tomorrowMidnightUtc = new Date(jstMidnightUtc.getTime() + 24 * 60 * 60 * 1000);

  const { data: rawBookings } = await supabase
    .from("bookings")
    .select(`
      id, scheduled_at, status, services, price, duration_min, memo,
      pet:pet_id(name, breed, gender, birth_date, notes),
      customer:customer_id(id, name)
    `)
    .eq("salon_id", DEFAULT_SALON_ID)
    .gte("scheduled_at", jstMidnightUtc.toISOString())
    .lt("scheduled_at", tomorrowMidnightUtc.toISOString())
    .order("scheduled_at", { ascending: true });

  type BookingRow = {
    id: string;
    scheduled_at: string;
    status: string;
    services: string[] | null;
    price: number | null;
    duration_min: number | null;
    memo: string | null;
    pet: { name: string; breed: string | null; gender: string | null; birth_date: string | null; notes: string | null } | null;
    customer: { id: string; name: string } | null;
  };

  const bookings: BookingRow[] = (rawBookings ?? []).map((b) => ({
    ...b,
    pet: Array.isArray(b.pet) ? b.pet[0] ?? null : (b.pet as BookingRow["pet"]),
    customer: Array.isArray(b.customer) ? b.customer[0] ?? null : (b.customer as BookingRow["customer"]),
    services: b.services as string[] | null,
  }));

  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const inProgressCount = bookings.filter((b) => b.status === "in_progress").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  // 予約希望件数(response_type='booked' かつ未承認)
  const adminSupabase = createAdminClient();
  const { count: bookingRequestCount } = await adminSupabase
    .from("offer_recipients")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", DEFAULT_SALON_ID)
    .eq("status", "booked");

  // LINE 連携待ち件数
  const { count: pendingMatchCount } = await adminSupabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", DEFAULT_SALON_ID)
    .not("line_user_id", "is", null)
    .eq("line_follow_status", "followed")
    .like("name", "(未特定%")
    .eq("ignored", false);

  const firstTime = bookings.length > 0 ? toHHMM(bookings[0].scheduled_at) : null;
  const lastTime = bookings.length > 0 ? toHHMM(bookings[bookings.length - 1].scheduled_at) : null;

  const hour = jstNow.getHours();
  const greeting = getGreeting(hour);
  const dateLabel = getDateLabel(jstNow);

  return (
    <div className="max-w-5xl mx-auto py-4 lg:py-8 px-3 lg:px-4">

      {/* ── Hero strip ── */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-5 mb-6 lg:mb-8">

        {/* Greeting */}
        <div className="lg:col-span-7 mb-5 lg:mb-0">
          <div className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>{dateLabel}</div>
          <h1 className="font-display text-[32px] lg:text-[40px] leading-[1.1] font-light tracking-tight">
            {greeting}、<br />
            <span className="italic whitespace-nowrap" style={{ color: "var(--terra)" }}>{SALON_NAME}さん</span>。<br />
            {bookings.length > 0
              ? <span className="whitespace-nowrap">今日は <span className="font-semibold">{bookings.length}</span> 件の予約。</span>
              : <span className="whitespace-nowrap">今日の予約はまだありません。</span>
            }
          </h1>
          {(bookingRequestCount ?? 0) > 0 && (
            <Link href="/line/offers/pending"
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "rgba(217,119,87,0.12)", color: "var(--terra)" }}>
              📩 予約希望 {bookingRequestCount}件
            </Link>
          )}
          {firstTime && lastTime && (
            <p className="text-sm mt-3" style={{ color: "var(--ink-soft)" }}>
              {firstTime}〜{lastTime} のスケジュール。
            </p>
          )}
        </div>

        {/* KPI cards — Coming Soon */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-3 lg:gap-4">
          {/* 稼働率 */}
          <div className="card p-4 lg:p-5 relative overflow-hidden">
            <div className="text-[10px] lg:text-[11px] tracking-wider uppercase mb-2 lg:mb-3" style={{ color: "var(--ink-soft)" }}>本日の稼働率</div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl lg:text-5xl font-light opacity-20">—</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--paper-warm)" }}>
              <div className="h-full rounded-full w-0" style={{ background: "var(--terra)" }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full" style={{ background: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }}>準備中</span>
            </div>
          </div>

          {/* 売上 */}
          <div className="card p-4 lg:p-5 relative overflow-hidden">
            <div className="text-[10px] lg:text-[11px] tracking-wider uppercase mb-2 lg:mb-3" style={{ color: "var(--ink-soft)" }}>本日売上(見込)</div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl lg:text-4xl font-light opacity-20">—</span>
            </div>
            <div className="flex items-end gap-0.5 mt-3 h-8 opacity-10">
              {[40,55,35,70,50,60,85].map((h, i) => (
                <div key={i} className="bar-muted flex-1" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full" style={{ background: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }}>準備中</span>
            </div>
          </div>

          {/* 空き枠オファー */}
          <div className="card p-4 lg:p-5 relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--paper)" }}>
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <div className="text-[10px] lg:text-[11px] tracking-wider uppercase opacity-70">空き枠オファー</div>
              <span className="w-2 h-2 rounded-full opacity-40" style={{ background: "var(--terra)" }} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl lg:text-5xl font-light opacity-20">—</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full" style={{ background: "rgba(250,247,242,0.1)", color: "rgba(250,247,242,0.6)" }}>準備中</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-5">

        {/* ── 予約タイムライン ── */}
        <div className="lg:col-span-7 card p-4 lg:p-6 mb-5 lg:mb-0">
          <div className="flex items-start justify-between mb-4 lg:mb-5">
            <div>
              <h2 className="font-display text-xl lg:text-2xl font-semibold tracking-tight">本日の予約</h2>
              {bookings.length > 0 && firstTime && lastTime && (
                <div className="text-xs mt-1 font-mono" style={{ color: "var(--ink-soft)" }}>
                  {bookings.length} 件 / {firstTime} — {lastTime}
                </div>
              )}
            </div>
            {bookings.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs flex-wrap justify-end">
                {completedCount > 0 && (
                  <span className="pill" style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}>完了 {completedCount}</span>
                )}
                {inProgressCount > 0 && (
                  <span className="pill" style={{ background: "rgba(217,119,87,0.15)", color: "var(--terra)" }}>施術中 {inProgressCount}</span>
                )}
                {confirmedCount > 0 && (
                  <span className="pill" style={{ background: "rgba(26,26,46,0.08)", color: "var(--ink-soft)" }}>予定 {confirmedCount}</span>
                )}
              </div>
            )}
          </div>

          {bookings.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: "var(--ink-soft)" }}>
              本日の予約はありません
            </div>
          ) : (
            <div className="space-y-0">
              {bookings.map((b, i) => {
                const pet = b.pet;
                const customer = b.customer;
                const isCompleted = b.status === "completed";
                const isInProgress = b.status === "in_progress";
                const services = (b.services ?? []).map((s) => SERVICE_LABELS[s] ?? s).join(" + ");
                const age = pet?.birth_date ? calcAge(pet.birth_date) : null;
                const gender = pet?.gender ? (GENDER_MARK[pet.gender] ?? "") : "";
                const petLabel = [pet?.breed, gender, age].filter(Boolean).join(" ");
                const isLast = i === bookings.length - 1;

                return (
                  <Link key={b.id} href={`/bookings/${b.id}`}>
                    <div
                      className={[
                        "flex items-center gap-3 py-3 rounded-lg transition-colors",
                        !isLast ? "border-b" : "",
                        isCompleted ? "opacity-60" : "",
                        isInProgress ? "-mx-3 px-3" : "",
                      ].join(" ")}
                      style={{
                        borderColor: "rgba(26,26,46,0.05)",
                        background: isInProgress
                          ? "linear-gradient(90deg, rgba(217,119,87,0.07), transparent)"
                          : undefined,
                      }}
                    >
                      {/* 時刻 */}
                      <div
                        className="font-mono text-xs w-12 flex-shrink-0"
                        style={{ color: isInProgress ? "var(--terra)" : "var(--ink-soft)", fontWeight: isInProgress ? 600 : 400 }}
                      >
                        {toHHMM(b.scheduled_at)}
                      </div>

                      {/* ドット */}
                      <div className="dot flex-shrink-0" style={{
                        background: isCompleted ? "var(--sage)"
                          : isInProgress ? "var(--terra)"
                          : "rgba(26,26,46,0.25)"
                      }} />

                      {/* アイコン */}
                      <div className="dog-avatar flex-shrink-0">🐕</div>

                      {/* 情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-snug">
                          {pet?.name ?? "—"}
                          {petLabel && (
                            <span className="text-xs font-normal ml-1" style={{ color: "var(--ink-soft)" }}>
                              / {petLabel}
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: "var(--ink-soft)" }}>
                          {services && <span>{services}</span>}
                          {customer?.name && <span>· {customer.name}様</span>}
                          {isInProgress && (
                            <span className="pill" style={{ background: "var(--terra)", color: "white" }}>施術中</span>
                          )}
                          {pet?.notes && (
                            <span className="pill" style={{ background: "rgba(200,155,60,0.18)", color: "var(--gold)" }}>
                              ⚠ {pet.notes.slice(0, 12)}{pet.notes.length > 12 ? "…" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 金額 */}
                      {b.price != null && (
                        <div
                          className="text-xs font-mono flex-shrink-0"
                          style={{ color: isInProgress ? "var(--terra)" : "var(--ink-soft)", fontWeight: isInProgress ? 600 : 400 }}
                        >
                          ¥{b.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* LINE 連携待ちバナー */}
          {(pendingMatchCount ?? 0) > 0 && (
            <Link href="/line/pending-matches"
              className="card p-4 flex items-center gap-3 transition-all hover:shadow-md active:scale-[0.98]"
              style={{ borderLeft: "3px solid var(--terra)" }}>
              <span className="text-2xl">🔔</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">LINE 連携待ち</p>
                <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                  友だち追加された方の顧客紐付けが必要です
                </p>
              </div>
              <span className="flex-shrink-0 text-sm font-bold px-2.5 py-1 rounded-full"
                style={{ background: "var(--terra)", color: "white" }}>
                {pendingMatchCount}件
              </span>
            </Link>
          )}

          {/* AUTO OFFER ENGINE */}
          <OfferEngineWidget bookingRequestCount={bookingRequestCount ?? 0} />

          {/* 気になるサイン — 準備中 */}
          <div className="card p-5 lg:p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg lg:text-xl font-semibold tracking-tight">気になるサイン</h2>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full" style={{ background: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }}>準備中</span>
            </div>

            <div className="space-y-2">
              {["ワクチン期限切れのお知らせ", "60日以上来店なし・再来促進", "誕生日メッセージ自動送信"].map((label) => (
                <div key={label} className="flex gap-3 p-3 rounded-lg opacity-40" style={{ background: "rgba(26,26,46,0.04)" }}>
                  <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: "rgba(26,26,46,0.08)" }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>{label}</div>
                    <div className="h-2 rounded-full w-32 mt-1.5" style={{ background: "rgba(26,26,46,0.07)" }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs mt-4 text-center" style={{ color: "var(--ink-soft)" }}>
              顧客データと連携して、見落としゼロへ。
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
