// Feature cards section — clean, no robot image, no SVG strands.
// Three honest reasons the product works, in a simple 3-column grid.
// Server component — no client-side code needed.
// Uses inline SVG icons (not emojis) for cross-platform consistency.

import AnimatedSection from "@/components/AnimatedSection";

// Inline SVG icons — Heroicons outline style, 24×24 viewBox.
// Emojis render differently on Android/iOS/Windows; inline SVGs don't.
const NoPhoneIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className="text-spider-red" aria-hidden="true">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.96.41 2 .66 3.05.74a2 2 0 0 1 1.86 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.26 13 19.79 19.79 0 0 1 1.2 4.37 2 2 0 0 1 3.18 2h3a2 2 0 0 1 2 1.72c.127 1.063.397 2.107.8 3.1a2 2 0 0 1-.45 2.11L7.26 10.1" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const AdaptIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className="text-web-blue" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const ChartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className="text-web-blue" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const CARDS = [
  {
    Icon: NoPhoneIcon,
    headline: "No app. No phone.",
    body: "No screen time for your child — just a toy with four buttons and a small display, designed to be held, not stared at.",
  },
  {
    Icon: AdaptIcon,
    headline: "Questions adapt in real time.",
    body: "When they're flying the difficulty rises to challenge them. When they struggle it eases back — automatically.",
  },
  {
    Icon: ChartIcon,
    headline: "You see the progress.",
    body: "Every answer is logged. You'll always know exactly how they're doing — no guessing, no testing anxiety.",
  },
];

export default function HangSection() {
  return (
    <section className="py-24 px-6">
      <AnimatedSection className="max-w-5xl mx-auto">
        <p className="text-silk text-xs uppercase tracking-widest mb-3">Why it matters</p>
        <h2 className="font-display text-4xl sm:text-5xl text-paper mb-12 leading-tight">
          Learning that happens off a screen.
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {CARDS.map((card) => (
            <div key={card.headline} className="card p-6 flex flex-col gap-3">
              <card.Icon />
              <h3 className="font-display text-lg text-paper leading-snug">
                {card.headline}
              </h3>
              <p className="text-silk text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}
