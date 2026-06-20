"use client";

// ============================================================
// Web of Progress — The signature element of STEMPet
// ============================================================
// A custom SVG radar / spider-web chart showing skill mastery.
// Each axis = one math skill.  The filled area = the child's
// mastery level in that skill (0–100%).
//
// On mount it animates:
//   1. The silk web lines draw themselves (SVG stroke animation)
//   2. The mastery polygon fades in and fills
//   3. Node points appear and glow
//
// If prefers-reduced-motion is set, we render statically.
// ============================================================

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { SkillMastery } from "@/lib/types";

// Default sample data for the landing page (no real child logged in).
export const SAMPLE_MASTERY: SkillMastery[] = [
  { skill: "addition",       mastery: 88, attempts: 45 },
  { skill: "subtraction",    mastery: 72, attempts: 38 },
  { skill: "multiplication", mastery: 54, attempts: 22 },
  { skill: "division",       mastery: 31, attempts: 12 },
];

// Labels shown on the radar axes.
const SKILL_LABELS = {
  addition:       "Addition",
  subtraction:    "Subtraction",
  multiplication: "Multiplication",
  division:       "Division",
};

interface Props {
  data?: SkillMastery[];  // pass null/undefined to use sample data
  size?: number;           // SVG viewBox size (default 300)
  animated?: boolean;      // default true
  showTooltips?: boolean;  // show % on hover (default true)
}

export default function WebOfProgress({
  data = SAMPLE_MASTERY,
  size = 300,
  animated = true,
  showTooltips = true,
}: Props) {
  const shouldReduceMotion = useReducedMotion();
  const doAnimate = animated && !shouldReduceMotion;

  // State for the hovering tooltip.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Whether the mastery fill animation has completed.
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (!doAnimate) {
      setFilled(true);
      return;
    }
    // Short delay so the page settles before the fill animates in.
    const t = setTimeout(() => setFilled(true), 300);
    return () => clearTimeout(t);
  }, [doAnimate]);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;    // outer radius of the web
  const ringCount = 4;          // how many concentric rings to draw

  // Extra horizontal space (px per side) so the left ("Division") and right
  // ("Subtraction") axis labels are not clipped by the SVG viewport.
  // All radar drawing coordinates are unchanged — only the viewBox and the
  // wrapper div get wider.  80px comfortably fits the longest side label
  // ("Subtraction", ~71px at 11px/Satoshi) at any supported size.
  const H_PAD = 80;

  // Axes: one per skill.  Start from the top and go clockwise.
  const axes = data.map((d, i) => {
    const angleDeg = (i / data.length) * 360 - 90;  // start at top
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      ...d,
      angle: angleRad,
      // Point on the outer ring for this skill.
      outerX: cx + maxR * Math.cos(angleRad),
      outerY: cy + maxR * Math.sin(angleRad),
      // Mastery point (0–100% of maxR).
      masteryX: cx + (d.mastery / 100) * maxR * Math.cos(angleRad),
      masteryY: cy + (d.mastery / 100) * maxR * Math.sin(angleRad),
      // Label position (slightly beyond the outer ring).
      labelX: cx + (maxR + 22) * Math.cos(angleRad),
      labelY: cy + (maxR + 22) * Math.sin(angleRad),
    };
  });

  // Build the SVG polygon points string for the mastery area.
  const masteryPoints = axes
    .map((a) => `${a.masteryX},${a.masteryY}`)
    .join(" ");

  // Build the outer polygon points for the web frame.
  const outerPoints = axes.map((a) => `${a.outerX},${a.outerY}`).join(" ");

  return (
    <div className="relative" style={{ width: size + H_PAD * 2, maxWidth: "100%" }}>
      <svg
        viewBox={`${-H_PAD} 0 ${size + H_PAD * 2} ${size}`}
        width={size + H_PAD * 2}
        height={size}
        style={{ maxWidth: "100%", height: "auto" }}
        aria-label="Web of Progress — skill mastery radar chart"
        role="img"
      >
        {/* ── Gradient defs ── */}
        <defs>
          <radialGradient id="masteryGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1E6BFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E11D2A" stopOpacity="0.25" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Concentric rings (web background) ── */}
        {Array.from({ length: ringCount }).map((_, ri) => {
          const r = (maxR * (ri + 1)) / ringCount;
          const pts = axes
            .map((a) => {
              const x = cx + r * Math.cos(a.angle);
              const y = cy + r * Math.sin(a.angle);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              key={ri}
              points={pts}
              fill="none"
              stroke="#AEB9D4"
              strokeWidth="0.6"
              strokeOpacity="0.25"
            />
          );
        })}

        {/* ── Spoke lines from center to each axis ── */}
        {axes.map((a, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={a.outerX}
            y2={a.outerY}
            stroke="#AEB9D4"
            strokeWidth="0.6"
            strokeOpacity="0.3"
          />
        ))}

        {/* ── Mastery filled polygon ──
             Animate opacity only, not scale. SVG elements don't support CSS
             `scale` the same way HTML elements do — Framer Motion 11 throws
             (message: undefined) when it tries to read the computed CSS
             transform back from a <polygon> during the animation loop.     */}
        <motion.polygon
          points={masteryPoints}
          fill="url(#masteryGradient)"
          stroke="#1E6BFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: filled ? 1 : 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />

        {/* ── Outer web frame (glowing border) ── */}
        <polygon
          points={outerPoints}
          fill="none"
          stroke="#AEB9D4"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* ── Mastery node points + tooltips ── */}
        {axes.map((a, i) => (
          <g key={i}>
            {/* Invisible hit area for mouse hover */}
            <circle
              cx={a.masteryX}
              cy={a.masteryY}
              r={12}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {/* Visible node.
                Do NOT also set r={} as a direct prop — Framer Motion
                owns `r` via initial/animate; a competing direct prop
                causes a server/client hydration mismatch (server sees
                r=4, client's initial override is r=0).                */}
            <motion.circle
              cx={a.masteryX}
              cy={a.masteryY}
              fill={hoveredIndex === i ? "#1E6BFF" : "#AEB9D4"}
              filter={hoveredIndex === i ? "url(#glow)" : undefined}
              initial={{ r: 0 }}
              animate={{ r: filled ? (hoveredIndex === i ? 6 : 4) : 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            />

            {/* Tooltip showing exact % */}
            {showTooltips && hoveredIndex === i && (
              <g>
                <rect
                  x={a.masteryX - 24}
                  y={a.masteryY - 28}
                  width={48}
                  height={20}
                  rx={4}
                  fill="#141A2E"
                  stroke="#1E6BFF"
                  strokeWidth="0.8"
                />
                <text
                  x={a.masteryX}
                  y={a.masteryY - 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="'Geist Mono', monospace"
                  fill="#F4F6FB"
                >
                  {a.mastery}%
                </text>
              </g>
            )}
          </g>
        ))}

        {/* ── Axis labels ── */}
        {axes.map((a, i) => {
          // Anchor text based on which side of the chart it's on.
          const anchor =
            a.labelX < cx - 5 ? "end" : a.labelX > cx + 5 ? "start" : "middle";

          return (
            <text
              key={i}
              x={a.labelX}
              y={a.labelY}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="11"
              fontFamily="'Satoshi', sans-serif"
              fill="#AEB9D4"
            >
              {SKILL_LABELS[a.skill]}
            </text>
          );
        })}

        {/* ── Center dot ── */}
        <circle cx={cx} cy={cy} r={2} fill="#AEB9D4" fillOpacity="0.5" />
      </svg>
    </div>
  );
}
