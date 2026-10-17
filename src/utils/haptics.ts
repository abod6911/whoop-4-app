/**
 * Centralized Native Web Haptics Utility
 * Provides micro-interactions and tactile feedback via the Web Vibration API.
 */

export const isVibrationSupported = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
};

/**
 * 10ms subtle tick for tab navigation, segment switches, and toggles
 */
export const hapticLight = (): void => {
  if (isVibrationSupported()) {
    try {
      navigator.vibrate(10);
    } catch {}
  }
};

/**
 * 25ms tactile feedback for opening sheets, starting timers, or primary button presses
 */
export const hapticMedium = (): void => {
  if (isVibrationSupported()) {
    try {
      navigator.vibrate(25);
    } catch {}
  }
};

/**
 * Distinctive multi-pulse sequence for workout completion, streak milestone, or save success
 */
export const hapticSuccess = (): void => {
  if (isVibrationSupported()) {
    try {
      navigator.vibrate([15, 50, 20]);
    } catch {}
  }
};

/**
 * Warning vibration for alerts, strain limits, or disconnections
 */
export const hapticWarning = (): void => {
  if (isVibrationSupported()) {
    try {
      navigator.vibrate([30, 60, 30]);
    } catch {}
  }
};

/**
 * High-intensity repeating pattern for wake-up haptic alarm
 */
export const hapticAlarm = (): void => {
  if (isVibrationSupported()) {
    try {
      navigator.vibrate([300, 150, 300, 150, 500]);
    } catch {}
  }
};

/**
 * Micro selection tick (5-8ms) for wheel pickers and sliders
 */
export const hapticSelection = (): void => {
  if (isVibrationSupported()) {
    try {
      navigator.vibrate(8);
    } catch {}
  }
};
