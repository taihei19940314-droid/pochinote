import Link from "next/link";
import { notFound } from "next/navigation";
import { customers } from "@/lib/mock-customers";

const photoSets = [
  { before: "🐩", after: "✨🐩", beforeBg: "#6b8e7f", afterBg: "#c89b3c", date: "2026-04-07" },
  { before: "🐕", after: "✨🐕", beforeBg: "#8b7355", afterBg: "#d4a574", date: "2026-03-05" },
  { before: "🐕", after: "💇🐕", beforeBg: "#7a8c9e", afterBg: "#9bb5c8", date: "2026-02-01" },
];

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = customers.find((c) => c.id === id);
  if (!customer) notFound();

  return (
    <div className="max-w-4xl mx-auto py-8 px-2">
      {/* Back */}
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        ← 顧客一覧に戻る
      </Link>

      {/* Hero header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="text-4xl w-16 h-16 flex items-center justify-center rounded-full" style={{ background: "var(--paper-warm)" }}>
          {customer.emoji}
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{customer.petName}</h1>
          <div className="text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>
            {customer.breed} {customer.sex} {customer.age}y · {customer.ownerName}
          </div>
        </div>
        <div className="ml-auto">
          <div className="text-right">
            <div className="text-xs font-mono mb-1" style={{ color: "var(--ink-soft)" }}>次回提案</div>
            <div className="font-semibold text-sm" style={{ color: customer.nextVisitSuggestion.includes("至急") ? "var(--terra)" : "var(--ink)" }}>
              {customer.nextVisitSuggestion}
            </div>
          </div>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-5 gap-5 mb-6">

        {/* Left: 基本情報 */}
        <div className="col-span-2 space-y-4">
          {/* 飼い主情報 */}
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold mb-3">飼い主情報</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--ink-soft)" }}>氏名</span>
                <span className="font-medium">{customer.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--ink-soft)" }}>電話</span>
                <span className="font-mono text-xs">{customer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--ink-soft)" }}>LINE</span>
                <span className="pill text-[11px]" style={{
                  background: customer.lineRegistered ? "rgba(6,199,85,0.12)" : "rgba(26,26,46,0.06)",
                  color: customer.lineRegistered ? "#06c755" : "var(--ink-soft)",
                }}>
                  {customer.lineRegistered ? "登録済" : "未登録"}
                </span>
              </div>
            </div>
          </div>

          {/* ペット情報 */}
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold mb-3">ペット情報</h2>
            <div className="space-y-2 text-sm">
              {[
                ["犬種", customer.breed],
                ["性別", customer.sex],
                ["年齢", `${customer.age}歳`],
                ["体重", `${customer.weight}kg`],
                ["誕生日", customer.birthday],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: "var(--ink-soft)" }}>{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 注意事項 */}
          {customer.flags.length > 0 && (
            <div className="card p-5" style={{ borderLeft: "3px solid var(--terra)" }}>
              <h2 className="font-display text-lg font-semibold mb-3">注意事項</h2>
              <div className="space-y-1.5">
                {customer.flags.map((flag) => (
                  <div key={flag} className="flex items-center gap-2 text-sm">
                    <span>⚠️</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: 施術履歴 */}
        <div className="col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">施術履歴</h2>
            <span className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>全 {customer.visitCount} 回</span>
          </div>
          <div className="space-y-0">
            {customer.treatments.map((t, i) => (
              <div key={i} className="flex gap-3 py-3 border-b" style={{ borderColor: "rgba(26,26,46,0.06)" }}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: i === 0 ? "var(--terra)" : "var(--sage)" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-sm">{t.menu}</span>
                    <span className="font-mono text-sm font-semibold flex-shrink-0">¥{t.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>{t.date}</span>
                    <span className="text-xs" style={{ color: "var(--ink-soft)" }}>{t.staff}</span>
                  </div>
                  {t.note && (
                    <div className="text-xs mt-1 px-2 py-1 rounded" style={{ background: "var(--paper-warm)", color: "var(--ink-soft)" }}>
                      {t.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 text-sm flex items-center gap-2" style={{ borderTop: "1px solid rgba(26,26,46,0.06)" }}>
            <span style={{ color: "var(--ink-soft)" }}>次回提案：</span>
            <span className="font-semibold" style={{ color: "var(--terra)" }}>{customer.nextVisitSuggestion}</span>
          </div>
        </div>
      </div>

      {/* Before/After gallery */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-semibold mb-4">ビフォーアフター</h2>
        <div className="grid grid-cols-3 gap-3">
          {photoSets.map((p, i) => (
            <div key={i} className="rounded-lg overflow-hidden" style={{ background: "var(--paper-warm)" }}>
              <div className="grid grid-cols-2 h-20">
                <div className="flex items-center justify-center text-2xl relative" style={{ background: `linear-gradient(135deg, ${p.beforeBg}, ${p.beforeBg}cc)` }}>
                  <span className="text-white/40">{p.before}</span>
                  <div className="absolute bottom-1 left-1 text-[8px] font-mono text-white bg-black/40 px-1 rounded">BEFORE</div>
                </div>
                <div className="flex items-center justify-center text-2xl relative" style={{ background: `linear-gradient(135deg, ${p.afterBg}, ${p.afterBg}cc)` }}>
                  <span className="text-white/40">{p.after}</span>
                  <div className="absolute bottom-1 left-1 text-[8px] font-mono text-white bg-black/40 px-1 rounded">AFTER</div>
                </div>
              </div>
              <div className="px-3 py-2 text-[10px] font-mono" style={{ color: "var(--ink-soft)" }}>{p.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
