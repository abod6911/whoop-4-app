import React, { useState, useEffect } from 'react';
import type { LiveMetrics, DeviceMetadata } from '../../types/whoop';
import { Moon, Battery, Heart, Unlock } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface OledSleepOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  metadata: DeviceMetadata;
}

export const OledSleepOverlay: React.FC<OledSleepOverlayProps> = ({
  isOpen,
  onClose,
  metrics,
  metadata,
}) => {
  const { t, isRtl } = useLanguage();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [wakeLockActive, setWakeLockActive] = useState(false);

  // Clock tick
  useEffect(() => {
    if (!isOpen) return;

    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isRtl]);

  // Request screen Wake Lock on mobile devices
  useEffect(() => {
    let sentinel: any = null;

    const requestLock = async () => {
      if (isOpen && 'wakeLock' in navigator) {
        try {
          sentinel = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
          console.log('Screen WakeLock active for overnight WHOOP BLE tracking');
        } catch (e) {
          console.warn('WakeLock request error or denied:', e);
        }
      }
    };

    requestLock();

    return () => {
      if (sentinel) {
        sentinel.release().catch(() => {});
        setWakeLockActive(false);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 select-none animate-in fade-in duration-700">
      {/* Top Dim Status Strip */}
      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600">
        <div className="flex items-center gap-1.5">
          <Moon className="w-3.5 h-3.5 text-zinc-600" />
          <span>{isRtl ? 'قفل النوم الليلي OLED' : 'OLED NIGHT LOCK'}</span>
          {wakeLockActive && <span className="text-emerald-700">• {isRtl ? 'منع إطفاء الشاشة' : 'WAKELOCK ON'}</span>}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-zinc-600">
            <Battery className="w-3.5 h-3.5" />
            <span dir="ltr">{metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : '--'}</span>
          </div>
        </div>
      </div>

      {/* Center Minimalist Dim Clock & Live Heart Rate */}
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        <div className="text-zinc-600 font-mono text-xs uppercase tracking-widest">
          {dateStr}
        </div>
        <div className="text-6xl font-black font-condensed tracking-wider text-zinc-400 tabular-nums" dir="ltr">
          {timeStr}
        </div>

        <div className="flex items-center gap-2 pt-4">
          <Heart className="w-4 h-4 text-rose-900 fill-rose-950 animate-pulse" />
          <span className="text-xl font-black font-mono text-zinc-400 tabular-nums" dir="ltr">
            {metrics.currentHr !== null ? metrics.currentHr : '--'}
          </span>
          <span className="text-[10px] uppercase font-bold text-zinc-600 font-mono">{t('bpm')}</span>
        </div>

        <p className="text-[10px] text-zinc-700 max-w-xs pt-4 font-mono leading-relaxed">
          {isRtl
            ? 'تتبع HRV ونبضات القلب الليلية مباشرة عبر البلوتوث. سطوع الشاشة في أدنى مستوى للحفاظ على البطارية.'
            : 'Tracking nocturnal HRV & HR dips directly over Web Bluetooth. Screen brightness minimized to preserve battery.'}
        </p>
      </div>

      {/* Bottom Unlock Button */}
      <div className="flex flex-col items-center justify-center space-y-2 pb-6">
        <button
          onClick={onClose}
          className="py-3 px-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-black uppercase tracking-widest font-condensed flex items-center gap-2 transition-all active:scale-95 shadow-lg"
        >
          <Unlock className="w-4 h-4" />
          <span>{isRtl ? 'انقر لإلغاء القفل والاستيقاظ' : 'Slide / Tap to Wake'}</span>
        </button>
      </div>
    </div>
  );
};
