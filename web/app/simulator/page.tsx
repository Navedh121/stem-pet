"use client";

// ============================================================
//  STEMPet Simulator — /simulator  (no login required)
// ============================================================
//
//  This page stands in for the physical ESP32 toy.
//  It calls the EXACT same API endpoints the firmware uses,
//  with the EXACT same request shapes, so you can verify the
//  full question loop without flashing hardware.
//
//  What it does:
//    1. You enter a device_code (must already be linked in the
//       dashboard) and pick an age group.
//    2. "Get question" → calls GET /api/next-question?device_code=…&age_group=…
//    3. Clicking an option → calls POST /api/submit-answer with
//       is_correct and the same age_group.
//    4. After the result, a "Next question" button fetches the next one.
// ============================================================

import { useState } from "react";
import type { AgeGroup, NextQuestionResponse } from "@/lib/types";
import { AGE_GROUPS } from "@/lib/types";

type Phase = "setup" | "question" | "feedback";

// Friendly label for each option button.
const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export default function SimulatorPage() {
  const [phase, setPhase] = useState<Phase>("setup");

  // Setup form state.
  const [deviceCode, setDeviceCode] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("8-10");

  // Current question.
  const [question, setQuestion] = useState<NextQuestionResponse | null>(null);

  // Feedback after an answer.
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    selectedIndex: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch a question from the real API ───────────────────
  async function fetchQuestion() {
    setLoading(true);
    setError(null);

    const url = `/api/next-question?device_code=${encodeURIComponent(deviceCode.trim().toUpperCase())}&age_group=${encodeURIComponent(ageGroup)}`;

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? `Server error ${res.status}`);
        setLoading(false);
        return;
      }

      setQuestion(json as NextQuestionResponse);
      setFeedback(null);
      setPhase("question");
    } catch (err) {
      setError("Network error — is the server running?");
      console.error(err);
    }

    setLoading(false);
  }

  // ── Submit an answer to the real API ────────────────────
  async function submitAnswer(selectedIndex: number) {
    if (!question) return;

    const isCorrect = selectedIndex === question.correct_index;
    setFeedback({ correct: isCorrect, selectedIndex });
    setPhase("feedback");

    // Fire-and-forget, same as the firmware.
    fetch("/api/submit-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_code:    deviceCode.trim().toUpperCase(),
        question_id:    question.question_id,
        selected_index: selectedIndex,
        is_correct:     isCorrect,
        time_ms:        0,      // simulator doesn't track time
        age_group:      ageGroup,
      }),
    }).catch((err) => console.error("[simulator] submit error:", err));
  }

  // ── Handle "Next question" ───────────────────────────────
  async function nextQuestion() {
    await fetchQuestion();
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-ink text-paper flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="w-full max-w-md mb-8 text-center">
        <h1 className="font-display text-h2 text-paper mb-1">STEMPet Simulator</h1>
        <p className="text-muted text-sm">
          Stands in for the physical toy — uses the real API endpoints.
        </p>
      </div>

      <div className="w-full max-w-md">
        {/* ── SETUP PHASE ─────────────────────────────── */}
        {phase === "setup" && (
          <div className="card p-6 space-y-5">
            <div>
              <label htmlFor="device_code" className="block text-sm text-silk mb-1">
                Device code
              </label>
              <input
                id="device_code"
                type="text"
                required
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value)}
                placeholder="e.g. DEMO01"
                maxLength={10}
                className="w-full bg-ink border border-silk/20 rounded-lg px-4 py-2.5 text-paper placeholder:text-muted focus:outline-none focus:border-web-blue transition-colors mono uppercase tracking-widest"
              />
              <p className="text-muted text-xs mt-1">
                Must be linked to a child in the dashboard first.
              </p>
            </div>

            <div>
              <label htmlFor="age_group" className="block text-sm text-silk mb-1">
                Age group
              </label>
              <div className="flex gap-2">
                {AGE_GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setAgeGroup(g)}
                    className={[
                      "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                      g === ageGroup
                        ? "bg-spider-red border-spider-red text-white"
                        : "border-silk/20 text-silk hover:text-paper hover:border-silk/40",
                    ].join(" ")}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-spider-red text-sm">{error}</p>}

            <button
              type="button"
              disabled={!deviceCode.trim() || loading}
              onClick={fetchQuestion}
              className="w-full bg-spider-red hover:bg-spider-red/90 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Loading…" : "Get question →"}
            </button>
          </div>
        )}

        {/* ── QUESTION PHASE ──────────────────────────── */}
        {phase === "question" && question && (
          <div className="card p-6 space-y-5">
            {/* Meta row */}
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="mono uppercase tracking-wider">
                {question.skill} · Level {question.level}
              </span>
              <span className="bg-surface px-2 py-0.5 rounded-full">
                Ages {ageGroup}
              </span>
            </div>

            {/* Question text */}
            <p className="text-paper text-xl font-medium leading-snug">
              {question.question_text}
            </p>

            {/* Option buttons */}
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => submitAnswer(i)}
                  disabled={loading}
                  className="flex items-center gap-2 bg-surface border border-silk/15 hover:border-web-blue hover:bg-web-blue/5 text-paper px-4 py-3 rounded-xl transition-colors text-left"
                >
                  <span className="mono text-muted text-xs w-4">{OPTION_LABELS[i]}</span>
                  <span className="text-sm">{opt}</span>
                </button>
              ))}
            </div>

            {error && <p className="text-spider-red text-sm">{error}</p>}

            {/* Back to setup */}
            <button
              type="button"
              onClick={() => { setPhase("setup"); setQuestion(null); }}
              className="text-muted text-xs hover:text-silk transition-colors"
            >
              ← Change device / age group
            </button>
          </div>
        )}

        {/* ── FEEDBACK PHASE ──────────────────────────── */}
        {phase === "feedback" && question && feedback && (
          <div className="card p-6 space-y-5">
            {/* Result banner */}
            <div className={[
              "rounded-xl px-5 py-4 text-center",
              feedback.correct
                ? "bg-web-blue/10 border border-web-blue/30"
                : "bg-spider-red/10 border border-spider-red/30",
            ].join(" ")}>
              <p className={`text-2xl font-display font-bold ${feedback.correct ? "text-web-blue" : "text-spider-red"}`}>
                {feedback.correct ? "Correct!" : "Not quite!"}
              </p>
              {!feedback.correct && (
                <p className="text-muted text-sm mt-1">
                  Answer: <span className="text-paper font-medium">
                    {question.options[question.correct_index]}
                  </span>
                </p>
              )}
            </div>

            {/* Show all options with highlights */}
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt, i) => {
                const isCorrect = i === question.correct_index;
                const wasSelected = i === feedback.selectedIndex;
                return (
                  <div
                    key={i}
                    className={[
                      "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm",
                      isCorrect
                        ? "border-web-blue/50 bg-web-blue/10 text-paper"
                        : wasSelected && !isCorrect
                        ? "border-spider-red/50 bg-spider-red/10 text-muted line-through"
                        : "border-silk/10 text-muted/50",
                    ].join(" ")}
                  >
                    <span className="mono text-xs w-4">{OPTION_LABELS[i]}</span>
                    <span>{opt}</span>
                  </div>
                );
              })}
            </div>

            {error && <p className="text-spider-red text-sm">{error}</p>}

            <button
              type="button"
              disabled={loading}
              onClick={nextQuestion}
              className="w-full bg-spider-red hover:bg-spider-red/90 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Loading…" : "Next question →"}
            </button>

            <button
              type="button"
              onClick={() => { setPhase("setup"); setQuestion(null); setFeedback(null); }}
              className="w-full text-muted text-xs hover:text-silk transition-colors"
            >
              ← Change device / age group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
