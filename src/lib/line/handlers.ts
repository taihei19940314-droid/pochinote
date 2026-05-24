import { createAdminClient } from "@/utils/supabase/admin";
import { parseIdentityMessage } from "./parse-identity-message";
import type {
  LineFollowEvent,
  LineUnfollowEvent,
  LineMessageEvent,
  LinePostbackEvent,
} from "./types";

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";

async function lineReply(
  replyToken: string,
  text: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    console.error("[postback] LINE Reply API failed:", res.status);
  }
}

function buildReplyText(action: string, templateTypeUsed: string | null): string {
  if (action === "decline") {
    return "ご連絡ありがとうございます🐶\nまたのご利用、お待ちしております。";
  }
  // action === "book"
  switch (templateTypeUsed) {
    case "friendly":
      return "🐶 ご希望ありがとうございます!\nサロンから改めてご連絡させていただきますね。\n少々お待ちください😊";
    case "business":
      return "ご希望を承りました。\nサロンより確認のご連絡を差し上げます。\n今しばらくお待ちください。";
    case "sales":
      return "🌸 ありがとうございます!\nサロンから折り返しご連絡いたします✨";
    default:
      return "ご希望を承りました。\nサロンより確認のご連絡を差し上げます。";
  }
}

const PENDING_NAME = "(未特定 LINE ユーザー)";

export async function handleFollowEvent(
  event: LineFollowEvent,
  salonId: string
): Promise<void> {
  const lineUserId = event.source.userId;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("salon_id", salonId)
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("customers")
      .update({
        line_follow_status: "followed",
        line_followed_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("customers").insert({
      salon_id: salonId,
      name: PENDING_NAME,
      line_user_id: lineUserId,
      line_follow_status: "followed",
      line_followed_at: new Date().toISOString(),
    });
  }
}

export async function handleUnfollowEvent(
  event: LineUnfollowEvent,
  salonId: string
): Promise<void> {
  const lineUserId = event.source.userId;
  const supabase = createAdminClient();

  // レコードが無い場合でも .update() はエラーにならない(0件更新で正常終了)
  await supabase
    .from("customers")
    .update({ line_follow_status: "unfollowed" })
    .eq("salon_id", salonId)
    .eq("line_user_id", lineUserId);
}

// LINE は block を独立イベントで送らないが、将来仕様変更に備えて定義
export async function handleBlockEvent(
  salonId: string,
  lineUserId: string
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("customers")
    .update({ line_follow_status: "blocked" })
    .eq("salon_id", salonId)
    .eq("line_user_id", lineUserId);
}

export async function handlePostbackEvent(
  event: LinePostbackEvent,
  salonId: string,
): Promise<void> {
  const data = new URLSearchParams(event.postback.data);
  const recipientId = data.get("offer_recipient_id");
  const action = data.get("action");

  console.log("[postback] salonId:", salonId, "recipientId:", recipientId, "action:", action);

  if (!recipientId || !["book", "decline"].includes(action ?? "")) {
    console.warn("[postback] invalid data, ignoring:", event.postback.data);
    return;
  }

  const supabase = createAdminClient();

  // recipient レコード取得
  const { data: recipient, error: fetchErr } = await supabase
    .from("offer_recipients")
    .select("id, offer_id, customer_id, status, template_type_used")
    .eq("id", recipientId)
    .eq("salon_id", salonId)
    .maybeSingle();

  if (fetchErr || !recipient) {
    console.warn("[postback] recipient not found:", recipientId);
    return;
  }
  if (!recipient.customer_id) {
    console.warn("[postback] customer_id is null, skipping:", recipientId);
    return;
  }

  // 冪等性: 既に booked / declined なら無視
  if (recipient.status === "booked" || recipient.status === "declined") {
    console.log("[postback] already processed, ignoring duplicate:", recipientId, recipient.status);
    return;
  }

  const now = new Date().toISOString();

  if (action === "book") {
    await supabase
      .from("offer_recipients")
      .update({ status: "booked", booked_at: now })
      .eq("id", recipientId);

    // 同一 offer で先に booked になっている他レコードを確認
    const { data: competitors } = await supabase
      .from("offer_recipients")
      .select("id")
      .eq("offer_id", recipient.offer_id)
      .eq("status", "booked")
      .neq("id", recipientId);

    if ((competitors ?? []).length > 0) {
      await supabase
        .from("offer_recipients")
        .update({ is_competing: true })
        .eq("id", recipientId);
      console.log("[postback] is_competing=true for:", recipientId);
    }
  } else {
    // action === "decline"
    await supabase
      .from("offer_recipients")
      .update({ status: "declined", declined_at: now })
      .eq("id", recipientId);
  }

  // アクセストークン取得 → LINE Reply API
  const { data: salon } = await supabase
    .from("salons")
    .select("line_access_token")
    .eq("id", salonId)
    .single();

  const accessToken = salon?.line_access_token as string | null;
  if (!accessToken) {
    console.error("[postback] line_access_token not configured, skip reply");
    return;
  }

  const replyText = buildReplyText(action!, recipient.template_type_used as string | null);
  await lineReply(event.replyToken, replyText, accessToken);
  console.log("[postback] replied ok, action:", action, "recipientId:", recipientId);
}

export async function handleMessageEvent(
  event: LineMessageEvent,
  salonId: string
): Promise<void> {
  const lineUserId = event.source.userId;
  const supabase = createAdminClient();

  // 既存顧客を line_user_id で検索
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("salon_id", salonId)
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  // テキスト以外のメッセージはタイプ名をプレースホルダーとして保存
  const content =
    event.message.type === "text" && "text" in event.message
      ? event.message.text
      : `[${event.message.type}]`;

  await supabase.from("messages").insert({
    salon_id: salonId,
    customer_id: customer?.id ?? null,
    direction: "inbound",
    content,
    line_message_id: event.message.id,
    sent_at: new Date(event.timestamp).toISOString(),
  });

  // 「(未特定 LINE ユーザー)」のメッセージのみパース処理を実行
  if (
    customer &&
    customer.name.startsWith("(未特定") &&
    event.message.type === "text" &&
    "text" in event.message
  ) {
    const parsed = parseIdentityMessage(event.message.text);
    if (parsed) {
      await supabase
        .from("customers")
        .update({
          line_pending_data: {
            line_pending: {
              rawText: parsed.rawText,
              parsed: {
                ownerName: parsed.ownerName,
                petName: parsed.petName,
                confidence: parsed.confidence,
              },
              candidatesFetchedAt: new Date().toISOString(),
            },
          },
        })
        .eq("id", customer.id);
    }
  }
}
