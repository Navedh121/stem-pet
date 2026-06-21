// GET /api/next-question?device_code=XYZ&age_group=8-10
//
// Called by the ESP32 toy to get the next math question.
// age_group is now sent by the DEVICE (not read from the child record),
// because the child picks their age band on the hardware each session.
//
// Flow:
//   1. Validate device_code and age_group query params.
//   2. Look up the device to find the linked child.
//   3. Update the device's last_seen_at timestamp.
//   4. Call getTargetDifficulty() — scoped to the given age_group.
//   5. Try to reuse a cached question from the DB at that difficulty.
//   6. If no cached question, generate one via Groq and save it.
//   7. Fall back to a builtin question if Groq fails.
//   8. Return the question JSON.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getTargetDifficulty } from "@/lib/adaptive";
import { generateQuestion } from "@/lib/groq";
import { isValidAgeGroup, type AgeGroup, type Skill, type Level } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const deviceCode = searchParams.get("device_code");
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

  // age_group is valid from here on.
  const ageGroup: AgeGroup = rawAgeGroup;

  const supabase = createServiceClient();

  // ── Step 2: Look up the device + linked child ────────────
  // We no longer need to join children for age_group — the device sends it.
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

  // ── Step 3: Update last_seen_at ──────────────────────────
  await supabase
    .from("devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", device.id);

  // ── Step 4: Get adaptive difficulty for THIS age band ────
  // Progress is tracked independently per age group, so a child's
  // 6-8 level is separate from their 10-12 level.
  const { skill, level } = await getTargetDifficulty(childId, ageGroup, supabase);

  // ── Step 5: Try cached question ──────────────────────────
  // Pick a random cached question for this skill/level/age_group.
  const { data: cachedQuestions } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_index")
    .eq("skill", skill)
    .eq("level", level)
    .eq("age_group", ageGroup)
    .limit(20);

  if (cachedQuestions && cachedQuestions.length > 0) {
    const q = cachedQuestions[Math.floor(Math.random() * cachedQuestions.length)];
    return NextResponse.json({
      question_id:   q.id,
      question_text: q.question_text,
      options:       q.options,
      correct_index: q.correct_index,
      skill,
      level,
    });
  }

  // ── Step 6: Generate via Groq ────────────────────────────
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

  // ── Step 7: Absolute fallback — builtin question ─────────
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
