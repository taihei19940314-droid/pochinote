import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/utils/supabase/admin";
import { getJstDateStr } from "@/lib/availability";
import { PendingClient, type PendingRecipient } from "./pending-client";

export const dynamic = "force-dynamic";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function toHHMM(iso: string): string {
  const jst = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return `${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;
}

function buildDateLabel(isoUtc: string, now: Date): string {
  const slotDate = getJstDateStr(new Date(isoUtc));
  const todayJst = getJstDateStr(now);
  const tomorrowJst = getJstDateStr(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  if (slotDate === todayJst) return "今日";
  if (slotDate === tomorrowJst) return "明日";

  const [Y, M, D] = slotDate.split("-").map(Number);
  const w = WEEKDAY_LABELS[new Date(Date.UTC(Y, M - 1, D)).getUTCDay()];
  return `${M}/${D}(${w})`;
}

export default async function PendingPage() {
  const supabase = createAdminClient();
  const now = new Date();

  // status='booked' の予約希望を取得(customers + pets + offers JOIN)
  const { data: rawRecipients } = await supabase
    .from("offer_recipients")
    .select(`
      id,
      offer_id,
      booked_at,
      customer_id,
      customers(name),
      offers(available_from),
      pets:customer_id(pets(name, breed))
    `)
    .eq("salon_id", DEFAULT_SALON_ID)
    .eq("status", "booked")
    .order("booked_at", { ascending: false });

  // 各 offer_id の booked カウント(競合検出)
  const offerIds = [...new Set((rawRecipients ?? []).map((r) => r.offer_id as string))];
  const competingMap = new Map<string, number>();
  if (offerIds.length > 0) {
    const { data: allBooked } = await supabase
      .from("offer_recipients")
      .select("offer_id")
      .in("offer_id", offerIds)
      .eq("status", "booked");

    for (const r of allBooked ?? []) {
      const oid = r.offer_id as string;
      competingMap.set(oid, (competingMap.get(oid) ?? 0) + 1);
    }
  }

  // customers + pets を別クエリで取得(JOIN がネストするため)
  const customerIds = [...new Set((rawRecipients ?? []).map((r) => r.customer_id as string))];
  const { data: customers } = customerIds.length > 0
    ? await supabase
        .from("customers")
        .select("id, name")
        .in("id", customerIds)
    : { data: [] };

  const { data: pets } = customerIds.length > 0
    ? await supabase
        .from("pets")
        .select("customer_id, name, breed")
        .in("customer_id", customerIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const customerMap = new Map((customers ?? []).map((c) => [c.id, c.name as string]));
  const petMap = new Map(
    (pets ?? []).map((p) => [
      p.customer_id as string,
      { name: p.name as string, breed: p.breed as string | null },
    ]),
  );

  const recipients: PendingRecipient[] = (rawRecipients ?? []).flatMap((r) => {
    const offer = Array.isArray(r.offers) ? r.offers[0] : r.offers;
    const availableFrom = offer?.available_from as string | undefined;
    if (!availableFrom) return [];

    const offerId = r.offer_id as string;
    const totalBooked = competingMap.get(offerId) ?? 1;
    // 自分を除いた競合件数
    const competingCount = totalBooked - 1;

    const customerId = r.customer_id as string;
    const pet = petMap.get(customerId);

    return [
      {
        id: r.id as string,
        offerId,
        bookedAt: r.booked_at as string,
        customerName: customerMap.get(customerId) ?? "不明",
        petName: pet?.name ?? "不明",
        petBreed: pet?.breed ?? null,
        slotDateLabel: buildDateLabel(availableFrom, now),
        slotStartHHMM: toHHMM(availableFrom),
        competingCount,
      } satisfies PendingRecipient,
    ];
  });

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/line/offers"
        className="inline-flex items-center gap-1 text-sm mb-6 transition-opacity hover:opacity-70"
        style={{ color: "var(--ink-soft)" }}
      >
        <ChevronLeft size={16} />
        オファー候補に戻る
      </Link>

      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">予約希望</h1>
        {recipients.length > 0 && (
          <span
            className="text-sm font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: "var(--terra)", color: "white" }}
          >
            {recipients.length}件
          </span>
        )}
      </div>

      <PendingClient recipients={recipients} />
    </div>
  );
}
