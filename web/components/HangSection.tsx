// Feature cards section — clean, no robot image, no SVG strands.
// Three honest reasons the product works, in a simple 3-column grid.
// Server component — no client-side code needed.

import AnimatedSection from "@/components/AnimatedSection";

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
              <span className="text-2xl" role="img" aria-hidden="true">
                {card.icon}
              </span>
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
