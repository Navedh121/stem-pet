"use client";

// Hero section — MathBot landing page.
// Robot PNG is transparent and anchored to the TOP-RIGHT of its column,
// reading as leaping in from the top corner. No code-drawn SVG webs.
// The robot's own rendered web strands are the only web in this section.

import { useReducedMotion, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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

  // Gentle float — the only animation on the robot
  const floatProps = shouldReduceMotion
    ? {}
    : {
        animate: { y: [0, -12, 0] },
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row">

      {/* ── Background ── */}
      <div className="absolute inset-0 bg-ink" aria-hidden="true" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(108deg, #0A0E1A 0%, #0A0E1A 42%, #1b0309 100%)" }}
        aria-hidden="true"
      />
      {/* Crimson atmospheric glow, right side */}
      <div
        className="absolute right-0 top-0 h-full w-2/3 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 75% at 90% 50%, rgba(225,29,42,0.17) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* ── Left column: text, vertically centred ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 pt-28 pb-12 lg:py-0">
        <motion.span
          className="inline-flex items-center gap-2 bg-surface border border-silk/15 rounded-full px-4 py-1.5 text-xs text-silk mb-8 w-fit"
          {...fadeUp(0.1)}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-spider-red" />
          Adaptive math · off the screen
        </motion.span>

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

      {/* ── Right column: robot at center-right ──
           items-center moves it DOWN from the top-right corner.
           justify-end + pr keeps it on the right side but off the edge.
           The image is larger (maxWidth ~56 vw) so the web strands that
           trail to the side have room and don't end at a visible hard edge. */}
      <div className="relative z-10 flex-1 flex items-center justify-center lg:justify-end lg:pr-10">
        <motion.div
          {...(shouldReduceMotion
            ? {}
            : {
                initial: { opacity: 0, x: 30 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.8, delay: 0.2, ease: "easeOut" },
              })}
        >
          <motion.div {...floatProps}>
            <Image
              src="/mathbot-hero.png"
              alt="MathBot robot with web strands trailing to the side"
              width={1888}
              height={2270}
              priority
              style={{
                width: "100%",
                height: "auto",
                maxWidth: "clamp(380px, 56vw, 760px)",
                maxHeight: "92vh",
                objectFit: "contain",
                display: "block",
              }}
            />
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}
