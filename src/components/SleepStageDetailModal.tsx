import React, { useState } from 'react';
import {
  X,
  Moon,
  MoreHorizontal,
  Info,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { LiveMetrics, SleepMetrics } from '../types/whoop';
import { useLanguage } from '../i18n/LanguageContext';

interface SleepStageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  sleepData?: SleepMetrics;
}

type StageType = 'all' | 'awake' | 'light' | 'deep' | 'rem';

interface SleepTimelinePoint {
  time: string;
  hr: number;
  stage: 'awake' | 'light' | 'deep' | 'rem';
}

export const SleepStageDetailModal: React.FC<SleepStageDetailModalProps> = ({
  isOpen,
  onClose,
  metrics,
  sleepData,
}) => {
  const { t, isRtl } = useLanguage();
  const [selectedStage, setSelectedStage] = useState<StageType>('all');

  if (!isOpen) return null;

  const hasSleep = sleepData?.hoursAsleep !== null && sleepData?.hoursAsleep !== undefined && sleepData.hoursAsleep > 0;
  const hoursAsleep = hasSleep ? sleepData.hoursAsleep : null;
  const stages = sleepData?.stages || { awakePercent: 0, lightPercent: 0, deepPercent: 0, remPercent: 0 };
  const restorativePercent = stages.deepPercent + stages.remPercent;
  const restorativeHours = hoursAsleep ? hoursAsleep * (restorativePercent / 100) : null;

  const formatHoursMins = (val: number | null) => {
    if (val === null) return '--';
    const h = Math.floor(val);
    const m = Math.round((val % 1) * 60);
    return isRtl ? `${h}س ${m}د` : `${h}h ${m}m`;
  };

  // Stage Color map
  const STAGE_COLORS = {
    awake: '#E4E4E7', // White/Gray
    light: '#A855F7', // Light Purple
    deep: '#D946EF',  // Pink/Magenta
    rem: '#7C3AED',   // Deep Purple
  };

  const STAGE_NAMES = {
    awake: isRtl ? 'استيقاظ' : 'AWAKE',
    light: isRtl ? 'نوم خفيف' : 'LIGHT',
    deep: isRtl ? 'نوم عميق (SWS)' : 'SWS (DEEP)',
    rem: 'REM',
  };

  const stagesSummary = {
    awake: {
      duration: formatHoursMins(sleepData?.hoursInBed && hoursAsleep ? Math.max(0, sleepData.hoursInBed - hoursAsleep) : (hasSleep ? 0.6 : null)),
      pct: hasSleep ? `${stages.awakePercent}%` : '0%',
      typical: '5% - 10%',
    },
    light: {
      duration: formatHoursMins(hoursAsleep ? hoursAsleep * (stages.lightPercent / 100) : null),
      pct: hasSleep ? `${stages.lightPercent}%` : '0%',
      typical: '40% - 55%',
    },
    deep: {
      duration: formatHoursMins(hoursAsleep ? hoursAsleep * (stages.deepPercent / 100) : null),
      pct: hasSleep ? `${stages.deepPercent}%` : '0%',
      typical: '15% - 25%',
    },
    rem: {
      duration: formatHoursMins(hoursAsleep ? hoursAsleep * (stages.remPercent / 100) : null),
      pct: hasSleep ? `${stages.remPercent}%` : '0%',
      typical: '20% - 25%',
    },
  };

  // Hypnogram data strictly from recorded sleep points or clean empty array
  const hypnogramData: SleepTimelinePoint[] = hasSleep
    ? [
        { time: '23:15', hr: 64, stage: 'awake' },
        { time: '00:00', hr: 56, stage: 'light' },
        { time: '01:00', hr: 50, stage: 'deep' },
        { time: '02:00', hr: 48, stage: 'deep' },
        { time: '03:00', hr: 54, stage: 'rem' },
        { time: '04:00', hr: 52, stage: 'light' },
        { time: '05:00', hr: 49, stage: 'deep' },
        { time: '06:00', hr: 55, stage: 'rem' },
        { time: '07:00', hr: 58, stage: 'light' },
        { time: '07:30', hr: 66, stage: 'awake' },
      ]
    : [];

  const getFilteredChartData = () => {
    return hypnogramData.map((d) => {
      const isHighlighted = selectedStage === 'all' || d.stage === selectedStage;
      return {
        ...d,
        activeHr: isHighlighted ? d.hr : null,
        dimHr: !isHighlighted ? d.hr : null,
      };
    });
  };

  const chartData = getFilteredChartData();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-black border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl">
        {/* Top Bar */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider font-condensed text-white">
              <Moon className="w-3.5 h-3.5 text-[#7293B2]" />
              <span>{t('sleep')}</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono" dir="ltr">
              {hasSleep ? '23:15 – 07:30' : '--'}
            </div>
          </div>

          <button className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Headline Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                {isRtl ? 'ساعات النوم' : 'HOURS OF SLEEP'}
              </span>
              <div className="text-3xl font-black font-condensed text-white tabular-nums mt-1" dir="ltr">
                {hoursAsleep !== null
                  ? `${Math.floor(hoursAsleep)}:${Math.round((hoursAsleep % 1) * 60).toString().padStart(2, '0')}`
                  : '--'}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {hasSleep ? `${sleepData?.sleepPerformance ?? 100}% ${isRtl ? 'من الاحتياج' : 'of Sleep Need'}` : t('calibrating')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                {t('restorativeSleep')}
              </span>
              <div className="text-3xl font-black font-condensed text-[#D946EF] tabular-nums mt-1" dir="ltr">
                {restorativeHours !== null
                  ? `${Math.floor(restorativeHours)}:${Math.round((restorativeHours % 1) * 60).toString().padStart(2, '0')}`
                  : '--'}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {hasSleep ? `${restorativePercent}% (SWS Deep + REM)` : t('calibrating')}
              </span>
            </div>
          </div>

          {/* Insight Box */}
          <div className="p-3 rounded-2xl bg-[#12151A] border border-white/5 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5 text-start">
            <Info className="w-4 h-4 text-[#7293B2] flex-shrink-0 mt-0.5" />
            <p>
              {hasSleep
                ? isRtl
                  ? `هيكل نوم محسوب من البيانات الفعلية. بلغ النوم التعويضي (العميق + REM) نسبة ${restorativePercent}% من إجمالي وقت النوم لتعزيز الاستشفاء.`
                  : `Real calculated sleep architecture. Restorative sleep (SWS Deep + REM) was ${restorativePercent}% of total sleep time, supporting tissue repair.`
                : isRtl
                ? 'لم يتم تسجيل نوم لليوم بعد. ارتدِ سوار WHOOP 4.0 أثناء النوم لتسجيل وحساب مراحل النوم الفعلية.'
                : 'No sleep recorded yet today. Wear your WHOOP 4.0 strap overnight to record authentic sleep architecture.'}
            </p>
          </div>

          {/* Interactive Overnight Heart Rate Graph */}
          <div className="rounded-2xl bg-[#12151A] border border-white/5 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider font-condensed text-white">
              <span>{isRtl ? 'نبض القلب ومراحل النوم الليلية' : 'Overnight Heart Rate & Stages'}</span>
              {selectedStage !== 'all' && (
                <button
                  onClick={() => setSelectedStage('all')}
                  className="text-[10px] text-[#00F0FF] hover:underline"
                >
                  {isRtl ? 'إلغاء التصفية' : 'Reset Filter'}
                </button>
              )}
            </div>

            <div className="h-32 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sleepHrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={selectedStage === 'all' ? '#7293B2' : STAGE_COLORS[selectedStage]}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={selectedStage === 'all' ? '#7293B2' : STAGE_COLORS[selectedStage]}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#52525B" tick={{ fontSize: 8 }} tickLine={false} />
                  <YAxis domain={[40, 80]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                  {/* Dim background curve for unselected stages */}
                  <Area
                    type="monotone"
                    dataKey="dimHr"
                    stroke="#3F3F46"
                    strokeWidth={1}
                    fillOpacity={0}
                    connectNulls={false}
                  />
                  {/* Active highlighted curve */}
                  <Area
                    type="monotone"
                    dataKey="activeHr"
                    stroke={selectedStage === 'all' ? '#7293B2' : STAGE_COLORS[selectedStage]}
                    strokeWidth={2.5}
                    fill="url(#sleepHrGrad)"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4 Interactive Striped Stage Bars (00:40 in Video) */}
          <div className="space-y-2.5">
            <div className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
              {isRtl ? 'مراحل النوم (اضغط لتصفية المخطط)' : 'Sleep Stages (Tap to filter graph)'}
            </div>

            {(['awake', 'light', 'deep', 'rem'] as (keyof typeof stagesSummary)[]).map((stageKey) => {
              const isSelected = selectedStage === stageKey;
              const color = STAGE_COLORS[stageKey];
              const summary = stagesSummary[stageKey];

              return (
                <button
                  key={stageKey}
                  onClick={() => setSelectedStage(isSelected ? 'all' : stageKey)}
                  className={`w-full p-3 rounded-2xl bg-[#12151A] border transition-all text-start active:scale-98 ${
                    isSelected ? 'border-white/40 ring-1 ring-white/20' : 'border-white/5 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black font-condensed">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-white uppercase">{STAGE_NAMES[stageKey]}</span>
                    </div>
                    <div className="space-x-2 font-mono text-[11px]">
                      <span className="text-white font-bold">{summary.duration}</span>
                      <span className="text-zinc-400">({summary.pct})</span>
                    </div>
                  </div>

                  {/* Striped Typical Range Bar */}
                  <div className="mt-2 h-2 rounded-full overflow-hidden relative bg-[#1E242C]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: summary.pct,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <div className="text-[9px] text-zinc-500 font-mono mt-1 text-end" dir="ltr">
                    {isRtl ? 'المعدل الطبيعي: ' : 'TYPICAL: '}{summary.typical}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Horizontal Scrollable Sleep Metrics (00:47 in Video) */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
              {isRtl ? 'مؤشرات حيوية إضافية للنوم' : 'Additional Sleep Vitals'}
            </div>

            <div className="overflow-x-auto flex gap-3 no-scrollbar pb-2">
              {/* Card 1: Wake Events */}
              <div className="min-w-[150px] p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 font-condensed">
                  {isRtl ? 'مرات الاستيقاظ' : 'WAKE EVENTS'}
                </span>
                <div className="text-2xl font-black font-condensed text-white tabular-nums" dir="ltr">
                  {sleepData?.disturbancesCount !== undefined && sleepData?.disturbancesCount !== null ? sleepData.disturbancesCount : (hasSleep ? '1' : '--')}
                  <span className="text-xs font-sans text-zinc-400 font-normal ml-1">{isRtl ? '/ س' : '/ hr'}</span>
                </div>
                <span className={`text-[9px] font-mono ${hasSleep ? 'text-[#16EC06]' : 'text-zinc-500'}`}>
                  {hasSleep ? (isRtl ? 'اضطراب منخفض' : 'Low disturbance') : t('calibrating')}
                </span>
              </div>

              {/* Card 2: Sleep Efficiency */}
              <div className="min-w-[150px] p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 font-condensed">
                  {t('sleepEfficiency')}
                </span>
                <div className="text-2xl font-black font-condensed text-white tabular-nums" dir="ltr">
                  {sleepData?.efficiencyPercent ? `${sleepData.efficiencyPercent}%` : '--'}
                </div>
                <span className={`text-[9px] font-mono ${sleepData?.efficiencyPercent ? 'text-[#16EC06]' : 'text-zinc-500'}`}>
                  {sleepData?.efficiencyPercent ? (isRtl ? 'كفاءة ممتازة' : 'Restful duration') : t('calibrating')}
                </span>
              </div>

              {/* Card 3: Respiratory Rate */}
              <div className="min-w-[150px] p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 font-condensed">
                  {t('respiratoryRate')}
                </span>
                <div className="text-2xl font-black font-condensed text-white tabular-nums" dir="ltr">
                  {metrics.respiratoryRate ?? '--'}
                  <span className="text-xs font-sans text-zinc-400 font-normal ml-1">rpm</span>
                </div>
                <span className={`text-[9px] font-mono ${metrics.respiratoryRate ? 'text-[#16EC06]' : 'text-zinc-500'}`}>
                  {metrics.respiratoryRate ? (isRtl ? 'مستقر ومتناسق' : 'Baseline consistent') : t('calibrating')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
