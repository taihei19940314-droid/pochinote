import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "var(--paper)" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-6">
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="18" r="9" fill="var(--terra)" />
          <circle cx="10" cy="9" r="3" fill="var(--ink)" />
          <circle cx="22" cy="9" r="3" fill="var(--ink)" />
          <circle cx="6" cy="14" r="2.5" fill="var(--ink)" />
          <circle cx="26" cy="14" r="2.5" fill="var(--ink)" />
        </svg>

        {/* Brand name */}
        <div className="text-center">
          <h1
            className="text-5xl font-semibold tracking-tight"
            style={{ color: "var(--ink)" }}
          >
            Pochinote
          </h1>
          <p
            className="text-xs tracking-[0.25em] uppercase mt-1"
            style={{ color: "var(--ink-soft)" }}
          >
            for groomers
          </p>
        </div>

        {/* Tagline */}
        <p
          className="text-base text-center max-w-xs leading-relaxed"
          style={{ color: "var(--ink-soft)" }}
        >
          トリマーが、施術に集中できる毎日を。
        </p>

        {/* Status badge */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
          style={{
            background: "rgba(217,119,87,0.12)",
            color: "var(--terra-deep)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--terra)" }}
          />
          開発中 — Next.js + Supabase + LINE
        </div>

        {/* CTA */}
        <Button
          style={{ background: "var(--ink)", color: "var(--paper)" }}
          className="rounded-full px-8 mt-2"
        >
          ダッシュボードへ →
        </Button>
      </div>
    </main>
  );
}
