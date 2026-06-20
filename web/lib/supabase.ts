// ============================================================
// Supabase browser client
// ============================================================
// This file is safe to import in Client Components ("use client").
// It only uses NEXT_PUBLIC_ env vars which are exposed to the browser.
//
// IMPORTANT: Next.js only inlines NEXT_PUBLIC_ variables into the browser
// bundle when they are accessed by their literal static name at build time.
// Dynamic access like process.env[name] always resolves to undefined in the
// browser — so this file uses direct static references, not the getEnv()
// helper used in supabase-server.ts (which runs server-side only).
//
// For server-side Supabase access (Server Components, API routes),
// import from @/lib/supabase-server instead.
// ============================================================

import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

// Use this in any "use client" component that needs Supabase access.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (and on Vercel)."
    );
  }

  return _createBrowserClient(url, key);
}
