// =============================================================
//  STEMPet Firmware  —  ESP32
//
//  What this file does:
//    1. Tries to join WiFi on boot.
//    2. In ONLINE MODE: fetches questions from the server API,
//       shows them on the OLED, reads a button press, and logs
//       the result back to the server.  Prefetches the next
//       question in the background so there's no visible delay.
//    3. If WiFi or the API ever fails, it falls back silently to
//       OFFLINE MODE — a built-in arithmetic generator that works
//       entirely without the internet, just like the original toy.
//
//  How to flash:
//    • Open this file in Arduino IDE.
//    • Fill in the config block below (WiFi name, password, API URL,
//      device code).
//    • Install the required libraries (see "Libraries" section).
//    • Select your ESP32 board and click Upload.
//
//  Required Arduino libraries (install via Library Manager):
//    • Adafruit SSD1306   (OLED display driver)
//    • Adafruit GFX       (graphics primitives, needed by SSD1306)
//    • ArduinoJson        (parse the JSON from the API)
//    • WiFi               (built-in on ESP32)
//    • HTTPClient         (built-in on ESP32)
// =============================================================


// =============================================================
//  ★ CONFIGURATION — fill these in before flashing ★
// =============================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_BASE_URL  = "https://YOUR-PROJECT.vercel.app";
const char* DEVICE_CODE   = "YOUR_DEVICE_CODE";  // e.g. "DEMO01"

// How long to wait for WiFi on boot before giving up and going offline.
const int WIFI_TIMEOUT_MS = 8000;

// How long to wait for an API response before giving up.
const int HTTP_TIMEOUT_MS = 5000;

// OLED display dimensions (standard 128×64 module).
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64

// I²C address for the OLED (most modules use 0x3C).
#define OLED_I2C_ADDR 0x3C

// Button GPIO pins — 4 physical buttons, one per answer choice.
// Change these to match your wiring.
const int BUTTON_A_PIN = 12;   // Answer option 0
const int BUTTON_B_PIN = 13;   // Answer option 1
const int BUTTON_C_PIN = 14;   // Answer option 2
const int BUTTON_D_PIN = 27;   // Answer option 3

// Buzzer pin (optional — set to -1 to disable).
const int BUZZER_PIN = 26;
// =============================================================


// ── Standard library includes ──────────────────────────────
#include <WiFi.h>
#include <HTTPClient.h>
#include <Preferences.h>     // Non-volatile storage (replaces EEPROM on ESP32)
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>


// ── Globals ────────────────────────────────────────────────

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Preferences prefs;   // Persists offline level so the toy "remembers" progress.

// The toy operates in one of two modes.  It starts in online mode
// and switches to offline mode if anything goes wrong.
bool useOfflineMode = false;

// ── Represents one question (either from the API or generated locally) ──
struct Question {
  String questionText;
  String options[4];
  int    correctIndex;   // 0–3
  String questionId;     // only set in online mode (UUID from the server)
  String skill;          // "addition" / "subtraction" / "multiplication" / "division"
  int    level;          // 1–4
};

// Prefetch buffer: when the child is reading the current question,
// we already start downloading the next one in the background.
Question prefetchedQuestion;
bool prefetchReady = false;
TaskHandle_t prefetchTaskHandle = NULL;

// Tracks the current question being answered (used to log the attempt).
Question currentQuestion;
unsigned long questionStartMs = 0;   // when we showed the question (for time_ms)


// =============================================================
//  SETUP — runs once on boot
// =============================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== STEMPet booting ===");

  // Set up button pins with internal pull-ups.
  // The buttons connect the pin to GND when pressed.
  pinMode(BUTTON_A_PIN, INPUT_PULLUP);
  pinMode(BUTTON_B_PIN, INPUT_PULLUP);
  pinMode(BUTTON_C_PIN, INPUT_PULLUP);
  pinMode(BUTTON_D_PIN, INPUT_PULLUP);

  if (BUZZER_PIN >= 0) {
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
  }

  // Start the OLED display.
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR)) {
    Serial.println("OLED init failed — check wiring");
    // We can still run without a display (serial output only),
    // but the toy won't be usable for a child.
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  showMessage("STEMPet", "Starting...");
  delay(500);

  // Open the preferences namespace to read/write the offline level tracker.
  prefs.begin("stempet", false);

  // Try to connect to WiFi.
  tryConnectWifi();
}


// =============================================================
//  MAIN LOOP — runs repeatedly after setup
// =============================================================
void loop() {
  Question q;

  if (!useOfflineMode) {
    // ── ONLINE MODE ──────────────────────────────────────────
    // Use the prefetched question if it's ready; otherwise fetch now.
    if (prefetchReady) {
      q = prefetchedQuestion;
      prefetchReady = false;
      Serial.println("[online] Using prefetched question");
    } else {
      showMessage("Loading...", "");
      if (!fetchQuestion(q)) {
        // API failed — switch to offline for the rest of this session.
        Serial.println("[online] Fetch failed — switching to offline mode");
        useOfflineMode = true;
        q = generateOfflineQuestion();
      }
    }
  } else {
    // ── OFFLINE MODE ─────────────────────────────────────────
    q = generateOfflineQuestion();
  }

  // Show the question and wait for the child to press a button.
  currentQuestion = q;
  questionStartMs = millis();
  displayQuestion(q);

  // Start fetching the NEXT question in the background
  // while the child reads the current one.
  if (!useOfflineMode && prefetchTaskHandle == NULL) {
    xTaskCreatePinnedToCore(
      prefetchTask,
      "prefetch",
      8192,          // stack size (bytes)
      NULL,
      1,             // priority (lower than loop)
      &prefetchTaskHandle,
      0              // run on core 0; loop() runs on core 1
    );
  }

  int pressedButton = waitForButtonPress();
  unsigned long timeTakenMs = millis() - questionStartMs;

  bool correct = (pressedButton == q.correctIndex);

  showFeedback(correct, q.options[q.correctIndex]);

  if (!useOfflineMode) {
    // Log the result to the server (fire-and-forget; we don't wait for it).
    submitAnswer(q.questionId, pressedButton, correct, (int)timeTakenMs);
  } else {
    // In offline mode, update the local level tracker.
    updateOfflineLevel(q.skill, correct);
  }

  delay(1500);   // Brief pause so the child can read the feedback.
}


// =============================================================
//  WiFi
// =============================================================

// Tries to connect to WiFi once on boot with a timeout.
// If it fails, sets useOfflineMode = true.
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
    Serial.println("[wifi] Could not connect — starting in offline mode");
    useOfflineMode = true;
    showMessage("Offline Mode", "No WiFi found");
    delay(1200);
  }
}


// =============================================================
//  Online Mode — API calls
// =============================================================

// Fetches one question from the server API.
// Returns true on success, false on any error (network or JSON).
bool fetchQuestion(Question& q) {
  // Check WiFi is still up before attempting.
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[fetch] WiFi lost");
    return false;
  }

  String url = String(API_BASE_URL) + "/api/next-question?device_code=" + DEVICE_CODE;
  Serial.print("[fetch] GET ");
  Serial.println(url);

  HTTPClient http;
  // NOTE: WiFiClientInsecure (no cert pinning) is used here for simplicity.
  // In a production toy you'd pin the server's certificate.
  // See WHY_NOTES.md for the reasoning.
  http.begin(url);
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

  // Parse the JSON response.
  // Expected shape: { question_id, question_text, options:[4 strings],
  //                   correct_index, skill, level }
  StaticJsonDocument<1024> doc;
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.print("[fetch] JSON parse error: ");
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
    Serial.println("[fetch] Bad response — fewer than 4 options");
    return false;
  }
  for (int i = 0; i < 4; i++) {
    q.options[i] = opts[i].as<String>();
  }

  Serial.print("[fetch] Got question: ");
  Serial.println(q.questionText);
  return true;
}

// Sends the answer result to the server so it can be stored in the database.
// This is "fire-and-forget" — we don't block on the response.
void submitAnswer(String questionId, int selectedIndex, bool isCorrect, int timeMs) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/submit-answer";
  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("Content-Type", "application/json");

  // Build the JSON body.
  StaticJsonDocument<256> doc;
  doc["device_code"]     = DEVICE_CODE;
  doc["question_id"]     = questionId;
  doc["selected_index"]  = selectedIndex;
  doc["is_correct"]      = isCorrect;
  doc["time_ms"]         = timeMs;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.print("[submit] POST status: ");
  Serial.println(code);
  http.end();
}

// Background task that fetches the next question while the child reads the current one.
// Runs on core 0 to avoid blocking the display/button logic on core 1.
void prefetchTask(void* param) {
  Question q;
  bool ok = fetchQuestion(q);
  if (ok) {
    prefetchedQuestion = q;
    prefetchReady = true;
    Serial.println("[prefetch] Ready");
  } else {
    Serial.println("[prefetch] Failed — will fetch in foreground next round");
  }
  prefetchTaskHandle = NULL;
  vTaskDelete(NULL);  // Task must delete itself when done.
}


// =============================================================
//  Offline Mode — built-in arithmetic question generator
// =============================================================
// This is the "legacy" offline behavior that always works, even
// with no internet.  Questions get progressively harder based on
// a simple level counter stored in non-volatile memory.

// Returns a randomly-generated arithmetic question.
Question generateOfflineQuestion() {
  // Load the offline level from persistent storage (survives reboots).
  int offlineLevel = prefs.getInt("off_level", 1);
  String skill = getOfflineSkill(offlineLevel);
  int level = getOfflineLevel(offlineLevel);

  Question q;
  q.questionId   = "";  // no server ID in offline mode
  q.skill        = skill;
  q.level        = level;

  // Generate two numbers appropriate for the skill and level.
  int a = randomNumber(skill, level, true);
  int b = randomNumber(skill, level, false);
  int answer;

  if (skill == "addition") {
    q.questionText = String(a) + " + " + String(b) + " = ?";
    answer = a + b;
  } else if (skill == "subtraction") {
    // Make sure a >= b so we don't get negative answers.
    if (b > a) { int tmp = a; a = b; b = tmp; }
    q.questionText = String(a) + " - " + String(b) + " = ?";
    answer = a - b;
  } else if (skill == "multiplication") {
    q.questionText = String(a) + " × " + String(b) + " = ?";
    answer = a * b;
  } else {
    // Division: generate b first, then make a = b * quotient for exact division.
    b = max(2, b % 9 + 2);  // divisor 2–10
    int quotient = max(1, a % 9 + 1);
    a = b * quotient;
    q.questionText = String(a) + " ÷ " + String(b) + " = ?";
    answer = quotient;
  }

  // Build 4 answer choices: the correct one + 3 plausible distractors.
  q.correctIndex = random(4);
  int used[4] = {-1, -1, -1, -1};
  used[q.correctIndex] = answer;
  q.options[q.correctIndex] = String(answer);

  int offset = 1;
  for (int i = 0; i < 4; i++) {
    if (i == q.correctIndex) continue;
    int distractor;
    // Keep trying until we find a unique wrong answer.
    do {
      int sign = (random(2) == 0) ? 1 : -1;
      distractor = answer + sign * offset;
      offset++;
    } while (distractor == answer || distractor < 0 || isUsed(used, distractor));
    used[i] = distractor;
    q.options[i] = String(distractor);
  }

  return q;
}

// Returns true if 'val' is already in the 'used' array.
bool isUsed(int used[], int val) {
  for (int i = 0; i < 4; i++) {
    if (used[i] == val) return true;
  }
  return false;
}

// Maps a global offline level (1–16) to a skill name.
// Every 4 levels is one skill: 1-4 = addition, 5-8 = subtraction, etc.
String getOfflineSkill(int globalLevel) {
  int idx = (globalLevel - 1) / 4;
  String skills[] = {"addition", "subtraction", "multiplication", "division"};
  return skills[min(idx, 3)];
}

// Maps a global offline level to a within-skill level (1–4).
int getOfflineLevel(int globalLevel) {
  return ((globalLevel - 1) % 4) + 1;
}

// Generates a random number appropriate for the given skill and level.
// 'isFirst' distinguishes the two operands (useful for asymmetric ranges).
int randomNumber(String skill, int level, bool isFirst) {
  // Range grows with level.  These ranges are calibrated for age 8-10;
  // the server uses age_group for finer control in online mode.
  int lo, hi;
  if (level == 1) { lo = 1;  hi = 10;  }
  else if (level == 2) { lo = 5;  hi = 20;  }
  else if (level == 3) { lo = 10; hi = 50;  }
  else               { lo = 20; hi = 100; }

  return random(lo, hi + 1);
}

// Called after each offline question.  Tracks accuracy over 10 questions
// and advances the global level if accuracy is ≥ 80%, regresses if ≤ 40%.
void updateOfflineLevel(String skill, bool wasCorrect) {
  // We store a simple rolling window: a 10-bit integer where each bit
  // represents the result of the last 10 questions (1 = correct, 0 = wrong).
  uint16_t history = prefs.getUInt("off_hist", 0);
  int count = prefs.getInt("off_cnt", 0);

  // Shift left and add the new result.
  history = ((history << 1) | (wasCorrect ? 1 : 0)) & 0x3FF;  // keep 10 bits
  count++;
  prefs.putUInt("off_hist", history);
  prefs.putInt("off_cnt", count);

  // Only evaluate after 10 questions.
  if (count < 10) return;

  // Count correct bits.
  int correct = __builtin_popcount(history);
  int globalLevel = prefs.getInt("off_level", 1);

  if (correct >= 8) {
    // ≥ 80% correct → advance level (max 16).
    globalLevel = min(globalLevel + 1, 16);
    Serial.println("[offline] Level up → " + String(globalLevel));
    showMessage("Level Up!", "Keep going!");
    delay(1500);
  } else if (correct <= 4) {
    // ≤ 40% correct → drop level (min 1).
    globalLevel = max(globalLevel - 1, 1);
    Serial.println("[offline] Level down → " + String(globalLevel));
  }

  prefs.putInt("off_level", globalLevel);
  // Reset the counter so we evaluate again after the next 10.
  prefs.putInt("off_cnt", 0);
  prefs.putUInt("off_hist", 0);
}


// =============================================================
//  Display helpers
// =============================================================

// Shows a two-line message (title + subtitle) centered on the OLED.
void showMessage(const String& title, const String& subtitle) {
  display.clearDisplay();
  display.setTextSize(1);

  // Title in the upper third.
  display.setCursor(0, 10);
  display.println(title);

  // Subtitle below.
  if (subtitle.length() > 0) {
    display.setCursor(0, 30);
    display.println(subtitle);
  }

  display.display();
}

// Displays the full question with 4 labeled answer options (A/B/C/D).
void displayQuestion(const Question& q) {
  display.clearDisplay();
  display.setTextSize(1);

  // Question text (top half of screen).
  // Wrap long questions across 2 lines.
  display.setCursor(0, 0);
  String qText = q.questionText;
  if (qText.length() > 21) {
    // Find a space near the middle to break on.
    int breakAt = qText.lastIndexOf(' ', 21);
    if (breakAt < 0) breakAt = 21;
    display.println(qText.substring(0, breakAt));
    display.println(qText.substring(breakAt + 1));
  } else {
    display.println(qText);
  }

  // Divider line.
  display.drawLine(0, 22, SCREEN_WIDTH, 22, SSD1306_WHITE);

  // Answer options (bottom half — two per row).
  const char labels[] = {'A', 'B', 'C', 'D'};
  for (int i = 0; i < 4; i++) {
    int col = (i % 2 == 0) ? 0 : 64;
    int row = 26 + (i / 2) * 18;
    display.setCursor(col, row);
    display.print(labels[i]);
    display.print(": ");
    // Trim option text if too long for the column.
    String opt = q.options[i];
    if (opt.length() > 8) opt = opt.substring(0, 8);
    display.println(opt);
  }

  display.display();
}

// Shows "Correct! ✓" or "Wrong — the answer was X".
void showFeedback(bool correct, const String& correctAnswer) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 10);

  if (correct) {
    display.println("Correct!");
    display.setCursor(0, 30);
    display.println("Great job!");
    beep(880, 200);   // High beep = correct
  } else {
    display.println("Not quite!");
    display.setCursor(0, 28);
    display.print("Answer: ");
    display.println(correctAnswer);
    beep(440, 400);   // Lower beep = wrong
  }

  display.display();
}


// =============================================================
//  Button input
// =============================================================

// Blocks until one of the 4 buttons is pressed and returns its index (0–3).
// Debounces with a short delay.
int waitForButtonPress() {
  const int buttonPins[] = {BUTTON_A_PIN, BUTTON_B_PIN, BUTTON_C_PIN, BUTTON_D_PIN};

  // Wait for all buttons to be released first (avoids ghost presses).
  bool anyPressed = true;
  while (anyPressed) {
    anyPressed = false;
    for (int i = 0; i < 4; i++) {
      if (digitalRead(buttonPins[i]) == LOW) anyPressed = true;
    }
    delay(10);
  }

  // Now wait for a fresh press.
  while (true) {
    for (int i = 0; i < 4; i++) {
      if (digitalRead(buttonPins[i]) == LOW) {
        delay(50);  // debounce
        if (digitalRead(buttonPins[i]) == LOW) {
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
//  Buzzer
// =============================================================

// Plays a tone if a buzzer is wired up.  freq in Hz, dur in ms.
void beep(int freq, int dur) {
  if (BUZZER_PIN < 0) return;
  tone(BUZZER_PIN, freq, dur);
  delay(dur + 50);
  noTone(BUZZER_PIN);
}
