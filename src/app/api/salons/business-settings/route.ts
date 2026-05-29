import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

// HH:MM または HH:MM:SS を受け入れる(PostgreSQL TIME 型は秒付きで返すため)
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// DB 保存前に HH:MM に正規化する
function normalizeTime(t: string): string {
  return t.slice(0, 5);
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const referer = req.headers.get("referer") ?? "";
  if (referer.includes("/demo")) {
    return NextResponse.json({ error: "デモ画面のため、この操作はできません" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { business_hours_start, business_hours_end, closed_weekdays, default_slot_minutes, min_lead_time_minutes } =
    body as Record<string, unknown>;

  // business_hours_start
  if (typeof business_hours_start !== "string" || !TIME_RE.test(business_hours_start)) {
    return NextResponse.json(
      { error: "business_hours_start は HH:MM 形式で入力してください" },
      { status: 400 }
    );
  }

  // business_hours_end
  if (typeof business_hours_end !== "string" || !TIME_RE.test(business_hours_end)) {
    return NextResponse.json(
      { error: "business_hours_end は HH:MM 形式で入力してください" },
      { status: 400 }
    );
  }

  // start < end
  if (toMinutes(business_hours_start) >= toMinutes(business_hours_end)) {
    return NextResponse.json(
      { error: "開店時刻は閉店時刻より前に設定してください" },
      { status: 400 }
    );
  }

  // closed_weekdays: array, each element 0–6 integer, no duplicates
  if (!Array.isArray(closed_weekdays)) {
    return NextResponse.json({ error: "closed_weekdays は配列で指定してください" }, { status: 400 });
  }
  for (const v of closed_weekdays) {
    if (!Number.isInteger(v) || v < 0 || v > 6) {
      return NextResponse.json(
        { error: "closed_weekdays の各値は 0〜6 の整数で指定してください" },
        { status: 400 }
      );
    }
  }
  if (new Set(closed_weekdays).size !== closed_weekdays.length) {
    return NextResponse.json(
      { error: "closed_weekdays に重複した値があります" },
      { status: 400 }
    );
  }

  // default_slot_minutes: integer 30–240
  if (
    typeof default_slot_minutes !== "number" ||
    !Number.isInteger(default_slot_minutes) ||
    default_slot_minutes < 30 ||
    default_slot_minutes > 240
  ) {
    return NextResponse.json(
      { error: "default_slot_minutes は 30〜240 の整数で指定してください" },
      { status: 400 }
    );
  }

  // min_lead_time_minutes: integer 0–1440
  if (
    typeof min_lead_time_minutes !== "number" ||
    !Number.isInteger(min_lead_time_minutes) ||
    min_lead_time_minutes < 0 ||
    min_lead_time_minutes > 1440
  ) {
    return NextResponse.json(
      { error: "min_lead_time_minutes は 0〜1440 の整数で指定してください" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("salons")
    .update({
      business_hours_start: normalizeTime(business_hours_start),
      business_hours_end: normalizeTime(business_hours_end),
      closed_weekdays,
      default_slot_minutes,
      min_lead_time_minutes,
    })
    .eq("id", DEFAULT_SALON_ID)
    .select("business_hours_start, business_hours_end, closed_weekdays, default_slot_minutes, min_lead_time_minutes")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, businessSettings: data });
}
