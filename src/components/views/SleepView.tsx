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
import { AnimatedRing } from '../motion/AnimatedRing';
import { HypnogramChart } from '../HypnogramChart';

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
    const actualHours = d.offset === 0 ? hoursAsleep : (d.hoursAsleep ?? d.sleepHours ?? null);
    const needHours = d.offset === 0 ? sleepNeed : (d.sleepNeedHours ?? d.sleepNeededHours ?? sleepNeed);
    return {
      day: d.offset === 0 ? t('today') : day,
      hours: actualHours !== null && actualHours !== undefined ? Number(actualHours) : null,
      need: needHours !== null && needHours !== undefined ? Number(needHours) : sleepNeed,
    };
  });

  const restorative7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    let deep: number | null = null;
    let rem: number | null = null;
    if (d.offset === 0) {
      deep = hoursAsleep ? Number((hoursAsleep * (sleepData.stages.deepPercent / 100)).toFixed(1)) : null;
      rem = hoursAsleep ? Number((hoursAsleep * (sleepData.stages.remPercent / 100)).toFixed(1)) : null;
    } else {
      deep = d.deepHours !== null && d.deepHours !== undefined ? d.deepHours : null;
      rem = d.remHours !== null && d.remHours !== undefined ? d.remHours : null;
    }
    return {
      day: d.offset === 0 ? t('today') : day,
      deep,
      rem,
    };
  });

  const efficiency7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    const eff = d.offset === 0 ? sleepData.efficiencyPercent : (d.sleepEfficiency ?? null);
    return {
      day: d.offset === 0 ? t('today') : day,
      eff,
    };
  });

  const timeInBedRanges = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    let bedTime = '--';
    let wakeTime = '--';
    let height = 0;

    if (d.offset === 0) {
      const timeline = sleepData.timeline || [];
      const hasTimeline = timeline.length >= 2;
      bedTime = hasTimeline
        ? new Date(timeline[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : (sleepData.bedtime || '--');
      wakeTime = hasTimeline
        ? new Date(timeline[timeline.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : (sleepData.wakeTime || '--');
      height = sleepData.hoursInBed ?? hoursAsleep ?? 0;
    } else {
      bedTime = d.bedtime || '--';
      wakeTime = d.wakeTime || '--';
      height = d.hoursInBed ?? d.hoursAsleep ?? d.sleepHours ?? 0;
    }

    return {
      day: d.offset === 0 ? t('today') : day,
      bed: bedTime,
      wake: wakeTime,
      height: Number(height.toFixed(1)),
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

        {/* Giant Number / Animated Rings: SLEEP PERFORMANCE & SLEEP EFFICIENCY */}
        <div className="flex items-center justify-center gap-6 my-3">
          {/* Performance Ring */}
          <AnimatedRing
            radius={65}
            strokeWidth={8}
            progress={perf !== null ? Math.min(1, Math.max(0, perf / 100)) : 0}
            strokeColor="#38BDF8"
            glow
            glowColor="rgba(56, 189, 248, 0.45)"
          >
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-condensed text-white tracking-tight tabular-nums">
                {perf !== null ? `${perf}%` : '--'}
              </span>
              <span className="text-[9px] font-black uppercase text-zinc-400 font-condensed tracking-wider">
                {t('sleepPerformance')}
              </span>
            </div>
          </AnimatedRing>

          {/* Efficiency Ring */}
          <AnimatedRing
            radius={65}
            strokeWidth={8}
            progress={sleepData.efficiencyPercent !== null ? Math.min(1, Math.max(0, sleepData.efficiencyPercent / 100)) : 0}
            strokeColor="#16EC06"
            glow
            glowColor="rgba(22, 236, 6, 0.45)"
          >
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-condensed text-white tracking-tight tabular-nums">
                {sleepData.efficiencyPercent !== null ? `${sleepData.efficiencyPercent}%` : '--'}
              </span>
              <span className="text-[9px] font-black uppercase text-zinc-400 font-condensed tracking-wider">
                {isRtl ? 'كفاءة النوم' : 'SLEEP EFFICIENCY'}
              </span>
            </div>
          </AnimatedRing>
        </div>

        {/* Flanked Pills: HOURS OF SLEEP vs SLEEP NEEDED */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-[#1A202A] border border-[#38BDF8]/30 text-center">
            <div className="text-[10px] font-black uppercase text-[#38BDF8] font-condensed">
              {isRtl ? 'ساعات النوم' : 'HOURS OF SLEEP'}
            </div>
            <div className="text-2xl font-black font-condensed text-white tabular-nums mt-0.5" dir="ltr">
              {hoursAsleep !== null
                ? `${Math.floor(hoursAsleep)}h ${Math.round((hoursAsleep % 1) * 60)}m`
                : '--'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0F2618] border border-[#16EC06]/30 text-center">
            <div className="text-[10px] font-black uppercase text-[#16EC06] font-condensed">
              {t('sleepNeed')}
            </div>
            <div className="text-2xl font-black font-condensed text-white tabular-nums mt-0.5" dir="ltr">
              {sleepNeed
                ? `${Math.floor(sleepNeed)}h ${Math.round((sleepNeed % 1) * 60)}m`
                : '--'}
            </div>
          </div>
        </div>

        {/* OLED Night Lock Quick Trigger */}
        <button
          onClick={onActivateOledNightLock}
          className="w-full py-3 px-4 rounded-xl bg-[#0B0D10] hover:bg-[#16191E] border border-white/10 text-[#38BDF8] font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Lock className="w-4 h-4 text-[#38BDF8]" />
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
              {sleepData.needBreakdown ? `${Math.floor(sleepData.needBreakdown.baselineNeedHours)}h ${Math.round((sleepData.needBreakdown.baselineNeedHours % 1) * 60)}m` : (sleepNeed ? `${Math.floor(sleepNeed)}h ${Math.round((sleepNeed % 1) * 60)}m` : '--')}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <span className="text-zinc-300 font-bold uppercase">{isRtl ? 'دين النوم المتراكم' : 'Recent Sleep Debt'}</span>
            <span className="text-[#FFDE00] font-mono font-bold" dir="ltr">
              {sleepData.needBreakdown && sleepData.needBreakdown.recentDebtHours > 0
                ? `+${Math.round(sleepData.needBreakdown.recentDebtHours * 60)}m`
                : (hoursAsleep !== null ? '0m' : '--')}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <span className="text-zinc-300 font-bold uppercase">{isRtl ? 'طلب التعافي من الإجهاد' : 'Strain Sleep Demand'}</span>
            <span className="text-[#00A3FF] font-mono font-bold" dir="ltr">
              {sleepData.needBreakdown
                ? `+${Math.round(sleepData.needBreakdown.strainNeedHours * 60)}m`
                : (metrics.dailyStrain > 0 ? `+${Math.round((metrics.dailyStrain / 21) * 84)}m` : (hoursAsleep !== null ? '0m' : '--'))}
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
          <span className="text-[10px] text-[#EC4899] font-mono font-bold" dir="ltr">
            {hoursAsleep !== null ? `${sleepData.stages.deepPercent + sleepData.stages.remPercent}% ${isRtl ? 'تعويضي' : 'Restorative'}` : t('calibrating')}
          </span>
        </div>

        {/* Full Interactive Multi-Tier Hypnogram Chart */}
        <HypnogramChart timeline={sleepData.timeline || []} />
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
            <span className="text-[#EC4899] font-mono font-bold" dir="ltr">
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
                <YAxis domain={[0, 12]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
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
              <span className="text-[#EC4899]">{isRtl ? '● عميق' : '● Deep'}</span>
              <span className="text-[#A855F7]">{isRtl ? '● REM' : '● REM'}</span>
            </div>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restorative7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 5]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="deep" stackId="a" fill="#EC4899" />
                <Bar dataKey="rem" stackId="a" fill="#A855F7" radius={[4, 4, 0, 0]} />
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
                <YAxis domain={[50, 100]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="eff" stroke="#16EC06" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
