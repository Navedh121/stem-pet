"use client";

// Off-screen / hang section — last content section.
// mathbot-hang.png (transparent) floats on the dark background.
// Animated SVG strands:
//   1. Fan down from the robot's lower hand toward each of the three feature cards.
//   2. Curve over each card's top edge (crossbar) and down the sides so the cards
//      look physically caught in the web — not just pointed at.
//   3. Cross-brace strands between cards complete the webbed fill.
// Draw-on triggered by IntersectionObserver; slow sway loop starts after draw-on.
// Respects prefers-reduced-motion.

import { useRef, useState, useEffect } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";

const WEB  = "#CCDEFF";
const WEB2 = "#A8C8FF";

// ── Strand geometry (viewBox "0 0 100 100") ──
// Robot lower hand ≈ (50, 33).
// Three cards (3-col grid, px-6 container centred at 50%):
//   Left   card: TL(4, 60)  TR(32, 60)  sides to Y 80
//   Centre card: TL(37, 60) TR(63, 60)  sides to Y 80
//   Right  card: TL(68, 60) TR(96, 60)  sides to Y 80
// Each card gets:
//   • 2 fan strands from the hand → the card's top-left and top-right corners
//   • 1 crossbar along the top edge (makes the card look "cradled")
//   • 2 side strands partially down the left and right edges
// Between adjacent cards: 2 horizontal cross-braces give the webbed fill.
// Thin parallel fibres run alongside the main fan strands for texture.
const STRANDS: Array<{ d: string; w: string; op: number; delay: number; dur: number }> = [
  // ── Fan: hand → left card ──
  { d: "M 50,33 C 38,44 24,52 10,58 S 4,60 4,60",   w: "0.52", op: 0.65, delay: 0,    dur: 1.3 },
  { d: "M 50,33 C 44,46 36,54 28,58 S 32,60 32,60",  w: "0.46", op: 0.60, delay: 0.1,  dur: 1.2 },
  // thin fibre
  { d: "M 50,34 C 38,46 23,54 9,60 S 4,61 4,61",     w: "0.22", op: 0.28, delay: 0.05, dur: 1.3 },

  // ── Fan: hand → centre card ──
  { d: "M 50,33 C 48,46 44,54 40,58 S 37,60 37,60",  w: "0.46", op: 0.60, delay: 0.15, dur: 1.1 },
  { d: "M 50,33 C 52,46 56,54 60,58 S 63,60 63,60",  w: "0.46", op: 0.60, delay: 0.2,  dur: 1.1 },

  // ── Fan: hand → right card ──
  { d: "M 50,33 C 56,44 65,52 72,58 S 68,60 68,60",  w: "0.46", op: 0.60, delay: 0.25, dur: 1.2 },
  { d: "M 50,33 C 62,44 79,52 90,58 S 96,60 96,60",  w: "0.52", op: 0.65, delay: 0.3,  dur: 1.3 },
  // thin fibre
  { d: "M 50,34 C 62,46 80,54 91,60 S 96,61 96,61",  w: "0.22", op: 0.28, delay: 0.35, dur: 1.3 },

  // ── Crossbars: top edge of each card (the "cradling" wrap) ──
  { d: "M 4,60 C 12,57 24,57 32,60",                 w: "0.48", op: 0.68, delay: 0.65, dur: 0.55 },
  { d: "M 37,60 C 45,57 55,57 63,60",                w: "0.48", op: 0.68, delay: 0.70, dur: 0.55 },
  { d: "M 68,60 C 76,57 88,57 96,60",                w: "0.48", op: 0.68, delay: 0.75, dur: 0.55 },

  // ── Side strands: down each card's left and right edges ──
  { d: "M 4,60 C 3,65 3,72 4,79",                    w: "0.36", op: 0.48, delay: 0.85, dur: 0.55 },
  { d: "M 32,60 C 33,65 33,72 32,79",                w: "0.36", op: 0.48, delay: 0.88, dur: 0.55 },
  { d: "M 37,60 C 36,65 36,72 37,79",                w: "0.36", op: 0.48, delay: 0.9,  dur: 0.55 },
  { d: "M 63,60 C 64,65 64,72 63,79",                w: "0.36", op: 0.48, delay: 0.93, dur: 0.55 },
  { d: "M 68,60 C 67,65 67,72 68,79",                w: "0.36", op: 0.48, delay: 0.95, dur: 0.55 },
  { d: "M 96,60 C 97,65 97,72 96,79",                w: "0.36", op: 0.48, delay: 0.98, dur: 0.55 },

  // ── Cross-braces between adjacent cards (web fill) ──
  { d: "M 32,66 C 34,66 35,66 37,66",               w: "0.26", op: 0.36, delay: 1.1,  dur: 0.32 },
  { d: "M 63,66 C 65,66 66,66 68,66",               w: "0.26", op: 0.36, delay: 1.14, dur: 0.32 },
  { d: "M 32,73 C 34,73 35,73 37,73",               w: "0.22", op: 0.30, delay: 1.2,  dur: 0.30 },
  { d: "M 63,73 C 65,73 66,73 68,73",               w: "0.22", op: 0.30, delay: 1.24, dur: 0.30 },
];

const CARDS = [
  {
    icon: "📵",
    headline: "No app. No phone.",
    body: "No screen time for your child — just a toy with four buttons and a small display, designed to be held, not stared at.",
  },
  {
    icon: "🎯",
    headline: "Questions adapt in real time.",
    body: "When they're flying the difficulty rises to challenge them. When they struggle it eases back — automatically.",
  },
  {
    icon: "📈",
    headline: "You see the progress.",
    body: "Every answer is logged. You'll always know exactly how they're doing — no guessing, no testing anxiety.",
  },
];

export default function HangSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const shouldReduceMotion = useReducedMotion();
  const [swaying, setSwaying] = useState(false);

  // Start the sway loop after all strands have finished drawing (~2 s after inView)
  useEffect(() => {
    if (!inView || shouldReduceMotion) return;
    const t = setTimeout(() => setSwaying(true), 2000);
    return () => clearTimeout(t);
  }, [inView, shouldReduceMotion]);

  return (
    <section ref={ref} className="relative overflow-hidden pb-32">

      {/* ── Robot: transparent PNG hangs at the top, no frame ── */}
      <div className="relative z-10 flex justify-center">
        <Image
          src="/mathbot-hang.png"
          alt="MathBot hanging by one hand, lower hand casting web strands down to the feature cards"
          width={420}
          height={504}
          className="object-contain"
          style={{
            marginTop: "-80px",
            // Icy-blue glow traces the transparent silhouette + depth shadow below
            filter:
              "drop-shadow(0 0 36px rgba(180,210,255,0.11)) drop-shadow(0 18px 48px rgba(0,0,0,0.55))",
          }}
        />
      </div>

      {/* ── SVG web strands (absolute layer, behind cards) ── */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="hangGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.55" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Sway wrapper — gentle Y oscillation starts after draw-on completes */}
          <motion.g
            filter="url(#hangGlow)"
            animate={swaying ? { y: [0, 3, 0, -3, 0] } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            {STRANDS.map((s, i) =>
              shouldReduceMotion ? (
                <path
                  key={i}
                  d={s.d}
                  fill="none"
                  stroke={WEB}
                  strokeWidth={s.w}
                  strokeOpacity={s.op * 0.55}
                  strokeLinecap="round"
                />
              ) : (
                <motion.path
                  key={i}
                  d={s.d}
                  fill="none"
                  stroke={i % 3 === 2 ? WEB2 : WEB}
                  strokeWidth={s.w}
                  strokeOpacity={s.op}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ duration: s.dur, delay: s.delay, ease: "easeOut" }}
                />
              )
            )}
          </motion.g>
        </svg>
      </div>

      {/* ── Feature cards ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 mt-10">
        <div className="grid sm:grid-cols-3 gap-5">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.headline}
              className="card p-6 flex flex-col gap-3"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 18 }}
              animate={
                inView && !shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : shouldReduceMotion
                  ? {}
                  : { opacity: 0, y: 18 }
              }
              transition={{ duration: 0.5, delay: 0.7 + i * 0.12, ease: "easeOut" }}
            >
              <span className="text-2xl" role="img" aria-hidden="true">
                {card.icon}
              </span>
              <h3 className="font-display text-lg text-paper leading-snug">
                {card.headline}
              </h3>
              <p className="text-silk text-sm leading-relaxed">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
