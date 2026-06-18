# STEMPet

An adaptive math toy for kids aged 6–12. The physical toy (ESP32 + OLED + 4 buttons) asks math questions that get harder or easier based on the child's answers. This repository contains the parent website (Next.js) and the toy firmware (Arduino sketch).

---

## Architecture

```
Browser (parent)  →  Next.js on Vercel  →  Supabase (Postgres + Auth)
                                         ↑
ESP32 toy  ─────────────────────────────  (WiFi + HTTPS)
```

- **`/web`** — Next.js app. Serves both the parent website and the toy's API endpoints.
- **`/firmware`** — Arduino sketch for the ESP32. Online mode calls the API; offline mode generates questions locally.
- **`/supabase`** — SQL files you run once in the Supabase SQL editor.

---

## Manual Setup Checklist

These are the only steps you need to do by hand. Everything else is in the code.

### Step 1 — Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the Supabase dashboard: **SQL Editor → New Query**.
3. Paste and run `supabase/schema.sql` (creates the four tables + RLS policies).
4. Paste and run `supabase/seed.sql` (adds built-in questions + demo data).
5. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 2 — Groq API key

1. Go to [console.groq.com](https://console.groq.com) and create a free account.
2. Generate an API key.
3. Copy it → `GROQ_API_KEY`

### Step 3 — Local development

```bash
cd web
cp .env.example .env.local
# Fill in the four values in .env.local
npm install
npm run dev
# Opens at http://localhost:3000
```

Verify:
- Landing page loads at `http://localhost:3000`
- Sign up at `/signup` and log in at `/login`
- Dashboard at `/dashboard` redirects to login if not signed in

### Step 4 — Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **New Project → Import** your GitHub repo.
3. Set the **Root Directory** to `web`.
4. Under **Environment Variables**, add all four variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
5. Click **Deploy**. Vercel gives you a URL like `https://your-project.vercel.app`.

### Step 5 — Flash the ESP32

1. Install [Arduino IDE](https://www.arduino.cc/en/software) (2.x recommended).
2. In Arduino IDE → **Boards Manager**, install **esp32 by Espressif Systems**.
3. In **Library Manager**, install:
   - `Adafruit SSD1306`
   - `Adafruit GFX Library`
   - `ArduinoJson`
4. Open `firmware/STEMPet_Firmware.ino`.
5. Fill in the config block at the top of the file:
   ```cpp
   const char* WIFI_SSID     = "Your WiFi Name";
   const char* WIFI_PASSWORD = "Your WiFi Password";
   const char* API_BASE_URL  = "https://your-project.vercel.app";
   const char* DEVICE_CODE   = "ABC123";   // choose any short code
   ```
6. Select your ESP32 board under **Tools → Board**.
7. Click **Upload**.

### Step 6 — Link the toy to your child

1. Sign in to your Vercel URL (`https://your-project.vercel.app`).
2. Click **Add a child** and fill in the name and age group.
3. Click **Link a device** and enter the `DEVICE_CODE` you set in Step 5.
4. Power on the toy. It will show "Connected!" if WiFi works, or "Offline Mode" if it can't reach the network — either way, it works.

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only — never expose) |
| `GROQ_API_KEY` | Groq API key for AI question generation |

---

## Demo Login

After running `supabase/seed.sql`, you can log in with:

- **Email:** `demo@stempet.dev`
- **Password:** `Demo1234!`

This shows a pre-seeded dashboard with 30 days of realistic data for a child named "Alex".

> Note: Supabase may require you to confirm the email before logging in. If so, go to **Authentication → Users** in the Supabase dashboard and confirm the demo user manually.

---

## Project Structure

```
/web
  /app
    /api/next-question    GET — returns the next adaptive question for a toy
    /api/submit-answer    POST — logs a child's answer
    /auth/callback        Supabase auth redirect handler
    /dashboard            Parent dashboard (protected)
    /login                Login page
    /signup               Sign up page
    page.tsx              Public landing page
  /components             Shared React components
  /lib
    adaptive.ts           Adaptive difficulty engine
    groq.ts               Groq AI question generator
    supabase.ts           Supabase client helpers
    types.ts              Shared TypeScript types
  .env.example            Template for environment variables

/firmware
  STEMPet_Firmware.ino    ESP32 sketch (online + offline mode)

/supabase
  schema.sql              Tables + RLS policies
  seed.sql                Built-in questions + demo data
```
