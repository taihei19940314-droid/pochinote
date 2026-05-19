"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop({ selector }: { selector: string }) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const el = document.querySelector(selector);
    el?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, selector]);

  return null;
}
