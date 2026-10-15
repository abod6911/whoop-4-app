import React, { useState } from 'react';
import type { DeviceMetadata, LiveMetrics, HomeSubTab } from '../types/whoop';
import type { SimulatorState } from '../services/WhoopSimulator';
import { WhoopLogo } from './WhoopLogo';
import {
  Activity,
  Battery,
  Bluetooth,
  BluetoothOff,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  Wifi,
  ChevronDown,
} from 'lucide-react';

interface WhoopTopBarProps {
  metadata: DeviceMetadata;
  metrics: LiveMetrics;
  activeSubTab: HomeSubTab;
  onChangeSubTab: (tab: HomeSubTab) => void;
  isSimulator: boolean;
  simulatorMode: SimulatorState;
  onConnectBle: (filterByWhoop: boolean) => void;
  onDisconnectBle: () => void;
  onToggleSimulator: () => void;
  onSelectSimulatorMode: (mode: SimulatorState) => void;
  selectedDate: string;
  onPrevDate: () => void;
  onNextDate: () => void;
}

export const WhoopTopBar: React.FC<WhoopTopBarProps> = ({
  metadata,
  metrics,
  activeSubTab,
  onChangeSubTab,
  isSimulator,
  simulatorMode,
  onConnectBle,
  onDisconnectBle,
  onToggleSimulator,
  onSelectSimulatorMode,
  selectedDate,
  onPrevDate,
  onNextDate,
}) => {
  const [showStrapSheet, setShowStrapSheet] = useState(false);

  const pulseDuration = metrics.currentHr > 0 ? (60 / metrics.currentHr).toFixed(2) : '1.0';

  return (
    <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-whoop-border/60">
      {/* Upper Status Bar */}
      <div className="px-3 pt-2.5 pb-2 flex items-center justify-between gap-2 max-w-[430px] mx-auto">
        {/* Left: User Avatar & Streak */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-whoop-blue via-whoop-cyan to-whoop-green p-[1.5px] flex items-center justify-center">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-xs font-black text-white font-condensed">
              AP
            </div>
          </div>
          <div className="flex items-center gap-1 bg-whoop-surface/80 border border-whoop-border/80 px-2 py-0.5 rounded-full">
            <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
            <span className="text-[10px] font-black text-white font-condensed tracking-wide">
              14 D
            </span>
          </div>
        </div>

        {/* Center: Date Selector Pill */}
        <div className="flex items-center gap-1 bg-whoop-surface/80 border border-whoop-border/80 px-1 py-0.5 rounded-full">
          <button
            onClick={onPrevDate}
            className="p-1 rounded-full hover:bg-whoop-border text-whoop-muted hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-black uppercase text-white font-condensed tracking-widest px-1">
            {selectedDate}
          </span>
          <button
            onClick={onNextDate}
            className="p-1 rounded-full hover:bg-whoop-border text-whoop-muted hover:text-white transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: WHOOP 4.0 Strap Status Pill */}
        <button
          onClick={() => setShowStrapSheet(!showStrapSheet)}
          className="flex items-center gap-1.5 bg-whoop-surface border border-whoop-border hover:border-slate-600 px-2.5 py-1 rounded-full transition-all"
        >
          {/* Beating Heart Icon */}
          <div
            className="text-whoop-red flex items-center justify-center"
            style={{
              animation: metrics.currentHr > 0 ? `heartbeat ${pulseDuration}s ease-in-out infinite` : 'none',
            }}
          >
            <Activity className="w-3.5 h-3.5 text-whoop-red fill-whoop-red" />
          </div>

          <span className="text-xs font-black font-condensed text-white tabular-nums">
            {metrics.currentHr > 0 ? metrics.currentHr : '--'}
          </span>

          {/* Battery Icon */}
          <div className="flex items-center gap-0.5 text-[10px] font-mono text-whoop-gray pl-1 border-l border-whoop-border">
            <Battery
              className={`w-3.5 h-3.5 ${
                (metadata.batteryLevel ?? 80) < 20
                  ? 'text-whoop-red'
                  : (metadata.batteryLevel ?? 80) < 50
                  ? 'text-whoop-yellow'
                  : 'text-whoop-green'
              }`}
            />
            <span>{metadata.batteryLevel ?? 88}%</span>
          </div>
        </button>
      </div>

      {/* Strap Action Sheet Dropdown */}
      {showStrapSheet && (
        <div className="px-3 pb-3 max-w-[430px] mx-auto animate-in slide-in-from-top-2">
          <div className="p-3.5 rounded-2xl bg-whoop-card border border-whoop-border shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
              <div className="flex items-center gap-2">
                <WhoopLogo size="sm" showWordmark={true} />
                <span className="text-[10px] font-mono bg-whoop-surface px-1.5 py-0.5 rounded text-whoop-muted">
                  4.0
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white font-condensed">
                  {metadata.connected ? metadata.name || 'WHOOP 4.0' : isSimulator ? 'Simulated Whoop 4.0' : 'Disconnected'}
                </div>
                <div className="text-[10px] text-whoop-muted font-mono">
                  {metadata.firmwareRevision || 'FW 41.14.2.0'}
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-condensed">
              {metadata.connected ? (
                <button
                  onClick={() => {
                    setShowStrapSheet(false);
                    onDisconnectBle();
                  }}
                  className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-whoop-red border border-whoop-red/30 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BluetoothOff className="w-3.5 h-3.5" />
                  <span>Disconnect BLE</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowStrapSheet(false);
                    onConnectBle(false);
                  }}
                  className="py-2 px-3 rounded-xl bg-whoop-blue hover:bg-[#00B4D8] text-black font-black flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>Connect Whoop 4.0</span>
                </button>
              )}

              <button
                onClick={() => {
                  onToggleSimulator();
                }}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isSimulator
                    ? 'bg-whoop-green/15 text-whoop-green border border-whoop-green/40'
                    : 'bg-whoop-surface text-whoop-gray border border-whoop-border hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSimulator ? 'Sim Active' : 'Enable Sim'}</span>
              </button>
            </div>

            {/* If Simulator active, show quick mode buttons */}
            {isSimulator && (
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-whoop-border/50 text-[11px] font-condensed">
                <span className="text-whoop-muted text-[10px]">Sim State:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onSelectSimulatorMode('resting')}
                    className={`px-2 py-0.5 rounded ${simulatorMode === 'resting' ? 'bg-whoop-green text-black font-bold' : 'text-whoop-gray hover:text-white'}`}
                  >
                    Rest
                  </button>
                  <button
                    onClick={() => onSelectSimulatorMode('workout')}
                    className={`px-2 py-0.5 rounded ${simulatorMode === 'workout' ? 'bg-whoop-blue text-black font-bold' : 'text-whoop-gray hover:text-white'}`}
                  >
                    Workout
                  </button>
                  <button
                    onClick={() => onSelectSimulatorMode('sleep')}
                    className={`px-2 py-0.5 rounded ${simulatorMode === 'sleep' ? 'bg-whoop-sleep text-black font-bold' : 'text-whoop-gray hover:text-white'}`}
                  >
                    Sleep
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Horizontal Sub-Tabs (OVERVIEW | STRAIN | RECOVERY | SLEEP) */}
      <div className="flex items-center justify-between max-w-[430px] mx-auto px-4 border-t border-whoop-border/40">
        {(['overview', 'strain', 'recovery', 'sleep'] as HomeSubTab[]).map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onChangeSubTab(tab)}
              className={`py-2 px-3 text-xs font-black uppercase tracking-wider font-condensed relative transition-colors ${
                isActive ? 'text-white' : 'text-whoop-muted hover:text-whoop-gray'
              }`}
            >
              <span>{tab}</span>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-white rounded-full shadow-sm" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
