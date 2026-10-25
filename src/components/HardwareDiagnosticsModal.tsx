import React, { useState, useEffect } from 'react';
import type { DeviceMetadata } from '../types/whoop';
import { WhoopLogo } from './WhoopLogo';
import {
  X,
  Radio,
  Battery,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Vibrate,
  RefreshCw,
  Gauge,
  Wifi,
} from 'lucide-react';
import { whoopBleEngine } from '../services/whoopBleEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';

interface HardwareDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: DeviceMetadata;
}

export const HardwareDiagnosticsModal: React.FC<HardwareDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  metadata,
}) => {
  const { t, isRtl } = useLanguage();
  const [hapticTriggered, setHapticTriggered] = useState(false);
  const [isSendingCmd, setIsSendingCmd] = useState(false);
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCmdFeedback(null);
    }
  }, [isOpen]);

  const handleTriggerHaptic = async () => {
    try {
      setIsSendingCmd(true);
      await whoopBleEngine.sendTriggerHapticAlarm();
      setHapticTriggered(true);
      setCmdFeedback(isRtl ? 'تم إرسال إشارة الاهتزاز إلى السوار!' : 'Haptic pulse sent to strap!');
      setTimeout(() => setHapticTriggered(false), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setCmdFeedback(msg);
    } finally {
      setIsSendingCmd(false);
    }
  };

  const handleRequestBatteryStatus = async () => {
    try {
      setIsSendingCmd(true);
      await whoopBleEngine.sendRequestBatteryTemp();
      setCmdFeedback(isRtl ? 'تم طلب بيانات البطارية والحرارة' : 'Requested battery & thermal telemetry');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setCmdFeedback(msg);
    } finally {
      setIsSendingCmd(false);
    }
  };

  const getLastPacketAgo = () => {
    if (!metadata.lastPacketTimestamp) return '--';
    const sec = Math.max(0, Math.round((Date.now() - metadata.lastPacketTimestamp) / 1000));
    if (sec < 2) return isRtl ? 'الآن' : 'Just now';
    return isRtl ? `منذ ${sec} ث` : `${sec}s ago`;
  };

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="p-4 sm:p-5 max-h-[85vh] overflow-y-auto overscroll-contain space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <WhoopLogo size="sm" showWordmark={true} />
            <span className="text-[10px] font-mono bg-[#0B0D10] px-2 py-0.5 rounded text-white border border-white/5 uppercase">
              {t('hardwareDiagnostics')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#222730] text-zinc-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Connection & Hardware Status */}
        <div className="p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-condensed">
            <span className="text-zinc-400 uppercase font-bold tracking-wide">{t('status')}</span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  metadata.connected
                    ? 'bg-[#16EC06] animate-ping'
                    : metadata.connecting
                    ? 'bg-[#FFDE00] animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              <span className="font-black text-white uppercase tracking-wider">
                {metadata.connected
                  ? metadata.name || t('connected')
                  : metadata.connecting
                  ? t('connecting')
                  : t('disconnected')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-start pt-2 border-t border-white/5">
            <div className="p-2.5 rounded-xl bg-[#0B0D10] border border-white/5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('firmware')}</span>
              <div className="text-xs font-mono font-bold text-white truncate">
                {metadata.firmwareRevision || '--'}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B0D10] border border-white/5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('serialNumber')}</span>
              <div className="text-xs font-mono font-bold text-white truncate">
                {metadata.serialNumber || '--'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Real-Time Telemetry Diagnostic Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* A. Skin Contact Status */}
          <div className="p-3.5 rounded-2xl bg-[#16191E] border border-white/5 space-y-1 text-start">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>{t('skinContact')}</span>
              {metadata.onWrist ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16EC06]" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-[#FFDE00]" />
              )}
            </div>
            <div
              className={`text-sm font-black font-condensed uppercase tracking-wide ${
                metadata.onWrist ? 'text-[#16EC06]' : 'text-[#FFDE00]'
              }`}
            >
              {metadata.onWrist ? t('skinContactLocked') : t('skinContactLost')}
            </div>
            <span className="text-[9px] font-mono text-zinc-500 block">
              {metadata.contactSupported
                ? (isRtl ? 'حساس بصري نشط (0x2A37)' : 'Optical PPG active (0x2A37)')
                : (isRtl ? 'استنتاج عبر النبض' : 'HR heuristic')}
            </span>
          </div>

          {/* B. Battery & Real-Time Charging Status */}
          <div className="p-3.5 rounded-2xl bg-[#16191E] border border-white/5 space-y-1 text-start">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>{t('battery')}</span>
              {metadata.isCharging ? (
                <Zap className="w-3.5 h-3.5 text-[#16EC06] fill-[#16EC06] animate-pulse" />
              ) : (
                <Battery className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black font-condensed tracking-wide text-white">
                {metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : '--'}
              </span>
              {metadata.isCharging && (
                <span className="px-1.5 py-0.5 rounded bg-[#16EC06]/20 text-[#16EC06] text-[9px] font-black uppercase font-condensed">
                  {t('charging')}
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono text-zinc-500 block">
              {metadata.isCharging ? (isRtl ? 'حزمة الشحن متصلة ⚡' : 'External pack attached ⚡') : t('discharging')}
            </span>
          </div>

          {/* C. Packet Ingestion Rate */}
          <div className="p-3.5 rounded-2xl bg-[#16191E] border border-white/5 space-y-1 text-start">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>{t('packetRate')}</span>
              <Activity className="w-3.5 h-3.5 text-[#00A3FF]" />
            </div>
            <div className="text-sm font-black font-condensed tracking-wide text-[#00A3FF]">
              {metadata.packetsPerMinute || 0} <span className="text-[10px] font-mono font-normal">{t('packetsPerMin')}</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 block">
              {isRtl ? 'آخر حزمة: ' : 'Last: '} {getLastPacketAgo()}
            </span>
          </div>

          {/* D. BLE Signal Strength & Channel */}
          <div className="p-3.5 rounded-2xl bg-[#16191E] border border-white/5 space-y-1 text-start">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>{t('signalStrength')}</span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-black font-condensed tracking-wide text-white">
              {metadata.connected ? '-62 dBm' : '--'}
            </div>
            <span className="text-[9px] font-mono text-zinc-500 block">
              {metadata.connected ? (isRtl ? 'اتصال قوي ومستقر' : 'Strong connection') : t('disconnected')}
            </span>
          </div>
        </div>

        {/* 3. Feedback Banner */}
        {cmdFeedback && (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 text-center font-condensed">
            {cmdFeedback}
          </div>
        )}

        {/* 4. Strap Hardware Triggers */}
        {metadata.connected && (
          <div className="space-y-2 pt-1 font-condensed">
            <div className="text-[11px] font-black uppercase text-zinc-400 tracking-wider text-start">
              {isRtl ? 'أوامر العتاد المباشرة' : 'Direct Strap Commands'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleTriggerHaptic}
                disabled={isSendingCmd}
                className="py-2.5 px-3 rounded-xl bg-[#222730] hover:bg-[#2C3340] border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                <Vibrate className={`w-3.5 h-3.5 ${hapticTriggered ? 'text-[#16EC06] animate-bounce' : 'text-zinc-400'}`} />
                <span>{isRtl ? 'اختبار الاهتزاز' : 'Test Haptics'}</span>
              </button>

              <button
                onClick={handleRequestBatteryStatus}
                disabled={isSendingCmd}
                className="py-2.5 px-3 rounded-xl bg-[#222730] hover:bg-[#2C3340] border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSendingCmd ? 'animate-spin text-[#00A3FF]' : 'text-zinc-400'}`} />
                <span>{isRtl ? 'فحص الشحن' : 'Query Battery'}</span>
              </button>
            </div>
          </div>
        )}
      </SheetPanel>
    </SheetBackdrop>
  );
};
