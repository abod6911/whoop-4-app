import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { motion } from 'framer-motion';

export type StrapFinish = 'onyx' | 'platinum';

interface StrapStatusPillProps {
  isConnected: boolean;
  finish: StrapFinish;
  className?: string;
}

export const StrapStatusPill: React.FC<StrapStatusPillProps> = ({
  isConnected,
  finish,
  className = '',
}) => {
  const { isRtl } = useLanguage();

  const finishLabel =
    finish === 'onyx'
      ? isRtl
        ? 'أونيكس أسود'
        : 'STEALTH ONYX'
      : isRtl
      ? 'فضي بلاتينيوم'
      : 'BRUSHED PLATINUM';

  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 select-none ${className}`}>
      {isConnected ? (
        /* Connected State: Glowing Emerald Neon with Live RSSI Signal Bars */
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#16EC06]/10 border border-[#16EC06]/35 shadow-[0_0_24px_rgba(22,236,6,0.22)] backdrop-blur-md"
        >
          {/* Animated Emerald Dot with expanding ping */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16EC06] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16EC06] shadow-[0_0_8px_#16EC06]"></span>
          </span>

          <span className="text-[#16EC06] text-xs font-mono font-bold tracking-wider uppercase">
            {isRtl ? 'متصل | بث فوري مباشر' : 'CONNECTED | LIVE TELEMETRY'}
          </span>

          {/* 4-Bar Signal Strength Meter */}
          <div className="flex items-end gap-0.5 h-3 ml-1" title="Signal: Excellent">
            <span className="w-1 h-1.5 rounded-sm bg-[#16EC06]" />
            <span className="w-1 h-2 rounded-sm bg-[#16EC06]" />
            <span className="w-1 h-2.5 rounded-sm bg-[#16EC06]" />
            <span className="w-1 h-3 rounded-sm bg-[#16EC06]" />
          </div>
        </motion.div>
      ) : (
        /* Disconnected State: Subtle pulsing amber/zinc dot with finish badge */
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-mono font-medium tracking-wider backdrop-blur-md shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400/40 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span>
          </span>

          <span>{isRtl ? 'غير متصل | WHOOP 4.0' : 'DISCONNECTED | WHOOP 4.0'}</span>

          <span className="text-[9px] font-condensed font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 tracking-wider">
            {finishLabel}
          </span>
        </motion.div>
      )}
    </div>
  );
};
