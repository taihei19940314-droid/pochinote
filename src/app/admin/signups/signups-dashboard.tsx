"use client";

import { useLogout } from "./admin-gate";
import { relativeTime } from "@/lib/relative-time";

interface Signup {
  id: number;
  email: string;
  created_at: string;
}

interface Props {
  signups: Signup[];
}

const BETA_GOAL = 50;

export default function SignupsDashboard({ signups }: Props) {
  const logout = useLogout();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

  const total = signups.length;
  const thisWeek = signups.filter(s => new Date(s.created_at).getTime() >= weekStart).length;
  const today = signups.filter(s => new Date(s.created_at).getTime() >= todayStart).length;
  const progress = Math.min(total / BETA_GOAL, 1);

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto py-10 px-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>Admin · β Signups</div>
            <h1 className="font-display text-4xl font-light tracking-tight">β募集 状況</h1>
            <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>Pochinote のβ50店舗、限定募集進捗</p>
          </div>
          <button
            onClick={logout}
            className="text-xs px-4 py-2 rounded-lg border transition-colors hover:bg-black/5"
            style={{ borderColor: "rgba(26,26,46,0.2)", color: "var(--ink-soft)" }}
          >
            ログアウト
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-5">
            <div className="text-[11px] tracking-wider uppercase mb-3" style={{ color: "var(--ink-soft)" }}>総申込数</div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl font-light">{total}</span>
              <span className="text-sm" style={{ color: "var(--ink-soft)" }}>件</span>
            </div>
          </div>
          <div className="card p-5">
            <div className="text-[11px] tracking-wider uppercase mb-3" style={{ color: "var(--ink-soft)" }}>今週(7日以内)</div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl font-light">{thisWeek}</span>
              <span className="text-sm" style={{ color: "var(--ink-soft)" }}>件</span>
            </div>
          </div>
          <div className="card p-5" style={{ background: "var(--ink)", color: "var(--paper)" }}>
            <div className="text-[11px] tracking-wider uppercase mb-3 opacity-60">今日</div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl font-light">{today}</span>
              <span className="text-sm opacity-60">件</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">β50店舗目標まで</div>
            <div className="font-display text-2xl font-light">
              <span style={{ color: "var(--terra)" }}>{total}</span>
              <span className="text-base font-normal" style={{ color: "var(--ink-soft)" }}> / {BETA_GOAL}</span>
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--paper-warm)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress * 100}%`, background: "var(--terra)" }}
            />
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--ink-soft)" }}>
            {total >= BETA_GOAL ? "🎉 目標達成！" : `残り ${BETA_GOAL - total} 店舗`}
          </div>
        </div>

        {/* Signup list */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(26,26,46,0.06)" }}>
            <h2 className="font-display text-xl font-semibold tracking-tight">申込者一覧</h2>
            <span className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>新しい順</span>
          </div>
          {signups.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: "var(--ink-soft)" }}>まだ申込がありません</div>
          ) : (
            <div>
              {signups.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-[rgba(217,119,87,0.04)]"
                  style={{
                    borderTop: i > 0 ? "1px solid rgba(26,26,46,0.05)" : undefined,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.email}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>{relativeTime(s.created_at)}</div>
                  </div>
                  <a
                    href="#"
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 whitespace-nowrap"
                    style={{ background: "rgba(217,119,87,0.12)", color: "var(--terra)" }}
                  >
                    LINEで連絡
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
