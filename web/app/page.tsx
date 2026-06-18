// Public landing page.
// Follows DESIGN_BRIEF §3A exactly:
//   1. Hero: Web of Progress + headline + CTA
//   2. How it works: 3 honest steps
//   3. What parents see: preview cards
//   4. Why it matters: screen-time + adaptive angle
//   5. Footer

import Link from "next/link";
import WebOfProgress, { SAMPLE_MASTERY } from "@/components/WebOfProgress";
import BackgroundThreads from "@/components/BackgroundThreads";
import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";

// Step data for the "How it works" section.
const HOW_IT_WORKS = [
  {
    number: "01",
    title: "Your child plays on the toy",
    body: "The physical STEMPet device shows math questions on its screen. Your child presses one of four buttons to answer — no phone, no app, no screen time.",
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

// Stats preview data (shown in "What parents see" section).
const PREVIEW_STATS = [
  { label: "Current streak",    value: "8 days",  color: "red" },
  { label: "Overall accuracy",  value: "74%",     color: "blue" },
  { label: "Questions this week", value: "47",    color: "blue" },
];

export default function LandingPage() {
  return (
    <main className="relative bg-ink min-h-screen overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          §1  HERO
         ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center gap-12 px-6 pt-20 pb-12 max-w-6xl mx-auto">
        {/* Ambient web threads */}
        <BackgroundThreads />

        {/* Text side */}
        <div className="relative z-10 flex-1 max-w-lg">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 bg-surface border border-silk/15 rounded-full px-4 py-1.5 text-xs text-silk mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-spider-red" />
            Adaptive math · off the screen
          </span>

          <h1 className="font-display text-display lg:text-display-lg text-paper leading-[1.05] mb-6">
            Watch your child&apos;s{" "}
            <span className="text-web-blue">math skills</span>{" "}
            grow — in real time.
          </h1>

          <p className="text-silk text-lg leading-relaxed mb-8">
            STEMPet is a physical toy that asks kids adaptive math questions.
            No apps. No screens. Just progress you can see.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-spider-red hover:bg-spider-red/90 text-white font-body font-medium px-6 py-3 rounded-lg transition-colors"
            >
              See your child&apos;s progress
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-silk/20 hover:border-silk/40 text-silk hover:text-paper px-6 py-3 rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Chart side */}
        <div className="relative z-10 flex-1 flex justify-center lg:justify-end">
          <div className="relative">
            {/* Subtle glow behind the chart */}
            <div className="absolute inset-0 rounded-full bg-web-blue/5 blur-3xl scale-125" />
            <WebOfProgress
              data={SAMPLE_MASTERY}
              size={320}
              animated={true}
              showTooltips={true}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §2  HOW IT WORKS
         ══════════════════════════════════════════════════════ */}
      <AnimatedSection className="px-6 py-20 max-w-5xl mx-auto">
        <p className="text-silk text-xs uppercase tracking-widest mb-3">How it works</p>
        <h2 className="font-display text-h2 text-paper mb-12">
          Three honest steps.
        </h2>

        <div className="grid sm:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.number} className="flex flex-col gap-3">
              <span className="mono text-spider-red text-sm">{step.number}</span>
              <h3 className="font-display text-h3 text-paper">{step.title}</h3>
              <p className="text-silk leading-relaxed text-sm">{step.body}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ══════════════════════════════════════════════════════
          §3  WHAT PARENTS SEE (dashboard preview)
         ══════════════════════════════════════════════════════ */}
      <AnimatedSection
        delay={0.1}
        className="px-6 py-20 bg-surface/40"
      >
        <div className="max-w-5xl mx-auto">
          <p className="text-silk text-xs uppercase tracking-widest mb-3">The dashboard</p>
          <h2 className="font-display text-h2 text-paper mb-4">
            The proof is in the data.
          </h2>
          <p className="text-muted max-w-lg mb-10 leading-relaxed">
            Every question your child answers is logged. You&apos;ll always know
            exactly how they&apos;re doing — no guessing.
          </p>

          {/* Mini stat card previews */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {PREVIEW_STATS.map((s) => (
              <div
                key={s.label}
                className="card p-5"
              >
                <p className="text-muted text-xs mb-2">{s.label}</p>
                <p className={`mono text-2xl font-semibold ${s.color === "red" ? "text-spider-red" : "text-web-blue"}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Web of Progress preview */}
          <div className="card p-6 flex flex-col sm:flex-row items-center gap-8">
            <WebOfProgress data={SAMPLE_MASTERY} size={240} animated={false} showTooltips={false} />
            <div>
              <h3 className="font-display text-h3 text-paper mb-2">Web of Progress</h3>
              <p className="text-silk leading-relaxed text-sm max-w-sm">
                The spider-web chart shows mastery in each skill at a glance.
                As your child improves, the web fills out — literally showing
                their growth.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ══════════════════════════════════════════════════════
          §4  WHY IT MATTERS
         ══════════════════════════════════════════════════════ */}
      <AnimatedSection delay={0.1} className="px-6 py-20 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-silk text-xs uppercase tracking-widest mb-3">Why it matters</p>
            <h2 className="font-display text-h2 text-paper mb-6">
              Learning that happens off a screen.
            </h2>
            <div className="space-y-5 text-silk leading-relaxed text-sm">
              <p>
                Children spend more time on screens than ever. STEMPet is built
                on the opposite idea: a physical toy with four buttons and a small
                display, designed to be held, not stared at.
              </p>
              <p>
                The questions adapt automatically. When your child is flying,
                the difficulty rises to keep them challenged. When they&apos;re
                struggling, it eases back — no frustration, no giving up.
              </p>
              <p>
                The result: a child who practices without being pushed, and a
                parent who can see the proof.
              </p>
            </div>
          </div>

          {/* Visual callout */}
          <div className="space-y-4">
            {[
              { icon: "📵", text: "No app. No phone. No screen time." },
              { icon: "🎯", text: "Questions adapt to your child's exact level." },
              { icon: "📈", text: "You see the progress. Your child feels it." },
            ].map((item) => (
              <div key={item.text} className="card p-4 flex items-start gap-3">
                <span className="text-xl" role="img" aria-hidden="true">{item.icon}</span>
                <p className="text-paper text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <Footer />
    </main>
  );
}
