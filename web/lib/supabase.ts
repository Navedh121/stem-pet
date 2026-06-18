// ============================================================
// Supabase browser client
// ============================================================
// This file is safe to import in Client Components ("use client").
// It only uses NEXT_PUBLIC_ env vars which are exposed to the browser.
//
// For server-side Supabase access (Server Components, API routes),
// import from @/lib/supabase-server instead.
// ============================================================

import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

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

// Use this in any "use client" component that needs Supabase access.
// It reads the Supabase URL and anon key from NEXT_PUBLIC_* env vars
// which are safe to expose to the browser.
export function createBrowserClient() {
  return _createBrowserClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}
