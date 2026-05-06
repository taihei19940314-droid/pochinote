function getGreeting(hour: number) {
  if (hour < 12) return "おはよう";
  if (hour < 17) return "こんにちは";
  return "こんばんは";
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const barHeights = [40, 55, 35, 70, 50, 60, 85];

export default function DashboardPage() {
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateLabel = `${now.getFullYear()} / ${String(now.getMonth() + 1).padStart(2, "0")} / ${String(now.getDate()).padStart(2, "0")} — ${DAYS[now.getDay()]}`;

  return (
    <div className="max-w-5xl mx-auto py-8 px-2">
      {/* Hero strip */}
      <div className="grid grid-cols-12 gap-5 mb-8">
        <div className="col-span-5">
          <div className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>{dateLabel}</div>
          <h1 className="font-display text-[40px] leading-[1.08] font-light tracking-tight">
            {greeting}、<span className="italic" style={{ color: "var(--terra)" }}>美咲</span>さん。<br />
            今日は <span className="font-semibold">7</span> 件の予約。
          </h1>
          <p className="text-sm mt-3" style={{ color: "var(--ink-soft)" }}>
            14:00〜15:30 に空きが出ています。<br />
            条件にあう常連さん 4 名 に{" "}
            <span className="font-semibold" style={{ color: "var(--terra)" }}>自動オファー</span>を準備しました。
          </p>
        </div>

        <div className="col-span-7 grid grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="text-[11px] tracking-wider uppercase mb-3" style={{ color: "var(--ink-soft)" }}>本日の稼働率</div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl font-light">78</span>
              <span className="text-lg" style={{ color: "var(--ink-soft)" }}>%</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--paper-warm)" }}>
              <div className="h-full rounded-full" style={{ width: "78%", background: "var(--terra)" }} />
            </div>
            <div className="text-[11px] font-medium mt-2" style={{ color: "var(--sage)" }}>↑ 前週比 +12pt</div>
          </div>

          <div className="card p-5">
            <div className="text-[11px] tracking-wider uppercase mb-3" style={{ color: "var(--ink-soft)" }}>本日売上(見込)</div>
            <div className="flex items-baseline gap-1">
              <span className="text-base" style={{ color: "var(--ink-soft)" }}>¥</span>
              <span className="font-display text-4xl font-light">68,400</span>
            </div>
            <div className="flex items-end gap-1 mt-3 h-8">
              {barHeights.map((h, i) => (
                <div key={i} className={i === barHeights.length - 1 ? "bar flex-1" : "bar-muted flex-1"} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="text-[11px] mt-2" style={{ color: "var(--ink-soft)" }}>直近 7 日</div>
          </div>

          <div className="card p-5" style={{ background: "var(--ink)", color: "var(--paper)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-wider uppercase opacity-70">空き枠オファー</div>
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--terra)" }} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl font-light">4</span>
              <span className="text-sm opacity-70">件 待機中</span>
            </div>
            <div className="mt-3 text-[11px] font-semibold tracking-wider uppercase" style={{ color: "var(--terra)" }}>内容を確認 →</div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Schedule */}
        <div className="col-span-7 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">本日の予約</h2>
              <div className="text-xs mt-1 font-mono" style={{ color: "var(--ink-soft)" }}>7 件 / 9:00 — 18:30</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="pill" style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}>完了 2</span>
              <span className="pill" style={{ background: "rgba(217,119,87,0.15)", color: "var(--terra-deep)" }}>施術中 1</span>
              <span className="pill" style={{ background: "rgba(26,26,46,0.08)", color: "var(--ink-soft)" }}>予定 4</span>
            </div>
          </div>

          <div className="space-y-0">
            {/* 完了 */}
            <div className="flex items-center gap-4 py-3 border-b opacity-60" style={{ borderColor: "rgba(26,26,46,0.05)" }}>
              <div className="font-mono text-xs w-14" style={{ color: "var(--ink-soft)" }}>09:00</div>
              <div className="dot" style={{ background: "var(--sage)" }} />
              <div className="dog-avatar">🐕</div>
              <div className="flex-1">
                <div className="font-medium text-sm">モカ <span className="text-xs font-normal" style={{ color: "var(--ink-soft)" }}>/ トイプードル ♀ 4y</span></div>
                <div className="text-xs" style={{ color: "var(--ink-soft)" }}>フルコース + 部分カット · 田中様</div>
              </div>
              <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>¥8,800</div>
            </div>

            <div className="flex items-center gap-4 py-3 border-b opacity-60" style={{ borderColor: "rgba(26,26,46,0.05)" }}>
              <div className="font-mono text-xs w-14" style={{ color: "var(--ink-soft)" }}>10:30</div>
              <div className="dot" style={{ background: "var(--sage)" }} />
              <div className="dog-avatar">🐩</div>
              <div className="flex-1">
                <div className="font-medium text-sm">こてつ <span className="text-xs font-normal" style={{ color: "var(--ink-soft)" }}>/ シーズー ♂ 7y</span></div>
                <div className="text-xs" style={{ color: "var(--ink-soft)" }}>シャンプーのみ · 山田様</div>
              </div>
              <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>¥5,500</div>
            </div>

            {/* 施術中 */}
            <div className="flex items-center gap-4 py-3 border-b -mx-3 px-3 rounded-lg" style={{ borderColor: "rgba(26,26,46,0.05)", background: "linear-gradient(90deg, rgba(217,119,87,0.06), transparent)" }}>
              <div className="font-mono text-xs font-semibold w-14" style={{ color: "var(--terra-deep)" }}>12:00</div>
              <div className="dot" style={{ background: "var(--terra)" }} />
              <div className="dog-avatar">🐕‍🦺</div>
              <div className="flex-1">
                <div className="font-medium text-sm">ラテ <span className="text-xs font-normal" style={{ color: "var(--ink-soft)" }}>/ ゴールデンレトリバー ♀ 3y</span></div>
                <div className="text-xs flex items-center gap-2" style={{ color: "var(--ink-soft)" }}>
                  フルコース + 爪切り · 佐藤様
                  <span className="pill" style={{ background: "var(--terra)", color: "white" }}>施術中 残32分</span>
                </div>
              </div>
              <div className="text-xs font-mono font-semibold" style={{ color: "var(--terra-deep)" }}>¥12,800</div>
            </div>

            {/* 空き枠 */}
            <div className="flex items-center gap-4 py-3 border-b stripe-bg -mx-3 px-3 rounded-lg" style={{ borderColor: "rgba(26,26,46,0.05)" }}>
              <div className="font-mono text-xs w-14" style={{ color: "var(--ink-soft)" }}>14:00</div>
              <div className="dot" style={{ background: "var(--gold)" }} />
              <div className="dog-avatar opacity-40" style={{ background: "white", border: "1px dashed rgba(26,26,46,0.3)" }}>?</div>
              <div className="flex-1">
                <div className="font-medium text-sm" style={{ color: "var(--terra-deep)" }}>空き枠 — 90分</div>
                <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                  Pochinote が <span className="font-semibold" style={{ color: "var(--ink)" }}>4 名</span> に LINE オファー送信を提案中
                </div>
              </div>
              <button className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: "var(--ink)", color: "var(--paper)" }}>
                送信する
              </button>
            </div>

            {/* 予定 */}
            <div className="flex items-center gap-4 py-3 border-b" style={{ borderColor: "rgba(26,26,46,0.05)" }}>
              <div className="font-mono text-xs w-14" style={{ color: "var(--ink-soft)" }}>15:30</div>
              <div className="dot" style={{ background: "rgba(26,26,46,0.3)" }} />
              <div className="dog-avatar">🐕</div>
              <div className="flex-1">
                <div className="font-medium text-sm">ベル <span className="text-xs font-normal" style={{ color: "var(--ink-soft)" }}>/ ポメラニアン ♀ 2y</span></div>
                <div className="text-xs flex items-center gap-2" style={{ color: "var(--ink-soft)" }}>
                  フルコース · 鈴木様
                  <span className="pill" style={{ background: "rgba(200,155,60,0.18)", color: "var(--gold)" }}>⚠ 爪切り注意</span>
                </div>
              </div>
              <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>¥7,200</div>
            </div>

            <div className="flex items-center gap-4 py-3 border-b" style={{ borderColor: "rgba(26,26,46,0.05)" }}>
              <div className="font-mono text-xs w-14" style={{ color: "var(--ink-soft)" }}>17:00</div>
              <div className="dot" style={{ background: "rgba(26,26,46,0.3)" }} />
              <div className="dog-avatar">🐶</div>
              <div className="flex-1">
                <div className="font-medium text-sm">空(そら) <span className="text-xs font-normal" style={{ color: "var(--ink-soft)" }}>/ ミニチュアシュナウザー ♂ 5y</span></div>
                <div className="text-xs" style={{ color: "var(--ink-soft)" }}>フルコース + ハーブパック · 高橋様</div>
              </div>
              <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>¥9,500</div>
            </div>

            <div className="flex items-center gap-4 py-3">
              <div className="font-mono text-xs w-14" style={{ color: "var(--ink-soft)" }}>18:30</div>
              <div className="dot" style={{ background: "rgba(26,26,46,0.3)" }} />
              <div className="dog-avatar">🦮</div>
              <div className="flex-1">
                <div className="font-medium text-sm">小麦 <span className="text-xs font-normal" style={{ color: "var(--ink-soft)" }}>/ 柴犬 ♀ 8y</span></div>
                <div className="text-xs" style={{ color: "var(--ink-soft)" }}>シャンプー + 顔バリ · 渡辺様</div>
              </div>
              <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>¥6,800</div>
            </div>
          </div>
        </div>

        {/* Right col placeholder */}
        <div className="col-span-5" />
      </div>
    </div>
  );
}
