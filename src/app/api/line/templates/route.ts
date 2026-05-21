import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";
const TYPE_ORDER = ["friendly", "business", "sales"] as const;

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("message_templates")
    .select("id, salon_id, template_type, is_active, is_default, content, created_at, updated_at")
    .eq("salon_id", DEFAULT_SALON_ID)
    .eq("is_default", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sorted = [...(data ?? [])].sort(
    (a, b) =>
      TYPE_ORDER.indexOf(a.template_type as typeof TYPE_ORDER[number]) -
      TYPE_ORDER.indexOf(b.template_type as typeof TYPE_ORDER[number])
  );

  return NextResponse.json({ templates: sorted });
}
