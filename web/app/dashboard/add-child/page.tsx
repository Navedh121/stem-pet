"use client";

// Form to add a child to the parent's account.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import type { AgeGroup } from "@/lib/types";

export default function AddChildPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("8-10");
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
      age_group: ageGroup,
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
        Give them a name and select their age group. You can add more children later.
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

        <div>
          <label htmlFor="age_group" className="block text-sm text-silk mb-1">
            Age group
          </label>
          <select
            id="age_group"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
            className="w-full bg-ink border border-silk/20 rounded-lg px-4 py-2.5 text-paper focus:outline-none focus:border-web-blue transition-colors"
          >
            <option value="6-8">6–8 years</option>
            <option value="8-10">8–10 years</option>
            <option value="10-12">10–12 years</option>
          </select>
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
