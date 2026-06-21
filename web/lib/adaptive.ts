// ============================================================
// Adaptive Difficulty Engine
// ============================================================
//
// This module answers one question: "given a child's history
// FOR A SPECIFIC AGE BAND, what skill and level should their
// NEXT question be?"
//
// Progress is tracked INDEPENDENTLY per age group — a child's
// 6-8 level is separate from their 10-12 level.  This reflects
// the fact that the child picks their age band on the device each
// session, so older siblings (or the same child a year later) can
// use the toy with an appropriate challenge level without
// resetting anyone else's progress.
//
// The rules are intentionally simple and explainable — a key
// talking point for portfolio / interview conversations:
//
//   • Skills progress in order: addition → subtraction →
//     multiplication → division.
//   • Each skill has levels 1–4 (numbers get bigger each level).
//   • Look at the child's last 10 attempts in their current skill
//     AND their current age band:
//       accuracy ≥ 80%  →  level up (or advance to next skill)
//       accuracy ≤ 40%  →  level down (min level 1)
//       otherwise       →  stay put
//
// A future upgrade could replace these rules with a machine-learning
// "knowledge tracing" model (see WHY_NOTES.md), but rules are better
// for v1 because they're explainable and need zero training data.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { SKILL_ORDER, MAX_LEVEL, type Skill, type Level, type AgeGroup } from "./types";

// What the engine returns — the chosen skill and level for the next question.
export type Difficulty = {
  skill: Skill;
  level: Level;
};

// How many recent attempts to look at when evaluating accuracy.
const WINDOW_SIZE = 10;

// Thresholds for advancing / regressing.
const ADVANCE_THRESHOLD = 0.8;   // 80%+ correct → go harder
const REGRESS_THRESHOLD = 0.4;   // 40%- correct → go easier

/**
 * Determine the appropriate skill and level for a child's next question
 * within a specific age band.
 *
 * @param childId   UUID of the child row in the database.
 * @param ageGroup  The age band chosen on the device this session.
 *                  Only attempts recorded under THIS band are used —
 *                  so each band has its own independent progress track.
 * @param supabase  A Supabase client (service-role recommended — no RLS issues).
 * @returns         The target { skill, level } for the next question.
 */
export async function getTargetDifficulty(
  childId: string,
  ageGroup: AgeGroup,
  supabase: SupabaseClient
): Promise<Difficulty> {
  // Step 1: Figure out where the child currently is IN THIS AGE BAND.
  // We look at their most recent attempt (filtered by age_group) to find
  // their "current" skill.
  const current = await getCurrentDifficulty(childId, ageGroup, supabase);

  // Step 2: Fetch the last WINDOW_SIZE attempts in that skill AND age band.
  const { data: attempts, error } = await supabase
    .from("attempts")
    .select("is_correct")
    .eq("child_id", childId)
    .eq("skill", current.skill)
    .eq("age_group", ageGroup)   // ← only consider this age band
    .order("created_at", { ascending: false })
    .limit(WINDOW_SIZE);

  if (error || !attempts || attempts.length < WINDOW_SIZE) {
    // Not enough data yet in this band — stay at the current level.
    return current;
  }

  // Step 3: Calculate accuracy over the window.
  const correctCount = attempts.filter((a) => a.is_correct).length;
  const accuracy = correctCount / attempts.length;

  // Step 4: Apply the rules.
  if (accuracy >= ADVANCE_THRESHOLD) {
    return advance(current);
  }
  if (accuracy <= REGRESS_THRESHOLD) {
    return regress(current);
  }
  return current;  // Stay put.
}

// ── Internal helpers ─────────────────────────────────────────

/**
 * Find the child's current skill and level in a given age band by looking
 * at their most recent attempt in that band.
 * Falls back to addition / level 1 for new children (or a new age band).
 */
async function getCurrentDifficulty(
  childId: string,
  ageGroup: AgeGroup,
  supabase: SupabaseClient
): Promise<Difficulty> {
  const { data } = await supabase
    .from("attempts")
    .select("skill, level")
    .eq("child_id", childId)
    .eq("age_group", ageGroup)   // ← only look at this band's history
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    // No history in this band — start at the beginning.
    return { skill: "addition", level: 1 };
  }

  return { skill: data.skill as Skill, level: data.level as Level };
}

/**
 * Move the child one step forward.
 * Level 1→2→3→4, then addition→subtraction→multiplication→division.
 */
function advance(current: Difficulty): Difficulty {
  if (current.level < MAX_LEVEL) {
    // Move up within the current skill.
    return { skill: current.skill, level: (current.level + 1) as Level };
  }

  // Already at the top level — advance to the next skill at level 1.
  const skillIndex = SKILL_ORDER.indexOf(current.skill);
  if (skillIndex < SKILL_ORDER.length - 1) {
    return { skill: SKILL_ORDER[skillIndex + 1], level: 1 };
  }

  // Already at division / level 4 — the highest we can go.
  return current;
}

/**
 * Move the child one step back (minimum level 1 — never change skill downward).
 */
function regress(current: Difficulty): Difficulty {
  if (current.level > 1) {
    return { skill: current.skill, level: (current.level - 1) as Level };
  }
  // Already at level 1 — can't go lower.
  return current;
}
