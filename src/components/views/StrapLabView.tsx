import React from 'react';
import type { DeviceMetadata, GattServiceInfo, RawBlePacket } from '../../types/whoop';
import { GattExplorer } from '../GattExplorer';
import { WhoopLogo } from '../WhoopLogo';
import {
  Battery,
  Bluetooth,
  BluetoothOff,
  Sparkles,
} from 'lucide-react';

interface StrapLabViewProps {
  metadata: DeviceMetadata;
  services: GattServiceInfo[];
  packets: RawBlePacket[];
  isSimulator: boolean;
  onConnectBle: (filterByWhoop: boolean) => void;
  onDisconnectBle: () => void;
  onToggleSimulator: () => void;
  onClearPackets: () => void;
  onRefreshGattTree: () => void;
}

export const StrapLabView: React.FC<StrapLabViewProps> = ({
  metadata,
  services,
  packets,
  isSimulator,
  onConnectBle,
  onDisconnectBle,
  onToggleSimulator,
  onClearPackets,
  onRefreshGattTree,
}) => {
  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* 1. WHOOP 4.0 Hardware Card */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E232D] pb-3">
          <div className="flex items-center gap-2.5">
            <WhoopLogo size="sm" showWordmark={true} />
            <span className="text-[10px] font-mono bg-[#181C23] px-2 py-0.5 rounded text-white border border-[#262B35]">
              4.0 STRAP
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                metadata.connected ? 'bg-whoop-green animate-ping' : 'bg-zinc-600'
              }`}
            />
            <span className="text-xs font-bold font-condensed uppercase text-white">
              {metadata.connected ? 'Connected' : isSimulator ? 'Simulation Active' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Hardware Specs Grid */}
        <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#14171E] border border-[#202530]">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">Battery Level</div>
            <div className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <Battery
                className={`w-4 h-4 ${
                  (metadata.batteryLevel ?? 80) < 20
                    ? 'text-whoop-red'
                    : (metadata.batteryLevel ?? 80) < 50
                    ? 'text-whoop-yellow'
                    : 'text-whoop-green'
                }`}
              />
              <span className="font-condensed">{metadata.batteryLevel ?? 88}%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#14171E] border border-[#202530]">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">Firmware Version</div>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {metadata.firmwareRevision || '41.14.2.0'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#14171E] border border-[#202530]">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">Hardware Model</div>
            <div className="text-sm font-bold text-white mt-1 truncate font-condensed">
              {metadata.hardwareRevision || 'WHOOP 4.0 REV B'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#14171E] border border-[#202530]">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">Serial Number</div>
            <div className="text-sm font-bold text-whoop-blue mt-1 truncate">
              {metadata.serialNumber || 'WHP4-9981A7F2'}
            </div>
          </div>
        </div>

        {/* Connection Action Controls (Clean Capsule Style) */}
        <div className="flex gap-2 pt-1 font-condensed">
          {metadata.connected ? (
            <button
              onClick={onDisconnectBle}
              className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-whoop-red border border-rose-500/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <BluetoothOff className="w-4 h-4" />
              <span>Disconnect Strap</span>
            </button>
          ) : (
            <button
              onClick={() => onConnectBle(false)}
              className="flex-1 py-2.5 rounded-xl bg-[#12151A] hover:bg-[#181C23] border border-[#2A303C] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Bluetooth className="w-4 h-4 text-[#00B4D8]" />
              <span>Connect Physical Whoop 4.0</span>
            </button>
          )}

          <button
            onClick={onToggleSimulator}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              isSimulator
                ? 'bg-whoop-green/15 text-whoop-green border border-whoop-green/40'
                : 'bg-[#12151A] text-zinc-400 border border-[#262B35] hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSimulator ? 'Sim ON' : 'Sim Demo'}</span>
          </button>
        </div>
      </div>

      {/* 2. Embedded Single-Column GATT Explorer & Telemetry Sniffer */}
      <GattExplorer
        services={services}
        packets={packets}
        isConnected={metadata.connected}
        onClearPackets={onClearPackets}
        onRefreshGattTree={onRefreshGattTree}
      />
    </div>
  );
};
