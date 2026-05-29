import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

function maskSecret(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return "****" + value.slice(-4);
}

function isMasked(value: string): boolean {
  return value.startsWith("****");
}

export async function GET(): Promise<NextResponse> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("salons")
    .select(
      "line_channel_id, line_channel_secret, line_access_token, line_add_friend_url, inactive_threshold_days, min_resend_interval_days, auto_offer_enabled, business_hours_start, business_hours_end, closed_weekdays, default_slot_minutes, min_lead_time_minutes"
    )
    .eq("id", DEFAULT_SALON_ID)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "salon not found" }, { status: 404 });
  }

  return NextResponse.json({
    credentials: {
      line_channel_id: data.line_channel_id ?? "",
      line_channel_secret: maskSecret(data.line_channel_secret),
      line_access_token: maskSecret(data.line_access_token),
      line_add_friend_url: data.line_add_friend_url ?? "",
    },
    autoOffer: {
      inactive_threshold_days: data.inactive_threshold_days,
      min_resend_interval_days: data.min_resend_interval_days,
      auto_offer_enabled: data.auto_offer_enabled,
    },
    businessSettings: {
      business_hours_start: (data.business_hours_start ?? "09:00").slice(0, 5),
      business_hours_end: (data.business_hours_end ?? "18:00").slice(0, 5),
      closed_weekdays: data.closed_weekdays ?? [],
      default_slot_minutes: data.default_slot_minutes ?? 90,
      min_lead_time_minutes: data.min_lead_time_minutes ?? 120,
    },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const referer = req.headers.get("referer") ?? "";
  if (referer.includes("/demo")) {
    return NextResponse.json({ error: "デモ画面のため、この操作はできません" }, { status: 403 });
  }
  const body = await req.json() as {
    line_channel_id?: string;
    line_channel_secret?: string;
    line_access_token?: string;
    line_add_friend_url?: string;
    inactive_threshold_days?: number;
    min_resend_interval_days?: number;
    auto_offer_enabled?: boolean;
  };

  const updates: Record<string, unknown> = {};

  if (body.line_channel_id !== undefined) {
    updates.line_channel_id = body.line_channel_id || null;
  }
  // 伏字値(****で始まる)はスキップして既存値を保持
  if (body.line_channel_secret !== undefined && !isMasked(body.line_channel_secret)) {
    updates.line_channel_secret = body.line_channel_secret || null;
  }
  if (body.line_access_token !== undefined && !isMasked(body.line_access_token)) {
    updates.line_access_token = body.line_access_token || null;
  }
  if (body.line_add_friend_url !== undefined) {
    updates.line_add_friend_url = body.line_add_friend_url || null;
  }
  if (body.inactive_threshold_days !== undefined) {
    updates.inactive_threshold_days = body.inactive_threshold_days;
  }
  if (body.min_resend_interval_days !== undefined) {
    updates.min_resend_interval_days = body.min_resend_interval_days;
  }
  if (body.auto_offer_enabled !== undefined) {
    updates.auto_offer_enabled = body.auto_offer_enabled;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("salons")
    .update(updates)
    .eq("id", DEFAULT_SALON_ID)
    .select(
      "line_channel_id, line_channel_secret, line_access_token, line_add_friend_url, inactive_threshold_days, min_resend_interval_days, auto_offer_enabled, business_hours_start, business_hours_end, closed_weekdays, default_slot_minutes, min_lead_time_minutes"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }

  return NextResponse.json({
    credentials: {
      line_channel_id: data.line_channel_id ?? "",
      line_channel_secret: maskSecret(data.line_channel_secret),
      line_access_token: maskSecret(data.line_access_token),
      line_add_friend_url: data.line_add_friend_url ?? "",
    },
    autoOffer: {
      inactive_threshold_days: data.inactive_threshold_days,
      min_resend_interval_days: data.min_resend_interval_days,
      auto_offer_enabled: data.auto_offer_enabled,
    },
    businessSettings: {
      business_hours_start: (data.business_hours_start ?? "09:00").slice(0, 5),
      business_hours_end: (data.business_hours_end ?? "18:00").slice(0, 5),
      closed_weekdays: data.closed_weekdays ?? [],
      default_slot_minutes: data.default_slot_minutes ?? 90,
      min_lead_time_minutes: data.min_lead_time_minutes ?? 120,
    },
  });
}
