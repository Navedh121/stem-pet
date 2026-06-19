"use client";

// Hero section — MathBot landing page.
// Transparent robot PNG floats on the section's own dark navy→crimson gradient.
// On mount, icy-blue SVG web strands draw on from the robot's firing hand,
// arc across the section, and coil/wrap around the "MathBot" wordmark.
// After draw-on completes the entire web gently sways in a slow loop.
// lg+ only (single-column mobile doesn't have the two-column layout for the strand).

import { useState, useEffect } from "react";
import { useReducedMotion, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// ── Web color palette matching the icy strands in the robot images ──
const WEB  = "#CCDEFF";   // main strand: pale icy blue
const WEB2 = "#A8C8FF";   // secondary parallel: slightly dimmer

// ── Hero strand paths (viewBox 0-100, percentage-based) ──
// Robot firing hand ≈ (62, 42), right column.
// Wordmark "MathBot" spans roughly (7, 26)–(34, 44), left column.
// Paths arc from the hand DOWN below the wordmark, sweep UP the left side,
// go OVER the top of the wordmark, and curl back — visibly coiling around it.
const STRANDS = [
  // 1  Main wrap (thickest) — full coil path
  {
    d: "M 62,42 C 50,44 34,49 20,51 S 7,49 6,44 C 5,38 5,30 8,26 S 14,23 21,23 S 31,23 35,28 S 37,35 32,40",
    w: "0.55", op: 0.72, delay: 0.4, dur: 1.7,
  },
  // 2  Parallel fibrous — close shadow of the main strand
  {
    d: "M 62,43 C 50,46 34,51 20,53 S 7,51 6,45 C 5,39 5,31 8,27 S 15,24 22,24",
    w: "0.28", op: 0.42, delay: 0.52, dur: 1.55,
  },
  // 3  Over-top strand — arcs slightly higher, creates the cap of the coil
  {
    d: "M 62,41 C 50,41 36,43 24,46 S 9,44 7,38 C 6,32 7,26 13,24 S 24,22 33,23",
    w: "0.32", op: 0.48, delay: 0.56, dur: 1.5,
  },
  // 4  Right-side return curl — strand curls back down the wordmark's right edge
  {
    d: "M 35,28 C 38,28 39,33 37,37 S 33,42 28,43",
    w: "0.24", op: 0.38, delay: 2.05, dur: 0.65,
  },
  // 5  Top cross-brace — knits the left-side and over-top arcs together at top
  {
    d: "M 8,26 C 15,22 23,21 33,23",
    w: "0.20", op: 0.32, delay: 1.85, dur: 0.55,
  },
  // 6  Thin texture wisp — adds fibrous depth below the main wrap
  {
    d: "M 62,44 C 50,48 35,53 21,55 S 8,53 7,47 C 6,41 7,33 9,30",
    w: "0.18", op: 0.26, delay: 0.65, dur: 1.6,
  },
];

// After all strands finish drawing (~2.3 s from mount) this component
// adds a slow sway to the entire web group.
function HeroWebStrands() {
  const [swaying, setSwaying] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSwaying(true), 2300);
    return () => clearTimeout(t);
  }, []);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20 hidden lg:block"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Soft halo glow: render the path, blur a copy, merge behind */}
        <filter id="heroWebGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sway wrapper — translates Y gently after draw-on completes */}
      <motion.g
        filter="url(#heroWebGlow)"
        animate={swaying ? { y: [0, 2, 0, -2, 0] } : {}}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        {STRANDS.map((s, i) => (
          <motion.path
            key={i}
            d={s.d}
            fill="none"
            stroke={i < 4 ? WEB : WEB2}
            strokeWidth={s.w}
            strokeOpacity={s.op}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: s.dur, delay: s.delay, ease: "easeOut" }}
          />
        ))}
      </motion.g>
    </svg>
  );
}

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = (delay: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: "easeOut" },
        };

  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden">

      {/* ── Background: page's own gradient — robot PNG is transparent ── */}
      <div className="absolute inset-0 bg-ink" aria-hidden="true" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(108deg, #0A0E1A 0%, #0A0E1A 42%, #1b0309 100%)" }}
        aria-hidden="true"
      />
      {/* Deep crimson glow, right half */}
      <div
        className="absolute right-0 top-0 h-full w-2/3 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 65% 75% at 90% 55%, rgba(225,29,42,0.15) 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      {/* Faint blue-white glow where the robot hovers (matches web energy) */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: "20%", top: "20%",
          width: "320px", height: "320px",
          background: "radial-gradient(circle, rgba(180,210,255,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      {/* ── Left column: text ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 pt-28 pb-16 lg:py-0">
        <motion.span
          className="inline-flex items-center gap-2 bg-surface border border-silk/15 rounded-full px-4 py-1.5 text-xs text-silk mb-8 w-fit"
          {...fadeUp(0.1)}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-spider-red" />
          Adaptive math · off the screen
        </motion.span>

        {/* Wordmark: "Math" white, "Bot" red — the web wraps around this */}
        <motion.h1
          className="font-display font-bold leading-[0.92] mb-6"
          style={{ fontSize: "clamp(3.5rem, 9vw, 6.5rem)" }}
          {...fadeUp(0.2)}
        >
          <span className="text-paper">Math</span>
          <span className="text-spider-red">Bot</span>
        </motion.h1>

        <motion.p
          className="text-paper text-xl sm:text-2xl font-medium leading-snug mb-4 max-w-lg"
          {...fadeUp(0.3)}
        >
          Watch your child&apos;s math skills grow — in real time.
        </motion.p>

        <motion.p
          className="text-silk leading-relaxed mb-10 max-w-md"
          {...fadeUp(0.4)}
        >
          MathBot is a physical toy that asks kids adaptive math questions.
          No apps. No screens. Just progress you can see.
        </motion.p>

        <motion.div className="flex flex-wrap gap-3" {...fadeUp(0.5)}>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-spider-red hover:bg-spider-red/90 text-white font-medium px-7 py-3.5 rounded-lg transition-colors"
          >
            See your child&apos;s progress
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-silk/25 hover:border-silk/50 text-silk hover:text-paper px-7 py-3.5 rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </motion.div>
      </div>

      {/* ── Right column: transparent robot PNG floating on section BG ── */}
      <div className="relative z-10 flex-1 flex items-end justify-center lg:justify-end min-h-[55vw] lg:min-h-screen">
        <motion.div
          className="relative w-full h-full"
          {...(shouldReduceMotion
            ? {}
            : {
                initial: { opacity: 0, x: 30 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.9, delay: 0.25, ease: "easeOut" },
              })}
        >
          <Image
            src="/mathbot-hero.png"
            alt="MathBot robot leaping and firing web strands"
            fill
            className="object-contain object-bottom lg:object-right-bottom"
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
          />
        </motion.div>
      </div>

      {/* ── Animated web strands wrapping the wordmark ── */}
      {!shouldReduceMotion && <HeroWebStrands />}
    </section>
  );
}
