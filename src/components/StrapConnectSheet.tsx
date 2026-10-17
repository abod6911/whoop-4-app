import React, { useState } from 'react';
import type { DeviceMetadata } from '../types/whoop';
import { WhoopHardwareRender } from './WhoopHardwareRender';
import { whoopBleEngine } from '../services/whoopBleEngine';
import {
  Bluetooth,
  BluetoothOff,
  Zap,
  Radio,
  RefreshCw,
  Vibrate,
  Activity,
  X,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import { hapticMedium, hapticSuccess, hapticLight } from '../utils/haptics';

interface StrapConnectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: DeviceMetadata;
  permittedDevices?: BluetoothDevice[];
  onConnectBle: (mode: 'filtered' | 'all') => void;
  onReconnectPermitted?: (device?: BluetoothDevice) => void;
  onDisconnectBle: () => void;
  onOpenDiagnostics?: () => void;
}

export const StrapConnectSheet: React.FC<StrapConnectSheetProps> = ({
  isOpen,
  onClose,
  metadata,
  permittedDevices = [],
  onConnectBle,
  onReconnectPermitted,
  onDisconnectBle,
  onOpenDiagnostics,
}) => {
  const { t, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'status' | 'advanced'>('status');
  const [copied, setCopied] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const isBleSupported = whoopBleEngine.isSupported();
  const isConnected = metadata.connected;
  const battery = metadata.batteryLevel ?? null;
  const isCharging = metadata.isCharging;
  const hasPermitted = permittedDevices.length > 0;
  const primaryPermitted = permittedDevices[0];

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWakeSensor = async () => {
    hapticMedium();
    try {
      setIsBusy(true);
      setActionFeedback(isRtl ? 'جاري إيقاظ الحساس وتنشيط البث...' : 'Waking sensor...');
      await whoopBleEngine.wakeSensorAndEnableLiveStream();
      hapticSuccess();
      setActionFeedback(isRtl ? '✓ تم إيقاظ الحساس وبث النبض المباشر' : '✓ Live HR Stream Activated');
      setTimeout(() => setActionFeedback(null), 3500);
    } catch {
      setActionFeedback(isRtl ? '✕ تعذر إرسال الأمر' : '✕ Command failed');
      setTimeout(() => setActionFeedback(null), 3500);
    } finally {
      setIsBusy(false);
    }
  };

  const handleTestVibration = async () => {
    hapticMedium();
    try {
      setIsBusy(true);
      setActionFeedback(isRtl ? 'جاري تشغيل اهتزاز السوار...' : 'Triggering strap vibration...');
      await whoopBleEngine.triggerStrapVibration('pulse');
      hapticSuccess();
      setActionFeedback(isRtl ? '✓ تم اهتزاز السوار' : '✓ Strap Haptic Confirmed');
      setTimeout(() => setActionFeedback(null), 3500);
    } catch {
      setActionFeedback(isRtl ? '✕ تعذر تشغيل الاهتزاز' : '✕ Vibration failed');
      setTimeout(() => setActionFeedback(null), 3500);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSyncMemory = async () => {
    hapticMedium();
    try {
      setIsBusy(true);
      setActionFeedback(isRtl ? 'جاري مزامنة الذاكرة والبيانات...' : 'Syncing flash memory...');
      await whoopBleEngine.triggerCatchUpSync();
      hapticSuccess();
      setActionFeedback(isRtl ? '✓ تمت المزامنة بنجاح' : '✓ Catch-Up Sync Complete');
      setTimeout(() => setActionFeedback(null), 3500);
    } catch {
      setActionFeedback(isRtl ? '✕ تعذر مزامنة الذاكرة' : '✕ Sync failed');
      setTimeout(() => setActionFeedback(null), 3500);
    } finally {
      setIsBusy(false);
    }
  };

  const batteryColor =
    battery === null
      ? '#52525B'
      : battery < 20
      ? '#FF3344'
      : battery < 50
      ? '#FFDE00'
      : '#16EC06';

  const batteryFillHeight = battery !== null ? `${Math.min(100, Math.max(5, battery))}%` : '0%';

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel
        onClose={onClose}
        className="h-[92vh] max-h-[92vh] bg-gradient-to-b from-[#161B22] via-[#0F1318] to-[#090B0E] flex flex-col p-0 overflow-hidden border-t border-white/10"
      >
        {/* Header Tabs (STATUS | ADVANCED) */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                hapticLight();
                setActiveTab('status');
              }}
              className={`text-xs font-black tracking-[0.16em] uppercase font-condensed relative pb-2 transition-colors ${
                activeTab === 'status' ? 'text-white' : 'text-[#6E7681] hover:text-zinc-300'
              }`}
            >
              <span>{isRtl ? 'حالة السوار' : 'STATUS'}</span>
              {activeTab === 'status' && (
                <motion.div
                  layoutId="deviceTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"
                />
              )}
            </button>

            <button
              onClick={() => {
                hapticLight();
                setActiveTab('advanced');
              }}
              className={`text-xs font-black tracking-[0.16em] uppercase font-condensed relative pb-2 transition-colors ${
                activeTab === 'advanced' ? 'text-white' : 'text-[#6E7681] hover:text-zinc-300'
              }`}
            >
              <span>{isRtl ? 'متقدم والعتاد' : 'ADVANCED'}</span>
              {activeTab === 'advanced' && (
                <motion.div
                  layoutId="deviceTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"
                />
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
          {activeTab === 'status' ? (
            /* TAB 1: STATUS - 1:1 Official WHOOP 4.0 Device Status Stage */
            <div className="flex-1 flex flex-col justify-between">
              {/* Top Banner / Device Identification */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#6E7681] font-condensed">
                    {metadata.name || 'WHOOP 4.0'}
                  </div>
                  <div className="text-sm font-bold text-white font-sans flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-[#16EC06] shadow-sm shadow-[#16EC06]/50' : 'bg-zinc-600'
                      }`}
                    />
                    <span>
                      {isConnected
                        ? isRtl
                          ? 'متصل ومقترن'
                          : 'Connected'
                        : isRtl
                        ? 'غير متصل'
                        : 'Disconnected'}
                    </span>
                  </div>
                </div>

                {metadata.onWrist !== null && (
                  <div className="px-2.5 py-1 rounded-full bg-[#181C23] border border-white/5 text-[10px] font-condensed font-bold text-zinc-300">
                    {metadata.onWrist
                      ? isRtl
                        ? '✓ على المعصم'
                        : '✓ On Wrist'
                      : isRtl
                      ? '✕ خارج المعصم'
                      : '✕ Off Wrist'}
                  </div>
                )}
              </div>

              {/* Hardware Centerpiece & Right-Side Vertical Spine */}
              <div className="relative flex items-center justify-between my-auto py-4">
                {/* 3D Hardware Illustration Stage */}
                <div className="flex-1 flex items-center justify-center">
                  <WhoopHardwareRender
                    metadata={metadata}
                    className="max-w-[280px]"
                    onTap={() => {
                      if (isConnected) {
                        setActionFeedback(isRtl ? 'تم تحديث نسبة البطارية' : 'Battery Refreshed');
                        setTimeout(() => setActionFeedback(null), 2500);
                      }
                    }}
                  />
                </div>

                {/* Right-Side Vertical Spine (Telemetry Nodes & Giant Battery) */}
                <div className="flex flex-col items-center justify-between h-72 py-1 pl-2">
                  {/* Top: Mini Hardware Pod Thumbnail */}
                  <div className="w-10 h-12 rounded-xl bg-[#181C23] border border-white/10 flex flex-col items-center justify-center p-1 shadow-md">
                    <div
                      className="w-4 h-1 rounded-full mb-1"
                      style={{ backgroundColor: isConnected ? '#16EC06' : '#52525B' }}
                    />
                    <div className="w-6 h-6 rounded-md bg-[#0F1217] flex items-center justify-center">
                      <span className="text-[8px] font-black font-condensed text-zinc-400">W</span>
                    </div>
                  </div>

                  {/* Middle: Connected BLE Status Nodes */}
                  <div className="flex flex-col items-center gap-2 my-auto">
                    {/* Blue Connected Node */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isConnected
                          ? 'bg-[#007AFF]/20 border-[#007AFF] text-[#007AFF]'
                          : 'bg-white/5 border-white/10 text-zinc-600'
                      }`}
                    >
                      <Bluetooth className="w-3.5 h-3.5" />
                    </div>

                    {/* Dual Concentric Rings */}
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <span
                        className={`absolute inset-0 rounded-full border ${
                          isConnected
                            ? 'border-[#00F0FF]/40 animate-ping'
                            : 'border-white/10'
                        }`}
                      />
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isConnected ? 'bg-[#00F0FF]' : 'bg-zinc-700'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Bottom: Giant Battery Readout + Vertical Bar */}
                  <div className="flex items-end gap-2.5">
                    {/* Battery Digits */}
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-baseline font-light font-condensed tabular-nums">
                        <span className="text-4xl font-extralight text-white">
                          {battery !== null ? battery : '--'}
                        </span>
                        <span className="text-xs text-zinc-400 ml-0.5">%</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                        {isCharging ? (isRtl ? 'شحن' : 'CHG') : (isRtl ? 'بطارية' : 'BAT')}
                      </span>
                    </div>

                    {/* Vertical Battery Fill Bar */}
                    <div className="w-2 h-28 rounded-full bg-[#181C23] border border-white/10 p-[1.5px] flex flex-col justify-end overflow-hidden shadow-inner">
                      <motion.div
                        className="w-full rounded-full transition-all"
                        style={{ backgroundColor: batteryColor, height: batteryFillHeight }}
                        initial={false}
                        animate={{ height: batteryFillHeight }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Alert Pill */}
              <AnimatePresence>
                {actionFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-2 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-mono font-bold text-[#16EC06]"
                  >
                    {actionFeedback}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Actions */}
              <div className="pt-2 pb-1 space-y-2 flex-shrink-0">
                {!isConnected ? (
                  <div className="space-y-2">
                    {hasPermitted && onReconnectPermitted && (
                      <button
                        onClick={() => onReconnectPermitted(primaryPermitted)}
                        className="w-full py-3.5 rounded-2xl bg-[#00A3FF] hover:bg-[#008AE6] text-white font-condensed font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg shadow-[#00A3FF]/25"
                      >
                        <Bluetooth className="w-4 h-4" />
                        <span>
                          {isRtl
                            ? `إعادة الاتصال السريع بـ ${primaryPermitted.name || 'WHOOP'}`
                            : `Quick Reconnect to ${primaryPermitted.name || 'WHOOP'}`}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => onConnectBle('filtered')}
                      className={`w-full py-3.5 rounded-2xl font-condensed font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all ${
                        hasPermitted
                          ? 'bg-[#181C23] border border-white/10 text-white hover:bg-[#20252E]'
                          : 'bg-white text-black hover:bg-zinc-200 shadow-xl'
                      }`}
                    >
                      <Bluetooth className="w-4 h-4" />
                      <span>{isRtl ? 'اقتران / ربط سوار WHOOP 4.0' : 'PAIR / CONNECT STRAP'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleWakeSensor}
                      disabled={isBusy}
                      className="py-3 px-3 rounded-xl bg-[#181C23] hover:bg-[#20252E] border border-white/10 text-white font-condensed font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#00A3FF]" />
                      <span>{isRtl ? 'إيقاظ الحساس' : 'Wake PPG'}</span>
                    </button>

                    <button
                      onClick={handleTestVibration}
                      disabled={isBusy}
                      className="py-3 px-3 rounded-xl bg-[#181C23] hover:bg-[#20252E] border border-white/10 text-white font-condensed font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 disabled:opacity-50"
                    >
                      <Vibrate className="w-3.5 h-3.5 text-[#16EC06]" />
                      <span>{isRtl ? 'اهتزاز السوار' : 'Buzz Strap'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: ADVANCED - Technical Controls & Live BLE Inspector */
            <div className="space-y-4">
              {/* Web Bluetooth Compatibility Helper */}
              {!isBleSupported && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-start space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold font-condensed uppercase tracking-wider text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
                    <span>
                      {isRtl
                        ? 'متصفحك الحالي لا يدعم Web Bluetooth'
                        : 'Web Bluetooth Unsupported In This Browser'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                    {isRtl ? (
                      <>
                        متصفح <strong className="text-white">Safari على الآيفون</strong> لا يدعم
                        البلوتوث مباشرة. للاتصال بسوارك WHOOP من الآيفون:
                        <br />
                        1. حمّل تطبيق{' '}
                        <strong className="text-[#00F0FF]">Bluefy - Web BLE Browser</strong> مجاناً
                        من App Store.
                        <br />
                        2. افتح هذا الرابط داخله للاتصال فورياً.
                      </>
                    ) : (
                      <>
                        iOS Safari does not support Web Bluetooth. Please use{' '}
                        <strong className="text-[#00F0FF]">Bluefy Web BLE Browser</strong> from the
                        App Store, or Google Chrome / Microsoft Edge on desktop.
                      </>
                    )}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleCopyUrl}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#222730] border border-white/10 text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>
                        {copied
                          ? isRtl
                            ? 'تم نسخ الرابط!'
                            : 'Copied!'
                          : isRtl
                          ? 'نسخ رابط الموقع'
                          : 'Copy URL'}
                      </span>
                    </button>
                    <a
                      href="https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-[#0093E9] text-black text-xs font-condensed font-black uppercase flex items-center gap-1 active:scale-95"
                    >
                      <span>Bluefy</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Proprietary Sensor Triggers */}
              <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                  {isRtl
                    ? 'أوامر العتاد الحصرية لسوار WHOOP 4.0'
                    : 'Proprietary WHOOP 4.0 Hardware Triggers'}
                </div>

                <div className="grid grid-cols-1 gap-2 font-condensed text-xs">
                  <button
                    onClick={handleWakeSensor}
                    disabled={!isConnected || isBusy}
                    className="py-3 px-4 rounded-xl bg-[#181C23] hover:bg-[#20252E] border border-white/10 text-white font-bold flex items-center justify-between transition-colors disabled:opacity-40"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#00A3FF]" />
                      <span>{isRtl ? '⚡ إيقاظ الحساس وتنشيط بث النبض الحي' : '⚡ Wake Sensor & Force Live Stream'}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">0x23 0x03 0x01</span>
                  </button>

                  <button
                    onClick={handleTestVibration}
                    disabled={!isConnected || isBusy}
                    className="py-3 px-4 rounded-xl bg-[#181C23] hover:bg-[#20252E] border border-white/10 text-white font-bold flex items-center justify-between transition-colors disabled:opacity-40"
                  >
                    <div className="flex items-center gap-2">
                      <Vibrate className="w-4 h-4 text-[#16EC06]" />
                      <span>{isRtl ? '🔔 اختبار اهتزاز المحرك اللمسي' : '🔔 Test Haptic Vibration Motor'}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">0x23 0x08 0x01</span>
                  </button>

                  <button
                    onClick={handleSyncMemory}
                    disabled={!isConnected || isBusy}
                    className="py-3 px-4 rounded-xl bg-[#181C23] hover:bg-[#20252E] border border-white/10 text-white font-bold flex items-center justify-between transition-colors disabled:opacity-40"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#FFDE00]" />
                      <span>{isRtl ? '🔄 مزامنة الذاكرة والبيانات المتراكمة' : '🔄 Catch-Up Flash Memory Sync'}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Flash Ingestion</span>
                  </button>
                </div>
              </div>

              {/* Live BLE Telemetry Strip */}
              <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-2.5 font-condensed">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400">
                  <span>{isRtl ? 'معلومات العتاد وقنوات BLE' : 'Hardware & BLE Telemetry'}</span>
                  <span className="font-mono text-[10px] text-[#00F0FF]">
                    {metadata.packetsPerMinute || 0} pkt/min
                  </span>
                </div>

                <div className="divide-y divide-white/5 text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-zinc-400">{isRtl ? 'طراز الجهاز' : 'Model'}</span>
                    <span className="font-mono text-white">{metadata.name || 'WHOOP 4.0'}</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-zinc-400">{isRtl ? 'إصدار البرنامج الثابت' : 'Firmware'}</span>
                    <span className="font-mono text-white">{metadata.firmwareRevision || '--'}</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-zinc-400">{isRtl ? 'الرقم التسلسلي' : 'Serial Number'}</span>
                    <span className="font-mono text-white">{metadata.serialNumber || '--'}</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-zinc-400">{isRtl ? 'معرف Bluetooth' : 'Device ID'}</span>
                    <span className="font-mono text-zinc-400 text-[10px] truncate max-w-[180px]">
                      {metadata.id || '--'}
                    </span>
                  </div>
                </div>

                {onOpenDiagnostics && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDiagnostics();
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-black uppercase flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-[#00A3FF]" />
                      <span>{isRtl ? 'فتح محلل حزم البلوتوث GATT' : 'Open GATT Packet Sniffer'}</span>
                    </div>
                    <span>→</span>
                  </button>
                )}
              </div>

              {/* Disconnect Button if Connected */}
              {isConnected && (
                <button
                  onClick={() => {
                    onDisconnectBle();
                    onClose();
                  }}
                  className="w-full py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[#FF3344] border border-rose-500/30 font-condensed font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-98"
                >
                  <BluetoothOff className="w-4 h-4" />
                  <span>{isRtl ? 'فصل اتصال السوار' : 'DISCONNECT STRAP'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
