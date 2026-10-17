import React from 'react';
import type { LiveMetrics, HomeSubTab } from '../types/whoop';
import { useLanguage } from '../i18n/LanguageContext';

interface WhoopTripleGaugeProps {
  metrics: LiveMetrics;
  onSelectTab: (tab: HomeSubTab) => void;
  activeSubTab?: HomeSubTab;
}

export const WhoopTripleGauge: React.FC<WhoopTripleGaugeProps> = ({
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

  const size = 96;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  // Sleep Ring offset
  const sleepRatio = metrics.sleepPerformance !== null ? Math.min(1, metrics.sleepPerformance / 100) : 0;
  const sleepOffset = circ - sleepRatio * circ;

  // Recovery Ring offset
  const recoveryRatio = metrics.recoveryScore !== null ? Math.min(1, metrics.recoveryScore / 100) : 0;
  const recoveryOffset = circ - recoveryRatio * circ;

  // Strain Ring offset (0.0 to 21.0)
  const strainRatio = Math.min(1, Math.max(0, metrics.dailyStrain / 21.0));
  const strainOffset = circ - strainRatio * circ;

  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-3 select-none">
      {/* 1. LEFT RING: SLEEP */}
      <button
        onClick={() => onSelectTab('sleep')}
        className="flex flex-col items-center group transition-transform active:scale-95"
      >
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#222730"
              strokeWidth={stroke}
              fill="transparent"
            />
            {metrics.sleepPerformance !== null && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#7293B2"
                strokeWidth={stroke}
                fill="transparent"
                strokeDasharray={circ}
                strokeDashoffset={sleepOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black font-condensed tracking-tight tabular-nums text-white">
              {metrics.sleepPerformance !== null ? `${metrics.sleepPerformance}%` : '--'}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 mt-2 font-condensed group-hover:text-white transition-colors">
          {t('sleep')} {isRtl ? '‹' : '›'}
        </span>
      </button>

      {/* 2. CENTER RING: RECOVERY */}
      <button
        onClick={() => onSelectTab('recovery')}
        className="flex flex-col items-center group transition-transform active:scale-95"
      >
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#222730"
              strokeWidth={stroke}
              fill="transparent"
            />
            {metrics.recoveryScore !== null && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={recoveryColor}
                strokeWidth={stroke}
                fill="transparent"
                strokeDasharray={circ}
                strokeDashoffset={recoveryOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className="text-2xl font-black font-condensed tracking-tight tabular-nums"
              style={{ color: metrics.recoveryScore !== null ? recoveryColor : '#71717A' }}
            >
              {metrics.recoveryScore !== null ? `${metrics.recoveryScore}%` : '--'}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 mt-2 font-condensed group-hover:text-white transition-colors">
          {t('recoveryScore')} {isRtl ? '‹' : '›'}
        </span>
      </button>

      {/* 3. RIGHT RING: STRAIN */}
      <button
        onClick={() => onSelectTab('strain')}
        className="flex flex-col items-center group transition-transform active:scale-95"
      >
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#222730"
              strokeWidth={stroke}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#0093E9"
              strokeWidth={stroke}
              fill="transparent"
              strokeDasharray={circ}
              strokeDashoffset={strainOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black font-condensed tracking-tight tabular-nums text-white">
              {metrics.dailyStrain.toFixed(1)}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 mt-2 font-condensed group-hover:text-white transition-colors">
          {t('strain')} {isRtl ? '‹' : '›'}
        </span>
      </button>
    </div>
  );
};
