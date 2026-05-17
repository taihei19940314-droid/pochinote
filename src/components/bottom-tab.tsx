"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, MessageCircle } from "lucide-react";

const tabs = [
  { label: "ホーム",  href: "/dashboard",     icon: LayoutDashboard },
  { label: "顧客",    href: "/customers",      icon: FileText },
  { label: "LINE",    href: "/line-preview",   icon: MessageCircle },
];

export function BottomTab() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/customers")
      // bookings pages are reached from customers, so keep customers tab highlighted
      return pathname.startsWith("/customers") || pathname.startsWith("/bookings");
    return pathname === href;
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
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors"
            style={{
              minHeight: 56,
              color: active ? "var(--terra)" : "var(--ink-soft)",
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
