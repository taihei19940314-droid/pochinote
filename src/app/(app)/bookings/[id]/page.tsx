import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import BookingKarte from "./booking-karte";
import { CancelButton, DeleteButton } from "./booking-actions";
import { formatBookingTime } from "@/lib/format-booking-time";
import { getStatusBadge } from "@/lib/booking-status";

// TODO: 認証実装後、ログイン中のサロンIDに置き換える
const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string; cancelled?: string }>;
}) {
  const { id } = await params;
  const { created, updated, cancelled } = await searchParams;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id, scheduled_at, status, price, duration_min, services, memo,
      customer:customer_id(id, name, phone, line_user_id),
      pet:pet_id(id, name, species, breed),
      staff:staff_id(name)
    `)
    .eq("id", id)
    .eq("salon_id", DEFAULT_SALON_ID)
    .single();

  if (!booking) notFound();

  const customer = (booking.customer as unknown) as { id: string; name: string; phone: string | null; line_user_id: string | null } | null;
  const pet = (booking.pet as unknown) as { id: string; name: string; species: string | null; breed: string | null } | null;
  const staff = (booking.staff as unknown) as { name: string } | null;
  const services = (booking.services as string[] | null) ?? [];
  const statusBadge = getStatusBadge(booking.status as string);
  const petLabel = [pet?.name, pet?.breed ?? pet?.species].filter(Boolean).join(" / ");

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">

      {/* Back */}
      <Link
        href={customer ? `/customers/${customer.id}` : "/customers"}
        className="inline-flex items-center gap-1 text-sm mb-4"
        style={{ color: "var(--ink-soft)" }}
      >
        ← 顧客カルテに戻る
      </Link>

      {created === "1" && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}>
          ✓ 来店記録を作成しました。カルテを記入できます。
        </div>
      )}
      {updated === "1" && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}>
          ✓ 予約情報を更新しました
        </div>
      )}
      {cancelled === "1" && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "rgba(26,26,46,0.07)", color: "var(--ink-soft)" }}>
          ✓ 予約をキャンセルしました
        </div>
      )}

      <Link
        href={customer ? `/customers/${customer.id}` : "/customers"}
        className="block mb-6 hover:opacity-70 transition-opacity"
      >
        <h1 className="font-display text-2xl font-light tracking-tight">
          {customer?.name ?? "—"}
          {petLabel && <span className="text-lg font-normal" style={{ color: "var(--ink-soft)" }}> / {petLabel}</span>}
        </h1>
      </Link>

      {/* 基本情報 */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">基本情報</h2>
          <div className="flex items-center gap-2">
            <CancelButton bookingId={id} status={booking.status as string} />
            <Link href={`/bookings/${id}/edit`}>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/5"
                style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink-soft)" }}>
                ✏️ 編集
              </span>
            </Link>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span style={{ color: "var(--ink-soft)" }}>来店日時</span>
            <span className="font-mono font-medium">{formatBookingTime(booking.scheduled_at, booking.duration_min as number | null)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: "var(--ink-soft)" }}>ステータス</span>
            <span className="pill text-[11px]" style={{ background: statusBadge.bg, color: statusBadge.color }}>
              {statusBadge.label}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: "var(--ink-soft)" }}>料金</span>
            <span className="font-mono font-semibold">
              {booking.price != null ? `¥${(booking.price as number).toLocaleString()}` : "未設定"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: "var(--ink-soft)" }}>担当スタッフ</span>
            <span className="font-medium">{staff?.name ?? "未設定"}</span>
          </div>
          {services.length > 0 && (
            <div className="flex justify-between items-start gap-4">
              <span style={{ color: "var(--ink-soft)" }}>メニュー</span>
              <span className="font-medium text-right">{services.join("・")}</span>
            </div>
          )}
          {booking.duration_min != null && (
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--ink-soft)" }}>所要時間</span>
              <span className="font-medium">{booking.duration_min as number}分</span>
            </div>
          )}
        </div>
      </div>

      {/* カルテ */}
      <BookingKarte bookingId={id} initialMemo={booking.memo as string | null} />

      {/* 削除 */}
      <DeleteButton bookingId={id} customerId={customer?.id ?? ""} />
    </div>
  );
}
