import { createAdminClient } from "@/utils/supabase/admin";
import { parseIdentityMessage } from "./parse-identity-message";
import type {
  LineFollowEvent,
  LineUnfollowEvent,
  LineMessageEvent,
  LinePostbackEvent,
} from "./types";

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

async function linePushText(
  toUserId: string,
  text: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: toUserId,
      messages: [{ type: "text", text }],
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    console.error("[notify-salon] Push API failed:", res.status);
  }
}

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

  // アクセストークン + 通知先 LINE user ID 取得
  const { data: salon } = await supabase
    .from("salons")
    .select("line_access_token, notification_line_user_id")
    .eq("id", salonId)
    .single();

  const accessToken = salon?.line_access_token as string | null;
  if (!accessToken) {
    console.error("[postback] line_access_token not configured, skip reply");
    return;
  }

  // 自動返信(Reply API)
  const replyText = buildReplyText(action!, recipient.template_type_used as string | null);
  await lineReply(event.replyToken, replyText, accessToken);
  console.log("[postback] replied ok, action:", action, "recipientId:", recipientId);

  // book 時のみサロンへ Push 通知
  if (action === "book") {
    const notifyUserId = salon?.notification_line_user_id as string | null;
    if (!notifyUserId) {
      console.log("[notify-salon] no notification user registered, skip");
    } else {
      // customer + pet 情報取得
      const { data: customerData } = await supabase
        .from("customers")
        .select("name, last_visit_at, pets(name, breed)")
        .eq("id", recipient.customer_id)
        .single();

      const now2 = new Date();
      const daysSince = customerData?.last_visit_at
        ? Math.floor((now2.getTime() - new Date(customerData.last_visit_at as string).getTime()) / 86_400_000)
        : null;
      const pets = customerData?.pets as Array<{ name: string; breed: string | null }> | null;
      const pet = pets?.[0];
      const isCompeting = (await supabase
        .from("offer_recipients")
        .select("is_competing")
        .eq("id", recipientId)
        .single()).data?.is_competing as boolean | null;

      const lines = [
        "📩 予約希望が届きました",
        "",
        `お客様：${(customerData?.name as string | null) ?? "不明"}さん`,
        `ペット：${pet?.name ?? "不明"}ちゃん${pet?.breed ? `（${pet.breed}）` : ""}`,
        daysSince != null ? `最終来店：${daysSince}日前` : null,
        "応答：予約する",
        isCompeting ? "⚠️ 同じ枠に他にも応募中" : null,
        "",
        "▼ 管理画面で確認",
        "https://triel-app.vercel.app/dashboard",
      ].filter((l) => l !== null).join("\n");

      await linePushText(notifyUserId, lines, accessToken);
      console.log("[notify-salon] push sent to:", notifyUserId);
    }
  }
}

export async function handleMessageEvent(
  event: LineMessageEvent,
  salonId: string
): Promise<void> {
  const lineUserId = event.source.userId;
  const supabase = createAdminClient();

  // 「管理者登録」キーワード検知(他の処理より先に判定)
  if (event.message.type === "text" && "text" in event.message) {
    const trimmed = event.message.text.trim();
    if (trimmed === "管理者登録") {
      console.log("[admin-reg] received from:", lineUserId);
      const { data: salon } = await supabase
        .from("salons")
        .select("line_access_token, notification_line_user_id")
        .eq("id", salonId)
        .single();
      const accessToken = salon?.line_access_token as string | null;
      if (!accessToken) return;

      const alreadySame = (salon?.notification_line_user_id as string | null) === lineUserId;
      if (alreadySame) {
        await lineReply(event.replyToken, "既に管理者として登録済みです。", accessToken);
      } else {
        await supabase
          .from("salons")
          .update({ notification_line_user_id: lineUserId, notification_registration_pending: false })
          .eq("id", salonId);
        await lineReply(
          event.replyToken,
          "✅ 管理者として登録しました。今後、お客様の予約希望はこちらに通知されます。",
          accessToken,
        );
        console.log("[admin-reg] registered:", lineUserId, "for salon:", salonId);
      }
      return; // 通常メッセージ処理はスキップ
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
