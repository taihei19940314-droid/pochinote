import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/utils/supabase/admin";
import { detectInactiveCustomers } from "@/lib/inactive-customers";
import { getJstDateStr } from "@/lib/availability";
import { PreviewClient, type SlotInfo, type EmptySummary } from "./preview-client";

export const dynamic = "force-dynamic";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function toHHMM(iso: string): string {
  const jst = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return `${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;
}

function buildDateLabel(startIso: string, now: Date): string {
  const slotDate = getJstDateStr(new Date(startIso));
  const todayJst = getJstDateStr(now);
  const tomorrowJst = getJstDateStr(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  if (slotDate === todayJst) return "今日";
  if (slotDate === tomorrowJst) return "明日";

  const [Y, M, D] = slotDate.split("-").map(Number);
  const w = WEEKDAY_LABELS[new Date(Date.UTC(Y, M - 1, D)).getUTCDay()];
  return `${M}/${D}(${w})`;
}

function parseSlotInfo(
  start: string | undefined,
  end: string | undefined,
  slotCount: string | undefined,
  now: Date,
): SlotInfo | undefined {
  if (!start || !end || !slotCount) return undefined;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const count = parseInt(slotCount, 10);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(count)) return undefined;
  return {
    dateLabel: buildDateLabel(start, now),
    startHHMM: toHHMM(start),
    endHHMM: toHHMM(end),
    slotCount: count,
  };
}

export default async function OffersPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; slotCount?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const now = new Date();

  const { data: salon } = await supabase
    .from("salons")
    .select("inactive_threshold_days, min_resend_interval_days")
    .eq("id", DEFAULT_SALON_ID)
    .single();

  const inactiveThresholdDays = salon?.inactive_threshold_days ?? 60;
  const minResendIntervalDays = salon?.min_resend_interval_days ?? 7;

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, line_user_id, line_follow_status, last_visit_at")
    .eq("salon_id", DEFAULT_SALON_ID);

  const customerIds = (customers ?? []).map((c) => c.id);
  const { data: pets } =
    customerIds.length > 0
      ? await supabase
          .from("pets")
          .select("customer_id, name, breed")
          .in("customer_id", customerIds)
      : { data: [] };

  const cutoff = new Date(now.getTime() - minResendIntervalDays * 24 * 60 * 60 * 1000);
  const { data: recentOffers } = await supabase
    .from("offer_recipients")
    .select("customer_id, sent_at")
    .eq("salon_id", DEFAULT_SALON_ID)
    .gte("sent_at", cutoff.toISOString());

  const allCustomers = customers ?? [];

  // 0件サマリー計算(未特定 LINE ユーザーを除く)
  const linkedFollowed = allCustomers.filter(
    (c) =>
      c.line_user_id &&
      c.line_follow_status === "followed" &&
      c.name &&
      !c.name.startsWith("(未特定")
  );
  const emptySummary: EmptySummary = {
    totalLinkedCustomers: linkedFollowed.length,
    customersWithoutVisitHistory: linkedFollowed.filter((c) => !c.last_visit_at).length,
    inactiveThresholdDays,
  };

  const identifiedCustomers = allCustomers.filter(
    (c) => c.name && !c.name.startsWith("(未特定")
  );

  const candidates = detectInactiveCustomers({
    now,
    customers: identifiedCustomers,
    pets: pets ?? [],
    recentOffers: recentOffers ?? [],
    inactiveThresholdDays,
    minResendIntervalDays,
  });

  const slotInfo = parseSlotInfo(params.start, params.end, params.slotCount, now);

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
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          離脱気味のお客様
        </h1>
        <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {inactiveThresholdDays}日以上未来店
        </span>
      </div>

      <PreviewClient
        candidates={candidates}
        slotInfo={slotInfo}
        emptySummary={emptySummary}
      />
    </div>
  );
}
