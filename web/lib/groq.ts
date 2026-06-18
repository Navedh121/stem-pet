// ============================================================
// Groq question generator — SERVER SIDE ONLY
// ============================================================
// Uses the Groq API (free tier) to generate one math question
// at a time, given a skill, level, and age group.
//
// The response is validated to ensure:
//   • It's valid JSON.
//   • It has exactly 4 options.
//   • correct_index is 0–3.
//   • The question_text and all options are non-empty strings.
//
// If Groq fails or returns bad output, generateQuestion() returns
// null — the caller is responsible for falling back to a builtin.
// ============================================================

import type { Skill, Level, AgeGroup } from "./types";

// The model to use.  llama-3.3-70b-versatile is on the Groq free tier
// as of 2025; if it gets deprecated, swap to "llama3-8b-8192" or any
// other current free-tier Groq model.
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// The validated shape we expect from Groq.
export type GeneratedQuestion = {
  question_text: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
};

/**
 * Ask Groq to generate one math question.
 * Returns null if the API call fails or the output is invalid.
 *
 * @param skill     e.g. "multiplication"
 * @param level     1–4 (difficulty within the skill)
 * @param ageGroup  "6-8" | "8-10" | "10-12"
 */
export async function generateQuestion(
  skill: Skill,
  level: Level,
  ageGroup: AgeGroup
): Promise<GeneratedQuestion | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[groq] GROQ_API_KEY is not set — falling back to builtin");
    return null;
  }

  const prompt = buildPrompt(skill, level, ageGroup);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a math question generator for children. " +
              "Respond ONLY with valid JSON — no explanation, no markdown, no code blocks. " +
              "The JSON must match exactly the structure asked for.",
          },
          { role: "user", content: prompt },
        ],
        // Keep it small and fast — one question is a short response.
        max_tokens: 256,
        temperature: 0.8,
      }),
      // Abort if Groq takes longer than 10 seconds (ESP32 is waiting).
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`[groq] API error ${res.status}: ${await res.text()}`);
      return null;
    }

    const json = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "";

    return parseAndValidate(raw);
  } catch (err) {
    console.error("[groq] Fetch failed:", err);
    return null;
  }
}

// ── Prompt builder ───────────────────────────────────────────

function buildPrompt(skill: Skill, level: Level, ageGroup: AgeGroup): string {
  const numberRange = numberRangeForLevel(level);
  const tone = ageGroup === "6-8" ? "very simple" : ageGroup === "8-10" ? "simple" : "moderately challenging";
  const wordProblemHint =
    level >= 3
      ? " You may optionally write it as a short word problem " +
        "(e.g. about a web-slinger collecting items or swinging between buildings) " +
        "but do NOT use Marvel character names."
      : "";

  return (
    `Generate ONE ${tone} ${skill} question for a child aged ${ageGroup}. ` +
    `Use ${numberRange}.` +
    wordProblemHint +
    `\n\nRespond with ONLY this JSON (no other text):\n` +
    `{"question_text":"...","options":["option A","option B","option C","option D"],"correct_index":0}\n\n` +
    `Rules:\n` +
    `- options must have exactly 4 strings.\n` +
    `- correct_index must be 0, 1, 2, or 3 (the index of the correct answer in options).\n` +
    `- All 4 options must be distinct.\n` +
    `- The wrong answers should be plausible (close to the correct answer).`
  );
}

function numberRangeForLevel(level: Level): string {
  switch (level) {
    case 1: return "single-digit numbers (1–10)";
    case 2: return "numbers up to 50";
    case 3: return "numbers up to 200";
    case 4: return "numbers up to 1000";
  }
}

// ── Validation ───────────────────────────────────────────────

function parseAndValidate(raw: string): GeneratedQuestion | null {
  try {
    // Strip any accidental markdown code fence Groq sometimes adds.
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.question_text !== "string" ||
      !parsed.question_text.trim()
    ) {
      console.error("[groq] Invalid question_text:", parsed.question_text);
      return null;
    }

    if (
      !Array.isArray(parsed.options) ||
      parsed.options.length !== 4 ||
      parsed.options.some((o: unknown) => typeof o !== "string" || !(o as string).trim())
    ) {
      console.error("[groq] Invalid options:", parsed.options);
      return null;
    }

    const idx = parsed.correct_index;
    if (idx !== 0 && idx !== 1 && idx !== 2 && idx !== 3) {
      console.error("[groq] Invalid correct_index:", idx);
      return null;
    }

    // Ensure all 4 options are distinct.
    const unique = new Set(parsed.options.map((o: string) => o.trim()));
    if (unique.size < 4) {
      console.error("[groq] Duplicate options:", parsed.options);
      return null;
    }

    return {
      question_text: parsed.question_text.trim(),
      options: parsed.options.map((o: string) => o.trim()) as [string, string, string, string],
      correct_index: idx as 0 | 1 | 2 | 3,
    };
  } catch (err) {
    console.error("[groq] JSON parse error:", err, "\nRaw:", raw);
    return null;
  }
}
