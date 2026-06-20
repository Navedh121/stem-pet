# MathBot — Design Session Handoff

**Branch:** `mathbot-redesign` → merged into `master`
**Repo:** `Navedh121/stem-pet`
**Session focus:** Full marketing site redesign — robot images, layout, animations, bug fixes.

---

## What Was Done

### 1. Full Marketing Site Redesign (`mathbot-redesign` branch)

The original landing page had code-drawn SVG web strands competing with the robot images. The entire visual direction was replaced: the robot PNGs now carry their own rendered web strands, and all competing SVG drawings were removed.

**Before:** SVG webs drawn in code on top of robot images, cluttered and competing.
**After:** Clean transparent-background robot PNGs with their own web trails, on atmospheric gradient backgrounds.

---

### 2. Files Created / Modified

| File | What changed |
|------|-------------|
| `web/components/HeroSection.tsx` | Created from scratch — hero layout, robot positioning, wordmark, CTAs |
| `web/components/IdleSection.tsx` | Created from scratch — "Meet MathBot" section with bob/tilt animation |
| `web/components/HangSection.tsx` | Rewritten — removed robot image, simplified to 3-card grid, now a server component |
| `web/components/WebOfProgress.tsx` | Two bug fixes (see below) |
| `web/app/layout.tsx` | Added `suppressHydrationWarning` to `<body>` |
| `web/app/page.tsx` | Updated section composition, removed old layout wrappers |
| `web/public/mathbot-hero.png` | New asset — robot with web strands to the side, transparent background |
| `web/public/mathbot-idle.png` | New asset — robot standing, full legs visible, transparent background |
| `web/public/mathbot-hang.png` | **Deleted** — no longer used |

---

### 3. HeroSection — Key Design Decisions

**Robot positioning (final approach):**
- The robot is **absolutely positioned** (`position: absolute`) anchored to `right: 5vw`, vertically centred with `top: 50%; transform: translateY(-50%)`.
- Sized by **height** (`64vh`) with `width: auto`, not by width. This was the critical fix — earlier attempts used width-based sizing inside a flex container, which caused the image to overflow to the right (where the robot is) and get clipped by `overflow-x: hidden`. The robot appeared not to change size no matter how large the width values got.
- The outer wrapper div is `position: absolute; inset: 0; pointer-events: none` so it doesn't interfere with the left column's text and buttons.

**Wordmark:**
- `"Math"` (white): `WebkitTextStroke: "1.5px #E11D2A"` — thin red outline for depth.
- `"Bot"` (red): no stroke (blue stroke was added then removed at user request).

**Animations:**
- Entrance: `opacity 0→1, x: 30→0` over 0.8s (slides in from right).
- Float: `y: [0, -12, 0]` looping over 5s — gentle levitation.
- Both respect `prefers-reduced-motion`.

**Background:** Dark ink gradient (`#0A0E1A` → dark crimson `#1b0309`) + crimson radial glow on the right side (`rgba(225,29,42,0.17)`).

---

### 4. IdleSection — Key Design Decisions

**"Meet MathBot" section** — robot centred, text above, no SVG web drawings.

**Sizing approach:**
- Wrapper `<div style={{ width: "min(100vw - 3rem, 380px)" }}>` caps the robot width.
- `<Image style={{ width: "100%", height: "auto" }}>` inside fills the wrapper.
- This pattern (wrapper div + `width: 100%` image) reliably maintains aspect ratio and shows the full PNG without cropping — more predictable than setting width/height on the image element directly.

**Bob animation:** `y: [0, -16, 0]` over 3.2s — the section has **no `overflow-hidden`** so the upward bob is never clipped.

**Tilt animation:** `rotate: [-2, 2, -2]` over 4.5s — slight side-to-side sway.

**Blue glow:** `radial-gradient(ellipse 80% 70% at 50% 68%, rgba(30,107,255,0.34) 0%, transparent 75%)` — deep royal blue (`#1E6BFF`) at 34% opacity, centred behind the robot's lower body. Mirrors the hero's red glow in structure and intensity.

**Drop shadow:** `filter: drop-shadow(0 32px 64px rgba(0,0,0,0.65))` on the image — follows the PNG's alpha channel, not the bounding box, so it clings to the robot shape.

---

### 5. HangSection — Key Design Decisions

Previously contained a hanging robot image and SVG strand animations. Now:
- **Pure server component** — no `"use client"`, no Framer Motion, no image.
- Three feature cards in a responsive 3-column grid, each with an emoji icon, headline, and body copy.
- Wrapped in `<AnimatedSection>` for scroll-triggered fade-in (that component handles all animation).
- Copy: "No app. No phone." / "Questions adapt in real time." / "You see the progress."

---

### 6. Bug Fixes

**WebOfProgress radar chart — axis labels clipped**
- Problem: Left label ("Division") and right label ("Subtraction") were being cut off at the SVG viewport edge.
- Fix: Added `H_PAD = 80` horizontal padding by expanding the SVG `viewBox` to `${-H_PAD} 0 ${size + H_PAD*2} ${size}` and making the wrapper div `width: size + H_PAD*2`. The radar drawing coordinates are unchanged — only the viewport got wider.

**WebOfProgress — React hydration mismatch**
- Problem: `motion.circle` had both a direct `r={4}` JSX prop AND `initial={{ r: 0 }}` via Framer Motion. Server rendered `r=4`; client Framer Motion immediately set `r=0`. React detected the mismatch and showed a "1 Issue" runtime error.
- Fix: Removed the direct `r` prop entirely. Framer Motion's `initial`/`animate` now fully owns the `r` attribute.

**Body hydration warning**
- Problem: Browser extensions inject attributes onto `<body>`, causing a server/client mismatch warning.
- Fix: Added `suppressHydrationWarning` to the `<body>` element in `web/app/layout.tsx`.

**Image double-extension**
- Problem: New PNG files were saved as `mathbot-hero.png.png` and `mathbot-idle.png.png` (double extension). Components referenced `.png` paths → 404.
- Fix: Renamed files, cleared `.next` cache, rebuilt.

---

### 7. Things That Were Tried and Undone

**Pulsing cyan eye-glow on robots** — animated `drop-shadow` filter cycling between dim and bright cyan on both robots. Looked bad in practice. Undone with `git reset --hard` + force push.

**Blue text-stroke on "Bot"** — added `WebkitTextStroke: "1.5px #1E6BFF"` to match the red stroke on "Math". Removed at user request.

---

### 8. Commit History (chronological)

```
39c89f3  design: MathBot landing page redesign on mathbot-redesign branch
b323060  fix: rename double-.png.png image files to correct .png names
ba13967  design: icy-web strand redesign — transparent robots + fibrous animated webs
949ed3f  design: remove competing SVG webs, let robot images speak for themselves
7a91d59  design: hero top-right robot, idle fix, clean HangSection, hydration fix
4069e46  design: hero robot center-right, larger image, remove section overflow-hidden
9b55700  assets: replace hero + idle PNGs with new versions, remove unused hang image
bbf53e2  fix: suppress body hydration warning from browser extension attribute injection
f71e0b0  fix: prevent left/right axis label clipping in WebOfProgress radar chart
7bc9922  design: add blue radial glow behind idle robot, mirroring hero red glow
2dbd15a  design: stronger idle blue glow + hero robot shifted left
91d5216  design: increase hero robot image size by 1.5x
84b2b85  design: finalise hero robot positioning and wordmark styling
3d6a58e  merge: mathbot-redesign into master
```

---

## Your Next Steps (in order)

### 1. Deploy to Vercel
- Go to [vercel.com](https://vercel.com) → New Project → Import `Navedh121/stem-pet`
- Set **Root Directory** to `web`
- Vercel auto-deploys on every push to `master` after this

### 2. Set Up Supabase
- Create a free project at [supabase.com](https://supabase.com)
- Open the SQL Editor and run `supabase/schema.sql` (creates all tables + RLS policies)
- Then run `supabase/seed.sql` (loads demo child "Alex" with 30 days of realistic data)
- Note your **Project URL**, **anon key**, and **service role key** from Project Settings → API

### 3. Add Environment Variables in Vercel
In Vercel → Project → Settings → Environment Variables, add:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → free account |

Redeploy after adding vars (Vercel needs a fresh build to pick them up).

### 4. Test the Live Site
- Sign up as a parent at your Vercel URL
- Add a child, enter a device code
- Verify the dashboard loads and the Web of Progress radar renders

### 5. Flash the ESP32 (hardware step)
- Open `firmware/STEMPet_Firmware.ino` in Arduino IDE
- Fill in the config block at the very top:
  ```cpp
  const char* WIFI_SSID     = "your wifi name";
  const char* WIFI_PASSWORD = "your wifi password";
  const char* API_BASE_URL  = "https://your-project.vercel.app";
  const char* DEVICE_CODE   = "device code from the dashboard";
  ```
- Flash to the ESP32 — this is the only hardware change needed

---

## Current State of the Repo

- `master` — fully up to date, includes all redesign work, ready to deploy
- `mathbot-redesign` — feature branch, also pushed, now merged into master
- All 8 build phases from `CLAUDE.md` are complete (see `PROGRESS.md`)
- The only remaining work is the 5 manual setup steps above (Supabase, Vercel, env vars, test, flash)
