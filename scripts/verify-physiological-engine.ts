/**
 * verify-physiological-engine.ts
 * 
 * Comprehensive Algorithmic & Physiological Integrity Test Suite
 * Validates:
 *  1. HRV (RMSSD & SDNN) and Artifact Filtering
 *  2. Day Strain (Banister TRIMP & Logarithmic Scaling 0.0 - 21.0)
 *  3. Recovery Score (Normal CDF, Autonomic Weighting, Zone Gating)
 *  4. Caloric Expenditure (Mifflin-St Jeor BMR + Keytel Active Burn)
 *  5. Sleep Need Breakdown (Baseline + Strain Debt + Sleep Debt Carry-Over)
 *  6. WHOOP Coach Dual-Core AI Engine (Bilingual Telemetry Injection & Clinical Intents)
 */

if (typeof (globalThis as any).localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

import { calculateStrainFromTrimp, strainToTrimp, banisterTrimpIncrement } from '../src/utils/strainModel';
import { BiometricEngine } from '../src/utils/biometricEngine';
import { caloriesEngine } from '../src/utils/caloriesEngine';
import { sleepEngine } from '../src/services/sleepEngine';
import {
  generateWelcomeMessage,
  detectLanguage,
  askWhoopCoach,
  type WhoopCoachContext,
} from '../src/services/whoopCoachEngine';
import type { UserSettings } from '../src/types/whoop';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, description: string, detail?: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS ${description}`);
  } else {
    failedAssertions++;
    console.error(`  ✗ FAIL ${description}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function runPhysiologicalAudit() {
  console.log('\n####################################################################');
  console.log('# WHOOP PHYSIOLOGICAL & ALGORITHMIC INTEGRITY AUDIT               #');
  console.log('####################################################################\n');

  // ====================================================================
  // TEST 1: HRV (RMSSD) Formula & Edge Cases
  // ====================================================================
  console.log('====================================================================');
  console.log('TEST 1: HRV (RMSSD & SDNN) Formula Verification');
  console.log('====================================================================');

  const engine = new BiometricEngine();
  
  // Baseline fallback when empty buffer (< 3 samples)
  assert(
    engine.calculateRMSSD() === 65,
    'Empty RR buffer returns baseline HRV (65 ms) without crashing or NaN'
  );

  // Ingest known RR sequence: [800, 850, 820, 870] ms
  // diffs: +50, -30, +50
  // diffs squared: 2500, 900, 2500 -> sum = 5900
  // mean square = 5900 / 3 = 1966.67
  // sqrt(1966.67) = 44.347 -> Math.round = 44
  const testEngine = new BiometricEngine();
  (testEngine as any).rrBuffer = [800, 850, 820, 870];
  const calculatedRmssd = testEngine.calculateRMSSD();
  assert(
    calculatedRmssd === 44,
    `Calculated RMSSD matches mathematical formula (Expected: 44, Got: ${calculatedRmssd})`
  );

  const calculatedSdnn = testEngine.calculateSDNN();
  // Mean = (800+850+820+870)/4 = 835
  // Devs: -35, +15, -15, +35 -> Sq: 1225 + 225 + 225 + 1225 = 2900
  // Sample variance = 2900 / 3 = 966.67 -> sqrt = 31.09 -> Math.round = 31
  assert(
    calculatedSdnn === 31,
    `Calculated SDNN matches statistical standard deviation (Expected: 31, Got: ${calculatedSdnn})`
  );

  // ====================================================================
  // TEST 2: Day Strain (Banister TRIMP & Logarithmic 0.0 - 21.0 Scale)
  // ====================================================================
  console.log('\n====================================================================');
  console.log('TEST 2: Day Strain (Banister TRIMP & Logarithmic Scaling)');
  console.log('====================================================================');

  assert(calculateStrainFromTrimp(0) === 0, 'Zero TRIMP produces 0.0 Strain');
  assert(calculateStrainFromTrimp(-10) === 0, 'Negative TRIMP clamped to 0.0 Strain');

  // Asymptotic properties
  const extremeStrain = calculateStrainFromTrimp(5000);
  assert(extremeStrain === 21.0, `Extreme TRIMP asymptotically caps at 21.0 (Got: ${extremeStrain})`);

  // Intermediate values
  const trimp100 = calculateStrainFromTrimp(100);
  // 21.0 * (1 - exp(-100 / 95)) = 21.0 * (1 - exp(-1.0526)) = 21.0 * (1 - 0.3490) = 13.67 -> 13.7
  assert(
    trimp100 >= 13.5 && trimp100 <= 13.8,
    `100 TRIMP yields clinical Day Strain ~13.7 (Got: ${trimp100})`
  );

  // Invertibility: strainToTrimp
  const invertedTrimp = strainToTrimp(trimp100);
  assert(
    Math.abs(invertedTrimp - 100) < 2.0,
    `strainToTrimp accurately inverts Strain back to TRIMP (Expected ~100, Got: ${invertedTrimp.toFixed(1)})`
  );

  // HR reserve filtering (< 15% HR reserve yields 0 TRIMP)
  const restingTrimp = banisterTrimpIncrement(60, 55, 195, false, 60);
  assert(
    restingTrimp === 0,
    'Resting heart rate below 15% HR reserve yields zero strain accumulation'
  );

  // Vigorous heart rate (> 80% HR reserve yields exponential strain)
  const vigorousTrimp = banisterTrimpIncrement(170, 55, 195, false, 60);
  assert(
    vigorousTrimp > 0.8,
    `Vigorous heart rate generates accelerated cardiac load (Got: ${vigorousTrimp.toFixed(3)} TRIMP/min)`
  );

  // ====================================================================
  // TEST 3: Recovery Score (Autonomic Normal CDF & Zone Gating)
  // ====================================================================
  console.log('\n====================================================================');
  console.log('TEST 3: Recovery Score (Normal CDF, Weighting & Categories)');
  console.log('====================================================================');

  const recCalibrating = testEngine.calculateRecovery(null, null);
  assert(
    recCalibrating.score === null && recCalibrating.category === 'calibrating',
    'Disconnected or zero sensor input returns calibrating state with null score'
  );

  // Peak autonomic state (High HRV, low RHR, optimal sleep)
  // baseline: HRV=65, RHR=58
  const recPeak = testEngine.calculateRecovery(95, 48, 14.0, 95);
  assert(
    recPeak.score !== null && recPeak.score >= 67,
    `Peak parasympathetic state yields GREEN recovery (Got: ${recPeak.score}%, Category: ${recPeak.category})`
  );
  assert(recPeak.category === 'green', 'Category is strictly "green" when score >= 67%');

  // Moderate autonomic state (Close to baseline: HRV 66 vs 65, RHR 53 vs 52)
  const recModerate = testEngine.calculateRecovery(66, 53, 14.6, 84);
  assert(
    recModerate.score !== null && recModerate.score >= 34 && recModerate.score < 67,
    `Balanced autonomic state yields YELLOW recovery (Got: ${recModerate.score}%, Category: ${recModerate.category})`
  );
  assert(recModerate.category === 'yellow', 'Category is strictly "yellow" between 34% and 66%');

  // Depleted autonomic state (Low HRV, elevated RHR, poor sleep)
  const recDepleted = testEngine.calculateRecovery(32, 74, 17.5, 45);
  assert(
    recDepleted.score !== null && recDepleted.score <= 33,
    `Sympathetic overload yields RED recovery (Got: ${recDepleted.score}%, Category: ${recDepleted.category})`
  );
  assert(recDepleted.category === 'red', 'Category is strictly "red" when score <= 33%');

  // Score clamping between 1% and 99%
  const recExtremeLow = testEngine.calculateRecovery(10, 110, 22.0, 10);
  assert(
    recExtremeLow.score !== null && recExtremeLow.score >= 1,
    `Severely depleted state clamps cleanly >= 1% (Got: ${recExtremeLow.score}%)`
  );
  const recExtremeHigh = testEngine.calculateRecovery(160, 36, 11.0, 100);
  assert(
    recExtremeHigh.score !== null && recExtremeHigh.score <= 99,
    `Ultra-peak recovery clamps cleanly <= 99% (Got: ${recExtremeHigh.score}%)`
  );

  // ====================================================================
  // TEST 4: Caloric Expenditure (BMR & Keytel Equation)
  // ====================================================================
  console.log('\n====================================================================');
  console.log('TEST 4: Caloric Expenditure (Mifflin-St Jeor & Keytel Formula)');
  console.log('====================================================================');

  const maleSettings: UserSettings = {
    userId: 'test-user',
    name: 'Ahmed',
    gender: 'male',
    age: 30,
    weightKg: 75,
    heightCm: 180,
    maxHr: 190,
    restingHrBaseline: 55,
    hrvBaseline: 65,
    sleepNeedHours: 8.0,
    stepGoal: 10000,
    language: 'ar',
  };

  // Mifflin-St Jeor: 10 * 75 + 6.25 * 180 - 5 * 30 + 5 = 750 + 1125 - 150 + 5 = 1730 kcal
  const maleBmr = caloriesEngine.calculateDailyBmr(maleSettings);
  assert(maleBmr === 1730, `Male 24h BMR matches Mifflin-St Jeor formula (Expected: 1730, Got: ${maleBmr})`);

  const femaleSettings: UserSettings = {
    ...maleSettings,
    gender: 'female',
    weightKg: 60,
    heightCm: 165,
    age: 28,
  };
  // Female: 10 * 60 + 6.25 * 165 - 5 * 28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330.25
  const femaleBmr = caloriesEngine.calculateDailyBmr(femaleSettings);
  assert(
    Math.round(femaleBmr) === 1330,
    `Female 24h BMR matches Mifflin-St Jeor formula (Expected: 1330, Got: ${Math.round(femaleBmr)})`
  );

  // Keytel threshold filtering
  const belowThresholdBurn = caloriesEngine.calculateActiveCaloriesPerSecond(58, 55, maleSettings);
  assert(
    belowThresholdBurn === 0,
    'Active calorie burn is 0 when HR is below resting + 10 bpm'
  );

  const activeBurn = caloriesEngine.calculateActiveCaloriesPerSecond(150, 55, maleSettings);
  assert(
    activeBurn > 0.1 && activeBurn < 0.4,
    `Active calorie burn at 150 bpm reflects realistic human metabolic output (Got: ${(activeBurn * 60).toFixed(1)} kcal/min)`
  );

  // ====================================================================
  // TEST 5: Sleep Need & Sleep Debt Carrying Architecture
  // ====================================================================
  console.log('\n====================================================================');
  console.log('TEST 5: Sleep Need & Strain Debt Breakdown');
  console.log('====================================================================');

  const zeroStrainNeed = sleepEngine.calculateSleepNeed(maleSettings, 0);
  assert(
    zeroStrainNeed.baselineNeedHours === 8.0,
    `Baseline sleep need matches user settings (Got: ${zeroStrainNeed.baselineNeedHours}h)`
  );
  assert(
    zeroStrainNeed.strainNeedHours === 0,
    'Zero strain produces 0.0h strain sleep debt'
  );

  // Strain 15.0 adds strain debt
  // (15.0 / 21.0) * 1.4 = 1.00h
  const highStrainNeed = sleepEngine.calculateSleepNeed(maleSettings, 15.0);
  assert(
    highStrainNeed.strainNeedHours === 1.0,
    `15.0 Day Strain incurs +1.0h of restorative sleep demand (Got: ${highStrainNeed.strainNeedHours}h)`
  );
  assert(
    highStrainNeed.totalNeedHours === 9.0,
    `Total sleep need incorporates strain debt dynamically (Got: ${highStrainNeed.totalNeedHours}h)`
  );

  // ====================================================================
  // TEST 6: WHOOP Coach Dual-Core AI Engine & Intent Classification
  // ====================================================================
  console.log('\n====================================================================');
  console.log('TEST 6: WHOOP Coach AI Telemetry Engine (Bilingual & Intent Coverage)');
  console.log('====================================================================');

  const sampleContext: WhoopCoachContext = {
    recoveryScore: 82,
    recoveryCategory: 'green',
    hrv: 78,
    rhr: 50,
    respiratoryRate: 14.1,
    sleepPerformance: 94,
    hoursAsleep: 7.75,
    hoursInBed: 8.25,
    sleepNeed: 8.0,
    sleepEfficiency: 94,
    dayStrain: 14.2,
    steps: 8420,
    calories: 2350,
    liveHeartRate: 64,
    isStrapConnected: true,
    language: 'ar',
  };

  // Language detection
  assert(detectLanguage('كيف يجب أن أتمرن اليوم؟', 'en') === 'ar', 'Detects Arabic query accurately');
  assert(detectLanguage('How hard should I train today?', 'ar') === 'en', 'Detects English query accurately');

  // Welcome message dynamic metrics
  const arWelcome = generateWelcomeMessage(sampleContext, true);
  assert(arWelcome.includes('82%'), 'Arabic welcome message includes live 82% recovery');
  assert(arWelcome.includes('78 ms'), 'Arabic welcome message includes live 78 ms HRV');
  assert(arWelcome.includes('50 bpm'), 'Arabic welcome message includes live 50 bpm RHR');
  assert(arWelcome.includes('14.2'), 'Arabic welcome message includes live Day Strain 14.2');

  const enWelcome = generateWelcomeMessage(sampleContext, false);
  assert(enWelcome.includes('82%'), 'English welcome message includes live 82% recovery');
  assert(enWelcome.includes('Green Zone'), 'English welcome message identifies Green Zone');

  // Test 6 Clinical Intents via askWhoopCoach (Tier 2 Offline Clinical Engine)
  const trainingQueryAr = await askWhoopCoach('كيف أتمرن اليوم بناءً على طاقتي؟', sampleContext);
  assert(
    trainingQueryAr.source === 'offline_engine',
    'Fallback to offline engine operates with zero network dependencies'
  );
  assert(
    trainingQueryAr.intentDetected.startsWith('TRAINING'),
    `Training intent recognized (Got: ${trainingQueryAr.intentDetected})`
  );
  assert(
    trainingQueryAr.text.includes('المنطقة الخضراء') || trainingQueryAr.text.includes('82%'),
    'Training advice cites user real recovery numbers'
  );

  const sleepQueryEn = await askWhoopCoach('Analyze my sleep stages and tell me when to sleep tonight', sampleContext);
  assert(
    sleepQueryEn.intentDetected === 'SLEEP_ANALYSIS',
    `Sleep & circadian intent recognized (Got: ${sleepQueryEn.intentDetected})`
  );
  assert(
    sleepQueryEn.text.includes('hours') || sleepQueryEn.text.includes('Sleep'),
    'Sleep analysis provides comprehensive circadian coaching'
  );

  const hrvQueryAr = await askWhoopCoach('ماذا تعني قراءة الـ HRV والنبض اليوم؟', sampleContext);
  assert(
    hrvQueryAr.intentDetected === 'AUTONOMIC_METRICS',
    `HRV autonomic intent recognized (Got: ${hrvQueryAr.intentDetected})`
  );
  assert(
    hrvQueryAr.text.includes('78') && hrvQueryAr.text.includes('50'),
    'HRV analysis directly cites exact 78 ms and 50 bpm telemetry'
  );

  const strainQueryEn = await askWhoopCoach('How is my strain, steps, and calories for today?', sampleContext);
  assert(
    strainQueryEn.intentDetected === 'STRAIN_AND_ACTIVITY',
    `Strain/Steps intent recognized (Got: ${strainQueryEn.intentDetected})`
  );
  assert(
    strainQueryEn.text.includes('14.2') && strainQueryEn.text.includes('8,420'),
    'Strain debrief cites 14.2 strain and 8,420 steps'
  );

  const nutritionQueryAr = await askWhoopCoach('أشعر بالإرهاق وأريد نصائح للاستشفاء والتغذية', sampleContext);
  assert(
    nutritionQueryAr.intentDetected === 'RECOVERY_NUTRITION',
    `Recovery & nutrition intent recognized (Got: ${nutritionQueryAr.intentDetected})`
  );

  const generalQueryEn = await askWhoopCoach('Can you give me an overall health summary?', sampleContext);
  assert(
    generalQueryEn.intentDetected === 'GENERAL_SYNTHESIS',
    `General synthesis query recognized (Got: ${generalQueryEn.intentDetected})`
  );

  // ====================================================================
  // SUMMARY
  // ====================================================================
  console.log('\n====================================================================');
  console.log('VERIFICATION SUMMARY:');
  console.log(`  Total Assertions:    ${totalAssertions}`);
  console.log(`  Passed Assertions:   ${passedAssertions}`);
  console.log(`  Failed Assertions:   ${failedAssertions}`);
  console.log('====================================================================\n');

  if (failedAssertions > 0) {
    console.error(`FAILED: ${failedAssertions} assertions failed!`);
    process.exit(1);
  } else {
    console.log('ALL PHYSIOLOGICAL & ALGORITHMIC INTEGRITY TESTS PASSED WITH 0 ERRORS! (100% HEALTHY)\n');
    process.exit(0);
  }
}

runPhysiologicalAudit().catch((err) => {
  console.error('Fatal error during physiological audit:', err);
  process.exit(1);
});
