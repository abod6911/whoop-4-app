import type { SleepMetrics, SleepStagePoint, SleepNeedBreakdown, UserSettings } from '../types/whoop';

export type SleepStage = 'awake' | 'light' | 'deep' | 'rem';

export interface EpochFeatures {
  hrMean: number;
  hrStd: number;
  avgRmssd: number | null;
  rmssdStdDev: number;
  motionIntensity: number; // in Gs (0.0 to 1.0+)
  rhrBaseline: number;
}

export interface CalculatedSleepStats {
  hoursInBed: number;
  hoursAsleep: number;
  sleepPerformance: number;
  efficiencyPercent: number;
  disturbancesCount: number;
  disturbancesPerHour: number;
  latencyMinutes: number;
  stages: {
    awakePercent: number;
    remPercent: number;
    lightPercent: number;
    deepPercent: number;
  };
  stageDurations: {
    awakeMinutes: number;
    remMinutes: number;
    lightMinutes: number;
    deepMinutes: number;
  };
  needBreakdown: SleepNeedBreakdown;
  bedtime: string;
  wakeTime: string;
}

/**
 * WHOOP 4.0 Physiological 30-Second Stage Classification Logic
 * Deep (Slow Wave SWS): HR <= RHR - 2, minimal HR volatility, complete absence of motion (<0.04G), elevated RMSSD.
 * REM: Heart rate volatility, elevated/fluctuating HRV, complete muscle atonia (motion <0.04G), HR near RHR.
 * Light: Intermediate stable HR near RHR, occasional micro-movements (0.04 - 0.12G).
 * Awake: Accelerated movement (>0.15G) or sudden heart rate spikes (> RHR + 10).
 */
export function classifyEpoch(features: EpochFeatures): SleepStage {
  const { hrMean, hrStd, avgRmssd, rmssdStdDev, motionIntensity, rhrBaseline } = features;

  // 1. Awake: Physical movement spikes (> 0.15G) or heart rate significantly above daytime resting baseline
  if (motionIntensity > 0.15 || hrMean > rhrBaseline + 10) {
    return 'awake';
  }

  // 2. Deep Sleep (Slow-Wave SWS):
  // Parasympathetic dominance: HR drops below RHR baseline (often by 2-6 bpm),
  // minimal heart rate volatility (low standard deviation), complete stillness (< 0.04G)
  const isHeartRateLow = hrMean <= rhrBaseline - 2;
  const isHeartRateStable = hrStd <= 2.2;
  const isStill = motionIntensity < 0.04;
  if (isStill && isHeartRateLow && isHeartRateStable) {
    return 'deep';
  }

  // 3. REM Sleep (Rapid Eye Movement):
  // Skeletal muscle atonia (near-zero gross motion), but autonomic activation:
  // Fluctuating HR (hrStd > 2.2 or elevated RMSSD std dev), HR hovering near resting baseline
  const isNearRhr = hrMean >= rhrBaseline - 3 && hrMean <= rhrBaseline + 8;
  const hasAutonomicVariance = hrStd > 2.2 || rmssdStdDev >= 7.5 || (avgRmssd !== null && avgRmssd > 60);
  if (isStill && isNearRhr && hasAutonomicVariance) {
    return 'rem';
  }

  // 4. Light Sleep:
  // Transition and spindle sleep with minor micro-movements (0.04 - 0.12G) or stable intermediate HR
  return 'light';
}

/**
 * Calculates complete WHOOP 4.0 Sleep Metrics from an epoch timeline
 */
export function calculateSleepStatsFromTimeline(
  timeline: SleepStagePoint[],
  settings: UserSettings,
  dailyStrain: number,
  accumulatedDebtHours = 0,
  sleepOnsetTimestamp?: number | null,
  wakeTimestamp?: number | null
): CalculatedSleepStats | null {
  if (!timeline || timeline.length === 0) return null;

  let awakeCount = 0;
  let lightCount = 0;
  let deepCount = 0;
  let remCount = 0;
  let disturbances = 0;
  let lastStage: SleepStage | null = null;

  for (const pt of timeline) {
    if (pt.stage === 'awake') awakeCount++;
    else if (pt.stage === 'light') lightCount++;
    else if (pt.stage === 'deep') deepCount++;
    else if (pt.stage === 'rem') remCount++;

    if (pt.stage === 'awake' && lastStage && lastStage !== 'awake') {
      disturbances++;
    }
    lastStage = pt.stage;
  }

  const totalEpochs = timeline.length;
  // Epochs are 30 seconds (0.5 minutes)
  const epochMinutes = 0.5;
  const totalMinutesInBed = totalEpochs * epochMinutes;
  const actualAsleepMinutes = (lightCount + deepCount + remCount) * epochMinutes;

  const hoursInBed = Number((totalMinutesInBed / 60).toFixed(2));
  const hoursAsleep = Number((actualAsleepMinutes / 60).toFixed(2));

  const efficiency = totalEpochs > 0 ? Math.round((actualAsleepMinutes / totalMinutesInBed) * 100) : 0;

  // Sleep Need Formula:
  // Baseline (default 7.9h) + Strain Demand ((Strain / 21) * 1.4h) + Sleep Debt Paydown (35% of accumulated debt)
  const baselineNeed = settings.sleepNeedHours || 7.9;
  const strainNeed = Number(((dailyStrain / 21.0) * 1.4).toFixed(2));
  const recentDebt = Number((accumulatedDebtHours * 0.35).toFixed(2));
  const totalNeed = Number((baselineNeed + strainNeed + recentDebt).toFixed(2));

  const needBreakdown: SleepNeedBreakdown = {
    baselineNeedHours: baselineNeed,
    recentDebtHours: recentDebt,
    strainNeedHours: strainNeed,
    totalNeedHours: totalNeed,
  };

  const perf = totalNeed > 0 ? Math.min(100, Math.round((hoursAsleep / totalNeed) * 100)) : 0;

  const awakePercent = totalEpochs > 0 ? Math.round((awakeCount / totalEpochs) * 100) : 0;
  const lightPercent = totalEpochs > 0 ? Math.round((lightCount / totalEpochs) * 100) : 0;
  const deepPercent = totalEpochs > 0 ? Math.round((deepCount / totalEpochs) * 100) : 0;
  const remPercent = totalEpochs > 0 ? Math.round((remCount / totalEpochs) * 100) : 0;

  const hoursInBedSafe = Math.max(0.5, hoursInBed);
  const disturbancesPerHour = Number((disturbances / hoursInBedSafe).toFixed(1));

  const firstTime = timeline[0]?.timestamp || Date.now();
  const lastTime = timeline[timeline.length - 1]?.timestamp || Date.now();

  const onset = sleepOnsetTimestamp || firstTime;
  const latencyMinutes = Math.max(0, Math.round((onset - firstTime) / 60000));

  const bedtime = new Date(firstTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const wakeTime = new Date(wakeTimestamp || lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return {
    hoursInBed,
    hoursAsleep,
    sleepPerformance: perf,
    efficiencyPercent: efficiency,
    disturbancesCount: disturbances,
    disturbancesPerHour,
    latencyMinutes,
    stages: {
      awakePercent,
      remPercent,
      lightPercent,
      deepPercent,
    },
    stageDurations: {
      awakeMinutes: Math.round(awakeCount * epochMinutes),
      remMinutes: Math.round(remCount * epochMinutes),
      lightMinutes: Math.round(lightCount * epochMinutes),
      deepMinutes: Math.round(deepCount * epochMinutes),
    },
    needBreakdown,
    bedtime,
    wakeTime,
  };
}

/**
 * Generates an Authentic Clinical Overnight Sleep Session
 * Models human 90-minute ultradian sleep architecture (4 to 5 cycles)
 * Example default: Bed at 23:15, Wake at 07:05 (7h 50m in bed, 7h 10m asleep, 91% efficiency)
 */
export function generateRealisticOvernightSession(
  rhrBaseline = 56,
  options?: {
    bedHour?: number;
    bedMinute?: number;
    wakeHour?: number;
    wakeMinute?: number;
    totalHours?: number;
  }
): {
  timeline: SleepStagePoint[];
  sleepOnsetTimestamp: number;
  wakeTimestamp: number;
} {
  const now = new Date();
  // Target: Yesterday evening to this morning
  const bedDate = new Date(now);
  const bedHour = options?.bedHour ?? 23;
  const bedMinute = options?.bedMinute ?? 15;
  const wakeHour = options?.wakeHour ?? 7;
  const wakeMinute = options?.wakeMinute ?? 5;

  bedDate.setHours(bedHour, bedMinute, 0, 0);
  if (bedDate.getTime() > now.getTime()) {
    bedDate.setDate(bedDate.getDate() - 1);
  }

  const wakeDate = new Date(bedDate);
  wakeDate.setDate(wakeDate.getDate() + (wakeHour < bedHour ? 1 : 0));
  wakeDate.setHours(wakeHour, wakeMinute, 0, 0);

  const startMs = bedDate.getTime();
  const endMs = wakeDate.getTime();
  const totalDurationMs = Math.max(3600000, endMs - startMs);

  const epochMs = 30000; // 30 seconds
  const totalEpochs = Math.floor(totalDurationMs / epochMs);

  const timeline: SleepStagePoint[] = [];

  // Ultradian 90-minute cycles definition:
  // Earlier in the night has more Slow-Wave Sleep (Deep);
  // Later in the night has more REM sleep and lighter sleep.
  const sleepOnsetDelayEpochs = 20; // ~10 minutes to fall asleep (latency)

  for (let i = 0; i < totalEpochs; i++) {
    const epochTime = startMs + i * epochMs;
    const progress = i / totalEpochs; // 0.0 to 1.0

    let stage: SleepStage = 'light';
    let hr = rhrBaseline;

    // 1. Initial Sleep Latency (First 10-15 min)
    if (i < sleepOnsetDelayEpochs) {
      stage = 'awake';
      hr = rhrBaseline + 8 + Math.round(Math.sin(i) * 3);
    }
    // 2. Final Awakening (Last 8-10 min)
    else if (i > totalEpochs - 16) {
      stage = 'awake';
      hr = rhrBaseline + 12 + Math.round(Math.cos(i) * 4);
    }
    else {
      // Periodic 90-minute ultradian cycle oscillation (cycle length ~180 epochs = 90 min)
      const cycleLength = 180;
      const cyclePos = (i - sleepOnsetDelayEpochs) % cycleLength;
      const cycleFraction = cyclePos / cycleLength; // 0.0 to 1.0 within cycle
      const cycleIndex = Math.floor((i - sleepOnsetDelayEpochs) / cycleLength);

      // Micro-disturbances / awakenings between cycles
      if (cyclePos >= cycleLength - 8 && cyclePos <= cycleLength - 2 && (cycleIndex === 1 || cycleIndex === 3)) {
        stage = 'awake';
        hr = rhrBaseline + 14 + Math.round(Math.random() * 4);
      }
      // Cycles 1 & 2: Deep Slow-Wave Dominance
      else if (cycleIndex <= 1) {
        if (cycleFraction < 0.20) {
          stage = 'light';
          hr = rhrBaseline + 1 + Math.round(Math.sin(i * 0.1) * 2);
        } else if (cycleFraction < 0.65) {
          // Heavy Slow-Wave Deep Sleep
          stage = 'deep';
          hr = rhrBaseline - 4 + Math.round(Math.sin(i * 0.05) * 1.5);
        } else if (cycleFraction < 0.82) {
          stage = 'light';
          hr = rhrBaseline + Math.round(Math.cos(i * 0.1) * 2);
        } else {
          // Brief early REM
          stage = 'rem';
          hr = rhrBaseline + 3 + Math.round(Math.sin(i * 0.4) * 3.5);
        }
      }
      // Cycles 3 & 4: Balanced to REM Dominance
      else if (cycleIndex <= 3) {
        if (cycleFraction < 0.25) {
          stage = 'light';
          hr = rhrBaseline + Math.round(Math.sin(i * 0.1) * 2);
        } else if (cycleFraction < 0.45) {
          // Shorter Deep sleep
          stage = 'deep';
          hr = rhrBaseline - 3 + Math.round(Math.sin(i * 0.05) * 1.5);
        } else if (cycleFraction < 0.60) {
          stage = 'light';
          hr = rhrBaseline + 1 + Math.round(Math.cos(i * 0.1) * 2);
        } else {
          // Lengthening REM sleep
          stage = 'rem';
          hr = rhrBaseline + 4 + Math.round(Math.sin(i * 0.5) * 4);
        }
      }
      // Cycle 5 (Morning): High REM, Light, and brief spontaneous movements
      else {
        if (cycleFraction < 0.35) {
          stage = 'light';
          hr = rhrBaseline + 2 + Math.round(Math.sin(i * 0.1) * 2);
        } else if (cycleFraction < 0.85) {
          // Extended morning REM
          stage = 'rem';
          hr = rhrBaseline + 5 + Math.round(Math.sin(i * 0.6) * 4.5);
        } else {
          stage = 'light';
          hr = rhrBaseline + 3 + Math.round(Math.cos(i * 0.1) * 2);
        }
      }
    }

    timeline.push({
      timestamp: epochTime,
      stage,
      hr: Math.round(hr),
    });
  }

  const sleepOnsetTimestamp = startMs + sleepOnsetDelayEpochs * epochMs;
  const wakeTimestamp = endMs;

  return {
    timeline,
    sleepOnsetTimestamp,
    wakeTimestamp,
  };
}
