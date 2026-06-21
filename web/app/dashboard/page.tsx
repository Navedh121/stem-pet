// Dashboard home — Server Component.
// Responsibility: auth check, DB fetch.  ALL rendering is in DashboardView (client).

import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import DashboardView from "@/components/DashboardView";
import type { Attempt } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: childRow } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", user.id)
    .order("created_at")
    .limit(1)
    .single();

  // No children yet — guide the parent to add one.
  if (!childRow) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center gap-4 px-4">
        <h2 className="font-display text-h2 text-paper">Welcome to STEMPet!</h2>
        <p className="text-muted max-w-sm">
          Add your child and link their toy to start seeing their progress here.
        </p>
        <Link
          href="/dashboard/add-child"
          className="bg-spider-red hover:bg-spider-red/90 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Add a child
        </Link>
      </div>
    );
  }

  // Fetch all attempts for the last 90 days (all age bands).
  // DashboardView filters them client-side when the user switches tabs.
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const { data: rawAttempts } = await supabase
    .from("attempts")
    .select("*")
    .eq("child_id", childRow.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  return (
    <DashboardView
      childName={childRow.name}
      allAttempts={(rawAttempts ?? []) as Attempt[]}
    />
  );
}
