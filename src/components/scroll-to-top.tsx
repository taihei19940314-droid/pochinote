"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop({ selector }: { selector: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const el = document.querySelector(selector);
    el?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, selector]);

  return null;
}
