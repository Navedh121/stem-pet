// GET /api/next-question?device_code=XYZ&age_group=8-10
//
// Called by the ESP32 toy (and the browser simulator) to get the next question.
// age_group is sent by the DEVICE each session — the child picks it on the
// hardware, so each session can be a different band without re-linking.
//
// Flow:
//   1. Validate device_code and age_group query params.
//   2. Look up the device to find the linked child.
//   3. Update the device's last_seen_at timestamp.
//   4. Call getTargetDifficulty() → random skill + adaptive level for that skill.
//   5. Fetch the child's 15 most-recent question IDs (used to avoid repeats).
//   6. Query cached questions for the chosen skill/level/age_group, EXCLUDING
//      those recent IDs, then pick one at random.
//   7. If excluding leaves nothing → generate a fresh question via Groq.
//   8. If Groq also fails → fall back to the full cached pool (no exclusion)
//      so variety grows over time while never returning an empty response.
//   9. If the pool is also empty → builtin fallback questions.
//
// There is NO session cap — questions keep coming forever.  Difficulty
// rises to level 4 per skill, then stays there indefinitely.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getTargetDifficulty } from "@/lib/adaptive";
import { generateQuestion } from "@/lib/groq";
import { isValidAgeGroup, type AgeGroup, type Skill, type Level } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const deviceCode  = searchParams.get("device_code");
  const rawAgeGroup = searchParams.get("age_group");

  // ── Validate query params ────────────────────────────────
  if (!deviceCode) {
    return NextResponse.json(
      { error: "Missing device_code query parameter" },
      { status: 400 }
    );
  }

  if (!rawAgeGroup || !isValidAgeGroup(rawAgeGroup)) {
    return NextResponse.json(
      { error: "Missing or invalid age_group. Must be one of: 6-8, 8-10, 10-12" },
      { status: 400 }
    );
  }

  const ageGroup: AgeGroup = rawAgeGroup;

  const supabase = createServiceClient();

  // ── Step 2: Look up the device + linked child ────────────
  const { data: device, error: deviceErr } = await supabase
    .from("devices")
    .select("id, child_id")
    .eq("device_code", deviceCode)
    .single();

  if (deviceErr || !device) {
    console.error("[next-question] Unknown device_code:", deviceCode, deviceErr);
    return NextResponse.json(
      { error: "Unknown device_code. Has the toy been linked to a child?" },
      { status: 404 }
    );
  }

  const childId: string = device.child_id;

  // ── Step 3: Update last_seen_at (fire-and-forget) ────────
  await supabase
    .from("devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", device.id);

  // ── Step 4: Adaptive difficulty ──────────────────────────
  // Picks a RANDOM skill, then computes the right level for it
  // based on recent accuracy in that skill + age band.
  // Each skill adapts independently — doing well at addition
  // doesn't affect the multiplication level.
  const { skill, level } = await getTargetDifficulty(childId, ageGroup, supabase);

  // ── Step 5: Collect recent question IDs to skip ──────────
  // Fetching the last 15 attempted question_ids lets us exclude
  // recently-seen questions from the cache pool to prevent repeats.
  // Ephemeral IDs (never saved to DB) start with "ephemeral-" and
  // can't be filtered by the DB query, so we strip them out.
  const { data: recentAttempts } = await supabase
    .from("attempts")
    .select("question_id")
    .eq("child_id", childId)
    .not("question_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(15);

  const recentIds: string[] = (recentAttempts ?? [])
    .map((a) => a.question_id as string | null)
    .filter((id): id is string => !!id && !id.startsWith("ephemeral-"));

  // ── Step 6: Try cached questions (excluding recent IDs) ──
  // Build the base query for this skill/level/age_group.
  let freshQuery = supabase
    .from("questions")
    .select("id, question_text, options, correct_index")
    .eq("skill", skill)
    .eq("level", level)
    .eq("age_group", ageGroup)
    .limit(20);

  // Only apply the exclusion filter when there are IDs to exclude.
  // An empty NOT IN clause would be invalid, and new children have none.
  if (recentIds.length > 0) {
    freshQuery = freshQuery.not("id", "in", `(${recentIds.join(",")})`);
  }

  const { data: freshPool } = await freshQuery;

  if (freshPool && freshPool.length > 0) {
    // Pick a random question from what hasn't been seen recently.
    const q = freshPool[Math.floor(Math.random() * freshPool.length)];
    return NextResponse.json({
      question_id:   q.id,
      question_text: q.question_text,
      options:       q.options,
      correct_index: q.correct_index,
      skill,
      level,
    });
  }

  // ── Step 7: Generate via Groq ────────────────────────────
  // The fresh pool was empty (all cached questions were recent).
  // Generate a new question so the pool grows over time.
  const generated = await generateQuestion(skill as Skill, level as Level, ageGroup);

  if (generated) {
    const { data: saved, error: saveErr } = await supabase
      .from("questions")
      .insert({
        skill,
        level,
        age_group:     ageGroup,
        question_text: generated.question_text,
        options:       generated.options,
        correct_index: generated.correct_index,
        source:        "generated",
      })
      .select("id")
      .single();

    if (saveErr || !saved) {
      // Could not persist it — return ephemeral so the toy isn't blocked.
      console.error("[next-question] Could not save generated question:", saveErr);
      return NextResponse.json({
        question_id:   "ephemeral-" + Date.now(),
        question_text: generated.question_text,
        options:       generated.options,
        correct_index: generated.correct_index,
        skill,
        level,
      });
    }

    return NextResponse.json({
      question_id:   saved.id,
      question_text: generated.question_text,
      options:       generated.options,
      correct_index: generated.correct_index,
      skill,
      level,
    });
  }

  // ── Step 8: Full cached pool (no exclusion) ──────────────
  // Groq failed.  Rather than blocking the toy, fall back to any
  // cached question for this skill/level — even if recently seen.
  // Over time the cache grows and repeats become rare.
  const { data: anyPool } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_index")
    .eq("skill", skill)
    .eq("level", level)
    .eq("age_group", ageGroup)
    .limit(20);

  if (anyPool && anyPool.length > 0) {
    const q = anyPool[Math.floor(Math.random() * anyPool.length)];
    return NextResponse.json({
      question_id:   q.id,
      question_text: q.question_text,
      options:       q.options,
      correct_index: q.correct_index,
      skill,
      level,
    });
  }

  // ── Step 9: Absolute fallback — builtin question ─────────
  // No cached questions exist at all for this combination.
  // Seed.sql should have covered this — if we're here, seed.sql
  // was probably not run in Supabase.
  const { data: fallback } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_index")
    .eq("source", "builtin")
    .eq("skill", skill)
    .limit(5);

  if (fallback && fallback.length > 0) {
    const q = fallback[Math.floor(Math.random() * fallback.length)];
    return NextResponse.json({
      question_id:   q.id,
      question_text: q.question_text,
      options:       q.options,
      correct_index: q.correct_index,
      skill,
      level,
    });
  }

  console.error("[next-question] No questions available for", skill, level, ageGroup);
  return NextResponse.json(
    { error: "No questions available. Was seed.sql run in Supabase?" },
    { status: 503 }
  );
}
