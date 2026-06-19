"use client";

// "Off-screen" section — the hanging robot with web-cradled feature cards.
// The robot (mathbot-hang.png, transparent PNG) is placed at the top of this section
// with its raised hands conceptually connecting to the dashboard above.
// Animated SVG strands draw down from the robot's lower body and fan out to
// wrap/cradle three feature cards.
// The strand draw-on animation is triggered when the section scrolls into view.

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";

// Strand paths in a viewBox "0 0 100 100".
// All start near the bottom of the robot image (approx 50%, 38%) and fan
// outward toward the three card positions below.
const STRANDS = [
  // Left card
  { d: "M 50,38 C 42,52 28,62 18,73", delay: 0,    dur: 1.4 },
  { d: "M 50,38 C 40,55 26,65 16,76", delay: 0.1,  dur: 1.4 },
  // Center card
  { d: "M 50,38 C 50,54 50,64 50,74", delay: 0.2,  dur: 1.3 },
  { d: "M 50,38 C 50,55 50,65 50,77", delay: 0.25, dur: 1.3 },
  // Right card
  { d: "M 50,38 C 58,52 72,62 82,73", delay: 0.3,  dur: 1.4 },
  { d: "M 50,38 C 60,55 74,65 84,76", delay: 0.35, dur: 1.4 },
  // Cross-bracing strands between cards — give it the webbing feel
  { d: "M 18,74 C 32,80 50,82 50,82", delay: 0.6,  dur: 0.8 },
  { d: "M 50,77 C 64,82 76,78 84,76", delay: 0.65, dur: 0.8 },
  { d: "M 18,74 C 35,90 50,88 50,88", delay: 0.75, dur: 0.7 },
  { d: "M 50,82 C 64,90 76,88 84,82", delay: 0.8,  dur: 0.7 },
];

const CARDS = [
  {
    icon: "📵",
    headline: "No app. No phone.",
    body: "No screen time for your child — just a toy with four buttons and a small display, designed to be held.",
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
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const shouldReduceMotion = useReducedMotion();

  const pathInView = shouldReduceMotion || inView;

  return (
    <section ref={ref} className="relative overflow-hidden pt-0 pb-32">
      {/* ── Robot hanging at the top ── */}
      <div className="relative z-10 flex justify-center">
        <Image
          src="/mathbot-hang.png"
          alt="MathBot robot hanging by web strands, lower hand gesturing toward the cards below"
          width={420}
          height={504}
          className="object-contain"
          // Pull the image up slightly to overlap visually with the section above
          style={{ marginTop: "-80px" }}
        />
      </div>

      {/* ── SVG web strands ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {STRANDS.map((s, i) =>
            shouldReduceMotion ? (
              // Static render for prefers-reduced-motion
              <path
                key={i}
                d={s.d}
                fill="none"
                stroke="#AEB9D4"
                strokeWidth="0.3"
                strokeOpacity="0.2"
              />
            ) : (
              <motion.path
                key={i}
                d={s.d}
                fill="none"
                stroke="#AEB9D4"
                strokeWidth={i < 6 ? "0.3" : "0.2"}
                strokeOpacity="0.4"
                initial={{ pathLength: 0 }}
                animate={pathInView ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{
                  duration: s.dur,
                  delay: s.delay,
                  ease: "easeOut",
                }}
              />
            )
          )}
        </svg>
      </div>

      {/* ── Feature cards ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 mt-8">
        <div className="grid sm:grid-cols-3 gap-5">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.headline}
              className="card p-6 flex flex-col gap-3"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={
                pathInView && !shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : shouldReduceMotion
                  ? {}
                  : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5, delay: 0.6 + i * 0.12, ease: "easeOut" }}
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
