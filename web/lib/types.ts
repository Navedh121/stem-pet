// ============================================================
// Shared TypeScript types — used across API routes, components,
// and the adaptive engine.  Keep this the single source of truth
// so the shape of data is consistent from DB → API → UI.
// ============================================================

// ── Database row types ───────────────────────────────────────

// A child belonging to a parent.
export type Child = {
  id: string;
  parent_id: string;
  name: string;
  age_group: AgeGroup;
  created_at: string;
};

// A physical toy linked to a child.
export type Device = {
  id: string;
  child_id: string;
  device_code: string;
  last_seen_at: string | null;
};

// A cached or built-in math question.
export type Question = {
  id: string;
  skill: Skill;
  level: Level;
  age_group: AgeGroup;
  question_text: string;
  options: [string, string, string, string];  // exactly 4 choices
  correct_index: CorrectIndex;
  source: "generated" | "builtin";
  created_at: string;
};

// One answer attempt by a child.
export type Attempt = {
  id: string;
  child_id: string;
  question_id: string | null;
  skill: Skill;
  level: Level;
  is_correct: boolean;
  time_ms: number | null;
  created_at: string;
};

// ── Enum-like types ──────────────────────────────────────────

// Skills progress in this exact order (the adaptive engine uses this).
export type Skill = "addition" | "subtraction" | "multiplication" | "division";
export const SKILL_ORDER: Skill[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
];

// Levels within each skill.
export type Level = 1 | 2 | 3 | 4;
export const MAX_LEVEL = 4 as const;

// Valid age groups.
export type AgeGroup = "6-8" | "8-10" | "10-12";

// The correct_index is always 0–3 (index into the options array).
export type CorrectIndex = 0 | 1 | 2 | 3;

// ── API shapes ───────────────────────────────────────────────

// What the toy receives from GET /api/next-question
export type NextQuestionResponse = {
  question_id: string;
  question_text: string;
  options: [string, string, string, string];
  correct_index: CorrectIndex;
  skill: Skill;
  level: Level;
};

// What the toy sends to POST /api/submit-answer
export type SubmitAnswerBody = {
  device_code: string;
  question_id: string;
  selected_index: number;
  is_correct: boolean;
  time_ms: number;
};

// ── Dashboard / analytics shapes ────────────────────────────

// Skill mastery percentage (0–100), used by the Web of Progress radar.
export type SkillMastery = {
  skill: Skill;
  mastery: number;   // 0–100 — derived from recent accuracy at each skill
  attempts: number;  // total attempts for this skill
};

// Aggregated stats for the overview row of the dashboard.
export type DashboardStats = {
  currentStreak: number;       // consecutive days with at least one attempt
  totalQuestions: number;      // all-time attempts
  weeklyAccuracy: number;      // accuracy % this week (0–100)
  weeklyTimeSec: number;       // total time spent this week in seconds
  prevWeekAccuracy: number;    // last week's accuracy for delta display
  prevWeekTimeSec: number;     // last week's time for delta display
};
