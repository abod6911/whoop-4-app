import React, { useState, useEffect } from 'react';
import type { DeviceMetadata } from '../types/whoop';
import { whoopBleEngine } from '../services/whoopBleEngine';
import {
  Bluetooth,
  BluetoothOff,
  Zap,
  RefreshCw,
  Vibrate,
  Activity,
  X,
  AlertTriangle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import { hapticMedium, hapticSuccess, hapticLight } from '../utils/haptics';
import { TransparentHardwareImage } from './TransparentHardwareImage';

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
  onDisconnectBle,
  onOpenDiagnostics,
}) => {
  const { isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'status' | 'advanced'>('status');
  const [copied, setCopied] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const isBleSupported = whoopBleEngine.isSupported();
  const isConnected = metadata.connected;

  const [cachedBattery, setCachedBattery] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('whoop_last_battery_level');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) return parsed;
      }
    }
    return 92;
  });

  useEffect(() => {
    if (metadata.batteryLevel !== null && metadata.batteryLevel !== undefined) {
      localStorage.setItem('whoop_last_battery_level', String(metadata.batteryLevel));
      setCachedBattery(metadata.batteryLevel);
    }
  }, [metadata.batteryLevel]);

  const displayBattery = metadata.batteryLevel ?? cachedBattery;
  const hasPermitted = permittedDevices.length > 0;

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTapStrap = async () => {
    hapticMedium();
    if (isConnected) {
      try {
        await whoopBleEngine.triggerStrapVibration('pulse');
        await whoopBleEngine.sendRequestBatteryTemp();
        setActionFeedback('✓ Strap Haptic Confirmed');
        setTimeout(() => setActionFeedback(null), 2500);
      } catch {
        // ignore
      }
    } else {
      onConnectBle('filtered');
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

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel
        onClose={onClose}
        className="h-[92vh] max-h-[92vh] bg-gradient-to-b from-[#1A1F26] via-[#12161C] to-[#080A0D] flex flex-col p-0 overflow-hidden border-t border-white/10 select-none"
      >
        {/* Top Header - Strictly locked to dir="ltr" with NO bottom border and NO subheader */}
        <div
          dir="ltr"
          className="pt-6 pl-6 pr-6 flex items-center justify-between flex-shrink-0 z-20"
        >
          <div className="flex items-center gap-8">
            {/* STATUS Tab */}
            <button
              onClick={() => {
                hapticLight();
                setActiveTab('status');
              }}
              className={`text-xs font-black tracking-[0.14em] uppercase relative pb-2 transition-colors ${
                activeTab === 'status' ? 'text-white' : 'text-[#7A828E] hover:text-zinc-300'
              }`}
            >
              <span>STATUS</span>
              {activeTab === 'status' && (
                <motion.div
                  layoutId="deviceTabUnderline"
                  className="absolute bottom-0 left-0 w-12 h-[2px] bg-white rounded-full"
                />
              )}
            </button>

            {/* ADVANCED Tab */}
            <button
              onClick={() => {
                hapticLight();
                setActiveTab('advanced');
              }}
              className={`text-xs font-black tracking-[0.14em] uppercase relative pb-2 transition-colors ${
                activeTab === 'advanced' ? 'text-white' : 'text-[#7A828E] hover:text-zinc-300'
              }`}
            >
              <span>ADVANCED</span>
              {activeTab === 'advanced' && (
                <motion.div
                  layoutId="deviceTabUnderline"
                  className="absolute bottom-0 left-0 w-16 h-[2px] bg-white rounded-full"
                />
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {activeTab === 'status' ? (
            /* TAB 1: STATUS - 1:1 Official WHOOP 4.0 Hardware Stage (Locked dir="ltr") */
            <div dir="ltr" className="relative flex-1 w-full h-full overflow-hidden select-none">
              {/* Full-Bleed Left & Bottom Hero Strap */}
              <div
                className="absolute -left-6 top-[20%] w-[86%] max-w-[355px] pointer-events-auto cursor-pointer z-10 select-none"
                onClick={handleTapStrap}
                title="Tap to trigger strap vibration or connect"
              >
                <TransparentHardwareImage
                  src="/whoop-hero-transparent.png"
                  alt="WHOOP 4.0 3D Strap"
                  className="w-full h-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)]"
                />
              </div>

              {/* Exact Right-Side Spine (right-6) */}
              {/* 1. Top-Right Pod Thumbnail */}
              <div className="absolute top-[24%] right-6 z-20 flex justify-center w-[44px]">
                <TransparentHardwareImage
                  src="/whoop-thumb-transparent.png"
                  alt="WHOOP Pod Icon"
                  className="w-[44px] h-[54px] object-contain drop-shadow-md"
                />
              </div>

              {/* 2. Upper-Middle Right: Single Solid Blue Circle */}
              <div className="absolute top-[44%] right-6 z-20 flex justify-center w-[44px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1D6CA8] shadow-sm shadow-[#1D6CA8]/60" />
              </div>

              {/* 3. Lower-Middle Right: Two Vertically Overlapping Translucent Circles */}
              <div className="absolute top-[61%] right-6 z-20 flex flex-col items-center w-[44px]">
                <div className="w-5 h-5 rounded-full bg-[#0E4A8A]/60 shadow-sm" />
                <div className="w-5 h-5 rounded-full bg-[#2A313C]/70 -mt-2.5 shadow-sm" />
              </div>

              {/* 4. Bottom-Right Battery Readout & Tall Vertical Green Bar */}
              <div className="absolute bottom-12 right-6 z-20 flex items-end select-none">
                {/* Left of bar: Digits and WHOOP 4.0 */}
                <div className="text-right flex flex-col items-end mr-3">
                  <div className="flex items-baseline font-normal leading-none tracking-tight text-white tabular-nums">
                    <span className="text-[52px] font-normal leading-none tracking-tight text-white tabular-nums">
                      {displayBattery}
                    </span>
                    <span className="text-[20px] font-bold text-white ml-0.5">%</span>
                  </div>
                  <div className="text-[12px] font-medium tracking-[0.06em] text-[#5C6470] uppercase mt-1">
                    WHOOP 4.0
                  </div>
                </div>

                {/* Right of number: Tall, slim vertical progress bar centered on the spine axis */}
                <div className="w-[44px] flex justify-center">
                  <div className="w-[4.5px] h-[145px] rounded-full bg-[#262B33] overflow-hidden flex flex-col justify-end">
                    <motion.div
                      className="w-full rounded-full transition-all duration-700"
                      style={{
                        backgroundColor: '#22E600',
                        height: `${Math.min(100, Math.max(4, displayBattery))}%`,
                      }}
                      initial={false}
                      animate={{
                        height: `${Math.min(100, Math.max(4, displayBattery))}%`,
                      }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {/* Action feedback toast */}
              <AnimatePresence>
                {actionFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-4 left-6 z-20 py-1.5 px-3 rounded-full bg-white/10 backdrop-blur-md text-xs font-mono text-[#1EEB00] border border-white/10"
                  >
                    {actionFeedback}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Clean bottom connect pill (ONLY when disconnected) */}
              {!isConnected && (
                <div className="absolute bottom-4 left-6 right-6 flex justify-center z-20">
                  <button
                    onClick={() => onConnectBle('filtered')}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-condensed font-bold tracking-wider uppercase backdrop-blur-md active:scale-95 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Bluetooth className="w-3.5 h-3.5 text-[#00A3FF]" />
                    <span>
                      {hasPermitted
                        ? isRtl
                          ? 'إعادة الاتصال بالسوار'
                          : 'Connect Strap'
                        : isRtl
                        ? 'ربط سوار WHOOP 4.0'
                        : 'Pair WHOOP 4.0'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: ADVANCED - Technical Controls & Live BLE Inspector */
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

              {/* Pairing / Connection Actions in ADVANCED Tab */}
              <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                  {isRtl ? 'إدارة اقتران البلوتوث' : 'Bluetooth Pairing & Connection'}
                </div>

                {!isConnected ? (
                  <button
                    onClick={() => onConnectBle('filtered')}
                    className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-condensed font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xl"
                  >
                    <Bluetooth className="w-4 h-4" />
                    <span>{isRtl ? 'اقتران / ربط سوار WHOOP 4.0' : 'PAIR / CONNECT STRAP'}</span>
                  </button>
                ) : (
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
            </div>
          )}
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
