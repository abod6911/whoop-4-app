import React from 'react';
import type { DeviceMetadata } from '../types/whoop';
import { WhoopLogo } from './WhoopLogo';
import {
  Bluetooth,
  BluetoothOff,
  Battery,
  X,
  Radio,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface StrapConnectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: DeviceMetadata;
  permittedDevices?: BluetoothDevice[];
  onConnectBle: (forceChooser?: boolean) => void;
  onReconnectPermitted?: (device?: BluetoothDevice) => void;
  onDisconnectBle: () => void;
}

export const StrapConnectSheet: React.FC<StrapConnectSheetProps> = ({
  isOpen,
  onClose,
  metadata,
  permittedDevices = [],
  onConnectBle,
  onReconnectPermitted,
  onDisconnectBle,
}) => {
  if (!isOpen) return null;

  const isBatteryLow = metadata.batteryLevel !== null && metadata.batteryLevel < 15;
  const hasPermitted = permittedDevices.length > 0;
  const primaryPermitted = permittedDevices[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-[430px] p-5 rounded-t-[28px] bg-[#16191E] border-t border-x border-white/10 shadow-2xl space-y-4 animate-in slide-in-from-bottom-5">
        {/* iOS Handle Indicator */}
        <div className="w-10 h-1 rounded-full bg-zinc-600 mx-auto -mt-1 mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <WhoopLogo size="sm" showWordmark={true} />
            <span className="text-[10px] font-mono bg-[#0B0D10] px-2 py-0.5 rounded text-white border border-white/5">
              4.0 STRAP
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#222730] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hardware Status Strip */}
        <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between text-xs font-condensed">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">Status</span>
            <span className="flex items-center gap-1.5 font-black text-white">
              <span
                className={`w-2 h-2 rounded-full ${
                  metadata.connected
                    ? 'bg-[#16EC06] animate-ping'
                    : metadata.connecting
                    ? 'bg-[#FFDE00] animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              {metadata.connected
                ? metadata.name || 'WHOOP 4.0 Connected'
                : metadata.connecting
                ? 'Connecting / Reconnecting...'
                : 'Disconnected'}
            </span>
          </div>

          {/* Real Battery Level */}
          <div className="flex items-center justify-between text-xs font-condensed border-t border-white/5 pt-2.5">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">Battery</span>
            <div className="flex items-center gap-1.5 font-mono font-bold">
              <Battery
                className={`w-4 h-4 ${
                  metadata.batteryLevel === null
                    ? 'text-zinc-500'
                    : isBatteryLow
                    ? 'text-[#FF0026]'
                    : metadata.batteryLevel < 50
                    ? 'text-[#FFDE00]'
                    : 'text-[#16EC06]'
                }`}
              />
              <span className={metadata.batteryLevel !== null ? 'text-white' : 'text-zinc-500'}>
                {metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : '--'}
              </span>
            </div>
          </div>

          {/* Wrist Contact Detection */}
          <div className="flex items-center justify-between text-xs font-condensed border-t border-white/5 pt-2.5">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">Wrist Placement</span>
            <span
              className={`text-xs font-bold font-condensed uppercase ${
                metadata.onWrist === true
                  ? 'text-[#16EC06]'
                  : metadata.onWrist === false
                  ? 'text-[#FFDE00]'
                  : 'text-zinc-500'
              }`}
            >
              {metadata.onWrist === true
                ? '✓ On Wrist (Locked)'
                : metadata.onWrist === false
                ? 'Off Wrist'
                : metadata.connected
                ? 'Detecting...'
                : '--'}
            </span>
          </div>

          {/* Firmware & Serial */}
          <div className="flex items-center justify-between text-xs font-condensed border-t border-white/5 pt-2.5">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">Firmware</span>
            <span className="font-mono text-zinc-300 text-[11px]">
              {metadata.firmwareRevision || '--'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-condensed border-t border-white/5 pt-2.5">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">Serial Number</span>
            <span className="font-mono text-zinc-300 text-[11px]">
              {metadata.serialNumber || '--'}
            </span>
          </div>
        </div>

        {/* Real Web Bluetooth Connection Controls */}
        <div className="space-y-2 font-condensed">
          {metadata.connected ? (
            <button
              onClick={() => {
                onDisconnectBle();
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[#FF0026] border border-rose-500/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <BluetoothOff className="w-4 h-4" />
              <span>Disconnect Strap</span>
            </button>
          ) : (
            <>
              {/* 1-Click Reconnect to Previously Permitted WHOOP Band */}
              {hasPermitted && onReconnectPermitted && (
                <button
                  onClick={() => {
                    onClose();
                    onReconnectPermitted(primaryPermitted);
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#16EC06] hover:bg-[#14d605] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  <Bluetooth className="w-4 h-4 stroke-[2.5]" />
                  <span>1-Click Reconnect to {primaryPermitted.name || 'WHOOP 4.0'}</span>
                </button>
              )}

              {/* Pair via Filtered Web Bluetooth Request */}
              <button
                onClick={() => {
                  onClose();
                  onConnectBle(true);
                }}
                className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  hasPermitted
                    ? 'bg-[#222832] hover:bg-[#2C3442] text-zinc-200 border border-white/10'
                    : 'bg-[#0093E9] hover:bg-[#00B4D8] text-black shadow-lg shadow-cyan-500/20'
                }`}
              >
                <Bluetooth className="w-4 h-4" />
                <span>{hasPermitted ? 'Pair Different WHOOP Band (Search BLE)' : 'Pair Physical WHOOP 4.0 via Bluetooth'}</span>
              </button>

              <div className="text-[10px] text-zinc-400 text-center font-sans pt-1">
                Filtered strictly for WHOOP 4.0 straps via 0x180D (Heart Rate) & 0x180F (Battery)
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

