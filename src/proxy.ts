import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// /demo/* → actual app path mapping (longest prefix first)
const DEMO_PREFIXES: Array<[string, string]> = [
  ["/demo/line", "/line"],
  ["/demo/customers", "/customers"],
  ["/demo/bookings", "/bookings"],
  ["/demo/help", "/help"],
  ["/demo", "/dashboard"],
];

const PROTECTED_PATHS = ["/dashboard", "/line", "/customers", "/bookings", "/help"];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // /demo/* → internal rewrite to the real path (browser URL stays /demo/*)
  for (const [prefix, target] of DEMO_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      const rewritePath = target + pathname.slice(prefix.length);
      const rewriteUrl = new URL(rewritePath, request.url);
      rewriteUrl.search = request.nextUrl.search;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // Auth guard for protected paths
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (isProtected) {
    // Cookie already set → allow
    if (request.cookies.get("dashboard_auth")?.value === "ok") {
      return updateSession(request);
    }

    // URL key auth → set cookie and redirect to clean URL
    const key = searchParams.get("key");
    const expectedKey = process.env.DASHBOARD_ACCESS_KEY;
    if (key && expectedKey && key === expectedKey) {
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete("key");
      const res = NextResponse.redirect(cleanUrl);
      res.cookies.set("dashboard_auth", "ok", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90,
        path: "/",
      });
      return res;
    }

    // Not authenticated → redirect to /demo equivalent of the requested path
    // e.g. /customers/123 → /demo/customers/123, /dashboard → /demo
    const demoEquivalent = pathname === "/dashboard" ? "/demo" : `/demo${pathname}`;
    return NextResponse.redirect(new URL(demoEquivalent, request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
