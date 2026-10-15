import type { HeartRateMeasurement, DeviceMetadata } from '../types/whoop';
import { whoopBLE } from './WhoopBLEManager';

export type SimulatorState = 'resting' | 'workout' | 'recovery_test' | 'sleep';

export class WhoopSimulator {
  private isRunning = false;
  private timer: number | null = null;
  private mode: SimulatorState = 'resting';
  private targetHr = 62;
  private currentHr = 62;
  private breathPhase = 0; // For Respiratory Sinus Arrhythmia (RSA)
  private workoutSeconds = 0;
  private batteryLevel = 88;

  private onSampleCallbacks: Set<(measurement: HeartRateMeasurement) => void> = new Set();
  private onStateCallbacks: Set<(running: boolean, mode: SimulatorState) => void> = new Set();

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getMode(): SimulatorState {
    return this.mode;
  }

  public setMode(mode: SimulatorState): void {
    this.mode = mode;
    if (mode === 'resting') this.targetHr = 58;
    if (mode === 'workout') this.targetHr = 158;
    if (mode === 'sleep') this.targetHr = 49;
    if (mode === 'recovery_test') this.targetHr = 54;
    this.emitState();
  }

  public onSample(cb: (m: HeartRateMeasurement) => void): () => void {
    this.onSampleCallbacks.add(cb);
    return () => this.onSampleCallbacks.delete(cb);
  }

  public onStateChange(cb: (running: boolean, mode: SimulatorState) => void): () => void {
    this.onStateCallbacks.add(cb);
    return () => this.onStateCallbacks.delete(cb);
  }

  private emitState(): void {
    this.onStateCallbacks.forEach((cb) => cb(this.isRunning, this.mode));
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.workoutSeconds = 0;
    this.emitState();

    this.timer = window.setInterval(() => {
      this.tick();
    }, 1000);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emitState();
  }

  private tick(): void {
    this.workoutSeconds++;
    this.breathPhase += 0.25; // ~5 second respiratory cycle

    // Dynamic HR Target Adjustment
    if (this.mode === 'workout') {
      const cycle = (this.workoutSeconds % 180) / 180;
      if (cycle < 0.3) {
        this.targetHr = 135 + Math.sin(cycle * Math.PI) * 20; // Warmup / Z2-Z3
      } else if (cycle < 0.7) {
        this.targetHr = 160 + Math.sin((cycle - 0.3) * Math.PI * 2.5) * 18; // High intensity Z4-Z5
      } else {
        this.targetHr = 142 - Math.sin((cycle - 0.7) * Math.PI) * 15; // Recovery interval
      }
    } else if (this.mode === 'sleep') {
      this.targetHr = 48 + Math.sin(this.workoutSeconds * 0.05) * 4;
    } else if (this.mode === 'recovery_test') {
      this.targetHr = 54 + Math.sin(this.breathPhase * 0.8) * 5;
    } else {
      this.targetHr = 60 + Math.sin(this.workoutSeconds * 0.08) * 3;
    }

    const step = (this.targetHr - this.currentHr) * 0.25;
    this.currentHr += step;

    // Apply Respiratory Sinus Arrhythmia (RSA)
    const rsaAmplitude = this.mode === 'workout' ? 1.5 : 4.5;
    const rsaBpm = Math.sin(this.breathPhase) * rsaAmplitude;
    const finalBpm = Math.round(Math.max(40, Math.min(205, this.currentHr + rsaBpm + (Math.random() * 2 - 1))));

    // Calculate natural RR intervals based on the current BPM and RSA modulation
    const meanRR = (60.0 / finalBpm) * 1000.0;
    const hrvVariation = (Math.random() - 0.5) * (this.mode === 'sleep' ? 90 : this.mode === 'workout' ? 18 : 65);
    const rr1 = Math.round(meanRR + hrvVariation);
    const rr2 = Math.round(meanRR - hrvVariation * 0.85);

    const rrIntervals = [Math.max(320, Math.min(1800, rr1)), Math.max(320, Math.min(1800, rr2))];

    // Build realistic Bluetooth SIG 0x2A37 DataView packet
    const buffer = new ArrayBuffer(6);
    const view = new DataView(buffer);
    view.setUint8(0, 0x16); // Flags: UINT8 HR, RR present
    view.setUint8(1, finalBpm);

    const rawRR1 = Math.round((rrIntervals[0] / 1000.0) * 1024.0);
    const rawRR2 = Math.round((rrIntervals[1] / 1000.0) * 1024.0);
    view.setUint16(2, rawRR1, true);
    view.setUint16(4, rawRR2, true);

    const measurement = whoopBLE.parseHeartRatePacket(view);

    if (this.workoutSeconds % 120 === 0 && this.batteryLevel > 5) {
      this.batteryLevel -= 1;
    }

    this.onSampleCallbacks.forEach((cb) => cb(measurement));
  }

  public getSimulatedMetadata(): DeviceMetadata {
    return {
      name: 'WHOOP 4.0 (Simulated)',
      id: 'SIM-WHOOP-4.0-PRO',
      batteryLevel: this.batteryLevel,
      firmwareRevision: '41.14.2.0',
      hardwareRevision: 'WHOOP 4.0 REV B',
      serialNumber: 'WHP4-9981A7F2',
      manufacturerName: 'Whoop Inc.',
      connected: this.isRunning,
      connecting: false,
    };
  }
}

export const whoopSimulator = new WhoopSimulator();
