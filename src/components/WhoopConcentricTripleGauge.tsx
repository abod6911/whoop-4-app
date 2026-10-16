import React from 'react';
import type { LiveMetrics, HomeSubTab } from '../types/whoop';
import { WhoopEmblemIcon } from './WhoopLogo';

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
      ? '#FF0026'
      : '#52525B';

  const size = 150;
  const center = size / 2;

  // Ring 1: Outer - Day Strain (0.0 to 21.0)
  const rOuter = 65;
  const strokeOuter = 6.5;
  const circOuter = 2 * Math.PI * rOuter;
  const strainRatio = Math.min(1, Math.max(0, metrics.dailyStrain / 21.0));
  const strainOffset = circOuter - strainRatio * circOuter;

  // Ring 2: Middle - Recovery (0 to 100%)
  const rMiddle = 52;
  const strokeMiddle = 6;
  const circMiddle = 2 * Math.PI * rMiddle;
  const recoveryRatio = metrics.recoveryScore !== null ? Math.min(1, Math.max(0, metrics.recoveryScore / 100)) : 0;
  const recoveryOffset = circMiddle - recoveryRatio * circMiddle;

  // Ring 3: Inner - Sleep Performance (0 to 100%)
  const rInner = 39;
  const strokeInner = 5.5;
  const circInner = 2 * Math.PI * rInner;
  const sleepRatio = metrics.sleepPerformance !== null ? Math.min(1, Math.max(0, metrics.sleepPerformance / 100)) : 0;
  const sleepOffset = circInner - sleepRatio * circInner;

  return (
    <div className="flex items-center justify-between px-3 py-2 select-none">
      {/* LEFT COLUMN: Recovery % & HRV */}
      <div className="flex flex-col items-start justify-between min-w-[95px] space-y-4 text-start">
        {/* Top: Recovery */}
        <button
          onClick={() => onSelectTab('recovery')}
          className="text-start group transition-transform active:scale-95"
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
        </button>

        {/* Bottom: HRV */}
        <button
          onClick={() => onSelectTab('recovery')}
          className="text-start group transition-transform active:scale-95 pt-1"
          title="View HRV Details"
        >
          <div className="text-2xl font-black font-condensed tracking-tight tabular-nums text-white">
            {metrics.currentHrv !== null ? metrics.currentHrv : '--'}
            <span className="text-xs font-sans text-zinc-400 font-medium ml-1">ms</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-condensed group-hover:text-zinc-300 transition-colors">
            {t('hrv')}
          </div>
        </button>
      </div>

      {/* CENTER COLUMN: Concentric 3-Layer Ring Gauge around the "W" Logo */}
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Ring 1: Outer Day Strain Track & Fill */}
          <circle
            cx={center}
            cy={center}
            r={rOuter}
            stroke="#181D26"
            strokeWidth={strokeOuter}
            fill="transparent"
          />
          {metrics.dailyStrain > 0 && (
            <circle
              cx={center}
              cy={center}
              r={rOuter}
              stroke="#0093E9"
              strokeWidth={strokeOuter}
              fill="transparent"
              strokeDasharray={circOuter}
              strokeDashoffset={strainOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Ring 2: Middle Recovery Track & Fill */}
          <circle
            cx={center}
            cy={center}
            r={rMiddle}
            stroke="#1A221C"
            strokeWidth={strokeMiddle}
            fill="transparent"
          />
          {metrics.recoveryScore !== null && (
            <circle
              cx={center}
              cy={center}
              r={rMiddle}
              stroke={recoveryColor}
              strokeWidth={strokeMiddle}
              fill="transparent"
              strokeDasharray={circMiddle}
              strokeDashoffset={recoveryOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Ring 3: Inner Sleep Performance Track & Fill */}
          <circle
            cx={center}
            cy={center}
            r={rInner}
            stroke="#192028"
            strokeWidth={strokeInner}
            fill="transparent"
          />
          {metrics.sleepPerformance !== null && (
            <circle
              cx={center}
              cy={center}
              r={rInner}
              stroke="#7293B2"
              strokeWidth={strokeInner}
              fill="transparent"
              strokeDasharray={circInner}
              strokeDashoffset={sleepOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        {/* Center Geometric "W" Monogram */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <WhoopEmblemIcon size={34} variant="monogram" />
        </div>
      </div>

      {/* RIGHT COLUMN: Strain & Sleep Performance */}
      <div className="flex flex-col items-end justify-between min-w-[95px] space-y-4 text-end">
        {/* Top: Day Strain */}
        <button
          onClick={() => onSelectTab('strain')}
          className="text-end group transition-transform active:scale-95"
          title="View Strain Drill-down"
        >
          <div className="text-4xl font-black font-condensed tracking-tight tabular-nums text-[#0093E9]">
            {metrics.dailyStrain > 0 ? metrics.dailyStrain.toFixed(1) : '--'}
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400 font-condensed group-hover:text-white transition-colors flex items-center justify-end gap-0.5">
            <span>{t('dayStrain')}</span>
            <span className="text-[10px] text-zinc-500">{isRtl ? '‹' : '›'}</span>
          </div>
        </button>

        {/* Bottom: Sleep Performance */}
        <button
          onClick={() => onSelectTab('sleep')}
          className="text-end group transition-transform active:scale-95 pt-1"
          title="View Sleep Performance Details"
        >
          <div className="text-2xl font-black font-condensed tracking-tight tabular-nums text-white">
            {metrics.sleepPerformance !== null ? `${metrics.sleepPerformance}%` : '--'}
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-condensed group-hover:text-zinc-300 transition-colors">
            {t('sleepPerformance')}
          </div>
        </button>
      </div>
    </div>
  );
};
