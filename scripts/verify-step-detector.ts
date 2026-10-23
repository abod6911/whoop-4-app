/**
 * verify-step-detector.ts
 * 
 * Comprehensive Unit & Integration Verification Suite for StepDetector and BLE Telemetry Pipeline.
 */

import { StepDetector } from '../src/services/StepDetector';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS ${message}`);
  } else {
    failedAssertions++;
    console.error(`  ✗ FAIL ${message}`);
  }
}

console.log('####################################################################');
console.log('# STEP DETECTOR & REAL-TIME IMU TELEMETRY: VERIFICATION RUN        #');
console.log('####################################################################\n');

// -----------------------------------------------------------------------------
// TEST 1: Stationary Baseline (Gravity only ~1.0 G) -> 0 Steps Detected
// -----------------------------------------------------------------------------
console.log('====================================================================');
console.log('TEST 1: Stationary Baseline (No steps during resting)');
console.log('====================================================================');
{
  const detector = new StepDetector(0);
  let now = 1000000;

  // Simulate 50 samples of resting wrist: x=0, y=0.2, z=0.98 (~1.0 G)
  let stepsCounted = 0;
  for (let i = 0; i < 50; i++) {
    now += 50; // 20 Hz sample rate
    const detected = detector.processSample({ x: 0.01, y: 0.20, z: 0.98, timestamp: now });
    if (detected) stepsCounted++;
  }

  assert(detector.getSteps() === 0, `Stationary samples produced zero steps (Got: ${detector.getSteps()})`);
  assert(detector.getCadence() === 0, `Stationary cadence is 0 SPM (Got: ${detector.getCadence()})`);
  assert(stepsCounted === 0, `processSample returned false on all resting samples`);
}

// -----------------------------------------------------------------------------
// TEST 2: Sub-threshold Vibration Rejection (< 1.12 G)
// -----------------------------------------------------------------------------
console.log('\n====================================================================');
console.log('TEST 2: Sub-threshold Vibration Rejection (< 1.12 G relaxed threshold)');
console.log('====================================================================');
{
  const detector = new StepDetector(0);
  let now = 2000000;

  // Simulate small hand vibrations / typing: peaks reach 1.07 G (< 1.12 G threshold)
  let stepsCounted = 0;
  for (let cycle = 0; cycle < 10; cycle++) {
    for (let i = 0; i < 10; i++) {
      now += 50;
      const mag = 1.0 + 0.07 * Math.sin((i / 10) * Math.PI); // max 1.07 G
      const detected = detector.processSample({ x: 0, y: 0, z: mag, timestamp: now });
      if (detected) stepsCounted++;
    }
  }

  assert(detector.getSteps() === 0, `Sub-threshold vibrations (<1.12 G) produced 0 steps (Got: ${detector.getSteps()})`);
}

// -----------------------------------------------------------------------------
// TEST 3: Legitimate Walking Locomotion (120 SPM, 500 ms step interval, 1.15G - 1.8G)
// -----------------------------------------------------------------------------
console.log('\n====================================================================');
console.log('TEST 3: Legitimate Walking Locomotion with Relaxed Threshold (120 SPM, 500 ms)');
console.log('====================================================================');
{
  const detector = new StepDetector(0);
  let now = 3000000;
  const numStepsSimulated = 15;
  let stepsCounted = 0;

  // Each step is 500 ms long (10 samples @ 50ms = 20Hz), reaching subtle wrist peak of ~1.25 - 1.45 G
  for (let s = 0; s < numStepsSimulated; s++) {
    for (let sample = 0; sample < 10; sample++) {
      now += 50;
      // Parabolic peak in middle of stride (sample 4-5)
      const peakFactor = Math.sin((sample / 10) * Math.PI);
      const accelZ = 1.0 + 0.45 * peakFactor; // Peaks at ~1.45 G (easily captured by 1.12 G threshold)
      const accelX = 0.15 * peakFactor;
      const accelY = 0.20 * peakFactor;

      const detected = detector.processSample({ x: accelX, y: accelY, z: accelZ, timestamp: now });
      if (detected) stepsCounted++;
    }
  }

  assert(detector.getSteps() >= 13 && detector.getSteps() <= 16, `Detected correct step count for 15 strides (Got: ${detector.getSteps()})`);
  assert(detector.getCadence() >= 100 && detector.getCadence() <= 135, `Cadence evaluates to realistic human walking range (Got: ${detector.getCadence()} SPM)`);
}

// -----------------------------------------------------------------------------
// TEST 4: Refractory Window Gating (< 220 ms Noise Rejection)
// -----------------------------------------------------------------------------
console.log('\n====================================================================');
console.log('TEST 4: Refractory Window Gating (Rejects rapid mechanical noise < 220 ms)');
console.log('====================================================================');
{
  const detector = new StepDetector(0);
  let now = 4000000;

  // Stride 1: Valid physical step waveform over 200ms
  detector.processSample({ x: 0, y: 0, z: 1.0, timestamp: now });
  now += 50;
  detector.processSample({ x: 0, y: 0, z: 1.3, timestamp: now });
  now += 50;
  detector.processSample({ x: 0, y: 0, z: 1.6, timestamp: now });
  now += 50;
  detector.processSample({ x: 0, y: 0, z: 1.4, timestamp: now });
  now += 50;
  const step1 = detector.processSample({ x: 0, y: 0, z: 1.0, timestamp: now });
  assert(detector.getSteps() === 1, `First peak registered as step 1`);

  // Sudden high-frequency vibration spike 100 ms later (< 220 ms refractory window)
  now += 50;
  detector.processSample({ x: 0, y: 0, z: 1.8, timestamp: now });
  now += 50;
  const step2 = detector.processSample({ x: 0, y: 0, z: 1.0, timestamp: now });

  assert(step2 === false, `Spike within 100ms rejected by refractory gate (< 220 ms)`);
  assert(detector.getSteps() === 1, `Step count remained 1 despite rapid vibration`);

  // Valid step arriving 450 ms later (> 220 ms)
  now += 350;
  detector.processSample({ x: 0, y: 0, z: 1.0, timestamp: now });
  now += 50;
  detector.processSample({ x: 0, y: 0, z: 1.3, timestamp: now });
  now += 50;
  detector.processSample({ x: 0, y: 0, z: 1.6, timestamp: now });
  now += 50;
  detector.processSample({ x: 0, y: 0, z: 1.4, timestamp: now });
  now += 50;
  const step3 = detector.processSample({ x: 0, y: 0, z: 1.0, timestamp: now });

  assert(detector.getSteps() === 2, `Valid stride after refractory period registered as step 2`);
}

// -----------------------------------------------------------------------------
// TEST 5: Diagnostic Fallback & recordManualStep()
// -----------------------------------------------------------------------------
console.log('\n====================================================================');
console.log('TEST 5: Diagnostic Fallback & recordManualStep()');
console.log('====================================================================');
{
  const detector = new StepDetector(100);
  assert(detector.getSteps() === 100, `Initial steps set to 100`);

  detector.recordManualStep();
  assert(detector.getSteps() === 101, `recordManualStep() incremented step counter to 101`);
  assert(detector.getCadence() === 108, `recordManualStep() set realistic walking cadence (108 SPM)`);

  detector.recordManualStep();
  assert(detector.getSteps() === 102, `Second recordManualStep() incremented step counter to 102`);
}

// -----------------------------------------------------------------------------
// TEST 6: State Reconciliation, Inactivity Decay & Reset
// -----------------------------------------------------------------------------
console.log('\n====================================================================');
console.log('TEST 6: State Reconciliation, Inactivity Decay & Reset');
console.log('====================================================================');
{
  const detector = new StepDetector(500);
  assert(detector.getSteps() === 500, `Initialized with 500 saved steps`);

  detector.setSteps(1250);
  assert(detector.getSteps() === 1250, `setSteps updated steps to 1250`);

  // Simulate 4 seconds of stillness
  detector.processSample({ x: 0, y: 0, z: 1.0, timestamp: Date.now() + 4000 });
  assert(detector.getCadence() === 0, `Cadence decayed to 0 after > 3 seconds of inactivity`);

  detector.reset();
  assert(detector.getSteps() === 0, `reset() zeroed the step counter`);
  assert(detector.getCadence() === 0, `reset() zeroed the cadence`);
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n====================================================================');
console.log('VERIFICATION SUMMARY:');
console.log(`  Total Assertions:    ${totalAssertions}`);
console.log(`  Passed Assertions:   ${passedAssertions}`);
console.log(`  Failed Assertions:   ${failedAssertions}`);
console.log('====================================================================');

if (failedAssertions > 0) {
  process.exit(1);
} else {
  console.log('\nALL STEP DETECTOR DSP TESTS PASSED WITH 0 ERRORS! (100% HEALTHY)\n');
}
