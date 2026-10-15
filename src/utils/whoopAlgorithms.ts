import type { HealthMonitorMetric, SleepMetrics, LiveMetrics, UserSettings } from '../types/whoop';

/**
 * Calculates WHOOP Day Strain from cumulative TRIMP using a logarithmic saturation model.
 * Strain scale: 0.0 to 21.0
 */
export function calculateWhoopStrain(trimp: number): number {
  if (trimp <= 0) return 0;
  const tau = 70.0;
  const raw = 21.0 * (1 - Math.exp(-trimp / tau));
  return Number(Math.min(21.0, Math.max(0, raw)).toFixed(1));
}

/**
 * Computes optimal strain target range based on today's Recovery Score
 */
export function calculateOptimalStrainTarget(recoveryScore: number): { min: number; max: number } {
  // Higher recovery yields higher optimal strain targets
  const min = Number((4.0 + (recoveryScore / 100) * 10.0).toFixed(1));
  const max = Number(Math.min(20.5, min + 3.2).toFixed(1));
  return { min, max };
}

/**
 * Filters and calculates RMSSD (Root Mean Square of Successive Differences)
 */
export function calculateRMSSD(rrIntervalsMs: number[]): number {
  const valid = rrIntervalsMs.filter((rr) => rr >= 300 && rr <= 2000);
  if (valid.length < 2) return 65;

  let sumDiffSq = 0;
  for (let i = 0; i < valid.length - 1; i++) {
    const diff = valid[i + 1] - valid[i];
    sumDiffSq += diff * diff;
  }
  return Math.round(Math.sqrt(sumDiffSq / (valid.length - 1)));
}

/**
 * Calculates Recovery Score (1 - 100%) and Category
 */
export function calculateWhoopRecovery(
  currentHrv: number,
  currentRhr: number,
  baselineHrv: number,
  baselineRhr: number,
  sleepPerformance = 95
): { score: number; category: 'green' | 'yellow' | 'red' } {
  const hrvDeltaRatio = (currentHrv - baselineHrv) / Math.max(20, baselineHrv);
  const rhrDeltaRatio = (baselineRhr - currentRhr) / Math.max(25, baselineRhr);
  const sleepFactor = (sleepPerformance - 85) / 100;

  // Composite: 70% HRV, 20% RHR, 10% Sleep
  const composite = hrvDeltaRatio * 0.7 + rhrDeltaRatio * 0.2 + sleepFactor * 0.1;
  let score = Math.round(62 + composite * 75);
  score = Math.min(99, Math.max(1, score));

  let category: 'green' | 'yellow' | 'red' = 'yellow';
  if (score >= 67) category = 'green';
  else if (score <= 33) category = 'red';

  return { score, category };
}

/**
 * Generates the official WHOOP 5-Metric Health Monitor items
 */
export function generateHealthMonitorMetrics(
  liveHrv: number,
  liveRhr: number,
  settings: UserSettings
): HealthMonitorMetric[] {
  return [
    {
      key: 'respiratoryRate',
      label: 'Respiratory Rate',
      value: 14.8,
      unit: 'rpm',
      status: 'ok',
      typicalRange: '13.8 - 15.6 rpm',
      statusText: 'Within Range',
      dailyDelta: '+0.1',
    },
    {
      key: 'bloodOxygen',
      label: 'Blood Oxygen (SpO2)',
      value: 98,
      unit: '%',
      status: 'ok',
      typicalRange: '95 - 99%',
      statusText: 'Optimal',
      dailyDelta: '0%',
    },
    {
      key: 'restingHeartRate',
      label: 'Resting Heart Rate',
      value: liveRhr,
      unit: 'bpm',
      status: 'ok',
      typicalRange: `${settings.restingHrBaseline - 4} - ${settings.restingHrBaseline + 5} bpm`,
      statusText: 'Within Range',
      dailyDelta: `${liveRhr <= settings.restingHrBaseline ? '-' : '+'}${Math.abs(liveRhr - settings.restingHrBaseline)}`,
    },
    {
      key: 'hrv',
      label: 'Heart Rate Variability',
      value: liveHrv,
      unit: 'ms',
      status: 'ok',
      typicalRange: `${settings.hrvBaseline - 8} - ${settings.hrvBaseline + 10} ms`,
      statusText: 'Within Range',
      dailyDelta: `${liveHrv >= settings.hrvBaseline ? '+' : '-'}${Math.abs(liveHrv - settings.hrvBaseline)}`,
    },
    {
      key: 'skinTemp',
      label: 'Skin Temperature',
      value: 33.8,
      unit: '°C',
      status: 'ok',
      typicalRange: '33.2 - 34.4 °C',
      statusText: 'Baseline (0.0°)',
      dailyDelta: '±0.0°',
    },
  ];
}

/**
 * Generates official WHOOP Sleep metrics and sleep stages breakdown
 */
export function generateSleepMetrics(sleepPerformance = 98): SleepMetrics {
  return {
    hoursInBed: 8.2,
    hoursAsleep: 7.7,
    sleepNeedHours: 7.9,
    sleepPerformance,
    efficiencyPercent: 94,
    latencyMinutes: 12,
    disturbancesCount: 3,
    stages: {
      awakePercent: 8,
      remPercent: 24,
      lightPercent: 46,
      deepPercent: 22,
    },
  };
}
