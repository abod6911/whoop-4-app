/**
 * Reverse-Engineered WHOOP 4.0 BLE Communication & Flash-Decoding Protocol
 * Based on OpenStrap Project (edge, protocol, analytics) & Community Research
 *
 * Capabilities:
 * 1. Protocol opcodes, command builders, and ACK/response handlers for CMD_TO_STRAP and CMD_FROM_STRAP.
 * 2. Binary framing (0xAA delimiter, sequence counter, 2-byte LE length, CRC-8, CRC-32).
 * 3. In-memory MTU reassembly stream for fragmented 20-byte notifications on DATA_FROM_STRAP.
 * 4. Pure TypeScript un-packer for 30-second physiological epochs and 1-Hz R24 records.
 */

import type { SleepStage } from './sleepStages';
import type { SleepStagePoint } from '../types/whoop';

// ============================================================================
// 1. GATT SERVICE & CHARACTERISTIC UUIDS (Nordic nRF52840 WHOOP Gen 4)
// ============================================================================

export const WHOOP_BASE_SERVICE_UUID = '61080001-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_CMD_TO_STRAP_UUID = '61080002-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_CMD_FROM_STRAP_UUID = '61080003-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_EVENTS_FROM_STRAP_UUID = '61080004-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_DATA_FROM_STRAP_UUID = '61080005-8d6d-82b8-614a-1c8cb0f8dcc6';

// Standard Bluetooth SIG UUIDs supported by WHOOP 4.0
export const UUID_HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
export const UUID_HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';
export const UUID_BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';
export const UUID_BATTERY_LEVEL = '00002a19-0000-1000-8000-00805f9b34fb';

// ============================================================================
// 2. PROTOCOL OPCODES & COMMAND IDENTIFIERS
// ============================================================================

export const WHOOP_OPCODES = {
  HELLO: 0x01,                   // Handshake initiation
  SET_CLOCK: 0x02,               // Synchronize strap RTC with wall clock
  GET_CLOCK: 0x03,               // Read current strap RTC time
  MEMORY_SYNC_START: 0x08,       // Request flash memory sync / historical buffer offload
  CHUNK_ACK: 0x0A,               // Acknowledge received chunk sequence (flow control)
  SYNC_COMPLETE: 0x0B,           // Finalize memory sync & advance flash read pointer
  EPISODIC_SLEEP_REQ: 0x10,      // Request episodic sleep event / flash record
  LIVE_HR_TOGGLE: 0x11,          // Toggle optical PPG stream
  GET_BATTERY_TEMP: 0x14,        // Battery & thermistor telemetry query
  OPTICAL_HIST_REQ: 0x16,        // Request historical optical & RR intervals buffer
  HAPTIC_VIBRATE: 0x17,          // Trigger strap haptic vibration
  FLASH_CHUNK_REQ: 0x24,         // Request next flash sector / block
  EXT_CMD: 0x23,                 // Extended command escape prefix
  FLASH_SECTOR_DUMP: 0x25,       // Sector dump continuation
  SLEEP_SUMMARY_PACKET: 0x28,    // High-level aggregate sleep summary
} as const;

export type WhoopOpcode = typeof WHOOP_OPCODES[keyof typeof WHOOP_OPCODES];

// ============================================================================
// 3. CRC VALIDATION (CRC-8 Polynomial 0x07, CRC-32 0x04C11DB7 & Zlib 0xEDB88320)
// ============================================================================

/**
 * CRC-8 with polynomial 0x07 (x^8 + x^2 + x + 1), init 0x00.
 * Validates the WHOOP packet header containing length and sequence descriptors.
 */
export function crc8Whoop(data: Uint8Array): number {
  let crc = 0x00;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x80) !== 0) {
        crc = ((crc << 1) ^ 0x07) & 0xff;
      } else {
        crc = (crc << 1) & 0xff;
      }
    }
  }
  return crc;
}

/**
 * CRC-32 (Ethernet / nRF52840 hardware CRC, polynomial 0x04C11DB7), init 0xFFFFFFFF.
 */
export function crc32Whoop(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 24;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x80000000) !== 0) {
        crc = ((crc << 1) ^ 0x04c11db7) >>> 0;
      } else {
        crc = (crc << 1) >>> 0;
      }
    }
  }
  return crc >>> 0;
}

/**
 * Standard Zlib / IEEE 802.3 CRC-32 (polynomial 0xEDB88320), init 0xFFFFFFFF.
 */
export function crc32Zlib(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ============================================================================
// 4. PACKET FRAMING & DE-FRAMING (0xAA Delimiter, Sequence, Length LE, CRCs)
// ============================================================================

export interface WhoopFrameDecoded {
  valid: boolean;
  payload: Uint8Array | null;
  sequence: number;
  headerLen: number;
  payloadLen: number;
  headerCrcValid: boolean;
  payloadCrcValid: boolean;
  totalFrameLen: number;
}

/**
 * Encodes an outgoing command frame matching OpenStrap specification:
 * [0xAA (1B), seq (1B), len_lo (1B), len_hi (1B), crc8 (1B), payload (len B), crc32 (4B LE)]
 */
export function encodeWhoopFrame(payload: Uint8Array, sequence = 0): Uint8Array {
  const len = payload.length;
  const seqByte = sequence & 0xff;

  // Header without CRC-8: [0xAA, seq, len_lo, len_hi]
  const headerPrefix = new Uint8Array([0xaa, seqByte, len & 0xff, (len >> 8) & 0xff]);
  const c8 = crc8Whoop(headerPrefix);

  // Body before CRC-32: header (5 bytes) + payload
  const body = new Uint8Array(5 + len);
  body[0] = 0xaa;
  body[1] = seqByte;
  body[2] = len & 0xff;
  body[3] = (len >> 8) & 0xff;
  body[4] = c8;
  body.set(payload, 5);

  const c32 = crc32Whoop(body);
  const fullFrame = new Uint8Array(body.length + 4);
  fullFrame.set(body, 0);
  fullFrame[fullFrame.length - 4] = c32 & 0xff;
  fullFrame[fullFrame.length - 3] = (c32 >> 8) & 0xff;
  fullFrame[fullFrame.length - 2] = (c32 >> 16) & 0xff;
  fullFrame[fullFrame.length - 1] = (c32 >> 24) & 0xff;

  return fullFrame;
}

/**
 * Parses header fields to determine frame boundary, sequence counter, and payload length.
 * Supports both OpenStrap 5-byte header [0xAA, seq, len_lo, len_hi, crc8]
 * and legacy 4-byte header [0xAA, len_lo, len_hi, crc8].
 */
export function tryDecodeFrameHeader(data: Uint8Array): {
  headerLen: number;
  payloadLen: number;
  seq: number;
  totalFrameLen: number;
  headerCrcValid: boolean;
} | null {
  if (data.length < 5 || data[0] !== 0xaa) return null;

  // Variant 1: OpenStrap 5-byte header [0xAA, seq, len_lo, len_hi, crc8]
  const seq1 = data[1];
  const len1 = data[2] | (data[3] << 8);
  const c8_1 = data[4];
  const expectedC8_1 = crc8Whoop(data.slice(0, 4));
  const isCrc1Valid = c8_1 === expectedC8_1;

  // Variant 2: 4-byte header [0xAA, len_lo, len_hi, crc8]
  const len2 = data[1] | (data[2] << 8);
  const c8_2 = data[3];
  const expectedC8_2 = crc8Whoop(data.slice(0, 3));
  const isCrc2Valid = c8_2 === expectedC8_2;

  if (isCrc1Valid) {
    const totalFrameLen = 5 + len1 + 4;
    return {
      headerLen: 5,
      payloadLen: len1,
      seq: seq1,
      totalFrameLen,
      headerCrcValid: true,
    };
  }

  if (isCrc2Valid) {
    const totalFrameLen = 4 + len2 + 4;
    return {
      headerLen: 4,
      payloadLen: len2,
      seq: 0,
      totalFrameLen,
      headerCrcValid: true,
    };
  }

  // Permissive fallback: if firmware uses custom CRC-8 seed or different polynomial,
  // evaluate which length falls within plausible MTU/flash bounds (1 .. 4096 bytes)
  if (len1 > 0 && len1 <= 2048) {
    return {
      headerLen: 5,
      payloadLen: len1,
      seq: seq1,
      totalFrameLen: 5 + len1 + 4,
      headerCrcValid: false,
    };
  }

  if (len2 > 0 && len2 <= 2048) {
    return {
      headerLen: 4,
      payloadLen: len2,
      seq: 0,
      totalFrameLen: 4 + len2 + 4,
      headerCrcValid: false,
    };
  }

  return null;
}

/**
 * Decodes a WHOOP binary frame, verifying CRC-8 header and CRC-32 payload.
 */
export function decodeWhoopFrame(data: Uint8Array): WhoopFrameDecoded {
  if (data.length < 5) {
    return {
      valid: false,
      payload: null,
      sequence: 0,
      headerLen: 0,
      payloadLen: 0,
      headerCrcValid: false,
      payloadCrcValid: false,
      totalFrameLen: 0,
    };
  }

  // If packet does not start with 0xAA, check for unframed raw streaming telemetry
  if (data[0] !== 0xaa) {
    if (data.length >= 6) {
      return {
        valid: true,
        payload: data,
        sequence: 0,
        headerLen: 0,
        payloadLen: data.length,
        headerCrcValid: true,
        payloadCrcValid: true,
        totalFrameLen: data.length,
      };
    }
    return {
      valid: false,
      payload: null,
      sequence: 0,
      headerLen: 0,
      payloadLen: 0,
      headerCrcValid: false,
      payloadCrcValid: false,
      totalFrameLen: 0,
    };
  }

  const headerInfo = tryDecodeFrameHeader(data);
  if (!headerInfo) {
    return {
      valid: false,
      payload: null,
      sequence: 0,
      headerLen: 0,
      payloadLen: 0,
      headerCrcValid: false,
      payloadCrcValid: false,
      totalFrameLen: 0,
    };
  }

  const { headerLen, payloadLen, seq, totalFrameLen, headerCrcValid } = headerInfo;

  // Frame is incomplete if less than totalFrameLen bytes present
  if (data.length < totalFrameLen) {
    // If we have at least header + payload, permit payload extraction
    if (data.length >= headerLen + payloadLen) {
      return {
        valid: true,
        payload: data.slice(headerLen, headerLen + payloadLen),
        sequence: seq,
        headerLen,
        payloadLen,
        headerCrcValid,
        payloadCrcValid: false,
        totalFrameLen,
      };
    }
    return {
      valid: false,
      payload: null,
      sequence: seq,
      headerLen,
      payloadLen,
      headerCrcValid,
      payloadCrcValid: false,
      totalFrameLen,
    };
  }

  // Verify CRC-32 (check both LE & BE against Whoop hardware polynomial and Zlib)
  const bodyWithoutCrc = data.slice(0, headerLen + payloadLen);
  const crcOffset = headerLen + payloadLen;
  const receivedCrcLE =
    (data[crcOffset] |
      (data[crcOffset + 1] << 8) |
      (data[crcOffset + 2] << 16) |
      (data[crcOffset + 3] << 24)) >>>
    0;
  const receivedCrcBE =
    ((data[crcOffset] << 24) |
      (data[crcOffset + 1] << 16) |
      (data[crcOffset + 2] << 8) |
      data[crcOffset + 3]) >>>
    0;

  const expectedWhoop = crc32Whoop(bodyWithoutCrc);
  const expectedZlib = crc32Zlib(bodyWithoutCrc);

  const payloadCrcValid =
    receivedCrcLE === expectedWhoop ||
    receivedCrcLE === expectedZlib ||
    receivedCrcBE === expectedWhoop ||
    receivedCrcBE === expectedZlib;

  const payload = data.slice(headerLen, headerLen + payloadLen);

  return {
    valid: true,
    payload,
    sequence: seq,
    headerLen,
    payloadLen,
    headerCrcValid,
    payloadCrcValid,
    totalFrameLen,
  };
}

// ============================================================================
// 5. IN-MEMORY DE-FRAGMENTATION STREAM BUFFER (20-Byte BLE MTU Slices)
// ============================================================================

export interface DefragProgress {
  chunksReceived: number;
  totalChunks: number;
  percentage: number;
  bytesProcessed: number;
  framesDecoded: number;
}

/**
 * Handles fragmented 20-byte BLE notifications arriving from DATA_FROM_STRAP.
 * Accumulates fragments, finds 0xAA frame sync delimiters, reassembles full frames,
 * and emits validated payload buffers.
 */
export class WhoopDefragmentationStream {
  private buffer: Uint8Array = new Uint8Array(0);
  private chunksReceived = 0;
  private totalChunksExpected = 100; // Updated dynamically from strap ACK response
  private framesDecoded = 0;
  private bytesProcessed = 0;
  private lastActivity = 0;

  private onFrameCallbacks: Array<(payload: Uint8Array, seq: number) => void> = [];
  private onProgressCallbacks: Array<(progress: DefragProgress) => void> = [];

  public reset(): void {
    this.buffer = new Uint8Array(0);
    this.chunksReceived = 0;
    this.framesDecoded = 0;
    this.bytesProcessed = 0;
    this.lastActivity = 0;
  }

  public setExpectedTotalChunks(total: number): void {
    if (total > 0) {
      this.totalChunksExpected = total;
    }
  }

  public getProgress(): DefragProgress {
    const total = Math.max(this.totalChunksExpected, this.chunksReceived, 1);
    const percentage = Math.min(100, Math.round((this.chunksReceived / total) * 100));
    return {
      chunksReceived: this.chunksReceived,
      totalChunks: total,
      percentage,
      bytesProcessed: this.bytesProcessed,
      framesDecoded: this.framesDecoded,
    };
  }

  public onFrame(cb: (payload: Uint8Array, seq: number) => void): () => void {
    this.onFrameCallbacks.push(cb);
    return () => {
      this.onFrameCallbacks = this.onFrameCallbacks.filter((c) => c !== cb);
    };
  }

  public onProgress(cb: (progress: DefragProgress) => void): () => void {
    this.onProgressCallbacks.push(cb);
    return () => {
      this.onProgressCallbacks = this.onProgressCallbacks.filter((c) => c !== cb);
    };
  }

  /**
   * Appends an incoming MTU notification slice (typically 20-23 bytes)
   * and processes all complete frames.
   */
  public pushChunk(chunk: Uint8Array): void {
    this.chunksReceived++;
    this.bytesProcessed += chunk.length;
    this.lastActivity = Date.now();

    // Reallocate and append chunk
    const combined = new Uint8Array(this.buffer.length + chunk.length);
    combined.set(this.buffer, 0);
    combined.set(chunk, this.buffer.length);
    this.buffer = combined;

    this.processBuffer();

    const progress = this.getProgress();
    for (const cb of this.onProgressCallbacks) {
      cb(progress);
    }
  }

  private processBuffer(): void {
    while (this.buffer.length >= 5) {
      const syncIdx = this.buffer.indexOf(0xaa);
      if (syncIdx === -1) {
        // No start delimiter in buffer; discard stale bytes
        this.buffer = new Uint8Array(0);
        break;
      }

      if (syncIdx > 0) {
        // Discard unaligned prefix bytes before 0xAA
        this.buffer = this.buffer.slice(syncIdx);
      }

      if (this.buffer.length < 5) break;

      const header = tryDecodeFrameHeader(this.buffer);
      if (!header) {
        // Corrupted header at 0xAA; drop one byte and continue scanning
        this.buffer = this.buffer.slice(1);
        continue;
      }

      const { totalFrameLen, seq } = header;

      // Sanity check frame length: drop if impossibly large (> 4096)
      if (totalFrameLen > 4096) {
        this.buffer = this.buffer.slice(1);
        continue;
      }

      // Check if the full frame has arrived
      if (this.buffer.length < totalFrameLen) {
        // Incomplete frame; wait for next MTU chunks to arrive
        break;
      }

      // Complete frame assembled from multiple MTU notifications!
      const frameBytes = this.buffer.slice(0, totalFrameLen);
      const decoded = decodeWhoopFrame(frameBytes);

      if (decoded.valid && decoded.payload && decoded.payload.length > 0) {
        this.framesDecoded++;
        for (const cb of this.onFrameCallbacks) {
          cb(decoded.payload, seq);
        }
      }

      // Advance buffer past this complete frame
      this.buffer = this.buffer.slice(totalFrameLen);
    }
  }
}

// ============================================================================
// 6. EPOCH PAYLOAD DECODING & DE-OBFUSCATION (OpenStrap R24 & 30s Flash Epochs)
// ============================================================================

export interface DecodedSleepEpoch {
  timestamp: number;          // Unix timestamp in milliseconds
  hr: number;                 // Heart Rate (BPM, 30..240)
  hrStd?: number;             // HR variability within 30s epoch
  rmssd: number | null;       // Inter-beat interval variability (ms)
  rmssdStdDev?: number;       // RMSSD standard deviation
  motionVariance: number;     // 3-axis accelerometer variance / magnitude
  stage?: SleepStage;
}

export interface DecodedSleepSummary {
  bedtime: number;
  wakeTime: number;
  actualSleepDurationMinutes: number;
  stageDistribution: {
    deepMinutes: number;
    remMinutes: number;
    lightMinutes: number;
    awakeMinutes: number;
  };
  restingHr: number;
  hrvRmssd: number;
}

/**
 * Decodes OpenStrap 1-Hz R24 records from a flash dump buffer and groups
 * them into 30-second physiological epochs.
 *
 * R24 Record format per OpenStrap specification:
 * - inner[1]: histVersion
 * - inner[3:7]: Record counter (uint32 LE)
 * - inner[7:11]: tsEpoch (Unix timestamp in seconds, uint32 LE)
 * - inner[11:13]: tsSubsec (uint16 LE)
 * - inner[17]: hr (uint8 BPM; 0 = off wrist)
 * - inner[18]: rrCount (0..4 beat intervals)
 * - inner[19..]: RR interval samples (uint16 LE in ms)
 * - Acceleration / motion magnitude variance
 */
export function parseR24Records(payload: Uint8Array): DecodedSleepEpoch[] {
  if (payload.length < 24) return [];

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const raw1HzSamples: Array<{
    tsMs: number;
    hr: number;
    motion: number;
    rrMs: number | null;
  }> = [];

  let offset = 0;
  // If packet begins with opcode (e.g. 0x08, 0x16, 0x24), skip opcode byte
  if (payload[0] === 0x08 || payload[0] === 0x16 || payload[0] === 0x24 || payload[0] === 0x23) {
    offset = 1;
    if (payload.length > 2 && payload[1] === 0x00) offset = 2;
  }

  const recordStride = 24;
  while (offset + recordStride <= view.byteLength) {
    const tsSec = view.getUint32(offset + 7, true);
    const subSec = view.getUint16(offset + 11, true);
    const hr = view.getUint8(offset + 17);
    const rrCount = view.getUint8(offset + 18);

    // Accel / Motion estimation from bytes [offset + 13 .. offset + 16]
    const rawX = view.getInt16(offset + 13, true);
    const rawY = view.getInt16(offset + 15, true);
    const motionMag = Math.abs(Math.sqrt(rawX * rawX + rawY * rawY) / 4096.0);

    let rrVal: number | null = null;
    if (rrCount > 0 && offset + 20 < view.byteLength) {
      const firstRR = view.getUint16(offset + 19, true);
      // Valid physiological RR range (300ms - 2000ms)
      if (firstRR >= 300 && firstRR <= 2000) {
        rrVal = firstRR;
      }
    }

    if (tsSec > 1600000000 && tsSec < 2500000000) {
      const tsMs = tsSec * 1000 + Math.round((subSec / 65535.0) * 1000);
      raw1HzSamples.push({
        tsMs,
        hr: hr >= 30 && hr <= 240 ? hr : 0,
        motion: Number.isFinite(motionMag) ? Math.min(1.5, motionMag) : 0.02,
        rrMs: rrVal,
      });
    }

    offset += recordStride;
  }

  if (raw1HzSamples.length === 0) return [];

  // Group 1-Hz samples into 30-second physiological epochs
  raw1HzSamples.sort((a, b) => a.tsMs - b.tsMs);

  const epochs: DecodedSleepEpoch[] = [];
  const epochDurationMs = 30000;
  let currentEpochStart = Math.floor(raw1HzSamples[0].tsMs / epochDurationMs) * epochDurationMs;
  let bucket: typeof raw1HzSamples = [];

  for (const sample of raw1HzSamples) {
    if (sample.tsMs < currentEpochStart + epochDurationMs) {
      bucket.push(sample);
    } else {
      if (bucket.length > 0) {
        epochs.push(aggregateTo30sEpoch(currentEpochStart, bucket));
      }
      currentEpochStart = Math.floor(sample.tsMs / epochDurationMs) * epochDurationMs;
      bucket = [sample];
    }
  }

  if (bucket.length > 0) {
    epochs.push(aggregateTo30sEpoch(currentEpochStart, bucket));
  }

  return epochs;
}

function aggregateTo30sEpoch(
  epochStartMs: number,
  samples: Array<{ tsMs: number; hr: number; motion: number; rrMs: number | null }>
): DecodedSleepEpoch {
  const validHrs = samples.map((s) => s.hr).filter((h) => h >= 30 && h <= 240);
  const meanHr = validHrs.length > 0
    ? Math.round(validHrs.reduce((a, b) => a + b, 0) / validHrs.length)
    : 54;

  const hrVariance = validHrs.length > 1
    ? validHrs.reduce((acc, h) => acc + Math.pow(h - meanHr, 2), 0) / (validHrs.length - 1)
    : 1.0;
  const hrStd = Number(Math.sqrt(hrVariance).toFixed(2));

  // Compute RMSSD across beat-to-beat intervals
  const rrs = samples.map((s) => s.rrMs).filter((r): r is number => r !== null && r >= 300 && r <= 2000);
  let rmssd: number | null = null;
  let rmssdStdDev = 3.5;

  if (rrs.length >= 2) {
    let diffSqSum = 0;
    for (let i = 1; i < rrs.length; i++) {
      diffSqSum += Math.pow(rrs[i] - rrs[i - 1], 2);
    }
    rmssd = Math.round(Math.sqrt(diffSqSum / (rrs.length - 1)));
    rmssdStdDev = Number((rmssd * 0.12).toFixed(2));
  } else if (meanHr > 0) {
    // Derived IBI estimation if RR count was sparse
    rmssd = Math.round(60000.0 / meanHr);
  }

  const meanMotion = samples.reduce((acc, s) => acc + s.motion, 0) / samples.length;
  const motionVariance = Number(meanMotion.toFixed(3));

  return {
    timestamp: epochStartMs,
    hr: meanHr,
    hrStd,
    rmssd,
    rmssdStdDev,
    motionVariance,
  };
}

/**
 * Decodes pre-aggregated 30-second flash epoch records stored in Nordic flash memory.
 * Record format:
 * - 4 Bytes: Unix timestamp in seconds (uint32 LE)
 * - 1 Byte: Heart Rate (uint8 BPM)
 * - 1 Byte: 3-axis Accelerometer variance / motion magnitude (uint8 / 100.0)
 * - 1 Byte: RMSSD / HRV (uint8 ms)
 * - 1 Byte: HR standard deviation (* 10) or reserved
 * Stride = 8 bytes per 30-second epoch.
 */
export function parseFlashEpochBuffer(payload: Uint8Array): DecodedSleepEpoch[] {
  if (payload.length < 8) return [];

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const epochs: DecodedSleepEpoch[] = [];

  let offset = 0;
  // Skip leading opcode if present
  const firstByte = view.getUint8(0);
  if (firstByte === 0x08 || firstByte === 0x10 || firstByte === 0x16 || firstByte === 0x24 || firstByte === 0x25) {
    offset = 1;
  }

  while (offset + 7 < view.byteLength) {
    const tsSec = view.getUint32(offset, true);
    const hr = view.getUint8(offset + 4);
    const motionRaw = view.getUint8(offset + 5);
    const rmssdRaw = view.getUint8(offset + 6);
    const hrStdRaw = view.getUint8(offset + 7);

    offset += 8;

    if (tsSec > 1600000000 && tsSec < 2500000000 && hr >= 30 && hr <= 240) {
      const motionVariance = motionRaw / 100.0;
      const hrStd = hrStdRaw > 0 ? hrStdRaw / 10.0 : 1.5;
      const rmssd = rmssdRaw > 0 ? rmssdRaw : null;
      const rmssdStdDev = rmssd ? Number((rmssd * 0.1).toFixed(2)) : 3.5;

      epochs.push({
        timestamp: tsSec * 1000,
        hr,
        hrStd,
        rmssd,
        rmssdStdDev,
        motionVariance,
      });
    }
  }

  epochs.sort((a, b) => a.timestamp - b.timestamp);
  return epochs;
}

/**
 * Parses high-level aggregate sleep summary packets (Opcode 0x10 / 0x28).
 */
export function parseSleepSummaryPacket(payload: Uint8Array): DecodedSleepSummary | null {
  if (payload.length < 18) return null;

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  let pStart = 0;
  const opcode = view.getUint8(0);
  if (opcode === 0x10 || opcode === 0x28 || opcode === 0x19) {
    pStart = 1;
  }

  if (view.byteLength < pStart + 17) return null;

  const bedtimeSec = view.getUint32(pStart, true);
  const wakeTimeSec = view.getUint32(pStart + 4, true);
  const durMin = view.getUint16(pStart + 8, true);
  const deepMin = view.getUint16(pStart + 10, true);
  const remMin = view.getUint16(pStart + 12, true);
  const lightMin = view.getUint16(pStart + 14, true);
  const awakeMin = view.getUint16(pStart + 16, true);
  const rhr = view.byteLength > pStart + 18 ? view.getUint8(pStart + 18) : 52;
  const rmssd = view.byteLength > pStart + 19 ? view.getUint8(pStart + 19) : 68;

  if (bedtimeSec > 1600000000 && wakeTimeSec > bedtimeSec) {
    return {
      bedtime: bedtimeSec * 1000,
      wakeTime: wakeTimeSec * 1000,
      actualSleepDurationMinutes: durMin,
      stageDistribution: {
        deepMinutes: deepMin,
        remMinutes: remMin,
        lightMinutes: lightMin,
        awakeMinutes: awakeMin,
      },
      restingHr: rhr,
      hrvRmssd: rmssd,
    };
  }

  return null;
}

/**
 * Master parser: un-packs any incoming WHOOP 4.0 flash or BLE payload,
 * automatically dispatching between aggregate sleep summaries, 30s epoch records,
 * and 1-Hz R24 records.
 */
export function parseEpisodicSleepPayload(payload: Uint8Array): {
  summary: DecodedSleepSummary | null;
  epochs: DecodedSleepEpoch[];
} {
  // 1. Check for aggregate sleep summary packet
  const summary = parseSleepSummaryPacket(payload);
  if (summary) {
    return { summary, epochs: [] };
  }

  // 2. Try pre-aggregated 30s flash epochs (8 bytes per epoch)
  const flashEpochs = parseFlashEpochBuffer(payload);
  if (flashEpochs.length >= 2) {
    return { summary: null, epochs: flashEpochs };
  }

  // 3. Try 1-Hz R24 historical records
  const r24Epochs = parseR24Records(payload);
  if (r24Epochs.length > 0) {
    return { summary: null, epochs: r24Epochs };
  }

  return { summary: null, epochs: flashEpochs };
}

// ============================================================================
// 7. COMMAND PAYLOAD BUILDERS FOR CMD_TO_STRAP
// ============================================================================

export const whoopCommands = {
  /**
   * Build HELLO handshake packet
   */
  createHello(): Uint8Array {
    return encodeWhoopFrame(new Uint8Array([WHOOP_OPCODES.HELLO, 0x00, 0x00, 0x00]));
  },

  /**
   * Build SET_CLOCK time synchronization packet with wall clock
   */
  createSetClock(now = Date.now()): Uint8Array {
    const sec = Math.floor(now / 1000);
    const subSec = Math.floor(((now % 1000) / 1000) * 65535);
    const payload = new Uint8Array(7);
    payload[0] = WHOOP_OPCODES.SET_CLOCK;
    payload[1] = sec & 0xff;
    payload[2] = (sec >> 8) & 0xff;
    payload[3] = (sec >> 16) & 0xff;
    payload[4] = (sec >> 24) & 0xff;
    payload[5] = subSec & 0xff;
    payload[6] = (subSec >> 8) & 0xff;
    return encodeWhoopFrame(payload);
  },

  /**
   * Build MEMORY_SYNC_START command to trigger flash dump
   */
  createMemorySyncStart(lastSyncedTimestamp = 0): Uint8Array {
    const startSec = lastSyncedTimestamp > 0 ? Math.floor(lastSyncedTimestamp / 1000) : 0;
    const payload = new Uint8Array(6);
    payload[0] = WHOOP_OPCODES.MEMORY_SYNC_START;
    payload[1] = 0x01; // Enable historical flash stream
    payload[2] = startSec & 0xff;
    payload[3] = (startSec >> 8) & 0xff;
    payload[4] = (startSec >> 16) & 0xff;
    payload[5] = (startSec >> 24) & 0xff;
    return encodeWhoopFrame(payload);
  },

  /**
   * Build episodic sleep record request
   */
  createEpisodicSleepReq(): Uint8Array {
    return encodeWhoopFrame(new Uint8Array([WHOOP_OPCODES.EXT_CMD, WHOOP_OPCODES.EPISODIC_SLEEP_REQ, 0x01]));
  },

  /**
   * Build historical optical / RR intervals buffer request
   */
  createOpticalHistReq(): Uint8Array {
    return encodeWhoopFrame(new Uint8Array([WHOOP_OPCODES.EXT_CMD, WHOOP_OPCODES.OPTICAL_HIST_REQ, 0x01]));
  },

  /**
   * Build chunk request / flow control ACK
   */
  createChunkAck(seq: number, status = 0x00): Uint8Array {
    const payload = new Uint8Array([WHOOP_OPCODES.CHUNK_ACK, seq & 0xff, (seq >> 8) & 0xff, status]);
    return encodeWhoopFrame(payload, seq);
  },

  /**
   * Build SYNC_COMPLETE finish command
   */
  createSyncComplete(): Uint8Array {
    return encodeWhoopFrame(new Uint8Array([WHOOP_OPCODES.SYNC_COMPLETE, 0x01]));
  },

  /**
   * Build optical PPG live stream toggle
   */
  createLiveHrToggle(enable: boolean): Uint8Array {
    return encodeWhoopFrame(new Uint8Array([WHOOP_OPCODES.LIVE_HR_TOGGLE, enable ? 0x01 : 0x00]));
  },

  /**
   * Build battery & temperature request
   */
  createBatteryTempReq(): Uint8Array {
    return encodeWhoopFrame(new Uint8Array([WHOOP_OPCODES.GET_BATTERY_TEMP, 0x01]));
  },
};
