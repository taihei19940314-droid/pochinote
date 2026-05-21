import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/utils/supabase/admin";
import { TemplatesClient } from "./templates-client";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";
const TYPE_ORDER = ["friendly", "business", "sales"] as const;

export const dynamic = "force-dynamic";

export default async function LineTemplatesPage() {
  const supabase = createAdminClient();

  const [{ data: templates }, { data: salon }] = await Promise.all([
    supabase
      .from("message_templates")
      .select("id, template_type, content, updated_at")
      .eq("salon_id", DEFAULT_SALON_ID)
      .eq("is_default", true),
    supabase
      .from("salons")
      .select("name")
      .eq("id", DEFAULT_SALON_ID)
      .single(),
  ]);

  const sorted = [...(templates ?? [])].sort(
    (a, b) =>
      TYPE_ORDER.indexOf(a.template_type as typeof TYPE_ORDER[number]) -
      TYPE_ORDER.indexOf(b.template_type as typeof TYPE_ORDER[number])
  );

  return (
    <div className="max-w-lg mx-auto pb-8">
      <Link
        href="/line"
        className="inline-flex items-center gap-1 text-sm mb-6 transition-opacity hover:opacity-70"
        style={{ color: "var(--ink-soft)" }}
      >
        <ChevronLeft size={16} />
        LINE メニューに戻る
      </Link>

      <h1 className="font-display text-2xl font-semibold tracking-tight mb-1">
        メッセージテンプレート
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        3パターンの文面を、サロンの雰囲気に合わせて編集できます
      </p>

      <TemplatesClient
        templates={sorted}
        salonName={salon?.name ?? ""}
      />
    </div>
  );
}
