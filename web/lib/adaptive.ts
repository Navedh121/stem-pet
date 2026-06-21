// ============================================================
// Adaptive Difficulty Engine
// ============================================================
//
// Answers one question: "given this child's history in a
// specific age band, what skill and level should their NEXT
// question be?"
//
// KEY DESIGN DECISION — skills are now MIXED, not sequential.
// Every call picks a skill at random (uniform across all four).
// The level for each skill adapts independently based on recent
// accuracy in that skill + age band.  This keeps sessions varied
// and means the child practises everything, not just the skill
// they happen to be "on" in the old linear order.
//
// Per-skill level rules (applied independently per skill AND age band):
//   • Look at the child's last 10 attempts in that skill + band.
//   • accuracy ≥ 80%  →  level up    (ceiling: level 4)
//   • accuracy ≤ 40%  →  level down  (floor:   level 1)
//   • otherwise       →  stay put
//   • fewer than 10 attempts → not enough data, stay at the
//     current recorded level (or level 1 if brand new).
//
// Level 4 is the permanent ceiling — once a child reaches it,
// questions stay at level 4 for that skill forever.  There is
// NO session cap: questions keep coming indefinitely.
//
// A future upgrade could replace these simple rules with a
// machine-learning "knowledge tracing" model, but rules are
// better for v1 because they're explainable and need no
// training data. (See WHY_NOTES.md.)
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { SKILL_ORDER, MAX_LEVEL, type Skill, type Level, type AgeGroup } from "./types";

// What the engine returns — the chosen skill and level for the next question.
export type Difficulty = {
  skill: Skill;
  level: Level;
};

// How many recent attempts per skill to evaluate accuracy over.
const WINDOW_SIZE = 10;

// Thresholds for moving up or down a level.
const ADVANCE_THRESHOLD = 0.8;   // ≥ 80% correct in the window → level up
const REGRESS_THRESHOLD = 0.4;   // ≤ 40% correct in the window → level down

/**
 * Pick a random skill and compute the right level for it.
 *
 * The skill is chosen uniformly at random from all four so the child
 * gets variety every session.  The level for that skill is derived
 * solely from the child's recent performance in THAT skill and age
 * band — good addition scores don't affect the multiplication level.
 *
 * @param childId   UUID of the child row in the database.
 * @param ageGroup  Band chosen on the device this session.
 *                  Progress is tracked separately per band.
 * @param supabase  Service-role Supabase client (bypasses RLS).
 * @returns         { skill, level } for the next question.
 */
export async function getTargetDifficulty(
  childId: string,
  ageGroup: AgeGroup,
  supabase: SupabaseClient
): Promise<Difficulty> {
  // Step 1: Pick a random skill.
  // Math.floor(Math.random() * 4) gives 0, 1, 2, or 3 with equal probability.
  const skill: Skill = SKILL_ORDER[Math.floor(Math.random() * SKILL_ORDER.length)];

  // Step 2: Work out the appropriate level for that skill.
  const level = await getLevelForSkill(childId, skill, ageGroup, supabase);

  return { skill, level };
}

// ── Internal helper ───────────────────────────────────────────

/**
 * Compute the right level for a specific skill by inspecting
 * the child's recent attempts in that skill + age band.
 *
 * Returns level 1 if the child has never tried this skill
 * under the current age band — always start easy.
 */
async function getLevelForSkill(
  childId: string,
  skill: Skill,
  ageGroup: AgeGroup,
  supabase: SupabaseClient
): Promise<Level> {
  // Find the most recent attempt for this skill + band so we know
  // what level the child was last working at.
  const { data: lastAttempt } = await supabase
    .from("attempts")
    .select("level")
    .eq("child_id", childId)
    .eq("skill", skill)
    .eq("age_group", ageGroup)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // No history for this skill in this band yet — begin at level 1.
  if (!lastAttempt) return 1;

  const currentLevel = lastAttempt.level as Level;

  // Fetch the last WINDOW_SIZE attempts for this skill + band
  // to measure recent accuracy.
  const { data: window, error } = await supabase
    .from("attempts")
    .select("is_correct")
    .eq("child_id", childId)
    .eq("skill", skill)
    .eq("age_group", ageGroup)
    .order("created_at", { ascending: false })
    .limit(WINDOW_SIZE);

  if (error || !window || window.length < WINDOW_SIZE) {
    // Not enough recent data — keep the current level as-is.
    return currentLevel;
  }

  const correct  = window.filter((a) => a.is_correct).length;
  const accuracy = correct / window.length;

  if (accuracy >= ADVANCE_THRESHOLD && currentLevel < MAX_LEVEL) {
    // Child is doing well — step up one level.
    // If already at MAX_LEVEL (4), this branch is skipped and we stay put.
    return (currentLevel + 1) as Level;
  }

  if (accuracy <= REGRESS_THRESHOLD && currentLevel > 1) {
    // Child is struggling — step back one level.
    // If already at level 1, this branch is skipped and we stay put.
    return (currentLevel - 1) as Level;
  }

  // Accuracy is in the middle range, or level is already at its ceiling/floor.
  return currentLevel;
}
