// GET /api/next-question?device_code=XYZ
//
// Called by the ESP32 toy to get the next math question.
// Flow:
//   1. Look up the device by device_code to find the linked child.
//   2. Update the device's last_seen_at timestamp.
//   3. Call getTargetDifficulty() to choose the right skill + level.
//   4. Try to reuse a cached question from the DB at that difficulty.
//   5. If no cached question, generate one via Groq and save it.
//   6. Fall back to a builtin question if Groq fails.
//   7. Return the question JSON.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getTargetDifficulty } from "@/lib/adaptive";
import { generateQuestion } from "@/lib/groq";
import type { AgeGroup, Skill, Level } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const deviceCode = searchParams.get("device_code");

  if (!deviceCode) {
    return NextResponse.json(
      { error: "Missing device_code query parameter" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // ── Step 1: Look up the device + linked child ────────────
  const { data: device, error: deviceErr } = await supabase
    .from("devices")
    .select("id, child_id, children(id, age_group)")
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ageGroup: AgeGroup = (device as any).children?.age_group ?? "8-10";

  // ── Step 2: Update last_seen_at ──────────────────────────
  await supabase
    .from("devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", device.id);

  // ── Step 3: Get adaptive difficulty ──────────────────────
  const { skill, level } = await getTargetDifficulty(childId, supabase);

  // ── Step 4: Try cached question ──────────────────────────
  // Pick a random cached question for this skill/level/age_group.
  // We use a random offset so children don't always see the same one.
  const { data: cachedQuestions } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_index")
    .eq("skill", skill)
    .eq("level", level)
    .eq("age_group", ageGroup)
    .limit(20);

  if (cachedQuestions && cachedQuestions.length > 0) {
    // Pick one at random so the child gets variety.
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

  // ── Step 5: Generate via Groq ────────────────────────────
  const generated = await generateQuestion(skill as Skill, level as Level, ageGroup);

  if (generated) {
    // Save to the questions table so future children can reuse it.
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
      // Non-fatal — we can still return the question without a DB ID.
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

  // ── Step 6: Absolute fallback — builtin question ─────────
  // If both cache and Groq failed, grab any builtin question.
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

  // Shouldn't happen if seed.sql was run, but handle gracefully.
  console.error("[next-question] No questions available for", skill, level, ageGroup);
  return NextResponse.json(
    { error: "No questions available. Was seed.sql run in Supabase?" },
    { status: 503 }
  );
}
