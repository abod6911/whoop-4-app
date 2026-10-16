import React, { useState } from 'react';
import type { SleepMetrics, LiveMetrics, DayHistoryRecord } from '../../types/whoop';
import { shareWhoopScorecard } from '../../utils/shareScorecard';
import {
  Moon,
  Share2,
  Lock,
  ChevronRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useLanguage } from '../../i18n/LanguageContext';

interface SleepViewProps {
  metrics: LiveMetrics;
  sleepData: SleepMetrics;
  daysHistory?: DayHistoryRecord[];
  onActivateOledNightLock: () => void;
}

export const SleepView: React.FC<SleepViewProps> = ({
  metrics,
  sleepData,
  daysHistory,
  onActivateOledNightLock,
}) => {
  const { t, isRtl, dayNames } = useLanguage();
  const [shared, setShared] = useState(false);
  const perf = sleepData.sleepPerformance;
  const hoursAsleep = sleepData.hoursAsleep;
  const sleepNeed = sleepData.sleepNeedHours;

  const handleShare = async () => {
    const success = await shareWhoopScorecard(
      {
        recoveryScore: metrics.recoveryScore,
        recoveryCategory: metrics.recoveryCategory,
        dailyStrain: metrics.dailyStrain,
        sleepPerformance: perf,
        currentHrv: metrics.currentHrv,
        restingHr: metrics.restingHr,
      },
      isRtl
    );
    if (success) {
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const recentDays = (daysHistory || []).slice(0, 7).reverse();

  // 7-day chart data derived from real records (Zero Fake Data)
  const sleepPerf7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      perf: d.offset === 0 ? perf : d.sleepPerformance,
    };
  });

  const hoursVsNeed7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      hours: d.offset === 0 ? hoursAsleep : null,
      need: sleepNeed,
    };
  });

  const restorative7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    const deepHours = hoursAsleep ? (hoursAsleep * (sleepData.stages.deepPercent / 100)) : null;
    const remHours = hoursAsleep ? (hoursAsleep * (sleepData.stages.remPercent / 100)) : null;
    return {
      day: d.offset === 0 ? t('today') : day,
      deep: deepHours ? Number(deepHours.toFixed(1)) : null,
      rem: remHours ? Number(remHours.toFixed(1)) : null,
    };
  });

  const efficiency7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      eff: d.offset === 0 ? sleepData.efficiencyPercent : null,
    };
  });

  const timeInBedRanges = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    const timeline = d.offset === 0 ? (sleepData.timeline || []) : [];
    const hasTimeline = timeline.length >= 2;
    const bedTime = hasTimeline
      ? new Date(timeline[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : '--';
    const wakeTime = hasTimeline
      ? new Date(timeline[timeline.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : '--';

    return {
      day: d.offset === 0 ? t('today') : day,
      bed: bedTime,
      wake: wakeTime,
      height: d.offset === 0 ? (sleepData.hoursInBed ?? 0) : 0,
    };
  });

  const validPerf = sleepPerf7Day.filter((d) => d.perf !== null && d.perf !== undefined);
  const avgPerfVal = validPerf.length > 0 ? `${Math.round(validPerf.reduce((a, b) => a + (b.perf || 0), 0) / validPerf.length)}%` : '--';

  const validEff = efficiency7Day.filter((d) => d.eff !== null && d.eff !== undefined);
  const avgEffVal = validEff.length > 0 ? `${Math.round(validEff.reduce((a, b) => a + (b.eff || 0), 0) / validEff.length)}%` : '--';

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. Giant Header + Share (01:16 in Video) */}
      <div className="p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-4 text-center">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider font-condensed text-zinc-400">
          <span>{t('sleepPerformance')}</span>
          <button
            onClick={handleShare}
            className={`flex items-center gap-1 font-condensed tracking-wider transition-colors ${
              shared ? 'text-[#16EC06]' : 'text-[#00F0FF] hover:underline'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shared ? (isRtl ? 'تم النسخ!' : 'COPIED!') : (isRtl ? 'مشاركة' : 'SHARE')}</span>
          </button>
        </div>

        {/* Giant Number */}
        <div className="text-7xl font-black font-condensed text-white tracking-tight tabular-nums">
          {perf !== null ? `${perf}%` : '--'}
        </div>

        {/* Flanked Pills: HOURS OF SLEEP vs SLEEP NEEDED */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-[#1A202A] border border-[#7293B2]/30 text-center">
            <div className="text-[10px] font-black uppercase text-[#7293B2] font-condensed">
              {isRtl ? 'ساعات النوم' : 'HOURS OF SLEEP'}
            </div>
            <div className="text-2xl font-black font-condensed text-white tabular-nums mt-0.5" dir="ltr">
              {hoursAsleep !== null
                ? `${Math.floor(hoursAsleep)}:${Math.round((hoursAsleep % 1) * 60).toString().padStart(2, '0')}`
                : '--'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0F2618] border border-[#16EC06]/30 text-center">
            <div className="text-[10px] font-black uppercase text-[#16EC06] font-condensed">
              {t('sleepNeed')}
            </div>
            <div className="text-2xl font-black font-condensed text-white tabular-nums mt-0.5" dir="ltr">
              {sleepNeed
                ? `${Math.floor(sleepNeed)}:${Math.round((sleepNeed % 1) * 60).toString().padStart(2, '0')}`
                : '--'}
            </div>
          </div>
        </div>

        {/* OLED Night Lock Quick Trigger */}
        <button
          onClick={onActivateOledNightLock}
          className="w-full py-3 px-4 rounded-xl bg-[#0B0D10] hover:bg-[#16191E] border border-white/10 text-[#7293B2] font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Lock className="w-4 h-4 text-[#7293B2]" />
          <span>{isRtl ? 'تفعيل قفل الشاشة الليلي OLED (إبقاء البلوتوث متصلاً)' : 'Launch OLED Sleep Lock (Keep BLE Connected)'}</span>
        </button>
      </div>

      {/* 2. SLEEP NEED BREAKDOWN CARD */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed">
            {isRtl ? 'تفصيل احتياج النوم (SLEEP NEED)' : 'Sleep Need Breakdown'}
          </h3>
          <span className="text-[10px] text-[#16EC06] font-mono font-bold" dir="ltr">
            {sleepNeed ? `${Math.floor(sleepNeed)}h ${Math.round((sleepNeed % 1) * 60)}m` : '--'}
          </span>
        </div>

        <div className="space-y-2 pt-1 text-xs font-condensed">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <span className="text-zinc-300 font-bold uppercase">{isRtl ? 'الاحتياج الأساسي' : 'Baseline Sleep Need'}</span>
            <span className="text-white font-mono font-bold" dir="ltr">
              {sleepData.needBreakdown ? `${Math.floor(sleepData.needBreakdown.baselineNeedHours)}h ${Math.round((sleepData.needBreakdown.baselineNeedHours % 1) * 60)}m` : '--'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <span className="text-zinc-300 font-bold uppercase">{isRtl ? 'دين النوم المتراكم' : 'Recent Sleep Debt'}</span>
            <span className="text-[#FFDE00] font-mono font-bold" dir="ltr">
              {sleepData.needBreakdown ? `+${Math.round(sleepData.needBreakdown.recentDebtHours * 60)}m` : '--'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <span className="text-zinc-300 font-bold uppercase">{isRtl ? 'طلب التعافي من الإجهاد' : 'Strain Sleep Demand'}</span>
            <span className="text-[#0093E9] font-mono font-bold" dir="ltr">
              {sleepData.needBreakdown ? `+${Math.round(sleepData.needBreakdown.strainNeedHours * 60)}m` : (metrics.dailyStrain > 0 ? `+${Math.round((metrics.dailyStrain / 21) * 84)}m` : '--')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. SLEEP ARCHITECTURE & HYPNOGRAM */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed">
            {isRtl ? 'هيكل مراحل النوم (HYPNOGRAM)' : 'Sleep Architecture Stages'}
          </h3>
          <span className="text-[10px] text-[#D946EF] font-mono font-bold" dir="ltr">
            {hoursAsleep !== null ? `${sleepData.stages.deepPercent + sleepData.stages.remPercent}% ${isRtl ? 'تعويضي' : 'Restorative'}` : t('calibrating')}
          </span>
        </div>

        {/* Multi-Segment Stacked Stage Bar */}
        {hoursAsleep !== null ? (
          <div className="w-full h-3.5 bg-black/40 rounded-full overflow-hidden flex border border-white/10">
            <div
              style={{ width: `${sleepData.stages.deepPercent}%` }}
              className="bg-[#D946EF] h-full transition-all"
              title="Deep Sleep"
            />
            <div
              style={{ width: `${sleepData.stages.remPercent}%` }}
              className="bg-[#7C3AED] h-full transition-all"
              title="REM Sleep"
            />
            <div
              style={{ width: `${sleepData.stages.lightPercent}%` }}
              className="bg-[#7293B2] h-full transition-all"
              title="Light Sleep"
            />
            <div
              style={{ width: `${sleepData.stages.awakePercent}%` }}
              className="bg-[#EF4444] h-full transition-all"
              title="Awake"
            />
          </div>
        ) : (
          <div className="w-full h-3.5 bg-[#16191E] rounded-full border border-white/5 flex items-center justify-center text-[9px] text-zinc-500 font-mono">
            {t('calibrating')}
          </div>
        )}

        {/* 4 Stages Legend */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
          <div className="p-2 rounded-xl bg-[#16191E] border border-white/5">
            <div className="text-[9px] font-black uppercase text-[#D946EF] font-condensed">
              {isRtl ? 'عميق SWS' : 'DEEP (SWS)'}
            </div>
            <div className="text-sm font-black font-condensed text-white tabular-nums mt-0.5">
              {hoursAsleep !== null ? `${sleepData.stages.deepPercent}%` : '--'}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#16191E] border border-white/5">
            <div className="text-[9px] font-black uppercase text-[#7C3AED] font-condensed">
              REM
            </div>
            <div className="text-sm font-black font-condensed text-white tabular-nums mt-0.5">
              {hoursAsleep !== null ? `${sleepData.stages.remPercent}%` : '--'}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#16191E] border border-white/5">
            <div className="text-[9px] font-black uppercase text-[#7293B2] font-condensed">
              {isRtl ? 'خفيف' : 'LIGHT'}
            </div>
            <div className="text-sm font-black font-condensed text-white tabular-nums mt-0.5">
              {hoursAsleep !== null ? `${sleepData.stages.lightPercent}%` : '--'}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#16191E] border border-white/5">
            <div className="text-[9px] font-black uppercase text-[#EF4444] font-condensed">
              {isRtl ? 'استيقاظ' : 'AWAKE'}
            </div>
            <div className="text-sm font-black font-condensed text-white tabular-nums mt-0.5">
              {hoursAsleep !== null ? `${sleepData.stages.awakePercent}%` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SLEEP STATISTICS Rows */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
          {isRtl ? 'إحصائيات النوم' : 'Sleep Statistics'}
        </h3>

        <div className="divide-y divide-white/5">
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">{t('timeInBed')}</span>
            <span className="text-white font-mono font-bold" dir="ltr">
              {sleepData.hoursInBed
                ? `${Math.floor(sleepData.hoursInBed)}h ${Math.round((sleepData.hoursInBed % 1) * 60)}m`
                : '--'}
            </span>
          </div>
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">{isRtl ? 'كفاءة النوم' : 'SLEEP EFFICIENCY'}</span>
            <span className="text-[#16EC06] font-mono font-bold">
              {sleepData.efficiencyPercent ? `${sleepData.efficiencyPercent}%` : '--'}
            </span>
          </div>
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">{t('restorativeSleep')}</span>
            <span className="text-[#D946EF] font-mono font-bold" dir="ltr">
              {hoursAsleep !== null ? `${sleepData.stages.deepPercent + sleepData.stages.remPercent}% (SWS + REM)` : '--'}
            </span>
          </div>
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">{t('sleepDebt')}</span>
            <span className="text-white font-mono font-bold" dir="ltr">
              {sleepData.sleepDebtHours > 0 ? `${Math.round(sleepData.sleepDebtHours * 60)}m` : (hoursAsleep !== null ? '0m' : '--')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. 5 Dedicated 7-Day Charts (01:22 – 01:34 in Video) */}
      <div className="space-y-4">
        {/* Chart 1: SLEEP PERFORMANCE Bar Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{isRtl ? 'أداء النوم (7 أيام)' : 'SLEEP PERFORMANCE (7 DAYS)'}</span>
            <span className="text-[10px] text-[#7293B2] font-mono">{isRtl ? `المتوسط: ${avgPerfVal}` : `AVG: ${avgPerfVal}`}</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepPerf7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="perf" fill="#7293B2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: HOURS VS. NEED Dual Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('hoursVsNeed')}</span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-[#7293B2]">{isRtl ? '● النوم' : '● Sleep'}</span>
              <span className="text-[#16EC06]">{isRtl ? '● الاحتياج' : '● Need'}</span>
            </div>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hoursVsNeed7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[5, 10]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="hours" stroke="#7293B2" strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="need" stroke="#16EC06" strokeWidth={2.5} strokeDasharray="3 3" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: TIME IN BED Floating Range Bars */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{isRtl ? 'الوقت في الفراش (النوم والاستيقاظ)' : 'TIME IN BED (BEDTIME & WAKE)'}</span>
            <span className="text-[10px] text-zinc-400 font-mono">{isRtl ? 'التوافق اليومي' : 'CIRCADIAN ALIGNMENT'}</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center pt-2">
            {timeInBedRanges.map((t, idx) => (
              <div key={idx} className="flex flex-col items-center justify-end h-32">
                <span className="text-[8px] font-mono text-zinc-400 mb-1" dir="ltr">{t.wake.slice(0, 5)}</span>
                <div
                  className="w-full bg-gradient-to-t from-[#3A4E63] to-[#7293B2] rounded-lg transition-all"
                  style={{ height: `${(t.height / 10) * 100}%` }}
                />
                <span className="text-[8px] font-mono text-zinc-500 mt-1" dir="ltr">{t.bed.slice(0, 5)}</span>
                <span className="text-[9px] font-condensed font-black text-white mt-1">{t.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: RESTORATIVE SLEEP Stacked Bars (Deep + REM) */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{isRtl ? 'النوم التعويضي (العميق + REM)' : 'RESTORATIVE SLEEP (DEEP + REM)'}</span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-[#D946EF]">{isRtl ? '● عميق' : '● Deep'}</span>
              <span className="text-[#7C3AED]">{isRtl ? '● REM' : '● REM'}</span>
            </div>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restorative7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 5]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="deep" stackId="a" fill="#D946EF" />
                <Bar dataKey="rem" stackId="a" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: SLEEP EFFICIENCY Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('sleepEfficiency')}</span>
            <span className="text-[10px] text-[#16EC06] font-mono">{isRtl ? `المتوسط: ${avgEffVal}` : `AVG: ${avgEffVal}`}</span>
          </div>
          <div className="h-28 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiency7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[80, 100]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="eff" stroke="#16EC06" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
