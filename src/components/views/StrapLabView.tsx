import React from 'react';
import type { DeviceMetadata, GattServiceInfo, RawBlePacket } from '../../types/whoop';
import { biometricEngine } from '../../utils/biometricEngine';
import { GattExplorer } from '../GattExplorer';
import { WhoopLogo } from '../WhoopLogo';
import {
  Battery,
  Bluetooth,
  BluetoothOff,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface StrapLabViewProps {
  metadata: DeviceMetadata;
  services: GattServiceInfo[];
  packets: RawBlePacket[];
  onConnectBle: () => void;
  onDisconnectBle: () => void;
  onClearPackets: () => void;
  onRefreshGattTree: () => void;
}

export const StrapLabView: React.FC<StrapLabViewProps> = ({
  metadata,
  services,
  packets,
  onConnectBle,
  onDisconnectBle,
  onClearPackets,
  onRefreshGattTree,
}) => {
  const isBatteryLow = metadata.batteryLevel !== null && metadata.batteryLevel < 15;
  const poincarePoints = biometricEngine.getPoincarePoints();

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. WHOOP 4.0 Hardware Dashboard Card */}
      <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <WhoopLogo size="sm" showWordmark={true} />
            <span className="text-[10px] font-mono bg-[#0B0D10] px-2 py-0.5 rounded text-white border border-white/5">
              4.0 HARDWARE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                metadata.connected ? 'bg-[#16EC06] animate-ping' : 'bg-zinc-600'
              }`}
            />
            <span className="text-xs font-bold font-condensed uppercase text-white">
              {metadata.connected ? 'CONNECTED (REAL SENSORS)' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Hardware Specs Grid */}
        <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
          {/* Battery */}
          <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">
              Exact Battery Level
            </div>
            <div className="text-xl font-black text-white mt-1 flex items-center gap-2">
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
              <span className="font-condensed">
                {metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : '--'}
              </span>
            </div>
          </div>

          {/* Wrist Contact Status */}
          <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">
              Wrist Detection
            </div>
            <div className="text-sm font-bold mt-1.5 font-condensed uppercase truncate">
              {metadata.onWrist === true ? (
                <span className="text-[#16EC06] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ON WRIST
                </span>
              ) : metadata.onWrist === false ? (
                <span className="text-[#FFDE00] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> OFF WRIST
                </span>
              ) : (
                <span className="text-zinc-500">--</span>
              )}
            </div>
          </div>

          {/* Firmware */}
          <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">
              Firmware Revision
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {metadata.firmwareRevision || '--'}
            </div>
          </div>

          {/* Hardware Model */}
          <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">
              Hardware Model
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate font-condensed">
              {metadata.hardwareRevision || 'WHOOP 4.0'}
            </div>
          </div>
        </div>

        {/* Connect / Disconnect Buttons */}
        <div className="pt-1 font-condensed">
          {metadata.connected ? (
            <button
              onClick={onDisconnectBle}
              className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[#FF0026] border border-rose-500/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <BluetoothOff className="w-4 h-4" />
              <span>Disconnect Strap</span>
            </button>
          ) : (
            <button
              onClick={onConnectBle}
              className="w-full py-3 rounded-xl bg-[#0093E9] hover:bg-[#00B4D8] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-98"
            >
              <Bluetooth className="w-4 h-4" />
              <span>Connect Physical WHOOP 4.0</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Live RR-Interval Poincaré Scatter Plot */}
      <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Live RR-Interval Poincaré Plot (RRₙ vs RRₙ₊₁)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {poincarePoints.length} BEATS
          </span>
        </div>

        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
          Visualizes autonomic nervous system tone. An elongated comet scatter demonstrates strong parasympathetic vagal recovery.
        </p>

        <div className="h-44 w-full bg-[#080A0E] rounded-xl border border-white/5 p-2">
          {poincarePoints.length > 5 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <XAxis
                  type="number"
                  dataKey="rr1"
                  name="RR_n"
                  domain={['dataMin - 50', 'dataMax + 50']}
                  stroke="#52525B"
                  fontSize={9}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="rr2"
                  name="RR_n+1"
                  domain={['dataMin - 50', 'dataMax + 50']}
                  stroke="#52525B"
                  fontSize={9}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#101318',
                    borderColor: '#262B35',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: unknown) => [`${val} ms`]}
                />
                <Scatter data={poincarePoints} fill="#00F0FF" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-zinc-500 text-center font-sans">
              <p>Waiting for beat-to-beat intervals from WHOOP 4.0...</p>
              <p className="text-[10px] text-zinc-600 mt-1">Wear the strap securely to record RR points.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Embedded GATT Explorer & Raw Hex Telemetry Sniffer */}
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
