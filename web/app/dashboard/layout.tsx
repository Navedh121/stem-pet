// Dashboard layout — topbar with logo, child selector, account menu.
// This is a Server Component that reads the parent's children from Supabase.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import type { Child } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  // Confirm the user is authenticated.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load the parent's children for the topbar child selector.
  const { data: children_list } = await supabase
    .from("children")
    .select("id, name, age_group")
    .eq("parent_id", user.id)
    .order("created_at");

  const kids: Child[] = (children_list as Child[]) ?? [];

  async function signOut() {
    "use server";
    const sb = await createServerClient();
    await sb.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* ── Topbar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-ink/90 backdrop-blur border-b border-silk/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-1 flex-shrink-0">
            <span className="font-display font-bold text-xl text-paper" style={{ WebkitTextStroke: "1px #E11D2A" }}>STEM</span>
            <span className="font-display font-bold text-xl text-spider-red">Pet</span>
          </Link>

          {/* Child selector + actions */}
          <div className="flex items-center gap-3 ml-auto">
            {kids.length > 0 ? (
              <select
                aria-label="Select child"
                defaultValue={kids[0]?.id}
                className="bg-surface border border-silk/15 rounded-lg px-3 py-1.5 text-sm text-paper focus:outline-none focus:border-web-blue"
              >
                {kids.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            ) : (
              <Link
                href="/dashboard/add-child"
                className="text-web-blue text-sm hover:underline"
              >
                + Add a child
              </Link>
            )}

            {/* Account menu */}
            <form action={signOut}>
              <button
                type="submit"
                className="text-muted hover:text-silk text-sm transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
