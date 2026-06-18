// POST /api/submit-answer
//
// Called by the ESP32 toy after the child presses a button.
// Logs the attempt to the database so the parent dashboard can
// show progress.
//
// Body (JSON):
//   device_code    — identifies the toy
//   question_id    — UUID from the next-question response
//   selected_index — 0–3, which button was pressed
//   is_correct     — boolean (the toy already knows — it checked locally)
//   time_ms        — how long the child took to answer (milliseconds)
//
// Returns: { ok: true } on success.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import type { SubmitAnswerBody, Skill, Level } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: SubmitAnswerBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // We trust the toy's is_correct value — it compared locally against the
  // returned correct_index, so we don't need selected_index server-side.
  const { device_code, question_id, is_correct, time_ms } = body;

  // ── Validate required fields ─────────────────────────────
  if (!device_code || typeof is_correct !== "boolean") {
    return NextResponse.json(
      { error: "device_code and is_correct are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // ── Look up the device to find the child ─────────────────
  const { data: device, error: deviceErr } = await supabase
    .from("devices")
    .select("child_id")
    .eq("device_code", device_code)
    .single();

  if (deviceErr || !device) {
    return NextResponse.json({ error: "Unknown device_code" }, { status: 404 });
  }

  // ── Look up the question (if it has a real UUID) ─────────
  // We need skill and level for the attempt row.
  // If question_id starts with "ephemeral-" we couldn't save it earlier —
  // in that edge case we omit question_id and skill/level from the attempt.
  let questionId: string | null = null;
  let skill: Skill | null = null;
  let level: Level | null = null;

  const isEphemeral = question_id?.startsWith("ephemeral-");

  if (question_id && !isEphemeral) {
    const { data: question } = await supabase
      .from("questions")
      .select("id, skill, level")
      .eq("id", question_id)
      .single();

    if (question) {
      questionId = question.id;
      skill = question.skill as Skill;
      level = question.level as Level;
    }
  }

  // ── Insert the attempt ───────────────────────────────────
  const { error: insertErr } = await supabase.from("attempts").insert({
    child_id:    device.child_id,
    question_id: questionId,
    // If we couldn't look up the question, these will be null.
    // That's okay — the dashboard handles nulls gracefully.
    skill:       skill ?? "addition",
    level:       level ?? 1,
    is_correct,
    time_ms:     typeof time_ms === "number" ? time_ms : null,
  });

  if (insertErr) {
    console.error("[submit-answer] DB insert error:", insertErr);
    return NextResponse.json(
      { error: "Failed to save attempt" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
