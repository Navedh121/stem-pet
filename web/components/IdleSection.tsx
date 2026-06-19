"use client";

// "Meet MathBot" idle section.
// Transparent robot PNG floats directly on the dark section background — no card, no frame.
// Each tendril: draws on (pathLength 0→1), then enters a continuous sway loop.
// Robot itself bobs gently up-down and tilts slightly left-right.
// Respects prefers-reduced-motion.

import { useReducedMotion, motion } from "framer-motion";
import Image from "next/image";

const WEB  = "#CCDEFF";   // icy pale-blue, matches web strands in robot images
const WEB2 = "#A8C8FF";   // thinner parallel: slightly dimmer

// Tendril paths in a 500×600 viewBox (matching the robot container).
// Each starts near the robot's body (center ≈ 250, 260 in this viewBox)
// and extends outward in a different direction.
// `pivot` = CSS transform-origin for the sway rotation.
// `range` = ±deg of sway.  `drawDur` = seconds to draw on.  `swayDur` = sway period.
const TENDRILS = [
  {
    main:  "M 250,145 C 210,95 170,58 128,28",
    fibre: "M 252,148 C 212,98 172,61 130,31",
    pivot: "250px 145px", range: 9,  drawDur: 0.75, swayDur: 4.0, delay: 0,
  },
  {
    main:  "M 264,122 C 308,72 350,40 388,14",
    fibre: "M 262,125 C 306,75 348,43 386,17",
    pivot: "264px 122px", range: -8, drawDur: 0.72, swayDur: 4.5, delay: 0.9,
  },
  {
    main:  "M 188,245 C 145,238 100,252 58,272",
    fibre: "M 190,248 C 147,241 102,255 60,275",
    pivot: "188px 245px", range: 7,  drawDur: 0.68, swayDur: 3.8, delay: 0.4,
  },
  {
    main:  "M 312,245 C 355,238 398,254 440,276",
    fibre: "M 310,248 C 353,241 396,257 438,279",
    pivot: "312px 245px", range: -7, drawDur: 0.68, swayDur: 4.3, delay: 1.1,
  },
  {
    main:  "M 215,368 C 182,412 158,448 128,476",
    fibre: "M 218,370 C 185,414 161,450 131,478",
    pivot: "215px 368px", range: 8,  drawDur: 0.72, swayDur: 4.1, delay: 0.6,
  },
  {
    main:  "M 286,368 C 318,415 345,450 372,478",
    fibre: "M 283,370 C 315,417 342,452 369,480",
    pivot: "286px 368px", range: -8, drawDur: 0.72, swayDur: 3.7, delay: 1.4,
  },
];

export default function IdleSection() {
  const shouldReduceMotion = useReducedMotion();

  const bobProps = shouldReduceMotion
    ? {}
    : {
        animate: { y: [0, -16, 0] },
        transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
      };

  const tiltProps = shouldReduceMotion
    ? {}
    : {
        animate: { rotate: [-2, 2, -2] },
        transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <section className="relative py-36 overflow-hidden">
      {/* Faint icy radial glow — robot looks lit by web energy */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 50% 52%, rgba(180,210,255,0.045) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
        <p className="text-silk text-xs uppercase tracking-widest mb-4">Meet MathBot</p>
        <h2 className="font-display text-4xl sm:text-5xl text-paper mb-4 leading-tight">
          Your child&apos;s math companion.
        </h2>
        <p className="text-silk max-w-sm leading-relaxed mb-20">
          A physical toy that never stops learning what your child needs next.
        </p>

        {/* Robot + tendrils — NO visible background box */}
        <div className="relative" style={{ width: 500, height: 600 }}>

          {/* SVG tendrils — rendered behind the robot (z-0) */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="500"
            height="600"
            viewBox="0 0 500 600"
            aria-hidden="true"
            style={{ zIndex: 0 }}
          >
            <defs>
              <filter id="idleGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {TENDRILS.map((t, i) =>
              shouldReduceMotion ? (
                // Static strands for prefers-reduced-motion
                <g key={i}>
                  <path d={t.main}  fill="none" stroke={WEB}  strokeWidth="1.1" strokeOpacity="0.22" strokeLinecap="round" />
                  <path d={t.fibre} fill="none" stroke={WEB2} strokeWidth="0.4" strokeOpacity="0.14" strokeLinecap="round" />
                </g>
              ) : (
                // Animated: draw on first, then sway in a continuous loop
                <motion.g
                  key={i}
                  filter="url(#idleGlow)"
                  style={{ transformOrigin: t.pivot }}
                  // Sway starts after draw-on (drawDur + 0.3 s head-start)
                  animate={{ rotate: [t.range, -t.range, t.range] }}
                  transition={{
                    duration: t.swayDur,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: t.drawDur + 0.3 + t.delay,
                  }}
                >
                  {/* Main strand */}
                  <motion.path
                    d={t.main}
                    fill="none"
                    stroke={WEB}
                    strokeWidth="1.15"
                    strokeOpacity="0.58"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: t.drawDur, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                  />
                  {/* Thin parallel for fibrous texture */}
                  <motion.path
                    d={t.fibre}
                    fill="none"
                    stroke={WEB2}
                    strokeWidth="0.42"
                    strokeOpacity="0.34"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: t.drawDur, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                  />
                </motion.g>
              )
            )}
          </svg>

          {/* Robot image — transparent PNG, no background, z-10 on top of tendrils */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 10 }}
            {...bobProps}
          >
            <motion.div {...tiltProps}>
              <Image
                src="/mathbot-idle.png"
                alt="MathBot robot standing, looking around"
                width={390}
                height={468}
                className="object-contain"
                style={{
                  // Icy-blue drop glow traces the robot's transparent silhouette
                  filter:
                    "drop-shadow(0 0 28px rgba(180,210,255,0.14)) drop-shadow(0 28px 55px rgba(0,0,0,0.55))",
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
