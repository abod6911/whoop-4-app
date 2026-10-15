import React from 'react';
import type { DeviceMetadata } from '../types/whoop';
import type { SimulatorState } from '../services/WhoopSimulator';
import { WhoopLogo } from './WhoopLogo';
import {
  Bluetooth,
  BluetoothOff,
  Battery,
  Radio,
  X,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface StrapConnectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: DeviceMetadata;
  isSimulator: boolean;
  simulatorMode: SimulatorState;
  onConnectBle: (filterByWhoop: boolean) => void;
  onDisconnectBle: () => void;
  onToggleSimulator: () => void;
  onSelectSimulatorMode: (mode: SimulatorState) => void;
}

export const StrapConnectSheet: React.FC<StrapConnectSheetProps> = ({
  isOpen,
  onClose,
  metadata,
  isSimulator,
  simulatorMode,
  onConnectBle,
  onDisconnectBle,
  onToggleSimulator,
  onSelectSimulatorMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-[430px] p-5 rounded-t-3xl bg-[#12151A] border-t border-x border-[#262B35] shadow-2xl space-y-4 animate-in slide-in-from-bottom-5">
        {/* iOS Handle Indicator */}
        <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto -mt-1 mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E232D] pb-3">
          <div className="flex items-center gap-2.5">
            <WhoopLogo size="sm" showWordmark={true} />
            <span className="text-[10px] font-mono bg-[#181C23] px-2 py-0.5 rounded text-white border border-[#262B35]">
              4.0 STRAP
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-[#181C23] text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hardware Status Strip */}
        <div className="p-3.5 rounded-2xl bg-[#181C23] border border-[#262B35] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-condensed">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">Status</span>
            <span className="flex items-center gap-1.5 font-black text-white">
              <span
                className={`w-2 h-2 rounded-full ${
                  metadata.connected ? 'bg-whoop-green animate-ping' : 'bg-zinc-600'
                }`}
              />
              {metadata.connected
                ? metadata.name || 'WHOOP 4.0'
                : isSimulator
                ? 'SIMULATION PREVIEW'
                : 'DISCONNECTED'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-condensed border-t border-[#262B35]/60 pt-2">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">Battery</span>
            <div className="flex items-center gap-1.5 font-mono text-white font-bold">
              <Battery
                className={`w-4 h-4 ${
                  (metadata.batteryLevel ?? 80) < 20
                    ? 'text-whoop-red'
                    : (metadata.batteryLevel ?? 80) < 50
                    ? 'text-whoop-yellow'
                    : 'text-whoop-green'
                }`}
              />
              <span>{metadata.batteryLevel ?? 88}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-condensed border-t border-[#262B35]/60 pt-2">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">Firmware</span>
            <span className="font-mono text-zinc-300 text-[11px]">
              {metadata.firmwareRevision || '41.14.2.0'}
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
              className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-whoop-red border border-whoop-red/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <BluetoothOff className="w-4 h-4" />
              <span>Disconnect BLE Strap</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onConnectBle(false);
              }}
              className="w-full py-3 rounded-xl bg-whoop-blue hover:bg-[#00B4D8] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <Bluetooth className="w-4 h-4" />
              <span>Connect Physical WHOOP 4.0 via Bluetooth</span>
            </button>
          )}
        </div>

        {/* Discreet Simulation Preview Control */}
        <div className="pt-2 border-t border-[#1E232D] space-y-2">
          <div className="flex items-center justify-between text-xs font-condensed">
            <span className="text-zinc-400 font-bold uppercase tracking-wide">Preview Simulator</span>
            <button
              onClick={onToggleSimulator}
              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${
                isSimulator
                  ? 'bg-whoop-green text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {isSimulator ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          {isSimulator && (
            <div className="grid grid-cols-3 gap-1.5 pt-1 font-condensed text-xs">
              <button
                onClick={() => onSelectSimulatorMode('resting')}
                className={`py-1.5 rounded-lg border text-center transition-all ${
                  simulatorMode === 'resting'
                    ? 'bg-[#181C23] text-whoop-green border-whoop-green font-black'
                    : 'bg-black text-zinc-400 border-[#262B35]'
                }`}
              >
                Rest
              </button>
              <button
                onClick={() => onSelectSimulatorMode('workout')}
                className={`py-1.5 rounded-lg border text-center transition-all ${
                  simulatorMode === 'workout'
                    ? 'bg-[#181C23] text-whoop-blue border-whoop-blue font-black'
                    : 'bg-black text-zinc-400 border-[#262B35]'
                }`}
              >
                Workout
              </button>
              <button
                onClick={() => onSelectSimulatorMode('sleep')}
                className={`py-1.5 rounded-lg border text-center transition-all ${
                  simulatorMode === 'sleep'
                    ? 'bg-[#181C23] text-whoop-sleep border-whoop-sleep font-black'
                    : 'bg-black text-zinc-400 border-[#262B35]'
                }`}
              >
                Sleep
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
