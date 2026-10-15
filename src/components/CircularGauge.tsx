import React from 'react';

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  unit?: string;
  strokeColor: string;
  glowClass?: string;
  size?: number;
  strokeWidth?: number;
  decimalPlaces?: number;
  secondaryInfo?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  max,
  label,
  sublabel,
  unit,
  strokeColor,
  glowClass = '',
  size = 190,
  strokeWidth = 14,
  decimalPlaces = 1,
  secondaryInfo,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(1, Math.max(0, value / max));
  const strokeDashoffset = circumference - progressRatio * circumference;

  const displayValue = decimalPlaces === 0 ? Math.round(value) : value.toFixed(decimalPlaces);

  return (
    <div className={`relative flex flex-col items-center justify-center p-4 rounded-2xl bg-whoop-card border border-whoop-border/80 transition-all duration-300 hover:border-slate-700 ${glowClass}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1A2234"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono flex items-baseline gap-1">
            {displayValue}
            {unit && <span className="text-xs font-semibold text-whoop-muted tracking-normal">{unit}</span>}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-whoop-muted mt-0.5">
            {label}
          </span>
          {sublabel && (
            <span className="text-[10px] font-medium text-slate-400 mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      {secondaryInfo && (
        <div className="mt-3 text-xs font-medium text-slate-400 text-center w-full pt-2 border-t border-whoop-border/50">
          {secondaryInfo}
        </div>
      )}
    </div>
  );
};
