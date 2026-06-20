# STEMPet — Build Progress

> **Living status log.** Claude Code: read this at the START of every session,
> update it after every phase/step, and commit it. `CLAUDE.md` is the fixed spec;
> this file is the changing status. Verify claims against the actual files before
> trusting them.

## Current status
**Branch `mathbot-redesign` active.**
Landing page fully redesigned with MathBot branding + 3 robot images. Build passes clean (11 routes, 0 errors).

## Next step
Push `mathbot-redesign` to GitHub, open a PR into `master`, then deploy a Vercel preview from the PR.

## Next step (human action required, main branch)
Follow the 5-step manual checklist in README.md:
1. Create Supabase project → run supabase/schema.sql + supabase/seed.sql → copy env vars to web/.env.local.
2. Get a free Groq API key at console.groq.com → add to web/.env.local.
3. Deploy to Vercel (connect the repo, add the same env vars in Vercel dashboard).
4. Flash firmware: fill the config block at top of firmware/STEMPet_Firmware.ino, then flash via Arduino IDE.
5. Sign up on the deployed website, add a child, link the device with its code.
Demo login (after seed.sql runs): demo@stempet.dev / Demo1234!

## Phase checklist

- [x] **Phase 1 — Scaffold** `/web` (Next.js 15 + TS + Tailwind + Framer Motion + Recharts, fonts, Supabase client, `.env.example`)
- [x] **Phase 2 — Database + auth** (`supabase/schema.sql` with RLS, login/signup pages, auth callback, middleware)
- [x] **Phase 3 — API + AI** (`next-question`, `submit-answer`, adaptive engine in `lib/adaptive.ts`, Groq generator in `lib/groq.ts`, `supabase/seed.sql`)
- [x] **Phase 4 — Firmware** (`firmware/STEMPet_Firmware.ino` — WiFi + HTTPS + prefetch + offline fallback + NVS level persistence)
- [x] **Phase 5 — Landing page** (`app/page.tsx` — 5 sections per DESIGN_BRIEF: hero, how-it-works, dashboard preview, why, footer)
- [x] **Phase 6 — Dashboard** (stat cards, Web of Progress SVG radar, Recharts area chart, focus areas, recent activity)
- [x] **Phase 7 — Demo data** (`supabase/seed.sql` — ~200 attempts for Alex over 30 days via PL/pgSQL DO block)
- [x] **Phase 8 — Docs** (`README.md` with exact 6-step setup checklist; `WHY_NOTES.md` with 7 decision explanations)

## mathbot-redesign changes (June 2026)

- `web/app/page.tsx` — rewritten: 5 new sections, uses new components, removes old radar-in-hero layout
- `web/app/layout.tsx` — updated metadata title/description to "MathBot"
- `web/components/HeroSection.tsx` — new: two-column hero, "Math"(white)+"Bot"(red) wordmark, mathbot-hero.png right column, SVG web-strand animation from robot hand to wordmark
- `web/components/IdleSection.tsx` — new: centered idle-bob + tilt robot with 6 SVG tendrils
- `web/components/HangSection.tsx` — new: hanging robot at top, scroll-triggered SVG strands that wrap 3 feature cards
- `web/components/Footer.tsx` — updated: "MathBot" in wordmark, "STEMPet" only in copyright line
- `web/public/mathbot-hero.png`, `mathbot-idle.png`, `mathbot-hang.png` — added by user

## Files created / changed (original phases)

### /supabase
- `schema.sql` — 4 tables + 4 indexes + RLS policies
- `seed.sql` — 200+ builtin questions + demo parent/child/device/attempts

### /firmware
- `STEMPet_Firmware.ino` — complete ESP32 sketch (config block at top; online + offline)

### /web
- `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- `tailwind.config.ts` — full design token set
- `.env.example`, `.gitignore`
- `app/globals.css` — Fontshare imports (Clash Display, Satoshi), Geist Mono, CSS vars
- `app/layout.tsx`, `app/page.tsx` (landing), `middleware.ts`
- `app/login/page.tsx`, `app/signup/page.tsx`, `app/auth/callback/route.ts`
- `app/api/next-question/route.ts`, `app/api/submit-answer/route.ts`
- `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`
- `app/dashboard/add-child/page.tsx`, `app/dashboard/link-device/page.tsx`
- `lib/supabase.ts`, `lib/types.ts`, `lib/adaptive.ts`, `lib/groq.ts`
- `components/WebOfProgress.tsx`, `components/AnimatedSection.tsx`
- `components/BackgroundThreads.tsx`, `components/StatCard.tsx`
- `components/ProgressChart.tsx`, `components/FocusAreas.tsx`
- `components/RecentActivity.tsx`, `components/Footer.tsx`

### Root
- `README.md`, `WHY_NOTES.md`

## Notes / decisions

- `legacy_firmware.ino` was absent from the project — created `STEMPet_Firmware.ino` from scratch as the complete combined offline + online firmware.
- Node.js was not installed on the machine; installed via `winget install OpenJS.NodeJS.LTS`.
- Wrote all `/web` files manually (same structure as `create-next-app`, no scaffold tool needed since Node.js wasn't available yet).
- Groq model: `llama-3.3-70b-versatile` (free tier as of June 2026). Fallback: `llama3-8b-8192`.
- HTTPS cert pinning skipped in firmware for demo simplicity (noted in WHY_NOTES.md).
- Demo data generated programmatically in `seed.sql` via PL/pgSQL DO block (~200 attempts, 30-day arc from addition level 1 → multiplication level 1).
- Demo login: `demo@stempet.dev` / `Demo1234!` (Supabase may require manual email confirmation).
