// Dashboard home — the parent's main view.
// Server Component that fetches all the data and passes it down
// to smaller client components for interactivity and animation.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import StatCard from "@/components/StatCard";
import WebOfProgress from "@/components/WebOfProgress";
import ProgressChart from "@/components/ProgressChart";
import FocusAreas from "@/components/FocusAreas";
import RecentActivity from "@/components/RecentActivity";
import type { Attempt, SkillMastery, DashboardStats, Skill } from "@/lib/types";

// ── Data aggregation helpers ─────────────────────────────────

// Calculate the parent's current streak (consecutive days with attempts).
function calcStreak(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0;

  const days = [...new Set(attempts.map((a) => a.created_at.slice(0, 10)))]
    .sort()
    .reverse();

  const today = new Date().toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== getPrevDay(today)) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === getPrevDay(days[i - 1])) streak++;
    else break;
  }
  return streak;
}

function getPrevDay(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Compute skill mastery % from the child's most recent 30 attempts per skill.
function calcMastery(attempts: Attempt[]): SkillMastery[] {
  const skills: Skill[] = ["addition", "subtraction", "multiplication", "division"];
  return skills.map((skill) => {
    const forSkill = attempts
      .filter((a) => a.skill === skill)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 30);
    if (forSkill.length === 0) return { skill, mastery: 0, attempts: 0 };
    const correct = forSkill.filter((a) => a.is_correct).length;
    return {
      skill,
      mastery: Math.round((correct / forSkill.length) * 100),
      attempts: forSkill.length,
    };
  });
}

// Build data for the accuracy-over-time chart (last 14 days).
function buildChartData(attempts: Attempt[]) {
  const now = new Date();
  const points = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayAttempts = attempts.filter((a) => a.created_at.startsWith(key));
    const correct = dayAttempts.filter((a) => a.is_correct).length;
    const total = dayAttempts.length;
    points.push({
      date: d.toLocaleDateString("en-GB", { weekday: "short" }),
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      questions: total,
    });
  }
  return points;
}

// ── Page ─────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load the first child (a simple v1 — full child-selector is a future enhancement).
  const { data: childRow } = await supabase
    .from("children")
    .select("id, name, age_group")
    .eq("parent_id", user.id)
    .order("created_at")
    .limit(1)
    .single();

  // No children yet — guide the parent to add one.
  if (!childRow) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
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

  // Load all attempts for this child (last 90 days for the charts).
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const { data: rawAttempts } = await supabase
    .from("attempts")
    .select("*")
    .eq("child_id", childRow.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  const attempts = (rawAttempts ?? []) as Attempt[];

  // ── Aggregate stats ────────────────────────────────────────

  // This week and last week windows.
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const thisWeek = attempts.filter((a) => new Date(a.created_at) >= weekAgo);
  const lastWeek = attempts.filter(
    (a) =>
      new Date(a.created_at) >= twoWeeksAgo &&
      new Date(a.created_at) < weekAgo
  );

  function pct(list: Attempt[]) {
    if (list.length === 0) return 0;
    return Math.round((list.filter((a) => a.is_correct).length / list.length) * 100);
  }

  function totalSec(list: Attempt[]) {
    return Math.round(
      list.reduce((sum, a) => sum + (a.time_ms ?? 0), 0) / 1000
    );
  }

  const stats: DashboardStats = {
    currentStreak:    calcStreak(attempts),
    totalQuestions:   attempts.length,
    weeklyAccuracy:   pct(thisWeek),
    weeklyTimeSec:    totalSec(thisWeek),
    prevWeekAccuracy: pct(lastWeek),
    prevWeekTimeSec:  totalSec(lastWeek),
  };

  const skillMastery = calcMastery(attempts);
  const chartData = buildChartData(attempts);

  return (
    <div className="space-y-8">
      {/* Child name header */}
      <div>
        <h1 className="font-display text-h2 text-paper">
          {childRow.name}&apos;s progress
        </h1>
        <p className="text-muted text-sm mt-1">
          Age group: {childRow.age_group} · {attempts.length} total questions answered
        </p>
      </div>

      {/* ── Stat cards row ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current streak"
          value={stats.currentStreak}
          unit=" days"
          color="red"
        />
        <StatCard
          label="Questions answered"
          value={stats.totalQuestions}
        />
        <StatCard
          label="This week's accuracy"
          value={stats.weeklyAccuracy}
          unit="%"
          delta={stats.weeklyAccuracy - stats.prevWeekAccuracy}
        />
        <StatCard
          label="Time practiced"
          value={Math.round(stats.weeklyTimeSec / 60)}
          unit=" min"
          delta={Math.round((stats.weeklyTimeSec - stats.prevWeekTimeSec) / 60)}
        />
      </div>

      {/* ── Web of Progress + Focus Areas ─────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar */}
        <div className="card p-6 flex flex-col items-center">
          <h3 className="font-display text-sm text-silk uppercase tracking-wider mb-6 self-start">
            Web of Progress
          </h3>
          <WebOfProgress data={skillMastery} size={280} />
        </div>

        {/* Focus areas */}
        <FocusAreas skills={skillMastery} />
      </div>

      {/* ── Progress over time ─────────────────────────────── */}
      <ProgressChart data={chartData} />

      {/* ── Recent activity ────────────────────────────────── */}
      <RecentActivity attempts={attempts.slice(0, 50)} />

      {/* ── Quick links ────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/dashboard/add-child"
          className="text-sm text-silk border border-silk/15 hover:border-silk/30 px-4 py-2 rounded-lg transition-colors"
        >
          + Add another child
        </Link>
        <Link
          href="/dashboard/link-device"
          className="text-sm text-silk border border-silk/15 hover:border-silk/30 px-4 py-2 rounded-lg transition-colors"
        >
          + Link a device
        </Link>
      </div>
    </div>
  );
}
