"use client";

// Ambient background: slowly drifting SVG silk threads in the hero section.
// Subtle, GPU-friendly (CSS transform only), respects prefers-reduced-motion.

import { useReducedMotion } from "framer-motion";

// Pre-defined thread paths so they're deterministic (no Math.random).
// Each thread is a cubic bezier defined by start, two control points, and end,
// all expressed as percentages of the container's width/height.
const THREADS = [
  { d: "M 10,5 C 30,20 50,10 70,25 S 90,40 100,30", delay: "0s",   dur: "18s" },
  { d: "M 0,40 C 20,30 40,50 60,35 S 80,20 100,45", delay: "3s",   dur: "22s" },
  { d: "M 5,70 C 25,60 45,80 65,65 S 85,50 100,70", delay: "6s",   dur: "20s" },
  { d: "M 20,0 C 35,25 55,15 75,35 S 90,55 80,100", delay: "1.5s", dur: "25s" },
  { d: "M 80,0 C 65,30 45,20 30,50 S 15,75 25,100", delay: "4s",   dur: "19s" },
  { d: "M 0,80 C 25,70 50,90 75,80 S 90,60 100,85", delay: "8s",   dur: "23s" },
];

export default function BackgroundThreads() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {THREADS.map((t, i) => (
          <path
            key={i}
            d={t.d}
            fill="none"
            stroke="#AEB9D4"
            strokeWidth="0.12"
            strokeOpacity="0.18"
            style={{
              animation: `drift ${t.dur} ease-in-out ${t.delay} infinite alternate`,
            }}
          />
        ))}
      </svg>

      <style>{`
        @keyframes drift {
          from { transform: translate(0, 0); }
          to   { transform: translate(4px, -6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
