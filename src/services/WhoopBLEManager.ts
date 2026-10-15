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

// Known Whoop 4.0 Proprietary Base UUIDs
export const WHOOP_BASE_SERVICE_UUID = '61080001-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_COMMAND_CHAR_UUID = '61080002-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_DATA_STREAM_UUID = '61080003-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_EVENTS_CHAR_UUID = '61080004-8d6d-82b8-614a-1c8cb0f8dcc6';
export const WHOOP_RAW_MEMS_UUID = '61080005-8d6d-82b8-614a-1c8cb0f8dcc6';
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
  [WHOOP_BASE_SERVICE_UUID]: 'Whoop 4.0 Core Command Service',
  [WHOOP_COMMAND_CHAR_UUID]: 'Whoop Command / Control',
  [WHOOP_DATA_STREAM_UUID]: 'Whoop Raw Metrics / Sensor Stream',
  [WHOOP_EVENTS_CHAR_UUID]: 'Whoop Strap Events / State',
  [WHOOP_RAW_MEMS_UUID]: 'Whoop Accelerometer / Skin Temp',
  [NORDIC_DFU_SERVICE_UUID]: 'Nordic Secure DFU Service',
};

export type HeartRateCallback = (data: HeartRateMeasurement) => void;
export type BatteryCallback = (level: number) => void;
export type MetadataCallback = (meta: DeviceMetadata) => void;
export type PacketCallback = (packet: RawBlePacket) => void;
export type GattTreeCallback = (services: GattServiceInfo[]) => void;
export type ErrorCallback = (error: string) => void;

export class WhoopBLEManager {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;

  // Active characteristics map
  private activeCharacteristics = new Map<string, BluetoothRemoteGATTCharacteristic>();

  // Callbacks
  private onHeartRateCallbacks: Set<HeartRateCallback> = new Set();
  private onBatteryCallbacks: Set<BatteryCallback> = new Set();
  private onMetadataCallbacks: Set<MetadataCallback> = new Set();
  private onPacketCallbacks: Set<PacketCallback> = new Set();
  private onGattTreeCallbacks: Set<GattTreeCallback> = new Set();
  private onErrorCallbacks: Set<ErrorCallback> = new Set();

  // Cached Metadata
  private metadata: DeviceMetadata = {
    name: 'Disconnected',
    id: '',
    batteryLevel: null,
    firmwareRevision: null,
    hardwareRevision: null,
    serialNumber: null,
    manufacturerName: null,
    connected: false,
    connecting: false,
  };

  private gattTree: GattServiceInfo[] = [];

  constructor() {
    this.handleDisconnected = this.handleDisconnected.bind(this);
  }

  // --- Support Checks ---
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getMetadata(): DeviceMetadata {
    return { ...this.metadata };
  }

  public getGattTree(): GattServiceInfo[] {
    return [...this.gattTree];
  }

  // --- Event Listeners ---
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

  // --- Connect Flow ---
  public async connect(usePrefixFilter = false): Promise<void> {
    if (!this.isSupported()) {
      const err = 'Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or Opera on Windows/Mac/Android.';
      this.emitError(err);
      throw new Error(err);
    }

    try {
      this.metadata.connecting = true;
      this.emitMetadata();

      // List of all optional services requested from the browser
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

      let options: RequestDeviceOptions;

      if (usePrefixFilter) {
        options = {
          filters: [
            { namePrefix: 'WHOOP' },
            { namePrefix: 'Whoop' },
            { services: ['heart_rate'] },
          ],
          optionalServices,
        };
      } else {
        // Accept all devices for maximum flexibility with Whoop 4.0 & standard HR monitors
        options = {
          acceptAllDevices: true,
          optionalServices,
        };
      }

      console.log('Requesting Bluetooth Device with options:', options);
      this.device = await navigator.bluetooth.requestDevice(options);

      if (!this.device) {
        throw new Error('No device selected');
      }

      this.metadata.name = this.device.name || 'Whoop 4.0 Strap';
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

      // 1. Setup Standard Services (Heart Rate, Battery, Device Info)
      await this.initStandardServices();

      // 2. Explore Full GATT Tree for RAW Lab Mode
      await this.scanFullGattTree();
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

  // --- Disconnect Flow ---
  public disconnect(): void {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnected();
  }

  private handleDisconnected(): void {
    console.log('GATT Server Disconnected');
    this.server = null;
    this.activeCharacteristics.clear();
    this.metadata.connected = false;
    this.metadata.connecting = false;
    this.metadata.batteryLevel = null;
    this.emitMetadata();
  }

  // --- Standard Services Initialization ---
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
          console.log('Heart Rate notifications successfully started');
        }
      }
    } catch (e) {
      console.warn('Could not initialize standard Heart Rate Service:', e);
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
          // Read initial level
          const val = await batChar.readValue();
          const level = val.getUint8(0);
          this.metadata.batteryLevel = level;
          this.emitMetadata();
          this.onBatteryCallbacks.forEach((cb) => cb(level));

          // Subscribe if notify is supported
          if (batChar.properties.notify) {
            await batChar.startNotifications();
            batChar.addEventListener('characteristicvaluechanged', (e: Event) => {
              const target = e.target as BluetoothRemoteGATTCharacteristic;
              if (target.value) {
                const updatedLevel = target.value.getUint8(0);
                this.metadata.batteryLevel = updatedLevel;
                this.emitMetadata();
                this.onBatteryCallbacks.forEach((cb) => cb(updatedLevel));
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

        // Serial
        try {
          const snChar = await devInfoService.getCharacteristic(UUID_SERIAL_NUMBER);
          const val = await snChar.readValue();
          this.metadata.serialNumber = decoder.decode(val).replace(/\0/g, '');
        } catch { /* ignore */ }

        // Manufacturer
        try {
          const mfgChar = await devInfoService.getCharacteristic(UUID_MANUFACTURER_NAME);
          const val = await mfgChar.readValue();
          this.metadata.manufacturerName = decoder.decode(val).replace(/\0/g, '');
        } catch { /* ignore */ }

        this.emitMetadata();
      }
    } catch (e) {
      console.warn('Could not read Device Info Service:', e);
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
    const sensorContactSupported = Boolean(flags & 0x04);
    const sensorContactDetected = Boolean(flags & 0x02);

    // Bit 3: Energy Expended field presence
    let energyExpended: number | undefined;
    if (flags & 0x08) {
      energyExpended = data.getUint16(offset, true);
      offset += 2;
    }

    // Bit 4: RR-Interval values presence (CRITICAL FOR HRV)
    const rrIntervals: number[] = [];
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

    const measurement: HeartRateMeasurement = {
      bpm,
      rrIntervals,
      energyExpended,
      sensorContactSupported,
      sensorContactDetected,
      timestamp: Date.now(),
    };

    // Emit parsed measurement
    this.onHeartRateCallbacks.forEach((cb) => cb(measurement));

    // Also dispatch as raw packet for sniffer
    this.recordRawPacket(UUID_HEART_RATE_SERVICE, UUID_HEART_RATE_MEASUREMENT, data);

    return measurement;
  }

  // --- Full GATT Explorer & Dynamic Scanner ("Lab Mode") ---
  public async scanFullGattTree(): Promise<GattServiceInfo[]> {
    if (!this.server) return [];

    try {
      console.log('Enumerating all primary GATT services...');
      const services = await this.server.getPrimaryServices();
      const tree: GattServiceInfo[] = [];

      for (const service of services) {
        const sUuid = service.uuid.toLowerCase();
        const serviceName = KNOWN_UUID_NAMES[sUuid] || `Custom Service (${sUuid.slice(0, 8)})`;

        const characteristics = await service.getCharacteristics().catch(() => []);
        const charInfos: GattCharacteristicInfo[] = [];

        for (const char of characteristics) {
          const cUuid = char.uuid.toLowerCase();
          const charName = KNOWN_UUID_NAMES[cUuid] || `Char (${cUuid.slice(0, 8)})`;

          this.activeCharacteristics.set(cUuid, char);

          let initialHex: string | null = null;
          let initialAscii: string | null = null;

          // Attempt initial read if characteristic supports READ
          if (char.properties.read) {
            try {
              const val = await char.readValue();
              const parsed = this.formatDataView(val);
              initialHex = parsed.hex;
              initialAscii = parsed.ascii;
            } catch {
              // Characteristic might require pairing or authorization
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
    } catch (err: unknown) {
      console.error('Error scanning GATT tree:', err);
      return [];
    }
  }

  // --- Interactive Characteristic Actions (Read, Write, Toggle Notify) ---
  public async readCharacteristic(charUuid: string): Promise<{ hex: string; ascii: string }> {
    const char = this.activeCharacteristics.get(charUuid.toLowerCase());
    if (!char) throw new Error(`Characteristic ${charUuid} not found`);

    const val = await char.readValue();
    const formatted = this.formatDataView(val);

    this.recordRawPacket(char.service.uuid, charUuid, val);
    this.updateCharacteristicInTree(charUuid, formatted.hex, formatted.ascii);

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

    const payloadBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

    if (char.properties.write) {
      await char.writeValueWithResponse(payloadBuffer);
    } else if (char.properties.writeWithoutResponse) {
      await char.writeValueWithoutResponse(payloadBuffer);
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
          const formatted = this.formatDataView(target.value);
          this.recordRawPacket(char.service.uuid, charUuid, target.value);
          this.updateCharacteristicInTree(charUuid, formatted.hex, formatted.ascii);
        }
      });
      this.setCharacteristicNotifyStatus(charUuid, true);
      return true;
    } else {
      await char.stopNotifications();
      this.setCharacteristicNotifyStatus(charUuid, false);
      return false;
    }
  }

  // --- Packet Sniffer Utilities ---
  private formatDataView(data: DataView): { hex: string; ascii: string; bytes: number[] } {
    const bytes: number[] = [];
    const hexArray: string[] = [];
    let ascii = '';

    for (let i = 0; i < data.byteLength; i++) {
      const byte = data.getUint8(i);
      bytes.push(byte);
      hexArray.push(byte.toString(16).padStart(2, '0').toUpperCase());
      // Printable ASCII range
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

    // Emit to live packet listeners
    this.onPacketCallbacks.forEach((cb) => cb(packet));

    // Save to indexedDB storage in background
    storageService.saveRawPacket(packet).catch(() => {});
  }

  private updateCharacteristicInTree(charUuid: string, hex: string, ascii: string): void {
    const cLower = charUuid.toLowerCase();
    for (const service of this.gattTree) {
      for (const char of service.characteristics) {
        if (char.uuid.toLowerCase() === cLower) {
          char.lastValueHex = hex;
          char.lastValueAscii = ascii;
          char.lastUpdated = Date.now();
          this.onGattTreeCallbacks.forEach((cb) => cb([...this.gattTree]));
          return;
        }
      }
    }
  }

  private setCharacteristicNotifyStatus(charUuid: string, isNotifying: boolean): void {
    const cLower = charUuid.toLowerCase();
    for (const service of this.gattTree) {
      for (const char of service.characteristics) {
        if (char.uuid.toLowerCase() === cLower) {
          char.isNotifying = isNotifying;
          this.onGattTreeCallbacks.forEach((cb) => cb([...this.gattTree]));
          return;
        }
      }
    }
  }
}

export const whoopBLE = new WhoopBLEManager();
