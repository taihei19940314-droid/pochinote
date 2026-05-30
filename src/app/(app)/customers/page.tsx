import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { type CustomerRow } from "./customers-list";
import { CustomersTabs, type PendingRow } from "./customers-tabs-client";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export const dynamic = "force-dynamic";

function isUnidentified(name: string | null): boolean {
  return !name || name.startsWith("(未特定");
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; tab?: string }>;
}) {
  const { registered } = await searchParams;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const [{ data: customers }, { data: salonData }, { data: completedBookings }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, phone, line_user_id, line_follow_status, line_followed_at, ignored, pets(id, name, breed, gender, birth_date, weight_kg, notes, rabies_vaccination_date)")
      .eq("salon_id", DEFAULT_SALON_ID)
      .order("created_at", { ascending: false }),
    adminSupabase
      .from("salons")
      .select("inactive_threshold_days")
      .eq("id", DEFAULT_SALON_ID)
      .single(),
    supabase
      .from("bookings")
      .select("customer_id, scheduled_at")
      .eq("salon_id", DEFAULT_SALON_ID)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false }),
  ]);

  const inactiveThresholdDays: number = (salonData?.inactive_threshold_days as number | null) ?? 60;

  const lastVisitMap: Record<string, string> = {};
  for (const b of completedBookings ?? []) {
    if (!lastVisitMap[b.customer_id]) lastVisitMap[b.customer_id] = b.scheduled_at;
  }

  const allCustomers = customers ?? [];

  // 本人特定済み
  const identified: CustomerRow[] = allCustomers
    .filter((c) => !isUnidentified(c.name))
    .map((c) => ({
      id: c.id,
      name: c.name!,
      phone: c.phone,
      line_user_id: c.line_user_id,
      pets: (c.pets as CustomerRow["pets"]) ?? [],
      lastVisitDate: lastVisitMap[c.id] ?? null,
    }));

  // 未特定 LINE ユーザー(pending-matches と同じ条件: followed + ignored=false)
  const pending: PendingRow[] = allCustomers
    .filter(
      (c) =>
        isUnidentified(c.name) &&
        c.line_user_id &&
        c.line_follow_status === "followed" &&
        c.ignored === false
    )
    .map((c) => ({
      id: c.id,
      name: c.name ?? "(未特定 LINE ユーザー)",
      line_follow_status: c.line_follow_status,
      line_followed_at: c.line_followed_at,
    }));

  return (
    <div className="max-w-3xl mx-auto py-6 lg:py-8 px-0 lg:px-2">
      <div className="flex items-center justify-between mb-5 lg:mb-6 px-1 lg:px-0">
        <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">顧客カルテ</h1>
        <Link href="/customers/new">
          <span className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--terra)", color: "white", minHeight: 44 }}>
            + 新規登録
          </span>
        </Link>
      </div>

      {registered === "1" && (
        <div className="mb-4 px-1 lg:px-0">
          <div className="px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}>
            ✓ 顧客を登録しました
          </div>
        </div>
      )}

      <CustomersTabs identified={identified} pending={pending} inactiveThresholdDays={inactiveThresholdDays} />
    </div>
  );
}
