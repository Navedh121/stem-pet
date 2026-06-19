"use client";

// "Meet MathBot" section — placed between "How it works" and the dashboard preview.
// Shows the idle/standing robot with:
//   - A continuous gentle idle-bob (up-down) and glance-tilt (left-right rotate)
//   - 6 SVG web tendrils that slowly sway around the robot
// Respects prefers-reduced-motion by rendering everything statically.

import { useReducedMotion, motion } from "framer-motion";
import Image from "next/image";

// Each tendril: an SVG path starting near the robot center/body and extending outward.
// Paths are defined in a 400×480 viewBox (matches the image container size).
// `origin` is the CSS transform-origin so each tendril pivots from its root.
// `range` is the ±deg of rotation for the sway animation.
const TENDRILS = [
  {
    d: "M 200,120 C 165,80 130,45 95,20",
    origin: "200px 120px",
    range: 8,
    dur: 3.8,
    delay: 0,
  },
  {
    d: "M 210,100 C 255,65 295,35 325,15",
    origin: "210px 100px",
    range: -7,
    dur: 4.3,
    delay: 0.8,
  },
  {
    d: "M 155,220 C 115,215 75,230 40,250",
    origin: "155px 220px",
    range: 6,
    dur: 3.5,
    delay: 0.4,
  },
  {
    d: "M 248,220 C 288,215 325,230 360,255",
    origin: "248px 220px",
    range: -6,
    dur: 4.6,
    delay: 1.1,
  },
  {
    d: "M 175,340 C 145,385 120,415 90,440",
    origin: "175px 340px",
    range: 7,
    dur: 4.0,
    delay: 0.6,
  },
  {
    d: "M 228,340 C 258,388 285,418 315,445",
    origin: "228px 340px",
    range: -7,
    dur: 3.6,
    delay: 1.4,
  },
];

export default function IdleSection() {
  const shouldReduceMotion = useReducedMotion();

  // Idle-bob: gentle up-down oscillation
  const bobAnimation = shouldReduceMotion
    ? {}
    : {
        animate: { y: [0, -16, 0] },
        transition: {
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      };

  // Glance-tilt: subtle left-right rotation, offset from the bob
  const tiltAnimation = shouldReduceMotion
    ? {}
    : {
        animate: { rotate: [-2, 2, -2] },
        transition: {
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      };

  return (
    <section className="relative py-40 overflow-hidden">
      {/* Subtle background glow so the idle image feels lit */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 55%, rgba(174,185,212,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
        {/* Section label */}
        <p className="text-silk text-xs uppercase tracking-widest mb-4">
          Meet MathBot
        </p>
        <h2 className="font-display text-4xl sm:text-5xl text-paper mb-4 leading-tight">
          Your child&apos;s math companion.
        </h2>
        <p className="text-silk max-w-sm leading-relaxed mb-20">
          A physical toy that never stops learning what your child needs next.
        </p>

        {/* Robot image + tendrils */}
        <div className="relative" style={{ width: 400, height: 480 }}>
          {/* SVG tendrils behind the robot */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="400"
            height="480"
            viewBox="0 0 400 480"
            aria-hidden="true"
          >
            {TENDRILS.map((t, i) =>
              shouldReduceMotion ? (
                <path
                  key={i}
                  d={t.d}
                  fill="none"
                  stroke="#AEB9D4"
                  strokeWidth="0.9"
                  strokeOpacity="0.2"
                />
              ) : (
                <motion.path
                  key={i}
                  d={t.d}
                  fill="none"
                  stroke="#AEB9D4"
                  strokeWidth="0.9"
                  strokeOpacity="0.25"
                  style={{ transformOrigin: t.origin }}
                  animate={{ rotate: [t.range, -t.range, t.range] }}
                  transition={{
                    duration: t.dur,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: t.delay,
                  }}
                />
              )
            )}
          </svg>

          {/* Idle bob wrapper — outer translate */}
          <motion.div className="absolute inset-0" {...bobAnimation}>
            {/* Glance tilt — inner rotate, offset so both layers compose naturally */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              {...tiltAnimation}
            >
              <Image
                src="/mathbot-idle.png"
                alt="MathBot robot standing in idle pose"
                width={340}
                height={408}
                className="object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
