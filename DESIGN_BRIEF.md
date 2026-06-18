# STEMPet — Web Design Brief (Parent Dashboard + Landing)

This is the visual reference for building the STEMPet website. Follow it exactly.
The goal: a site that feels **premium, modern, and intentionally designed** — not
a templated, obviously-AI-generated dashboard. Spend the "boldness budget" on ONE
signature element; keep everything around it quiet and disciplined.

---

## 0. The subject (don't skip — design flows from this)

- **Product:** STEMPet, a physical toy that teaches kids (ages 6–12) math. The
  child plays on the device, not a screen.
- **Who uses this website:** the **parent** — an adult. NOT the child. So the
  design is grown-up, calm, and trustworthy, *with* a confident hero theme — never
  cartoonish or childish.
- **The site's single job:** make a parent feel "this product is genuinely helping
  my child, I can see the proof, and it was worth buying."
- **Theme:** an **original spider-hero / web-slinger** identity (red, blue, deep
  night). Do NOT use Marvel's Spider-Man name, logo, or character art — build an
  original aesthetic that evokes the same energy.

---

## 1. Token system

### Color (6 core tokens, dark-first)
Use a deep **navy-black**, not pure black, and a **deliberate two-accent system**
(red = identity/alerts, blue = data/progress). This avoids the generic
"black background + one bright accent" AI look.

```
--ink        #0A0E1A   /* base background — midnight, web-at-night */
--surface    #141A2E   /* raised cards & panels, lifted from base */
--spider-red #E11D2A   /* brand identity, primary CTA, streaks, alerts — used sparingly */
--web-blue   #1E6BFF   /* data, progress, links, positive states */
--silk       #AEB9D4   /* hairline "web" lines, dividers, muted icons */
--paper      #F4F6FB   /* primary text on dark; background of any light surface */
```
Derived neutrals: muted text `#7C879E`; card border `rgba(174,185,212,0.12)`.
Optionally support a light mode using `--paper` as base, `--ink` as text — but
dark is the primary, signature experience.

### Typography (3 roles — all free)
Deliberately NOT Inter/Roboto everywhere.
- **Display / headlines:** **Clash Display** (Fontshare, free) — characterful,
  heroic, premium. Use with restraint, large and confident.
- **Body / UI:** **Satoshi** (Fontshare, free) — clean, modern, highly readable.
- **Data / numbers:** **Geist Mono** (Vercel, free) — for stats, streak counts,
  accuracy %, timers. Monospace numerals give a precise "instrument" feel that
  fits an engineering product.

Type scale (rough): display 56–72px, h2 32–40px, h3 22–24px, body 16–17px,
caption 13–14px. Tight letter-spacing on the display face; generous line-height
(1.6) on body.

### Layout
- Generous whitespace, strong vertical rhythm, a clear grid (12-col on desktop).
- Cards sit on `--surface` above the `--ink` base, with a 1px `--silk`-tint
  border and a soft inner glow — not heavy drop shadows everywhere.
- **Mobile-first.** Parents will mostly open this on a phone. Every layout must
  collapse cleanly to a single column with comfortable tap targets.

---

## 2. The signature element — "Web of Progress"

The one memorable thing. The spider web is not decoration — it's a real chart.

Build a **radar / spider chart drawn as a glowing spider web**, where each axis is
a math skill (Addition, Subtraction, Multiplication, Division, and room for more),
and the filled web area shows the child's **mastery** in each. The "web" literally
*is* the data structure: a web of connected skills.

- Web silk lines in `--silk`; the filled mastery area in a `--web-blue` →
  `--spider-red` gradient at low opacity; node points glow on hover and show the
  exact % (in Geist Mono).
- On load, the web "draws itself" once (SVG stroke animation), then the mastery
  area fills. This is the page's hero moment.

Everything else on the page stays calm so this element carries the identity.

---

## 3. Pages

### A) Landing page (public — the "this is premium, buy it" feeling)
This is where the scroll animation and wow-factor live.
1. **Hero:** the Web of Progress visual (using sample data) on one side; on the
   other, a confident headline + one-line value prop + primary CTA
   ("See your child's progress"). Subtle animated web-silk threads in the
   background that drift slowly / react to cursor.
2. **How it works:** 3 honest steps (child plays on the toy → questions adapt to
   them → you watch them improve here). Only use numbered markers because this is
   a real sequence.
3. **What parents see:** preview cards of the real dashboard (streaks, accuracy,
   weak-areas) — show the product, don't just describe it.
4. **Why it matters:** the screen-time angle (kids learn off a phone) + adaptive
   difficulty. Calm, trustworthy, evidence-toned — not hype.
5. **Footer:** quiet, with original web-motif mark.

### B) Parent dashboard (behind login)
Clean, data-first, low visual noise — the opposite energy of the landing hero.
- **Top bar:** logo mark, child selector (a parent may have more than one child),
  account menu.
- **Overview row:** stat cards — current streak, questions answered, overall
  accuracy, time practiced this week. Numbers in Geist Mono, with a tiny up/down
  delta vs last week.
- **Web of Progress** (the signature radar) — skill mastery.
- **Progress over time:** a clean line/area chart of accuracy or questions per day.
- **Focus areas:** a calm callout naming the 1–2 weakest skills, phrased as
  encouragement ("Multiplication is where the most growth is right now").
- **Recent activity:** a simple list of recent sessions.

---

## 4. Motion plan (you asked — here's the deliberate version)

Animation should feel orchestrated, not scattered. Over-animating is itself a
tell-tale sign of AI-generated design, so be disciplined:
- **One hero moment:** the Web of Progress draws itself + numbers count up on load.
- **Scroll-triggered reveals:** sections fade-and-rise gently as they enter view —
  the SAME effect every time, for cohesion (use a library like Framer Motion or
  CSS `IntersectionObserver`).
- **Hover micro-interactions:** cards lift ~2–4px and the border-glow brightens;
  web nodes glow.
- **Ambient:** very slow drifting web-silk threads in the hero background only.
- **Respect `prefers-reduced-motion`:** disable non-essential motion for users who
  ask for it. (Accessibility requirement, not optional.)

Avoid: parallax overload, everything sliding from different directions, looping
flashy effects, anything that delays the parent from reading their data.

---

## 5. Do NOT do these (the "AI-generated" tells)

- ❌ Purple/indigo gradient backgrounds, or the default Tailwind blue.
- ❌ Inter/Roboto for everything.
- ❌ Three identical feature cards with big emoji as icons.
- ❌ Generic big-number-with-tiny-label hero as the whole concept.
- ❌ Soft grey drop-shadows on every element.
- ❌ The cream-background + serif-display + terracotta look.
- ❌ Pure-black background with a single neon accent.
- ❌ Childish/cartoon styling — remember, the user is a parent.

---

## 6. Quality floor (non-negotiable)

- Fully responsive down to small phones.
- Visible keyboard focus states on all interactive elements.
- `prefers-reduced-motion` respected.
- Color contrast meets WCAG AA for text.
- Fast: lazy-load below-the-fold, keep animations GPU-friendly.

---

## 7. Copy tone

Parent-facing, plain, warm, trustworthy. Name things by what the parent
recognizes ("your child's progress," not "user analytics"). Active voice on
buttons ("See progress," not "Submit"). Describe benefits honestly; never hype.
Empty states are invitations ("No sessions yet — once your child plays, their
progress shows up here.").
