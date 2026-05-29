import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const referer = request.headers.get("referer") ?? "";
  if (referer.includes("/demo")) {
    return NextResponse.json({ error: "デモ画面のため、この操作はできません" }, { status: 403 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content } = body as Record<string, unknown>;

  if (typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (content.length > 1000) {
    return NextResponse.json({ error: "content must be 1000 characters or fewer" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("message_templates")
    .update({ content: content.trim() })
    .eq("id", id)
    .eq("salon_id", DEFAULT_SALON_ID)
    .select("id, salon_id, template_type, is_active, is_default, content, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, template: data });
}
