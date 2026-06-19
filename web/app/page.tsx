// MathBot public landing page.
// Sections:
//   1. Hero        — robot + wordmark + CTA (HeroSection)
//   2. How it works — 3 honest steps
//   3. Meet MathBot — idle robot (IdleSection)
//   4. Dashboard   — Web of Progress + stat cards
//   5. Why it matters — 3 feature cards (HangSection)
//   6. Footer

import Link from "next/link";
import WebOfProgress, { SAMPLE_MASTERY } from "@/components/WebOfProgress";
import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import IdleSection from "@/components/IdleSection";
import HangSection from "@/components/HangSection";

const HOW_IT_WORKS = [
  {
    number: "01",
    title: "Your child plays on the toy",
    body: "The physical MathBot device shows math questions on its screen. Your child presses one of four buttons to answer — no phone, no app, no screen time.",
  },
  {
    number: "02",
    title: "Questions adapt to them",
    body: "The system tracks every answer. Questions get harder when they're on a roll, and gentler when they need a moment — automatically, in real time.",
  },
  {
    number: "03",
    title: "You watch them improve here",
    body: "This dashboard shows your child's accuracy, streak, and skill mastery. You'll see the proof that it's working.",
  },
];

const PREVIEW_STATS = [
  { label: "Current streak",     value: "8 days", color: "red"  },
  { label: "Overall accuracy",   value: "74%",    color: "blue" },
  { label: "Questions this week", value: "47",    color: "blue" },
];

export default function LandingPage() {
  return (
    <main className="relative bg-ink min-h-screen overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          §1  HERO — robot + wordmark, full-screen
         ══════════════════════════════════════════════════════ */}
      <HeroSection />

      {/* ══════════════════════════════════════════════════════
          §2  HOW IT WORKS
         ══════════════════════════════════════════════════════ */}
      <AnimatedSection className="px-6 py-36 max-w-5xl mx-auto">
        <p className="text-silk text-xs uppercase tracking-widest mb-3">How it works</p>
        <h2 className="font-display text-4xl sm:text-5xl text-paper mb-14">
          Three honest steps.
        </h2>
        <div className="grid sm:grid-cols-3 gap-10">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.number} className="flex flex-col gap-3">
              <span className="mono text-spider-red text-sm">{step.number}</span>
              <h3 className="font-display text-xl text-paper">{step.title}</h3>
              <p className="text-silk leading-relaxed text-sm">{step.body}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ══════════════════════════════════════════════════════
          §3  MEET MATHBOT — idle robot section
         ══════════════════════════════════════════════════════ */}
      <IdleSection />

      {/* ══════════════════════════════════════════════════════
          §4  DASHBOARD PREVIEW — Web of Progress lives here
         ══════════════════════════════════════════════════════ */}
      <AnimatedSection delay={0.1} className="px-6 py-28 bg-surface/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-silk text-xs uppercase tracking-widest mb-3">The dashboard</p>
          <h2 className="font-display text-4xl sm:text-5xl text-paper mb-4">
            The proof is in the data.
          </h2>
          <p className="text-muted max-w-lg mb-12 leading-relaxed">
            Every question your child answers is logged. You&apos;ll always know
            exactly how they&apos;re doing — no guessing.
          </p>

          {/* Stat card previews */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {PREVIEW_STATS.map((s) => (
              <div key={s.label} className="card p-5">
                <p className="text-muted text-xs mb-2">{s.label}</p>
                <p
                  className={`mono text-2xl font-semibold ${
                    s.color === "red" ? "text-spider-red" : "text-web-blue"
                  }`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Web of Progress — the signature radar chart */}
          <div className="card p-6 flex flex-col sm:flex-row items-center gap-8">
            <WebOfProgress
              data={SAMPLE_MASTERY}
              size={260}
              animated
              showTooltips
            />
            <div>
              <h3 className="font-display text-2xl text-paper mb-3">
                Web of Progress
              </h3>
              <p className="text-silk leading-relaxed text-sm max-w-sm">
                The spider-web chart shows mastery in each skill at a glance.
                As your child improves, the web fills out — literally showing
                their growth.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 mt-6 text-web-blue text-sm hover:text-paper transition-colors"
              >
                Create your free account →
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ══════════════════════════════════════════════════════
          §5  FEATURE CARDS — why MathBot works
         ══════════════════════════════════════════════════════ */}
      <HangSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
