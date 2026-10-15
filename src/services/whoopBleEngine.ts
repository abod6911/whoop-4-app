/// <reference types="web-bluetooth" />
import type {
  HeartRateMeasurement,
  DeviceMetadata,
  GattServiceInfo,
  GattCharacteristicInfo,
  RawBlePacket,
} from '../types/whoop';
import { storageService } from './StorageService';

// Standard 16-bit UUIDs normalized to 128-bit
export const UUID_HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
export const UUID_HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';
export const UUID_BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';
export const UUID_BATTERY_LEVEL = '00002a19-0000-1000-8000-00805f9b34fb';
export const UUID_DEVICE_INFO_SERVICE = '0000180a-0000-1000-8000-00805f9b34fb';
export const UUID_SERIAL_NUMBER = '00002a25-0000-1000-8000-00805f9b34fb';
export const UUID_FIRMWARE_REVISION = '00002a26-0000-1000-8000-00805f9b34fb';
export const UUID_HARDWARE_REVISION = '00002a27-0000-1000-8000-00805f9b34fb';
export const UUID_MANUFACTURER_NAME = '00002a29-0000-1000-8000-00805f9b34fb';
export const UUID_MODEL_NUMBER = '00002a24-0000-1000-8000-00805f9b34fb';

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

export class WhoopBleEngine {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private batteryPollingInterval: number | null = null;

  // Active characteristics map
  private activeCharacteristics = new Map<string, BluetoothRemoteGATTCharacteristic>();

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
    firmwareRevision: null,
    hardwareRevision: null,
    serialNumber: null,
    manufacturerName: null,
    modelNumber: null,
    connected: false,
    connecting: false,
    onWrist: null,
  };

  private gattTree: GattServiceInfo[] = [];

  constructor() {
    this.handleDisconnected = this.handleDisconnected.bind(this);
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getMetadata(): DeviceMetadata {
    return { ...this.metadata };
  }

  public getGattTree(): GattServiceInfo[] {
    return [...this.gattTree];
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
  }

  private emitError(msg: string): void {
    this.onErrorCallbacks.forEach((cb) => cb(msg));
  }

  // --- Connect to Real WHOOP 4.0 Strap ---
  public async connect(): Promise<void> {
    if (!this.isSupported()) {
      const err = 'Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or Bluefy on iOS.';
      this.emitError(err);
      throw new Error(err);
    }

    try {
      this.metadata.connecting = true;
      this.emitMetadata();

      const optionalServices: BluetoothServiceUUID[] = [
        'heart_rate',
        'battery_service',
        'device_information',
        UUID_HEART_RATE_SERVICE,
        UUID_BATTERY_SERVICE,
        UUID_DEVICE_INFO_SERVICE,
        WHOOP_BASE_SERVICE_UUID,
        NORDIC_DFU_SERVICE_UUID,
      ];

      const options: RequestDeviceOptions = {
        acceptAllDevices: true,
        optionalServices,
      };

      console.log('Requesting Bluetooth Device for WHOOP 4.0...');
      this.device = await navigator.bluetooth.requestDevice(options);

      if (!this.device) {
        throw new Error('No device selected');
      }

      this.metadata.name = this.device.name || 'WHOOP 4.0 Strap';
      this.metadata.id = this.device.id;
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnected);

      console.log(`Connecting to GATT server on ${this.metadata.name}...`);
      if (!this.device.gatt) {
        throw new Error('Device does not support GATT server');
      }

      this.server = await this.device.gatt.connect();
      this.metadata.connected = true;
      this.metadata.connecting = false;
      this.emitMetadata();

      // 1. Initialize Standard Services
      await this.initStandardServices();

      // 2. Auto-subscribe to WHOOP Proprietary Gen4 Telemetry Characteristics
      await this.initProprietaryGen4Service();

      // 3. Scan full GATT tree for hardware inspector
      await this.scanFullGattTree();

      // 4. Start 30s Battery Polling Timer
      this.startBatteryPolling();
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

  public disconnect(): void {
    if (this.batteryPollingInterval) {
      clearInterval(this.batteryPollingInterval);
      this.batteryPollingInterval = null;
    }
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnected();
  }

  private handleDisconnected(): void {
    console.log('WHOOP 4.0 Strap Disconnected');
    if (this.batteryPollingInterval) {
      clearInterval(this.batteryPollingInterval);
      this.batteryPollingInterval = null;
    }
    this.server = null;
    this.activeCharacteristics.clear();
    this.metadata.connected = false;
    this.metadata.connecting = false;
    this.metadata.onWrist = null;
    this.emitMetadata();
  }

  // --- Battery Polling every 30s ---
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
          if (level !== this.metadata.batteryLevel) {
            this.metadata.batteryLevel = level;
            this.emitMetadata();
            this.onBatteryCallbacks.forEach((cb) => cb(level));
          }
        } catch {
          // Ignore transient read error
        }
      }
    }, 30000);
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
          const val = await batChar.readValue();
          const level = val.getUint8(0);
          this.metadata.batteryLevel = level;
          this.emitMetadata();
          this.onBatteryCallbacks.forEach((cb) => cb(level));
          console.log(`Battery level read: ${level}%`);

          if (batChar.properties.notify) {
            await batChar.startNotifications();
            batChar.addEventListener('characteristicvaluechanged', (e: Event) => {
              const target = e.target as BluetoothRemoteGATTCharacteristic;
              if (target.value) {
                const updated = target.value.getUint8(0);
                this.metadata.batteryLevel = updated;
                this.emitMetadata();
                this.onBatteryCallbacks.forEach((cb) => cb(updated));
              }
            });
          }
        }
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
        // e.g. charging state, double tap, wrist status
        if (msgType === 0x01) {
          // Wrist event
          const onWrist = data.byteLength > 2 ? data.getUint8(2) === 1 : null;
          if (onWrist !== null && onWrist !== this.metadata.onWrist) {
            this.metadata.onWrist = onWrist;
            this.emitMetadata();
          }
        }
      }
    }
  }

  // --- Strict Bluetooth SIG Heart Rate Measurement (0x2A37) Byte Parser ---
  public parseHeartRatePacket(data: DataView): HeartRateMeasurement {
    const flags = data.getUint8(0);
    let offset = 1;

    // Bit 0: Heart Rate Value Format (0 = UINT8, 1 = UINT16)
    let bpm: number;
    if ((flags & 0x01) === 0) {
      bpm = data.getUint8(offset);
      offset += 1;
    } else {
      bpm = data.getUint16(offset, true); // Little-Endian
      offset += 2;
    }

    // Bit 1 & 2: Sensor Contact Status
    // Bit 2: Sensor Contact Feature Supported
    // Bit 1: Sensor Contact Detected
    const contactSupported = Boolean(flags & 0x04);
    const contactDetected = Boolean(flags & 0x02);
    const onWrist = contactSupported ? contactDetected : null;

    if (onWrist !== null && onWrist !== this.metadata.onWrist) {
      this.metadata.onWrist = onWrist;
      this.emitMetadata();
    }

    // Bit 3: Energy Expended field presence
    let energyExpended: number | undefined;
    if (flags & 0x08) {
      energyExpended = data.getUint16(offset, true);
      offset += 2;
    }

    // Bit 4: RR-Interval values presence
    const rrIntervals: number[] = [];
    let isDerivedRR = false;

    if (flags & 0x10) {
      while (offset + 1 < data.byteLength) {
        const rawRR = data.getUint16(offset, true);
        // Bluetooth SIG specification: Resolution is 1/1024 of a second
        // Formula: rr_ms = (raw_rr / 1024.0) * 1000.0
        const rrMs = (rawRR / 1024.0) * 1000.0;
        rrIntervals.push(rrMs);
        offset += 2;
      }
    }

    // If packet has no RR intervals, estimate instantaneous IBI from BPM
    if (rrIntervals.length === 0 && bpm > 0) {
      const derivedRR = (60000.0 / bpm);
      rrIntervals.push(derivedRR);
      isDerivedRR = true;
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

    // Record raw packet for sniffer
    this.recordRawPacket(UUID_HEART_RATE_SERVICE, UUID_HEART_RATE_MEASUREMENT, data);

    return measurement;
  }

  // --- Command Dispatcher for WHOOP 4.0 CMD_TO_STRAP ---
  public async sendCommand(hexString: string): Promise<void> {
    const char = this.activeCharacteristics.get(WHOOP_CMD_TO_STRAP_UUID);
    if (!char) {
      throw new Error('WHOOP CMD_TO_STRAP characteristic not discovered or connected');
    }

    const cleanHex = hexString.replace(/\s+/g, '');
    if (cleanHex.length % 2 !== 0) throw new Error('Invalid Hex string length');
    const buffer = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const payload = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

    if (char.properties.write) {
      await char.writeValueWithResponse(payload);
    } else if (char.properties.writeWithoutResponse) {
      await char.writeValueWithoutResponse(payload);
    } else {
      throw new Error('Characteristic does not support WRITE');
    }
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
    const { hex, ascii, bytes } = this.formatDataView(data);
    const packet: RawBlePacket = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
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
