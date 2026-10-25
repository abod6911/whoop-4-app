import React, { useState, useEffect, useMemo } from 'react';
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
  Battery,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import { hapticMedium, hapticSuccess, hapticLight } from '../utils/haptics';
import { TransparentHardwareImage } from './TransparentHardwareImage';
import { pedometerEngine } from '../services/pedometerEngine';
import { AnimatedStepCounter } from './AnimatedStepCounter';

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
  const [liveSteps, setLiveSteps] = useState(() => pedometerEngine.getState().steps);

  // Synchronous BLE state subscription for reactive instant updates
  const [liveBattery, setLiveBattery] = useState<number | null>(() => {
    const meta = whoopBleEngine.getMetadata();
    return meta.batteryLevel ?? metadata.batteryLevel ?? null;
  });
  const [liveIsCharging, setLiveIsCharging] = useState<boolean>(() => {
    const meta = whoopBleEngine.getMetadata();
    return meta.isCharging ?? metadata.isCharging ?? false;
  });

  useEffect(() => {
    return pedometerEngine.subscribe((state) => {
      setLiveSteps(state.steps);
    });
  }, []);

  // Sync state if props change
  useEffect(() => {
    if (metadata.batteryLevel !== null && metadata.batteryLevel !== undefined) {
      setLiveBattery(metadata.batteryLevel);
    }
    if (metadata.isCharging !== undefined) {
      setLiveIsCharging(metadata.isCharging);
    }
  }, [metadata.batteryLevel, metadata.isCharging]);

  // Subscribe directly to whoopBleEngine for instant event propagation
  useEffect(() => {
    const unsubBat = whoopBleEngine.onBattery((level) => {
      setLiveBattery(level);
    });
    const unsubMeta = whoopBleEngine.onMetadata((meta) => {
      if (meta.batteryLevel !== null && meta.batteryLevel !== undefined) {
        setLiveBattery(meta.batteryLevel);
      }
      if (meta.isCharging !== undefined) {
        setLiveIsCharging(meta.isCharging);
      }
    });

    if (metadata.connected) {
      whoopBleEngine.sendRequestBatteryTemp().catch(() => {});
    }

    return () => {
      unsubBat();
      unsubMeta();
    };
  }, [metadata.connected]);

  const isBleSupported = whoopBleEngine.isSupported();
  const isConnected = metadata.connected;
  const isCharging = liveIsCharging || metadata.isCharging;
  const displayBattery = isConnected ? (liveBattery ?? metadata.batteryLevel ?? null) : null;

  // Calculated remaining runtime for WHOOP 4.0 (~4.5 days on full charge)
  const batteryRemainingText = useMemo(() => {
    if (!isConnected || displayBattery === null) {
      return isRtl ? 'غير متصل' : 'Disconnected';
    }
    if (isCharging) {
      return isRtl ? 'جاري الشحن الآن ⚡' : 'Charging Now ⚡';
    }
    const hoursRemaining = Math.max(1, Math.round((displayBattery / 100) * 105));
    const daysRemaining = Math.round((hoursRemaining / 24) * 10) / 10;
    if (daysRemaining >= 1.5) {
      const days = Math.round(daysRemaining);
      return isRtl
        ? `متبقي حوالي ${days} ${days === 2 ? 'يومين' : days <= 10 ? 'أيام' : 'يوم'}`
        : `About ${days} days left`;
    } else if (daysRemaining >= 1.0) {
      return isRtl ? 'متبقي حوالي يوم واحد' : 'About 1 day left';
    } else {
      return isRtl
        ? `متبقي حوالي ${hoursRemaining} ساعة`
        : `About ${hoursRemaining} hours left`;
    }
  }, [isConnected, displayBattery, isCharging, isRtl]);

  const batteryColor = useMemo(() => {
    if (isCharging) return '#00F0FF';
    if (displayBattery === null) return '#52525B';
    if (displayBattery <= 20) return '#FF3344';
    if (displayBattery <= 40) return '#FF9900';
    return '#16EC06';
  }, [isCharging, displayBattery]);

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
        setActionFeedback(isRtl ? '✓ تم تأكيد استجابة السوار اللمسية' : '✓ Strap Haptic Confirmed');
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
        className="h-auto max-h-[85vh] bg-gradient-to-b from-[#1A1F26] via-[#12161C] to-[#080A0D] flex flex-col p-0 overflow-hidden overscroll-contain border-t border-white/10 select-none"
      >
        {/* Top Header Navigation: Tabs & Close Button */}
        <div
          dir="ltr"
          className="pt-5 pb-3 px-6 flex items-center justify-between flex-shrink-0 z-20 border-b border-white/5"
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
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {activeTab === 'status' ? (
            /* TAB 1: STATUS - Refactored Apple/WHOOP Design System (Structured Flexbox/Grid, zero broken absolutes) */
            <div className="flex-1 flex flex-col justify-between p-6 bg-[#0B0D10] text-white overflow-y-auto">
              {/* Top: Clean Connection State Badge */}
              <div className="flex justify-center items-center">
                {isConnected ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#16EC06]/10 border border-[#16EC06]/30 shadow-[0_0_20px_rgba(22,236,6,0.18)] text-[#16EC06] text-xs font-mono font-bold tracking-wider">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16EC06] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16EC06]"></span>
                    </span>
                    <span>{isRtl ? '🟢 متصل | WHOOP 4.0' : '🟢 CONNECTED | WHOOP 4.0'}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-mono font-medium tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                    <span>{isRtl ? '⚪ غير متصل | Disconnected' : '⚪ DISCONNECTED | WHOOP 4.0'}</span>
                  </div>
                )}
              </div>

              {/* Center: Hero Showcase (WHOOP 4.0 Hardware) */}
              <div className="relative flex flex-col items-center justify-center my-auto py-2">
                {/* Subtle Radial Gradient Glow Backdrop */}
                <div
                  className="absolute w-[280px] h-[220px] rounded-full pointer-events-none transition-all duration-700"
                  style={{
                    background: isConnected
                      ? 'radial-gradient(ellipse at center, rgba(22,236,6,0.12) 0%, rgba(0,163,255,0.03) 50%, transparent 70%)'
                      : 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                />

                <div
                  onClick={handleTapStrap}
                  className="relative z-10 cursor-pointer active:scale-95 transition-all duration-300 max-w-[250px] sm:max-w-[280px] w-full group flex flex-col items-center"
                  title={
                    isConnected
                      ? (isRtl ? 'انقر لاختبار الاهتزاز وتحديث البطارية' : 'Tap to test haptics & refresh battery')
                      : (isRtl ? 'انقر لربط السوار' : 'Tap to pair strap')
                  }
                >
                  <TransparentHardwareImage
                    src="/whoop-hero-transparent.png"
                    alt="WHOOP 4.0 3D Strap"
                    className="w-full h-auto drop-shadow-[0_25px_45px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono tracking-wider mt-2 group-hover:text-zinc-300 transition-colors">
                    {isConnected
                      ? (isRtl ? 'انقر للاختبار اللمسي والاهتزاز' : 'Tap for Haptic Pulse')
                      : (isRtl ? 'انقر لاقتران السوار' : 'Tap to Pair')}
                  </span>
                </div>
              </div>

              {/* Dual Battery Telemetry Cards (Strap & Battery Pack) */}
              <div className="space-y-3.5 my-2">
                <div className="grid grid-cols-2 gap-3.5 w-full">
                  {/* Card 1: Strap Battery Card */}
                  <div className="bg-[#12161D] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition-all shadow-md">
                    {isCharging && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#16EC06]/10 rounded-full blur-xl pointer-events-none" />
                    )}

                    <div>
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-[11px] font-condensed font-bold tracking-wider uppercase">
                          {isRtl ? 'بطارية السوار' : 'Strap Battery'}
                        </span>
                        {isCharging ? (
                          <Zap className="w-3.5 h-3.5 text-[#16EC06] animate-pulse" />
                        ) : displayBattery === null ? (
                          <Battery className="w-3.5 h-3.5 text-zinc-600" />
                        ) : displayBattery <= 20 ? (
                          <BatteryLow className="w-3.5 h-3.5 text-[#FF3344]" />
                        ) : displayBattery <= 50 ? (
                          <BatteryMedium className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <BatteryFull className="w-3.5 h-3.5 text-[#16EC06]" />
                        )}
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black font-condensed tracking-tight text-white tabular-nums">
                          {displayBattery !== null ? displayBattery : '--'}
                        </span>
                        {displayBattery !== null && (
                          <span className="text-sm font-bold text-zinc-400">%</span>
                        )}
                      </div>

                      {/* Visual Battery Meter: Sleek horizontal progress bar */}
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden my-2.5">
                        <motion.div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${displayBattery !== null ? Math.min(100, Math.max(4, displayBattery)) : 0}%`,
                            backgroundColor: batteryColor,
                          }}
                          initial={false}
                          animate={{
                            width: `${displayBattery !== null ? Math.min(100, Math.max(4, displayBattery)) : 0}%`,
                          }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] font-medium text-zinc-400 truncate mt-1">
                      {batteryRemainingText}
                    </div>
                  </div>

                  {/* Card 2: Battery Pack Card (Wireless Charger) */}
                  <div className="bg-[#12161D] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition-all shadow-md">
                    <div>
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-[11px] font-condensed font-bold tracking-wider uppercase">
                          {isRtl ? 'حزمة الشحن' : 'Battery Pack'}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCharging ? 'bg-[#16EC06] shadow-sm shadow-[#16EC06]' : 'bg-zinc-600'
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-3 my-1">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center p-1 flex-shrink-0">
                          <TransparentHardwareImage
                            src="/whoop-thumb-transparent.png"
                            alt="WHOOP Battery Pack"
                            className="w-full h-full object-contain drop-shadow"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black font-condensed text-white truncate">
                            {isCharging
                              ? (isRtl ? 'متصل ويشحن السوار ⚡' : 'Attached & Charging ⚡')
                              : (isRtl ? 'حزمة لاسلكية' : 'Wireless Slide-On')}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium truncate">
                            {isCharging
                              ? (isRtl ? 'شحن لاسلكي مستمر' : 'Continuous Wireless Transfer')
                              : (isRtl ? 'غير مركب / منفصل' : 'Detached / Ready')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-medium text-zinc-400 truncate mt-2">
                      {isCharging ? (
                        <span className="text-[#16EC06] font-bold">
                          {isRtl ? 'شاحن WHOOP 4.0 المقاوم للماء' : 'Waterproof Charger Active'}
                        </span>
                      ) : (
                        <span className="text-zinc-500">
                          {isRtl ? 'جاهز للتركيب بالانزلاق' : 'Slide-on Waterproof Pack'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Real-time Streaming Bar (when connected) */}
                {isConnected && (
                  <div className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0D3528]/80 via-[#0B2538]/80 to-[#0D3528]/80 border border-[#16EC06]/30 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="text-[#16EC06] flex items-center justify-center"
                      >
                        <RefreshCw className="w-3.5 h-3.5 stroke-[2.2]" />
                      </motion.div>
                      <div>
                        <div className="text-xs font-black font-condensed text-white">
                          {isRtl ? 'مزامنة ونشاط مستمر من الساعة' : 'Continuous Watch Sync'}
                        </div>
                        <div className="text-[10px] text-[#16EC06] font-mono flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16EC06] animate-ping" />
                          <span>25 Hz • {isRtl ? 'بث فوري مباشر' : 'Real-time Stream'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-end">
                      <span className="text-sm font-black font-condensed text-white tabular-nums">
                        <AnimatedStepCounter value={liveSteps} />
                      </span>
                      <span className="text-[9px] text-zinc-400 block font-condensed -mt-0.5">
                        {isRtl ? 'خطوة' : 'STEPS'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Dock: Bottom CTA Bar */}
              <div className="w-full pt-2">
                {!isConnected ? (
                  <button
                    onClick={() => onConnectBle('filtered')}
                    className="w-full py-4 px-6 rounded-2xl bg-[#181B20] hover:bg-[#20242B] border border-white/10 hover:border-[#16EC06]/40 text-white font-condensed font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl group"
                  >
                    <Bluetooth className="w-4 h-4 text-[#00A3FF] group-hover:scale-110 transition-transform" />
                    <span>
                      {isRtl
                        ? 'ربط السوار الآن (Pair WHOOP 4.0)'
                        : 'PAIR WHOOP 4.0 NOW'}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleTapStrap}
                      disabled={isBusy}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-condensed font-bold tracking-wider uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <Vibrate className="w-4 h-4 text-[#16EC06]" />
                      <span>{isRtl ? 'اختبار الاهتزاز' : 'Test Haptic'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onDisconnectBle();
                        onClose();
                      }}
                      className="py-3.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[#FF4555] border border-rose-500/20 text-xs font-condensed font-bold tracking-wider uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <BluetoothOff className="w-4 h-4" />
                      <span>{isRtl ? 'قطع الاتصال' : 'Disconnect'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action feedback toast */}
              <AnimatePresence>
                {actionFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 py-2 px-4 rounded-full bg-black/90 backdrop-blur-md text-xs font-mono text-[#1EEB00] border border-white/20 shadow-2xl flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#1EEB00]" />
                    <span>{actionFeedback}</span>
                  </motion.div>
                )}
              </AnimatePresence>
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
