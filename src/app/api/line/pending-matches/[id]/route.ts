import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

type ActionBody =
  | { action: "link_to_existing"; targetCustomerId: string }
  | { action: "create_new"; name: string; petName?: string }
  | { action: "ignore" };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const referer = req.headers.get("referer") ?? "";
  if (referer.includes("/demo")) {
    return NextResponse.json({ error: "デモ画面のため、この操作はできません" }, { status: 403 });
  }
  const { id: pendingCustomerId } = await params;
  const body = (await req.json()) as ActionBody;
  const supabase = createAdminClient();

  // pending レコードが自サロンのものかチェック
  const { data: pending } = await supabase
    .from("customers")
    .select("id, line_user_id, line_follow_status, line_followed_at")
    .eq("id", pendingCustomerId)
    .eq("salon_id", DEFAULT_SALON_ID)
    .single();

  if (!pending) {
    return NextResponse.json({ error: "pending customer not found" }, { status: 404 });
  }

  // ── action: link_to_existing ──────────────────────────────────
  if (body.action === "link_to_existing") {
    const { targetCustomerId } = body;

    // 1. 既存顧客に LINE 情報を付与
    const { error: updateErr } = await supabase
      .from("customers")
      .update({
        line_user_id: pending.line_user_id,
        line_follow_status: pending.line_follow_status,
        line_followed_at: pending.line_followed_at,
      })
      .eq("id", targetCustomerId)
      .eq("salon_id", DEFAULT_SALON_ID);

    if (updateErr) {
      return NextResponse.json({ error: "failed to update target customer" }, { status: 500 });
    }

    // 2. messages の customer_id を既存顧客に付け替え
    await supabase
      .from("messages")
      .update({ customer_id: targetCustomerId })
      .eq("customer_id", pendingCustomerId);

    // 3. pending レコードを削除
    await supabase
      .from("customers")
      .delete()
      .eq("id", pendingCustomerId);

    return NextResponse.json({ success: true, linkedCustomerId: targetCustomerId });
  }

  // ── action: create_new ───────────────────────────────────────
  if (body.action === "create_new") {
    const newName = body.name.trim();
    if (!newName) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // 1. pending レコードの name を更新して正式顧客化
    const { data: updated, error: nameErr } = await supabase
      .from("customers")
      .update({ name: newName, line_pending_data: null })
      .eq("id", pendingCustomerId)
      .select("id")
      .single();

    if (nameErr || !updated) {
      return NextResponse.json({ error: "failed to update name" }, { status: 500 });
    }

    // 2. ペット名が入力されていれば pets テーブルに INSERT
    if (body.petName?.trim()) {
      await supabase.from("pets").insert({
        salon_id: DEFAULT_SALON_ID,
        customer_id: pendingCustomerId,
        name: body.petName.trim(),
        species: "犬",
      });
    }

    return NextResponse.json({ success: true, newCustomerId: pendingCustomerId });
  }

  // ── action: ignore ────────────────────────────────────────────
  if (body.action === "ignore") {
    const { error: ignoreErr } = await supabase
      .from("customers")
      .update({ ignored: true })
      .eq("id", pendingCustomerId);

    if (ignoreErr) {
      return NextResponse.json({ error: "failed to ignore" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
