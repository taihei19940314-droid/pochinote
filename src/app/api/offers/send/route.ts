import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { expandTemplateVariables } from "@/lib/line/expand-template-variables";
import { buildFlexMessage } from "@/lib/line/build-flex-message";
import { isResendBlocked, toJstDatetime } from "@/lib/line/send-utils";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
const PUSH_TIMEOUT_MS = 10_000;
const BATCH_SIZE = 5;

type SendResultItem = { name: string; reason?: string; lastSentAt?: string | null };

type SendResponse = {
  success: number;
  failed: SendResultItem[];
  skipped: SendResultItem[];
  blocked: SendResultItem[];
  tokenError: boolean;
};

async function linePush(
  lineUserId: string,
  payload: object,
  accessToken: string,
): Promise<Response> {
  return fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ to: lineUserId, messages: [payload] }),
    signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      selectedCustomerIds?: unknown;
      templateType?: unknown;
      slotStart?: unknown;
      slotEnd?: unknown;
    };

    const { selectedCustomerIds, templateType, slotStart, slotEnd } = body;

    // ── バリデーション ───────────────────────────────────────
    if (
      !Array.isArray(selectedCustomerIds) ||
      selectedCustomerIds.length === 0 ||
      !selectedCustomerIds.every((id) => typeof id === "string")
    ) {
      return NextResponse.json({ error: "invalid selectedCustomerIds" }, { status: 400 });
    }
    if (!["friendly", "business", "sales"].includes(templateType as string)) {
      return NextResponse.json({ error: "invalid templateType" }, { status: 400 });
    }

    const slotStartDate = slotStart ? new Date(slotStart as string) : new Date();
    const slotEndDate = slotEnd
      ? new Date(slotEnd as string)
      : new Date(slotStartDate.getTime() + 2 * 3600_000);
    if (isNaN(slotStartDate.getTime()) || isNaN(slotEndDate.getTime())) {
      return NextResponse.json({ error: "invalid slot dates" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // ── サロン情報取得(トークンをログに出さない) ────────────
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("id, name, line_access_token, min_resend_interval_days")
      .eq("id", DEFAULT_SALON_ID)
      .single();

    if (salonError || !salon) {
      return NextResponse.json({ error: "salon not found" }, { status: 404 });
    }
    if (!salon.line_access_token) {
      return NextResponse.json({ tokenError: true, error: "LINE token not configured" }, { status: 422 });
    }

    const accessToken = salon.line_access_token as string;
    const minIntervalDays = (salon.min_resend_interval_days as number | null) ?? 7;

    // ── テンプレート取得 ─────────────────────────────────────
    const { data: template, error: tplError } = await supabase
      .from("message_templates")
      .select("content")
      .eq("salon_id", DEFAULT_SALON_ID)
      .eq("type", templateType)
      .eq("is_default", true)
      .single();

    if (tplError || !template) {
      return NextResponse.json({ error: "template not found" }, { status: 404 });
    }

    // ── 顧客取得 + 妥当性チェック ────────────────────────────
    const { data: customers, error: custError } = await supabase
      .from("customers")
      .select("id, name, line_user_id, line_follow_status, last_visit_at, pets(name, breed)")
      .in("id", selectedCustomerIds as string[])
      .eq("salon_id", DEFAULT_SALON_ID)
      .eq("line_follow_status", "followed")
      .not("line_user_id", "is", null);

    if (custError) {
      return NextResponse.json({ error: "failed to fetch customers" }, { status: 500 });
    }

    const validCustomers = customers ?? [];
    if (validCustomers.length === 0) {
      return NextResponse.json({ error: "no valid customers" }, { status: 400 });
    }

    // ── 再送禁止チェック用: 直近の送信履歴を先に取得 ─────────
    const cutoff = new Date(Date.now() - minIntervalDays * 24 * 60 * 60 * 1000);
    const { data: recentSends } = await supabase
      .from("offer_recipients")
      .select("customer_id, sent_at")
      .in("customer_id", validCustomers.map((c) => c.id))
      .eq("status", "sent")
      .gte("sent_at", cutoff.toISOString())
      .order("sent_at", { ascending: false });

    const recentSentMap = new Map<string, string>();
    for (const r of recentSends ?? []) {
      if (!recentSentMap.has(r.customer_id)) {
        recentSentMap.set(r.customer_id, r.sent_at!);
      }
    }

    // ── offers INSERT ────────────────────────────────────────
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .insert({
        salon_id: DEFAULT_SALON_ID,
        available_from: slotStartDate.toISOString(),
        available_until: slotEndDate.toISOString(),
        discount_pct: 0,
        status: "sent",
      })
      .select("id")
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: "failed to create offer" }, { status: 500 });
    }

    // ── offer_recipients 一括 INSERT ────────────────────────
    const now = new Date();
    const recipientRows = validCustomers.map((c) => ({
      salon_id: DEFAULT_SALON_ID,
      offer_id: offer.id,
      customer_id: c.id,
      status: "pending",
      days_since_last_visit: c.last_visit_at
        ? Math.floor((now.getTime() - new Date(c.last_visit_at).getTime()) / 86_400_000)
        : null,
    }));

    const { data: recipients, error: recipError } = await supabase
      .from("offer_recipients")
      .insert(recipientRows)
      .select("id, customer_id");

    if (recipError || !recipients) {
      return NextResponse.json({ error: "failed to create recipients" }, { status: 500 });
    }

    const recipientMap = new Map(recipients.map((r) => [r.customer_id, r.id]));
    const slotJst = toJstDatetime(slotStartDate);

    // ── バッチ送信 ───────────────────────────────────────────
    const result: SendResponse = {
      success: 0,
      failed: [],
      skipped: [],
      blocked: [],
      tokenError: false,
    };

    for (let i = 0; i < validCustomers.length; i += BATCH_SIZE) {
      if (result.tokenError) break;

      const batch = validCustomers.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (customer) => {
          if (result.tokenError) return;

          const recipientId = recipientMap.get(customer.id);
          if (!recipientId) return;

          // 再送禁止チェック
          const lastSentAt = recentSentMap.get(customer.id) ?? null;
          if (isResendBlocked(lastSentAt, minIntervalDays, now)) {
            await supabase
              .from("offer_recipients")
              .update({ status: "skipped" })
              .eq("id", recipientId);
            result.skipped.push({ name: customer.name, lastSentAt });
            return;
          }

          // Flex Message 組み立て
          const pets = customer.pets as Array<{ name: string; breed: string | null }> | null;
          const pet = pets?.[0];
          const petName = pet?.name ?? "お子様";

          const bodyText = expandTemplateVariables(template.content as string, {
            petName,
            salonName: salon.name as string,
            date: slotJst.date,
            time: slotJst.time,
            daysSinceLastVisit: customer.last_visit_at
              ? Math.floor((now.getTime() - new Date(customer.last_visit_at).getTime()) / 86_400_000)
              : 0,
          });

          const flexPayload = buildFlexMessage({ bodyText, petName, recipientId });

          // LINE Push API 呼び出し
          try {
            let lineRes = await linePush(customer.line_user_id as string, flexPayload, accessToken);

            // 429 → 1秒待ちリトライ1回
            if (lineRes.status === 429) {
              await new Promise((r) => setTimeout(r, 1000));
              lineRes = await linePush(customer.line_user_id as string, flexPayload, accessToken);
            }

            if (lineRes.ok) {
              await supabase
                .from("offer_recipients")
                .update({ status: "sent", sent_at: new Date().toISOString() })
                .eq("id", recipientId);
              result.success++;
            } else if (lineRes.status === 401) {
              result.tokenError = true;
              await supabase
                .from("offer_recipients")
                .update({ status: "failed", error_message: "token_invalid" })
                .eq("id", recipientId);
            } else if (lineRes.status === 400 || lineRes.status === 403) {
              await Promise.all([
                supabase
                  .from("offer_recipients")
                  .update({ status: "blocked", error_message: `HTTP ${lineRes.status}` })
                  .eq("id", recipientId),
                supabase
                  .from("customers")
                  .update({ line_follow_status: "blocked" })
                  .eq("id", customer.id),
              ]);
              result.blocked.push({ name: customer.name });
            } else {
              await supabase
                .from("offer_recipients")
                .update({ status: "failed", error_message: `HTTP ${lineRes.status}` })
                .eq("id", recipientId);
              result.failed.push({ name: customer.name, reason: "一時エラー" });
            }
          } catch {
            await supabase
              .from("offer_recipients")
              .update({ status: "failed", error_message: "timeout_or_network" })
              .eq("id", recipientId);
            result.failed.push({ name: customer.name, reason: "タイムアウト" });
          }
        }),
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
