// Next.js middleware — runs on every request before the page renders.
// We use it to:
//   1. Refresh the Supabase session cookie so it doesn't expire mid-session.
//   2. Redirect unauthenticated users away from /dashboard/* to /login.
//   3. Redirect already-logged-in users away from /login and /signup to /dashboard.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Build a Supabase client that can read and set cookies via the response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Update both the request and response cookies.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session (this also rotates the cookie if needed).
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected routes — redirect to login if not signed in.
  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Auth pages — redirect to dashboard if already signed in.
  if ((pathname === "/login" || pathname === "/signup") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

// Only run middleware on these paths (not on static files or API routes).
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
