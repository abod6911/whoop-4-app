import React, { useState, useMemo, useCallback } from 'react';
import { Moon } from 'lucide-react';
import type { SleepStagePoint } from '../types/whoop';
import { useLanguage } from '../i18n/LanguageContext';

interface HypnogramChartProps {
  timeline: SleepStagePoint[];
  height?: number;
}

interface HoveredPoint {
  timeStr: string;
  stageName: string;
  stageColor: string;
  hr?: number;
  x: number;
  y: number;
}

const STAGE_LEVELS = {
  awake: 3, // Top level
  rem: 2,
  light: 1,
  deep: 0,  // Bottom level
};

const STAGE_CONFIG = {
  awake: {
    color: '#FF5C5C',
    bg: 'rgba(255, 92, 92, 0.25)',
    nameEn: 'Awake',
    nameAr: 'مستيقظ',
  },
  rem: {
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.25)',
    nameEn: 'REM Sleep',
    nameAr: 'حركة العين السريعة',
  },
  light: {
    color: '#00F0FF',
    bg: 'rgba(0, 240, 255, 0.25)',
    nameEn: 'Light Sleep',
    nameAr: 'نوم خفيف',
  },
  deep: {
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.25)',
    nameEn: 'Deep (SWS)',
    nameAr: 'نوم عميق SWS',
  },
};

export const HypnogramChart: React.FC<HypnogramChartProps> = ({ timeline, height = 180 }) => {
  const { isRtl } = useLanguage();
  const [hovered, setHovered] = useState<HoveredPoint | null>(null);

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = height;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 32;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Level Y coordinates (Awake: top, Deep: bottom)
  const getY = useCallback(
    (level: number) => paddingTop + ((3 - level) / 3) * chartHeight,
    [paddingTop, chartHeight]
  );

  const { points, segments, timeTicks, stageStats } = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return { points: [], segments: [], timeTicks: [], stageStats: null };
    }

    const startTime = timeline[0].timestamp;
    const endTime = timeline[timeline.length - 1].timestamp;
    const duration = Math.max(1, endTime - startTime);

    // Downsample if timeline has > 400 epochs for smooth rendering
    const step = Math.max(1, Math.floor(timeline.length / 360));
    const sampled = timeline.filter((_, idx) => idx % step === 0 || idx === timeline.length - 1);

    const pts = sampled.map((pt) => {
      const fraction = (pt.timestamp - startTime) / duration;
      const x = paddingLeft + fraction * chartWidth;
      const level = STAGE_LEVELS[pt.stage];
      const y = getY(level);
      return {
        x,
        y,
        timestamp: pt.timestamp,
        stage: pt.stage,
        hr: pt.hr,
      };
    });

    // Build stepped segments
    const segs: Array<{
      path: string;
      stage: 'awake' | 'rem' | 'light' | 'deep';
      color: string;
      bg: string;
    }> = [];

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const conf = STAGE_CONFIG[p1.stage];

      // Stepped horizontal line then vertical drop/rise to next point
      const linePath = `M ${p1.x} ${p1.y} L ${p2.x} ${p1.y} L ${p2.x} ${p2.y}`;
      segs.push({
        path: linePath,
        stage: p1.stage,
        color: conf.color,
        bg: conf.bg,
      });
    }

    // Generate time ticks across timeline (approx every 1.5 - 2 hours)
    const ticks: Array<{ x: number; label: string }> = [];
    const tickIntervalMs = duration > 6 * 3600000 ? 2 * 3600000 : 3600000;
    const firstTickTime = Math.ceil(startTime / tickIntervalMs) * tickIntervalMs;

    for (let t = firstTickTime; t <= endTime; t += tickIntervalMs) {
      const fraction = (t - startTime) / duration;
      const x = paddingLeft + fraction * chartWidth;
      const date = new Date(t);
      const label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      ticks.push({ x, label });
    }

    // Always ensure start & end ticks are represented if needed
    if (ticks.length === 0) {
      ticks.push({
        x: paddingLeft,
        label: new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      });
      ticks.push({
        x: paddingLeft + chartWidth,
        label: new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      });
    }

    // Stage duration statistics
    let awakeEpochs = 0;
    let remEpochs = 0;
    let lightEpochs = 0;
    let deepEpochs = 0;

    timeline.forEach((pt) => {
      if (pt.stage === 'awake') awakeEpochs++;
      else if (pt.stage === 'rem') remEpochs++;
      else if (pt.stage === 'light') lightEpochs++;
      else if (pt.stage === 'deep') deepEpochs++;
    });

    const total = timeline.length;
    const epochMins = 0.5;

    const stats = {
      awakeMins: Math.round(awakeEpochs * epochMins),
      remMins: Math.round(remEpochs * epochMins),
      lightMins: Math.round(lightEpochs * epochMins),
      deepMins: Math.round(deepEpochs * epochMins),
      awakePct: total > 0 ? Math.round((awakeEpochs / total) * 100) : 0,
      remPct: total > 0 ? Math.round((remEpochs / total) * 100) : 0,
      lightPct: total > 0 ? Math.round((lightEpochs / total) * 100) : 0,
      deepPct: total > 0 ? Math.round((deepEpochs / total) * 100) : 0,
    };

    return { points: pts, segments: segs, timeTicks: ticks, stageStats: stats };
  }, [timeline, chartWidth, getY]);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="w-full py-10 flex flex-col items-center justify-center rounded-2xl bg-[#0B0D10] border border-white/5 text-center px-6 space-y-2.5">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Moon className="w-6 h-6 stroke-[1.8]" />
        </div>
        <div className="text-sm font-bold text-white font-condensed tracking-wide">
          {isRtl ? 'لم يتم تسجيل جلسة نوم بعد' : 'No Sleep Session Recorded Yet'}
        </div>
        <p className="text-xs text-zinc-400 font-condensed max-w-xs leading-relaxed">
          {isRtl
            ? 'ارتدِ السوار الليلة لرصد مراحل النوم (العميق، REM، الخفيف) وتحليل كفاءة النوم تلقائياً.'
            : 'Wear your WHOOP strap tonight to automatically track deep sleep, REM, light sleep, and sleep efficiency.'}
        </p>
      </div>
    );
  }

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * svgWidth;

    // Find nearest point
    let nearest = points[0];
    let minDiff = Infinity;
    for (const pt of points) {
      const diff = Math.abs(pt.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = pt;
      }
    }

    if (nearest && minDiff < 40) {
      const conf = STAGE_CONFIG[nearest.stage];
      const timeStr = new Date(nearest.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setHovered({
        timeStr,
        stageName: isRtl ? conf.nameAr : conf.nameEn,
        stageColor: conf.color,
        hr: nearest.hr,
        x: nearest.x,
        y: nearest.y,
      });
    } else {
      setHovered(null);
    }
  };

  const handleTouch = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = touch.clientX - rect.left;
      const svgX = (clientX / rect.width) * svgWidth;

      let nearest = points[0];
      let minDiff = Infinity;
      for (const pt of points) {
        const diff = Math.abs(pt.x - svgX);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = pt;
        }
      }

      if (nearest) {
        const conf = STAGE_CONFIG[nearest.stage];
        const timeStr = new Date(nearest.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        setHovered({
          timeStr,
          stageName: isRtl ? conf.nameAr : conf.nameEn,
          stageColor: conf.color,
          hr: nearest.hr,
          x: nearest.x,
          y: nearest.y,
        });
      }
    }
  };

  return (
    <div className="space-y-3 w-full select-none">
      {/* Interactive Hypnogram SVG Viewport */}
      <div className="relative rounded-2xl bg-[#090B0E] border border-white/10 p-2 overflow-hidden shadow-inner">
        {/* Active Hover Inspection Badge */}
        {hovered && (
          <div
            className="absolute top-3 z-20 px-3 py-1.5 rounded-xl bg-[#12161E]/95 border border-white/20 backdrop-blur-md shadow-lg flex items-center gap-2.5 text-xs font-mono pointer-events-none transition-all duration-150 animate-in fade-in"
            style={{
              left: isRtl ? undefined : Math.min(Math.max(10, (hovered.x / svgWidth) * 100), 70) + '%',
              right: isRtl ? Math.min(Math.max(10, 100 - (hovered.x / svgWidth) * 100), 70) + '%' : undefined,
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]"
              style={{ backgroundColor: hovered.stageColor, boxShadow: `0 0 8px ${hovered.stageColor}` }}
            />
            <span className="font-bold text-white font-condensed tracking-wide">{hovered.stageName}</span>
            <span className="text-zinc-400 font-mono text-[11px]">{hovered.timeStr}</span>
            {hovered.hr && (
              <span className="text-[#FF5C5C] font-bold font-mono text-[11px] flex items-center gap-0.5">
                ♥ {hovered.hr} <span className="text-[9px] text-zinc-500">bpm</span>
              </span>
            )}
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible cursor-crosshair touch-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
          onTouchMove={handleTouch}
          onTouchEnd={() => setHovered(null)}
        >
          {/* Horizontal Level Guidelines */}
          {Object.entries(STAGE_LEVELS).map(([stageKey, level]) => {
            const y = getY(level);
            const conf = STAGE_CONFIG[stageKey as keyof typeof STAGE_CONFIG];
            return (
              <g key={stageKey}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#272A30"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {/* Stage Y-Axis Label */}
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill={conf.color}
                  fontSize="10"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="bold"
                  className="font-condensed uppercase tracking-wider"
                >
                  {isRtl ? conf.nameAr : conf.nameEn}
                </text>
              </g>
            );
          })}

          {/* Stepped Hypnogram Wave Paths */}
          {segments.map((seg, idx) => (
            <path
              key={idx}
              d={seg.path}
              fill="none"
              stroke={seg.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Vertical Inspector Cursor on Hover */}
          {hovered && (
            <g>
              <line
                x1={hovered.x}
                y1={paddingTop - 5}
                x2={hovered.x}
                y2={svgHeight - paddingBottom + 5}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={hovered.x}
                cy={hovered.y}
                r="5"
                fill={hovered.stageColor}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Timeline X-Axis Guideline & Ticks */}
          <line
            x1={paddingLeft}
            y1={svgHeight - paddingBottom}
            x2={svgWidth - paddingRight}
            y2={svgHeight - paddingBottom}
            stroke="#3F444E"
            strokeWidth="1"
          />

          {timeTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={t.x}
                y1={svgHeight - paddingBottom}
                x2={t.x}
                y2={svgHeight - paddingBottom + 5}
                stroke="#525866"
                strokeWidth="1"
              />
              <text
                x={t.x}
                y={svgHeight - paddingBottom + 18}
                textAnchor="middle"
                fill="#7E8695"
                fontSize="10"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontWeight="600"
              >
                {t.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Stage Breakdown Metric Cards */}
      {stageStats && (
        <div className="grid grid-cols-4 gap-2 pt-1 text-center font-condensed">
          {/* Deep */}
          <div className="p-2.5 rounded-xl bg-[#0E1015] border border-[#6366F1]/30 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-[#6366F1]" />
            <div className="text-[10px] font-black uppercase text-[#6366F1] tracking-wider">
              {isRtl ? 'عميق SWS' : 'DEEP (SWS)'}
            </div>
            <div className="text-sm font-black text-white tabular-nums mt-0.5" dir="ltr">
              {stageStats.deepPct}%
            </div>
            <div className="text-[9px] text-zinc-400 font-mono mt-0.5" dir="ltr">
              {formatHoursMins(stageStats.deepMins)}
            </div>
          </div>

          {/* REM */}
          <div className="p-2.5 rounded-xl bg-[#0E1015] border border-[#38BDF8]/30 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-[#38BDF8]" />
            <div className="text-[10px] font-black uppercase text-[#38BDF8] tracking-wider">
              REM
            </div>
            <div className="text-sm font-black text-white tabular-nums mt-0.5" dir="ltr">
              {stageStats.remPct}%
            </div>
            <div className="text-[9px] text-zinc-400 font-mono mt-0.5" dir="ltr">
              {formatHoursMins(stageStats.remMins)}
            </div>
          </div>

          {/* Light */}
          <div className="p-2.5 rounded-xl bg-[#0E1015] border border-[#00F0FF]/30 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-[#00F0FF]" />
            <div className="text-[10px] font-black uppercase text-[#00F0FF] tracking-wider">
              {isRtl ? 'خفيف' : 'LIGHT'}
            </div>
            <div className="text-sm font-black text-white tabular-nums mt-0.5" dir="ltr">
              {stageStats.lightPct}%
            </div>
            <div className="text-[9px] text-zinc-400 font-mono mt-0.5" dir="ltr">
              {formatHoursMins(stageStats.lightMins)}
            </div>
          </div>

          {/* Awake */}
          <div className="p-2.5 rounded-xl bg-[#0E1015] border border-[#FF5C5C]/30 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-[#FF5C5C]" />
            <div className="text-[10px] font-black uppercase text-[#FF5C5C] tracking-wider">
              {isRtl ? 'استيقاظ' : 'AWAKE'}
            </div>
            <div className="text-sm font-black text-white tabular-nums mt-0.5" dir="ltr">
              {stageStats.awakePct}%
            </div>
            <div className="text-[9px] text-zinc-400 font-mono mt-0.5" dir="ltr">
              {formatHoursMins(stageStats.awakeMins)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
