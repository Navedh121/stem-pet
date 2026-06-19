"use client";

// "Meet MathBot" idle section.
// Transparent robot PNG floats directly on the dark section background.
// No SVG tendrils. The robot bobs gently and tilts — no overflow-hidden on
// the section so the bob animation never gets clipped at the boundaries.
// Respects prefers-reduced-motion.

import { useReducedMotion, motion } from "framer-motion";
import Image from "next/image";

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
    /* No overflow-hidden — the bob animation moves the image up to -16px and
       overflow-hidden would clip that top edge. py-32 gives plenty of breathing
       room without any clipping risk.                                          */
    <section className="relative py-32">
      {/* Blue atmospheric glow centred behind the robot.
          Mirrors the hero's red glow (same opacity, same ellipse approach) —
          robot sits in the lower ~65% of the section, so the gradient is
          anchored there.  #1E6BFF at 17% opacity → deep royal blue that
          fades cleanly to the dark background.                               */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 65% 60% at 50% 68%, rgba(30,107,255,0.17) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
        <p className="text-silk text-xs uppercase tracking-widest mb-4">Meet MathBot</p>
        <h2 className="font-display text-4xl sm:text-5xl text-paper mb-4 leading-tight">
          Your child&apos;s math companion.
        </h2>
        <p className="text-silk max-w-sm leading-relaxed mb-16">
          A physical toy that never stops learning what your child needs next.
        </p>

        {/* Bob wrapper (outer) — tilt wrapper (inner) — image.
            The wrapper div caps the image width; width: 100% + height: auto
            inside it is the reliable Next.js responsive-image pattern that
            maintains the correct aspect ratio and shows the full PNG with no
            cropping.                                                          */}
        <motion.div {...bobProps}>
          <motion.div {...tiltProps}>
            <div style={{ width: "min(100vw - 3rem, 380px)" }}>
              <Image
                src="/mathbot-idle.png"
                alt="MathBot robot standing, looking around"
                width={1888}
                height={2270}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  filter: "drop-shadow(0 32px 64px rgba(0,0,0,0.65))",
                }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Breathing room below the robot before the next section */}
        <div className="mt-16" />
      </div>
    </section>
  );
}
