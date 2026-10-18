import React from 'react';
import { motion } from 'framer-motion';
import type { LiveMetrics, HomeSubTab } from '../types/whoop';
import { WhoopEmblemIcon } from './WhoopLogo';
import { RING_SPRING, TAP } from './motion/springs';
import { useLanguage } from '../i18n/LanguageContext';

interface WhoopConcentricTripleGaugeProps {
  metrics: LiveMetrics;
  onSelectTab: (tab: HomeSubTab) => void;
  activeSubTab?: HomeSubTab;
}

export const WhoopConcentricTripleGauge: React.FC<WhoopConcentricTripleGaugeProps> = ({
  metrics,
  onSelectTab,
}) => {
  const { t, isRtl } = useLanguage();

  const recoveryColor =
    metrics.recoveryCategory === 'green'
      ? '#16EC06'
      : metrics.recoveryCategory === 'yellow'
      ? '#FFDE00'
      : metrics.recoveryCategory === 'red'
      ? '#FF3344'
      : '#52525B';

  const size = 154;
  const center = size / 2;

  // Ring 1: Outer - Day Strain (0.0 to 21.0)
  const rOuter = 66;
  const strokeOuter = 6.5;
  const circOuter = 2 * Math.PI * rOuter;
  const strainRatio = Math.min(1, Math.max(0, metrics.dailyStrain / 21.0));
  const strainOffset = circOuter - strainRatio * circOuter;

  // Ring 2: Middle - Recovery (0 to 100%)
  const rMiddle = 53;
  const strokeMiddle = 6;
  const circMiddle = 2 * Math.PI * rMiddle;
  const recoveryRatio = metrics.recoveryScore !== null ? Math.min(1, Math.max(0, metrics.recoveryScore / 100)) : 0;
  const recoveryOffset = circMiddle - recoveryRatio * circMiddle;

  // Ring 3: Inner - Sleep Performance (0 to 100%)
  const rInner = 40;
  const strokeInner = 5.5;
  const circInner = 2 * Math.PI * rInner;
  const sleepRatio = metrics.sleepPerformance !== null ? Math.min(1, Math.max(0, metrics.sleepPerformance / 100)) : 0;
  const sleepOffset = circInner - sleepRatio * circInner;

  // Heartbeat pulse cycle duration
  const currentHr = metrics.currentHr && metrics.currentHr > 35 ? metrics.currentHr : null;
  const pulseDuration = currentHr ? Math.max(0.35, 60 / currentHr) : 1.2;

  return (
    <div className="flex items-center justify-between px-3 py-2 select-none">
      {/* LEFT COLUMN: Recovery % & HRV */}
      <div className="flex flex-col items-start justify-between min-w-[95px] space-y-4 text-start">
        {/* Top: Recovery */}
        <motion.button
          whileTap={TAP}
          onClick={() => onSelectTab('recovery')}
          className="text-start group focus:outline-none"
          title="View Recovery Drill-down"
        >
          <div
            className="text-4xl font-black font-condensed tracking-tight tabular-nums transition-colors"
            style={{ color: metrics.recoveryScore !== null ? recoveryColor : '#71717A' }}
          >
            {metrics.recoveryScore !== null ? `${metrics.recoveryScore}%` : '--'}
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400 font-condensed group-hover:text-white transition-colors flex items-center gap-0.5">
            <span>{t('recoveryScore')}</span>
            <span className="text-[10px] text-zinc-500">{isRtl ? '‹' : '›'}</span>
          </div>
        </motion.button>

        {/* Bottom: HRV */}
        <motion.button
          whileTap={TAP}
          onClick={() => onSelectTab('recovery')}
          className="text-start group focus:outline-none pt-1"
          title="View HRV Details"
        >
          <div className="text-2xl font-black font-condensed tracking-tight tabular-nums text-white">
            {metrics.currentHrv !== null ? metrics.currentHrv : '--'}
            <span className="text-xs font-sans text-zinc-400 font-medium ml-1">ms</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-condensed group-hover:text-zinc-300 transition-colors">
            {t('hrv')}
          </div>
        </motion.button>
      </div>

      {/* CENTER COLUMN: Concentric 3-Layer Ring Gauge around the "W" Logo */}
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible transform -rotate-90">
          <defs>
            {/* Linear gradient for Strain: #00A3FF -> #0055FF */}
            <linearGradient id="whoopStrainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00A3FF" />
              <stop offset="100%" stopColor="#0055FF" />
            </linearGradient>

            {/* Dynamic filter for Recovery glow */}
            <filter id="recoveryRingGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={recoveryColor} floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Ring 1: Outer Day Strain Track & Fill */}
          <circle
            cx={center}
            cy={center}
            r={rOuter}
            stroke="#252B36"
            strokeWidth={strokeOuter}
            fill="transparent"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={rOuter}
            stroke="url(#whoopStrainGradient)"
            strokeWidth={strokeOuter}
            fill="transparent"
            strokeDasharray={circOuter}
            initial={{ strokeDashoffset: circOuter }}
            animate={{ strokeDashoffset: strainOffset }}
            transition={RING_SPRING}
            strokeLinecap="round"
          />

          {/* Ring 2: Middle Recovery Track & Fill */}
          <circle
            cx={center}
            cy={center}
            r={rMiddle}
            stroke="#232B27"
            strokeWidth={strokeMiddle}
            fill="transparent"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={rMiddle}
            stroke={recoveryColor}
            strokeWidth={strokeMiddle}
            fill="transparent"
            strokeDasharray={circMiddle}
            initial={{ strokeDashoffset: circMiddle }}
            animate={{ strokeDashoffset: recoveryOffset }}
            transition={RING_SPRING}
            strokeLinecap="round"
            filter={metrics.recoveryScore !== null ? 'url(#recoveryRingGlow)' : undefined}
          />

          {/* Ring 3: Inner Sleep Performance Track & Fill */}
          <circle
            cx={center}
            cy={center}
            r={rInner}
            stroke="#222A33"
            strokeWidth={strokeInner}
            fill="transparent"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={rInner}
            stroke="#7395B7"
            strokeWidth={strokeInner}
            fill="transparent"
            strokeDasharray={circInner}
            initial={{ strokeDashoffset: circInner }}
            animate={{ strokeDashoffset: sleepOffset }}
            transition={RING_SPRING}
            strokeLinecap="round"
          />
        </svg>

        {/* Heartbeat Pulse Halo behind Center "W" Emblem */}
        {currentHr && (
          <motion.div
            animate={{
              scale: [0.92, 1.25, 0.92],
              opacity: [0.35, 0, 0.35],
            }}
            transition={{
              duration: pulseDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-12 h-12 rounded-full border border-[#FF3344] pointer-events-none"
          />
        )}

        {/* Center Geometric "W" Monogram */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <WhoopEmblemIcon size={34} variant="monogram" />
        </div>
      </div>

      {/* RIGHT COLUMN: Strain & Sleep Performance */}
      <div className="flex flex-col items-end justify-between min-w-[95px] space-y-4 text-end">
        {/* Top: Day Strain */}
        <motion.button
          whileTap={TAP}
          onClick={() => onSelectTab('strain')}
          className="text-end group focus:outline-none"
          title="View Strain Drill-down"
        >
          <div className="text-4xl font-black font-condensed tracking-tight tabular-nums text-[#00A3FF]">
            {metrics.dailyStrain > 0 ? metrics.dailyStrain.toFixed(1) : '0.0'}
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400 font-condensed group-hover:text-white transition-colors flex items-center gap-0.5 justify-end">
            <span className="text-[10px] text-zinc-500">{isRtl ? '›' : '‹'}</span>
            <span>{t('dayStrain')}</span>
          </div>
        </motion.button>

        {/* Bottom: Sleep Performance */}
        <motion.button
          whileTap={TAP}
          onClick={() => onSelectTab('sleep')}
          className="text-end group focus:outline-none pt-1"
          title="View Sleep Details"
        >
          <div className="text-2xl font-black font-condensed tracking-tight tabular-nums text-[#7395B7]">
            {metrics.sleepPerformance !== null ? `${metrics.sleepPerformance}%` : '--'}
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-condensed group-hover:text-zinc-300 transition-colors">
            {t('sleepPerformance')}
          </div>
        </motion.button>
      </div>
    </div>
  );
};
