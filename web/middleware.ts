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

  // Block unauthenticated access to the dashboard and redirect to login.
  //
  // We intentionally do NOT redirect logged-in users away from /login or
  // /signup. The old rule (`if loggedIn && on /login → redirect /dashboard`)
  // caused an infinite loop: when a session cookie existed but the JWT was
  // expired, the middleware kept sending the user to /dashboard, the layout's
  // getUser() returned null and redirected back to /login, the middleware
  // sent them to /dashboard again, and so on. Removing this rule breaks the
  // cycle. After a successful login, router.push("/dashboard") in the login
  // page handles the forward navigation — no middleware redirect needed.
  if (pathname.startsWith("/dashboard") && !isAuthenticated(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Only protect dashboard routes — login/signup are intentionally unmatched.
export const config = {
  matcher: ["/dashboard/:path*"],
};
