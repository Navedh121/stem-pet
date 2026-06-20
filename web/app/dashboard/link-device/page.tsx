"use client";

// Link a physical STEMPet toy to a child.
// The parent enters the device_code printed on the toy.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

export default function LinkDevicePage() {
  const router = useRouter();
  const [deviceCode, setDeviceCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserClient();

    // Find the first child of this parent (simple v1 — one child at a time).
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: child } = await supabase
      .from("children")
      .select("id")
      .eq("parent_id", user.id)
      .order("created_at")
      .limit(1)
      .single();

    if (!child) {
      setError("Please add a child first before linking a device.");
      setLoading(false);
      return;
    }

    // Check if device_code is already in use.
    const { data: existing } = await supabase
      .from("devices")
      .select("id")
      .eq("device_code", deviceCode.toUpperCase().trim())
      .single();

    if (existing) {
      setError("This device code is already linked. Each toy can only be linked to one child.");
      setLoading(false);
      return;
    }

    const { error: insertErr } = await supabase.from("devices").insert({
      child_id:    child.id,
      device_code: deviceCode.toUpperCase().trim(),
    });

    if (insertErr) {
      // Postgres unique_violation (23505) means the code is already taken by
      // another account — RLS hid it from the pre-check SELECT above.
      if ((insertErr as { code?: string }).code === "23505") {
        setError("That device code is already linked to another account. Double-check the code on your toy.");
      } else {
        setError(insertErr.message);
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="font-display text-h2 text-paper mb-2">Link your toy</h1>
      <p className="text-muted text-sm mb-8">
        Find the device code on the label on the back of your STEMPet toy and
        enter it below to link it to your child&apos;s account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="code" className="block text-sm text-silk mb-1">
            Device code
          </label>
          <input
            id="code"
            type="text"
            required
            value={deviceCode}
            onChange={(e) => setDeviceCode(e.target.value)}
            placeholder="e.g. DEMO01"
            maxLength={10}
            className="w-full bg-ink border border-silk/20 rounded-lg px-4 py-2.5 text-paper placeholder:text-muted focus:outline-none focus:border-web-blue transition-colors mono uppercase tracking-widest"
          />
        </div>

        {error && <p className="text-spider-red text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-spider-red hover:bg-spider-red/90 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Linking…" : "Link toy"}
        </button>
      </form>

      <p className="text-muted text-xs mt-6 leading-relaxed">
        Don&apos;t have a device code? You&apos;ll find it in the firmware config block —
        it&apos;s the value you set for <span className="mono text-silk">DEVICE_CODE</span> before flashing.
      </p>
    </div>
  );
}
