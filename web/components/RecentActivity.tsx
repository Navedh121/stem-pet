// Recent activity list — shows the last few sessions chronologically.
// "Session" = a contiguous burst of attempts on the same day.

import type { Attempt } from "@/lib/types";

interface Props {
  attempts: Attempt[];   // sorted by created_at desc, any number
}

const SKILL_LABEL: Record<string, string> = {
  addition:       "Addition",
  subtraction:    "Subtraction",
  multiplication: "Multiplication",
  division:       "Division",
};

// Format a UTC ISO string as "Today", "Yesterday", or "Mon 14 Jan"
function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default function RecentActivity({ attempts }: Props) {
  if (!attempts || attempts.length === 0) {
    return (
      <div className="card p-5">
        <p className="text-muted text-sm">
          No sessions yet — once your child plays, their activity shows up here.
        </p>
      </div>
    );
  }

  // Group attempts into "sessions" by day.
  const byDay = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const day = a.created_at.slice(0, 10);  // "YYYY-MM-DD"
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(a);
  }

  // Take the 5 most recent days.
  const recentDays = [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5);

  return (
    <div className="card p-5">
      <h3 className="font-display text-sm text-silk uppercase tracking-wider mb-4">
        Recent activity
      </h3>
      <div className="space-y-4">
        {recentDays.map(([day, dayAttempts]) => {
          const correct = dayAttempts.filter((a) => a.is_correct).length;
          const total = dayAttempts.length;
          const pct = Math.round((correct / total) * 100);

          // Summarise which skills were practiced.
          const skills = [...new Set(dayAttempts.map((a) => a.skill))];

          return (
            <div
              key={day}
              className="flex items-center justify-between border-b border-silk/10 pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="text-paper text-sm font-medium">
                  {formatDate(dayAttempts[0].created_at)}
                </p>
                <p className="text-muted text-xs mt-0.5">
                  {skills.map((s) => SKILL_LABEL[s] ?? s).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className="mono text-sm text-paper">{pct}%</p>
                <p className="text-muted text-xs">{total} questions</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
