/**
 * WHOOP 4.0 Day Strain & Banister TRIMP Model
 * Based on Heart Rate Reserve (HRR) and physiological exponential weighting.
 */

export const STRAIN_TAU = 95;
export const STRAIN_HRR_FLOOR = 0.15; // Smooth accumulation starting from Zone 1 (>15% HR reserve)

/**
 * Computes incremental TRIMP based on Banister's cardiac impulse-response model.
 * @param bpm Current instantaneous heart rate
 * @param rhr Baseline resting heart rate
 * @param maxHr User maximum heart rate
 * @param female Gender flag (different autonomic coefficients)
 * @param dtSec Elapsed time in seconds between samples
 */
export function banisterTrimpIncrement(
  bpm: number,
  rhr: number,
  maxHr: number,
  female: boolean,
  dtSec: number
): number {
  if (dtSec <= 0 || bpm <= 0) return 0;

  const reserve = Math.max(20, maxHr - rhr);
  const y = Math.min(1, Math.max(0, (bpm - rhr) / reserve));

  // Filter out basal / resting heart rates below 15% of HR reserve
  if (y < STRAIN_HRR_FLOOR) {
    return 0;
  }

  // Banister gender coefficients
  const a = female ? 0.86 : 0.64;
  const b = female ? 1.67 : 1.92;

  return (dtSec / 60) * y * a * Math.exp(b * y);
}

/**
 * Maps cumulative TRIMP to WHOOP Day Strain (0.0 to 21.0 logarithmic scale).
 */
export function calculateStrainFromTrimp(trimp: number): number {
  if (trimp <= 0) return 0;
  const raw = 21.0 * (1 - Math.exp(-trimp / STRAIN_TAU));
  return Number(Math.min(21.0, Math.max(0, raw)).toFixed(1));
}

/**
 * Inverts WHOOP Day Strain back to underlying cumulative TRIMP.
 */
export function strainToTrimp(strain: number): number {
  if (strain <= 0) return 0;
  if (strain >= 21.0) return 500;
  const ratio = 1 - strain / 21.0;
  return -STRAIN_TAU * Math.log(Math.max(0.001, ratio));
}
