# WHOOP 4.0 Pulse — Offline-First BLE Athletic Dashboard

A production-ready, offline-first web application engineered in **React, TypeScript, Tailwind CSS, Lucide Icons, and Recharts** designed to connect directly to a **Whoop 4.0** strap via the **Web Bluetooth API** (`navigator.bluetooth`) without requiring a Whoop subscription or external cloud servers.

---

## ⚡ Key Highlights & Architecture

- **Direct Web Bluetooth Connection:** Connects over BLE directly from Chrome, Edge, or Opera on Windows, macOS, Linux, and Android.
- **Zero Cloud Dependence:** All algorithmic computations (Strain, Recovery, RMSSD, Caloric Burn, Heart Rate Zones) execute 100% locally in browser memory.
- **Offline Storage:** IndexedDB (`WhoopPulseLocalDB`) and `localStorage` preserve session histories, 7-day rolling baselines, biometrics, and raw GATT sniffer packets without any internet connection.
- **Whoop-Inspired UI:** High-contrast athletic dark aesthetic (`#0B0E14` background, neon cyan `#00F0FF`, emerald `#00E676`, amber `#FFB300`, and crimson `#FF3366`).
- **Built-in Realistic Simulator:** Includes an embedded Whoop 4.0 simulator generating authentic respiratory sinus arrhythmia (RSA) and workout/sleep curves so all features can be tested immediately even without wearing the physical strap.

---

## 🔬 BLE Connection & Parsing Specifications

### 1. Standard BLE Services
- **Heart Rate Service (`0x180D`) & Measurement (`0x2A37`):**
  - Subscribes via `startNotifications()`.
  - **Strict Bluetooth SIG Spec Byte Parsing:**
    - Flags: `flags = data.getUint8(0)`
    - Bit 0 (`flags & 0x01`): `0` = UINT8 HR, `1` = UINT16 HR.
    - Bit 1 & 2 (`flags & 0x06`): Sensor contact detection status.
    - Bit 3 (`flags & 0x08`): Energy expended presence.
    - **Bit 4 (`flags & 0x10`): RR-Interval presence (Critical for HRV).**
      - Extracted in little-endian UINT16 chunks.
      - Converted strictly using Bluetooth SIG timing resolution ($1/1024$ second):
        $$\text{RR (ms)} = \left(\frac{\text{raw\_rr}}{1024.0}\right) \times 1000.0$$
- **Battery Service (`0x180F`) -> Characteristic (`0x2A19`):**
  - Reads and subscribes to battery percentage.
- **Device Information Service (`0x180A`):**
  - Reads Firmware Revision (`0x2A26`), Hardware Revision (`0x2A27`), Serial Number (`0x2A25`), and Manufacturer Name (`0x2A29`).

### 2. Whoop 4.0 Proprietary / Custom GATT Lab Mode
- Registers proprietary 128-bit UUIDs in `optionalServices`:
  - Core Base Service: `61080001-8d6d-82b8-614a-1c8cb0f8dcc6`
  - Command / Control: `61080002-8d6d-82b8-614a-1c8cb0f8dcc6`
  - Sensor Stream: `61080003-8d6d-82b8-614a-1c8cb0f8dcc6`
  - Nordic DFU: `0000fe59-0000-1000-8000-00805f9b34fb`
- **Dynamic GATT Explorer:** Traverses discovered services and characteristics, displays permissions (`READ`, `WRITE`, `NOTIFY`, `INDICATE`), supports one-click notification subscriptions, and provides a real-time Hex/ASCII packet sniffer with query filtering and JSON export.

---

## 🧠 Local Algorithmic Engine (`MetricsEngine.ts`)

### 1. Live HRV (RMSSD)
- Rolling buffer of valid RR-intervals filtered between 300 ms and 2000 ms to eliminate ectopic beats and optical motion noise.
- Root Mean Square of Successive Differences:
  $$\text{RMSSD} = \sqrt{\frac{1}{N-1} \sum_{i=1}^{N-1} (RR_{i+1} - RR_i)^2}$$

### 2. Day & Session Strain (Whoop 0.0 - 21.0 Scale)
- 5 physiological HR zones calibrated from User Max HR:
  - **Zone 1 (50-60% Max HR):** Active Recovery (Weight: 1.0)
  - **Zone 2 (60-70% Max HR):** Aerobic Base (Weight: 2.0)
  - **Zone 3 (70-80% Max HR):** Tempo (Weight: 3.5)
  - **Zone 4 (80-90% Max HR):** Threshold (Weight: 5.5)
  - **Zone 5 (90-100% Max HR):** Max Capacity (Weight: 9.0)
- Cumulative Edwards TRIMP is transformed via Whoop's logarithmic asymptote:
  $$\text{Strain} = 21.0 \times \left(1 - e^{-\text{TRIMP} / 70.0}\right)$$

### 3. Recovery Score (0% - 100%)
- Compares today's RMSSD and resting HR against the user's 7-day rolling baselines:
  - $\Delta \text{HRV}\% = \frac{\text{HRV}_{\text{today}} - \text{HRV}_{\text{base}}}{\text{HRV}_{\text{base}}}$
  - $\Delta \text{RHR}\% = \frac{\text{RHR}_{\text{base}} - \text{RHR}_{\text{today}}}{\text{RHR}_{\text{base}}}$
  - Composite Score: $60 + (\Delta \text{HRV}\% \times 70 + \Delta \text{RHR}\% \times 30) \times 0.8$
  - Categorization:
    - 🟢 **Green (67% - 100%):** High readiness, prime for intense strain.
    - 🟡 **Yellow (34% - 66%):** Moderate readiness.
    - 🔴 **Red (1% - 33%):** High fatigue / suppressed parasympathetic tone.

### 4. Active Caloric Expenditure (Keytel Clinical Equation)
- **Male:** $\text{Cal/min} = \frac{-55.0969 + (0.6309 \times \text{HR}) + (0.1988 \times \text{Weight}) + (0.2017 \times \text{Age})}{4.184}$
- **Female:** $\text{Cal/min} = \frac{-20.4022 + (0.4472 \times \text{HR}) - (0.1263 \times \text{Weight}) + (0.074 \times \text{Age})}{4.184}$

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Web Bluetooth capable browser (Chrome, Edge, Brave, Opera)

### Development Server
```bash
npm install
npm run dev -- --host
```
Open **`http://localhost:5173/`** in your browser.

---

## 📱 Mobile Pairing Instructions
1. Open the application URL on your mobile browser (e.g. Chrome on Android) over your local network: `http://<LAN_IP>:5173/`.
2. Ensure Bluetooth and Location Services (required by Android for BLE scanning) are enabled.
3. Tap **"Connect Whoop"** and select your Whoop 4.0 strap from the pairing dialog.
