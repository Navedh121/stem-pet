# STEMPet Device API Contract

This document describes the exact HTTP contract between the ESP32 toy (or the
web simulator at `/simulator`) and the Next.js backend.

---

## Overview

The toy calls two endpoints each question cycle:

```
GET  /api/next-question   → receive a question
POST /api/submit-answer   → log the child's answer
```

Both endpoints run server-side in the same Next.js app that serves the parent
dashboard. The toy authenticates with a `device_code` (a short string the
parent enters once in the dashboard to link the toy to their child).

**Offline fallback:** if WiFi is unavailable or either call fails, the firmware
falls back to the built-in arithmetic generator from `legacy_firmware.ino`.
No data is logged during offline sessions, but the toy continues to function.

**DEVICE_CODE on screen:** the firmware displays the `DEVICE_CODE` in the
bottom-right corner of every question screen so a parent can verify which toy
they are looking at.

---

## 1. GET /api/next-question

### Request

```
GET /api/next-question?device_code=DEMO01&age_group=8-10&level=2
```

| Query param   | Type    | Required | Description |
|---------------|---------|----------|-------------|
| `device_code` | string  | yes      | The code configured in the firmware and entered in the dashboard. Case-sensitive (firmware always sends uppercase). |
| `age_group`   | string  | yes      | The band chosen by the child on the age-select screen. One of: `6-8`, `8-10`, `10-12`. The server rejects any other value with `400`. |
| `level`       | integer | yes      | Difficulty level chosen by the child on the level-select screen. One of: `1`, `2`, `3`, `4`. The server picks a random skill at this level. |

### Success response — 200 OK

```json
{
  "question_id":   "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "question_text": "What is 7 × 8?",
  "options":       ["52", "54", "56", "58"],
  "correct_index": 2,
  "skill":         "multiplication",
  "level":         2
}
```

| Field          | Type            | Description |
|----------------|-----------------|-------------|
| `question_id`  | string (UUID)   | Unique ID — pass this back in submit-answer. If Groq generation failed and no cached question was saved, this begins with `ephemeral-`; still pass it back. |
| `question_text`| string          | The question to display. |
| `options`      | string[4]       | Exactly 4 answer choices. |
| `correct_index`| 0 \| 1 \| 2 \| 3 | Index into `options` of the correct answer. The firmware checks correctness locally against this value — no round-trip needed. |
| `skill`        | string          | `addition` / `subtraction` / `multiplication` / `division` |
| `level`        | 1–4             | Difficulty level within the skill. |

### Error responses

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{"error":"Missing or invalid age_group. Must be one of: 6-8, 8-10, 10-12"}` | `age_group` missing or unrecognised. |
| 400 | `{"error":"Missing or invalid level. Must be 1, 2, 3, or 4."}` | `level` missing or not 1–4. |
| 400 | `{"error":"Missing device_code query parameter"}` | `device_code` not supplied. |
| 404 | `{"error":"Unknown device_code. Has the toy been linked to a child?"}` | Code not in the `devices` table. |
| 503 | `{"error":"No questions available. Was seed.sql run in Supabase?"}` | Database has no questions at all (Groq also failed). |

---

## 2. POST /api/submit-answer

### Request

```
POST /api/submit-answer
Content-Type: application/json
```

```json
{
  "device_code":    "DEMO01",
  "question_id":    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "selected_index": 2,
  "is_correct":     true,
  "time_ms":        4200,
  "age_group":      "8-10"
}
```

| Field            | Type    | Required | Description |
|------------------|---------|----------|-------------|
| `device_code`    | string  | yes      | Same code sent to next-question. |
| `question_id`    | string  | yes      | The `question_id` from the previous next-question response. |
| `selected_index` | 0–3     | yes      | Which button the child pressed. |
| `is_correct`     | boolean | yes      | Correctness evaluated locally on the toy (`selected_index === correct_index`). |
| `time_ms`        | integer | yes      | Milliseconds from question display to button press. Send `0` if not tracked. |
| `age_group`      | string  | yes      | Same band sent to next-question — stored on the attempt row so the dashboard can show per-band stats. One of: `6-8`, `8-10`, `10-12`. |

### Success response — 200 OK

```json
{ "ok": true }
```

### Error responses

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{"error":"Missing or invalid age_group..."}` | `age_group` missing or unrecognised. |
| 400 | `{"error":"device_code and is_correct are required"}` | Required fields missing. |
| 400 | `{"error":"Invalid JSON body"}` | Body is not valid JSON. |
| 404 | `{"error":"Unknown device_code"}` | Code not in the `devices` table. |
| 500 | `{"error":"Failed to save attempt"}` | Database insert error. |

---

## Full question cycle (firmware pseudocode)

```
// Boot
selectAgeGroup()    // child presses A/B/C to pick 6-8, 8-10, or 10-12
selectLevel()       // child presses A/B/C/D to pick level 1/2/3/4
tryConnectWifi()

// Each question
q = GET /api/next-question?device_code=DEMO01&age_group=8-10&level=2
display(q.question_text, q.options)
displayCornerText(DEVICE_CODE)     // shown at all times on question screen

// Child answers
pressed = waitForButtonPress()     // 0–3
isCorrect = (pressed == q.correct_index)
showFeedback(isCorrect)

POST /api/submit-answer {
  device_code, question_id: q.question_id,
  selected_index: pressed, is_correct: isCorrect,
  time_ms, age_group: "8-10"
}

// While child reads current question, prefetch the next one in background
prefetch: GET /api/next-question?device_code=DEMO01&age_group=8-10&level=2
```

---

## How difficulty works

The **level** (1–4) is chosen by the child on the device before play begins and
stays fixed for the entire session.  Within that level, the server picks a
**random skill** (addition, subtraction, multiplication, or division) for each
question — so every question is a mixed-skill surprise at a known difficulty.

- Level 1: small numbers (1–10)
- Level 2: medium numbers (5–20)
- Level 3: larger numbers (10–50), may include short word problems
- Level 4: biggest numbers (20–100), more complex word problems

---

## Web simulator

`/simulator` (no login required) is a browser-based stand-in for the physical
toy. It calls the **exact same endpoints** with the **exact same request
shapes** shown above — useful for testing the full loop without hardware.
