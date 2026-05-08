import Link from "next/link";
import BetaSignupForm from "@/components/beta-signup-form";

export default function HomePage() {
  return (
    <div style={{ background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>

      {/* Header */}
      <nav className="sticky top-0 z-40 border-b backdrop-blur-sm" style={{ background: "rgba(250,247,242,0.88)", borderColor: "rgba(26,26,46,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="18" r="9" fill="var(--terra)" />
              <circle cx="10" cy="9" r="3" fill="var(--ink)" />
              <circle cx="22" cy="9" r="3" fill="var(--ink)" />
              <circle cx="6" cy="14" r="2.5" fill="var(--ink)" />
              <circle cx="26" cy="14" r="2.5" fill="var(--ink)" />
            </svg>
            <div>
              <div className="font-display text-lg font-semibold leading-none tracking-tight">Pochinote</div>
              <div className="text-[9px] tracking-[0.18em] uppercase mt-0.5" style={{ color: "var(--ink-soft)" }}>for groomers</div>
            </div>
          </div>
          <Link href="/dashboard">
            <span className="text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80" style={{ background: "var(--ink)", color: "var(--paper)" }}>
              ダッシュボードへ →
            </span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-28 relative overflow-hidden" style={{
        background: "radial-gradient(ellipse 80% 50% at 70% 20%, rgba(217,119,87,0.15), transparent 60%), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(107,142,127,0.10), transparent 60%), var(--paper)"
      }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--terra)" }} />
            β版・先着 50 店舗 募集中
          </div>

          <h1 className="font-display text-[64px] leading-[0.96] font-light tracking-tight mb-7">
            トリマーが、<br />
            施術に<span className="font-semibold italic" style={{ color: "var(--terra)" }}>集中</span>できる<br />
            毎日を。
          </h1>

          <p className="text-lg leading-relaxed max-w-xl mb-10" style={{ color: "var(--ink-soft)" }}>
            LINE集客 × 空き枠自動販売 × ビフォーアフター活用。<br />
            <span className="font-semibold" style={{ color: "var(--ink)" }}>Pochinote は、トリマーのための"接客しないセールスエンジン"です。</span>
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-14">
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: "var(--terra)", color: "white" }}>
                β版を見てみる →
              </span>
            </Link>
            <Link href="/line-preview">
              <span className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-black/5" style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink)" }}>
                飼い主体験を見る
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-8">
            {[
              ["3分", "で初期設定完了"],
              ["¥0", "初期費用"],
              ["1タップ", "写真送信"],
            ].map(([num, label], i) => (
              <div key={i} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-10" style={{ background: "rgba(26,26,46,0.1)" }} />}
                <div>
                  <div className="font-display text-3xl font-light">{num}</div>
                  <div className="text-[11px] tracking-wider uppercase mt-1" style={{ color: "var(--ink-soft)" }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t" style={{ borderColor: "rgba(26,26,46,0.06)", background: "var(--paper-warm)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: "var(--ink-soft)" }}>What Pochinote does</div>
            <h2 className="font-display text-4xl font-light tracking-tight">
              売上を、寝ている間にも<span className="italic" style={{ color: "var(--terra)" }}>育てる</span>。
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {[
              { icon: "📊", title: "経営の見える化", href: "/dashboard",
                desc: "稼働率・売上・空き枠をダッシュボードで一目把握。勘ではなくデータで動ける。" },
              { icon: "💬", title: "自動オファー配信", href: "/dashboard",
                desc: "来店周期をAIが分析。空き枠が出たら常連さんにLINEで自動配信、リピート率UP。" },
              { icon: "📸", title: "ビフォーアフター活用", href: "/line-preview",
                desc: "施術後の写真をワンタップで飼い主に送信。SNS口コミに育ち、新規集客につながる。" },
            ].map((f) => (
              <Link key={f.title} href={f.href}>
                <div className="card p-7 h-full cursor-pointer transition-shadow hover:shadow-md">
                  <div className="text-4xl mb-5">{f.icon}</div>
                  <h3 className="font-display text-xl font-semibold mb-3 tracking-tight">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Beta CTA */}
      <section className="py-24 border-t" style={{ borderColor: "rgba(26,26,46,0.06)" }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="text-xs tracking-[0.2em] uppercase mb-4" style={{ color: "var(--ink-soft)" }}>Limited beta</div>
          <h2 className="font-display text-4xl font-light tracking-tight mb-4">β50店舗、限定募集中</h2>
          <p className="text-base mb-2" style={{ color: "var(--ink-soft)" }}>
            月額 <span className="font-semibold" style={{ color: "var(--ink)" }}>¥3,800</span>（Pro）・初月無料・いつでも解約可能
          </p>
          <p className="text-sm mb-10" style={{ color: "var(--ink-soft)" }}>初期費用なし。LINEと繋いで3分でスタート。</p>

          <BetaSignupForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t text-center text-xs" style={{ borderColor: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }}>
        © 2026 Pochinote · トリマーのための SaaS
      </footer>

    </div>
  );
}
