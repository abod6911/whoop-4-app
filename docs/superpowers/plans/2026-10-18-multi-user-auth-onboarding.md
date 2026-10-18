# Multi-User Authentication, Isolated Data Architecture & 1:1 Cinematic WHOOP Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete multi-user authentication system with strict per-user data isolation (preventing biometrics, sleep, strain, steps, and MAC leakage between friends) and a 1:1 cinematic onboarding experience referencing the official WHOOP 4.0/5.0 product videos.

**Architecture:** Client-side cryptographic auth engine with SHA-256 password hashing in IndexedDB (`whoop_auth_profiles`), namespaced storage partitioned by `userId` across localStorage and IndexedDB (`whoop_db_${userId}`), coupled with a modular onboarding wizard (`WelcomeView`, `EmailStep`, `PasswordStep`, `ProfileSetupStep`, and 5-step `StrapPairingWizard`).

**Tech Stack:** React 19, TypeScript, Lucide Icons, Framer Motion / Spring physics, Tailwind CSS, Web Cryptography API (`crypto.subtle`), Web Bluetooth API, IndexedDB.

## Global Constraints
- Preserve existing view layouts (`OverviewView`, `StrainView`, `RecoveryView`, `SleepView`, `PlanView`, `StrapLabView`) and keep `100dvh` native mobile app frame.
- Strict multi-tenant isolation: No state from User A may be visible to User B upon logout or profile switch.
- Full RTL Arabic and English bilingual support across all new screens and modals.
- Media assets must have graceful CSS/SVG fallbacks in case video/images are delayed.
- Zero TypeScript errors (`npm run build` must pass cleanly).

---

### Task 1: Asset Staging & Fallback Media Infrastructure
**Files:**
- Create: `public/assets/videos/hero-reel.mp4`
- Create: `public/assets/pairing/strap-unbox.webp` (or SVG fallback)
- Create: `src/components/onboarding/OnboardingMedia.tsx`

**Interfaces:**
- Produces: Visual components and video player wrappers with preloading and error-fallback styling.

- [ ] **Step 1:** Create `public/assets/videos/` and copy the cinematic video reel.
- [ ] **Step 2:** Create fallback hardware illustration components (`OnboardingMedia.tsx`) for the 5 pairing steps.
- [ ] **Step 3:** Verify media routes and fallback rendering.

---

### Task 2: Isolated Multi-User Auth Engine & Namespaced Storage
**Files:**
- Create: `src/services/authService.ts`
- Modify: `src/services/StorageService.ts`
- Modify: `src/types/whoop.ts`

**Interfaces:**
- Produces: `authService.signUp()`, `authService.login()`, `authService.logout()`, `authService.switchUser()`, `authService.getAllProfiles()`, `authService.getCurrentUser()`.
- Modifies: `storageService.setUserId(userId)` which namespaces all keys:
  `user_${userId}_settings`, `user_${userId}_real_day_${date}`, `user_${userId}_day_${date}`, `user_${userId}_steps_${date}`, `user_${userId}_ble_device`, and database `whoop_db_${userId}`.

- [ ] **Step 1:** Define `UserProfile`, `AuthCredentials`, and `AuthState` types in `src/types/whoop.ts`.
- [ ] **Step 2:** Implement `authService.ts` with SHA-256 password hashing and IndexedDB storage.
- [ ] **Step 3:** Update `StorageService.ts` to support dynamic user namespacing and database isolation.
- [ ] **Step 4:** Test user creation, password verification, and storage partitioning.

---

### Task 3: React Auth Context & State Management
**Files:**
- Create: `src/context/AuthContext.tsx`
- Modify: `src/utils/biometricEngine.ts`
- Modify: `src/services/sleepEngine.ts`
- Modify: `src/services/pedometerEngine.ts`

**Interfaces:**
- Produces: `useAuth()` hook providing `{ currentUser, isAuthenticated, isLoading, signUp, login, logout, switchUser, profiles }`.
- Integrates: Memory flush on logout or user switch so biometrics, sleep, strain, and steps reset cleanly.

- [ ] **Step 1:** Create `AuthContext.tsx` with reactive subscription to `authService`.
- [ ] **Step 2:** Add memory flush hooks in biometricEngine, sleepEngine, and pedometerEngine to re-initialize for the active user.
- [ ] **Step 3:** Test switching between accounts in memory without leaks.

---

### Task 4: Cinematic Splash & Welcome Screen (1:1 with Video 2 & 1)
**Files:**
- Create: `src/components/onboarding/WelcomeView.tsx`

**Interfaces:**
- Consumes: `hero-reel.mp4` video asset.
- Produces: `onHaveDevice()`, `onNoDevice()` navigation callbacks.

- [ ] **Step 1:** Build `WelcomeView.tsx` with ambient looping hero video, dark gradient vignette, and illuminated WHOOP logo.
- [ ] **Step 2:** Implement high-contrast primary pill button ("I HAVE A WHOOP DEVICE") and dark glass secondary button ("I DO NOT HAVE A WHOOP DEVICE").
- [ ] **Step 3:** Add subtitle "A WHOOP Device is Required" and smooth spring transitions.

---

### Task 5: Account Creation & Sign-In Journey (1:1 with Video 1)
**Files:**
- Create: `src/components/onboarding/EmailStep.tsx`
- Create: `src/components/onboarding/PasswordStep.tsx`
- Create: `src/components/onboarding/ProfileSetupStep.tsx`

**Interfaces:**
- Produces: Step-by-step user input with real-time validation, floating focus outlines, circular progress button with blue glow, and password show/hide eye toggle.

- [ ] **Step 1:** Build `EmailStep.tsx` with tilted 3D envelope icon, email validator, and animated circular `->` button.
- [ ] **Step 2:** Build `PasswordStep.tsx` with animated WHOOP seal, user email display, show/hide eye toggle, and circular verification spinner.
- [ ] **Step 3:** Build `ProfileSetupStep.tsx` with Name, Age, Weight, Height, and Gender baseline inputs.

---

### Task 6: Interactive 5-Step Strap Pairing Wizard (1:1 with Video 1)
**Files:**
- Create: `src/components/onboarding/StrapPairingWizard.tsx`

**Interfaces:**
- Produces: Interactive 5-stage stepper:
  1. Unbox Your Device
  2. Put On Your WHOOP
  3. Wake Up Your WHOOP
  4. Check for Pairing Mode (pulsing blue LED)
  5. Select Your Device (Web Bluetooth GATT scanner + hardware selection)

- [ ] **Step 1:** Implement Step 1 (Unbox) and Step 2 (Put On) with hardware renders and snug fit instructions.
- [ ] **Step 2:** Implement Step 3 (Wake Up) and Step 4 (Check for Pairing Mode) with pulsing blue LED animation.
- [ ] **Step 3:** Implement Step 5 (Select Your Device) connected to Web Bluetooth GATT scanner, linking MAC/ID to `user_${userId}_ble_device`.

---

### Task 7: App Router & Account Switcher in More Tab
**Files:**
- Create: `src/components/onboarding/OnboardingFlow.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/views/MoreView.tsx`

**Interfaces:**
- Connects: `AuthContext` to `App.tsx`. If unauthenticated or no device paired, routes to `OnboardingFlow`.
- Adds: Profile card, "Switch Account" dialog, and "Logout" confirmation inside `MoreView.tsx`.

- [ ] **Step 1:** Assemble `OnboardingFlow.tsx` combining Welcome, Email, Password, Profile, and Pairing Wizard.
- [ ] **Step 2:** Integrate with `App.tsx` conditionally rendering main app shell or onboarding flow based on auth state.
- [ ] **Step 3:** Add Profile Header, Switch Account modal, and Logout in `MoreView.tsx` with full RTL Arabic support.

---

### Task 8: Verification, TypeScript Build & Deployment
**Files:**
- All touched files

- [ ] **Step 1:** Run `npm run build` to verify 0 TypeScript/compilation errors.
- [ ] **Step 2:** Test full multi-user flow: Register User 1 -> Pair -> Record metrics -> Switch to User 2 -> Verify complete isolation -> Return to User 1.
- [ ] **Step 3:** Commit and push to `main` for Vercel deployment.
