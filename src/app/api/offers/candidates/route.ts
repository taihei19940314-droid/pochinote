import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { detectInactiveCustomers } from "@/lib/inactive-customers";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createAdminClient();
    const now = new Date();

    // サロン設定を取得
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("inactive_threshold_days, min_resend_interval_days")
      .eq("id", DEFAULT_SALON_ID)
      .single();

    if (salonError || !salon) {
      return NextResponse.json({ error: "salon not found" }, { status: 404 });
    }

    const inactiveThresholdDays = salon.inactive_threshold_days ?? 60;
    const minResendIntervalDays = salon.min_resend_interval_days ?? 7;

    // 顧客一覧(LINE連携済み + followed のみ)
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id, name, line_user_id, line_follow_status, last_visit_at")
      .eq("salon_id", DEFAULT_SALON_ID);

    if (customersError) {
      return NextResponse.json({ error: "failed to fetch customers" }, { status: 500 });
    }

    // ペット一覧
    const customerIds = (customers ?? []).map((c) => c.id);
    const { data: pets, error: petsError } =
      customerIds.length > 0
        ? await supabase
            .from("pets")
            .select("customer_id, name, breed")
            .in("customer_id", customerIds)
        : { data: [], error: null };

    if (petsError) {
      return NextResponse.json({ error: "failed to fetch pets" }, { status: 500 });
    }

    // 再送禁止期間内の送信履歴
    const cutoff = new Date(now.getTime() - minResendIntervalDays * 24 * 60 * 60 * 1000);
    const { data: recentOffers, error: offersError } = await supabase
      .from("offer_recipients")
      .select("customer_id, sent_at")
      .eq("salon_id", DEFAULT_SALON_ID)
      .gte("sent_at", cutoff.toISOString());

    if (offersError) {
      return NextResponse.json({ error: "failed to fetch offer history" }, { status: 500 });
    }

    const candidates = detectInactiveCustomers({
      now,
      customers: customers ?? [],
      pets: pets ?? [],
      recentOffers: recentOffers ?? [],
      inactiveThresholdDays,
      minResendIntervalDays,
    });

    return NextResponse.json({
      candidates,
      summary: {
        total: candidates.length,
        inactiveThresholdDays,
        minResendIntervalDays,
      },
    });
  } catch {
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
