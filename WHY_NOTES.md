# STEMPet — Why Notes

Plain-English explanations of every major decision made during this build.
This is a living document — read it when you're asked "why did you choose X?"
in an interview or code review.

---

## Why Next.js (App Router)?

**The short version:** One project, one deploy, zero separate server.

Next.js lets us write both the parent website (React pages) and the toy's API
endpoints (`/api/...` routes) in the same project. That means one GitHub repo,
one Vercel deployment, one URL.

The App Router (released in Next.js 13) gives us **Server Components** — React
components that run on the server and can query the database directly, without
exposing the database credentials to the browser. That's exactly what we need for
the dashboard: a server-side data fetch that parents can't tamper with.

Alternative we considered: a separate Express server. Rejected because it adds
infra complexity and a second deploy step, with no benefit at this scale.

---

## Why Supabase?

**The short version:** Free Postgres + auth + RLS in five minutes.

We need three things: a relational database (for the attempts table, which powers
all the stats), authentication (so parents log in securely), and row-level security
(so parents can only see their own children's data, not everyone else's).

Supabase provides all three for free, with a generous free tier (500 MB, 50k
monthly active users). It ships with a great Next.js SDK (`@supabase/ssr`) that
handles cookie-based sessions correctly in the App Router.

Alternative: Firebase. Rejected because it uses a NoSQL data model (Firestore)
which is awkward for relational queries like "last 10 attempts in the current skill"
or "accuracy this week vs last week." SQL is a much better fit here.

---

## Why Groq for question generation?

**The short version:** The fastest free LLM API available, with a generous free tier.

We need to generate math questions on demand. Groq's inference speeds (~500
tokens/sec on `llama-3.3-70b-versatile`) mean the ESP32 doesn't have to wait more
than 1–2 seconds for a question. The free tier is generous enough for a portfolio
project with low traffic.

We use `llama-3.3-70b-versatile` as the default model. If that model leaves the
free tier, `llama3-8b-8192` is a good fallback — slightly less capable but still
fine for elementary math questions.

Crucially, the API is always called **server-side only** (from Next.js API routes).
The `GROQ_API_KEY` is never sent to the browser or the toy.

Alternative: OpenAI API. Rejected because it's not free and requires a credit card.

---

## Why rule-based adaptive difficulty (not machine learning)?

**The short version:** Explainable, zero training data, works on day one.

The adaptive engine in `web/lib/adaptive.ts` uses three simple rules:
- Look at the last 10 answers in the current skill.
- ≥ 80% correct → move up.
- ≤ 40% correct → move down.
- Otherwise → stay.

This is sometimes called a "mastery threshold" model. It's not as sophisticated as
a probabilistic "knowledge tracing" model (like the ones used by Khan Academy), but
it has major advantages:

1. **Explainable:** You can describe it in one sentence in an interview.
2. **No training data:** A pure ML model would need thousands of labeled sessions
   before it could make useful predictions. We have zero on day one.
3. **Fast:** The query is a simple `SELECT ... LIMIT 10 ORDER BY created_at DESC`.

**Future upgrade path:** If STEMPet grows, the rules could be replaced with a
Bayesian Knowledge Tracing model or a deep knowledge tracing model trained on the
accumulated `attempts` table. The `getTargetDifficulty()` function in `adaptive.ts`
is the only place that would change — the rest of the system is unaffected.

---

## Why skip HTTPS certificate pinning in the firmware?

**The short version:** Demo convenience. Production would pin the cert.

The ESP32 Arduino `HTTPClient` library can verify server certificates, but setting
it up properly requires you to embed the server's certificate chain in the sketch.
For a portfolio demo, this adds friction (the cert changes when you redeploy to
Vercel, breaking the toy), so we skip it.

What we do instead: the firmware uses `http.begin(url)` with the standard TLS
verification disabled. This means the connection is still encrypted — a passive
eavesdropper can't read the data — but we don't verify that the server is who it
claims to be (a "man-in-the-middle" could impersonate the API).

For a toy that only sends math answers, the risk is very low: the worst an
attacker could do is send fake questions. In a production product, you'd pin the
certificate or use a proper PKI.

This decision is noted in the firmware source with a comment pointing here.

---

## Why the offline fallback?

**The short version:** WiFi is unreliable. The toy must always work.

The toy is used by young children in homes, classrooms, and on trips. WiFi is not
guaranteed. If the toy requires a network connection to function, it will fail at
the worst moments (a child mid-session, a parent watching).

The offline generator in `STEMPet_Firmware.ino` is a completely self-contained
arithmetic question generator that stores its progress in the ESP32's non-volatile
memory (NVS via the `Preferences` library). It uses the same skill/level structure
as the online mode, so the difficulty still adapts — it just adapts based on a
local rolling-window counter rather than the server's database.

The transition is silent: if any network call fails (WiFi disconnect, HTTP error,
JSON parse error), `useOfflineMode` flips to `true` and stays there for the rest
of the session. The child never sees an error screen.

---

## Why separate stat cards and the Web of Progress radar?

**The short version:** One signature element. Keep everything else calm.

The DESIGN_BRIEF is explicit: "Spend the boldness budget on ONE signature element;
keep everything around it quiet and disciplined."

The Web of Progress radar is that element. It's the only place in the product with
a draw-itself SVG animation. Everything else (stat cards, progress chart, recent
activity) is deliberately low-key: clean lines, Geist Mono numbers, no flashy
effects. This restraint makes the radar stand out more, not less.

A common AI-generated design mistake is to animate everything or give every section
its own "wow moment." We specifically avoided that.

---

## Why Recharts for the progress chart?

**The short version:** It's the most popular React charting library and works well
with SSR.

Recharts is a declarative charting library built on top of D3. It handles
responsive sizing, accessibility attributes, and custom tooltips well. The `AreaChart`
component gives us exactly the smooth accuracy-over-time graph we need in ~30 lines.

The Web of Progress radar is **not** built with Recharts — it's a hand-rolled SVG
because Recharts' RadarChart doesn't support the custom visual we need (the
spiderweb aesthetic, the draw-itself animation, the glow effects). For the
accuracy chart, Recharts is the right tool.

---

## Why Framer Motion for animations?

**The short version:** The best React animation library, with built-in
`prefers-reduced-motion` support.

The DESIGN_BRIEF requires us to respect `prefers-reduced-motion` (a browser
setting for users who experience motion sickness or have vestibular disorders).
Framer Motion's `useReducedMotion()` hook makes this trivial — one check, and the
animation is either played or skipped entirely.

We use Framer Motion for:
- The Web of Progress fill animation
- The stat card count-up numbers
- The `AnimatedSection` scroll-triggered fade-and-rise

We do NOT use it for the ambient silk thread drift in the hero — that's a CSS
`@keyframes` animation because it's GPU-composited and has no JS overhead.
