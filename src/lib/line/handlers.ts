import { createAdminClient } from "@/utils/supabase/admin";
import { parseIdentityMessage } from "./parse-identity-message";
import type {
  LineFollowEvent,
  LineUnfollowEvent,
  LineMessageEvent,
} from "./types";

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
