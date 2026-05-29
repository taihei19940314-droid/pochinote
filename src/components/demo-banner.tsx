"use client";

import { usePathname } from "next/navigation";

export function DemoBanner() {
  const pathname = usePathname();
  if (!pathname.startsWith("/demo")) return null;

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-center"
      style={{ background: "rgba(217,119,87,0.15)", color: "var(--terra)", borderBottom: "1px solid rgba(217,119,87,0.25)" }}
    >
      <span>👀</span>
      <span>これは「トリエル」の管理画面を体験できるデモ環境です。データは保存されません。</span>
    </div>
  );
}
