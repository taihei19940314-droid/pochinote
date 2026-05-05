import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

async function getSupabaseStatus() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "接続成功" };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}

async function getSalon() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("salons")
      .select("name, address, phone")
      .limit(1)
      .single();

    if (error) return { salon: null, error: error.message };
    return { salon: data, error: null };
  } catch (e) {
    return { salon: null, error: String(e) };
  }
}

export default async function Home() {
  const [status, { salon, error: salonError }] = await Promise.all([
    getSupabaseStatus(),
    getSalon(),
  ]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-10 py-16"
      style={{ background: "var(--paper)" }}
    >
      {/* ロゴ + ブランド */}
      <div className="flex flex-col items-center gap-4">
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="18" r="9" fill="var(--terra)" />
          <circle cx="10" cy="9" r="3" fill="var(--ink)" />
          <circle cx="22" cy="9" r="3" fill="var(--ink)" />
          <circle cx="6" cy="14" r="2.5" fill="var(--ink)" />
          <circle cx="26" cy="14" r="2.5" fill="var(--ink)" />
        </svg>
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
            Pochinote
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase mt-1" style={{ color: "var(--ink-soft)" }}>
            for groomers
          </p>
        </div>
        <p className="text-base text-center max-w-xs leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          トリマーが、施術に集中できる毎日を。
        </p>
      </div>

      {/* ステータスカード群 */}
      <div className="flex flex-col items-center gap-4 w-full max-w-sm px-4">

        {/* Supabase 接続ステータス */}
        <div
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{
            background: status.ok ? "rgba(107,142,127,0.10)" : "rgba(217,119,87,0.10)",
            color: status.ok ? "var(--sage)" : "var(--terra-deep)",
            border: `1px solid ${status.ok ? "rgba(107,142,127,0.25)" : "rgba(217,119,87,0.25)"}`,
          }}
        >
          <span className="text-base">{status.ok ? "✓" : "✗"}</span>
          <span>
            Supabase 接続:{" "}
            <span className="font-semibold">{status.ok ? "Connected" : "Failed"}</span>
          </span>
        </div>

        {/* サロン情報カード */}
        {salon ? (
          <div
            className="w-full rounded-xl p-5"
            style={{
              background: "white",
              border: "1px solid rgba(26,26,46,0.08)",
              boxShadow: "0 4px 16px -8px rgba(26,26,46,0.10)",
            }}
          >
            {/* カードヘッダー */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[10px] font-bold tracking-[0.2em] uppercase px-2 py-1 rounded-full"
                style={{ background: "rgba(217,119,87,0.12)", color: "var(--terra-deep)" }}
              >
                現在のサロン
              </span>
            </div>

            {/* サロン名 */}
            <p className="text-xl font-semibold mb-3" style={{ color: "var(--ink)" }}>
              {salon.name}
            </p>

            {/* 詳細情報 */}
            <div className="space-y-2">
              {salon.address && (
                <div className="flex items-start gap-2 text-sm" style={{ color: "var(--ink-soft)" }}>
                  <span className="mt-0.5 opacity-60">📍</span>
                  <span>{salon.address}</span>
                </div>
              )}
              {salon.phone && (
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-soft)" }}>
                  <span className="opacity-60">📞</span>
                  <span>{salon.phone}</span>
                </div>
              )}
            </div>

            {/* フッター */}
            <div
              className="mt-4 pt-3 text-[11px] font-mono"
              style={{ borderTop: "1px solid rgba(26,26,46,0.06)", color: "var(--sage)" }}
            >
              ✓ データベースから取得
            </div>
          </div>
        ) : (
          <div
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(217,119,87,0.08)",
              border: "1px solid rgba(217,119,87,0.2)",
              color: "var(--terra-deep)",
            }}
          >
            <span>✗</span>
            <span>サロン情報の取得に失敗しました: {salonError}</span>
          </div>
        )}

        {/* 開発中バッジ */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
          style={{ background: "rgba(217,119,87,0.12)", color: "var(--terra-deep)" }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--terra)" }} />
          開発中 — Next.js 16 + Supabase + LINE
        </div>

        <Button
          style={{ background: "var(--ink)", color: "var(--paper)" }}
          className="rounded-full px-8"
        >
          ダッシュボードへ →
        </Button>
      </div>
    </main>
  );
}
