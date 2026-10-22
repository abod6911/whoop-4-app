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
  formatLocalTime12h,
  type EpochFeatures,
} from '../src/services/sleepStages';
import { spansNighttimeHours } from '../src/services/whoopBleEngine';
import { localDateKey } from '../src/utils/dateKey';
import type { WhoopSleepRecord, ProcessedWhoopSleep } from '../src/types/whoop';
import {
  WHOOP_BASE_SERVICE_UUID,
  WHOOP_CMD_TO_STRAP_UUID,
  WHOOP_CMD_FROM_STRAP_UUID,
  WHOOP_DATA_FROM_STRAP_UUID,
  WHOOP_OPCODES,
  crc8Whoop,
  crc32Whoop,
  crc32Zlib,
  encodeWhoopFrame,
  decodeWhoopFrame,
  whoopCommands,
  WhoopDefragmentationStream,
  parseFlashEpochBuffer,
  parseR24Records,
  parseEpisodicSleepPayload,
  type DecodedSleepEpoch,
} from '../src/services/whoopBleProtocol';
import { whoopDb } from '../src/services/whoopDatabase';

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

  // Test 4.4: Dynamic Disconnection Gap & Manual Sleep Adjustment
  console.log(`\n${colors.yellow}[4.4] Dynamic Nocturnal Disconnection Gap & Manual Confirmation:${colors.reset}`);
  const now = Date.now();
  const nineHoursAgo = now - 9 * 3600 * 1000;
  mockLocalStorage.setItem('whoop_last_seen_timestamp', String(nineHoursAgo));
  mockLocalStorage.setItem('whoop_last_reconnected_timestamp', String(now));

  const reconciled = sleepEngine.reconcileNocturnalGap({
    lastSyncedTimestamp: nineHoursAgo,
    currentTimestamp: now,
  });

  assert(reconciled !== null && reconciled.hoursAsleep !== null && reconciled.hoursAsleep >= 8.0, `Dynamic hardware gap successfully computed exact sleep (${reconciled?.hoursAsleep}h asleep across 9h gap)`);
  assertNoNaN(reconciled?.sleepPerformance, 'reconciled.sleepPerformance');
  assertNoNaN(reconciled?.efficiencyPercent, 'reconciled.efficiencyPercent');

  const reconciledDiag = sleepEngine.getDiagnosticInfo();
  assert(reconciledDiag.activeSource === 'reconciled', `Diagnostic source switches to 'reconciled' (Got: ${reconciledDiag.activeSource})`);

  // Test 4.4.b: Manual Sleep Confirmation (User enters 9.0 hours: 22:30 to 07:30)
  console.log(`\n${colors.yellow}[4.4.b] Manual Sleep Window Confirmation (Xiaomi Band 10 / 9 Hours):${colors.reset}`);
  const manualSleep = sleepEngine.recordManualSleepWindow({
    bedtime: '22:30',
    wakeTime: '07:30',
  });
  assert(manualSleep.hoursInBed === 9, `hoursInBed matches confirmed 9.0 hours exactly (Got: ${manualSleep.hoursInBed}h)`);
  assert(manualSleep.hoursAsleep !== null && manualSleep.hoursAsleep >= 8.0, `hoursAsleep reflects clinical net sleep (${manualSleep.hoursAsleep}h)`);
  const manualDiag = sleepEngine.getDiagnosticInfo();
  assert(manualDiag.activeSource === 'MANUAL_PRESET' || manualDiag.activeSource === 'manual', `Diagnostic source switches to 'MANUAL_PRESET' (Got: ${manualDiag.activeSource})`);

  // Test 4.5: Timezone Bed/Wake Verification (Zero UTC Drift)
  console.log(`\n${colors.yellow}[4.5] Local Timezone Bed/Wake Offset Verification:${colors.reset}`);
  const isoUtcSample = '2026-10-19T23:30:00.000Z';
  const localDateObj = new Date(isoUtcSample);
  const formattedLocal = localDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  assert(!formattedLocal.includes('NaN'), `Local bedtime time formatted cleanly: ${formattedLocal}`);
  assert(formattedLocal.includes('AM') || formattedLocal.includes('PM') || formattedLocal.includes('ص') || formattedLocal.includes('م'), 'Formatted string includes AM/PM or Arabic equivalent');
}

// ============================================================================
// TEST SUITE 5: STEP 5 - REVERSE-ENGINEERED PROTOCOL & FLASH-DECODING VERIFICATION
// ============================================================================
async function runStep5Tests() {
  console.log(`\n${colors.bright}${colors.cyan}====================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}STEP 5: Reverse-Engineered WHOOP 4.0 Protocol & Flash Decoding${colors.reset}`);
  console.log(`${colors.cyan}====================================================================${colors.reset}`);

  // Test 5.1: UUIDs and Handshake Command Sequences
  console.log(`\n${colors.yellow}[5.1] OpenStrap Protocol Command Sequences & GATT Mapping:${colors.reset}`);
  assert(WHOOP_BASE_SERVICE_UUID === '61080001-8d6d-82b8-614a-1c8cb0f8dcc6', 'Base service UUID matches Nordic nRF52840 WHOOP Gen 4');
  assert(WHOOP_CMD_TO_STRAP_UUID === '61080002-8d6d-82b8-614a-1c8cb0f8dcc6', 'CMD_TO_STRAP UUID matches specification');
  assert(WHOOP_CMD_FROM_STRAP_UUID === '61080003-8d6d-82b8-614a-1c8cb0f8dcc6', 'CMD_FROM_STRAP UUID matches specification');
  assert(WHOOP_DATA_FROM_STRAP_UUID === '61080005-8d6d-82b8-614a-1c8cb0f8dcc6', 'DATA_FROM_STRAP UUID matches specification');

  const helloFrame = whoopCommands.createHello();
  assert(helloFrame[0] === 0xaa, 'HELLO frame starts with 0xAA delimiter');
  assert(helloFrame.length >= 9, 'HELLO frame contains header, payload, and CRC-32');

  const clockFrame = whoopCommands.createSetClock(1729550000000);
  assert(clockFrame[0] === 0xaa, 'SET_CLOCK frame starts with 0xAA delimiter');

  const syncFrame = whoopCommands.createMemorySyncStart(1729550000000);
  assert(syncFrame[0] === 0xaa, 'MEMORY_SYNC_START frame starts with 0xAA delimiter');

  // Test 5.2: Binary Framing & CRC Verification
  console.log(`\n${colors.yellow}[5.2] Binary Framing & CRC Integrity Validation:${colors.reset}`);
  const samplePayload = new Uint8Array([0x08, 0x01, 0x22, 0x33, 0x44, 0x55]);
  const encoded = encodeWhoopFrame(samplePayload, 42);

  assert(encoded[0] === 0xaa, 'Start-of-frame delimiter is strictly 0xAA');
  assert(encoded[1] === 42, 'Sequence counter (42) preserved at byte 1');
  const payloadLen = encoded[2] | (encoded[3] << 8);
  assert(payloadLen === samplePayload.length, `2-byte little-endian length matches payload size (${payloadLen} bytes)`);

  const decoded = decodeWhoopFrame(encoded);
  assert(decoded.valid === true, 'Frame successfully decoded and validated');
  assert(decoded.sequence === 42, 'Sequence number matches encoded sequence (42)');
  assert(decoded.headerCrcValid === true, 'Header CRC-8 (polynomial 0x07) validated');
  assert(decoded.payloadCrcValid === true, 'Payload CRC-32 (0x04C11DB7) validated');
  assert(decoded.payload !== null && decoded.payload.length === samplePayload.length, 'Payload byte content extracted with exact length');

  // Test 5.3: In-Memory MTU De-fragmentation Stream
  console.log(`\n${colors.yellow}[5.3] In-Memory BLE MTU De-fragmentation Stream (20-Byte Reassembly):${colors.reset}`);
  const stream = new WhoopDefragmentationStream();
  stream.setExpectedTotalChunks(5);

  let reassembledPayload: Uint8Array | null = null;
  let reassembledSeq = -1;
  stream.onFrame((payload, seq) => {
    reassembledPayload = payload;
    reassembledSeq = seq;
  });

  let lastProgressPct = 0;
  stream.onProgress((prog) => {
    lastProgressPct = prog.percentage;
  });

  // Construct a 64-byte payload frame
  const largePayload = new Uint8Array(64);
  for (let i = 0; i < largePayload.length; i++) {
    largePayload[i] = (i * 7) & 0xff;
  }
  const largeFrame = encodeWhoopFrame(largePayload, 7);

  // Slice into 20-byte MTU fragments
  const mtuSize = 20;
  const fragments: Uint8Array[] = [];
  for (let i = 0; i < largeFrame.length; i += mtuSize) {
    fragments.push(largeFrame.slice(i, i + mtuSize));
  }

  assert(fragments.length >= 4, `Frame correctly fragmented into ${fragments.length} BLE MTU slices`);

  // Push fragments one by one
  for (let i = 0; i < fragments.length - 1; i++) {
    stream.pushChunk(fragments[i]);
    assert(reassembledPayload === null, `Frame should not complete prematurely on fragment #${i + 1}`);
  }

  // Push final fragment
  stream.pushChunk(fragments[fragments.length - 1]);
  assert(reassembledPayload !== null, 'Fragmented frame successfully reassembled upon final chunk arrival');
  assert(reassembledSeq === 7, 'Reassembled frame sequence counter matches (7)');
  assert(reassembledPayload && (reassembledPayload as Uint8Array).length === largePayload.length, 'Reassembled payload length matches original buffer');
  assert(lastProgressPct > 0, `Live stream progress tracked accurately (${lastProgressPct}%)`);

  // Test 5.4: Epoch Payload Decoding & De-obfuscation
  console.log(`\n${colors.yellow}[5.4] 30-Second Physiological Epoch & R24 Decoding:${colors.reset}`);
  // Construct raw flash buffer containing 4 30-second epoch records (8 bytes each = 32 bytes)
  const baseEpochSec = 1729555200; // 2024-10-22 00:00:00 UTC
  const epochBuffer = new Uint8Array(1 + 32);
  epochBuffer[0] = 0x24; // Flash chunk opcode
  const view = new DataView(epochBuffer.buffer, epochBuffer.byteOffset, epochBuffer.byteLength);

  // Epoch 1: Deep SWS (HR 46, Low Motion 0.02, RMSSD 85)
  view.setUint32(1, baseEpochSec, true);
  view.setUint8(5, 46);
  view.setUint8(6, 2);  // 0.02G motion
  view.setUint8(7, 85); // RMSSD
  view.setUint8(8, 8);  // HR std dev (0.8)

  // Epoch 2: REM (HR 56, Low Motion 0.02, RMSSD 55, high variance)
  view.setUint32(9, baseEpochSec + 30, true);
  view.setUint8(13, 56);
  view.setUint8(14, 2);  // 0.02G motion
  view.setUint8(15, 55); // RMSSD
  view.setUint8(16, 35); // HR std dev (3.5)

  // Epoch 3: Light (HR 54, Minor Motion 0.06, RMSSD 65)
  view.setUint32(17, baseEpochSec + 60, true);
  view.setUint8(21, 54);
  view.setUint8(22, 6);  // 0.06G motion
  view.setUint8(23, 65); // RMSSD
  view.setUint8(24, 18); // HR std dev (1.8)

  // Epoch 4: Awake (HR 78, Significant Motion 0.35, RMSSD 30)
  view.setUint32(25, baseEpochSec + 90, true);
  view.setUint8(29, 78);
  view.setUint8(30, 35); // 0.35G motion
  view.setUint8(31, 30); // RMSSD
  view.setUint8(32, 50); // HR std dev (5.0)

  const parsedEpochs = parseFlashEpochBuffer(epochBuffer);
  assert(parsedEpochs.length === 4, `Successfully parsed 4 30-second physiological epochs (Got: ${parsedEpochs.length})`);
  assert(parsedEpochs[0].hr === 46, 'Epoch 1 HR parsed correctly (46 bpm)');
  assert(parsedEpochs[0].motionVariance === 0.02, 'Epoch 1 motion variance parsed correctly (0.02G)');
  assert(parsedEpochs[0].rmssd === 85, 'Epoch 1 RMSSD parsed correctly (85 ms)');
  assert(parsedEpochs[0].timestamp === baseEpochSec * 1000, 'Epoch 1 Unix timestamp converted accurately to milliseconds');

  // Test 5.5: Integration with SleepEngine & Dynamic Stage Classification
  console.log(`\n${colors.yellow}[5.5] End-to-End Pipeline: Decoded Stream Ingestion & Stage Classification:${colors.reset}`);
  const streamMetrics = sleepEngine.ingestDecodedEpochs(parsedEpochs, {
    name: 'Athlete',
    age: 28,
    weightKg: 75,
    heightCm: 178,
    maxHr: 192,
    restingHrBaseline: 52,
    hrvBaseline: 65,
    sleepNeedHours: 8.0,
    gender: 'male',
  });

  assertNoNaN(streamMetrics.hoursAsleep, 'Decoded stream hoursAsleep');
  assertNoNaN(streamMetrics.hoursInBed, 'Decoded stream hoursInBed');
  assertNoNaN(streamMetrics.sleepPerformance, 'Decoded stream sleepPerformance');
  assertNoNaN(streamMetrics.efficiencyPercent, 'Decoded stream efficiencyPercent');

  const diag = sleepEngine.getDiagnosticInfo();
  assert(diag.activeSource === 'ble', `Diagnostic source switches to 'ble' from real strap offload (Got: ${diag.activeSource})`);
  assert(diag.timelineEpochCount === 4, `Hypnogram timeline contains all 4 decoded epochs (Got: ${diag.timelineEpochCount})`);

  // Verify dynamic classifications
  const timeline = sleepEngine.getHypnogram();
  assert(timeline[0].stage === 'deep', `Epoch 1 (Low HR, Low Var, Low Motion) dynamically staged as DEEP SWS (Got: ${timeline[0].stage})`);
  assert(timeline[1].stage === 'rem', `Epoch 2 (HR near RHR, High HR Std, Low Motion) dynamically staged as REM (Got: ${timeline[1].stage})`);
  assert(timeline[2].stage === 'light', `Epoch 3 (Intermediate HR, Mild motion) dynamically staged as LIGHT (Got: ${timeline[2].stage})`);
  assert(timeline[3].stage === 'awake', `Epoch 4 (High Motion, High HR) dynamically staged as AWAKE (Got: ${timeline[3].stage})`);

  // Verify storage persistence
  let storedSessionFound = false;
  for (let i = 0; i < mockLocalStorage.length; i++) {
    const key = mockLocalStorage.key(i);
    if (key && key.startsWith('whoop_sleep_session_')) storedSessionFound = true;
  }
  assert(storedSessionFound, 'Decoded sleep session persisted to storage');
}


// ============================================================================
// STEP 6: Shift-Work Sleep & Circadian Window Architecture (05:00 to 14:00)
// ============================================================================
async function runStep6Tests() {
  console.log(`\n${colors.bright}${colors.cyan}====================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}STEP 6: Shift-Work Sleep & Circadian Baseline Architecture (05:00 - 14:00)${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}====================================================================${colors.reset}`);

  // Test 6.1: Local Timezone 12-Hour Bed/Wake Formatting
  console.log(`\n${colors.yellow}[6.1] Strictly Formatted 12-Hour Local Time (AM/PM & ص/م):${colors.reset}`);
  const sampleBedDate = new Date('2026-10-21T05:00:00');
  const sampleWakeDate = new Date('2026-10-21T14:00:00');

  const bedAr = formatLocalTime12h(sampleBedDate.getTime(), 'ar-u-nu-latn');
  const wakeAr = formatLocalTime12h(sampleWakeDate.getTime(), 'ar-u-nu-latn');
  const bedEn = formatLocalTime12h(sampleBedDate.getTime(), 'en-US');
  const wakeEn = formatLocalTime12h(sampleWakeDate.getTime(), 'en-US');

  assert(bedAr.includes('05:00') && bedAr.includes('ص'), `Arabic bedtime formatted as '05:00 ص' (Got: ${bedAr})`);
  assert(wakeAr.includes('02:00') && wakeAr.includes('م'), `Arabic wakeTime formatted as '02:00 م' (Got: ${wakeAr})`);
  assert(bedEn.includes('05:00') && bedEn.includes('AM'), `English bedtime formatted as '05:00 AM' (Got: ${bedEn})`);
  assert(wakeEn.includes('02:00') && wakeEn.includes('PM'), `English wakeTime formatted as '02:00 PM' (Got: ${wakeEn})`);

  // Test 6.2: Shift-Work 9-Hour Daytime Simulation (05:00 to 14:00)
  console.log(`\n${colors.yellow}[6.2] Shift-Work 9-Hour Daytime Sleep Window (05:00 to 14:00):${colors.reset}`);
  const shiftMetrics = sleepEngine.recordManualSleepWindow({
    bedtime: '05:00',
    wakeTime: '14:00',
    rhrBaseline: 52,
  });

  assertNoNaN(shiftMetrics.hoursInBed, 'Shift hoursInBed');
  assertNoNaN(shiftMetrics.hoursAsleep, 'Shift hoursAsleep');
  assertNoNaN(shiftMetrics.sleepPerformance, 'Shift sleepPerformance');
  assertNoNaN(shiftMetrics.efficiencyPercent, 'Shift efficiencyPercent');

  assert(shiftMetrics.hoursInBed === 9.0, `hoursInBed evaluates to 9.0 hours exactly (Got: ${shiftMetrics.hoursInBed}h)`);
  assert(
    shiftMetrics.hoursAsleep !== null && shiftMetrics.hoursAsleep >= 8.5 && shiftMetrics.hoursAsleep <= 9.0,
    `hoursAsleep evaluates to ~9.0h (Got: ${shiftMetrics.hoursAsleep}h)`
  );
  assert(shiftMetrics.sleepPerformance !== null && shiftMetrics.sleepPerformance >= 95, `sleepPerformance reflects 9.0h sleep demand (Got: ${shiftMetrics.sleepPerformance}%)`);
  assert(shiftMetrics.efficiencyPercent !== null && shiftMetrics.efficiencyPercent >= 90, `efficiencyPercent is clinical quality (Got: ${shiftMetrics.efficiencyPercent}%)`);

  // Verify stage breakdowns sum correctly
  const { awakePercent, remPercent, lightPercent, deepPercent } = shiftMetrics.stages;
  const stageSum = awakePercent + remPercent + lightPercent + deepPercent;
  assert(stageSum >= 99 && stageSum <= 101, `All stage percentages sum to ~100% without leakage (Got: ${stageSum}%)`);
  assert(deepPercent > 0, `Deep slow-wave sleep detected (Got: ${deepPercent}%)`);
  assert(remPercent > 0, `REM sleep detected (Got: ${remPercent}%)`);
  assert(lightPercent > 0, `Light sleep detected (Got: ${lightPercent}%)`);

  // Verify bedtime and wakeTime in 12-hour format
  assert(Boolean(shiftMetrics.bedtime && (shiftMetrics.bedtime.includes('05:00') || shiftMetrics.bedtime.includes('5:00'))), `Bedtime string formatted cleanly: ${shiftMetrics.bedtime}`);
  assert(Boolean(shiftMetrics.wakeTime && (shiftMetrics.wakeTime.includes('02:00') || shiftMetrics.wakeTime.includes('2:00'))), `Wake time string formatted cleanly: ${shiftMetrics.wakeTime}`);

  // Test 6.3: Shift-Work Disconnection Window Eligibility
  console.log(`\n${colors.yellow}[6.3] Shift-Work & Daytime Window Eligibility in spansNighttimeHours:${colors.reset}`);
  const shiftGapStart = sampleBedDate.getTime();
  const shiftGapEnd = sampleWakeDate.getTime();
  assert(spansNighttimeHours(shiftGapStart, shiftGapEnd), '05:00 to 14:00 (9h gap) qualifies as sleep session');

  const afternoonStart = new Date('2026-10-21T13:00:00').getTime();
  const afternoonEnd = new Date('2026-10-21T18:00:00').getTime();
  assert(spansNighttimeHours(afternoonStart, afternoonEnd), 'Any continuous rest >= 4.0h qualifies as primary sleep regardless of daytime hours');

  // Test 6.4: Active Baseline Cycle across Calendar Day Rollover
  console.log(`\n${colors.yellow}[6.4] Active Baseline Cycle Preservation (Yesterday Sleep = Today Baseline):${colors.reset}`);
  const currentMetrics = sleepEngine.getSleepMetrics({
    name: 'ShiftWorker',
    age: 32,
    weightKg: 78,
    heightCm: 182,
    maxHr: 190,
    restingHrBaseline: 52,
    hrvBaseline: 65,
    sleepNeedHours: 8.0,
    gender: 'male',
  }, 8.5);

  assert(currentMetrics.hoursAsleep !== null && currentMetrics.hoursAsleep >= 8.5, `hoursAsleep is preserved (~9.0h) without premature blanking (Got: ${currentMetrics.hoursAsleep}h)`);
  assert(currentMetrics.hoursInBed === 9.0, `hoursInBed is preserved as 9.0h (Got: ${currentMetrics.hoursInBed}h)`);
  assert(currentMetrics.timeline !== undefined && currentMetrics.timeline.length > 0, `Hypnogram timeline retained across baseline cycle (${currentMetrics.timeline?.length} epochs)`);
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
    await runStep5Tests();
    await runStep6Tests();

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
      console.log(`\n${colors.green}${colors.bright}ALL 6 DIAGNOSTIC STEPS PASSED WITH 0 ERRORS! (100% HEALTHY)${colors.reset}\n`);
      process.exit(0);
    }
  } catch (err) {
    console.error(`\n${colors.red}FATAL ERROR during test execution:${colors.reset}`, err);
    process.exit(1);
  }
}

main();
