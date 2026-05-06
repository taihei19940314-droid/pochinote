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

        {/* Greeting */}
        <div className="col-span-5">
          <div className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>
            {dateLabel}
          </div>
          <h1 className="font-display text-[40px] leading-[1.08] font-light tracking-tight" style={{ color: "var(--ink)" }}>
            {greeting}、<span className="italic" style={{ color: "var(--terra)" }}>美咲</span>さん。<br />
            今日は <span className="font-semibold">7</span> 件の予約。
          </h1>
          <p className="text-sm mt-3" style={{ color: "var(--ink-soft)" }}>
            14:00〜15:30 に空きが出ています。<br />
            条件にあう常連さん 4 名 に{" "}
            <span className="font-semibold" style={{ color: "var(--terra)" }}>自動オファー</span>
            {" "}を準備しました。
          </p>
        </div>

        {/* KPI cards */}
        <div className="col-span-7 grid grid-cols-3 gap-4">

          {/* 稼働率 */}
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

          {/* 売上 */}
          <div className="card p-5">
            <div className="text-[11px] tracking-wider uppercase mb-3" style={{ color: "var(--ink-soft)" }}>本日売上(見込)</div>
            <div className="flex items-baseline gap-1">
              <span className="text-base" style={{ color: "var(--ink-soft)" }}>¥</span>
              <span className="font-display text-4xl font-light">68,400</span>
            </div>
            <div className="flex items-end gap-1 mt-3 h-8">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className={i === barHeights.length - 1 ? "bar flex-1" : "bar-muted flex-1"}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="text-[11px] mt-2" style={{ color: "var(--ink-soft)" }}>直近 7 日</div>
          </div>

          {/* オファー */}
          <div className="card p-5" style={{ background: "var(--ink)", color: "var(--paper)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-wider uppercase opacity-70">空き枠オファー</div>
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--terra)" }} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl font-light">4</span>
              <span className="text-sm opacity-70">件 待機中</span>
            </div>
            <div className="mt-3 text-[11px] font-semibold tracking-wider uppercase" style={{ color: "var(--terra)" }}>
              内容を確認 →
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
