import type { HealthMonitorMetric, SleepMetrics, UserSettings } from '../types/whoop';

/**
 * Calculates WHOOP Day Strain from cumulative TRIMP using a logarithmic saturation model.
 * Strain scale: 0.0 to 21.0
 */
export function calculateWhoopStrain(trimp: number): number {
  if (trimp <= 0) return 0;
  const tau = 95.0;
  const raw = 21.0 * (1 - Math.exp(-trimp / tau));
  return Number(Math.min(21.0, Math.max(0, raw)).toFixed(1));
}

/**
 * Computes optimal strain target range based on today's Recovery Score
 */
export function calculateOptimalStrainTarget(recoveryScore: number | null): { min: number; max: number } {
  // If recovery score is still calibrating, return { 0, 0 } so UI renders '--'
  if (recoveryScore === null || recoveryScore <= 0) {
    return { min: 0, max: 0 };
  }
  const min = Number((4.0 + (recoveryScore / 100) * 10.0).toFixed(1));
  const max = Number(Math.min(20.5, min + 3.2).toFixed(1));
  return { min, max };
}

/**
 * Filters and calculates RMSSD (Root Mean Square of Successive Differences)
 * Requires MIN_BEATS_HRV = 30 clean beats before returning valid metric
 */
export function calculateRMSSD(rrIntervalsMs: number[]): number | null {
  const valid = rrIntervalsMs.filter((rr) => rr >= 300 && rr <= 2000);
  if (valid.length < 30) return null;

  let sumDiffSq = 0;
  for (let i = 0; i < valid.length - 1; i++) {
    const diff = valid[i + 1] - valid[i];
    sumDiffSq += diff * diff;
  }
  return Math.round(Math.sqrt(sumDiffSq / (valid.length - 1)));
}

/**
 * Calculates Recovery Score (1 - 100%) and Category from real metrics
 */
export function calculateWhoopRecovery(
  currentHrv: number | null,
  currentRhr: number | null,
  baselineHrv: number,
  baselineRhr: number
): { score: number | null; category: 'green' | 'yellow' | 'red' | 'calibrating' } {
  if (currentHrv === null || currentRhr === null) {
    return { score: null, category: 'calibrating' };
  }

  const hrvDeltaRatio = (currentHrv - baselineHrv) / Math.max(20, baselineHrv);
  const rhrDeltaRatio = (baselineRhr - currentRhr) / Math.max(25, baselineRhr);

  // Composite: 70% HRV, 30% RHR
  const composite = hrvDeltaRatio * 0.7 + rhrDeltaRatio * 0.3;
  let score = Math.round(60 + composite * 80);
  score = Math.min(99, Math.max(1, score));

  let category: 'green' | 'yellow' | 'red' = 'yellow';
  if (score >= 67) category = 'green';
  else if (score <= 33) category = 'red';

  return { score, category };
}

/**
 * Generates the official WHOOP 5-Metric Health Monitor items
 * Dynamically computes 'Within Range' vs 'Outside Range' vs 'Calibrating' based on personal baselines
 */
export function generateHealthMonitorMetrics(
  liveHrv: number | null,
  liveRhr: number | null,
  liveResp: number | null,
  settings: UserSettings,
  liveTemp: number | null = null,
  liveSpo2: number | null = null,
  liveTempDelta: number | null = null
): HealthMonitorMetric[] {
  // 1. Respiratory Rate (Typical 12 - 20 rpm)
  const respOk = liveResp !== null && liveResp >= 12.0 && liveResp <= 20.0;
  const respStatus = liveResp === null ? 'calibrating' : respOk ? 'ok' : 'alert';
  const respStatusText = liveResp === null ? 'Calibrating' : respOk ? 'Within Range' : 'Outside Range';
  const respDelta = liveResp !== null ? `${liveResp >= 14.5 ? '+' : ''}${(liveResp - 14.5).toFixed(1)}` : undefined;

  // 2. Blood Oxygen (SpO2: Typical >= 95%)
  const spo2Ok = liveSpo2 !== null && liveSpo2 >= 95;
  const spo2Status = liveSpo2 === null ? 'calibrating' : spo2Ok ? 'ok' : 'alert';
  const spo2StatusText = liveSpo2 === null ? 'Calibrating' : spo2Ok ? 'Optimal' : 'Outside Range';
  const spo2Delta = liveSpo2 !== null ? `${liveSpo2 >= 98 ? '±0%' : `${liveSpo2 - 98}%`}` : undefined;

  // 3. Resting Heart Rate vs Personal Baseline
  const rhrDelta = liveRhr !== null ? liveRhr - settings.restingHrBaseline : null;
  const rhrOk = rhrDelta !== null && Math.abs(rhrDelta) <= 8;
  const rhrStatus = liveRhr === null ? 'calibrating' : rhrOk ? 'ok' : 'alert';
  const rhrStatusText = liveRhr === null ? 'Calibrating' : rhrOk ? 'Within Range' : 'Outside Range';
  const rhrDeltaStr = rhrDelta !== null ? `${rhrDelta >= 0 ? '+' : ''}${rhrDelta}` : undefined;

  // 4. HRV vs Personal Baseline
  const hrvDelta = liveHrv !== null ? liveHrv - settings.hrvBaseline : null;
  const hrvOk = liveHrv !== null && liveHrv >= Math.round(settings.hrvBaseline * 0.7);
  const hrvStatus = liveHrv === null ? 'calibrating' : hrvOk ? 'ok' : 'alert';
  const hrvStatusText = liveHrv === null ? 'Calibrating' : hrvOk ? 'Within Range' : 'Outside Range';
  const hrvDeltaStr = hrvDelta !== null ? `${hrvDelta >= 0 ? '+' : ''}${hrvDelta}` : undefined;

  // 5. Skin Temperature Delta vs Rolling 14-day Baseline
  const hasTemp = liveTemp !== null;
  const effectiveTempDelta = liveTempDelta ?? (liveTemp !== null ? Number((liveTemp - 33.6).toFixed(1)) : null);
  const tempOk = hasTemp && (effectiveTempDelta === null || Math.abs(effectiveTempDelta) <= 1.2);
  const tempStatus = !hasTemp ? 'calibrating' : tempOk ? 'ok' : 'alert';
  const tempStatusText = !hasTemp
    ? 'Calibrating'
    : tempOk
    ? (effectiveTempDelta === 0 ? 'Baseline (0.0°)' : `${effectiveTempDelta! > 0 ? '+' : ''}${effectiveTempDelta!.toFixed(1)}° vs Baseline`)
    : 'Outside Range';
  const tempDeltaStr = effectiveTempDelta !== null ? `${effectiveTempDelta > 0 ? '+' : ''}${effectiveTempDelta.toFixed(1)}°` : undefined;

  return [
    {
      key: 'respiratoryRate',
      label: 'Respiratory Rate',
      value: liveResp,
      unit: 'rpm',
      status: respStatus,
      typicalRange: '12.0 - 20.0 rpm',
      statusText: respStatusText,
      dailyDelta: respDelta,
    },
    {
      key: 'bloodOxygen',
      label: 'Blood Oxygen (SpO2)',
      value: liveSpo2,
      unit: '%',
      status: spo2Status,
      typicalRange: '95 - 99%',
      statusText: spo2StatusText,
      dailyDelta: spo2Delta,
    },
    {
      key: 'restingHeartRate',
      label: 'Resting Heart Rate',
      value: liveRhr,
      unit: 'bpm',
      status: rhrStatus,
      typicalRange: `${settings.restingHrBaseline - 6} - ${settings.restingHrBaseline + 6} bpm`,
      statusText: rhrStatusText,
      dailyDelta: rhrDeltaStr,
    },
    {
      key: 'hrv',
      label: 'Heart Rate Variability',
      value: liveHrv,
      unit: 'ms',
      status: hrvStatus,
      typicalRange: `${Math.round(settings.hrvBaseline * 0.75)} - ${Math.round(settings.hrvBaseline * 1.35)} ms`,
      statusText: hrvStatusText,
      dailyDelta: hrvDeltaStr,
    },
    {
      key: 'skinTemp',
      label: 'Skin Temperature',
      value: liveTemp,
      unit: '°C',
      status: tempStatus,
      typicalRange: '±1.0° of Baseline',
      statusText: tempStatusText,
      dailyDelta: tempDeltaStr,
    },
  ];
}

import { sleepEngine } from '../services/sleepEngine';

/**
 * Generates official WHOOP Sleep metrics (from real logged sleep or sleepEngine)
 */
export function generateSleepMetrics(
  sleepPerformance: number | null,
  settings?: UserSettings,
  dailyStrain = 0
): SleepMetrics {
  if (settings) {
    const fromEngine = sleepEngine.getSleepMetrics(settings, dailyStrain);
    if (sleepPerformance !== null) {
      fromEngine.sleepPerformance = sleepPerformance;
    }
    return fromEngine;
  }

  return {
    hoursInBed: null,
    hoursAsleep: null,
    sleepNeedHours: 7.9,
    sleepPerformance,
    efficiencyPercent: null,
    latencyMinutes: null,
    disturbancesCount: null,
    sleepDebtHours: 0,
    stages: {
      awakePercent: 0,
      remPercent: 0,
      lightPercent: 0,
      deepPercent: 0,
    },
  };
}
