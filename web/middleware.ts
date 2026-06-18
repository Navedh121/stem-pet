// Next.js middleware — runs on the Edge Runtime before every matched request.
//
// We keep this intentionally thin: just check whether the Supabase auth
// cookie is present and redirect accordingly.  We do NOT import @supabase/ssr
// here because that package pulls in @supabase/supabase-js which uses
// Node.js APIs (process.version) incompatible with the Edge Runtime.
//
// Security note: this cookie check is only for routing (UX).  Real session
// validation happens server-side inside each dashboard Server Component via
// supabase.auth.getUser(), so there is no security regression.

import { NextRequest, NextResponse } from "next/server";

// Supabase stores the session in a cookie whose name matches this pattern:
//   sb-<project-ref>-auth-token
// Checking for its existence is enough to know if a user is logged in.
function isAuthenticated(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => c.name.includes("-auth-token"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = isAuthenticated(request);

  // Redirect unauthenticated users away from protected routes.
  if (pathname.startsWith("/dashboard") && !loggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect already-logged-in users away from auth pages.
  if ((pathname === "/login" || pathname === "/signup") && loggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Only run on these paths — static files and API routes are excluded.
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
