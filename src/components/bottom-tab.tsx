"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, MessageCircle } from "lucide-react";

const tabs = [
  { label: "ホーム",  href: "/dashboard",  icon: LayoutDashboard },
  { label: "顧客",    href: "/customers",   icon: FileText },
  { label: "LINE",    href: "/line",         icon: MessageCircle },
];

export function BottomTab() {
  const pathname = usePathname();
  const isDemoMode = pathname.startsWith("/demo");
  const stripped = isDemoMode
    ? pathname === "/demo" ? "/dashboard" : pathname.replace(/^\/demo/, "")
    : pathname;

  function demoHref(href: string): string {
    if (!isDemoMode) return href;
    return href === "/dashboard" ? "/demo" : `/demo${href}`;
  }

  function isActive(href: string): boolean {
    if (href === "/dashboard") return stripped === "/dashboard";
    if (href === "/customers")
      return stripped.startsWith("/customers") || stripped.startsWith("/bookings");
    if (href === "/line") return stripped.startsWith("/line");
    return stripped === href;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t lg:hidden"
      style={{
        background: "var(--paper)",
        borderColor: "rgba(26,26,46,0.1)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={demoHref(href)}
            onClick={() => {
              if (active) {
                document.querySelector("#main-scroll")?.scrollTo({ top: 0, behavior: "instant" });
              }
            }}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors relative"
            style={{
              minHeight: 56,
              color: active ? "var(--terra)" : "var(--ink-soft)",
            }}
          >
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b"
                style={{ width: "40%", height: 4, background: "var(--terra)" }}
              />
            )}
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
