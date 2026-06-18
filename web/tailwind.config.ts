import type { Config } from "tailwindcss";

// This config extends Tailwind with the exact design tokens from DESIGN_BRIEF.md.
// Every color, font, and animation used in the project lives here so you can
// reference them as Tailwind classes (e.g. "bg-ink", "text-spider-red").

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // ── Color tokens (from DESIGN_BRIEF §1) ──────────────────
      colors: {
        // Base surfaces
        ink:     "#0A0E1A",   // page background — midnight, web-at-night
        surface: "#141A2E",   // raised cards & panels

        // Accent colors
        "spider-red": "#E11D2A",  // brand identity, CTA, streaks, alerts
        "web-blue":   "#1E6BFF",  // data, progress, links, positive states

        // Supporting
        silk:   "#AEB9D4",   // hairline lines, dividers, muted icons
        paper:  "#F4F6FB",   // primary text on dark; light surface background

        // Derived (used in components)
        muted:  "#7C879E",   // secondary text
      },

      // ── Typography ───────────────────────────────────────────
      // Font families are loaded via @font-face in globals.css.
      fontFamily: {
        display: ["'Clash Display'", "sans-serif"],  // Headlines
        body:    ["'Satoshi'",       "sans-serif"],  // Body / UI
        mono:    ["'Geist Mono'",    "monospace"],   // Numbers / data
      },

      // ── Font sizes (from DESIGN_BRIEF §1) ───────────────────
      fontSize: {
        "display-lg": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }], // 72px
        "display":    ["3.5rem", { lineHeight: "1.1",  letterSpacing: "-0.02em" }], // 56px
        "h2":         ["2.25rem",{ lineHeight: "1.2",  letterSpacing: "-0.01em" }], // 36px
        "h3":         ["1.5rem", { lineHeight: "1.3"  }],                            // 24px
      },

      // ── Border radius ────────────────────────────────────────
      borderRadius: {
        card: "1rem",   // used on all stat cards and panels
      },

      // ── Box shadows ──────────────────────────────────────────
      // Subtle inner glow on cards (no heavy drop shadows — see DESIGN_BRIEF §5)
      boxShadow: {
        card:  "inset 0 1px 0 rgba(174,185,212,0.08)",
        glow:  "0 0 16px rgba(30,107,255,0.35)",         // blue glow on hover
        "red-glow": "0 0 16px rgba(225,29,42,0.35)",     // red glow for streaks
      },

      // ── Animation / keyframes ────────────────────────────────
      // Used for the ambient silk thread drift and web draw-on animation.
      animation: {
        "drift-slow": "drift 20s ease-in-out infinite",
        "fade-up":    "fadeUp 0.6s ease forwards",
        "count-up":   "countUp 0.8s ease-out forwards",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%":  { transform: "translate(10px, -8px) rotate(1deg)" },
          "66%":  { transform: "translate(-6px, 4px)  rotate(-0.5deg)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
