import Link from "next/link";
import { Settings, Send, MessageSquare, History, UserPlus, ChevronRight, CheckCircle } from "lucide-react";
import { createAdminClient } from "@/utils/supabase/admin";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export const dynamic = "force-dynamic";

export default async function LinePage() {
  const supabase = createAdminClient();
  const { count: pendingCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", DEFAULT_SALON_ID)
    .not("line_user_id", "is", null)
    .eq("line_follow_status", "followed")
    .like("name", "(未特定%")
    .eq("ignored", false);

  const { count: bookingRequestCount } = await supabase
    .from("offer_recipients")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", DEFAULT_SALON_ID)
    .eq("status", "booked");

  const n = pendingCount ?? 0;
  const b = bookingRequestCount ?? 0;

  const menuItems = [
    {
      href: "/line/settings",
      icon: Settings,
      label: "LINE 連携設定",
      sub: "公式アカウントの接続、自動オファーの基本設定",
      badge: null as string | null,
      countBadge: null as number | null,
    },
    {
      href: "/line/pending-matches",
      icon: UserPlus,
      label: "LINE 連携待ち",
      sub: "友だち追加された方の顧客紐付け",
      badge: null,
      countBadge: n > 0 ? n : null,
    },
    {
      href: "/line/offers",
      icon: Send,
      label: "オファー候補",
      sub: "空き枠への送信候補を確認・送信",
      badge: null,
      countBadge: null,
    },
    {
      href: "/line/offers/pending",
      icon: CheckCircle,
      label: "予約承認待ち",
      sub: "予約希望の承認・却下",
      badge: null,
      countBadge: b > 0 ? b : null,
    },
    {
      href: "/line/templates",
      icon: MessageSquare,
      label: "メッセージテンプレート",
      sub: "3パターンの文面を編集",
      badge: null,
      countBadge: null,
    },
    {
      href: "/line/history",
      icon: History,
      label: "送信履歴",
      sub: "過去のオファー実績と効果測定",
      badge: "準備中",
      countBadge: null,
    },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: "var(--ink-soft)" }}>
          Auto Offer Engine
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight mb-1">LINE 自動オファー</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          離脱気味の常連を、自動で呼び戻します
        </p>
      </div>

      <div className="space-y-3">
        {menuItems.map(({ href, icon: Icon, label, sub, badge, countBadge }) => (
          <Link
            key={href}
            href={href}
            className="card p-4 flex items-center gap-4 transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(217,119,87,0.1)" }}
            >
              <Icon size={20} style={{ color: "var(--terra)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm">{label}</span>
                {badge && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }}
                  >
                    {badge}
                  </span>
                )}
                {countBadge !== null && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--terra)", color: "white" }}
                  >
                    {countBadge}
                  </span>
                )}
              </div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{sub}</div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--ink-soft)" }} className="flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
