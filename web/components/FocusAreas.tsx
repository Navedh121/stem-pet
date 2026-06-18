// Focus areas callout — identifies 1–2 weakest skills and
// phrases it as encouragement, not criticism.

import type { SkillMastery } from "@/lib/types";

interface Props {
  skills: SkillMastery[];
}

const SKILL_LABELS: Record<string, string> = {
  addition:       "Addition",
  subtraction:    "Subtraction",
  multiplication: "Multiplication",
  division:       "Division",
};

export default function FocusAreas({ skills }: Props) {
  if (!skills || skills.length === 0) {
    return (
      <div className="card p-5">
        <p className="text-muted text-sm">
          No data yet — play a few sessions to see focus areas.
        </p>
      </div>
    );
  }

  // Sort by mastery ascending to find the weakest.
  const weakest = [...skills]
    .filter((s) => s.attempts > 0)  // skip skills not yet tried
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 2);

  if (weakest.length === 0) {
    return (
      <div className="card p-5">
        <p className="text-muted text-sm">
          Keep playing to reveal focus areas!
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-display text-sm text-silk uppercase tracking-wider mb-3">
        Where to focus
      </h3>
      <div className="space-y-3">
        {weakest.map((s) => (
          <div key={s.skill} className="flex items-start gap-3">
            {/* Indicator dot in spider-red (attention signal) */}
            <span className="w-2 h-2 rounded-full bg-spider-red mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-paper text-sm font-medium">
                {SKILL_LABELS[s.skill] ?? s.skill}
              </p>
              <p className="text-muted text-xs mt-0.5">
                {SKILL_LABELS[s.skill] ?? s.skill} is where the most growth is
                right now — {s.mastery}% accuracy over {s.attempts} questions.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
