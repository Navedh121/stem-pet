"use client";

// ============================================================
//  STEMPet Simulator — /simulator
//
//  Renders a mock ESP32 device: a 320×240 TFT screen (scaled 2×
//  to 640×480 for readability) with four hardware buttons A/B/C/D
//  below it.  The buttons are the ONLY way to interact — clicking
//  the screen does nothing, just like the physical toy.
//
//  Screen flow mirrors firmware/STEMPet_Firmware.ino exactly:
//    boot → welcome → age_select → age_confirm →
//    level_select → level_confirm → wifi_connect →
//    question ⇄ feedback → question ⇄ …
//
//  All API wiring is preserved: every question is fetched from
//  /api/next-question and every answer is logged via
//  /api/submit-answer, so practice sessions appear on the
//  parent dashboard exactly like real toy sessions.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import type { AgeGroup, Level, NextQuestionResponse } from "@/lib/types";

// ── ILI9341 colour constants — exact CSS equivalents ──────────
// These map directly to the #define values in the firmware header.
const C = {
  BLACK:     "#000000",   // ILI9341_BLACK
  WHITE:     "#FFFFFF",   // ILI9341_WHITE
  RED:       "#FF0000",   // ILI9341_RED     0xF800
  GREEN:     "#00FF00",   // ILI9341_GREEN   0x07E0
  BLUE:      "#0000FF",   // ILI9341_BLUE    0x001F
  CYAN:      "#00FFFF",   // ILI9341_CYAN    0x07FF
  YELLOW:    "#FFFF00",   // ILI9341_YELLOW  0xFFE0
  DARKGREEN: "#007E00",   // ILI9341_DARKGREEN 0x03E0
  DARKGREY:  "#7B7B7B",   // ILI9341_DARKGREY  0x7BEF
} as const;

// ── Praise messages — identical to the firmware array ────────
const PRAISE = [
  "Good Work!", "Keep It Up!", "Awesome!",
  "Math Star!", "Brilliant!", "Super Smart!", "You Rock!",
];

// ── Screen size: 320×240 TFT scaled 2× ──────────────────────
const SW = 640;   // screen width  (320 × 2)
const SH = 480;   // screen height (240 × 2)

// CSS font-sizes that correspond to Adafruit GFX textSize N at 2× scale.
// GFX default font: 6×8 px per char at textSize 1, so:
//   textSize 1 → 8px × 2 = 16px  (we use 14 for visual balance)
//   textSize 2 → 16px × 2 = 32px (we use 28)
//   textSize 3 → 24px × 2 = 48px (we use 44)
//   textSize 4 → 32px × 2 = 64px (we use 72 for the smiley)
const TS1 = 14, TS2 = 28, TS3 = 44, TS4 = 72;

// Base style shared by all text on the simulated screen
const MONO: React.CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

// ── Phase names (mirrors the firmware's state machine) ────────
type Phase =
  | "boot"            // display off — device-code entry shown outside frame
  | "welcome"         // "HEY CHAMP!" — any of the 4 buttons advances
  | "age_select"      // blue screen  — A/B/C choose age group (D ignored)
  | "age_confirm"     // blue screen  — brief confirmation, auto-advances 1 s
  | "level_select"    // green screen — A/B/C/D choose level 1–4
  | "level_confirm"   // green screen — brief confirmation, auto-advances 1 s
  | "wifi_connect"    // black screen — "Connecting…", fetches first question
  | "question"        // black screen — question + 4 labelled options
  | "feedback";       // green/red    — correct / wrong, auto-advances 2 s

// ============================================================
export default function SimulatorPage() {
  const [phase,      setPhase]      = useState<Phase>("boot");
  const [deviceCode, setDeviceCode] = useState("");
  const [ageGroup,   setAgeGroup]   = useState<AgeGroup>("8-10");
  const [level,      setLevel]      = useState<Level>(1);
  const [question,   setQuestion]   = useState<NextQuestionResponse | null>(null);
  const [correct,    setCorrect]    = useState(false);
  const [praiseIdx,  setPraiseIdx]  = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);
  const startMs = useRef(0);  // when the question was displayed — for time_ms

  // ── Real API call — identical URL shape to the firmware ───
  const fetchQuestion = useCallback(
    async (lvl: Level, age: AgeGroup, code: string) => {
      setLoading(true);
      setApiError(null);
      try {
        const url =
          `/api/next-question` +
          `?device_code=${encodeURIComponent(code.trim().toUpperCase())}` +
          `&age_group=${encodeURIComponent(age)}` +
          `&level=${lvl}`;
        const res  = await fetch(url);
        const json = await res.json() as NextQuestionResponse & { error?: string };
        if (!res.ok) {
          setApiError(json.error ?? `Error ${res.status}`);
          setLoading(false);
          return;
        }
        setQuestion(json);
        startMs.current = Date.now();
        setPhase("question");
      } catch {
        setApiError("Network error — is the server running?");
      }
      setLoading(false);
    },
    [],
  );

  // ── Timed auto-advances between phases ────────────────────
  // This mirrors the firmware's delay() calls and the implicit
  // "go to next question after feedback" loop.
  useEffect(() => {
    if (phase === "age_confirm") {
      const t = setTimeout(() => setPhase("level_select"), 1000);
      return () => clearTimeout(t);
    }
    if (phase === "level_confirm") {
      const t = setTimeout(() => setPhase("wifi_connect"), 1000);
      return () => clearTimeout(t);
    }
    if (phase === "wifi_connect") {
      // Start fetching immediately; fetchQuestion() will call setPhase("question")
      fetchQuestion(level, ageGroup, deviceCode);
      return;
    }
    if (phase === "feedback") {
      // firmware: delay(1500) then loop() fetches next question
      const t = setTimeout(
        () => fetchQuestion(level, ageGroup, deviceCode),
        2000,
      );
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);  // intentionally omit fetchQuestion/level/age/code — captured at phase-change time

  // ── The ONLY interaction: one of the four physical buttons ──
  // This is the central event handler. It mirrors the firmware's
  // waitForButtonPress() → state machine → handleAnswer() chain.
  function press(btn: 0 | 1 | 2 | 3) {
    switch (phase) {

      case "welcome":
        setPhase("age_select");
        break;

      case "age_select": {
        if (btn === 3) return;   // D has no age-group meaning here
        const ages: AgeGroup[] = ["6-8", "8-10", "10-12"];
        setAgeGroup(ages[btn]);
        setPhase("age_confirm");
        break;
      }

      case "level_select":
        setLevel((btn + 1) as Level);
        setPhase("level_confirm");
        break;

      case "question": {
        if (!question || loading) return;
        const isCorrect = btn === question.correct_index;
        setCorrect(isCorrect);
        setPraiseIdx(Math.floor(Math.random() * PRAISE.length));
        setPhase("feedback");

        // Fire-and-forget — exactly what the firmware does after the child
        // answers: POST and move on without waiting for the response.
        fetch("/api/submit-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_code:    deviceCode.trim().toUpperCase(),
            question_id:    question.question_id,
            selected_index: btn,
            is_correct:     isCorrect,
            time_ms:        Date.now() - startMs.current,
            age_group:      ageGroup,
          }),
        }).catch(console.error);
        break;
      }

      // All other phases: silently ignore (auto-advance handles them)
    }
  }

  // Buttons are live only during phases that expect user input
  const buttonsLive =
    phase === "welcome"      ||
    phase === "age_select"   ||
    phase === "level_select" ||
    phase === "question";

  // ── Screen renderer — one case per firmware screen ────────
  // Each case positions elements using the same (x, y) coordinates
  // as the firmware's tft.setCursor() calls, multiplied by 2.
  function renderScreen(): React.ReactNode {
    switch (phase) {

      // ── Display off ──────────────────────────────────────
      case "boot":
        return (
          <Fill bg={C.BLACK} center>
            <span style={{ ...MONO, fontSize: 16, color: "#2a2a2a" }}>
              [ display off ]
            </span>
          </Fill>
        );

      // ── showWelcomeScreen() ───────────────────────────────
      // Firmware: cyan "HEY CHAMP!", white subtitle, yellow prompt
      case "welcome":
        return (
          <Fill bg={C.BLACK}>
            {/* textSize 3 @ cursor(40, 40) */}
            <T top={80}  left={80}  color={C.CYAN}   size={TS3} bold>HEY CHAMP!</T>
            {/* textSize 2 @ cursor(20,100) and cursor(50,130) */}
            <T top={200} left={40}  color={C.WHITE}  size={TS2}>Let&apos;s start your</T>
            <T top={260} left={100} color={C.WHITE}  size={TS2}>Maths Journey!</T>
            {/* textSize 2 @ cursor(30,190) */}
            <T top={380} left={60}  color={C.YELLOW} size={TS2}>Press Any Button</T>
          </Fill>
        );

      // ── selectAgeGroup() — menu ───────────────────────────
      case "age_select":
        return (
          <Fill bg={C.BLUE}>
            {/* textSize 3 @ cursor(40,20) */}
            <T top={40}  left={80}  color={C.WHITE} size={TS3} bold>Choose Age:</T>
            {/* textSize 2 @ cursor(60,80/120/160) */}
            <T top={160} left={120} color={C.WHITE} size={TS2}>A: Ages  6-8</T>
            <T top={240} left={120} color={C.WHITE} size={TS2}>B: Ages 8-10</T>
            <T top={320} left={120} color={C.WHITE} size={TS2}>C: Ages 10-12</T>
          </Fill>
        );

      // ── selectAgeGroup() — confirmation ───────────────────
      case "age_confirm":
        return (
          <Fill bg={C.BLUE}>
            <T top={160} left={40}  color={C.WHITE} size={TS2}>Age group set:</T>
            {/* textSize 3 @ cursor(80,130) */}
            <T top={260} left={160} color={C.WHITE} size={TS3} bold>{ageGroup}</T>
          </Fill>
        );

      // ── selectLevel() — menu ──────────────────────────────
      case "level_select":
        return (
          <Fill bg={C.DARKGREEN}>
            {/* textSize 3 @ cursor(40,20) */}
            <T top={40}  left={80}  color={C.WHITE} size={TS3} bold>Pick Level:</T>
            {/* textSize 2 @ cursor(60,70/100/130/160) */}
            <T top={140} left={120} color={C.WHITE} size={TS2}>A: Level 1 (Easy)</T>
            <T top={200} left={120} color={C.WHITE} size={TS2}>B: Level 2 (Medium)</T>
            <T top={260} left={120} color={C.WHITE} size={TS2}>C: Level 3 (Tricky)</T>
            <T top={320} left={120} color={C.WHITE} size={TS2}>D: Level 4 (Hard)</T>
          </Fill>
        );

      // ── selectLevel() — confirmation ──────────────────────
      case "level_confirm":
        return (
          <Fill bg={C.DARKGREEN}>
            <T top={160} left={40}  color={C.WHITE} size={TS2}>Level set to:</T>
            {/* textSize 4 @ cursor(140,130) */}
            <T top={260} left={280} color={C.WHITE} size={TS4} bold>{level}</T>
          </Fill>
        );

      // ── tryConnectWifi() → showMessage("Connecting…", …) ──
      case "wifi_connect":
        return (
          <Fill bg={C.BLACK}>
            {/* showMessage() title: textSize 2 @ cursor(20,60) */}
            <T top={120} left={40} color={C.WHITE}    size={TS2}>Connecting...</T>
            {/* showMessage() subtitle: textSize 1 @ cursor(20,110) */}
            <T top={220} left={40} color={C.DARKGREY} size={TS1}>
              {deviceCode.trim().toUpperCase()}
            </T>
            {apiError && (
              <T top={320} left={40} color={C.RED} size={TS1}>{apiError}</T>
            )}
          </Fill>
        );

      // ── displayQuestion() ─────────────────────────────────
      // Option positions scaled 2× from firmware:
      //   xs = [10, 170, 10, 170]  →  [20, 340, 20, 340]
      //   ys = [82, 82, 148, 148]  →  [164, 164, 296, 296]
      case "question": {
        if (!question) return null;
        const OX  = [20, 340, 20, 340] as const;
        const OY  = [164, 164, 296, 296] as const;
        const LBL = ["A", "B", "C", "D"] as const;
        const code = deviceCode.trim().toUpperCase();
        return (
          <Fill bg={C.BLACK}>
            {/* Skill + level badge — textSize 1 @ cursor(0,0) */}
            <T top={0} left={0} color={C.CYAN} size={TS1}>
              {question.skill}&nbsp;&nbsp;Lv&nbsp;{question.level}
            </T>

            {/* Question text — textSize 2 @ cursor(0,14), auto-wraps */}
            <div style={{
              position: "absolute", top: 28, left: 0, right: 8,
              color: C.YELLOW, ...MONO, fontSize: TS2,
              lineHeight: "38px", wordBreak: "break-word",
              maxHeight: 104, overflow: "hidden",
            }}>
              {question.question_text}
            </div>

            {/* Horizontal divider — firmware: drawLine(0,68,320,68) */}
            <div style={{
              position: "absolute", top: 136, left: 0,
              width: SW, height: 2, background: C.WHITE,
            }} />

            {/* Four answer options — textSize 2, 2×2 grid */}
            {question.options.map((opt, i) => (
              <T key={i} top={OY[i]} left={OX[i]} color={C.WHITE} size={TS2}>
                {LBL[i]}:{" "}{opt.length > 10 ? opt.slice(0, 9) + "…" : opt}
              </T>
            ))}

            {/* DEVICE_CODE — bottom-right corner, textSize 1 */}
            <span style={{
              position: "absolute", bottom: 8, right: 8,
              ...MONO, fontSize: TS1, color: C.DARKGREY,
            }}>
              {code}
            </span>
          </Fill>
        );
      }

      // ── showFeedback() ────────────────────────────────────
      // Correct: green screen  ":)"  + praise
      // Wrong:   red screen    ":("  + correct answer
      case "feedback":
        return (
          <Fill bg={correct ? C.GREEN : C.RED}>
            {/* textSize 4 smiley @ cursor(120,50) */}
            <T top={100} left={240} color={C.WHITE} size={TS4} bold>
              {correct ? ":)" : ":("}
            </T>
            {correct
              ? /* textSize 2 praise @ cursor(60,140) */
                <T top={280} left={120} color={C.WHITE} size={TS2}>
                  {PRAISE[praiseIdx]}
                </T>
              : /* textSize 2 answer @ cursor(30,140) */
                <T top={280} left={60} color={C.WHITE} size={TS2}>
                  Answer:&nbsp;
                  {question?.options[question.correct_index] ?? ""}
                </T>
            }
          </Fill>
        );
    }
  }

  const isPoweredOn = phase !== "boot";

  // ── Page layout ──────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d1a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 28,
      paddingBottom: 48,
      gap: 18,
    }}>

      {/* Page header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{
          color: "#FFFFFF", fontFamily: "sans-serif",
          fontSize: 22, fontWeight: 700, margin: 0,
        }}>
          STEMPet Simulator
        </h1>
        <p style={{
          color: "#555", fontFamily: "sans-serif",
          fontSize: 13, margin: "4px 0 0",
        }}>
          Browser version of the physical toy · four buttons only ·
          practice sessions appear on the dashboard
        </p>
      </div>

      {/* Device-code entry — only visible before power-on */}
      {!isPoweredOn && (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="text"
            value={deviceCode}
            onChange={e => setDeviceCode(e.target.value.toUpperCase())}
            onKeyDown={e =>
              e.key === "Enter" && deviceCode.trim() && setPhase("welcome")
            }
            placeholder="DEVICE CODE"
            maxLength={10}
            autoFocus
            style={{
              background: "#111", border: "1px solid #444", color: "#FFF",
              fontFamily: "monospace", fontSize: 15, letterSpacing: 4,
              padding: "8px 14px", borderRadius: 8, width: 200,
              textTransform: "uppercase", outline: "none",
            }}
          />
          <button
            onClick={() => deviceCode.trim() && setPhase("welcome")}
            disabled={!deviceCode.trim()}
            style={{
              background: deviceCode.trim() ? "#1a6b1a" : "#222",
              border: "none", color: deviceCode.trim() ? "#FFF" : "#555",
              fontFamily: "sans-serif", fontSize: 14, fontWeight: 700,
              padding: "9px 22px", borderRadius: 8,
              cursor: deviceCode.trim() ? "pointer" : "not-allowed",
              transition: "background 0.15s",
            }}
          >
            ⏻&nbsp; Power On
          </button>
        </div>
      )}

      {/* ── THE DEVICE ──────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Top casing + screen */}
        <div style={{
          background: "linear-gradient(175deg, #1e1e36 0%, #131326 100%)",
          borderRadius: "20px 20px 0 0",
          padding: "16px 16px 0 16px",
          border: "2px solid #2e2e54",
          borderBottom: "none",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), " +
            "0 0 80px rgba(0,0,0,0.95)",
        }}>
          {/* Screen bezel — the dark inner rim around the glass */}
          <div style={{
            background: "#040408",
            borderRadius: 8,
            padding: 6,
            border: "2px solid #1a1a28",
            boxShadow: "inset 0 0 24px rgba(0,0,0,0.9)",
          }}>
            {/* The TFT screen — cursor:not-allowed reminds user not to click here */}
            <div style={{
              width: SW, height: SH,
              overflow: "hidden", borderRadius: 3,
              cursor: "not-allowed", userSelect: "none",
              position: "relative",
            }}>
              {renderScreen()}
            </div>
          </div>
        </div>

        {/* Bottom casing + four hardware buttons */}
        <div style={{
          background: "linear-gradient(175deg, #131326 0%, #0f0f1e 100%)",
          borderRadius: "0 0 20px 20px",
          border: "2px solid #2e2e54",
          borderTop: "1px solid #1c1c38",
          padding: "22px 16px 28px 16px",
          display: "flex",
          gap: 20,
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          width: "100%",
          boxShadow:
            "0 14px 50px rgba(0,0,0,0.9), " +
            "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}>
          {(["A", "B", "C", "D"] as const).map((lbl, i) => (
            <HardwareButton
              key={lbl}
              label={lbl}
              active={buttonsLive}
              onClick={() => press(i as 0 | 1 | 2 | 3)}
            />
          ))}
        </div>
      </div>

      {/* Restart / power-off controls outside the device frame */}
      {isPoweredOn && (
        <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
          <GhostBtn
            onClick={() => {
              setPhase("welcome");
              setQuestion(null);
              setApiError(null);
            }}
          >
            ↺&nbsp; Restart toy
          </GhostBtn>
          <GhostBtn
            onClick={() => {
              setPhase("boot");
              setQuestion(null);
              setApiError(null);
            }}
          >
            ⏻&nbsp; Power off
          </GhostBtn>
        </div>
      )}

    </div>
  );
}


// ============================================================
//  Layout micro-components
//  These keep renderScreen() readable by hiding the repetitive
//  CSS.  None of them have state or hooks.
// ============================================================

// Full SW×SH positioned container — the "TFT background"
function Fill({
  bg,
  center,
  children,
}: {
  bg: string;
  center?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: bg,
        width: SW,
        height: SH,
        position: "relative",
        ...(center
          ? { display: "flex", alignItems: "center", justifyContent: "center" }
          : {}),
      }}
    >
      {children}
    </div>
  );
}

// Absolute-positioned text span — mirrors tft.setCursor(x, y) + tft.print()
// top/left here are already 2× the firmware's x/y values.
function T({
  top,
  left,
  color,
  size,
  bold,
  children,
}: {
  top: number;
  left: number;
  color: string;
  size: number;
  bold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        position: "absolute",
        top,
        left,
        color,
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: size,
        fontWeight: bold ? "bold" : "normal",
        lineHeight: 1.15,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}


// ============================================================
//  Hardware button — round, raised, with a press animation
// ============================================================
function HardwareButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const [down, setDown] = useState(false);
  const pressed = active && down;

  return (
    <button
      // Mouse
      onMouseDown={() => { if (active) setDown(true); }}
      onMouseUp={() => { setDown(false); if (active) onClick(); }}
      onMouseLeave={() => setDown(false)}
      // Touch — prevent ghost mouse events
      onTouchStart={e => { e.preventDefault(); if (active) setDown(true); }}
      onTouchEnd={e => {
        e.preventDefault();
        setDown(false);
        if (active) onClick();
      }}
      style={{
        width: 90,
        height: 90,
        borderRadius: "50%",
        background: active
          ? pressed
            ? "#1a1a50"
            : "linear-gradient(145deg, #2e2e72 0%, #1e1e54 100%)"
          : "#111120",
        border: `3px solid ${active ? "#5252cc" : "#222238"}`,
        color: active ? "#FFFFFF" : "#383858",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 34,
        fontWeight: "bold",
        cursor: active ? "pointer" : "default",
        // Raised / depressed shadow effect
        boxShadow: active
          ? pressed
            ? "0 1px 0 #0d0d30"
            : "0 5px 0 #0d0d30, 0 0 16px rgba(82, 82, 204, 0.20)"
          : "none",
        transform: pressed ? "translateY(4px)" : "translateY(0px)",
        transition: "transform 0.06s ease, box-shadow 0.06s ease",
        userSelect: "none",
        outline: "none",
        // Slightly larger tap-target padding (visual size stays the same)
        padding: 0,
      }}
    >
      {label}
    </button>
  );
}


// ============================================================
//  Ghost button — used for the out-of-device controls
// ============================================================
function GhostBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "transparent",
        border: `1px solid ${hover ? "#4a4a80" : "#2e2e50"}`,
        color: hover ? "#9999cc" : "#555577",
        fontFamily: "sans-serif",
        fontSize: 13,
        padding: "6px 18px",
        borderRadius: 8,
        cursor: "pointer",
        transition: "border-color 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}
