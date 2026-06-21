// =============================================================
//  STEMPet Firmware  —  ESP32
//
//  What this file does:
//    1. On boot, shows an AGE-GROUP SELECTION screen so the child
//       (or parent) picks the right difficulty band for this session.
//    2. Tries to join WiFi.
//    3. In ONLINE MODE: fetches questions from the server API
//       (always sending the chosen age_group), shows them on the
//       OLED, reads a button press, and logs the result back to the
//       server.  Prefetches the next question in the background so
//       there's no visible delay.
//    4. If WiFi or the API ever fails, it falls back silently to
//       OFFLINE MODE — a built-in arithmetic generator that works
//       entirely without the internet, just like the original toy.
//    5. The DEVICE_CODE is shown in the bottom-right corner of every
//       question screen so the parent can verify which toy it is.
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

// Age group chosen on boot — held for the entire session.
// The valid strings match the server exactly: "6-8", "8-10", "10-12".
const char* selectedAgeGroup = "8-10";   // default (overwritten by selectAgeGroup())

// Difficulty level chosen on boot — 1 (easy) to 4 (hard).
// Skills are always mixed; the level controls how big the numbers are.
int selectedLevel = 1;                   // default (overwritten by selectLevel())

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
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  showMessage("STEMPet", "Starting...");
  delay(500);

  // Open the preferences namespace to read/write the offline level tracker.
  prefs.begin("stempet", false);

  // ── Age-group + level selection (before WiFi so the child always picks) ──
  // Both values are sent with every API call.
  selectAgeGroup();
  selectLevel();

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
    if (prefetchReady) {
      q = prefetchedQuestion;
      prefetchReady = false;
      Serial.println("[online] Using prefetched question");
    } else {
      showMessage("Loading...", "");
      if (!fetchQuestion(q)) {
        Serial.println("[online] Fetch failed — switching to offline mode");
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

  // Start fetching the NEXT question in the background
  // while the child reads the current one.
  if (!useOfflineMode && prefetchTaskHandle == NULL) {
    xTaskCreatePinnedToCore(
      prefetchTask,
      "prefetch",
      8192,
      NULL,
      1,
      &prefetchTaskHandle,
      0
    );
  }

  int pressedButton = waitForButtonPress();
  unsigned long timeTakenMs = millis() - questionStartMs;

  bool correct = (pressedButton == q.correctIndex);

  showFeedback(correct, q.options[q.correctIndex]);

  if (!useOfflineMode) {
    submitAnswer(q.questionId, pressedButton, correct, (int)timeTakenMs);
  } else {
    updateOfflineLevel(q.skill, correct);
  }

  delay(1500);
}


// =============================================================
//  Age-group selection — runs once on boot before WiFi
// =============================================================

// Shows a menu on the OLED and waits for the child to press A, B, or C.
// Stores the result in selectedAgeGroup for the rest of the session.
void selectAgeGroup() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Who's playing?");
  display.println("");
  display.println("A: Ages 6-8");
  display.println("B: Ages 8-10");
  display.println("C: Ages 10-12");
  display.display();

  Serial.println("[age] Waiting for age-group selection...");

  const int buttonPins[] = {BUTTON_A_PIN, BUTTON_B_PIN, BUTTON_C_PIN, BUTTON_D_PIN};

  // Wait until all buttons are released (in case one is held on boot).
  bool anyPressed = true;
  while (anyPressed) {
    anyPressed = false;
    for (int i = 0; i < 4; i++) {
      if (digitalRead(buttonPins[i]) == LOW) anyPressed = true;
    }
    delay(10);
  }

  // Wait for a fresh press of A, B, or C (D is not an option here).
  while (true) {
    for (int i = 0; i < 3; i++) {
      if (digitalRead(buttonPins[i]) == LOW) {
        delay(50);  // debounce
        if (digitalRead(buttonPins[i]) == LOW) {
          switch (i) {
            case 0: selectedAgeGroup = "6-8";   break;
            case 1: selectedAgeGroup = "8-10";  break;
            case 2: selectedAgeGroup = "10-12"; break;
          }
          Serial.print("[age] Selected: ");
          Serial.println(selectedAgeGroup);

          // Confirm on screen.
          display.clearDisplay();
          display.setTextSize(1);
          display.setCursor(0, 20);
          display.println("Age group set:");
          display.setCursor(0, 36);
          display.setTextSize(2);
          display.println(selectedAgeGroup);
          display.display();
          delay(1000);
          return;
        }
      }
    }
    delay(10);
  }
}


// =============================================================
//  Level selection — runs once on boot after age-group selection
// =============================================================

// Shows four options (A–D = levels 1–4) and waits for a button press.
// Stores the result in selectedLevel for the rest of the session.
void selectLevel() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Select Level:");
  display.println("");
  display.println("A: Level 1 (Easy)");
  display.println("B: Level 2 (Medium)");
  display.println("C: Level 3 (Tricky)");
  display.println("D: Level 4 (Hard)");
  display.display();

  Serial.println("[level] Waiting for level selection...");

  const int buttonPins[] = {BUTTON_A_PIN, BUTTON_B_PIN, BUTTON_C_PIN, BUTTON_D_PIN};

  // Wait until all buttons are released before accepting a new press.
  bool anyPressed = true;
  while (anyPressed) {
    anyPressed = false;
    for (int i = 0; i < 4; i++) {
      if (digitalRead(buttonPins[i]) == LOW) anyPressed = true;
    }
    delay(10);
  }

  // All 4 buttons are valid here (unlike age selection which only uses A/B/C).
  while (true) {
    for (int i = 0; i < 4; i++) {
      if (digitalRead(buttonPins[i]) == LOW) {
        delay(50);   // debounce
        if (digitalRead(buttonPins[i]) == LOW) {
          selectedLevel = i + 1;   // A=1, B=2, C=3, D=4
          Serial.print("[level] Selected: ");
          Serial.println(selectedLevel);

          // Confirm on screen.
          display.clearDisplay();
          display.setTextSize(1);
          display.setCursor(0, 20);
          display.println("Level set to:");
          display.setCursor(0, 36);
          display.setTextSize(2);
          display.println(selectedLevel);
          display.display();
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
// Sends both device_code AND age_group so the server can choose the
// right difficulty for this session's age band.
bool fetchQuestion(Question& q) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[fetch] WiFi lost");
    return false;
  }

  // All three required query params: device identity, age band, and difficulty level.
  String url = String(API_BASE_URL)
    + "/api/next-question?device_code=" + DEVICE_CODE
    + "&age_group=" + selectedAgeGroup
    + "&level="     + String(selectedLevel);

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

// Sends the answer result to the server.
// age_group is included so the attempt is tagged with the session's band.
void submitAnswer(String questionId, int selectedIndex, bool isCorrect, int timeMs) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/submit-answer";
  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["device_code"]     = DEVICE_CODE;
  doc["question_id"]     = questionId;
  doc["selected_index"]  = selectedIndex;
  doc["is_correct"]      = isCorrect;
  doc["time_ms"]         = timeMs;
  doc["age_group"]       = selectedAgeGroup;   // ← new field

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.print("[submit] POST status: ");
  Serial.println(code);
  http.end();
}

// Background task that fetches the next question while the child reads the current one.
void prefetchTask(void* param) {
  Question q;
  bool ok = fetchQuestion(q);   // fetchQuestion already uses selectedAgeGroup
  if (ok) {
    prefetchedQuestion = q;
    prefetchReady = true;
    Serial.println("[prefetch] Ready");
  } else {
    Serial.println("[prefetch] Failed — will fetch in foreground next round");
  }
  prefetchTaskHandle = NULL;
  vTaskDelete(NULL);
}


// =============================================================
//  Offline Mode — built-in arithmetic question generator
// =============================================================
// This is the "legacy" offline behavior that always works, even
// with no internet.  Questions get progressively harder based on
// a simple level counter stored in non-volatile memory.

Question generateOfflineQuestion() {
  int offlineLevel = prefs.getInt("off_level", 1);
  String skill = getOfflineSkill(offlineLevel);
  int level = getOfflineLevel(offlineLevel);

  Question q;
  q.questionId   = "";
  q.skill        = skill;
  q.level        = level;

  int a = randomNumber(skill, level, true);
  int b = randomNumber(skill, level, false);
  int answer;

  if (skill == "addition") {
    q.questionText = String(a) + " + " + String(b) + " = ?";
    answer = a + b;
  } else if (skill == "subtraction") {
    if (b > a) { int tmp = a; a = b; b = tmp; }
    q.questionText = String(a) + " - " + String(b) + " = ?";
    answer = a - b;
  } else if (skill == "multiplication") {
    q.questionText = String(a) + " x " + String(b) + " = ?";
    answer = a * b;
  } else {
    b = max(2, b % 9 + 2);
    int quotient = max(1, a % 9 + 1);
    a = b * quotient;
    q.questionText = String(a) + " / " + String(b) + " = ?";
    answer = quotient;
  }

  q.correctIndex = random(4);
  int used[4] = {-1, -1, -1, -1};
  used[q.correctIndex] = answer;
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
    used[i] = distractor;
    q.options[i] = String(distractor);
  }

  return q;
}

bool isUsed(int used[], int val) {
  for (int i = 0; i < 4; i++) {
    if (used[i] == val) return true;
  }
  return false;
}

String getOfflineSkill(int globalLevel) {
  int idx = (globalLevel - 1) / 4;
  String skills[] = {"addition", "subtraction", "multiplication", "division"};
  return skills[min(idx, 3)];
}

int getOfflineLevel(int globalLevel) {
  return ((globalLevel - 1) % 4) + 1;
}

int randomNumber(String skill, int level, bool isFirst) {
  int lo, hi;
  if (level == 1) { lo = 1;  hi = 10;  }
  else if (level == 2) { lo = 5;  hi = 20;  }
  else if (level == 3) { lo = 10; hi = 50;  }
  else               { lo = 20; hi = 100; }

  return random(lo, hi + 1);
}

void updateOfflineLevel(String skill, bool wasCorrect) {
  uint16_t history = prefs.getUInt("off_hist", 0);
  int count = prefs.getInt("off_cnt", 0);

  history = ((history << 1) | (wasCorrect ? 1 : 0)) & 0x3FF;
  count++;
  prefs.putUInt("off_hist", history);
  prefs.putInt("off_cnt", count);

  if (count < 10) return;

  int correct = __builtin_popcount(history);
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
//  Display helpers
// =============================================================

void showMessage(const String& title, const String& subtitle) {
  display.clearDisplay();
  display.setTextSize(1);

  display.setCursor(0, 10);
  display.println(title);

  if (subtitle.length() > 0) {
    display.setCursor(0, 30);
    display.println(subtitle);
  }

  display.display();
}

// Displays the full question with 4 labeled answer options (A/B/C/D).
// The DEVICE_CODE is shown in the bottom-right corner so the parent can
// confirm which toy they're looking at.
void displayQuestion(const Question& q) {
  display.clearDisplay();
  display.setTextSize(1);

  // Question text (top portion of screen).
  display.setCursor(0, 0);
  String qText = q.questionText;
  if (qText.length() > 21) {
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
    String opt = q.options[i];
    if (opt.length() > 8) opt = opt.substring(0, 8);
    display.println(opt);
  }

  // DEVICE_CODE in the bottom-right corner (size 1 = 6px wide per char).
  // This lets the parent verify which toy is active at a glance.
  int codeLen = strlen(DEVICE_CODE);
  display.setCursor(SCREEN_WIDTH - codeLen * 6, 56);
  display.print(DEVICE_CODE);

  display.display();
}

void showFeedback(bool correct, const String& correctAnswer) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 10);

  if (correct) {
    display.println("Correct!");
    display.setCursor(0, 30);
    display.println("Great job!");
    beep(880, 200);
  } else {
    display.println("Not quite!");
    display.setCursor(0, 28);
    display.print("Answer: ");
    display.println(correctAnswer);
    beep(440, 400);
  }

  display.display();
}


// =============================================================
//  Button input
// =============================================================

int waitForButtonPress() {
  const int buttonPins[] = {BUTTON_A_PIN, BUTTON_B_PIN, BUTTON_C_PIN, BUTTON_D_PIN};

  bool anyPressed = true;
  while (anyPressed) {
    anyPressed = false;
    for (int i = 0; i < 4; i++) {
      if (digitalRead(buttonPins[i]) == LOW) anyPressed = true;
    }
    delay(10);
  }

  while (true) {
    for (int i = 0; i < 4; i++) {
      if (digitalRead(buttonPins[i]) == LOW) {
        delay(50);
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

void beep(int freq, int dur) {
  if (BUZZER_PIN < 0) return;
  tone(BUZZER_PIN, freq, dur);
  delay(dur + 50);
  noTone(BUZZER_PIN);
}
