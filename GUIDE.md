# STEMPet — Complete Setup Guide

Follow every step in order. Each section ends with a **checkpoint** so you know
it worked before moving on. Take your time — the whole process takes about
30–45 minutes.

---

## What you will have at the end

- A live parent website (on Vercel) where you can see your child's progress
- A database (on Supabase) that stores questions and answers
- An AI question generator (Groq) that makes fresh math questions
- An ESP32 toy that connects to the internet and sends results to the dashboard

---

## Accounts you need (all free, no credit card)

Create these before starting:

| Service | Sign-up link | What it does |
|---------|-------------|--------------|
| GitHub | github.com | Stores the code (you may already have this) |
| Supabase | supabase.com | Database + login system |
| Groq | console.groq.com | AI that generates math questions |
| Vercel | vercel.com | Hosts the website |

---

## PART 1 — Supabase (database + login)

### 1.1 Create a Supabase project

1. Go to **supabase.com** and sign in.
2. Click **New Project**.
3. Fill in:
   - **Name:** `stempet` (or anything you like)
   - **Database Password:** choose a strong password — save it somewhere
   - **Region:** pick the one closest to you
4. Click **Create new project**.
5. Wait about 1–2 minutes for it to finish setting up.

### 1.2 Copy your API keys

1. In the left sidebar click **Project Settings** (the gear icon at the bottom).
2. Click **API** in the sub-menu.
3. You will see three values — copy each one and paste it into a plain text
   file for now (you will use them in Part 3):

   | What to copy | Where to find it |
   |---|---|
   | **Project URL** | Under "Project URL" — looks like `https://xxxxxxxxxxxx.supabase.co` |
   | **anon (public) key** | Under "Project API keys" → `anon` `public` row |
   | **service_role key** | Under "Project API keys" → `service_role` row — click the eye icon to reveal |

   > **Keep the service_role key secret** — it bypasses the database security
   > rules. Never share it or put it in public code.

### 1.3 Run the database schema

This creates the tables the app uses.

1. In the left sidebar click **SQL Editor**.
2. Click **New Query** (top-right).
3. Open the file `supabase/schema.sql` from this repo in any text editor
   (Notepad is fine). Select all the text (Ctrl+A) and copy it.
4. Paste it into the Supabase SQL editor.
5. Click **Run** (or press Ctrl+Enter).
6. You should see a green "Success" message at the bottom.

### 1.4 Run the migration

This adds the age_group column that the new firmware uses.

1. Click **New Query** again.
2. Open `supabase/migrations/0002_age_per_session.sql`, copy all of it, paste
   it in, and click **Run**.
3. Green "Success" again.

### 1.5 Run the seed data

This adds sample questions and a demo account so your dashboard looks alive.

1. Click **New Query** again.
2. Open `supabase/seed.sql`, copy all of it, paste it in, and click **Run**.
3. Green "Success".

> **Demo login:** after the website is live you can log in with
> `demo@stempet.dev` / `Demo1234!` to see a fully-populated dashboard.

### ✅ Checkpoint 1

In the left sidebar click **Table Editor**. You should see these tables listed:
`children`, `devices`, `questions`, `attempts`.
Click on `questions` — you should see rows (the built-in fallback questions
from seed.sql). If you see empty tables, re-run schema.sql and seed.sql.

---

## PART 2 — Groq API key (AI question generator)

1. Go to **console.groq.com** and sign in (create a free account if needed).
2. Click **API Keys** in the left sidebar.
3. Click **Create API Key**.
4. Give it a name like `stempet`.
5. Copy the key — it starts with `gsk_`. Save it in the same text file as
   your Supabase keys.

   > You can only see the key once — if you close the dialog without copying
   > it, you will need to create a new one.

### ✅ Checkpoint 2

You should have four values saved:
- Supabase Project URL
- Supabase anon key
- Supabase service_role key
- Groq API key

---

## PART 3 — Local environment (run on your laptop)

This step is optional if you just want to deploy straight to Vercel, but it
lets you test everything before going live.

### 3.1 Install Node.js (if you haven't already)

1. Go to **nodejs.org** and download the LTS version.
2. Run the installer with default options.
3. Open a terminal (Command Prompt or PowerShell on Windows) and type:
   ```
   node --version
   ```
   You should see something like `v20.x.x`.

### 3.2 Create the environment file

1. In the `web/` folder of this repo, find the file called `.env.example`.
2. Make a copy of it in the same folder and name the copy **`.env.local`**.
   (The dot at the start is important.)
3. Open `.env.local` in a text editor and fill in your values:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your anon key...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your service role key...
   GROQ_API_KEY=gsk_...your groq key...
   ```

   Replace each placeholder with the actual values you copied in Parts 1 and 2.

### 3.3 Install dependencies and start the server

Open a terminal, navigate to the `web/` folder, and run:

```
npm install
npm run dev
```

The first command installs all the packages (takes 1–2 minutes the first time).
The second starts the local development server.

### 3.4 Test locally

1. Open your browser and go to **http://localhost:3000**.
2. You should see the STEMPet landing page.
3. Click **Sign Up** and create an account with your email.
4. Go to **http://localhost:3000/simulator** — you should see the simulator
   (you will test it properly after adding a child and device in Part 5).

### ✅ Checkpoint 3

The landing page loads at `http://localhost:3000` with no errors.

---

## PART 4 — Vercel (deploy the website)

### 4.1 Push the code to GitHub

If the repo is not already on GitHub:

1. Go to **github.com**, click the **+** button, click **New repository**.
2. Name it `stem-pet`, leave it public, click **Create repository**.
3. Follow the commands GitHub shows you to push your local code.

If the repo is already on GitHub, skip this step.

### 4.2 Create a Vercel project

1. Go to **vercel.com** and sign in with your GitHub account.
2. Click **Add New Project**.
3. Find your `stem-pet` repository and click **Import**.
4. On the configuration screen:
   - **Framework Preset:** Next.js (Vercel usually detects this automatically)
   - **Root Directory:** click **Edit** and type `web` — this is important
     because the Next.js app lives in the `web/` folder, not the root
5. **Do not click Deploy yet** — you need to add environment variables first.

### 4.3 Add environment variables to Vercel

Still on the same Vercel configuration screen, scroll down to
**Environment Variables**. Add each variable one at a time:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |
| `GROQ_API_KEY` | your Groq key |

For each one: type the name in the **Key** field, paste the value in the
**Value** field, and click **Add**.

### 4.4 Deploy

Click **Deploy**. Vercel will build and deploy the app. This takes about
1–2 minutes.

When it finishes you will see a URL like:
```
https://stem-pet-abc123.vercel.app
```
Copy this URL — you will need it for the firmware.

### 4.5 Set up Supabase to allow your Vercel domain

Supabase blocks login requests from unknown websites. You need to add your
Vercel URL to its allow-list:

1. In Supabase, go to **Authentication** → **URL Configuration**.
2. Under **Site URL**, type your Vercel URL:
   ```
   https://stem-pet-abc123.vercel.app
   ```
3. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://stem-pet-abc123.vercel.app/auth/callback
   ```
4. Click **Save**.

### ✅ Checkpoint 4

Open your Vercel URL in the browser. The landing page loads. Click **Sign Up**
and create an account — you should be taken to the dashboard.

---

## PART 5 — Set up your child's profile

### 5.1 Sign up

1. Go to your Vercel URL.
2. Click **Sign Up** and create an account with your email.
3. You will be taken to the parent dashboard.

### 5.2 Add a child

1. Click **+ Add a child** in the dashboard.
2. Fill in your child's name and age group.
3. Click **Save**.

### 5.3 Add a device and get a device code

1. Click **+ Link a device** in the dashboard.
2. You need to choose a **device code** — this is a short string that links
   the toy to your child. Choose something simple like `TOY01` or `DEMO01`.
   Type it in the Device Code field (uppercase, no spaces).
3. Click **Link**.

> Write down the device code — you will type it into the firmware config.

### 5.4 Test with the simulator

Before touching the ESP32, verify the full loop works in the browser:

1. Go to `https://your-vercel-url.vercel.app/simulator`.
2. Type your device code in the **Device code** field.
3. Select an age group.
4. Click **Continue →**.
5. Pick a level.
6. A math question should appear.
7. Answer it — you should see a correct/wrong result.
8. Go back to the dashboard — after a few seconds you should see the attempt
   counted in the stats.

### ✅ Checkpoint 5

The simulator shows questions and the dashboard updates with your answers.
If questions show up but the dashboard does not update, the API is working
but the submit-answer call might be failing — check the browser console
(F12 → Console) for error messages.

---

## PART 6 — Flash the ESP32

### 6.1 Install Arduino IDE

1. Go to **arduino.cc/en/software** and download **Arduino IDE 2.x**.
2. Run the installer with default options.

### 6.2 Add ESP32 board support

1. Open Arduino IDE.
2. Go to **File → Preferences**.
3. In the **Additional boards manager URLs** field, add this URL:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**.
5. Go to **Tools → Board → Boards Manager**.
6. Search for `esp32` and install **esp32 by Espressif Systems** (version 2.x).
   This takes a few minutes.

### 6.3 Install the required libraries

1. Go to **Sketch → Include Library → Manage Libraries**.
2. Search for and install each of these:

   | Search for | Install |
   |---|---|
   | `Adafruit ILI9341` | Adafruit ILI9341 by Adafruit |
   | `Adafruit GFX` | Adafruit GFX Library by Adafruit |
   | `ArduinoJson` | ArduinoJson by Benoit Blanchon |

   When Arduino asks if you also want to install dependencies, click
   **Install All**.

### 6.4 Open the firmware file

1. In Arduino IDE go to **File → Open**.
2. Navigate to the `firmware/` folder in this repo.
3. Open `STEMPet_Firmware.ino`.

### 6.5 Fill in the config block

At the very top of the file you will see this block:

```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_BASE_URL  = "https://YOUR-PROJECT.vercel.app";
const char* DEVICE_CODE   = "YOUR_DEVICE_CODE";
```

Replace each value:

- `YOUR_WIFI_SSID` → your home WiFi network name (exactly as it appears,
  case-sensitive)
- `YOUR_WIFI_PASSWORD` → your WiFi password
- `https://YOUR-PROJECT.vercel.app` → your actual Vercel URL
  (e.g. `https://stem-pet-abc123.vercel.app`)
- `YOUR_DEVICE_CODE` → the device code you created in Step 5.3
  (e.g. `TOY01`)

Example after filling in:
```cpp
const char* WIFI_SSID     = "HomeNetwork";
const char* WIFI_PASSWORD = "mypassword123";
const char* API_BASE_URL  = "https://stem-pet-abc123.vercel.app";
const char* DEVICE_CODE   = "TOY01";
```

### 6.6 Select the board and port

1. **Tools → Board → ESP32 Arduino → ESP32 Dev Module**
2. Plug your ESP32 into your computer with a USB cable.
3. **Tools → Port** → select the COM port that appeared after plugging in.
   - On Windows it looks like `COM3` or `COM4`.
   - If you don't see a port, install the CP2102 or CH340 USB driver
     (depends on your ESP32 board — search the chip name on the bottom
     of your ESP32 board + "driver").

### 6.7 Verify (compile without uploading)

Before uploading, verify there are no errors:

1. Click the **checkmark button ✓** (top-left in Arduino IDE).
2. Wait for it to finish compiling.
3. At the bottom you should see: **"Compilation successful."**

If you see errors:
- `Adafruit_ILI9341.h: No such file` → library not installed (redo Step 6.3)
- `ArduinoJson.h: No such file` → same
- Any other error → check that you filled in the config block correctly
  (no missing quotes, no extra characters)

### 6.8 Upload to the ESP32

1. Click the **arrow button → Upload**.
2. The IDE compiles and then uploads. You will see progress dots in the
   bottom panel.
3. You may need to hold the **BOOT** button on the ESP32 while it connects
   (some boards need this — if upload hangs at "Connecting...", try holding
   BOOT for 2–3 seconds until it starts).
4. When done you will see: **"Done uploading."**

### ✅ Checkpoint 6

The ESP32 screen turns on and shows "HEY CHAMP!" in cyan. Press any button.
The age selection screen (blue background) appears.

---

## PART 7 — First run

1. Press **A** for Ages 6-8, **B** for 8-10, or **C** for 10-12.
2. Press **A/B/C/D** to pick a difficulty level.
3. The screen shows "Connecting…" — wait a few seconds.
4. If it shows your IP address → you are in **online mode** (questions from
   the server, progress tracked).
5. If it shows "Offline Mode" → WiFi did not connect (see Troubleshooting).
6. A math question appears. Press A/B/C/D to answer.
7. Green screen = correct, red screen = wrong.
8. Check your dashboard — after a few questions you should see the stats
   updating.

### ✅ Final checkpoint

Questions appear on the toy, you answer them, and the parent dashboard shows
the activity. You are done!

---

## Troubleshooting

### "Connecting…" stays on screen for 8 seconds, then shows "Offline Mode"

The ESP32 cannot reach your WiFi.

- Double-check `WIFI_SSID` in the firmware — it is **case-sensitive**.
  Open your phone WiFi settings to see the exact name.
- Make sure your WiFi is 2.4 GHz. ESP32 does not support 5 GHz networks.
- Try moving the ESP32 closer to your router.
- Re-upload the firmware after fixing the SSID or password.

### Online mode works but the dashboard shows nothing

- Make sure the device code in the firmware exactly matches what you entered
  in the dashboard (same uppercase letters, no spaces).
- Open the dashboard, go to **Link a device** and check the code is listed.
- Try the `/simulator` with the same device code — if the simulator works
  but the toy doesn't, the WiFi is connected but the API calls are failing.

### "Unknown device_code" error in the Serial Monitor

The device code in the firmware does not match any record in the database.
Go to the dashboard → **Link a device** and add the device code you are
using in the firmware.

### The screen stays black after upload

- The TFT wiring may be wrong. Check:
  - TFT CS  → GPIO 15
  - TFT DC  → GPIO 2
  - TFT RST → GPIO 4
  - TFT SDA (MOSI) → GPIO 23
  - TFT SCL (SCK)  → GPIO 18
  - TFT VCC → 3.3V
  - TFT GND → GND
- Open **Tools → Serial Monitor** (set baud to 115200) — you should see
  `=== STEMPet booting ===`. If you do, the ESP32 is running but the TFT
  wiring is wrong.

### Questions show on the toy but the dashboard does not update

The POST to `/api/submit-answer` is probably failing silently.

- Open the Supabase dashboard → **Table Editor → attempts** — do new rows
  appear after answering on the toy? If yes, the data is there and the
  dashboard will refresh on the next page load.
- If no rows appear, check the Vercel function logs:
  Vercel dashboard → your project → **Logs** → look for errors on
  `/api/submit-answer`.

### Simulator shows "Server error 404 — Unknown device_code"

The device code you typed in the simulator is not linked to any child.
Go to the dashboard → **Link a device**, add the device code, then try
the simulator again.

### Groq question generation is failing (questions always seem the same)

- Check your Groq API key — open Supabase → **Table Editor → questions** →
  look at the `source` column. If all rows say `builtin`, Groq is not
  generating new questions.
- Check Vercel logs for `[groq]` errors.
- Make sure you set `GROQ_API_KEY` in Vercel environment variables (Part 4.3)
  and then **redeployed** after adding the variable.

### Vercel "Application Error" on the dashboard page

- Go to Vercel → your project → **Logs** and look for the error.
- The most common cause is a missing environment variable. Check all four
  are set (Part 4.3).
- If you added env vars after deploying, you need to **Redeploy** for them
  to take effect: Vercel → Deployments → the latest deployment → **Redeploy**.

---

## Quick reference — all the values you collected

Fill this in as you go through the guide:

```
Supabase Project URL:       https://________________.supabase.co
Supabase anon key:          eyJ_______________________________
Supabase service_role key:  eyJ_______________________________
Groq API key:               gsk_______________________________

Vercel URL:                 https://__________________________.vercel.app

WiFi SSID:                  __________________________________
WiFi Password:              __________________________________
Device Code:                __________________________________  (e.g. TOY01)
```
