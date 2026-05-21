import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/utils/supabase/admin";
import { findCustomerCandidates } from "@/lib/line/find-customer-candidates";
import PendingMatchesClient from "./pending-matches-client";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export const dynamic = "force-dynamic";

function formatJst(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default async function PendingMatchesPage() {
  const supabase = createAdminClient();

  // (未特定 LINE ユーザー)で、ignored=false、line_user_id がある顧客を取得
  const { data: pendingCustomers } = await supabase
    .from("customers")
    .select("id, name, line_user_id, line_follow_status, line_followed_at, line_pending_data")
    .eq("salon_id", DEFAULT_SALON_ID)
    .not("line_user_id", "is", null)
    .eq("line_follow_status", "followed")
    .like("name", "(未特定%")
    .eq("ignored", false)
    .order("line_followed_at", { ascending: false });

  if (!pendingCustomers || pendingCustomers.length === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <Link
          href="/line"
          className="inline-flex items-center gap-1 text-sm mb-6 transition-opacity hover:opacity-70"
          style={{ color: "var(--ink-soft)" }}
        >
          <ChevronLeft size={16} />
          LINE メニューに戻る
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">LINE 連携待ち</h1>
        <div className="card p-10 text-center">
          <div className="text-3xl mb-3">✅</div>
          <p className="font-semibold mb-1">対応待ちはありません</p>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            新しく友だち追加された方がいると、ここに表示されます。
          </p>
        </div>
      </div>
    );
  }

  // 各 pending 顧客の最新メッセージ + 照合候補を並列取得
  const enriched = await Promise.all(
    pendingCustomers.map(async (c) => {
      const [{ data: msgs }, candidates] = await Promise.all([
        supabase
          .from("messages")
          .select("content, sent_at")
          .eq("customer_id", c.id)
          .eq("direction", "inbound")
          .order("sent_at", { ascending: false })
          .limit(3),
        (async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pending = c.line_pending_data as any;
          const parsed = pending?.line_pending?.parsed;
          if (!parsed) return [];
          return findCustomerCandidates(
            DEFAULT_SALON_ID,
            parsed.ownerName ?? null,
            parsed.petName ?? null
          );
        })(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pendingData = c.line_pending_data as any;

      return {
        id: c.id,
        lineUserIdMasked: maskUserId(c.line_user_id ?? ""),
        lineFollowedAt: c.line_followed_at ? formatJst(c.line_followed_at) : null,
        messages: msgs ?? [],
        parsedOwnerName: pendingData?.line_pending?.parsed?.ownerName ?? null,
        parsedPetName: pendingData?.line_pending?.parsed?.petName ?? null,
        parsedConfidence: pendingData?.line_pending?.parsed?.confidence ?? null,
        rawText: pendingData?.line_pending?.rawText ?? null,
        candidates,
      };
    })
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

      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">LINE 連携待ち</h1>
        <span
          className="text-sm font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: "rgba(217,119,87,0.15)", color: "var(--terra)" }}
        >
          {enriched.length}件
        </span>
      </div>

      <PendingMatchesClient entries={enriched} />
    </div>
  );
}

function maskUserId(uid: string): string {
  if (uid.length <= 4) return uid;
  return "U..." + uid.slice(-5);
}
