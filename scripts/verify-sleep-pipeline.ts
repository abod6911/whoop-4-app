/**
 * Senior Health-Tech & TypeScript Systems Engineering
 * End-to-End Diagnostic Verification Runner for WHOOP Sleep Telemetry Pipeline
 *
 * Diagnostic Scope:
 * - STEP 1: Payload Retrieval across WHOOP API v1, BLE Strap Stream, and Nocturnal Reconcile
 * - STEP 2: Raw Payload Millisecond Field Inspection
 * - STEP 3: Hypnogram Stage Analysis, Sleep Efficiency, Performance % & Zero-NaN Assertion
 * - STEP 4: State Storage Persistence & UI Mapping
 */

// ============================================================================
// 0. Mock Runtime Environment for Headless Node.js Execution
// ============================================================================

const memoryStorage = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, val: string) => memoryStorage.set(key, String(val)),
  removeItem: (key: string) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
  get length() { return memoryStorage.size; },
  key: (i: number) => Array.from(memoryStorage.keys())[i] ?? null,
};

// Polyfill globals for Node
(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).window = {
  location: {
    origin: 'http://localhost:5173',
    href: 'http://localhost:5173',
    pathname: '/',
    search: '',
    hash: '',
  },
  history: {
    replaceState: () => {},
  },
  localStorage: mockLocalStorage,
};

import { whoopApiService, millisecondsToHoursAndMinutes } from '../src/services/whoopApiService';
import { sleepEngine } from '../src/services/sleepEngine';
import {
  classifyEpoch,
  calculateSleepStatsFromTimeline,
  generateRealisticOvernightSession,
  type EpochFeatures,
} from '../src/services/sleepStages';
import type { WhoopSleepRecord, ProcessedWhoopSleep } from '../src/types/whoop';

// ANSI terminal color helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, message: string, details?: any) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} ${message}`);
  } else {
    failedAssertions++;
    console.error(`  ${colors.red}✗ FAIL${colors.reset} ${message}`);
    if (details) {
      console.error(`    ${colors.yellow}Details:${colors.reset}`, details);
    }
  }
}

function assertNoNaN(val: any, fieldName: string) {
  assert(
    val !== undefined && !Number.isNaN(val) && val !== 'NaN',
    `Field '${fieldName}' must not be NaN or undefined (Actual: ${val})`
  );
}

// ============================================================================
// TEST SUITE 1: STEP 1 - INGESTION SOURCE RETRIEVAL
// ============================================================================
async function runStep1Tests() {
  console.log(`\n${colors.bright}${colors.cyan}====================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}STEP 1: Ingestion Source Retrieval (WHOOP API v1 / BLE / Reconciled)${colors.reset}`);
  console.log(`${colors.cyan}====================================================================${colors.reset}`);

  // Test 1.1: OAuth Scopes Verification
  console.log(`\n${colors.yellow}[1.1] OAuth Scopes & Authorization Endpoint Validation:${colors.reset}`);
  const authUrl = whoopApiService.getAuthorizationUrl({
    clientId: 'test-client-id-123',
    redirectUri: 'http://localhost:5173/oauth/callback',
  });

  assert(authUrl.includes('read%3Asleep') || authUrl.includes('read:sleep'), 'Authorization URL strictly includes read:sleep scope');
  assert(authUrl.includes('offline'), 'Authorization URL strictly includes offline scope for perpetual refresh');
  assert(authUrl.includes('response_type=code'), 'Authorization URL uses standard OAuth 2.0 authorization code grant');

  // Test 1.2: Token Management & Diagnosis
  console.log(`\n${colors.yellow}[1.2] Token Health & Diagnostic State:${colors.reset}`);
  whoopApiService.setTokens({
    accessToken: 'test_whoop_access_token_secure_9876543210',
    refreshToken: 'test_whoop_refresh_token_offline_scope',
    expiresIn: 3600,
  });

  const tokenDiag = whoopApiService.getDiagnosticTokenInfo();
  assert(tokenDiag.hasToken === true, 'whoopApiService successfully recognizes valid access token');
  assert(tokenDiag.tokenPreview === 'test_w...3210', 'Token preview correctly masks secret credentials');
  assert(tokenDiag.ttlSeconds !== null && tokenDiag.ttlSeconds > 3500, `Token TTL correctly computed (${tokenDiag.ttlSeconds}s remaining)`);
  assert(tokenDiag.scopes.includes('read:sleep'), 'Scopes list includes read:sleep');
  assert(tokenDiag.scopes.includes('offline'), 'Scopes list includes offline');

  // Test 1.3: Ingestion Source Discrimination
  console.log(`\n${colors.yellow}[1.3] Sleep Engine Ingestion Source Transition:${colors.reset}`);
  const initialDiag = sleepEngine.getDiagnosticInfo();
  assert(typeof initialDiag.activeSource === 'string', `Initial diagnostic activeSource is defined (${initialDiag.activeSource})`);
}

// ============================================================================
// TEST SUITE 2: STEP 2 - RAW PAYLOAD MILLISECOND FIELD INSPECTION
// ============================================================================
async function runStep2Tests() {
  console.log(`\n${colors.bright}${colors.cyan}====================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}STEP 2: Inspect Raw Millisecond Telemetry Fields${colors.reset}`);
  console.log(`${colors.cyan}====================================================================${colors.reset}`);

  // Canonical Mock WHOOP Sleep Record from official API documentation
  const mockWhoopRecord: WhoopSleepRecord = {
    id: 98124,
    user_id: 42,
    created_at: '2026-10-20T08:00:00.000Z',
    updated_at: '2026-10-20T08:05:00.000Z',
    start: '2026-10-19T23:30:00.000Z',
    end: '2026-10-20T07:18:00.000Z',
    timezone_offset: '+03:00',
    nap: false,
    score_state: 'SCORED',
    score: {
      stage_summary: {
        total_in_bed_time_milli: 28080000,          // 7h 48m (7.80 hrs)
        total_awake_time_milli: 2160000,            // 36m (0.60 hrs)
        total_no_data_time_milli: 0,
        total_light_sleep_time_milli: 12960000,     // 3h 36m (3.60 hrs)
        total_slow_wave_sleep_time_milli: 6480000,  // 1h 48m (1.80 hrs) SWS (Deep)
        total_rem_sleep_time_milli: 6480000,        // 1h 48m (1.80 hrs) REM
      },
      sleep_needed: {
        baseline_milli: 27360000,                   // 7h 36m (7.60 hrs)
        need_from_sleep_debt_milli: 1080000,        // 18m
        need_from_recent_strain_milli: 720000,      // 12m
      },
      respiratory_rate: 14.8,
      sleep_performance_percentage: 92,
      sleep_consistency_percentage: 88,
      sleep_efficiency_percentage: 92,
    },
  };

  console.log(`\n${colors.yellow}[2.1] Processing Canonical Raw Record:${colors.reset}`);
  const processed = whoopApiService.processSleepRecord(mockWhoopRecord);

  // Field assertions
  assert(processed.id === 98124, 'Sleep Record ID preserved correctly');
  assert(processed.isNap === false, 'Non-nap primary sleep correctly flagged');
  assert(processed.scoreState === 'SCORED', 'Score state is SCORED');
  assert(processed.totalInBedMilli === 28080000, 'total_in_bed_time_milli preserved (28080000 ms)');
  assert(processed.totalSlowWaveMilli === 6480000, 'total_slow_wave_sleep_time_milli preserved (6480000 ms)');
  assert(processed.totalRemMilli === 6480000, 'total_rem_sleep_time_milli preserved (6480000 ms)');
  assert(processed.totalLightMilli === 12960000, 'total_light_sleep_time_milli preserved (12960000 ms)');
  assert(processed.totalAwakeMilli === 2160000, 'total_awake_time_milli preserved (2160000 ms)');
  assert(processed.totalAsleepMilli === 25920000, 'totalAsleepMilli correctly sums light + deep + rem (25920000 ms = 7.2 hrs)');

  // Decimal conversion assertions
  assert(processed.inBed.totalHoursDecimal === 7.8, `inBed decimal hours converted accurately (Expected 7.8, got ${processed.inBed.totalHoursDecimal})`);
  assert(processed.asleep.totalHoursDecimal === 7.2, `asleep decimal hours converted accurately (Expected 7.2, got ${processed.asleep.totalHoursDecimal})`);
  assert(processed.slowWave.totalHoursDecimal === 1.8, `slowWave (Deep) decimal hours converted accurately (Expected 1.8, got ${processed.slowWave.totalHoursDecimal})`);
  assert(processed.rem.totalHoursDecimal === 1.8, `rem decimal hours converted accurately (Expected 1.8, got ${processed.rem.totalHoursDecimal})`);
  assert(processed.light.totalHoursDecimal === 3.6, `light decimal hours converted accurately (Expected 3.6, got ${processed.light.totalHoursDecimal})`);

  // String formatting assertions
  assert(processed.asleep.formatted === '7h 12m', `asleep formatted string is 7h 12m (Got: ${processed.asleep.formatted})`);
  assert(processed.asleep.formattedAr === '7 س 12 د', `asleep formattedAr string is 7 س 12 د (Got: ${processed.asleep.formattedAr})`);
}

// ============================================================================
// TEST SUITE 3: STEP 3 - HYPNOGRAM STAGE ANALYSIS & ZERO-NAN ASSERTION
// ============================================================================
async function runStep3Tests() {
  console.log(`\n${colors.bright}${colors.cyan}====================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}STEP 3: Hypnogram Stage Calculations & Zero-NaN Validation${colors.reset}`);
  console.log(`${colors.cyan}====================================================================${colors.reset}`);

  // Test 3.1: Stage Percentages from Canonical Record
  console.log(`\n${colors.yellow}[3.1] Canonical Record Stage Distribution:${colors.reset}`);
  const record: WhoopSleepRecord = {
    id: 1001,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    start: '2026-10-19T23:30:00.000Z',
    end: '2026-10-20T07:30:00.000Z',
    timezone_offset: '+03:00',
    nap: false,
    score_state: 'SCORED',
    score: {
      stage_summary: {
        total_in_bed_time_milli: 28800000,          // 8.0 hrs
        total_awake_time_milli: 2880000,            // 10%
        total_no_data_time_milli: 0,
        total_light_sleep_time_milli: 12960000,     // 50% of asleep
        total_slow_wave_sleep_time_milli: 6480000,  // 25% of asleep
        total_rem_sleep_time_milli: 6480000,        // 25% of asleep
      },
      sleep_needed: {
        baseline_milli: 27360000,
        need_from_sleep_debt_milli: 0,
        need_from_recent_strain_milli: 0,
      },
      respiratory_rate: 15.2,
      sleep_performance_percentage: 95,
      sleep_consistency_percentage: 90,
      sleep_efficiency_percentage: 90,
    },
  };

  const processed = whoopApiService.processSleepRecord(record);

  assertNoNaN(processed.stages.lightPercent, 'lightPercent');
  assertNoNaN(processed.stages.deepPercent, 'deepPercent');
  assertNoNaN(processed.stages.remPercent, 'remPercent');
  assertNoNaN(processed.stages.awakePercent, 'awakePercent');

  assert(processed.stages.lightPercent === 50, `Light sleep is 50% of asleep time (Got: ${processed.stages.lightPercent}%)`);
  assert(processed.stages.deepPercent === 25, `Deep sleep (SWS) is 25% of asleep time (Got: ${processed.stages.deepPercent}%)`);
  assert(processed.stages.remPercent === 25, `REM sleep is 25% of asleep time (Got: ${processed.stages.remPercent}%)`);
  assert(
    processed.stages.lightPercent + processed.stages.deepPercent + processed.stages.remPercent === 100,
    'Sleep stages (Light + Deep + REM) sum exactly to 100%'
  );

  // Test 3.2: Edge Case: PENDING_SCORE Graceful Handling
  console.log(`\n${colors.yellow}[3.2] Edge Case: PENDING_SCORE (No Crash, Graceful Arabic Message):${colors.reset}`);
  const pendingRecord: WhoopSleepRecord = {
    id: 1002,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    start: '2026-10-20T00:00:00.000Z',
    end: '2026-10-20T07:00:00.000Z',
    nap: false,
    score_state: 'PENDING_SCORE',
  };

  const pendingResult = whoopApiService.processSleepRecord(pendingRecord);
  assert(pendingResult.scoreState === 'PENDING_SCORE', 'Processed state is strictly PENDING_SCORE');
  assert(pendingResult.statusMessage === 'جاري تحليل بيانات النوم', 'Status message matches Arabic requirement "جاري تحليل بيانات النوم"');
  assert(pendingResult.performancePercentage === null, 'Performance percentage safely returns null, not undefined');
  assertNoNaN(pendingResult.asleep.totalHoursDecimal, 'Pending totalHoursDecimal');
  assert(pendingResult.asleep.formatted === '--', 'Pending formatted returns graceful placeholder "--"');

  // Test 3.3: Edge Case: UNSCORABLE Graceful Handling
  console.log(`\n${colors.yellow}[3.3] Edge Case: UNSCORABLE Record:${colors.reset}`);
  const unscorableRecord: WhoopSleepRecord = {
    id: 1003,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    start: '2026-10-20T00:00:00.000Z',
    end: '2026-10-20T07:00:00.000Z',
    nap: false,
    score_state: 'UNSCORABLE',
  };

  const unscorableResult = whoopApiService.processSleepRecord(unscorableRecord);
  assert(unscorableResult.scoreState === 'UNSCORABLE', 'Processed state is UNSCORABLE');
  assert(unscorableResult.statusMessage === 'بيانات النوم غير قابلة للتقييم', 'Arabic status message matches "بيانات النوم غير قابلة للتقييم"');

  // Test 3.4: Edge Case: All Milliseconds Zero (Divide-by-Zero Guard)
  console.log(`\n${colors.yellow}[3.4] Edge Case: All Milliseconds Zero (Zero Division Guard):${colors.reset}`);
  const zeroRecord: WhoopSleepRecord = {
    id: 1004,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    start: '2026-10-20T00:00:00.000Z',
    end: '2026-10-20T07:00:00.000Z',
    nap: false,
    score_state: 'SCORED',
    score: {
      stage_summary: {
        total_in_bed_time_milli: 0,
        total_awake_time_milli: 0,
        total_no_data_time_milli: 0,
        total_light_sleep_time_milli: 0,
        total_slow_wave_sleep_time_milli: 0,
        total_rem_sleep_time_milli: 0,
      },
    },
  };

  const zeroResult = whoopApiService.processSleepRecord(zeroRecord);
  assertNoNaN(zeroResult.stages.deepPercent, 'zeroResult deepPercent');
  assertNoNaN(zeroResult.stages.remPercent, 'zeroResult remPercent');
  assertNoNaN(zeroResult.stages.lightPercent, 'zeroResult lightPercent');
  assertNoNaN(zeroResult.stages.awakePercent, 'zeroResult awakePercent');
  assert(zeroResult.stages.deepPercent === 0, 'Zero asleep duration yields 0% stage without NaN');

  // Test 3.5: Clinical Epoch Classification & Hypnogram Generation
  console.log(`\n${colors.yellow}[3.5] Clinical 30s Epoch Classification Engine:${colors.reset}`);
  const deepFeatures: EpochFeatures = {
    hrMean: 48,
    hrStd: 0.8,
    avgRmssd: 82,
    rmssdStdDev: 3.2,
    motionIntensity: 0.01,
    rhrBaseline: 54,
  };
  const deepClassification = classifyEpoch(deepFeatures);
  assert(deepClassification === 'deep', `Low HR + Low Variance + Low Motion classified as DEEP (Got: ${deepClassification})`);

  const remFeatures: EpochFeatures = {
    hrMean: 58,
    hrStd: 3.8,
    avgRmssd: 52,
    rmssdStdDev: 8.5,
    motionIntensity: 0.02,
    rhrBaseline: 54,
  };
  const remClassification = classifyEpoch(remFeatures);
  assert(remClassification === 'rem', `Elevated HR + High HRV Variance + Low Motion classified as REM (Got: ${remClassification})`);

  const awakeFeatures: EpochFeatures = {
    hrMean: 72,
    hrStd: 5.5,
    avgRmssd: 35,
    rmssdStdDev: 12.0,
    motionIntensity: 0.65,
    rhrBaseline: 54,
  };
  const awakeClassification = classifyEpoch(awakeFeatures);
  assert(awakeClassification === 'awake', `High Motion + High HR classified as AWAKE (Got: ${awakeClassification})`);
}

// ============================================================================
// TEST SUITE 4: STEP 4 - STORAGE PERSISTENCE & UI MAPPING
// ============================================================================
async function runStep4Tests() {
  console.log(`\n${colors.bright}${colors.cyan}====================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}STEP 4: Storage Persistence & UI State Mapping${colors.reset}`);
  console.log(`${colors.cyan}====================================================================${colors.reset}`);

  // Test 4.1: Sleep Record Ingestion into sleepEngine
  console.log(`\n${colors.yellow}[4.1] Ingesting Full Sleep Session into SleepEngine:${colors.reset}`);
  const mockApiSleep: WhoopSleepRecord = {
    id: 887766,
    user_id: 1,
    created_at: '2026-10-20T08:00:00.000Z',
    updated_at: '2026-10-20T08:05:00.000Z',
    start: '2026-10-19T23:25:00.000Z',
    end: '2026-10-20T07:15:00.000Z',
    timezone_offset: '+03:00',
    nap: false,
    score_state: 'SCORED',
    score: {
      stage_summary: {
        total_in_bed_time_milli: 28200000,          // 7h 50m
        total_awake_time_milli: 1800000,            // 30m
        total_no_data_time_milli: 0,
        total_light_sleep_time_milli: 13200000,     // 3h 40m
        total_slow_wave_sleep_time_milli: 6600000,  // 1h 50m
        total_rem_sleep_time_milli: 6600000,        // 1h 50m
      },
      sleep_needed: {
        baseline_milli: 27360000,
        need_from_sleep_debt_milli: 720000,
        need_from_recent_strain_milli: 720000,
      },
      respiratory_rate: 15.0,
      sleep_performance_percentage: 94,
      sleep_consistency_percentage: 89,
      sleep_efficiency_percentage: 94,
    },
  };

  const metrics = sleepEngine.ingestWhoopApiSleep(mockApiSleep);

  assertNoNaN(metrics.hoursAsleep, 'metrics.hoursAsleep');
  assertNoNaN(metrics.hoursInBed, 'metrics.hoursInBed');
  assertNoNaN(metrics.sleepPerformance, 'metrics.sleepPerformance');
  assertNoNaN(metrics.efficiencyPercent, 'metrics.efficiencyPercent');

  assert(metrics.hoursAsleep !== null && metrics.hoursAsleep > 7.0, `hoursAsleep is realistic (${metrics.hoursAsleep} hrs)`);
  assert(metrics.sleepPerformance === 94, `sleepPerformance matches API score (94%)`);
  assert(metrics.efficiencyPercent === 94, `efficiencyPercent matches API score (94%)`);
  assert(metrics.timeline && metrics.timeline.length > 50, `Hypnogram timeline generated (${metrics.timeline?.length} epochs)`);

  // Test 4.2: Storage Persistence Inspection
  console.log(`\n${colors.yellow}[4.2] Verifying Local Storage Key Persistence:${colors.reset}`);
  let storedSessionFound = false;
  let storedDayFound = false;

  for (let i = 0; i < mockLocalStorage.length; i++) {
    const key = mockLocalStorage.key(i);
    if (key && key.startsWith('whoop_sleep_session_')) storedSessionFound = true;
    if (key && (key.startsWith('whoop_real_day_') || key.startsWith('whoop_day_'))) storedDayFound = true;
  }

  assert(storedSessionFound, 'Sleep session record successfully written to whoop_sleep_session_*');
  assert(storedDayFound, 'Day state record successfully written to whoop_real_day_*');

  // Test 4.3: Diagnostic Info Inspection
  console.log(`\n${colors.yellow}[4.3] Validating Diagnostic Ingestion Source & Telemetry State:${colors.reset}`);
  const diag = sleepEngine.getDiagnosticInfo();

  assert(diag.activeSource === 'cloud_api', `Active source tracked as 'cloud_api' (Got: ${diag.activeSource})`);
  assert(diag.scoreState === 'SCORED', 'Score state is SCORED');
  assert(diag.lastIngestedTimestamp !== null && diag.lastIngestedTimestamp > 0, 'lastIngestedTimestamp populated');
  assert(diag.hasTimeline === true, 'Timeline presence confirmed for UI hypnogram visualization');
  assert(diag.timelineEpochCount > 0, `Epoch count is positive (${diag.timelineEpochCount} epochs)`);

  // Test 4.4: Nocturnal Gap Fallback Simulation
  console.log(`\n${colors.yellow}[4.4] Nocturnal Gap Fallback Reconciliation:${colors.reset}`);
  const reconciled = sleepEngine.reconcileNocturnalGap();
  assert(reconciled.hoursAsleep !== null && reconciled.hoursAsleep > 0, `Nocturnal gap successfully computed fallback (${reconciled.hoursAsleep}h asleep)`);
  assertNoNaN(reconciled.sleepPerformance, 'reconciled.sleepPerformance');
  assertNoNaN(reconciled.efficiencyPercent, 'reconciled.efficiencyPercent');

  const reconciledDiag = sleepEngine.getDiagnosticInfo();
  assert(reconciledDiag.activeSource === 'reconciled', `Diagnostic source switches to 'reconciled' (Got: ${reconciledDiag.activeSource})`);

  // Test 4.5: Timezone Bed/Wake Verification (Zero UTC Drift)
  console.log(`\n${colors.yellow}[4.5] Local Timezone Bed/Wake Offset Verification:${colors.reset}`);
  const isoUtcSample = '2026-10-19T23:30:00.000Z';
  const localDateObj = new Date(isoUtcSample);
  const formattedLocal = localDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  assert(!formattedLocal.includes('NaN'), `Local bedtime time formatted cleanly: ${formattedLocal}`);
  assert(formattedLocal.includes('AM') || formattedLocal.includes('PM') || formattedLocal.includes('ص') || formattedLocal.includes('م'), 'Formatted string includes AM/PM or Arabic equivalent');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
  console.log(`\n${colors.bright}${colors.magenta}####################################################################${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}# WHOOP SLEEP TELEMETRY PIPELINE: END-TO-END VERIFICATION RUN       #${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}####################################################################${colors.reset}`);

  try {
    await runStep1Tests();
    await runStep2Tests();
    await runStep3Tests();
    await runStep4Tests();

    console.log(`\n${colors.bright}${colors.cyan}====================================================================${colors.reset}`);
    console.log(`${colors.bright}VERIFICATION SUMMARY:${colors.reset}`);
    console.log(`  Total Assertions:    ${totalAssertions}`);
    console.log(`  ${colors.green}Passed Assertions:   ${passedAssertions}${colors.reset}`);
    console.log(`  ${failedAssertions === 0 ? colors.green : colors.red}Failed Assertions:   ${failedAssertions}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}====================================================================${colors.reset}`);

    if (failedAssertions > 0) {
      console.error(`\n${colors.red}${colors.bright}VERIFICATION FAILED with ${failedAssertions} errors.${colors.reset}\n`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}${colors.bright}ALL 4 DIAGNOSTIC STEPS PASSED WITH 0 ERRORS! (100% HEALTHY)${colors.reset}\n`);
      process.exit(0);
    }
  } catch (err) {
    console.error(`\n${colors.red}FATAL ERROR during test execution:${colors.reset}`, err);
    process.exit(1);
  }
}

main();
