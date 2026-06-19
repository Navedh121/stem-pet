"use client";

// Hero section for the MathBot landing page.
// Left column: wordmark + copy + CTA.
// Right column: mathbot-hero.png bleeding to the right edge.
// On mount, SVG web strands draw from the robot's outstretched hand to the wordmark
// (lg screens only, where the two-column layout makes the line visible).

import { useReducedMotion, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// Three strands that bundle together from the robot's hand (right)
// to the wordmark (left). Coordinates are 0-100 in viewBox space.
const STRAND_PATHS = [
  "M 63,47 C 50,41 37,35 19,31",
  "M 65,45 C 52,39 38,34 20,30",
  "M 61,49 C 48,43 35,37 18,32",
];

function WebStrand() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20 hidden lg:block"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {STRAND_PATHS.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke="#AEB9D4"
          strokeWidth={i === 0 ? "0.28" : "0.14"}
          strokeOpacity={i === 0 ? "0.7" : "0.35"}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1.1 + i * 0.15,
            delay: 0.5 + i * 0.1,
            ease: "easeOut",
          }}
        />
      ))}
    </svg>
  );
}

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  // Staggered entrance for text elements. If reduced motion, render without animation.
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
      {/* ── Background layers ── */}
      <div className="absolute inset-0 bg-ink" aria-hidden="true" />
      {/* Gradient: deep navy left → deep crimson right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(105deg, #0A0E1A 0%, #0A0E1A 45%, #180308 100%)",
        }}
        aria-hidden="true"
      />
      {/* Red atmospheric glow, right half */}
      <div
        className="absolute right-0 top-0 h-full w-2/3 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 85% 50%, rgba(225,29,42,0.12) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* Moon glow — mimics the built-in moon glow in the hero image */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: "22%",
          top: "18%",
          width: "260px",
          height: "260px",
          background:
            "radial-gradient(circle, rgba(220,230,255,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      {/* ── Left column: text ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 pt-28 pb-16 lg:py-0">
        {/* Badge */}
        <motion.span
          className="inline-flex items-center gap-2 bg-surface border border-silk/15 rounded-full px-4 py-1.5 text-xs text-silk mb-8 w-fit"
          {...fadeUp(0.1)}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-spider-red" />
          Adaptive math · off the screen
        </motion.span>

        {/* Wordmark — "Math" white, "Bot" red */}
        <motion.h1
          className="font-display font-bold leading-[0.92] mb-6"
          style={{ fontSize: "clamp(3.5rem, 9vw, 6.5rem)" }}
          {...fadeUp(0.2)}
        >
          <span className="text-paper">Math</span>
          <span className="text-spider-red">Bot</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-paper text-xl sm:text-2xl font-medium leading-snug mb-4 max-w-lg"
          {...fadeUp(0.3)}
        >
          Watch your child&apos;s math skills grow — in real time.
        </motion.p>

        {/* Description */}
        <motion.p
          className="text-silk leading-relaxed mb-10 max-w-md"
          {...fadeUp(0.4)}
        >
          MathBot is a physical toy that asks kids adaptive math questions.
          No apps. No screens. Just progress you can see.
        </motion.p>

        {/* CTAs */}
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

      {/* ── Right column: robot image bleeding to the edge ── */}
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
            alt="MathBot robot swinging on glowing web strands against a night sky"
            fill
            className="object-contain object-bottom lg:object-right-bottom"
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
          />
        </motion.div>
      </div>

      {/* SVG strand — draws from robot's hand to the "MathBot" wordmark */}
      {!shouldReduceMotion && <WebStrand />}
    </section>
  );
}
