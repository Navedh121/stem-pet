"use client";

// Parent sign-up page.
// Creates a new Supabase Auth account.
// The parent then adds their child and links their device from the dashboard.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

// NOTE: If Supabase has "Confirm email" enabled in Auth settings, signUp()
// returns a user object but NO active session (session: null). We detect this
// and show a "check your email" state instead of blindly pushing to /dashboard
// (which would just redirect back to /login because no session cookie exists).

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After email confirmation, redirect back to the app.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation is disabled — user has an active session immediately.
      // Navigate to the dashboard now.
      router.push("/dashboard");
      router.refresh();
    } else {
      // Email confirmation is enabled — session is null until the user clicks
      // the link in their inbox. Show a prompt instead of pushing to /dashboard
      // (which would redirect straight back to /login because no cookie exists).
      setCheckEmail(true);
      setLoading(false);
    }
  }

  // Show after signUp() when email confirmation is required.
  if (checkEmail) {
    return (
      <main className="min-h-screen bg-ink flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-center mb-8">
            <span className="font-display font-bold text-3xl text-paper" style={{ WebkitTextStroke: "1.5px #E11D2A" }}>STEM</span>
            <span className="font-display font-bold text-3xl text-spider-red">Pet</span>
          </div>
          <div className="card p-8 space-y-4">
            <p className="text-2xl">📬</p>
            <h1 className="font-display text-h3 text-paper">Check your email</h1>
            <p className="text-silk text-sm leading-relaxed">
              We sent a confirmation link to <strong className="text-paper">{email}</strong>.
              Click it to activate your account, then come back and sign in.
            </p>
            <Link
              href="/login"
              className="block w-full text-center bg-spider-red hover:bg-spider-red/90 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-display text-3xl text-paper">STEM</span>
          <span className="font-display text-3xl text-spider-red">Pet</span>
          <p className="text-muted text-sm mt-1">Create your parent account</p>
        </div>

        <div className="card p-8">
          <h1 className="font-display text-h3 text-paper mb-6">
            Get started
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-silk mb-1">
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
              <label htmlFor="password" className="block text-sm text-silk mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ink border border-silk/20 rounded-lg px-4 py-2.5 text-paper placeholder:text-muted focus:outline-none focus:border-web-blue transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm text-silk mb-1">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-ink border border-silk/20 rounded-lg px-4 py-2.5 text-paper placeholder:text-muted focus:outline-none focus:border-web-blue transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-spider-red text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-spider-red hover:bg-spider-red/90 text-white font-body font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-muted text-sm text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-web-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
