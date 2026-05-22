import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/utils/supabase/admin";
import { detectInactiveCustomers } from "@/lib/inactive-customers";

export const dynamic = "force-dynamic";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const jst = new Date(d.getTime() + 9 * 3600_000);
  const M = jst.getUTCMonth() + 1;
  const D = jst.getUTCDate();
  const w = WEEKDAY_LABELS[jst.getUTCDay()];
  return `${M}/${D}(${w})`;
}

export default async function OffersPreviewPage() {
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

  const candidates = detectInactiveCustomers({
    now,
    customers: customers ?? [],
    pets: pets ?? [],
    recentOffers: recentOffers ?? [],
    inactiveThresholdDays,
    minResendIntervalDays,
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
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          離脱気味のお客様
        </h1>
        <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {inactiveThresholdDays}日以上未来店
        </span>
      </div>

      {candidates.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-3xl mb-4">🎉</div>
          <div className="font-semibold mb-2">離脱気味のお客様はいません</div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            全員が{inactiveThresholdDays}日以内にご来店されています。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {candidates.map((c) => (
            <div key={c.customerId} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.customerName}</div>
                  <div className="text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>
                    {c.petName}
                    {c.petBreed ? `（${c.petBreed}）` : ""}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="text-lg font-bold tabular-nums"
                    style={{ color: "var(--sage)" }}
                  >
                    {c.daysSinceLastVisit}日
                  </div>
                  <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    最終来店 {formatDate(c.lastVisitAt.toISOString())}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-center mt-2" style={{ color: "var(--ink-soft)" }}>
            {candidates.length}件 — 送信機能は近日公開予定です
          </p>
        </div>
      )}
    </div>
  );
}
