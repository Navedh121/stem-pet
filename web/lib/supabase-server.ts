// ============================================================
// Supabase server-side clients
// ============================================================
// Import ONLY in Server Components, API route handlers, and middleware.
// Never import this in "use client" files — it uses next/headers which
// is unavailable in the browser bundle.
// ============================================================

import { createServerClient as _createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(
      `Missing environment variable: ${name}\n` +
      `Copy .env.example → .env.local and fill in your Supabase credentials.`
    );
  }
  return val;
}

// ── Server client ─────────────────────────────────────────────
// Use in Server Components or route handlers to act as the logged-in parent.
// Reads the session from HTTP cookies automatically.

export async function createServerClient() {
  const cookieStore = await cookies();

  return _createServerClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll throws when called from a Server Component (not a route).
            // Safe to ignore — middleware keeps the session alive.
          }
        },
      },
    }
  );
}

// ── Service-role client ───────────────────────────────────────
// ONLY use in API routes. Bypasses Row Level Security so the toy's
// device_code lookup works without a parent being logged in.
// Never expose the service role key to the browser.

export function createServiceClient() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
