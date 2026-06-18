# STEMPet — Project Context (Claude Code reads this first)

You are building **STEMPet**, an adaptive math-learning system. This file is the
single source of truth for what to build. Read it fully, then read
`DESIGN_BRIEF.md` (website look) and `legacy_firmware.ino` (the existing,
working ESP32 code you must preserve as the offline fallback).

The person you're building for is **one beginner developer** preparing this as a
portfolio project for AI-engineering internships. **Work autonomously.** Make
reasonable engineering choices and document them — do NOT stop to ask questions
about anything you can decide yourself. Only the external account steps (listed
at the bottom) are left to the human.

---

## 1. What the product is

A physical toy (ESP32 + small screen + 4 buttons) asks a child (age 6–12) math
questions. The questions **adapt** to the child's ability. A **parent website**
shows the child's progress so parents can see they're improving. The child never
uses the website — only parents do. The whole point is learning *off* a screen.

The current toy works fully offline and generates simple arithmetic itself. We
are adding an **online "smart mode"** on top, without removing the offline mode,
and **without any hardware change** — the only thing the human re-flashes is new
firmware. If WiFi/API ever fails, the toy must fall back to the existing offline
behavior.

---

## 2. Tech stack (decided — do not substitute)

- **Web app + API:** Next.js (App Router) + TypeScript + Tailwind CSS, with
  **Framer Motion** (animation) and **Recharts** (charts). The same Next.js app
  serves the parent website AND the API endpoints the toy calls. Hosted on
  **Vercel** (free).
- **Database + parent login:** **Supabase** (Postgres + Supabase Auth, free).
  Use Supabase only for data + auth; do all server logic in Next.js API routes.
- **Question generation (the AI part):** **Groq** API (`console.groq.com`, free,
  no credit card). Call it **server-side only** from Next.js API routes. Use a
  current free Groq model (e.g. `llama-3.3-70b-versatile`; if it's not on the
  free tier at build time, pick another free Groq model and note which).
- **Firmware:** ESP32 Arduino sketch (extends `legacy_firmware.ino`).

**Secrets:** never hard-code keys. Use a `.env.local` file (web) and a clearly
marked config block at the top of the firmware sketch. Provide a `.env.example`
listing every variable. List all required env vars in the README.

---

## 3. Repo structure to create

```
/web          Next.js app (website + API routes)
/firmware     ESP32 Arduino sketch (online mode + offline fallback)
/supabase     schema.sql (tables), seed.sql (built-in fallback questions + demo data)
DESIGN_BRIEF.md   (already provided — the website look; follow it exactly)
README.md         (exact setup + deploy steps for the human)
WHY_NOTES.md      (plain-English log of every major decision and why — see §10)
```

---

## 4. How the system works (the flow)

1. Toy boots, tries to join WiFi (credentials in firmware config).
2. **Online mode (WiFi OK):** toy calls `GET /api/next-question` with its device
   code. Server decides the right difficulty for that child, returns one question
   (text, 4 options, the correct-option index, a question id, skill, level).
3. Toy shows the question, reads the button press, and checks correctness
   **locally** against the returned index → instant feedback (no network wait).
4. Toy calls `POST /api/submit-answer` to log the result, then shows the next
   question. **Prefetch:** fetch the next question in the background while the
   child reads the current one, so there's no visible delay.
5. **Offline mode (WiFi/API fails at any point):** toy silently falls back to the
   existing local generator from `legacy_firmware.ino`. Nothing breaks.
6. Parent logs into the website, sees their child's progress built from the
   logged attempts.

---

## 5. Data model (Supabase / Postgres tables)

- `children` — `id`, `parent_id` (= auth user id), `name`, `age_group`
  (`6-8`/`8-10`/`10-12`), `created_at`.
- `devices` — `id`, `child_id`, `device_code` (short code the parent enters once
  to link a toy to a child), `last_seen_at`.
- `questions` — `id`, `skill` (`addition`/`subtraction`/`multiplication`/
  `division`), `level` (1–4), `age_group`, `question_text`, `options` (jsonb,
  4 strings), `correct_index` (0–3), `source` (`generated`/`builtin`),
  `created_at`. Acts as a cache so generated questions can be reused.
- `attempts` — `id`, `child_id`, `question_id`, `skill`, `level`, `is_correct`
  (bool), `time_ms` (int), `created_at`. This is the core progress data.

Use Row Level Security so a parent can only read their own children's rows.
The toy's API calls authenticate with the `device_code` (server-side check), not
a parent login.

---

## 6. API endpoints (Next.js API routes; the toy calls these)

- `GET /api/next-question?device_code=XYZ`
  → look up the child, compute target difficulty (§7), then return a question at
  that skill+level: reuse a cached `questions` row if a fresh one exists,
  otherwise generate one via Groq (§8), save it, and return it.
  Response: `{ question_id, question_text, options: [..4], correct_index, skill, level }`.
- `POST /api/submit-answer`
  body `{ device_code, question_id, selected_index, is_correct, time_ms }`
  → insert an `attempts` row. Return `{ ok: true }`.

For the demo, ESP32 HTTPS may use an insecure TLS client (skip cert pinning) to
keep firmware simple — note this in WHY_NOTES as a demo-only shortcut.

---

## 7. Adaptive difficulty engine (the personalization)

Keep it simple and **fully explainable** (this is a talking point in interviews):

- Skills progress in order: addition → subtraction → multiplication → division.
  Each skill has levels 1–4 (number ranges grow with level + age group).
- Start every new child at addition / level 1.
- Look at the child's **last 10 attempts in the current skill**:
  - accuracy ≥ 80% → move up one level; if already level 4, advance to the next
    skill at level 1.
  - accuracy ≤ 40% → move down one level (min level 1).
  - otherwise → stay.
- Always store the chosen `skill` + `level` on the returned question so the toy
  and the logs agree.
- Put this logic in one well-commented module (e.g. `web/lib/adaptive.ts`) so it
  reads as a clear, self-contained "engine."

In WHY_NOTES, add a short note that a future upgrade could replace these rules
with a machine-learning "knowledge tracing" model — but we keep rules for v1
because they're explainable and need no training data.

---

## 8. Groq question generation

- Server-side only. Given a target `skill`, `level`, and `age_group`, prompt Groq
  to return **one** age-appropriate question as strict JSON:
  `{ "question_text": "...", "options": ["..","..","..",".."], "correct_index": 0-3 }`.
- Validate the JSON and that exactly one option is correct before saving. If Groq
  fails or returns bad JSON, fall back to a `builtin` question from the seeded set
  (so the API never returns nothing).
- For higher levels / older kids, allow short word problems. Optional fun touch:
  light spider-hero flavor in word problems (original, not Marvel characters).

---

## 9. Website (follow DESIGN_BRIEF.md exactly)

Two parts in the one Next.js app:
- **Public landing page** — premium, animated, "this product is worth it" feel.
- **Parent area (behind Supabase Auth)** — sign up / log in, add a child, link a
  device by entering its `device_code`, and a **dashboard**: stat cards (streak,
  questions answered, accuracy, time practiced), the **Web of Progress** skill
  radar (the signature element), a progress-over-time chart, a focus-areas
  callout, and recent activity.

All visual decisions (colors, fonts, the radar, motion, anti-patterns) are in
`DESIGN_BRIEF.md`. Do not invent a different look.

---

## 10. Build in these phases (in order, committing after each)

1. **Scaffold** `/web` (Next.js + TS + Tailwind + Framer Motion + Recharts);
   wire up fonts from the brief; set up the Supabase client and `.env.example`.
2. **Database + auth** — `supabase/schema.sql`, RLS, and email/password login.
3. **API + AI** — `next-question` + `submit-answer`, the adaptive engine (§7),
   Groq generation (§8), and `supabase/seed.sql` with built-in fallback questions.
4. **Firmware** — extend `legacy_firmware.ino`: add WiFi + HTTPS calls + online
   question flow + prefetch, keep the existing display/buttons/feedback, and keep
   the old generator as the **offline fallback**. A clearly labeled config block
   at the top holds WiFi SSID/password and the API base URL.
5. **Landing page** — per DESIGN_BRIEF.
6. **Dashboard** — per DESIGN_BRIEF, including the Web of Progress radar.
7. **Demo data** — seed one sample child with realistic attempts so the dashboard
   looks alive for screenshots / the portfolio.
8. **Docs** — `README.md` (exact setup + deploy, see §11) and `WHY_NOTES.md`
   (every major decision: why Next.js, why Supabase, why Groq, why rule-based
   adaptation, the HTTPS demo shortcut, etc., in plain English).

Write clean, **beginner-friendly commented** code throughout — the human is
learning from it.

---

## 11. What the human must do manually (put this in the README as a checklist)

These are the only steps Claude Code cannot do; everything else must be finished:
1. Create a free **Supabase** project; run `schema.sql` and `seed.sql`; copy the
   project URL + anon key + service role key into env vars.
2. Create a free **Groq** API key at console.groq.com; put it in an env var.
3. Create a free **Vercel** project, connect the repo, set the same env vars,
   deploy. Note the deployed URL.
4. In `/firmware`, fill the config block (WiFi name + password, the Vercel API
   URL, the device code), then flash the ESP32 from Arduino IDE. Pasting this
   firmware is the ONLY change to the physical toy.
5. In the website, sign up, add a child, and link the device using its code.

Do NOT ask the human to make code decisions. Finish all code yourself.

---

## 12. Session continuity — resuming after a stopped session

This build may span several Claude Code sessions (usage limits, time windows), so
the work MUST be resumable. CLAUDE.md is the fixed spec; **`PROGRESS.md`** (a
starter is provided) is the living status log. Keep them separate.

- **At the start of EVERY session, before anything else:** read `PROGRESS.md` and
  run `git log --oneline` to see what's already done. Briefly verify the claimed
  state matches the actual files on disk — don't trust the log blindly. Then
  continue from the first unfinished item in the checklist.
- **After finishing each phase (and each meaningful step within a phase):** update
  `PROGRESS.md` — tick the item off, list the files you created or changed, record
  any decision or blocker, and write a single concrete **"Next step"** line. Then
  commit, including `PROGRESS.md` in that commit.
- Always keep the **"Next step"** line specific enough that a brand-new session
  could act on it without guessing.
- Never tick a phase as done until it actually builds/runs.
- If `PROGRESS.md` does not exist yet, create it during Phase 1.
