// =============================================================
//  STEMPet Firmware — ESP32 + ILI9341 TFT (320×240)
//
//  WHAT THIS DOES:
//    1. Colourful welcome screen, then the child picks an age group
//       (A = 6-8 / B = 8-10 / C = 10-12) and a difficulty level
//       (A = Easy / B = Medium / C = Tricky / D = Hard).
//    2. Connects to WiFi.
//    3. ONLINE MODE: fetches questions from the server, shows them
//       on the TFT, reads a button press, logs the result.
//       While the child reads a question the NEXT one is already
//       downloading in the background (prefetch on core 0).
//    4. If WiFi or the API ever fails, silently drops to OFFLINE
//       MODE — a built-in arithmetic generator that always works.
//    5. DEVICE_CODE is always shown in the corner of the question
//       screen so the parent can identify which toy it is.
//
//  HOW TO FLASH:
//    Step 1 — Fill in the CONFIGURATION block below.
//    Step 2 — Sketch → Include Library → Manage Libraries, install:
//               • "Adafruit ILI9341"    (by Adafruit)
//               • "Adafruit GFX Library" (by Adafruit)
//               • "ArduinoJson"          (by Benoit Blanchon)
//             (WiFi, HTTPClient, WiFiClientSecure, SPI, Preferences
//              are built into the ESP32 core — no install needed.)
//    Step 3 — Tools → Board → ESP32 Arduino → "ESP32 Dev Module"
//    Step 4 — Tools → Port → select the COM port for your ESP32
//    Step 5 — Click the Upload arrow (▶) and wait for "Done uploading"
// =============================================================


// =============================================================
//  ★  CONFIGURATION — fill these in before flashing  ★
// =============================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_BASE_URL  = "https://YOUR-PROJECT.vercel.app"; // no trailing slash
const char* DEVICE_CODE   = "YOUR_DEVICE_CODE";  // e.g. "DEMO01"
                                                   // must be linked to a child
                                                   // in the parent dashboard first

// Timeout waiting for WiFi before going offline (milliseconds).
const int WIFI_TIMEOUT_MS = 8000;

// Timeout waiting for an API response (milliseconds).
const int HTTP_TIMEOUT_MS = 5000;
// =============================================================


// ── Pin definitions ───────────────────────────────────────────
// TFT display (ILI9341, hardware SPI)
#define TFT_CS   15
#define TFT_DC    2
#define TFT_RST   4

// Four physical buttons — one per answer choice.
// Each button connects its pin to GND when pressed (INPUT_PULLUP).
const int BUTTON_A_PIN = 12;   // answer A / option 0
const int BUTTON_B_PIN = 13;   // answer B / option 1
const int BUTTON_C_PIN = 14;   // answer C / option 2
const int BUTTON_D_PIN = 27;   // answer D / option 3

// Passive buzzer — set to -1 to disable sound entirely.
const int BUZZER_PIN = 26;


// ── Libraries ─────────────────────────────────────────────────
#include <SPI.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Preferences.h>       // Non-volatile storage for offline level progress
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <ArduinoJson.h>


// ── Global objects ────────────────────────────────────────────
Adafruit_ILI9341 tft(TFT_CS, TFT_DC, TFT_RST);
Preferences prefs;

// The toy starts in online mode and switches to offline if
// WiFi or the API ever fails — no error screen, just silent fallback.
bool useOfflineMode = false;

// These are set during the boot selection screens and are held
// for the entire session (the child picks once per power-on).
const char* selectedAgeGroup = "8-10";   // overwritten by selectAgeGroup()
int         selectedLevel     = 1;        // overwritten by selectLevel()


// ── Question structure ────────────────────────────────────────
// Holds one question regardless of whether it came from the API
// or was generated locally by the offline arithmetic engine.
struct Question {
  String questionText;
  String options[4];      // answer choices (always exactly 4)
  int    correctIndex;    // which option is correct (0–3)
  String questionId;      // UUID from the server; empty in offline mode
  String skill;           // addition / subtraction / multiplication / division
  int    level;           // 1–4
};

// Prefetch buffer — while the child reads and answers the current
// question, the next one downloads on core 0 so there is no delay.
Question     prefetchedQuestion;
bool         prefetchReady      = false;
TaskHandle_t prefetchTaskHandle = NULL;

// Question currently on screen (needed to build the submit-answer body).
Question      currentQuestion;
unsigned long questionStartMs = 0;


// ── Praise shown on correct answers ──────────────────────────
const char* PRAISE[]   = {
  "Good Work!", "Keep It Up!", "Awesome!",
  "Math Star!", "Brilliant!", "Super Smart!", "You Rock!"
};
const int PRAISE_COUNT = 7;


// =============================================================
//  SETUP — runs once on power-on
// =============================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== STEMPet booting ===");

  // Buttons: LOW = pressed (ESP32 internal pull-up resistor holds HIGH).
  pinMode(BUTTON_A_PIN, INPUT_PULLUP);
  pinMode(BUTTON_B_PIN, INPUT_PULLUP);
  pinMode(BUTTON_C_PIN, INPUT_PULLUP);
  pinMode(BUTTON_D_PIN, INPUT_PULLUP);

  if (BUZZER_PIN >= 0) {
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
  }

  randomSeed(analogRead(34));   // analogue noise on GPIO 34 for a random seed

  // Start the TFT display.
  tft.begin();
  tft.setRotation(1);           // landscape (320 wide × 240 tall)
  tft.fillScreen(ILI9341_BLACK);

  // Show welcome screen, wait for any button press.
  showWelcomeScreen();
  waitForStart();

  // Open the preferences namespace for offline level storage.
  prefs.begin("stempet", false);

  // Age-group and level selections happen BEFORE WiFi so they always run.
  selectAgeGroup();   // A = 6-8, B = 8-10, C = 10-12
  selectLevel();      // A = 1 Easy, B = 2 Medium, C = 3 Tricky, D = 4 Hard

  tryConnectWifi();
}


// =============================================================
//  MAIN LOOP — runs repeatedly
// =============================================================
void loop() {
  Question q;

  if (!useOfflineMode) {
    // ── ONLINE MODE ──────────────────────────────────────────
    if (prefetchReady) {
      // The background task already downloaded the next question.
      q = prefetchedQuestion;
      prefetchReady = false;
      Serial.println("[online] Using prefetched question");
    } else {
      showMessage("Loading...", "");
      if (!fetchQuestion(q)) {
        Serial.println("[online] Fetch failed — switching to offline");
        useOfflineMode = true;
        q = generateOfflineQuestion();
      }
    }
  } else {
    // ── OFFLINE MODE ─────────────────────────────────────────
    q = generateOfflineQuestion();
  }

  currentQuestion = q;
  questionStartMs = millis();
  displayQuestion(q);

  // Launch prefetch on core 0 while the child reads the question.
  // The task stores the result in prefetchedQuestion for the next loop.
  if (!useOfflineMode && prefetchTaskHandle == NULL) {
    xTaskCreatePinnedToCore(
      prefetchTask,
      "prefetch",
      16384,   // bytes of stack (WiFiClientSecure + JSON doc need headroom)
      NULL,
      1,       // priority
      &prefetchTaskHandle,
      0        // core 0 — main loop runs on core 1
    );
  }

  int pressed = waitForButtonPress();
  unsigned long elapsed = millis() - questionStartMs;
  bool correct = (pressed == q.correctIndex);

  showFeedback(correct, q.options[q.correctIndex]);

  if (!useOfflineMode) {
    submitAnswer(q.questionId, pressed, correct, (int)elapsed);
  } else {
    updateOfflineLevel(q.skill, correct);
  }

  delay(1500);
}


// =============================================================
//  WELCOME SCREEN
// =============================================================
void showWelcomeScreen() {
  tft.fillScreen(ILI9341_BLACK);

  tft.setTextColor(ILI9341_CYAN);
  tft.setTextSize(3);
  tft.setCursor(40, 40);
  tft.println("HEY CHAMP!");

  delay(800);

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 100);
  tft.println("Let's start your");
  tft.setCursor(50, 130);
  tft.println("Maths Journey!");

  delay(1200);

  tft.setTextColor(ILI9341_YELLOW);
  tft.setCursor(30, 190);
  tft.println("Press Any Button");
}

// Waits until all buttons are released, then waits for one to be pressed.
void waitForStart() {
  const int pins[] = {BUTTON_A_PIN, BUTTON_B_PIN, BUTTON_C_PIN, BUTTON_D_PIN};

  bool anyDown = true;
  while (anyDown) {
    anyDown = false;
    for (int i = 0; i < 4; i++) if (digitalRead(pins[i]) == LOW) anyDown = true;
    delay(10);
  }

  while (true) {
    for (int i = 0; i < 4; i++) {
      if (digitalRead(pins[i]) == LOW) {
        delay(50);
        if (digitalRead(pins[i]) == LOW) return;
      }
    }
    delay(10);
  }
}


// =============================================================
//  AGE-GROUP SELECTION (boot screen 1)
// =============================================================
// Blue screen with three choices — stores the result in selectedAgeGroup.
void selectAgeGroup() {
  tft.fillScreen(ILI9341_BLUE);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(40, 20);
  tft.println("Choose Age:");

  tft.setTextSize(2);
  tft.setCursor(60, 80);  tft.println("A: Ages  6-8");
  tft.setCursor(60, 120); tft.println("B: Ages 8-10");
  tft.setCursor(60, 160); tft.println("C: Ages 10-12");

  Serial.println("[age] Waiting for selection...");

  const int pins[] = {BUTTON_A_PIN, BUTTON_B_PIN, BUTTON_C_PIN, BUTTON_D_PIN};

  // Clear any buttons held from the welcome screen.
  bool anyDown = true;
  while (anyDown) {
    anyDown = false;
    for (int i = 0; i < 4; i++) if (digitalRead(pins[i]) == LOW) anyDown = true;
    delay(10);
  }

  // Only A, B, C are valid here (D is not an option).
  while (true) {
    for (int i = 0; i < 3; i++) {
      if (digitalRead(pins[i]) == LOW) {
        delay(50);
        if (digitalRead(pins[i]) == LOW) {
          switch (i) {
            case 0: selectedAgeGroup = "6-8";   break;
            case 1: selectedAgeGroup = "8-10";  break;
            case 2: selectedAgeGroup = "10-12"; break;
          }
          Serial.print("[age] Selected: ");
          Serial.println(selectedAgeGroup);

          // Brief confirmation screen.
          tft.fillScreen(ILI9341_BLUE);
          tft.setTextColor(ILI9341_WHITE);
          tft.setTextSize(2);
          tft.setCursor(20, 80);
          tft.println("Age group set:");
          tft.setTextSize(3);
          tft.setCursor(80, 130);
          tft.println(selectedAgeGroup);
          delay(1000);
          return;
        }
      }
    }
    delay(10);
  }
}


// =============================================================
//  LEVEL SELECTION (boot screen 2)
// =============================================================
// Green screen with four choices — stores the result in selectedLevel (1–4).
void selectLevel() {
  tft.fillScreen(ILI9341_DARKGREEN);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(40, 20);
  tft.println("Pick Level:");

  tft.setTextSize(2);
  tft.setCursor(60, 70);  tft.println("A: Level 1 (Easy)");
  tft.setCursor(60, 100); tft.println("B: Level 2 (Medium)");
  tft.setCursor(60, 130); tft.println("C: Level 3 (Tricky)");
  tft.setCursor(60, 160); tft.println("D: Level 4 (Hard)");

  Serial.println("[level] Waiting for selection...");

  const int pins[] = {BUTTON_A_PIN, BUTTON_B_PIN, BUTTON_C_PIN, BUTTON_D_PIN};

  bool anyDown = true;
  while (anyDown) {
    anyDown = false;
    for (int i = 0; i < 4; i++) if (digitalRead(pins[i]) == LOW) anyDown = true;
    delay(10);
  }

  // All four buttons are valid (A=1, B=2, C=3, D=4).
  while (true) {
    for (int i = 0; i < 4; i++) {
      if (digitalRead(pins[i]) == LOW) {
        delay(50);
        if (digitalRead(pins[i]) == LOW) {
          selectedLevel = i + 1;
          Serial.print("[level] Selected: ");
          Serial.println(selectedLevel);

          // Brief confirmation screen.
          tft.fillScreen(ILI9341_DARKGREEN);
          tft.setTextColor(ILI9341_WHITE);
          tft.setTextSize(2);
          tft.setCursor(20, 80);
          tft.println("Level set to:");
          tft.setTextSize(4);
          tft.setCursor(140, 130);
          tft.println(selectedLevel);
          delay(1000);
          return;
        }
      }
    }
    delay(10);
  }
}


// =============================================================
//  WiFi
// =============================================================
void tryConnectWifi() {
  showMessage("Connecting...", WIFI_SSID);
  Serial.print("[wifi] Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_TIMEOUT_MS) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[wifi] Connected — IP: ");
    Serial.println(WiFi.localIP());
    showMessage("Connected!", WiFi.localIP().toString());
    delay(800);
  } else {
    Serial.println("[wifi] No WiFi — offline mode");
    useOfflineMode = true;
    showMessage("Offline Mode", "No WiFi found");
    delay(1200);
  }
}


// =============================================================
//  ONLINE MODE — API calls
// =============================================================

// Fetches one question from the STEMPet server and fills q.
// Returns true on success, false if anything goes wrong.
bool fetchQuestion(Question& q) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[fetch] WiFi lost");
    return false;
  }

  // The API needs device identity, the age band, and the chosen level.
  String url = String(API_BASE_URL)
    + "/api/next-question?device_code=" + DEVICE_CODE
    + "&age_group=" + selectedAgeGroup
    + "&level="     + String(selectedLevel);

  Serial.print("[fetch] GET ");
  Serial.println(url);

  // setInsecure() disables TLS certificate pinning.
  // This is intentional for a demo/portfolio build — the tradeoff is
  // documented in WHY_NOTES.md.  A production build would pin the cert.
  WiFiClientSecure secureClient;
  secureClient.setInsecure();

  HTTPClient http;
  http.begin(secureClient, url);
  http.setTimeout(HTTP_TIMEOUT_MS);

  int httpCode = http.GET();
  Serial.print("[fetch] HTTP status: ");
  Serial.println(httpCode);

  if (httpCode != 200) {
    http.end();
    return false;
  }

  String payload = http.getString();
  http.end();

  StaticJsonDocument<1024> doc;
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.print("[fetch] JSON error: ");
    Serial.println(err.c_str());
    return false;
  }

  q.questionId   = doc["question_id"].as<String>();
  q.questionText = doc["question_text"].as<String>();
  q.correctIndex = doc["correct_index"].as<int>();
  q.skill        = doc["skill"].as<String>();
  q.level        = doc["level"].as<int>();

  JsonArray opts = doc["options"].as<JsonArray>();
  if (opts.size() < 4) {
    Serial.println("[fetch] Fewer than 4 options");
    return false;
  }
  for (int i = 0; i < 4; i++) q.options[i] = opts[i].as<String>();

  Serial.print("[fetch] Got: ");
  Serial.println(q.questionText);
  return true;
}

// Logs the child's answer to the server.
// Fire-and-forget — a failed POST is silently ignored so the toy
// never stalls waiting on the network after the child has answered.
void submitAnswer(String questionId, int selectedIndex, bool isCorrect, int timeMs) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure secureClient;
  secureClient.setInsecure();

  HTTPClient http;
  http.begin(secureClient, String(API_BASE_URL) + "/api/submit-answer");
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["device_code"]    = DEVICE_CODE;
  doc["question_id"]    = questionId;
  doc["selected_index"] = selectedIndex;
  doc["is_correct"]     = isCorrect;
  doc["time_ms"]        = timeMs;
  doc["age_group"]      = selectedAgeGroup;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.print("[submit] POST status: ");
  Serial.println(code);
  http.end();
}

// FreeRTOS task pinned to core 0.
// Downloads the next question silently while the child reads the current one.
// When done, sets prefetchReady = true so the main loop picks it up instantly.
void prefetchTask(void* param) {
  Question q;
  if (fetchQuestion(q)) {
    prefetchedQuestion = q;
    prefetchReady      = true;
    Serial.println("[prefetch] Ready");
  } else {
    Serial.println("[prefetch] Failed — will fetch inline next round");
  }
  prefetchTaskHandle = NULL;
  vTaskDelete(NULL);
}


// =============================================================
//  OFFLINE MODE — built-in arithmetic question generator
// =============================================================
// This is the "always works" fallback.  Level progress is stored
// in flash so the toy remembers where it left off after power-off.

Question generateOfflineQuestion() {
  int offlineLevel = prefs.getInt("off_level", 1);

  Question q;
  q.questionId = "";
  q.skill      = getOfflineSkill(offlineLevel);
  q.level      = getOfflineLevel(offlineLevel);

  int a      = randomNumber(q.skill, q.level, true);
  int b      = randomNumber(q.skill, q.level, false);
  int answer = 0;

  if (q.skill == "addition") {
    q.questionText = String(a) + " + " + String(b) + " = ?";
    answer = a + b;
  } else if (q.skill == "subtraction") {
    if (b > a) { int tmp = a; a = b; b = tmp; }  // keep result positive
    q.questionText = String(a) + " - " + String(b) + " = ?";
    answer = a - b;
  } else if (q.skill == "multiplication") {
    q.questionText = String(a) + " x " + String(b) + " = ?";
    answer = a * b;
  } else {
    // Division: ensure a clean integer result.
    b       = max(2, b % 9 + 2);
    int quo = max(1, a % 9 + 1);
    a       = b * quo;
    q.questionText = String(a) + " / " + String(b) + " = ?";
    answer = quo;
  }

  // Place the correct answer at a random slot and fill the rest with
  // nearby distractors that are unique and non-negative.
  q.correctIndex = random(4);
  int used[4]    = {-1, -1, -1, -1};
  used[q.correctIndex]      = answer;
  q.options[q.correctIndex] = String(answer);

  int offset = 1;
  for (int i = 0; i < 4; i++) {
    if (i == q.correctIndex) continue;
    int distractor;
    do {
      int sign = (random(2) == 0) ? 1 : -1;
      distractor = answer + sign * offset;
      offset++;
    } while (distractor == answer || distractor < 0 || isUsed(used, distractor));
    used[i]      = distractor;
    q.options[i] = String(distractor);
  }

  return q;
}

bool isUsed(int used[], int val) {
  for (int i = 0; i < 4; i++) if (used[i] == val) return true;
  return false;
}

// Offline level 1–16 maps to skill + within-skill level:
//   1–4  = addition  L1–L4
//   5–8  = subtraction L1–L4
//   9–12 = multiplication L1–L4
//   13–16 = division L1–L4
String getOfflineSkill(int gl) {
  const String skills[] = {"addition", "subtraction", "multiplication", "division"};
  return skills[min((gl - 1) / 4, 3)];
}

int getOfflineLevel(int gl) {
  return ((gl - 1) % 4) + 1;
}

int randomNumber(String skill, int level, bool isFirst) {
  int lo, hi;
  if      (level == 1) { lo = 1;  hi = 10;  }
  else if (level == 2) { lo = 5;  hi = 20;  }
  else if (level == 3) { lo = 10; hi = 50;  }
  else                 { lo = 20; hi = 100; }
  return random(lo, hi + 1);
}

// Tracks a rolling window of the last 10 answers and adjusts the
// offline global level up or down based on accuracy.
void updateOfflineLevel(String skill, bool wasCorrect) {
  uint16_t history = prefs.getUInt("off_hist", 0);
  int count        = prefs.getInt("off_cnt", 0);

  history = ((history << 1) | (wasCorrect ? 1 : 0)) & 0x3FF;
  count++;
  prefs.putUInt("off_hist", history);
  prefs.putInt("off_cnt", count);

  if (count < 10) return;   // need 10 answers before adjusting

  int correct     = __builtin_popcount(history);
  int globalLevel = prefs.getInt("off_level", 1);

  if (correct >= 8) {
    globalLevel = min(globalLevel + 1, 16);
    Serial.println("[offline] Level up → " + String(globalLevel));
    showMessage("Level Up!", "Keep going!");
    delay(1500);
  } else if (correct <= 4) {
    globalLevel = max(globalLevel - 1, 1);
    Serial.println("[offline] Level down → " + String(globalLevel));
  }

  prefs.putInt("off_level", globalLevel);
  prefs.putInt("off_cnt", 0);
  prefs.putUInt("off_hist", 0);
}


// =============================================================
//  DISPLAY HELPERS
// =============================================================

// Generic two-line status screen (black background).
void showMessage(const String& title, const String& subtitle) {
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 60);
  tft.println(title);
  if (subtitle.length() > 0) {
    tft.setTextSize(1);
    tft.setCursor(20, 110);
    tft.println(subtitle);
  }
}

// Renders the full question screen:
//   • Skill + level badge top-left
//   • Question text (wraps at 26 chars if needed)
//   • Horizontal divider
//   • 2×2 grid of A/B/C/D options
//   • DEVICE_CODE bottom-right corner
void displayQuestion(const Question& q) {
  tft.fillScreen(ILI9341_BLACK);

  // ── Skill + level badge ──────────────────────────────────
  tft.setTextColor(ILI9341_CYAN);
  tft.setTextSize(1);
  tft.setCursor(0, 0);
  tft.print(q.skill);
  tft.print("  Lv ");
  tft.print(q.level);

  // ── Question text ────────────────────────────────────────
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(0, 14);
  // At textSize 2 each char is 12px wide → 26 chars fit in 320px.
  String qText = q.questionText;
  if (qText.length() > 26) {
    int breakAt = qText.lastIndexOf(' ', 26);
    if (breakAt < 0) breakAt = 26;
    tft.println(qText.substring(0, breakAt));
    // Second line — truncate with ellipsis if still too long.
    String rest = qText.substring(breakAt + 1);
    if (rest.length() > 26) rest = rest.substring(0, 25) + "~";
    tft.println(rest);
  } else {
    tft.println(qText);
  }

  // ── Horizontal divider ───────────────────────────────────
  tft.drawLine(0, 68, 320, 68, ILI9341_WHITE);

  // ── Answer options — 2×2 grid ────────────────────────────
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  const char labels[] = {'A', 'B', 'C', 'D'};
  const int  xs[]     = {10, 170, 10, 170};
  const int  ys[]     = {82, 82, 148, 148};

  for (int i = 0; i < 4; i++) {
    tft.setCursor(xs[i], ys[i]);
    tft.print(labels[i]);
    tft.print(": ");
    String opt = q.options[i];
    if (opt.length() > 10) opt = opt.substring(0, 9) + "~";  // guard overflow
    tft.print(opt);
  }

  // ── DEVICE_CODE — bottom-right (tiny, subtle) ────────────
  tft.setTextColor(ILI9341_DARKGREY);
  tft.setTextSize(1);
  int codeLen = strlen(DEVICE_CODE);
  tft.setCursor(319 - codeLen * 6, 231);
  tft.print(DEVICE_CODE);
}

// Full-screen feedback after the child answers.
// Correct = green screen with :) and a random praise message.
// Wrong   = red screen with :( and the correct answer revealed.
void showFeedback(bool correct, const String& correctAnswer) {
  if (correct) {
    tft.fillScreen(ILI9341_GREEN);
    tft.setTextColor(ILI9341_WHITE);
    tft.setTextSize(4);
    tft.setCursor(120, 50);
    tft.println(":)");
    tft.setTextSize(2);
    tft.setCursor(60, 140);
    tft.println(PRAISE[random(PRAISE_COUNT)]);
    beep(880, 200);
  } else {
    tft.fillScreen(ILI9341_RED);
    tft.setTextColor(ILI9341_WHITE);
    tft.setTextSize(4);
    tft.setCursor(120, 50);
    tft.println(":(");
    tft.setTextSize(2);
    tft.setCursor(30, 140);
    tft.print("Answer: ");
    tft.println(correctAnswer);
    beep(440, 400);
  }
}


// =============================================================
//  BUTTON INPUT
// =============================================================
// Blocks until exactly one of the four buttons is pressed.
// Returns the button index: 0 = A, 1 = B, 2 = C, 3 = D.
int waitForButtonPress() {
  const int pins[] = {BUTTON_A_PIN, BUTTON_B_PIN, BUTTON_C_PIN, BUTTON_D_PIN};

  // Wait for any currently-pressed buttons to release.
  bool anyDown = true;
  while (anyDown) {
    anyDown = false;
    for (int i = 0; i < 4; i++) if (digitalRead(pins[i]) == LOW) anyDown = true;
    delay(10);
  }

  // Wait for a fresh press.
  while (true) {
    for (int i = 0; i < 4; i++) {
      if (digitalRead(pins[i]) == LOW) {
        delay(50);   // debounce
        if (digitalRead(pins[i]) == LOW) {
          Serial.print("[button] Pressed: ");
          Serial.println(i);
          return i;
        }
      }
    }
    delay(10);
  }
}


// =============================================================
//  BUZZER
// =============================================================
void beep(int freq, int dur) {
  if (BUZZER_PIN < 0) return;
  tone(BUZZER_PIN, freq, dur);
  delay(dur + 50);
  noTone(BUZZER_PIN);
}
