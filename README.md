# WHOOP 4.0 // 1:1 Functional Web & Mobile App (Offline BLE)

A pixel-perfect, 1:1 functional clone of the official **WHOOP 4.0 iOS mobile app** engineered using **React, Vite, TypeScript, Tailwind CSS, Lucide Icons, and Recharts**. It connects directly to a physical **WHOOP 4.0 strap via the Web Bluetooth API** (`navigator.bluetooth`) with **zero cloud dependencies and 100% free offline local analytics**.

---

## 🌐 Live Deployments & Repository

- **Official Live Production (Vercel):** [https://whoop-4-app.vercel.app/](https://whoop-4-app.vercel.app/)
- **Backup Mirror (GitHub Pages):** [https://abod6911.github.io/whoop-4-app/](https://abod6911.github.io/whoop-4-app/)
- **Official GitHub Repository:** [https://github.com/abod6911/whoop-4-app](https://github.com/abod6911/whoop-4-app)
- **Local Dev Server:** `http://localhost:5173/`

---

## 📱 Exact 1:1 WHOOP 4.0 Visual Identity & Screens

### 1. Visual System & Typography
- **Pure OLED Black `#000000`** backdrop with Deep Charcoal cards (`#12151A` / `#181C23`) and `#262B35` borders.
- **Official WHOOP Colors:**
  - Strain Blue: `#0093E9` to `#00B4D8`
  - Recovery Green: `#16EC06` (67–100%)
  - Recovery Yellow: `#FFDE00` (34–66%)
  - Recovery Red: `#FF0026` (1–33%)
  - Sleep Steel Blue: `#7395B7`
- **Iconic WHOOP Geometric Wordmark & Circular "W" Emblem** (`src/components/WhoopLogo.tsx`), configured as PWA Favicon and iOS Home Screen Icon with full iOS status bar translucency and safe-area insets.

### 2. App Structure & Screens
- **Top WHOOP Status Bar:**
  - User avatar circle + streak counter (`🔥 14 DAYS`).
  - `< TODAY >` date carousel pill.
  - WHOOP 4.0 Strap Status Pill: Beating HR pulse with live BPM, battery % icon, and 1-tap BLE pairing / Simulator toggle.
  - Sub-Tabs: `OVERVIEW` | `STRAIN` | `RECOVERY` | `SLEEP`.
- **View 1: OVERVIEW (Home)**
  - Signature WHOOP **Triple Gauge Header**: Central large **Day Strain (`0.0 - 21.0`)** with optimal target arc, flanked by **Recovery (`0 - 100%`)** and **Sleep (`0 - 100%`)**.
  - **WHOOP Health Monitor (`5/5 Metrics Within Range`)**: Respiratory Rate, Blood Oxygen (SpO2), Resting Heart Rate, HRV, and Skin Temperature.
  - Key Statistics range bars comparing today's HRV, RHR, and Calories vs. 30-day baseline gray bands.
- **View 2: STRAIN (Strain Coach & Workout Tracker)**
  - Large Day Strain ring with optimal strain target bracket based on today's Recovery.
  - Live Strain Coach workout recorder (Running, Weightlifting, Cycling, HIIT, Functional Fitness).
  - Rest + Zones 1 to 5 horizontal stacked percentage distribution bars.
- **View 3: RECOVERY (Autonomic Nervous System & Readiness)**
  - Dynamic Recovery Ring (`#16EC06`, `#FFDE00`, or `#FF0026`).
  - HRV (RMSSD in ms) and Resting Heart Rate (bpm) 7-day trend bar charts.
  - **"Measure Morning Recovery (3-Min HRV Test)"** guided resonant breathing assessment.
- **View 4: SLEEP (Sleep Stages & iPhone OLED Night Lock)**
  - Sleep Need vs Sleep Performance circular gauge.
  - Sleep stages breakdown: Awake (8%), REM (24%), Light (46%), SWS Deep (22%).
  - **"Start Sleep + OLED Night Lock"**: Activates `navigator.wakeLock` and presents a 99% pitch-black OLED dim clock to preserve battery and maintain BLE connectivity overnight.
- **Bottom Navigation (5 Tabs):**
  - `Home` • `Coaching` • Center Glowing `+` Button • `Strap / Lab` • `More`

---

## 🔬 Real WHOOP 4.0 BLE Engine & Math

- **Strict `0x2A37` Bluetooth SIG Byte Parsing:**
  - `flags = data.getUint8(0)`
  - Extracts UINT8/UINT16 HR format.
  - Extracts all UINT16 RR-intervals:
    $$\text{RR (ms)} = \left(\frac{\text{raw\_rr}}{1024.0}\right) \times 1000.0$$
- **Local Formulas:**
  - **HRV (RMSSD):** Rolling root-mean-square of successive differences (filtered 300ms–2000ms).
  - **Strain (0.0 – 21.0):** Edwards TRIMP logarithmic saturation: $\text{Strain} = 21 \times (1 - e^{-\text{TRIMP} / 70})$.
  - **Recovery (1 – 100%):** Weighted comparison ($70\%$ HRV, $20\%$ RHR, $10\%$ Sleep) against 7-day rolling baselines.
- **Built-in Simulator:** Authentic Respiratory Sinus Arrhythmia (RSA) generator streaming realistic HR oscillations and battery state.
