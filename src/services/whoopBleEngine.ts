/// <reference types="web-bluetooth" />
import { Capacitor } from '@capacitor/core';
import { BleClient } from '@capacitor-community/bluetooth-le';
import type {
  HeartRateMeasurement,
  DeviceMetadata,
  GattServiceInfo,
  GattCharacteristicInfo,
  RawBlePacket,
} from '../types/whoop';
import { storageService } from './StorageService';
import { notificationEngine } from './notificationEngine';
import { pedometerEngine } from './pedometerEngine';
import { biometricEngine } from '../utils/biometricEngine';

// Standard 16-bit UUIDs normalized to 128-bit
export const UUID_HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
export const UUID_HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';
export const UUID_BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';
export const UUID_BATTERY_LEVEL = '00002a19-0000-1000-8000-00805f9b34fb';
export const UUID_BATTERY_POWER_STATE = '00002a1a-0000-1000-8000-00805f9b34fb';
export const UUID_DEVICE_INFO_SERVICE = '0000180a-0000-1000-8000-00805f9b34fb';
export const UUID_SERIAL_NUMBER = '00002a25-0000-1000-8000-00805f9b34fb';
export const UUID_FIRMWARE_REVISION = '00002a26-0000-1000-8000-00805f9b34fb';
export const UUID_HARDWARE_REVISION = '00002a27-0000-1000-8000-00805f9b34fb';
export const UUID_MANUFACTURER_NAME = '00002a29-0000-1000-8000-00805f9b34fb';
export const UUID_MODEL_NUMBER = '00002a24-0000-1000-8000-00805f9b34fb';

// Health Thermometer & Pulse Oximeter Services
export const UUID_HEALTH_THERMOMETER_SERVICE = '00001809-0000-1000-8000-00805f9b34fb';
export const UUID_TEMPERATURE_MEASUREMENT = '00002a1c-0000-1000-8000-00805f9b34fb';
export const UUID_PULSE_OXIMETER_SERVICE = '00001822-0000-1000-8000-00805f9b34fb';
export const UUID_PLX_CONTINUOUS = '00002a5f-0000-1000-8000-00805f9b34fb';
export const UUID_PLX_SPOT_CHECK = '00002a5e-0000-1000-8000-00805f9b34fb';

// WHOOP 4.0 Proprietary Gen4 128-bit Base UUIDs
export const WHOOP_BASE_SERVICE_UUID = '61080001-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_CMD_TO_STRAP_UUID = '61080002-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_CMD_FROM_STRAP_UUID = '61080003-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_EVENTS_FROM_STRAP_UUID = '61080004-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_DATA_FROM_STRAP_UUID = '61080005-8d6d-82b8-614a-1c8cb0f8dcc6';
export const NORDIC_DFU_SERVICE_UUID = '0000fe59-0000-1000-8000-00805f9b34fb';

const KNOWN_UUID_NAMES: Record<string, string> = {
  [UUID_HEART_RATE_SERVICE]: 'Heart Rate Service',
  [UUID_HEART_RATE_MEASUREMENT]: 'Heart Rate Measurement',
  [UUID_BATTERY_SERVICE]: 'Battery Service',
  [UUID_BATTERY_LEVEL]: 'Battery Level',
  [UUID_BATTERY_POWER_STATE]: 'Battery Power State',
  [UUID_DEVICE_INFO_SERVICE]: 'Device Information Service',
  [UUID_SERIAL_NUMBER]: 'Serial Number',
  [UUID_FIRMWARE_REVISION]: 'Firmware Revision',
  [UUID_HARDWARE_REVISION]: 'Hardware Revision',
  [UUID_MANUFACTURER_NAME]: 'Manufacturer Name',
  [UUID_MODEL_NUMBER]: 'Model Number',
  [WHOOP_BASE_SERVICE_UUID]: 'WHOOP 4.0 Core Gen4 Service',
  [WHOOP_CMD_TO_STRAP_UUID]: 'CMD_TO_STRAP (Write Command)',
  [WHOOP_CMD_FROM_STRAP_UUID]: 'CMD_FROM_STRAP (Status & Frame Telemetry)',
  [WHOOP_EVENTS_FROM_STRAP_UUID]: 'EVENTS_FROM_STRAP (Wrist / Charging / Tap)',
  [WHOOP_DATA_FROM_STRAP_UUID]: 'DATA_FROM_STRAP (PPG / Accelerometer Stream)',
  [NORDIC_DFU_SERVICE_UUID]: 'Nordic Secure DFU',
};

export type HeartRateCallback = (data: HeartRateMeasurement) => void;
export type BatteryCallback = (level: number) => void;
export type MetadataCallback = (meta: DeviceMetadata) => void;
export type PacketCallback = (packet: RawBlePacket) => void;
export type GattTreeCallback = (services: GattServiceInfo[]) => void;
export type ErrorCallback = (error: string) => void;

// --- WHOOP 4.0 CRC & Binary Framing Protocol (Polynomial 0x04C11DB7) ---
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

export function encodeWhoopFrame(payload: Uint8Array): Uint8Array {
  const len = payload.length;
  const header = new Uint8Array([0xaa, len & 0xff, (len >> 8) & 0xff]);
  const c8 = crc8Whoop(header);
  const frameWithoutCrc32 = new Uint8Array(1 + 2 + 1 + len);
  frameWithoutCrc32[0] = 0xaa;
  frameWithoutCrc32[1] = len & 0xff;
  frameWithoutCrc32[2] = (len >> 8) & 0xff;
  frameWithoutCrc32[3] = c8;
  frameWithoutCrc32.set(payload, 4);

  const c32 = crc32Whoop(frameWithoutCrc32);
  const fullFrame = new Uint8Array(frameWithoutCrc32.length + 4);
  fullFrame.set(frameWithoutCrc32, 0);
  fullFrame[fullFrame.length - 4] = c32 & 0xff;
  fullFrame[fullFrame.length - 3] = (c32 >> 8) & 0xff;
  fullFrame[fullFrame.length - 2] = (c32 >> 16) & 0xff;
  fullFrame[fullFrame.length - 1] = (c32 >> 24) & 0xff;
  return fullFrame;
}

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

export function decodeWhoopFrame(data: Uint8Array): { valid: boolean; payload: Uint8Array | null } {
  if (data.length < 8) return { valid: false, payload: null };
  if (data[0] !== 0xaa) return { valid: false, payload: null };
  const len = data[1] | (data[2] << 8);
  if (data.length < 4 + len + 4) return { valid: false, payload: null };

  // 1. Strict CRC-8 check on 3-byte header [0xaa, len_lo, len_hi]
  const headerCrc8 = crc8Whoop(data.slice(0, 3));
  if (headerCrc8 !== data[3]) {
    return { valid: false, payload: null };
  }

  // 2. Strict CRC-32 check on frame without trailing CRC bytes
  const frameBody = data.slice(0, 4 + len);
  const offset = 4 + len;
  const receivedCrcLE =
    (data[offset] |
      (data[offset + 1] << 8) |
      (data[offset + 2] << 16) |
      (data[offset + 3] << 24)) >>>
    0;
  const receivedCrcBE =
    ((data[offset] << 24) |
      (data[offset + 1] << 16) |
      (data[offset + 2] << 8) |
      data[offset + 3]) >>>
    0;

  const expectedWhoop = crc32Whoop(frameBody);
  const expectedZlib = crc32Zlib(frameBody);

  const crcOk =
    receivedCrcLE === expectedWhoop ||
    receivedCrcLE === expectedZlib ||
    receivedCrcBE === expectedWhoop ||
    receivedCrcBE === expectedZlib;

  if (!crcOk) {
    return { valid: false, payload: null };
  }

  const payload = data.slice(4, 4 + len);
  return { valid: true, payload };
}

export class WhoopBleEngine {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private batteryPollingInterval: number | null = null;

  // Active characteristics map
  private activeCharacteristics = new Map<string, BluetoothRemoteGATTCharacteristic>();

  // Reconnection and Permitted Devices State
  private isManualDisconnect = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private reconnectTimeout: number | null = null;
  private permittedDevices: BluetoothDevice[] = [];

  // Callbacks
  private onHeartRateCallbacks: Set<HeartRateCallback> = new Set();
  private onBatteryCallbacks: Set<BatteryCallback> = new Set();
  private onMetadataCallbacks: Set<MetadataCallback> = new Set();
  private onPacketCallbacks: Set<PacketCallback> = new Set();
  private onGattTreeCallbacks: Set<GattTreeCallback> = new Set();
  private onErrorCallbacks: Set<ErrorCallback> = new Set();

  // Real Hardware Metadata (initial: completely disconnected)
  private metadata: DeviceMetadata = {
    name: 'WHOOP 4.0',
    id: '',
    batteryLevel: null,
    isCharging: false,
    chargingStatusText: '',
    firmwareRevision: null,
    hardwareRevision: null,
    serialNumber: null,
    manufacturerName: null,
    modelNumber: null,
    connected: false,
    connecting: false,
    onWrist: null,
    contactSupported: false,
    contactDetected: false,
    rssi: null,
    packetsPerMinute: 0,
    lastPacketTimestamp: null,
  };

  private gattTree: GattServiceInfo[] = [];

  // Packet & Telemetry Ingestion Rate Counters
  private packetCounter = 0;
  private packetTimestamps: number[] = [];

  // Rolling Battery History for Dynamic Charging State Fallback (90s window)
  private batteryLevelHistory: Array<{ timestamp: number; level: number }> = [];

  // Native Capacitor Bluetooth LE state
  private nativeDeviceId: string | null = null;
  private isNativeInitialized = false;

  constructor() {
    this.handleDisconnected = this.handleDisconnected.bind(this);
    if (typeof window !== 'undefined') {
      this.checkPermittedDevices().catch(() => {});
    }
  }

  public isSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getMetadata(): DeviceMetadata {
    return { ...this.metadata };
  }

  public getGattTree(): GattServiceInfo[] {
    return [...this.gattTree];
  }

  // --- Bluetooth Device Permissions API (navigator.bluetooth.getDevices) ---
  public async checkPermittedDevices(): Promise<BluetoothDevice[]> {
    if (Capacitor.isNativePlatform()) {
      if (this.metadata.id) {
        const dummy = { id: this.metadata.id, name: this.metadata.name } as BluetoothDevice;
        this.permittedDevices = [dummy];
        return this.permittedDevices;
      }
      return [];
    }

    if (
      typeof navigator !== 'undefined' &&
      'bluetooth' in navigator &&
      typeof (navigator.bluetooth as unknown as { getDevices?: () => Promise<BluetoothDevice[]> }).getDevices === 'function'
    ) {
      try {
        const devices = await (navigator.bluetooth as unknown as { getDevices: () => Promise<BluetoothDevice[]> }).getDevices();
        this.permittedDevices = devices;
        return devices;
      } catch (err) {
        console.warn('Error querying permitted Bluetooth devices:', err);
      }
    }
    return [];
  }

  public getPermittedDevices(): BluetoothDevice[] {
    return [...this.permittedDevices];
  }

  // 1-Click Reconnect to an already permitted WHOOP device without opening the chooser prompt
  public async reconnectPermittedDevice(device?: BluetoothDevice): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const targetId = device?.id || this.nativeDeviceId || this.metadata.id;
      if (targetId) {
        await this.connectToNativeDevice(targetId, device?.name || this.metadata.name || 'WHOOP 4.0 Strap');
        return;
      }
      await this.connectNative();
      return;
    }

    let target = device;
    if (!target) {
      const permitted = await this.checkPermittedDevices();
      target =
        permitted.find((d) => this.metadata.id && d.id === this.metadata.id) ||
        permitted.find((d) => d.name?.toUpperCase().includes('WHOOP')) ||
        permitted[0];
    }
    if (!target) {
      throw new Error('No previously paired WHOOP 4.0 strap found. Please search for your device.');
    }
    try {
      await this.connectToDevice(target);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendlyErr = `Could not reach ${target.name || 'WHOOP strap'}. Ensure it is nearby, in pairing mode (double-tap sensor), and disconnected from your phone WHOOP app.`;
      console.warn(friendlyErr, msg);
      this.emitError(friendlyErr);
      throw new Error(friendlyErr);
    }
  }

  // --- Listeners ---
  public onHeartRate(cb: HeartRateCallback): () => void {
    this.onHeartRateCallbacks.add(cb);
    return () => this.onHeartRateCallbacks.delete(cb);
  }

  public onBattery(cb: BatteryCallback): () => void {
    this.onBatteryCallbacks.add(cb);
    return () => this.onBatteryCallbacks.delete(cb);
  }

  public onMetadata(cb: MetadataCallback): () => void {
    this.onMetadataCallbacks.add(cb);
    return () => this.onMetadataCallbacks.delete(cb);
  }

  public onPacket(cb: PacketCallback): () => void {
    this.onPacketCallbacks.add(cb);
    return () => this.onPacketCallbacks.delete(cb);
  }

  public onGattTree(cb: GattTreeCallback): () => void {
    this.onGattTreeCallbacks.add(cb);
    return () => this.onGattTreeCallbacks.delete(cb);
  }

  public onError(cb: ErrorCallback): () => void {
    this.onErrorCallbacks.add(cb);
    return () => this.onErrorCallbacks.delete(cb);
  }

  private emitMetadata(): void {
    const meta = this.getMetadata();
    this.onMetadataCallbacks.forEach((cb) => cb(meta));
    notificationEngine.checkBleState(meta.connected, meta.onWrist);
    if (meta.batteryLevel !== null) {
      notificationEngine.checkBattery(meta.batteryLevel);
    }
  }

  private emitError(msg: string): void {
    this.onErrorCallbacks.forEach((cb) => cb(msg));
  }

  // --- Connect Directly to a Given BluetoothDevice ---
  public async connectToDevice(device: BluetoothDevice): Promise<void> {
    if (!this.isSupported()) {
      const err = 'Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or Bluefy on iOS.';
      this.emitError(err);
      throw new Error(err);
    }

    try {
      this.device = device;
      this.metadata.name = device.name || 'WHOOP 4.0 Strap';
      this.metadata.id = device.id;
      this.metadata.connecting = true;
      this.isManualDisconnect = false;
      this.emitMetadata();

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      device.removeEventListener('gattserverdisconnected', this.handleDisconnected);
      device.addEventListener('gattserverdisconnected', this.handleDisconnected);

      console.log(`Connecting to GATT server on ${this.metadata.name}...`);
      if (!device.gatt) {
        throw new Error('Device does not support GATT server');
      }

      this.server = await device.gatt.connect();
      this.metadata.connected = true;
      this.metadata.connecting = false;
      this.reconnectAttempts = 0;
      this.emitMetadata();

      // 1. Initialize Standard Services (Heart Rate 0x180D, Battery 0x180F, Device Info 0x180A)
      await this.initStandardServices();

      // 2. Auto-subscribe to WHOOP Proprietary Gen4 Telemetry Characteristics
      await this.initProprietaryGen4Service();

      // 2.5 Auto-wake WHOOP 4.0 optical PPG sensor and enable live HR stream
      await this.wakeSensorAndEnableLiveStream();

      // 3. Scan full GATT tree for hardware inspector
      await this.scanFullGattTree();

      // 4. Start 30s Battery Polling Timer
      this.startBatteryPolling();

      // Refresh permitted devices cache
      await this.checkPermittedDevices().catch(() => {});
    } catch (err: unknown) {
      this.metadata.connected = false;
      this.metadata.connecting = false;
      this.emitMetadata();
      const message = err instanceof Error ? err.message : String(err);
      console.error('BLE Connection Failed:', message);
      this.emitError(message);
      throw err;
    }
  }

  // --- Request & Connect to Physical WHOOP 4.0 Strap (Direct User Gesture Safe) ---
  public async connect(mode: 'filtered' | 'all' = 'filtered'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.connectNative();
      return;
    }

    if (!this.isSupported()) {
      const err = 'Web Bluetooth API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Bluefy Browser on iOS.';
      this.emitError(err);
      throw new Error(err);
    }

    try {
      this.metadata.connecting = true;
      this.emitMetadata();

      // Standard and proprietary services to access upon GATT connection
      const optionalServices: BluetoothServiceUUID[] = [
        'heart_rate',
        'battery_service',
        'device_information',
        'health_thermometer',
        'pulse_oximeter',
        UUID_HEART_RATE_SERVICE,
        UUID_BATTERY_SERVICE,
        UUID_DEVICE_INFO_SERVICE,
        UUID_HEALTH_THERMOMETER_SERVICE,
        UUID_PULSE_OXIMETER_SERVICE,
        WHOOP_BASE_SERVICE_UUID,
        NORDIC_DFU_SERVICE_UUID,
      ];

      let options: RequestDeviceOptions;
      if (mode === 'all') {
        console.log('Requesting Bluetooth Device in acceptAllDevices fallback mode...');
        options = {
          acceptAllDevices: true,
          optionalServices,
        };
      } else {
        console.log('Requesting Bluetooth Device with WHOOP filters (namePrefix & Base Service)...');
        options = {
          filters: [
            { namePrefix: 'WHOOP' },
            { namePrefix: 'Whoop' },
            { namePrefix: 'whoop' },
            { services: ['heart_rate'] },
            { services: [WHOOP_BASE_SERVICE_UUID] },
          ],
          optionalServices,
        };
      }

      // CRITICAL: Call navigator.bluetooth.requestDevice immediately within the user gesture!
      const selectedDevice = await navigator.bluetooth.requestDevice(options);

      if (!selectedDevice) {
        throw new Error('No device selected');
      }

      await this.connectToDevice(selectedDevice);
    } catch (err: unknown) {
      this.metadata.connected = false;
      this.metadata.connecting = false;
      this.emitMetadata();

      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes('cancelled') ||
        message.includes('User cancelled') ||
        (err instanceof DOMException && err.name === 'NotFoundError')
      ) {
        console.log('User closed device chooser dialog');
        return; // Don't show scary error when user closes the prompt
      }

      console.error('BLE Connection Failed:', message);
      this.emitError(message);
      throw err;
    }
  }

  // --- Native Capacitor Bluetooth Low Energy (iOS Background Central Support) ---
  private async initNativeBle(): Promise<void> {
    if (!this.isNativeInitialized) {
      await BleClient.initialize();
      this.isNativeInitialized = true;
    }
  }

  public async connectNative(): Promise<void> {
    try {
      this.metadata.connecting = true;
      this.emitMetadata();

      await this.initNativeBle();

      console.log('[Native BLE] Requesting WHOOP 4.0 Device...');
      const device = await BleClient.requestDevice({
        services: [
          UUID_HEART_RATE_SERVICE,
          WHOOP_BASE_SERVICE_UUID,
        ],
        optionalServices: [
          UUID_HEART_RATE_SERVICE,
          UUID_BATTERY_SERVICE,
          UUID_DEVICE_INFO_SERVICE,
          UUID_HEALTH_THERMOMETER_SERVICE,
          UUID_PULSE_OXIMETER_SERVICE,
          WHOOP_BASE_SERVICE_UUID,
          NORDIC_DFU_SERVICE_UUID,
        ],
      });

      if (!device || !device.deviceId) {
        throw new Error('No device selected');
      }

      await this.connectToNativeDevice(device.deviceId, device.name || 'WHOOP 4.0 Strap');
    } catch (err: unknown) {
      this.metadata.connected = false;
      this.metadata.connecting = false;
      this.emitMetadata();

      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('cancelled') || message.includes('User cancelled')) {
        console.log('[Native BLE] User cancelled device picker');
        return;
      }
      console.error('[Native BLE] Connection failed:', message);
      this.emitError(message);
      throw err;
    }
  }

  public async connectToNativeDevice(deviceId: string, name: string): Promise<void> {
    try {
      this.nativeDeviceId = deviceId;
      this.metadata.name = name || 'WHOOP 4.0 Strap';
      this.metadata.id = deviceId;
      this.metadata.connecting = true;
      this.isManualDisconnect = false;
      this.emitMetadata();

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      await this.initNativeBle();

      console.log(`[Native BLE] Connecting to ${deviceId} (${name})...`);
      await BleClient.connect(deviceId, (disconnectedDeviceId) => {
        console.warn(`[Native BLE] Strap disconnected: ${disconnectedDeviceId}`);
        this.handleDisconnected();
      });

      this.metadata.connected = true;
      this.metadata.connecting = false;
      this.reconnectAttempts = 0;
      this.emitMetadata();

      // 1. Subscribe to Heart Rate Measurement (0x180D -> 0x2A37)
      try {
        await BleClient.startNotifications(
          deviceId,
          UUID_HEART_RATE_SERVICE,
          UUID_HEART_RATE_MEASUREMENT,
          (data: DataView) => {
            this.parseHeartRatePacket(data);
          }
        );
        console.log('[Native BLE] Subscribed to Heart Rate notifications');
      } catch (e) {
        console.warn('[Native BLE] Standard HR subscription failed:', e);
      }

      // 2. Battery Service (0x180F -> 0x2A19)
      try {
        const batVal = await BleClient.read(deviceId, UUID_BATTERY_SERVICE, UUID_BATTERY_LEVEL);
        if (batVal && batVal.byteLength > 0) {
          const lvl = batVal.getUint8(0);
          this.updateBatteryState(lvl);
          console.log(`[Native BLE] Initial battery level: ${lvl}%`);
        }
      } catch (e) {
        console.warn('[Native BLE] Initial battery read failed:', e);
      }

      try {
        await BleClient.startNotifications(
          deviceId,
          UUID_BATTERY_SERVICE,
          UUID_BATTERY_LEVEL,
          (data: DataView) => {
            if (data && data.byteLength > 0) {
              this.updateBatteryState(data.getUint8(0));
            }
          }
        );
      } catch {}

      // 3. Device Information Service (0x180A)
      try {
        const decoder = new TextDecoder('utf-8');
        try {
          const fwVal = await BleClient.read(deviceId, UUID_DEVICE_INFO_SERVICE, UUID_FIRMWARE_REVISION);
          this.metadata.firmwareRevision = decoder.decode(fwVal).replace(/\0/g, '');
        } catch {}
        try {
          const snVal = await BleClient.read(deviceId, UUID_DEVICE_INFO_SERVICE, UUID_SERIAL_NUMBER);
          this.metadata.serialNumber = decoder.decode(snVal).replace(/\0/g, '');
        } catch {}
        try {
          const hwVal = await BleClient.read(deviceId, UUID_DEVICE_INFO_SERVICE, UUID_HARDWARE_REVISION);
          this.metadata.hardwareRevision = decoder.decode(hwVal).replace(/\0/g, '');
        } catch {}
        try {
          const mfgVal = await BleClient.read(deviceId, UUID_DEVICE_INFO_SERVICE, UUID_MANUFACTURER_NAME);
          this.metadata.manufacturerName = decoder.decode(mfgVal).replace(/\0/g, '');
        } catch {}
        try {
          const modVal = await BleClient.read(deviceId, UUID_DEVICE_INFO_SERVICE, UUID_MODEL_NUMBER);
          this.metadata.modelNumber = decoder.decode(modVal).replace(/\0/g, '');
        } catch {}
        this.emitMetadata();
      } catch (e) {
        console.warn('[Native BLE] Device info read failed:', e);
      }

      // 4. WHOOP Proprietary Gen4 Services (61080001-... base)
      try {
        await BleClient.startNotifications(
          deviceId,
          WHOOP_BASE_SERVICE_UUID,
          WHOOP_EVENTS_FROM_STRAP_UUID,
          (data: DataView) => {
            this.parseProprietaryPacket(WHOOP_EVENTS_FROM_STRAP_UUID, data);
          }
        );
        console.log('[Native BLE] Subscribed to WHOOP EVENTS characteristic');
      } catch (e) {
        console.warn('[Native BLE] Failed subscribing to WHOOP EVENTS:', e);
      }

      try {
        await BleClient.startNotifications(
          deviceId,
          WHOOP_BASE_SERVICE_UUID,
          WHOOP_DATA_FROM_STRAP_UUID,
          (data: DataView) => {
            this.parseProprietaryPacket(WHOOP_DATA_FROM_STRAP_UUID, data);
          }
        );
        console.log('[Native BLE] Subscribed to WHOOP DATA stream');
      } catch (e) {
        console.warn('[Native BLE] Failed subscribing to WHOOP DATA:', e);
      }

      try {
        await BleClient.startNotifications(
          deviceId,
          WHOOP_BASE_SERVICE_UUID,
          WHOOP_CMD_FROM_STRAP_UUID,
          (data: DataView) => {
            this.parseProprietaryPacket(WHOOP_CMD_FROM_STRAP_UUID, data);
          }
        );
        console.log('[Native BLE] Subscribed to WHOOP CMD characteristic');
      } catch (e) {
        console.warn('[Native BLE] Failed subscribing to WHOOP CMD:', e);
      }

      // 4.5 Auto-wake WHOOP 4.0 optical PPG sensor and enable live HR stream
      await this.wakeSensorAndEnableLiveStream();

      // 5. Scan full GATT tree for hardware inspector
      await this.scanNativeGattTree(deviceId);

      // 6. Start 20s Battery Polling
      this.startNativeBatteryPolling(deviceId);
    } catch (err: unknown) {
      this.metadata.connected = false;
      this.metadata.connecting = false;
      this.emitMetadata();
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Native BLE] connectToNativeDevice failed:', message);
      this.emitError(message);
      throw err;
    }
  }

  private startNativeBatteryPolling(deviceId: string): void {
    if (this.batteryPollingInterval) {
      clearInterval(this.batteryPollingInterval);
    }
    this.batteryPollingInterval = window.setInterval(async () => {
      if (!this.metadata.connected || !this.nativeDeviceId) return;
      try {
        const batVal = await BleClient.read(deviceId, UUID_BATTERY_SERVICE, UUID_BATTERY_LEVEL);
        if (batVal && batVal.byteLength > 0) {
          this.updateBatteryState(batVal.getUint8(0));
        }
      } catch {}
    }, 20000);
  }

  private async scanNativeGattTree(deviceId: string): Promise<GattServiceInfo[]> {
    try {
      const services = await BleClient.getServices(deviceId);
      const tree: GattServiceInfo[] = [];
      for (const service of services) {
        const sUuid = service.uuid.toLowerCase();
        const chars: GattCharacteristicInfo[] = [];
        for (const char of service.characteristics) {
          const cUuid = char.uuid.toLowerCase();
          chars.push({
            uuid: cUuid,
            serviceUuid: sUuid,
            name: KNOWN_UUID_NAMES[cUuid] || 'Characteristic',
            properties: {
              read: Boolean(char.properties?.read),
              write: Boolean(char.properties?.write),
              writeWithoutResponse: Boolean(char.properties?.writeWithoutResponse),
              notify: Boolean(char.properties?.notify),
              indicate: Boolean(char.properties?.indicate),
            },
            isNotifying: false,
            lastValueHex: null,
            lastValueAscii: null,
            lastUpdated: null,
          });
        }
        tree.push({
          uuid: sUuid,
          name: KNOWN_UUID_NAMES[sUuid] || 'Primary Service',
          isPrimary: true,
          characteristics: chars,
        });
      }
      this.gattTree = tree;
      this.onGattTreeCallbacks.forEach((cb) => cb(tree));
      return tree;
    } catch (e) {
      console.warn('[Native BLE] Failed scanning GATT tree:', e);
      return [];
    }
  }

  public async disconnect(): Promise<void> {
    this.isManualDisconnect = true;
    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.batteryPollingInterval) {
      clearInterval(this.batteryPollingInterval);
      this.batteryPollingInterval = null;
    }
    if (Capacitor.isNativePlatform() && this.nativeDeviceId) {
      try {
        await BleClient.disconnect(this.nativeDeviceId);
      } catch {}
      this.nativeDeviceId = null;
    }
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnected();
  }

  // Robust gattserverdisconnected event handler with auto-reconnection
  private handleDisconnected(): void {
    console.log('WHOOP 4.0 Strap Disconnected');
    if (this.batteryPollingInterval) {
      clearInterval(this.batteryPollingInterval);
      this.batteryPollingInterval = null;
    }
    this.server = null;
    this.activeCharacteristics.clear();
    this.metadata.connected = false;
    this.metadata.onWrist = null;
    this.metadata.isCharging = false;
    this.metadata.chargingStatusText = '';
    this.metadata.packetsPerMinute = 0;
    this.metadata.lastPacketTimestamp = null;
    this.batteryLevelHistory = [];
    this.packetTimestamps = [];

    if (this.isManualDisconnect) {
      this.metadata.connecting = false;
      this.reconnectAttempts = 0;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.emitMetadata();
      return;
    }

    // Unexpected disconnection -> Attempt auto-reconnect with backoff (Attempts 1-3)
    if (this.reconnectAttempts < this.maxReconnectAttempts && (this.device || (Capacitor.isNativePlatform() && this.nativeDeviceId))) {
      this.reconnectAttempts++;
      const delay = this.reconnectAttempts === 1 ? 2000 : this.reconnectAttempts === 2 ? 5000 : 10000;
      this.metadata.connecting = true;
      this.emitMetadata();
      const statusMsg = `Strap disconnected. Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`;
      console.warn(statusMsg);
      this.emitError(statusMsg);

      this.reconnectTimeout = window.setTimeout(async () => {
        try {
          if (!this.metadata.connected && !this.isManualDisconnect) {
            if (Capacitor.isNativePlatform() && this.nativeDeviceId) {
              console.log(`[Native BLE] Executing auto-reconnect attempt ${this.reconnectAttempts}...`);
              await this.connectToNativeDevice(this.nativeDeviceId, this.metadata.name);
              this.emitError(''); // Clear error banner on success
            } else if (this.device) {
              console.log(`Executing auto-reconnect attempt ${this.reconnectAttempts}...`);
              await this.connectToDevice(this.device);
              this.emitError(''); // Clear error banner on success
            }
          }
        } catch (err) {
          console.warn(`Auto-reconnect attempt ${this.reconnectAttempts} failed:`, err);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.metadata.connecting = false;
            this.emitMetadata();
            this.emitError('Auto-reconnect failed. Tap "Reconnect" to pair again.');
          }
        }
      }, delay);
    } else {
      this.metadata.connecting = false;
      this.reconnectAttempts = 0;
      this.emitMetadata();
      this.emitError('WHOOP 4.0 strap disconnected. Tap to reconnect.');
    }
  }

  // --- Dynamic Battery & Charging State Detection Engine ---
  public updateBatteryState(level: number, isChargingDirect?: boolean): void {
    const now = Date.now();
    this.metadata.batteryLevel = level;
    this.batteryLevelHistory.push({ timestamp: now, level });
    // Keep rolling 90 seconds history
    const cutoff = now - 90000;
    this.batteryLevelHistory = this.batteryLevelHistory.filter((item) => item.timestamp >= cutoff);

    if (isChargingDirect !== undefined) {
      this.metadata.isCharging = isChargingDirect;
    } else if (this.batteryLevelHistory.length >= 2) {
      const oldest = this.batteryLevelHistory[0];
      const elapsedMs = now - oldest.timestamp;
      if (elapsedMs >= 15000) {
        if (level > oldest.level) {
          this.metadata.isCharging = true;
        } else if (level < oldest.level) {
          this.metadata.isCharging = false;
        }
      }
    }

    this.metadata.chargingStatusText = this.metadata.isCharging ? 'Charging' : 'Discharging';
    this.emitMetadata();
    this.onBatteryCallbacks.forEach((cb) => cb(level));
  }

  // --- Battery Polling every 20s ---
  private startBatteryPolling(): void {
    if (this.batteryPollingInterval) {
      clearInterval(this.batteryPollingInterval);
    }
    this.batteryPollingInterval = window.setInterval(async () => {
      const batChar = this.activeCharacteristics.get(UUID_BATTERY_LEVEL);
      if (batChar && this.metadata.connected) {
        try {
          const val = await batChar.readValue();
          const level = val.getUint8(0);
          this.updateBatteryState(level);
        } catch {
          // Ignore transient read error
        }
      }

      // Also query 0x2A1A Power State if present
      const pwrChar = this.activeCharacteristics.get(UUID_BATTERY_POWER_STATE);
      if (pwrChar && this.metadata.connected) {
        try {
          const pwrVal = await pwrChar.readValue();
          if (pwrVal.byteLength > 0) {
            const raw = pwrVal.getUint8(0);
            const isCharging = (raw & 0x03) === 3 || Boolean(raw & 0x30);
            this.updateBatteryState(this.metadata.batteryLevel ?? 0, isCharging);
          }
        } catch {
          // Ignore
        }
      }
    }, 20000);
  }

  // --- 1. Standard Services (Heart Rate, Battery, Device Info) ---
  private async initStandardServices(): Promise<void> {
    if (!this.server) return;

    // A. Heart Rate Service & Notification Setup
    try {
      const hrService = await this.server.getPrimaryService(UUID_HEART_RATE_SERVICE).catch(async () => {
        return await this.server!.getPrimaryService('heart_rate');
      });

      if (hrService) {
        const hrChar = await hrService.getCharacteristic(UUID_HEART_RATE_MEASUREMENT).catch(async () => {
          return await hrService.getCharacteristic('heart_rate_measurement');
        });

        if (hrChar) {
          await hrChar.startNotifications();
          hrChar.addEventListener('characteristicvaluechanged', (e: Event) => {
            const target = e.target as BluetoothRemoteGATTCharacteristic;
            if (target.value) {
              this.parseHeartRatePacket(target.value);
            }
          });
          this.activeCharacteristics.set(UUID_HEART_RATE_MEASUREMENT, hrChar);
          console.log('Heart Rate notifications successfully started on 0x2A37');
        }
      }
    } catch (e) {
      console.warn('Could not initialize Heart Rate Service:', e);
    }

    // B. Battery Service Setup
    try {
      const batService = await this.server.getPrimaryService(UUID_BATTERY_SERVICE).catch(async () => {
        return await this.server!.getPrimaryService('battery_service');
      });

      if (batService) {
        const batChar = await batService.getCharacteristic(UUID_BATTERY_LEVEL).catch(async () => {
          return await batService.getCharacteristic('battery_level');
        });

        if (batChar) {
          this.activeCharacteristics.set(UUID_BATTERY_LEVEL, batChar);
          // Immediate initial read
          try {
            const val = await batChar.readValue();
            const level = val.getUint8(0);
            this.updateBatteryState(level);
            console.log(`Battery level read: ${level}%`);
          } catch { /* initial read error */ }

          if (batChar.properties.notify) {
            await batChar.startNotifications();
            batChar.addEventListener('characteristicvaluechanged', (e: Event) => {
              const target = e.target as BluetoothRemoteGATTCharacteristic;
              if (target.value) {
                const updated = target.value.getUint8(0);
                this.updateBatteryState(updated);
              }
            });
          }
        }

        // Query Battery Power State (0x2A1A) if available
        try {
          const pwrChar = await batService.getCharacteristic(UUID_BATTERY_POWER_STATE).catch(() => null);
          if (pwrChar) {
            this.activeCharacteristics.set(UUID_BATTERY_POWER_STATE, pwrChar);
            if (pwrChar.properties.read) {
              const pwrVal = await pwrChar.readValue();
              if (pwrVal.byteLength > 0) {
                const raw = pwrVal.getUint8(0);
                const isCharging = (raw & 0x03) === 3 || Boolean(raw & 0x30);
                this.updateBatteryState(this.metadata.batteryLevel ?? 0, isCharging);
              }
            }
            if (pwrChar.properties.notify) {
              await pwrChar.startNotifications();
              pwrChar.addEventListener('characteristicvaluechanged', (e: Event) => {
                const target = e.target as BluetoothRemoteGATTCharacteristic;
                if (target.value && target.value.byteLength > 0) {
                  const raw = target.value.getUint8(0);
                  const isCharging = (raw & 0x03) === 3 || Boolean(raw & 0x30);
                  this.updateBatteryState(this.metadata.batteryLevel ?? 0, isCharging);
                }
              });
            }
          }
        } catch { /* optional characteristic */ }
      }
    } catch (e) {
      console.warn('Could not read Battery Service:', e);
    }

    // C. Device Information Service Setup
    try {
      const devInfoService = await this.server.getPrimaryService(UUID_DEVICE_INFO_SERVICE).catch(async () => {
        return await this.server!.getPrimaryService('device_information');
      });

      if (devInfoService) {
        const decoder = new TextDecoder('utf-8');

        // Firmware
        try {
          const fwChar = await devInfoService.getCharacteristic(UUID_FIRMWARE_REVISION);
          const val = await fwChar.readValue();
          this.metadata.firmwareRevision = decoder.decode(val).replace(/\0/g, '');
        } catch { /* ignore */ }

        // Hardware
        try {
          const hwChar = await devInfoService.getCharacteristic(UUID_HARDWARE_REVISION);
          const val = await hwChar.readValue();
          this.metadata.hardwareRevision = decoder.decode(val).replace(/\0/g, '');
        } catch { /* ignore */ }

        // Serial Number
        try {
          const snChar = await devInfoService.getCharacteristic(UUID_SERIAL_NUMBER);
          const val = await snChar.readValue();
          this.metadata.serialNumber = decoder.decode(val).replace(/\0/g, '');
        } catch { /* ignore */ }

        // Manufacturer Name
        try {
          const mfgChar = await devInfoService.getCharacteristic(UUID_MANUFACTURER_NAME);
          const val = await mfgChar.readValue();
          this.metadata.manufacturerName = decoder.decode(val).replace(/\0/g, '');
        } catch { /* ignore */ }

        // Model Number
        try {
          const modChar = await devInfoService.getCharacteristic(UUID_MODEL_NUMBER);
          const val = await modChar.readValue();
          this.metadata.modelNumber = decoder.decode(val).replace(/\0/g, '');
        } catch { /* ignore */ }

        this.emitMetadata();
      }
    } catch (e) {
      console.warn('Could not read Device Info Service:', e);
    }

    // D. Health Thermometer Service Setup (0x1809 -> 0x2A1C)
    try {
      const thermService = await this.server.getPrimaryService(UUID_HEALTH_THERMOMETER_SERVICE).catch(async () => {
        return await this.server!.getPrimaryService('health_thermometer');
      });
      if (thermService) {
        const thermChar = await thermService.getCharacteristic(UUID_TEMPERATURE_MEASUREMENT).catch(async () => {
          return await thermService.getCharacteristic('temperature_measurement');
        });
        if (thermChar) {
          await thermChar.startNotifications();
          thermChar.addEventListener('characteristicvaluechanged', (e: Event) => {
            const target = e.target as BluetoothRemoteGATTCharacteristic;
            if (target.value) {
              this.parseTemperaturePacket(target.value);
            }
          });
          this.activeCharacteristics.set(UUID_TEMPERATURE_MEASUREMENT, thermChar);
          console.log('Health Thermometer notifications started on 0x2A1C');
        }
      }
    } catch { /* optional service */ }

    // E. Pulse Oximeter Service Setup (0x1822 -> 0x2A5F / 0x2A5E)
    try {
      const oximService = await this.server.getPrimaryService(UUID_PULSE_OXIMETER_SERVICE).catch(async () => {
        return await this.server!.getPrimaryService('pulse_oximeter');
      });
      if (oximService) {
        const plxChar = await oximService.getCharacteristic(UUID_PLX_CONTINUOUS).catch(async () => {
          return await oximService.getCharacteristic(UUID_PLX_SPOT_CHECK);
        });
        if (plxChar) {
          await plxChar.startNotifications();
          plxChar.addEventListener('characteristicvaluechanged', (e: Event) => {
            const target = e.target as BluetoothRemoteGATTCharacteristic;
            if (target.value) {
              this.parsePulseOximeterPacket(target.value);
            }
          });
          this.activeCharacteristics.set(UUID_PLX_CONTINUOUS, plxChar);
          console.log('Pulse Oximeter notifications started on 0x2A5F');
        }
      }
    } catch { /* optional service */ }
  }

  // --- 2. WHOOP 4.0 Proprietary Gen4 Telemetry Extraction ---
  private async initProprietaryGen4Service(): Promise<void> {
    if (!this.server) return;

    try {
      const gen4Service = await this.server.getPrimaryService(WHOOP_BASE_SERVICE_UUID).catch(() => null);
      if (!gen4Service) return;

      console.log('Discovered WHOOP Proprietary Gen4 Base Service!');

      // Characteristics to subscribe to
      const notifyChars = [
        WHOOP_CMD_FROM_STRAP_UUID,
        WHOOP_EVENTS_FROM_STRAP_UUID,
        WHOOP_DATA_FROM_STRAP_UUID,
      ];

      for (const uuid of notifyChars) {
        try {
          const char = await gen4Service.getCharacteristic(uuid).catch(() => null);
          if (char) {
            this.activeCharacteristics.set(uuid, char);
            if (char.properties.notify || char.properties.indicate) {
              await char.startNotifications();
              char.addEventListener('characteristicvaluechanged', (e: Event) => {
                const target = e.target as BluetoothRemoteGATTCharacteristic;
                if (target.value) {
                  this.parseProprietaryPacket(uuid, target.value);
                }
              });
              console.log(`Subscribed to Gen4 characteristic: ${uuid}`);
            }
          }
        } catch (err) {
          console.warn(`Could not subscribe to Gen4 char ${uuid}:`, err);
        }
      }

      // Also get command characteristic
      try {
        const cmdChar = await gen4Service.getCharacteristic(WHOOP_CMD_TO_STRAP_UUID).catch(() => null);
        if (cmdChar) {
          this.activeCharacteristics.set(WHOOP_CMD_TO_STRAP_UUID, cmdChar);
        }
      } catch { /* ignore */ }
    } catch (e) {
      console.warn('Could not initialize Gen4 Proprietary Service:', e);
    }
  }

  // --- Parse Proprietary Frame (Header 0xAA, Type, Payload) ---
  private parseProprietaryPacket(charUuid: string, data: DataView): void {
    this.recordRawPacket(WHOOP_BASE_SERVICE_UUID, charUuid, data);

    if (data.byteLength >= 2) {
      const header = data.getUint8(0);
      const msgType = data.getUint8(1);

      // Event packet from strap
      if (charUuid === WHOOP_EVENTS_FROM_STRAP_UUID) {
        // e.g. charging state, double tap, wrist status, skin temp
        if (msgType === 0x01) {
          // Wrist event
          const onWrist = data.byteLength > 2 ? data.getUint8(2) === 1 : null;
          if (onWrist !== null && onWrist !== this.metadata.onWrist) {
            this.metadata.onWrist = onWrist;
            this.emitMetadata();
          }
        } else if (msgType === 0x02 || msgType === 0x03 || msgType === 0x04) {
          // Battery pack attached / charging
          this.updateBatteryState(this.metadata.batteryLevel ?? 0, true);
        } else if (msgType === 0x05) {
          // Battery pack detached / discharging
          this.updateBatteryState(this.metadata.batteryLevel ?? 0, false);
        } else if (msgType === 0x06 || msgType === 0x14) {
          // Thermistor event (16-bit signed/unsigned raw integer / 100.0)
          if (data.byteLength >= 4) {
            const rawTemp = data.getUint16(2, true);
            const tempC = rawTemp / 100.0;
            if (tempC >= 28.0 && tempC <= 42.0) {
              biometricEngine.ingestSkinTemp(tempC);
            }
          }
        } else if (msgType === 0x07 || msgType === 0x15) {
          // SpO2 event
          if (data.byteLength >= 3) {
            const spo2Val = data.getUint8(2);
            if (spo2Val >= 70 && spo2Val <= 100) {
              biometricEngine.ingestSpO2(spo2Val);
            }
          }
        }
      }

      // Raw IMU / Accelerometer / PPG / Thermistor stream from DATA_FROM_STRAP
      if (charUuid === WHOOP_DATA_FROM_STRAP_UUID && data.byteLength >= 6) {
        // 1. Check for framed WHOOP packet (0xAA header)
        if (header === 0xaa) {
          const rawBytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
          const decoded = decodeWhoopFrame(rawBytes);
          if (decoded.valid && decoded.payload && decoded.payload.length >= 2) {
            const pType = decoded.payload[0];
            const pData = new DataView(decoded.payload.buffer, decoded.payload.byteOffset, decoded.payload.byteLength);

            if (pType === 0x01 && pData.byteLength >= 7) {
              // Accelerometer IMU frame
              const rawX = pData.getInt16(1, true);
              const rawY = pData.getInt16(3, true);
              const rawZ = pData.getInt16(5, true);
              pedometerEngine.ingestRawAccel(rawX / 4096.0, rawY / 4096.0, rawZ / 4096.0, Date.now(), this.metadata.onWrist !== false);
            } else if (pType === 0x02 && pData.byteLength >= 9) {
              // Raw PPG optical stream: do not fabricate uncalibrated SpO2 without calibration table
            } else if (pType === 0x03 && pData.byteLength >= 3) {
              // Skin thermistor frame
              const rawTemp = pData.getUint16(1, true);
              const tempC = rawTemp / 100.0;
              if (tempC >= 28.0 && tempC <= 42.0) {
                biometricEngine.ingestSkinTemp(tempC);
              }
            }
          }
        }
        // Strictly reject unframed packets on DATA_FROM_STRAP to prevent false pedometer steps
      }
    }
  }

  // --- Health Thermometer Parser (IEEE-11073 32-bit Float) ---
  private parseTemperaturePacket(data: DataView): void {
    if (data.byteLength < 5) return;
    try {
      const flags = data.getUint8(0);
      const isFahrenheit = (flags & 0x01) !== 0;
      const rawVal = data.getUint32(1, true);
      const exponent = (rawVal >> 24) << 24 >> 24;
      let mantissa = rawVal & 0x00ffffff;
      if ((mantissa & 0x00800000) !== 0) {
        mantissa |= 0xff000000;
      }
      let temp = mantissa * Math.pow(10, exponent);
      if (isFahrenheit) {
        temp = (temp - 32) * (5 / 9);
      }
      biometricEngine.ingestSkinTemp(temp);
    } catch { /* ignore */ }
  }

  // --- Pulse Oximeter Parser (0x2A5F / 0x2A5E) ---
  private parsePulseOximeterPacket(data: DataView): void {
    if (data.byteLength < 3) return;
    try {
      const rawSpo2 = data.getUint16(0, true);
      const spo2 = (rawSpo2 & 0x0fff) / 10.0;
      if (spo2 >= 70 && spo2 <= 100) {
        biometricEngine.ingestSpO2(spo2);
      }
    } catch { /* ignore */ }
  }

  // --- Strict Bluetooth SIG Heart Rate Measurement (0x2A37) Byte Parser ---
  public parseHeartRatePacket(data: DataView): HeartRateMeasurement {
    const flags = data.getUint8(0);
    let offset = 1;

    // Bit 0: Heart Rate Value Format (0 = UINT8, 1 = UINT16)
    let rawBpm: number;
    if ((flags & 0x01) === 0) {
      rawBpm = data.getUint8(offset);
      offset += 1;
    } else {
      rawBpm = data.getUint16(offset, true); // Little-Endian
      offset += 2;
    }

    // Bit 1 & 2: Sensor Contact Status
    // Bit 2: Sensor Contact Feature Supported
    // Bit 1: Sensor Contact Detected
    const contactSupported = Boolean(flags & 0x04);
    const contactDetected = Boolean(flags & 0x02);
    this.metadata.contactSupported = contactSupported;
    this.metadata.contactDetected = contactDetected;

    // Determine on-wrist status
    const onWrist = contactSupported ? contactDetected : (rawBpm >= 30 && rawBpm <= 240);
    if (this.metadata.onWrist !== onWrist) {
      this.metadata.onWrist = onWrist;
      this.emitMetadata();
    }

    // Strict physiological human HR range: 30 bpm to 240 bpm. Discard off-wrist artifacts.
    let bpm = (onWrist && rawBpm >= 30 && rawBpm <= 240) ? rawBpm : 0;

    // Bit 3: Energy Expended field presence
    let energyExpended: number | undefined;
    if (flags & 0x08) {
      energyExpended = data.getUint16(offset, true);
      offset += 2;
    }

    // Bit 4: RR-Interval values presence
    const rrIntervals: number[] = [];
    let isDerivedRR = false;

    if (flags & 0x10 && onWrist) {
      while (offset + 1 < data.byteLength) {
        const rawRR = data.getUint16(offset, true);
        // Bluetooth SIG specification: Resolution is 1/1024 of a second
        // Formula: rr_ms = (raw_rr / 1024.0) * 1000.0
        const rrMs = (rawRR / 1024.0) * 1000.0;
        // Strict physiological human RR filter: 300 ms (200 bpm) to 2000 ms (30 bpm)
        if (rrMs >= 300 && rrMs <= 2000) {
          rrIntervals.push(rrMs);
        }
        offset += 2;
      }
    }

    // If packet has no valid RR intervals, estimate instantaneous IBI from clean BPM
    if (rrIntervals.length === 0 && bpm > 0) {
      const derivedRR = (60000.0 / bpm);
      if (derivedRR >= 300 && derivedRR <= 2000) {
        rrIntervals.push(Math.round(derivedRR));
        isDerivedRR = true;
      }
    }

    const measurement: HeartRateMeasurement = {
      bpm,
      rrIntervals,
      isDerivedRR,
      energyExpended,
      sensorContactSupported: contactSupported,
      sensorContactDetected: contactDetected,
      onWrist,
      timestamp: Date.now(),
    };

    // Emit parsed measurement
    this.onHeartRateCallbacks.forEach((cb) => cb(measurement));

    // Record raw packet for sniffer & telemetry tracking
    this.recordRawPacket(UUID_HEART_RATE_SERVICE, UUID_HEART_RATE_MEASUREMENT, data);

    return measurement;
  }

  // --- Command Dispatcher for WHOOP 4.0 CMD_TO_STRAP ---
  public async sendCommand(hexString: string): Promise<void> {
    const cleanHex = hexString.replace(/\s+/g, '');
    if (cleanHex.length % 2 !== 0) throw new Error('Invalid Hex string length');
    const buffer = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    await this.sendRawBuffer(buffer);
  }

  public async sendRawBuffer(buffer: Uint8Array): Promise<void> {
    if (Capacitor.isNativePlatform() && this.nativeDeviceId) {
      const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      await BleClient.write(this.nativeDeviceId, WHOOP_BASE_SERVICE_UUID, WHOOP_CMD_TO_STRAP_UUID, dataView);
      return;
    }

    const char = this.activeCharacteristics.get(WHOOP_CMD_TO_STRAP_UUID);
    if (!char) {
      throw new Error('WHOOP CMD_TO_STRAP characteristic not discovered or connected');
    }

    const payload = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

    if (char.properties.write) {
      await char.writeValueWithResponse(payload);
    } else if (char.properties.writeWithoutResponse) {
      await char.writeValueWithoutResponse(payload);
    } else {
      throw new Error('Characteristic does not support WRITE');
    }
  }

  // --- Auto-Wake Optical PPG Sensor & Enable Real-Time HR Stream Sequence ---
  public async wakeSensorAndEnableLiveStream(): Promise<void> {
    console.log('[WHOOP 4.0] Executing Optical PPG Sensor Wake-Up & Live Stream Command Sequence...');
    try {
      // 1. Send Toggle Realtime HR ON command frame ([0x23, 0x03, 0x01])
      const hrPayload = new Uint8Array([0x23, 0x03, 0x01]);
      const hrFrame = encodeWhoopFrame(hrPayload);
      await this.sendRawBuffer(hrFrame).catch(() => {});

      // Raw fallback bytes [0xAA, 0x04, 0x00, 0x23, 0x03, 0x01]
      const rawFallback = new Uint8Array([0xaa, 0x04, 0x00, 0x23, 0x03, 0x01]);
      await this.sendRawBuffer(rawFallback).catch(() => {});

      // 2. Send Toggle R7 / Raw Optical & IMU Stream ON command frame ([0x23, 0x16, 0x01])
      const r7Payload = new Uint8Array([0x23, 0x16, 0x01]);
      const r7Frame = encodeWhoopFrame(r7Payload);
      await this.sendRawBuffer(r7Frame).catch(() => {});

      // 3. Send Get Hello / Strap Status ([0x23, 0x01, 0x01])
      const helloPayload = new Uint8Array([0x23, 0x01, 0x01]);
      const helloFrame = encodeWhoopFrame(helloPayload);
      await this.sendRawBuffer(helloFrame).catch(() => {});

      // 4. Also trigger legacy 0x11 Realtime Stream command
      await this.sendToggleRealtimeHr(true).catch(() => {});

      console.log('[WHOOP 4.0] ✓ Optical sensor wake-up sequence dispatched successfully');
    } catch (e) {
      console.warn('[WHOOP 4.0] Optical sensor wake-up sequence notice:', e);
    }
  }

  // --- Proprietary WHOOP 4.0 Framed Interactive Command Triggers ---
  public async sendToggleRealtimeHr(enable: boolean): Promise<void> {
    const payload = new Uint8Array([0x11, enable ? 0x01 : 0x00]);
    const frame = encodeWhoopFrame(payload);
    await this.sendRawBuffer(frame);
  }

  public async sendRequestBatteryTemp(): Promise<void> {
    const payload = new Uint8Array([0x14, 0x01]);
    const frame = encodeWhoopFrame(payload);
    await this.sendRawBuffer(frame);
  }

  public async sendTriggerHapticAlarm(): Promise<void> {
    const payload = new Uint8Array([0x25, 0x03, 0x02]); // Haptic 3 pulses
    const frame = encodeWhoopFrame(payload);
    await this.sendRawBuffer(frame);
  }

  public async sendSyncHistoryBuffer(): Promise<void> {
    const payload = new Uint8Array([0x08, 0x00, 0x01]);
    const frame = encodeWhoopFrame(payload);
    await this.sendRawBuffer(frame);
  }

  // --- GATT Tree Scanner for Hardware Inspector ---
  public async scanFullGattTree(): Promise<GattServiceInfo[]> {
    if (!this.server) return [];

    try {
      const services = await this.server.getPrimaryServices();
      const tree: GattServiceInfo[] = [];

      for (const service of services) {
        const sUuid = service.uuid.toLowerCase();
        const serviceName = KNOWN_UUID_NAMES[sUuid] || `Service (${sUuid.slice(0, 8)})`;

        const characteristics = await service.getCharacteristics().catch(() => []);
        const charInfos: GattCharacteristicInfo[] = [];

        for (const char of characteristics) {
          const cUuid = char.uuid.toLowerCase();
          const charName = KNOWN_UUID_NAMES[cUuid] || `Char (${cUuid.slice(0, 8)})`;

          this.activeCharacteristics.set(cUuid, char);

          let initialHex: string | null = null;
          let initialAscii: string | null = null;

          if (char.properties.read) {
            try {
              const val = await char.readValue();
              const parsed = this.formatDataView(val);
              initialHex = parsed.hex;
              initialAscii = parsed.ascii;
            } catch {
              // Ignore protected characteristic
            }
          }

          charInfos.push({
            uuid: cUuid,
            serviceUuid: sUuid,
            name: charName,
            properties: {
              read: char.properties.read,
              write: char.properties.write,
              writeWithoutResponse: char.properties.writeWithoutResponse,
              notify: char.properties.notify,
              indicate: char.properties.indicate,
            },
            isNotifying: false,
            lastValueHex: initialHex,
            lastValueAscii: initialAscii,
            lastUpdated: initialHex ? Date.now() : null,
          });
        }

        tree.push({
          uuid: sUuid,
          name: serviceName,
          isPrimary: service.isPrimary,
          characteristics: charInfos,
        });
      }

      this.gattTree = tree;
      this.onGattTreeCallbacks.forEach((cb) => cb(tree));
      return tree;
    } catch (err) {
      console.error('Error scanning GATT tree:', err);
      return [];
    }
  }

  // --- Interactive Characteristic Read / Write ---
  public async readCharacteristic(charUuid: string): Promise<{ hex: string; ascii: string }> {
    const char = this.activeCharacteristics.get(charUuid.toLowerCase());
    if (!char) throw new Error(`Characteristic ${charUuid} not found`);

    const val = await char.readValue();
    const formatted = this.formatDataView(val);
    this.recordRawPacket(char.service.uuid, charUuid, val);
    return formatted;
  }

  public async writeCharacteristic(charUuid: string, hexOrAscii: string, isHex = true): Promise<void> {
    const char = this.activeCharacteristics.get(charUuid.toLowerCase());
    if (!char) throw new Error(`Characteristic ${charUuid} not found`);

    let buffer: Uint8Array;
    if (isHex) {
      const cleanHex = hexOrAscii.replace(/\s+/g, '');
      if (cleanHex.length % 2 !== 0) throw new Error('Invalid Hex string length');
      buffer = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    } else {
      buffer = new TextEncoder().encode(hexOrAscii);
    }

    const payload = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

    if (char.properties.write) {
      await char.writeValueWithResponse(payload);
    } else if (char.properties.writeWithoutResponse) {
      await char.writeValueWithoutResponse(payload);
    } else {
      throw new Error('Characteristic does not support WRITE');
    }
  }

  public async toggleNotifyCharacteristic(charUuid: string, enable: boolean): Promise<boolean> {
    const char = this.activeCharacteristics.get(charUuid.toLowerCase());
    if (!char) throw new Error(`Characteristic ${charUuid} not found`);

    if (enable) {
      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', (e: Event) => {
        const target = e.target as BluetoothRemoteGATTCharacteristic;
        if (target.value) {
          this.recordRawPacket(char.service.uuid, charUuid, target.value);
        }
      });
      return true;
    } else {
      await char.stopNotifications();
      return false;
    }
  }

  // --- Packet Utilities ---
  private formatDataView(data: DataView): { hex: string; ascii: string; bytes: number[] } {
    const bytes: number[] = [];
    const hexArray: string[] = [];
    let ascii = '';

    for (let i = 0; i < data.byteLength; i++) {
      const byte = data.getUint8(i);
      bytes.push(byte);
      hexArray.push(byte.toString(16).padStart(2, '0').toUpperCase());
      if (byte >= 32 && byte <= 126) {
        ascii += String.fromCharCode(byte);
      } else {
        ascii += '·';
      }
    }

    return {
      hex: hexArray.join(' '),
      ascii,
      bytes,
    };
  }

  private recordRawPacket(serviceUuid: string, charUuid: string, data: DataView): void {
    const now = Date.now();
    this.packetTimestamps.push(now);
    const cutoff = now - 60000;
    this.packetTimestamps = this.packetTimestamps.filter((t) => t >= cutoff);
    this.metadata.packetsPerMinute = this.packetTimestamps.length;
    this.metadata.lastPacketTimestamp = now;

    const { hex, ascii, bytes } = this.formatDataView(data);
    const packet: RawBlePacket = {
      id: `${now}-${++this.packetCounter}`,
      timestamp: now,
      serviceUuid,
      charUuid,
      length: data.byteLength,
      hex,
      ascii,
      decimalArray: bytes,
    };

    this.onPacketCallbacks.forEach((cb) => cb(packet));
    storageService.saveRawPacket(packet).catch(() => {});
  }
}

export const whoopBleEngine = new WhoopBleEngine();
export const whoopBLE = whoopBleEngine;
