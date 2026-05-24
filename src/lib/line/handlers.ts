import { createAdminClient } from "@/utils/supabase/admin";
import { parseIdentityMessage } from "./parse-identity-message";
import type {
  LineFollowEvent,
  LineUnfollowEvent,
  LineMessageEvent,
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
    return "ご連絡ありがとうございます。\nまたのご利用、お待ちしております。";
  }
  // action === "book"
  switch (templateTypeUsed) {
    case "friendly":
      return "ご希望ありがとうございます!\nサロンから改めてご連絡させていただきますね。\n少々お待ちください😊";
    case "business":
      return "ご希望を承りました。\nサロンより確認のご連絡を差し上げます。\n今しばらくお待ちください。";
    case "sales":
      return "ありがとうございます!\nサロンから折り返しご連絡いたします✨";
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

export async function handleMessageEvent(
  event: LineMessageEvent,
  salonId: string
): Promise<void> {
  const lineUserId = event.source.userId;
  const supabase = createAdminClient();

  // 「予約する」「今回はパス」キーワード判定
  if (event.message.type === "text" && "text" in event.message) {
    const trimmed = event.message.text.trim();
    if (trimmed === "予約する" || trimmed === "今回はパス") {
      const action = trimmed === "予約する" ? "book" : "decline";
      console.log("[msg-action] received:", trimmed, "from:", lineUserId);

      // 送信元 customer を逆引き
      const { data: msgCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("salon_id", salonId)
        .eq("line_user_id", lineUserId)
        .maybeSingle();

      if (!msgCustomer) {
        console.log("[msg-action] customer not found, ignoring:", lineUserId);
        return;
      }

      // 直近の sent な offer_recipient を取得
      const { data: msgRecipient } = await supabase
        .from("offer_recipients")
        .select("id, offer_id, status, template_type_used")
        .eq("salon_id", salonId)
        .eq("customer_id", msgCustomer.id)
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!msgRecipient) {
        console.log("[msg-action] no sent recipient for customer:", msgCustomer.id);
        return;
      }

      const nowIso = new Date().toISOString();
      if (action === "book") {
        await supabase
          .from("offer_recipients")
          .update({ status: "booked", booked_at: nowIso })
          .eq("id", msgRecipient.id);

        const { data: competitors } = await supabase
          .from("offer_recipients")
          .select("id")
          .eq("offer_id", msgRecipient.offer_id)
          .eq("status", "booked")
          .neq("id", msgRecipient.id);

        if ((competitors ?? []).length > 0) {
          await supabase
            .from("offer_recipients")
            .update({ is_competing: true })
            .eq("id", msgRecipient.id);
          console.log("[msg-action] is_competing=true for:", msgRecipient.id);
        }
      } else {
        await supabase
          .from("offer_recipients")
          .update({ status: "declined", declined_at: nowIso })
          .eq("id", msgRecipient.id);
      }

      // アクセストークン取得 → Reply API で自動返信
      const { data: msgSalon } = await supabase
        .from("salons")
        .select("line_access_token")
        .eq("id", salonId)
        .single();
      const msgToken = msgSalon?.line_access_token as string | null;
      if (msgToken) {
        const replyText = buildReplyText(action, msgRecipient.template_type_used as string | null);
        await lineReply(event.replyToken, replyText, msgToken);
      }
      console.log("[msg-action] done, action:", action, "recipientId:", msgRecipient.id);
      return; // 本人特定フローに流さない
    }
  }

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
