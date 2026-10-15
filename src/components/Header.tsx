import React, { useState } from 'react';
import {
  Activity,
  Bluetooth,
  BluetoothOff,
  Battery,
  Settings,
  Sparkles,
  Dumbbell,
  Moon,
  Coffee,
  ChevronDown,
  Timer,
} from 'lucide-react';
import type { DeviceMetadata, LiveMetrics } from '../types/whoop';
import type { SimulatorState } from '../services/WhoopSimulator';

interface HeaderProps {
  metadata: DeviceMetadata;
  metrics: LiveMetrics;
  isSimulator: boolean;
  simulatorMode: SimulatorState;
  onConnect: (filterByWhoop: boolean) => void;
  onDisconnect: () => void;
  onToggleSimulator: () => void;
  onSelectSimulatorMode: (mode: SimulatorState) => void;
  onOpenSettings: () => void;
  onStartRecoveryTest: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  metrics,
  isSimulator,
  simulatorMode,
  onConnect,
  onDisconnect,
  onToggleSimulator,
  onSelectSimulatorMode,
  onOpenSettings,
  onStartRecoveryTest,
}) => {
  const [showConnectMenu, setShowConnectMenu] = useState(false);

  const pulseDuration = metrics.currentHr > 0 ? (60 / metrics.currentHr).toFixed(2) : '1.0';

  return (
    <header className="sticky top-0 z-40 w-full bg-whoop-bg/90 backdrop-blur-md border-b border-whoop-border/70 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-whoop-crimson via-whoop-cyan to-whoop-green flex items-center justify-center p-0.5 shadow-lg shadow-cyan-500/10">
              <div className="w-full h-full bg-whoop-bg rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-whoop-cyan" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-wider text-white uppercase font-sans">
                  WHOOP <span className="text-whoop-cyan font-mono text-xs">PULSE 4.0</span>
                </h1>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-whoop-border text-whoop-muted tracking-wide">
                  Offline BLE
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {metadata.connected ? (
                  <span className="flex items-center gap-1.5 text-whoop-green font-medium">
                    <span className="w-2 h-2 rounded-full bg-whoop-green animate-ping" />
                    <span>{metadata.name || 'Whoop 4.0'}</span>
                  </span>
                ) : metadata.connecting ? (
                  <span className="flex items-center gap-1.5 text-whoop-amber font-medium">
                    <span className="w-2 h-2 rounded-full bg-whoop-amber animate-pulse" />
                    <span>Connecting BLE...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    <span>Disconnected</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live HR Beating Pill */}
        <div className="flex items-center gap-3 order-last md:order-none w-full md:w-auto justify-center">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-whoop-card border border-whoop-border/80 shadow-inner">
            <div
              className="text-whoop-crimson flex items-center justify-center"
              style={{
                animation: metrics.currentHr > 0 ? `heartbeat ${pulseDuration}s ease-in-out infinite` : 'none',
              }}
            >
              <Activity className="w-5 h-5 text-whoop-crimson fill-whoop-crimson" />
            </div>

            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xl font-black text-white">{metrics.currentHr > 0 ? metrics.currentHr : '--'}</span>
              <span className="text-[10px] font-bold text-whoop-muted uppercase">BPM</span>
            </div>

            <div className="h-4 w-[1px] bg-whoop-border" />

            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  metrics.currentZone === 5
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : metrics.currentZone === 4
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : metrics.currentZone === 3
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : metrics.currentZone === 2
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : metrics.currentZone === 1
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {metrics.currentZone > 0 ? `Zone ${metrics.currentZone}` : 'Rest'}
              </span>
            </div>

            {/* Battery Indicator */}
            {metadata.batteryLevel !== null && (
              <>
                <div className="h-4 w-[1px] bg-whoop-border" />
                <div className="flex items-center gap-1 text-xs font-mono text-slate-300">
                  <Battery className={`w-4 h-4 ${metadata.batteryLevel < 20 ? 'text-whoop-crimson' : 'text-whoop-green'}`} />
                  <span>{metadata.batteryLevel}%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions, Simulator Toggle, Connect, Settings */}
        <div className="flex items-center gap-2">
          {/* Recovery Test Button */}
          <button
            onClick={onStartRecoveryTest}
            title="Start 3-Minute Recovery Test"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-whoop-card hover:bg-whoop-hover text-whoop-green border border-whoop-green/30 transition-all hover:border-whoop-green"
          >
            <Timer className="w-3.5 h-3.5 text-whoop-green" />
            <span>Recovery Test</span>
          </button>

          {/* Simulator Toggle & Controls */}
          <div className="flex items-center gap-1 bg-whoop-card p-1 rounded-xl border border-whoop-border">
            <button
              onClick={onToggleSimulator}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                isSimulator
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md shadow-cyan-600/20'
                  : 'text-whoop-muted hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSimulator ? 'Sim ON' : 'Sim Demo'}</span>
            </button>

            {isSimulator && (
              <div className="flex items-center gap-0.5 pl-1 border-l border-whoop-border">
                <button
                  onClick={() => onSelectSimulatorMode('resting')}
                  title="Resting Mode (60 BPM)"
                  className={`p-1 rounded text-xs transition-colors ${
                    simulatorMode === 'resting' ? 'bg-whoop-surface text-whoop-green font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onSelectSimulatorMode('workout')}
                  title="Workout Mode (160 BPM / Strain)"
                  className={`p-1 rounded text-xs transition-colors ${
                    simulatorMode === 'workout' ? 'bg-whoop-surface text-whoop-crimson font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onSelectSimulatorMode('sleep')}
                  title="Sleep Mode (50 BPM / High HRV)"
                  className={`p-1 rounded text-xs transition-colors ${
                    simulatorMode === 'sleep' ? 'bg-whoop-surface text-whoop-cyan font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Bluetooth Connect / Disconnect */}
          {metadata.connected ? (
            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all"
            >
              <BluetoothOff className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          ) : (
            <div className="relative">
              <div className="inline-flex rounded-xl shadow-sm">
                <button
                  onClick={() => onConnect(false)}
                  disabled={metadata.connecting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-l-xl bg-whoop-cyan hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  <Bluetooth className="w-4 h-4 text-slate-950" />
                  <span>{metadata.connecting ? 'Connecting...' : 'Connect Whoop'}</span>
                </button>
                <button
                  onClick={() => setShowConnectMenu(!showConnectMenu)}
                  className="px-1.5 py-1.5 rounded-r-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-l border-cyan-600 transition-all"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {showConnectMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-whoop-card border border-whoop-border shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setShowConnectMenu(false);
                      onConnect(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-whoop-hover flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-white">Scan All BLE Devices</span>
                    <span className="text-[10px] text-whoop-muted">Recommended for Whoop 4.0 & BLE straps</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowConnectMenu(false);
                      onConnect(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-whoop-hover flex flex-col gap-0.5 border-t border-whoop-border/50"
                  >
                    <span className="font-semibold text-white">Filter "WHOOP" Name Only</span>
                    <span className="text-[10px] text-whoop-muted">Filters by WHOOP device name prefix</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-whoop-card hover:bg-whoop-hover text-slate-300 hover:text-white border border-whoop-border transition-colors"
            title="User Biometrics & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
