import React, { useState } from 'react';
import type { DeviceMetadata, GattServiceInfo, RawBlePacket } from '../../types/whoop';
import { biometricEngine } from '../../utils/biometricEngine';
import { whoopBleEngine } from '../../services/whoopBleEngine';
import { notificationEngine } from '../../services/notificationEngine';
import { pedometerEngine } from '../../services/pedometerEngine';
import { sleepEngine } from '../../services/sleepEngine';
import { activityDetectionEngine } from '../../services/activityDetectionEngine';
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
  Footprints,
  Play,
  Pause,
  RotateCcw,
  Moon,
  RefreshCw,
  Dumbbell,
  Flame,
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
      setCommandFeedback(`✓ ${name} dispatched successfully`);
      setTimeout(() => setCommandFeedback(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCommandFeedback(`✕ ${msg}`);
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
              {isRtl ? 'طراز العتاد' : 'Hardware Model'}
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
                {isRtl ? 'أوامر التحكم الحصرية في السوار (الجيل الرابع)' : 'Proprietary Command Triggers (Gen4 Framed)'}
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
                  {isRtl ? '⚡ إيقاظ الحساس وتنشيط بث النبض الحي' : '⚡ Wake Sensor & Force Live Stream'}
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
                  <span>{isRtl ? 'بث النبض المباشر' : 'Realtime Stream'}</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono block">Opcode 0x11</span>
              </button>

              <button
                onClick={() => handleCommand('Haptic Vibration (0x25)', () => whoopBleEngine.sendTriggerHapticAlarm())}
                className="p-2 rounded-xl bg-[#0B0D10] border border-white/5 hover:border-zinc-700 active:scale-95 text-start transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white font-condensed">
                  <Vibrate className="w-3.5 h-3.5 text-[#FFDE00]" />
                  <span>{isRtl ? 'تشغيل الاهتزاز' : 'Trigger Haptic'}</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono block">Opcode 0x25</span>
              </button>

              <button
                onClick={() => handleCommand('Battery & Fuel Gauge (0x14)', () => whoopBleEngine.sendRequestBatteryTemp())}
                className="p-2 rounded-xl bg-[#0B0D10] border border-white/5 hover:border-zinc-700 active:scale-95 text-start transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white font-condensed">
                  <Battery className="w-3.5 h-3.5 text-[#16EC06]" />
                  <span>{isRtl ? 'فحص البطارية والحرارة' : 'Poll Battery/Temp'}</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono block">Opcode 0x14</span>
              </button>

              <button
                onClick={() => handleCommand('Sync Flash Buffer (0x08)', () => whoopBleEngine.sendSyncHistoryBuffer())}
                className="p-2 rounded-xl bg-[#0B0D10] border border-white/5 hover:border-zinc-700 active:scale-95 text-start transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white font-condensed">
                  <Database className="w-3.5 h-3.5 text-[#0093E9]" />
                  <span>{isRtl ? 'مزامنة ذاكرة الفلاش' : 'Sync Flash Chunks'}</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono block">Opcode 0x08</span>
              </button>
            </div>
          </div>
        )}

        {/* Step & IMU Locomotion Hardware Simulator */}
        <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#00F0FF]/15 flex items-center justify-center">
                <Footprints className="w-3.5 h-3.5 text-[#00F0FF]" />
              </div>
              <span className="text-xs font-black uppercase text-white font-condensed tracking-wider">
                {isRtl ? 'محاكي حركة وخطوات الحساس (IMU Simulator)' : 'IMU Locomotion & Step Simulator'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#00F0FF]">
              {pedometerEngine.getState().steps.toLocaleString()} {isRtl ? 'خطوة' : 'steps'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            {isRtl
              ? 'اختبار بث الخطوات المباشرة وحساب إيقاع الحركة (Cadence) وتأثيرها الفوري على شاشة اليوم والجهد اليومي.'
              : 'Test live step stream accumulation and real-time cadence response across dashboard cards.'}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 font-condensed text-xs font-bold">
            {/* Test Live Step Packet (+1 Step) */}
            <button
              onClick={() => {
                whoopBleEngine.testLiveStepPacket();
                setCommandFeedback(isRtl ? '✓ فحص حزمة خطوة حية (+1 خطوة)' : '✓ Test Live Step Packet (+1 Step)');
                setTimeout(() => setCommandFeedback(null), 2500);
              }}
              className="py-2.5 px-3 rounded-xl bg-[#16191E] border border-white/10 hover:border-[#00F0FF]/40 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Footprints className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>{isRtl ? 'حزمة خطوة حية (+1)' : 'Live Step Packet (+1)'}</span>
            </button>

            {/* Step Burst +50 */}
            <button
              onClick={() => {
                pedometerEngine.simulateStepBurst(50);
                setCommandFeedback(isRtl ? '✓ تمت إضافة 50 خطوة' : '✓ +50 Steps Added');
                setTimeout(() => setCommandFeedback(null), 2500);
              }}
              className="py-2.5 px-3 rounded-xl bg-[#16191E] border border-white/10 hover:border-[#00F0FF]/40 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Footprints className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>+50 {isRtl ? 'خطوة' : 'Steps'}</span>
            </button>

            {/* Continuous Walk Toggle */}
            <button
              onClick={() => {
                const active = pedometerEngine.toggleContinuousWalk();
                setCommandFeedback(
                  active
                    ? isRtl
                      ? '✓ تم بدء محاكاة المشي الحي (112 خ/د)'
                      : '✓ Continuous walk active (112 spm)'
                    : isRtl
                    ? '✓ تم إيقاف المشي'
                    : '✓ Walk stopped'
                );
                setTimeout(() => setCommandFeedback(null), 2500);
              }}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                pedometerEngine.isWalkSimulationActive
                  ? 'bg-[#16EC06]/20 border-[#16EC06] text-[#16EC06]'
                  : 'bg-[#16191E] border-white/10 text-white hover:border-zinc-600'
              }`}
            >
              {pedometerEngine.isWalkSimulationActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#16EC06]" />
                  <span>{isRtl ? 'إيقاف المشي' : 'Stop Walk'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#16EC06]" />
                  <span>{isRtl ? 'مشي مستمر (112 خ/د)' : 'Simulate Walk'}</span>
                </>
              )}
            </button>

            {/* Zero-Mock Reset to 0 */}
            <button
              onClick={() => {
                pedometerEngine.resetTodaySteps();
                setCommandFeedback(isRtl ? '✓ تم تصفير الخطوات (0)' : '✓ Reset to 0 steps');
                setTimeout(() => setCommandFeedback(null), 2500);
              }}
              className="py-2.5 px-3 rounded-xl bg-[#16191E] border border-white/10 hover:border-zinc-600 text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>{isRtl ? 'إعادة ضبط (0)' : 'Reset (0)'}</span>
            </button>

            {/* Primary Offline Step Catch-up Reconnection Simulation */}
            <button
              onClick={async () => {
                setCommandFeedback(isRtl ? 'جاري محاكاة إعادة الاتصال ومزامنة خطوات عدم الاتصال...' : 'Simulating offline steps catch-up sync...');
                const credited = await whoopBleEngine.simulateOfflineStepReconnection(2000, 35);
                setCommandFeedback(
                  isRtl
                    ? `✓ تمت مزامنة +${credited.toLocaleString()} خطوة مسجلة بدون اتصال`
                    : `✓ Offline synced: +${credited.toLocaleString()} steps`
                );
                setTimeout(() => setCommandFeedback(null), 3500);
              }}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#00F0FF]/20 via-[#16EC06]/15 to-[#00F0FF]/20 border border-[#00F0FF]/40 hover:border-[#16EC06] text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.15)] font-black uppercase tracking-wider text-xs font-condensed col-span-2"
            >
              <RefreshCw className="w-4 h-4 text-[#00F0FF]" />
              <span>{isRtl ? 'محاكاة مزامنة خطوات عدم الاتصال (+2,000 خطوة)' : 'Simulate Offline Steps Catch-Up (+2,000 Steps)'}</span>
            </button>
          </div>
        </div>

        {/* Automated Activity Detection Engine Lab (WHOOP 4.0 Style) */}
        <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FF8A00]/15 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-[#FF8A00]" />
              </div>
              <span className="text-xs font-black uppercase text-white font-condensed tracking-wider">
                {isRtl ? 'محاكي الرصد التلقائي للتمارين (Auto-Workout Engine)' : 'Automatic Activity Detection Engine'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#FF8A00]">
              {activityDetectionEngine.getPendingActivity()
                ? (isRtl ? 'بانتظار الاعتماد' : 'Pending Review')
                : (isRtl ? 'جاهز للرصد' : 'Ready')}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            {isRtl
              ? 'حقن جلسة تمرين واقعية مستمرة لأكثر من 12 دقيقة مع معدل نبض مرتفع لتوليد بنر الاعتماد الفوري في صفحة اليوم وحفظها في "أنشطة اليوم".'
              : 'Inject sustained exercise session (>12m) to trigger the WHOOP auto-detection banner and log into Today\'s Activities.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-condensed text-xs font-bold">
            <button
              onClick={() => {
                activityDetectionEngine.simulateDetectedWorkout('Running', 30, 8.5);
                setCommandFeedback(
                  isRtl
                    ? '✓ تم رصد تمرين جري تلقائياً (30 دقيقة • جهد 8.5) - تفقد بنر الاعتماد في الشاشة الرئيسية'
                    : '✓ Auto-detected Run simulated (30m, 8.5 Strain)'
                );
                setTimeout(() => setCommandFeedback(null), 3500);
              }}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF8A00]/20 via-[#FF3344]/15 to-[#FF8A00]/20 border border-[#FF8A00]/40 hover:border-[#16EC06] text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,138,0,0.15)] font-black uppercase tracking-wider text-xs font-condensed sm:col-span-2"
            >
              <Flame className="w-4 h-4 text-[#FF8A00]" />
              <span>{isRtl ? 'محاكاة رصد تمرين جري تلقائياً (30 دقيقة • جهد 8.5)' : 'Simulate Auto-Detected Run (30m, 8.5 Strain)'}</span>
            </button>

            <button
              onClick={() => {
                activityDetectionEngine.simulateDetectedWorkout('HIIT', 25, 12.1);
                setCommandFeedback(isRtl ? '✓ تم رصد تمرين HIIT تلقائياً (25 دقيقة • جهد 12.1)' : '✓ Auto-detected HIIT simulated');
                setTimeout(() => setCommandFeedback(null), 3500);
              }}
              className="py-2.5 px-3 rounded-xl bg-[#16191E] border border-white/10 hover:border-[#FF3344]/40 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Activity className="w-3.5 h-3.5 text-[#FF3344]" />
              <span>{isRtl ? 'تمرين HIIT (جهد 12.1)' : 'HIIT (12.1 Strain)'}</span>
            </button>

            <button
              onClick={() => {
                activityDetectionEngine.simulateDetectedWorkout('Cycling', 45, 11.4);
                setCommandFeedback(isRtl ? '✓ تم رصد تمرين دراجة تلقائياً (45 دقيقة • جهد 11.4)' : '✓ Auto-detected Cycling simulated');
                setTimeout(() => setCommandFeedback(null), 3500);
              }}
              className="py-2.5 px-3 rounded-xl bg-[#16191E] border border-white/10 hover:border-[#0093E9]/40 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Dumbbell className="w-3.5 h-3.5 text-[#0093E9]" />
              <span>{isRtl ? 'ركوب دراجة (45د)' : 'Cycling (45m)'}</span>
            </button>
          </div>
        </div>

        {/* Sleep Simulator & BLE Offline Ingestion Lab */}
        <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#38BDF8]/15 flex items-center justify-center">
                <Moon className="w-3.5 h-3.5 text-[#38BDF8]" />
              </div>
              <span className="text-xs font-black uppercase text-white font-condensed tracking-wider">
                {isRtl ? 'محاكي نوم الليلة الماضية ومزامنة الذاكرة (Sleep Simulator)' : 'Sleep Simulator & Offline Ingestion'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#38BDF8]">
              {sleepEngine.getHypnogram().length > 0
                ? isRtl
                  ? `${sleepEngine.getHypnogram().length} مرحلة مسجلة`
                  : `${sleepEngine.getHypnogram().length} epochs`
                : isRtl
                ? 'في انتظار البيانات'
                : 'No data'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            {isRtl
              ? 'حقن جلسة نوم واقعية لليلة الماضية (23:15 إلى 07:05، كفاءة 91%، نوم عميق 1h 45m، REM 1h 50m) لإضاءة تبويب النوم ومخطط Hypnogram فوراً.'
              : 'Inject realistic overnight clinical sleep (23:15 to 07:05, 91% efficiency, Deep 1h 45m, REM 1h 50m) to immediately test and verify Hypnogram.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-condensed text-xs font-bold">
            {/* Primary Morning Catch-up Reconnection Simulation */}
            <button
              onClick={async () => {
                setCommandFeedback(isRtl ? 'جاري محاكاة إعادة الاتصال والمزامنة الصباحية...' : 'Simulating morning sync...');
                const ok = await whoopBleEngine.simulateMorningReconnectionSync();
                if (ok) {
                  setCommandFeedback(
                    isRtl
                      ? '✓ تمت محاكاة إعادة الاتصال الصباحي ومزامنة 7.5 ساعة نوم وتحديث الاستشفاء'
                      : '✓ Morning reconnection simulated (7.5h sleep synced & recovery updated)'
                  );
                }
                setTimeout(() => setCommandFeedback(null), 4000);
              }}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#00A3FF]/20 via-[#16EC06]/15 to-[#00A3FF]/20 border border-[#00A3FF]/40 hover:border-[#16EC06] text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,163,255,0.2)] font-black uppercase tracking-wider text-xs font-condensed col-span-1 sm:col-span-3"
            >
              <RefreshCw className="w-4 h-4 text-[#00A3FF]" />
              <span>{isRtl ? 'محاكاة إعادة الاتصال والمزامنة الصباحية للنوم (7.5h)' : 'Simulate Morning Reconnection & Sync (7.5h)'}</span>
            </button>

            <button
              onClick={() => {
                sleepEngine.simulateNightSleep({
                  bedHour: 23,
                  bedMinute: 15,
                  wakeHour: 7,
                  wakeMinute: 5,
                  rhrBaseline: biometricEngine.getRestingHeartRate() || 56,
                });
                setCommandFeedback(
                  isRtl
                    ? '✓ تم حقن بيانات النوم وهيكل المراحل (Hypnogram: 7h 50m / 91%)'
                    : '✓ Simulated sleep injected (7h 50m / 91% eff)'
                );
                setTimeout(() => setCommandFeedback(null), 3500);
              }}
              className="py-2.5 px-3 rounded-xl bg-[#16191E] border border-[#38BDF8]/30 hover:border-[#38BDF8] text-[#38BDF8] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[0_0_15px_rgba(56,189,248,0.15)]"
            >
              <Moon className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>{isRtl ? 'حقن بيانات نوم الليلة' : 'Inject Night Sleep'}</span>
            </button>

            <button
              onClick={() => handleCommand('Sync Sleep Buffer', () => whoopBleEngine.syncSleepBuffer())}
              className="py-2.5 px-3 rounded-xl bg-[#16191E] border border-white/10 hover:border-[#16EC06]/40 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Database className="w-3.5 h-3.5 text-[#16EC06]" />
              <span>{isRtl ? 'سحب حزم النوم (BLE)' : 'Sync Strap Sleep'}</span>
            </button>

            <button
              onClick={() => {
                sleepEngine.resetSleepSession();
                setCommandFeedback(isRtl ? '✓ تمت إعادة ضبط بيانات النوم' : '✓ Sleep session reset');
                setTimeout(() => setCommandFeedback(null), 2500);
              }}
              className="py-2.5 px-3 rounded-xl bg-[#16191E] border border-white/10 hover:border-zinc-600 text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>{isRtl ? 'إعادة ضبط النوم' : 'Reset Sleep'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Live RR-Interval Poincaré Scatter Plot */}
      <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'مخطط بوانكاريه الحي لنبضات القلب (RRₙ مقابل RRₙ₊₁)' : 'Live RR-Interval Poincaré Plot (RR_n vs RR_n+1)'}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {poincarePoints.length} {isRtl ? 'نبضة' : 'BEATS'}
          </span>
        </div>

        {/* SD1, SD2, and Baevsky Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-condensed">
          <div className="p-2 bg-[#0B0D10] rounded-xl border border-white/5">
            <span className="text-[10px] text-zinc-400 block uppercase">
              {isRtl ? 'SD1 (الباراسمبثاوي)' : 'SD1 (Vagal)'}
            </span>
            <span className="text-sm font-black text-[#16EC06]">{sd1 !== null ? `${sd1} ms` : '--'}</span>
          </div>
          <div className="p-2 bg-[#0B0D10] rounded-xl border border-white/5">
            <span className="text-[10px] text-zinc-400 block uppercase">
              {isRtl ? 'SD2 (السمبثاوي)' : 'SD2 (Sympathetic)'}
            </span>
            <span className="text-sm font-black text-[#0093E9]">{sd2 !== null ? `${sd2} ms` : '--'}</span>
          </div>
          <div className="p-2 bg-[#0B0D10] rounded-xl border border-white/5">
            <span className="text-[10px] text-zinc-400 block uppercase">
              {isRtl ? 'مؤشر بايفسكي للضغط' : 'Baevsky Stress'}
            </span>
            <span className="text-sm font-black text-[#FFDE00]">{baevsky !== null ? `${baevsky}` : '--'}</span>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
          {isRtl
            ? 'تصوير بياني لنغمة الجهاز العصبي الذاتي. يوضح الانتشار المذنب الطويل تعافياً باراسمبثاوياً ممتازاً عبر العصب الحائر.'
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
              <p>{isRtl ? 'بانتظار قراءات النبض اللحظية من سوار WHOOP 4.0...' : 'Waiting for beat-to-beat intervals from WHOOP 4.0...'}</p>
              <p className="text-[10px] text-zinc-600 mt-1">
                {isRtl ? 'ارتدِ السوار بإحكام لتسجيل نقاط RR.' : 'Wear the strap securely to record RR points.'}
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
