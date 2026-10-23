import { NextRequest, NextResponse } from "next/server";

// Subdomains that each serve their own landing from a route of this app:
// site.gabdra.pw — small-business sites, ai.gabdra.pw — AI systems. gabdra.pw
// itself is the hub linking all directions, and passes through untouched.
const HOST_ROUTES: Record<string, string> = {
  "site.gabdra.pw": "/site",
  "www.site.gabdra.pw": "/site",
  "ai.gabdra.pw": "/ai",
  "www.ai.gabdra.pw": "/ai",
};

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const route = HOST_ROUTES[host];

  // Only rewrite the root so /api, /privacy, assets, etc. still resolve.
  if (route && request.nextUrl.pathname === "/") {
    // nextUrl, а не new URL(route, request.url): за nginx (RU-копия) request.url = https://localhost:3001,
    // Next принимает это за внешний адрес и проксирует сам себя по HTTPS (EPROTO, 500)
    const url = request.nextUrl.clone();
    url.pathname = route;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static files; the middleware only cares about page routes.
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
