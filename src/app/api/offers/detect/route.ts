import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { detectAvailableSlots, getJstDateStr } from "@/lib/availability";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: Request): Promise<NextResponse> {
  const referer = request.headers.get("referer") ?? "";
  if (referer.includes("/demo")) {
    return NextResponse.json({ error: "デモ画面のため、この操作はできません" }, { status: 403 });
  }
  try {
    const supabase = createAdminClient();
    const now = new Date();

    // 営業設定を取得
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select(
        "business_hours_start, business_hours_end, closed_weekdays, default_slot_minutes, min_lead_time_minutes"
      )
      .eq("id", DEFAULT_SALON_ID)
      .single();

    if (salonError || !salon) {
      return NextResponse.json({ error: "salon not found" }, { status: 404 });
    }

    // 当日・翌日の JST 日付を生成
    const todayJst = getJstDateStr(now);
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowJst = getJstDateStr(tomorrowDate);

    // bookings 取得範囲: JST 当日 0:00 の1日前 〜 JST 翌日末尾の1日後(バッファ付き)
    // タイムゾーン境界の取り逃しをゼロにするための±1日バッファ
    const fetchFrom = new Date(`${todayJst}T00:00:00+09:00`);
    fetchFrom.setUTCDate(fetchFrom.getUTCDate() - 1);

    const fetchTo = new Date(`${tomorrowJst}T23:59:59+09:00`);
    fetchTo.setUTCDate(fetchTo.getUTCDate() + 1);

    const { data: rawBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("scheduled_at, duration_min, status")
      .eq("salon_id", DEFAULT_SALON_ID)
      .gte("scheduled_at", fetchFrom.toISOString())
      .lt("scheduled_at", fetchTo.toISOString());

    if (bookingsError) {
      return NextResponse.json({ error: "failed to fetch bookings" }, { status: 500 });
    }

    const settings = {
      business_hours_start: (salon.business_hours_start ?? "09:00").slice(0, 5),
      business_hours_end: (salon.business_hours_end ?? "18:00").slice(0, 5),
      closed_weekdays: salon.closed_weekdays ?? [],
      default_slot_minutes: salon.default_slot_minutes ?? 90,
      min_lead_time_minutes: salon.min_lead_time_minutes ?? 120,
    };

    const slots = detectAvailableSlots({
      targetDates: [todayJst, tomorrowJst],
      now,
      settings,
      bookings: rawBookings ?? [],
    });

    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
