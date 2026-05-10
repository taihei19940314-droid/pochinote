import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import BookingKarte from "./booking-karte";

// TODO: 認証実装後、ログイン中のサロンIDに置き換える
const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const statusBadge = {
    completed: { label: "完了", bg: "rgba(107,142,127,0.15)", color: "var(--sage)" },
    in_progress: { label: "施術中", bg: "rgba(217,119,87,0.15)", color: "var(--terra-deep)" },
    confirmed: { label: "予約確定", bg: "rgba(58,58,106,0.12)", color: "var(--indigo)" },
  }[booking.status as string] ?? { label: booking.status, bg: "rgba(26,26,46,0.08)", color: "var(--ink-soft)" };

  const petLabel = [pet?.name, pet?.breed ?? pet?.species].filter(Boolean).join(" / ");

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">

      {/* Back + title */}
      <Link
        href={customer ? `/customers/${customer.id}` : "/customers"}
        className="inline-flex items-center gap-1 text-sm mb-4"
        style={{ color: "var(--ink-soft)" }}
      >
        ← 顧客カルテに戻る
      </Link>

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
        <h2 className="font-display text-lg font-semibold mb-4">基本情報</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span style={{ color: "var(--ink-soft)" }}>来店日時</span>
            <span className="font-mono font-medium">{formatDateTime(booking.scheduled_at)}</span>
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

      {/* カルテ(Client Component) */}
      <BookingKarte bookingId={id} initialMemo={booking.memo as string | null} />
    </div>
  );
}
