"use client";

// Dashboard stat card.
// Shows a single metric (streak, accuracy, etc.) with a Geist Mono
// number, a label, and a small delta vs last week.

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  label: string;
  value: number;          // the current value (number to animate to)
  unit?: string;          // e.g. "%" or "d" (days)
  delta?: number | null;  // change vs last week (positive = up, negative = down)
  deltaLabel?: string;    // e.g. "vs last week"
  color?: "blue" | "red"; // glow color on hover
}

export default function StatCard({
  label,
  value,
  unit = "",
  delta = null,
  deltaLabel = "vs last week",
  color = "blue",
}: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? value : 0);
  const hasRun = useRef(false);

  // Count-up animation for the number.
  useEffect(() => {
    if (shouldReduceMotion || hasRun.current) return;
    hasRun.current = true;

    const duration = 800;
    const start = performance.now();
    const from = 0;
    const to = value;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out: decelerate toward the end.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value, shouldReduceMotion]);

  const glowClass = color === "red" ? "hover:shadow-red-glow" : "hover:shadow-glow";

  return (
    <motion.div
      className={`card p-5 transition-all duration-300 ${glowClass} hover:-translate-y-0.5`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-muted text-sm mb-2">{label}</p>

      <div className="flex items-end gap-1">
        <span className="mono text-3xl font-semibold text-paper">
          {displayValue.toLocaleString()}
        </span>
        {unit && (
          <span className="mono text-lg text-silk mb-0.5">{unit}</span>
        )}
      </div>

      {delta !== null && (
        <p className={`text-xs mt-1.5 ${delta >= 0 ? "text-web-blue" : "text-spider-red"}`}>
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}
          {unit} {deltaLabel}
        </p>
      )}
    </motion.div>
  );
}
