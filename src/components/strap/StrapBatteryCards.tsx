import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Zap,
  Battery,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Sparkles,
} from 'lucide-react';
import { BatteryPackVectorIcon } from './BatteryPackVectorIcon';
import { hapticMedium } from '../../utils/haptics';

interface StrapBatteryCardsProps {
  isConnected: boolean;
  batteryLevel: number | null;
  isCharging: boolean;
  onToggleChargingSimulation?: () => void;
  className?: string;
}

export const StrapBatteryCards: React.FC<StrapBatteryCardsProps> = ({
  isConnected,
  batteryLevel,
  isCharging,
  onToggleChargingSimulation,
  className = '',
}) => {
  const { isRtl } = useLanguage();

  const displayBattery = isConnected ? batteryLevel : null;

  // Calculate battery runtime text without clipping
  const batteryRemainingText = React.useMemo(() => {
    if (!isConnected || displayBattery === null) {
      return isRtl ? 'اربط السوار لقراءة النسبة' : 'Connect to read level';
    }
    if (isCharging) {
      return isRtl ? 'شحن لاسلكي نشط ⚡' : 'Charging Wirelessly ⚡';
    }
    const hoursRemaining = Math.max(1, Math.round((displayBattery / 100) * 105));
    const daysRemaining = Math.round((hoursRemaining / 24) * 10) / 10;
    if (daysRemaining >= 1.5) {
      const days = Math.round(daysRemaining);
      return isRtl
        ? `متبقي ~${days} ${days === 2 ? 'يومين' : days <= 10 ? 'أيام' : 'يوم'}`
        : `~${days} Days Remaining`;
    } else if (daysRemaining >= 1.0) {
      return isRtl ? 'متبقي حوالي يوم واحد' : '~1 Day Remaining';
    } else {
      return isRtl
        ? `متبقي حوالي ${hoursRemaining} ساعة`
        : `~${hoursRemaining} Hours Left`;
    }
  }, [isConnected, displayBattery, isCharging, isRtl]);

  const batteryColor = React.useMemo(() => {
    if (isCharging) return '#00F0FF';
    if (displayBattery === null) return '#52525B';
    if (displayBattery <= 20) return '#FF3344';
    if (displayBattery <= 40) return '#FF9900';
    return '#16EC06';
  }, [isCharging, displayBattery]);

  return (
    <div className={`grid grid-cols-2 gap-3.5 w-full select-none ${className}`}>
      {/* 1. Left Card: Strap Battery Card */}
      <div className="bg-[#12161D] border-t border-white/20 border-r border-b border-l border-white/5 hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition-all shadow-md">
        {isCharging && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00F0FF]/10 rounded-full blur-xl pointer-events-none" />
        )}

        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-condensed font-black tracking-wider uppercase text-zinc-300">
              {isRtl ? 'بطارية السوار' : 'STRAP BATTERY'}
            </span>
            {isCharging ? (
              <Zap className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
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

          {/* Metric Value */}
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-black font-condensed tracking-tight text-white tabular-nums leading-none">
              {displayBattery !== null ? displayBattery : '--'}
            </span>
            {displayBattery !== null && (
              <span className="text-sm font-bold text-zinc-400 font-condensed">%</span>
            )}
          </div>

          {/* Smooth Horizontal Battery Meter */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden my-2.5">
            <motion.div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${displayBattery !== null ? Math.min(100, Math.max(5, displayBattery)) : 0}%`,
                backgroundColor: batteryColor,
                boxShadow: displayBattery !== null ? `0 0 10px ${batteryColor}` : 'none',
              }}
              initial={false}
              animate={{
                width: `${displayBattery !== null ? Math.min(100, Math.max(5, displayBattery)) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Runtime Descriptor (Zero Clipping!) */}
        <div className="text-[11px] font-medium font-sans text-zinc-400 leading-tight mt-1">
          {batteryRemainingText}
        </div>
      </div>

      {/* 2. Right Card: Battery Pack Card (Wireless Charger) */}
      <div
        onClick={() => {
          if (onToggleChargingSimulation) {
            hapticMedium();
            onToggleChargingSimulation();
          }
        }}
        className={`bg-[#12161D] border-t border-white/20 border-r border-b border-l border-white/5 hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition-all shadow-md ${
          onToggleChargingSimulation ? 'cursor-pointer active:scale-[0.98]' : ''
        }`}
        title={
          onToggleChargingSimulation
            ? isRtl
              ? 'انقر لمحاكاة تركيب / فصل حزمة الشاحن'
              : 'Tap to simulate attaching/detaching battery pack'
            : undefined
        }
      >
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-condensed font-black tracking-wider uppercase text-zinc-300">
              {isRtl ? 'حزمة الشحن' : 'BATTERY PACK'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isCharging
                  ? 'bg-[#16EC06] shadow-[0_0_8px_#16EC06] animate-pulse'
                  : 'bg-zinc-600'
              }`}
            />
          </div>

          {/* Custom WHOOP 4.0 Vector Pack Icon & Details (Zero Clipping!) */}
          <div className="flex items-center gap-3 my-1">
            <div className="w-10 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center p-1 flex-shrink-0">
              <BatteryPackVectorIcon isCharging={isCharging} size={30} />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black font-condensed uppercase tracking-wide text-white leading-tight">
                {isRtl ? 'شاحن لاسلكي' : 'Wireless Charger'}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans leading-tight mt-0.5">
                {isRtl ? 'مقاوم للماء بالانزلاق' : 'Slide-On Waterproof'}
              </span>
            </div>
          </div>
        </div>

        {/* Clear Status Badge (Zero Truncation!) */}
        <div className="mt-2">
          {isCharging ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#16EC06]/15 text-[#16EC06] border border-[#16EC06]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16EC06] animate-pulse" />
              <span>{isRtl ? 'مركب ⚡ يشحن' : 'Attached • Charging ⚡'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span>{isRtl ? 'منفصل • جاهز' : 'Detached • Standby'}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
