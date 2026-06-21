"use client";

// Form to add a child to the parent's account.
// Age group is no longer collected here — the child picks it on the
// device each session, so it's tracked per-attempt rather than per-child.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

export default function AddChildPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error: insertErr } = await supabase.from("children").insert({
      parent_id: user.id,
      name: name.trim(),
      // age_group is intentionally omitted — the child's age band is chosen
      // on the toy each session and stored on the attempt row instead.
    });

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/link-device");
  }

  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="font-display text-h2 text-paper mb-2">Add a child</h1>
      <p className="text-muted text-sm mb-8">
        Enter your child&apos;s name. The age group is chosen on the toy before each
        session, so you&apos;ll see separate progress for each band automatically.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm text-silk mb-1">
            Child&apos;s name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            className="w-full bg-ink border border-silk/20 rounded-lg px-4 py-2.5 text-paper placeholder:text-muted focus:outline-none focus:border-web-blue transition-colors"
          />
        </div>

        {error && <p className="text-spider-red text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-spider-red hover:bg-spider-red/90 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Saving…" : "Add child"}
        </button>
      </form>
    </div>
  );
}
