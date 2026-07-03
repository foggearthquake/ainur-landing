import { NextRequest, NextResponse } from "next/server";

// site.gabdra.pw serves a separate landing (cold-outreach asset for small
// business). Everything else — gabdra.pw and its own paths — passes through
// untouched.
const SITE_HOSTS = new Set(["site.gabdra.pw", "www.site.gabdra.pw"]);

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();

  if (SITE_HOSTS.has(host)) {
    const { pathname } = request.nextUrl;
    // Only rewrite the root so /api, /privacy, assets, etc. still resolve.
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/site", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static files; the middleware only cares about page routes.
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
