"use client";

// Off-screen / hang section — last content section.
// mathbot-hang.png (transparent) is the centrepiece. The robot's own rendered
// web strands are the primary visual — no competing drawn webs.
//
// The ONLY code-drawn lines are three short curved connectors that pick up
// exactly where the image's lower web strands end and flow down to the top
// edge of each feature card, so the image web reads as a single continuous
// element that catches the cards. They animate in when the section enters view.

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";

// Connector strand color — sampled from the icy-blue web in the robot images.
const CONNECTOR = "#9BC5FF";

// Three short connector paths (viewBox "0 0 100 100").
// They start from approximately where the image's lower web strands exit
// the PNG (~Y 47%, centred at X 50%) and curve gently to each card's
// top-centre edge (~Y 62%).
// Each also has a thin parallel fibre for a little texture.
const CONNECTORS = [
  // Left card
  {
    main:  "M 50,47 C 44,53 28,59 18,63",
    fibre: "M 50,48 C 43,55 27,61 17,64",
    delay: 0, dur: 0.9,
  },
  // Centre card
  {
    main:  "M 50,47 C 50,53 50,58 50,63",
    fibre: "M 51,48 C 51,54 51,59 51,64",
    delay: 0.08, dur: 0.8,
  },
  // Right card
  {
    main:  "M 50,47 C 56,53 72,59 82,63",
    fibre: "M 50,48 C 57,55 73,61 83,64",
    delay: 0.16, dur: 0.9,
  },
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

  return (
    <section ref={ref} className="relative overflow-hidden pb-36">

      {/* ── Robot: centred above the middle card, no frame ── */}
      <div className="relative z-10 flex justify-center">
        <Image
          src="/mathbot-hang.png"
          alt="MathBot hanging by one hand, web strands extending toward the cards below"
          width={1888}
          height={2270}
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "min(100%, 460px)",
            maxHeight: "72vh",
            objectFit: "contain",
            // Pull up slightly so the robot's upper web connects visually with the
            // dashboard section above
            // Soft depth shadow on the dark background
            filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.6))",
          }}
        />
      </div>

      {/* ── Connector strands: short lines from image web → card tops ── */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Soft glow matching the icy image web */}
            <filter id="connectorGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g filter="url(#connectorGlow)">
            {CONNECTORS.map((c, i) =>
              shouldReduceMotion ? (
                // Static for prefers-reduced-motion
                <g key={i}>
                  <path d={c.main}  fill="none" stroke={CONNECTOR} strokeWidth="0.42" strokeOpacity="0.55" strokeLinecap="round" />
                  <path d={c.fibre} fill="none" stroke={CONNECTOR} strokeWidth="0.18" strokeOpacity="0.28" strokeLinecap="round" />
                </g>
              ) : (
                <g key={i}>
                  <motion.path
                    d={c.main}
                    fill="none"
                    stroke={CONNECTOR}
                    strokeWidth="0.42"
                    strokeOpacity="0.60"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: c.dur, delay: c.delay, ease: "easeOut" }}
                  />
                  <motion.path
                    d={c.fibre}
                    fill="none"
                    stroke={CONNECTOR}
                    strokeWidth="0.18"
                    strokeOpacity="0.30"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: c.dur, delay: c.delay + 0.08, ease: "easeOut" }}
                  />
                </g>
              )
            )}
          </g>
        </svg>
      </div>

      {/* ── Feature cards — evenly spaced below the robot ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 mt-8">
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
              transition={{ duration: 0.5, delay: 0.5 + i * 0.12, ease: "easeOut" }}
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
