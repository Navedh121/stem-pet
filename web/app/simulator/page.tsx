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
//  Flow:
//    1. Enter a device_code and pick an age group.
//    2. Pick a difficulty level (1–4).
//    3. Each question is a random skill at that level.
//    4. "Next question" stays at the same level — no re-selecting.
//    "← Change level" re-shows the level screen.
//    "← Change device / age group" resets to the start.
// ============================================================

import { useState } from "react";
import type { AgeGroup, Level, NextQuestionResponse } from "@/lib/types";
import { AGE_GROUPS } from "@/lib/types";

type Phase = "setup" | "level" | "question" | "feedback";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

// Short descriptions shown on each level button.
const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: "Easy — small numbers",
  2: "Medium — stepping up",
  3: "Tricky — bigger numbers",
  4: "Challenge — the hardest",
};

export default function SimulatorPage() {
  const [phase, setPhase] = useState<Phase>("setup");

  // Setup state (device + age).
  const [deviceCode, setDeviceCode] = useState("");
  const [ageGroup, setAgeGroup]     = useState<AgeGroup>("8-10");

  // Level chosen on the level screen — fixed for the session.
  const [selectedLevel, setSelectedLevel] = useState<Level>(1);

  // Current question returned from the API.
  const [question, setQuestion] = useState<NextQuestionResponse | null>(null);

  // Feedback after answering.
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    selectedIndex: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // ── Fetch a question from the real API ───────────────────
  // The level param is passed explicitly so the level-selection buttons
  // can update state AND call this in one step (state updates are async).
  async function fetchQuestion(level: Level) {
    setLoading(true);
    setError(null);

    const url =
      `/api/next-question` +
      `?device_code=${encodeURIComponent(deviceCode.trim().toUpperCase())}` +
      `&age_group=${encodeURIComponent(ageGroup)}` +
      `&level=${level}`;

    try {
      const res  = await fetch(url);
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
        time_ms:        0,          // simulator doesn't track time
        age_group:      ageGroup,
      }),
    }).catch((err) => console.error("[simulator] submit error:", err));
  }

  // ── "Next question" — same level, new random skill ──────
  async function nextQuestion() {
    await fetchQuestion(selectedLevel);
  }

  // ── Reset helpers ────────────────────────────────────────
  function resetToSetup() {
    setPhase("setup");
    setQuestion(null);
    setFeedback(null);
    setError(null);
  }

  function resetToLevel() {
    setPhase("level");
    setQuestion(null);
    setFeedback(null);
    setError(null);
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
            {/* Device code */}
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

            {/* Age group */}
            <div>
              <label className="block text-sm text-silk mb-1">Age group</label>
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

            {/* Continue — advance to level selection */}
            <button
              type="button"
              disabled={!deviceCode.trim()}
              onClick={() => { setError(null); setPhase("level"); }}
              className="w-full bg-spider-red hover:bg-spider-red/90 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── LEVEL PHASE ─────────────────────────────── */}
        {phase === "level" && (
          <div className="card p-6 space-y-5">
            <div className="text-center">
              <h2 className="font-display text-xl text-paper">Choose your level</h2>
              <p className="text-muted text-sm mt-1">
                Ages {ageGroup} · Questions mix all four skills at this level
              </p>
            </div>

            {/* 4 level buttons — clicking one fetches immediately */}
            <div className="grid grid-cols-2 gap-3">
              {([1, 2, 3, 4] as Level[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setSelectedLevel(lvl);
                    fetchQuestion(lvl);
                  }}
                  className="flex flex-col items-start gap-1 bg-surface border border-silk/15 hover:border-web-blue hover:bg-web-blue/5 px-4 py-4 rounded-xl transition-colors text-left disabled:opacity-50"
                >
                  <span className="font-display text-paper font-bold text-lg">Level {lvl}</span>
                  <span className="text-muted text-xs">{LEVEL_DESCRIPTIONS[lvl]}</span>
                </button>
              ))}
            </div>

            {error  && <p className="text-spider-red text-sm">{error}</p>}
            {loading && <p className="text-muted text-sm text-center">Loading question…</p>}

            <button
              type="button"
              onClick={resetToSetup}
              className="text-muted text-xs hover:text-silk transition-colors"
            >
              ← Change device / age group
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

            <button
              type="button"
              onClick={resetToLevel}
              className="text-muted text-xs hover:text-silk transition-colors"
            >
              ← Change level
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
                  Answer:{" "}
                  <span className="text-paper font-medium">
                    {question.options[question.correct_index]}
                  </span>
                </p>
              )}
            </div>

            {/* Options with highlights */}
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt, i) => {
                const isCorrect  = i === question.correct_index;
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

            {/* Next question at same level */}
            <button
              type="button"
              disabled={loading}
              onClick={nextQuestion}
              className="w-full bg-spider-red hover:bg-spider-red/90 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Loading…" : "Next question →"}
            </button>

            {/* Navigation links */}
            <div className="flex justify-center gap-6">
              <button
                type="button"
                onClick={resetToLevel}
                className="text-muted text-xs hover:text-silk transition-colors"
              >
                ← Change level
              </button>
              <button
                type="button"
                onClick={resetToSetup}
                className="text-muted text-xs hover:text-silk transition-colors"
              >
                ← Change device / age group
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
