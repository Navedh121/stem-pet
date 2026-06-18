"use client";

// Accuracy over time line/area chart.
// Uses Recharts AreaChart with the STEMPet color tokens.

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DayPoint {
  date: string;      // "Mon", "Tue", … or "Jan 5", etc.
  accuracy: number;  // 0–100
  questions: number;
}

interface Props {
  data: DayPoint[];
}

// Custom tooltip that matches the design system.
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="card px-3 py-2 text-sm">
      <p className="text-silk text-xs mb-1">{label}</p>
      <p className="mono text-paper font-semibold">{payload[0].value}%</p>
    </div>
  );
}

export default function ProgressChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-40">
        <p className="text-muted text-sm">
          No sessions yet — once your child plays, their progress shows up here.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-display text-sm text-silk uppercase tracking-wider mb-4">
        Accuracy over time
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#1E6BFF" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#1E6BFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#AEB9D4"
            strokeOpacity={0.1}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#7C879E", fontSize: 11, fontFamily: "Satoshi" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#7C879E", fontSize: 11, fontFamily: "Geist Mono" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="accuracy"
            stroke="#1E6BFF"
            strokeWidth={2}
            fill="url(#accuracyGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#1E6BFF", stroke: "#0A0E1A", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
