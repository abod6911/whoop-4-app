import React from 'react';
import type { LiveMetrics, HomeSubTab } from '../types/whoop';

interface WhoopTripleGaugeProps {
  metrics: LiveMetrics;
  onSelectTab: (tab: HomeSubTab) => void;
  activeSubTab?: HomeSubTab;
}

export const WhoopTripleGauge: React.FC<WhoopTripleGaugeProps> = ({
  metrics,
  onSelectTab,
  activeSubTab,
}) => {
  const recoveryColor =
    metrics.recoveryCategory === 'green'
      ? '#16EC06'
      : metrics.recoveryCategory === 'yellow'
      ? '#FFDE00'
      : '#FF0026';

  // SVG parameters for side small gauges
  const sideSize = 92;
  const sideStroke = 7;
  const sideRadius = (sideSize - sideStroke) / 2;
  const sideCirc = 2 * Math.PI * sideRadius;
  const recoveryOffset = sideCirc - (metrics.recoveryScore / 100) * sideCirc;
  const sleepOffset = sideCirc - (metrics.sleepPerformance / 100) * sideCirc;

  // SVG parameters for center large Strain gauge
  const centerSize = 144;
  const centerStroke = 11;
  const centerRadius = (centerSize - centerStroke) / 2;
  const centerCirc = 2 * Math.PI * centerRadius;
  const strainRatio = Math.min(1, Math.max(0, metrics.dailyStrain / 21.0));
  const strainOffset = centerCirc - strainRatio * centerCirc;

  // Target bracket arc on Strain ring (e.g., targetMin to targetMax)
  const targetMinRatio = metrics.optimalStrainTarget.min / 21.0;
  const targetMaxRatio = metrics.optimalStrainTarget.max / 21.0;
  const targetArcLength = (targetMaxRatio - targetMinRatio) * centerCirc;
  const targetArcOffset = centerCirc - targetMinRatio * centerCirc;

  return (
    <div className="relative flex items-center justify-center gap-3 sm:gap-6 py-4 px-2 select-none">
      {/* LEFT: RECOVERY GAUGE */}
      <button
        onClick={() => onSelectTab('recovery')}
        className={`flex flex-col items-center group transition-transform active:scale-95 ${
          activeSubTab === 'recovery' ? 'opacity-100 scale-105' : 'opacity-85 hover:opacity-100'
        }`}
      >
        <div className="relative flex items-center justify-center" style={{ width: sideSize, height: sideSize }}>
          <svg width={sideSize} height={sideSize} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={sideSize / 2}
              cy={sideSize / 2}
              r={sideRadius}
              stroke="#1C212B"
              strokeWidth={sideStroke}
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx={sideSize / 2}
              cy={sideSize / 2}
              r={sideRadius}
              stroke={recoveryColor}
              strokeWidth={sideStroke}
              fill="transparent"
              strokeDasharray={sideCirc}
              strokeDashoffset={recoveryOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className="text-xl font-black font-condensed tracking-tight tabular-nums"
              style={{ color: recoveryColor }}
            >
              {metrics.recoveryScore}%
            </span>
          </div>
        </div>
        <span className="text-[11px] font-black uppercase tracking-wider text-whoop-gray mt-1 font-condensed">
          Recovery
        </span>
      </button>

      {/* CENTER: DAY STRAIN (LARGE SIGNATURE GAUGE) */}
      <button
        onClick={() => onSelectTab('strain')}
        className={`flex flex-col items-center group transition-transform active:scale-95 ${
          activeSubTab === 'strain' ? 'opacity-100 scale-105' : 'opacity-95 hover:opacity-100'
        }`}
      >
        <div className="relative flex items-center justify-center" style={{ width: centerSize, height: centerSize }}>
          <svg width={centerSize} height={centerSize} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={centerSize / 2}
              cy={centerSize / 2}
              r={centerRadius}
              stroke="#1C212B"
              strokeWidth={centerStroke}
              fill="transparent"
            />
            {/* Target bracket outline */}
            <circle
              cx={centerSize / 2}
              cy={centerSize / 2}
              r={centerRadius}
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth={centerStroke + 3}
              fill="transparent"
              strokeDasharray={`${targetArcLength} ${centerCirc - targetArcLength}`}
              strokeDashoffset={targetArcOffset}
              strokeLinecap="round"
            />
            {/* Strain Blue Progress ring */}
            <circle
              cx={centerSize / 2}
              cy={centerSize / 2}
              r={centerRadius}
              stroke="url(#strainGrad)"
              strokeWidth={centerStroke}
              fill="transparent"
              strokeDasharray={centerCirc}
              strokeDashoffset={strainOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />

            <defs>
              <linearGradient id="strainGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0093E9" />
                <stop offset="100%" stopColor="#00B4D8" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black font-condensed text-white tracking-tight tabular-nums">
              {metrics.dailyStrain.toFixed(1)}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00B4D8] font-condensed -mt-0.5">
              Target {metrics.optimalStrainTarget.min}–{metrics.optimalStrainTarget.max}
            </span>
          </div>
        </div>
        <span className="text-[12px] font-black uppercase tracking-wider text-whoop-blue mt-1 font-condensed">
          Day Strain
        </span>
      </button>

      {/* RIGHT: SLEEP PERFORMANCE GAUGE */}
      <button
        onClick={() => onSelectTab('sleep')}
        className={`flex flex-col items-center group transition-transform active:scale-95 ${
          activeSubTab === 'sleep' ? 'opacity-100 scale-105' : 'opacity-85 hover:opacity-100'
        }`}
      >
        <div className="relative flex items-center justify-center" style={{ width: sideSize, height: sideSize }}>
          <svg width={sideSize} height={sideSize} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={sideSize / 2}
              cy={sideSize / 2}
              r={sideRadius}
              stroke="#1C212B"
              strokeWidth={sideStroke}
              fill="transparent"
            />
            {/* Sleep Steel Blue progress ring */}
            <circle
              cx={sideSize / 2}
              cy={sideSize / 2}
              r={sideRadius}
              stroke="#7395B7"
              strokeWidth={sideStroke}
              fill="transparent"
              strokeDasharray={sideCirc}
              strokeDashoffset={sleepOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black font-condensed text-[#7395B7] tracking-tight tabular-nums">
              {metrics.sleepPerformance}%
            </span>
          </div>
        </div>
        <span className="text-[11px] font-black uppercase tracking-wider text-whoop-gray mt-1 font-condensed">
          Sleep
        </span>
      </button>
    </div>
  );
};
