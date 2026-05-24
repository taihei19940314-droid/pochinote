import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifyLineSignature } from "@/lib/line/signature";
import {
  handleFollowEvent,
  handleUnfollowEvent,
  handleMessageEvent,
} from "@/lib/line/handlers";
import type { LineWebhookBody, LineFollowEvent, LineUnfollowEvent, LineMessageEvent } from "@/lib/line/types";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

async function getChannelSecret(salonId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("salons")
    .select("line_channel_secret")
    .eq("id", salonId)
    .single();
  return data?.line_channel_secret ?? null;
}

async function processEvent(event: { type: string }, salonId: string): Promise<void> {
  switch (event.type) {
    case "follow":
      await handleFollowEvent(event as LineFollowEvent, salonId);
      break;
    case "unfollow":
      await handleUnfollowEvent(event as LineUnfollowEvent, salonId);
      break;
    case "message":
      await handleMessageEvent(event as LineMessageEvent, salonId);
      break;
    default:
      break;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 署名検証のために生テキストとして取得
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  const channelSecret = await getChannelSecret(DEFAULT_SALON_ID);

  if (!channelSecret) {
    // channel_secret 未設定 — 検証不能なので 401
    return NextResponse.json({ error: "channel_secret not configured" }, { status: 401 });
  }

  if (!verifyLineSignature(body, signature, channelSecret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let parsed: LineWebhookBody;
  try {
    parsed = JSON.parse(body) as LineWebhookBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // LINE の verify ボタンは events が空配列で送られる — そのまま 200
  if (parsed.events.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // イベントを並列処理。個別エラーは吸収して 200 を返す(LINE の再送防止)
  await Promise.all(
    (parsed.events as { type: string }[]).map((event) =>
      processEvent(event, DEFAULT_SALON_ID).catch((err) => {
        // トークンやシークレットを含まない情報のみログに残す
        console.error(`[LINE Webhook] event=${event.type} error:`, err instanceof Error ? err.message : "unknown");
      })
    )
  );

  return NextResponse.json({ ok: true });
}
