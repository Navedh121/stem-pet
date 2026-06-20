"use client";

// Parent login page.
// Uses Supabase email/password auth.
// The middleware redirects here when a parent tries to access /dashboard
// without being logged in.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Success — middleware will also catch this, but let's push explicitly.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <span className="font-display font-bold text-3xl text-paper" style={{ WebkitTextStroke: "1.5px #E11D2A", paintOrder: "stroke fill" }}>STEM</span>
          <span className="font-display font-bold text-3xl text-spider-red">Pet</span>
          <p className="text-muted text-sm mt-1">Parent portal</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h1 className="font-display text-h3 text-paper mb-6">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-silk mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ink border border-silk/20 rounded-lg px-4 py-2.5 text-paper placeholder:text-muted focus:outline-none focus:border-web-blue transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm text-silk mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ink border border-silk/20 rounded-lg px-4 py-2.5 text-paper placeholder:text-muted focus:outline-none focus:border-web-blue transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-spider-red text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-spider-red hover:bg-spider-red/90 text-white font-body font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-muted text-sm text-center mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-web-blue hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
