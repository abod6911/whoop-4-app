import React, { useState } from 'react';
import type { DeviceMetadata, GattServiceInfo, RawBlePacket } from '../../types/whoop';
import { biometricEngine } from '../../utils/biometricEngine';
import { whoopBleEngine } from '../../services/whoopBleEngine';
import { notificationEngine } from '../../services/notificationEngine';
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
  Radio,
  Vibrate,
  Database,
  Terminal,
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
  onConnectBle: (mode?: 'filtered' | 'all') => void;
  onDisconnectBle: () => void;
  onClearPackets: () => void;
  onRefreshGattTree: () => void;
}

import { useLanguage } from '../../i18n/LanguageContext';

export const StrapLabView: React.FC<StrapLabViewProps> = ({
  metadata,
  services,
  packets,
  onConnectBle,
  onDisconnectBle,
  onClearPackets,
  onRefreshGattTree,
}) => {
  const { t, isRtl } = useLanguage();
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const isBatteryLow = metadata.batteryLevel !== null && metadata.batteryLevel < 15;
  const poincarePoints = biometricEngine.getPoincarePoints();
  const { sd1, sd2 } = biometricEngine.calculateSD1AndSD2();
  const baevsky = biometricEngine.calculateBaevskyStressIndex();

  const handleCommand = async (name: string, fn: () => Promise<void>) => {
    try {
      setCommandFeedback(`Executing ${name}...`);
      await fn();
      setCommandFeedback(`âœ“ ${name} dispatched successfully`);
      setTimeout(() => setCommandFeedback(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCommandFeedback(`âœ• ${msg}`);
      setTimeout(() => setCommandFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. WHOOP 4.0 Hardware Dashboard Card */}
      <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <WhoopLogo size="sm" showWordmark={true} />
            <span className="text-[10px] font-mono bg-[#0B0D10] px-2 py-0.5 rounded text-white border border-white/5">
              {t('strapTitle')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                metadata.connected ? 'bg-[#16EC06] animate-ping' : 'bg-zinc-600'
              }`}
            />
            <span className="text-xs font-bold font-condensed uppercase text-white">
              {metadata.connected ? t('connected') : t('disconnected')}
            </span>
          </div>
        </div>

        {/* Hardware Specs Grid */}
        <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
          {/* Battery */}
          <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">
              {t('battery')}
            </div>
            <div className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <Battery
                className={`w-4 h-4 ${
                  metadata.batteryLevel === null
                    ? 'text-zinc-500'
                    : isBatteryLow
                    ? 'text-[#FF3344]'
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
              {t('wristPlacement')}
            </div>
            <div className="text-sm font-bold mt-1.5 font-condensed uppercase truncate">
              {metadata.onWrist === true ? (
                <span className="text-[#16EC06] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('onWrist')}
                </span>
              ) : metadata.onWrist === false ? (
                <span className="text-[#FFDE00] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {t('offWrist')}
                </span>
              ) : (
                <span className="text-zinc-500">--</span>
              )}
            </div>
          </div>

          {/* Firmware */}
          <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">
              {t('firmware')}
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {metadata.firmwareRevision || '--'}
            </div>
          </div>

          {/* Hardware Model */}
          <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-condensed">
              {isRtl ? 'Ø·Ø±Ø§Ø² Ø§Ù„Ø¹ØªØ§Ø¯' : 'Hardware Model'}
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
              className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[#FF3344] border border-rose-500/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <BluetoothOff className="w-4 h-4" />
              <span>{t('disconnectStrap')}</span>
            </button>
          ) : (
            <button
              onClick={() => onConnectBle('filtered')}
              className="w-full py-3 rounded-xl bg-[#0093E9] hover:bg-[#00B4D8] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-98"
            >
              <Bluetooth className="w-4 h-4" />
              <span>{t('pairFiltered')}</span>
            </button>
          )}
        </div>

        {/* Proprietary Framed WHOOP 4.0 Commands */}
        {metadata.connected && (
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase font-condensed tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-[#0093E9]" />
                {isRtl ? 'Ø£ÙˆØ§Ù…Ø± Ø§Ù„ØªØ­ÙƒÙ… Ø§Ù„Ø­ØµØ±ÙŠØ© ÙÙŠ Ø§Ù„Ø³ÙˆØ§Ø± (Ø§Ù„Ø¬ÙŠÙ„ Ø§Ù„Ø±Ø§Ø¨Ø¹)' : 'Proprietary Command Triggers (Gen4 Framed)'}
              </span>
              {commandFeedback && (
                <span className="text-[10px] font-condensed font-bold text-[#16EC06] animate-pulse">
                  {commandFeedback}
                </span>
              )}
            </div>

            <button
              onClick={() => handleCommand('Wake Sensor & Stream', () => whoopBleEngine.wakeSensorAndEnableLiveStream())}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0093E9]/20 to-[#00F0FF]/20 border border-[#0093E9]/40 hover:bg-[#0093E9]/30 active:scale-98 text-start transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#00F0FF] animate-pulse" />
                <span className="text-xs font-black uppercase text-white font-condensed">
                  {isRtl ? 'âš¡ Ø¥ÙŠÙ‚Ø§Ø¸ Ø§Ù„Ø­Ø³Ø§Ø³ ÙˆØªÙ†Ø´ÙŠØ· Ø¨Ø« Ø§Ù„Ù†Ø¨Ø¶ Ø§Ù„Ø­ÙŠ' : 'âš¡ Wake Sensor & Force Live Stream'}
                </span>
              </div>
              <span className="text-[10px] text-[#00F0FF] font-mono font-bold">Opcodes 0x23/0x11</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCommand('Realtime Stream (0x11)', () => whoopBleEngine.sendToggleRealtimeHr(true))}
                className="p-2 rounded-xl bg-[#0B0D10] border border-white/5 hover:border-zinc-700 active:scale-95 text-start transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white font-condensed">
                  <Radio className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>{isRtl ? 'Ø¨Ø« Ø§Ù„Ù†Ø¨Ø¶ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±' : 'Realtime Stream'}</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono block">Opcode 0x11</span>
              </button>

              <button
                onClick={() => handleCommand('Haptic Vibration (0x25)', () => whoopBleEngine.sendTriggerHapticAlarm())}
                className="p-2 rounded-xl bg-[#0B0D10] border border-white/5 hover:border-zinc-700 active:scale-95 text-start transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white font-condensed">
                  <Vibrate className="w-3.5 h-3.5 text-[#FFDE00]" />
                  <span>{isRtl ? 'ØªØ´ØºÙŠÙ„ Ø§Ù„Ø§Ù‡ØªØ²Ø§Ø²' : 'Trigger Haptic'}</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono block">Opcode 0x25</span>
              </button>

              <button
                onClick={() => handleCommand('Battery & Fuel Gauge (0x14)', () => whoopBleEngine.sendRequestBatteryTemp())}
                className="p-2 rounded-xl bg-[#0B0D10] border border-white/5 hover:border-zinc-700 active:scale-95 text-start transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white font-condensed">
                  <Battery className="w-3.5 h-3.5 text-[#16EC06]" />
                  <span>{isRtl ? 'ÙØ­Øµ Ø§Ù„Ø¨Ø·Ø§Ø±ÙŠØ© ÙˆØ§Ù„Ø­Ø±Ø§Ø±Ø©' : 'Poll Battery/Temp'}</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono block">Opcode 0x14</span>
              </button>

              <button
                onClick={() => handleCommand('Sync Flash Buffer (0x08)', () => whoopBleEngine.sendSyncHistoryBuffer())}
                className="p-2 rounded-xl bg-[#0B0D10] border border-white/5 hover:border-zinc-700 active:scale-95 text-start transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white font-condensed">
                  <Database className="w-3.5 h-3.5 text-[#0093E9]" />
                  <span>{isRtl ? 'Ù…Ø²Ø§Ù…Ù†Ø© Ø°Ø§ÙƒØ±Ø© Ø§Ù„ÙÙ„Ø§Ø´' : 'Sync Flash Chunks'}</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono block">Opcode 0x08</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Live RR-Interval PoincarÃ© Scatter Plot */}
      <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'Ù…Ø®Ø·Ø· Ø¨ÙˆØ§Ù†ÙƒØ§Ø±ÙŠÙ‡ Ø§Ù„Ø­ÙŠ Ù„Ù†Ø¨Ø¶Ø§Øª Ø§Ù„Ù‚Ù„Ø¨ (RRâ‚™ Ù…Ù‚Ø§Ø¨Ù„ RRâ‚™â‚Šâ‚)' : 'Live RR-Interval PoincarÃ© Plot (RRâ‚™ vs RRâ‚™â‚Šâ‚)'}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {poincarePoints.length} {isRtl ? 'Ù†Ø¨Ø¶Ø©' : 'BEATS'}
          </span>
        </div>

        {/* SD1, SD2, and Baevsky Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-condensed">
          <div className="p-2 bg-[#0B0D10] rounded-xl border border-white/5">
            <span className="text-[10px] text-zinc-400 block uppercase">
              {isRtl ? 'SD1 (Ø§Ù„Ø¨Ø§Ø±Ø§Ø³Ù…Ø¨Ø«Ø§ÙˆÙŠ)' : 'SD1 (Vagal)'}
            </span>
            <span className="text-sm font-black text-[#16EC06]">{sd1 !== null ? `${sd1} ms` : '--'}</span>
          </div>
          <div className="p-2 bg-[#0B0D10] rounded-xl border border-white/5">
            <span className="text-[10px] text-zinc-400 block uppercase">
              {isRtl ? 'SD2 (Ø§Ù„Ø³Ù…Ø¨Ø«Ø§ÙˆÙŠ)' : 'SD2 (Sympathetic)'}
            </span>
            <span className="text-sm font-black text-[#0093E9]">{sd2 !== null ? `${sd2} ms` : '--'}</span>
          </div>
          <div className="p-2 bg-[#0B0D10] rounded-xl border border-white/5">
            <span className="text-[10px] text-zinc-400 block uppercase">
              {isRtl ? 'Ù…Ø¤Ø´Ø± Ø¨Ø§ÙŠÙØ³ÙƒÙŠ Ù„Ù„Ø¶ØºØ·' : 'Baevsky Stress'}
            </span>
            <span className="text-sm font-black text-[#FFDE00]">{baevsky !== null ? `${baevsky}` : '--'}</span>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
          {isRtl
            ? 'ØªØµÙˆÙŠØ± Ø¨ÙŠØ§Ù†ÙŠ Ù„Ù†ØºÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ø§Ù„Ø¹ØµØ¨ÙŠ Ø§Ù„Ø°Ø§ØªÙŠ. ÙŠÙˆØ¶Ø­ Ø§Ù„Ø§Ù†ØªØ´Ø§Ø± Ø§Ù„Ù…Ø°Ù†Ø¨ Ø§Ù„Ø·ÙˆÙŠÙ„ ØªØ¹Ø§ÙÙŠØ§Ù‹ Ø¨Ø§Ø±Ø§Ø³Ù…Ø¨Ø«Ø§ÙˆÙŠØ§Ù‹ Ù…Ù…ØªØ§Ø²Ø§Ù‹ Ø¹Ø¨Ø± Ø§Ù„Ø¹ØµØ¨ Ø§Ù„Ø­Ø§Ø¦Ø±.'
            : 'Visualizes autonomic nervous system tone. An elongated comet scatter demonstrates strong parasympathetic vagal recovery.'}
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
              <p>{isRtl ? 'Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ù‚Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ù†Ø¨Ø¶ Ø§Ù„Ù„Ø­Ø¸ÙŠØ© Ù…Ù† Ø³ÙˆØ§Ø± WHOOP 4.0...' : 'Waiting for beat-to-beat intervals from WHOOP 4.0...'}</p>
              <p className="text-[10px] text-zinc-600 mt-1">
                {isRtl ? 'Ø§Ø±ØªØ¯Ù Ø§Ù„Ø³ÙˆØ§Ø± Ø¨Ø¥Ø­ÙƒØ§Ù… Ù„ØªØ³Ø¬ÙŠÙ„ Ù†Ù‚Ø§Ø· RR.' : 'Wear the strap securely to record RR points.'}
              </p>
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
