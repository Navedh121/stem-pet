"use client";

// DashboardView — client component that owns all the interactive dashboard UI.
//
// The parent Server Component (dashboard/page.tsx) fetches ALL attempts once,
// then passes them here.  Tab switching filters in memory with useMemo —
// zero network round-trips, so it's instant on every device.

import { useState, useMemo } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import WebOfProgress from "@/components/WebOfProgress";
import ProgressChart from "@/components/ProgressChart";
import FocusAreas from "@/components/FocusAreas";
import RecentActivity from "@/components/RecentActivity";
import type { Attempt, SkillMastery, DashboardStats, Skill, AgeGroup } from "@/lib/types";
import { AGE_GROUPS } from "@/lib/types";

// ── Pure helpers (no server deps) ────────────────────────────

function getPrevDay(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

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

function buildChartData(attempts: Attempt[]) {
  const now = new Date();
  const points = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const day = attempts.filter((a) => a.created_at.startsWith(key));
    const correct = day.filter((a) => a.is_correct).length;
    points.push({
      date: d.toLocaleDateString("en-GB", { weekday: "short" }),
      accuracy: day.length > 0 ? Math.round((correct / day.length) * 100) : 0,
      questions: day.length,
    });
  }
  return points;
}

function pct(list: Attempt[]) {
  if (list.length === 0) return 0;
  return Math.round((list.filter((a) => a.is_correct).length / list.length) * 100);
}
function totalSec(list: Attempt[]) {
  return Math.round(list.reduce((s, a) => s + (a.time_ms ?? 0), 0) / 1000);
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  childName: string;
  allAttempts: Attempt[];  // last 90 days, all bands
}

export default function DashboardView({ childName, allAttempts }: Props) {
  // Which bands have at least one attempt
  const activeBands = useMemo(
    () =>
      new Set(
        allAttempts
          .map((a) => a.age_group)
          .filter((g): g is AgeGroup => g !== null)
      ),
    [allAttempts]
  );

  // Default to first active band, or "6-8" if brand new
  const [selectedBand, setSelectedBand] = useState<AgeGroup>(
    () => AGE_GROUPS.find((b) => activeBands.has(b)) ?? "6-8"
  );

  // ── All filtering is pure in-memory — no network calls ────
  const attempts = useMemo(
    () => allAttempts.filter((a) => a.age_group === selectedBand),
    [allAttempts, selectedBand]
  );

  // Date windows for weekly stats (computed once per render, not reactive)
  const weekAgo     = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 7);  return d; }, []);
  const twoWeeksAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 14); return d; }, []);

  const thisWeek = useMemo(
    () => attempts.filter((a) => new Date(a.created_at) >= weekAgo),
    [attempts, weekAgo]
  );
  const lastWeek = useMemo(
    () => attempts.filter(
      (a) => new Date(a.created_at) >= twoWeeksAgo && new Date(a.created_at) < weekAgo
    ),
    [attempts, twoWeeksAgo, weekAgo]
  );

  const stats: DashboardStats = useMemo(() => ({
    currentStreak:    calcStreak(attempts),
    totalQuestions:   attempts.length,
    weeklyAccuracy:   pct(thisWeek),
    weeklyTimeSec:    totalSec(thisWeek),
    prevWeekAccuracy: pct(lastWeek),
    prevWeekTimeSec:  totalSec(lastWeek),
  }), [attempts, thisWeek, lastWeek]);

  const skillMastery = useMemo(() => calcMastery(attempts), [attempts]);
  const chartData    = useMemo(() => buildChartData(attempts), [attempts]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-2xl sm:text-h2 text-paper leading-tight">
          {childName}&apos;s progress
        </h1>
        <p className="text-muted text-sm mt-1">
          {allAttempts.length} total questions answered across all age groups
        </p>
      </div>

      {/* ── Age-group tabs ──────────────────────────────────── */}
      {/* overflow-x-auto + negative margin lets it scroll on tiny screens
          without clipping the rounded corners of the pill container.       */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5">
        <div className="flex gap-1 bg-surface border border-silk/10 rounded-xl p-1 w-fit min-w-0">
          {AGE_GROUPS.map((band) => {
            const hasData  = activeBands.has(band);
            const isActive = band === selectedBand;
            return (
              <button
                key={band}
                type="button"
                onClick={() => setSelectedBand(band)}
                aria-pressed={isActive}
                className={[
                  "px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium",
                  "transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-spider-red text-white shadow-sm"
                    : hasData
                    ? "text-silk hover:text-paper hover:bg-ink/40 cursor-pointer"
                    : "text-silk/30 hover:text-silk/60 cursor-pointer",
                ].join(" ")}
              >
                Ages {band}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Empty-state banner ──────────────────────────────── */}
      {attempts.length === 0 && (
        <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-web-blue/30 bg-web-blue/5">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-web-blue/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#1E6BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-paper text-sm font-medium">
              No data yet for ages {selectedBand}
            </p>
            <p className="text-muted text-sm mt-0.5">
              {allAttempts.length > 0
                ? `${childName} has played under other age groups. Select "Ages ${selectedBand}" on the toy and answer a few questions.`
                : `Turn on the toy, pick "Ages ${selectedBand}" on the age screen, and answer a few questions — data will appear here within seconds.`}
            </p>
          </div>
          <Link
            href="/dashboard/link-device"
            className="flex-shrink-0 text-web-blue text-sm hover:underline whitespace-nowrap"
          >
            Link a device →
          </Link>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

      {/* ── Web of Progress + Focus Areas ───────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6 flex flex-col items-center">
          <h3 className="font-display text-sm text-silk uppercase tracking-wider mb-4 sm:mb-6 self-start">
            Web of Progress
          </h3>
          {/* size=260 on mobile so it stays within card padding */}
          <div className="w-full flex justify-center">
            <WebOfProgress data={skillMastery} size={260} />
          </div>
        </div>
        <FocusAreas skills={skillMastery} />
      </div>

      {/* ── Progress chart ───────────────────────────────────── */}
      <ProgressChart data={chartData} />

      {/* ── Recent activity ─────────────────────────────────── */}
      <RecentActivity attempts={attempts.slice(0, 50)} />

      {/* ── Quick links ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 sm:gap-3 pt-1 pb-4">
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
        <Link
          href="/simulator"
          className="text-sm text-silk border border-silk/15 hover:border-silk/30 px-4 py-2 rounded-lg transition-colors"
        >
          Open simulator →
        </Link>
      </div>
    </div>
  );
}
