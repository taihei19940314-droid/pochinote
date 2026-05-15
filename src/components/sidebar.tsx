"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "ダッシュボード", href: "/dashboard" },
  { label: "顧客カルテ", href: "/customers" },
  { label: "飼い主LINE", href: "/line-preview" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 h-screen border-r" style={{ background: "var(--paper)" }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "var(--ink-soft, rgba(26,26,46,0.1))" }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="18" r="9" fill="var(--terra)" />
          <circle cx="10" cy="9" r="3" fill="var(--ink)" />
          <circle cx="22" cy="9" r="3" fill="var(--ink)" />
          <circle cx="6" cy="14" r="2.5" fill="var(--ink)" />
          <circle cx="26" cy="14" r="2.5" fill="var(--ink)" />
        </svg>
        <div>
          <div className="font-display text-lg font-semibold leading-none tracking-tight">Triel</div>
          <div className="text-[10px] tracking-[0.08em] mt-0.5" style={{ color: "var(--ink-soft, #8a8a9a)" }}>
            トリエル · for groomers
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {navItems.map(({ label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                color: active ? "var(--terra)" : "var(--ink)",
                background: active ? "rgba(217,119,87,0.08)" : "transparent",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="flex items-center gap-2 px-5 py-4 border-t text-xs font-mono" style={{ borderColor: "var(--ink-soft, rgba(26,26,46,0.1))", color: "var(--ink-soft, #8a8a9a)" }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--terra)" }} />
        <span>ぽちのて トリミング — 渋谷店</span>
      </div>
    </aside>
  );
}
