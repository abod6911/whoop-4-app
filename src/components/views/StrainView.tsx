import React, { useState } from 'react';
import type { LiveMetrics, HrZoneInfo, UserSettings, DayHistoryRecord } from '../../types/whoop';
import { shareWhoopScorecard } from '../../utils/shareScorecard';
import {
  Flame,
  Dumbbell,
  Share2,
  Play,
  Square,
  Activity,
  Footprints,
  Heart,
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
import { hapticMedium } from '../../utils/haptics';

interface StrainViewProps {
  metrics: LiveMetrics;
  zones: HrZoneInfo[];
  settings: UserSettings;
  daysHistory?: DayHistoryRecord[];
  onStartWorkout: (sport: string) => void;
  onStopWorkout: () => void;
  isWorkoutActive: boolean;
  workoutElapsedSec: number;
  onOpenShareCard?: (type: 'recovery' | 'strain' | 'activity') => void;
}

export const StrainView: React.FC<StrainViewProps> = ({
  metrics,
  zones,
  settings,
  daysHistory,
  onStartWorkout,
  onStopWorkout,
  isWorkoutActive,
  workoutElapsedSec,
  onOpenShareCard,
}) => {
  const { t, isRtl, dayNames } = useLanguage();
  const [selectedSport, setSelectedSport] = useState('Running');
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    hapticMedium();
    if (onOpenShareCard) {
      onOpenShareCard('strain');
      return;
    }
    const success = await shareWhoopScorecard(
      {
        recoveryScore: metrics.recoveryScore,
        recoveryCategory: metrics.recoveryCategory,
        dailyStrain: metrics.dailyStrain,
        sleepPerformance: metrics.sleepPerformance,
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

  const sports = [
    'Running',
    'Weightlifting',
    'Cycling',
    'Functional Fitness',
    'HIIT',
    'Walking',
  ];

  const sportsMap: Record<string, string> = {
    Running: isRtl ? 'الجري' : 'Running',
    Weightlifting: isRtl ? 'رفع الأثقال' : 'Weightlifting',
    Cycling: isRtl ? 'الدراجة' : 'Cycling',
    'Functional Fitness': isRtl ? 'اللياقة الوظيفية' : 'Functional Fitness',
    HIIT: 'HIIT',
    Walking: isRtl ? 'المشي' : 'Walking',
  };

  const size = 180;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const strainScore = metrics.dailyStrain;
  const strainRatio = Math.min(1, Math.max(0, strainScore / 21.0));
  const strainOffset = circ - strainRatio * circ;

  const recentDays = (daysHistory || []).slice(0, 7).reverse();

  // 7-day chart data derived strictly from real records (Zero Fake Data)
  const strain7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      strain: d.offset === 0 ? Number(metrics.dailyStrain.toFixed(1)) : Number(d.dayStrain.toFixed(1)),
    };
  });

  const avgHr7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      hr: d.offset === 0 ? metrics.avgHr : null,
    };
  });

  const calories7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      cal: d.offset === 0 ? metrics.activeCalories : d.activeCalories,
    };
  });

  const validStrain = strain7Day.filter((d) => d.strain > 0);
  const avgStrain = validStrain.length > 0 ? (validStrain.reduce((a, b) => a + b.strain, 0) / validStrain.length).toFixed(1) : '--';

  const validHr = avgHr7Day.filter((d) => d.hr && d.hr > 0);
  const avgHrVal = validHr.length > 0 ? `${Math.round(validHr.reduce((a, b) => a + (b.hr || 0), 0) / validHr.length)} ${isRtl ? 'ن/د' : 'bpm'}` : '--';

  const validCal = calories7Day.filter((d) => d.cal > 0);
  const avgCalVal = validCal.length > 0 ? `${Math.round(validCal.reduce((a, b) => a + b.cal, 0) / validCal.length).toLocaleString()} ${isRtl ? 'سعرة' : 'kcal'}` : '--';

  const totalZoneSeconds = Object.values(metrics.zoneSeconds).reduce((a, b) => a + b, 0);

  const formatSec = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. Large Circular Strain Gauge + Share (01:55 in Video) */}
      <div className="p-6 rounded-[24px] bg-[#12151A] border border-white/5 flex flex-col items-center justify-center text-center">
        <div className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider font-condensed text-zinc-400 mb-2">
          <span>{t('dayStrain')}</span>
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

        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#181D26"
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

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-black font-condensed text-[#0093E9] tracking-tight tabular-nums">
              {strainScore.toFixed(1)}
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 font-condensed mt-1">
              {isRtl
                ? `المستهدف: ${metrics.optimalStrainTarget.min.toFixed(1)} - ${metrics.optimalStrainTarget.max.toFixed(1)}`
                : `Target: ${metrics.optimalStrainTarget.min.toFixed(1)} - ${metrics.optimalStrainTarget.max.toFixed(1)}`}
            </span>
          </div>
        </div>

        {/* Dynamic Coaching Text */}
        <div className="mt-5 w-full p-3.5 rounded-2xl bg-[#0D1520] border border-[#0093E9]/20 text-xs text-zinc-300 leading-relaxed text-start flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#0093E9] flex-shrink-0 mt-0.5" />
          <p>
            {strainScore >= metrics.optimalStrainTarget.min
              ? isRtl
                ? 'تم تحقيق التحفيز البدني المثالي. لقد بنيت لياقتك ضمن سعتك القلبية الوعائية.'
                : 'Optimal stimulus achieved. You have built fitness while staying within your cardiovascular capacity.'
              : isRtl
                ? 'لديك متسع لمزيد من الإجهاد اليوم. مارس 20-30 دقيقة من التمارين الهوائية للوصول لنطاقك المستهدف.'
                : 'You have room for more strain today. Engage in 20-30 minutes of aerobic exertion to hit your target bracket.'}
          </p>
        </div>
      </div>

      {/* 2. STRAIN STATISTICS Rows */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
          {isRtl ? 'إحصائيات الإجهاد والنشاط' : 'Strain Statistics'}
        </h3>

        <div className="divide-y divide-white/5">
          {/* Real Steps & Cadence */}
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Footprints className="w-3.5 h-3.5 text-[#0093E9]" />
              <div className="flex items-center gap-1.5">
                <span className="uppercase">{t('steps')}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 font-mono">
                  {metrics.stepSource === 'imu_hardware' ? (isRtl ? 'حساس IMU' : 'IMU SENSOR') : (isRtl ? 'تقدير' : 'ESTIMATED')}
                </span>
              </div>
            </div>
            <div className="text-end">
              <span className="text-white font-mono font-bold" dir="ltr">
                {metrics.steps > 0 ? metrics.steps.toLocaleString() : '--'}
              </span>
              {metrics.cadence > 0 && (
                <span className="text-[10px] text-zinc-400 font-mono block" dir="ltr">
                  {metrics.cadence} spm
                </span>
              )}
            </div>
          </div>

          {/* Average Heart Rate */}
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span className="uppercase">{t('avgHr')}</span>
            </div>
            <span className="text-white font-mono font-bold" dir="ltr">
              {metrics.avgHr ? `${metrics.avgHr} ${t('bpm')}` : '--'}
            </span>
          </div>

          {/* Caloric Expenditure with BMR + Active Burn Breakdown */}
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="uppercase">{isRtl ? 'إجمالي السعرات (BMR + حرق)' : 'Total Calories (BMR + Active)'}</span>
            </div>
            <div className="text-end">
              <span className="text-white font-mono font-bold" dir="ltr">
                {(metrics.totalCalories > 0 ? metrics.totalCalories : (metrics.bmrCalories + metrics.activeCalories)).toLocaleString()} kcal
              </span>
              <span className="text-[10px] text-zinc-400 font-mono block" dir="ltr">
                {metrics.bmrCalories} BMR + {metrics.activeCalories} {isRtl ? 'نشط' : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Strain Coach Workout Controller */}
      <div className="p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white font-condensed">
            <Dumbbell className="w-4 h-4 text-[#0093E9]" />
            <span>{isRtl ? 'مدرب الإجهاد المباشر' : 'Live Strain Coach'}</span>
          </div>
          {isWorkoutActive && (
            <span className="text-[10px] bg-[#0093E9] text-white px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
              {isRtl ? 'نشط' : 'ACTIVE'} ({formatSec(workoutElapsedSec)})
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {sports.map((sp) => (
            <button
              key={sp}
              onClick={() => setSelectedSport(sp)}
              className={`py-2 px-2 text-[11px] font-condensed font-black uppercase tracking-wider rounded-xl transition-all ${
                selectedSport === sp
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'bg-[#1A1F26] text-zinc-400 hover:text-white'
              }`}
            >
              {sportsMap[sp] || sp}
            </button>
          ))}
        </div>

        {!isWorkoutActive ? (
          <button
            onClick={() => onStartWorkout(selectedSport)}
            className="w-full py-3.5 rounded-2xl bg-[#0093E9] hover:bg-[#0082CF] text-white font-condensed font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isRtl ? `بدء جلسة ${sportsMap[selectedSport] || selectedSport}` : `Start ${selectedSport} Session`}</span>
          </button>
        ) : (
          <button
            onClick={onStopWorkout}
            className="w-full py-3.5 rounded-2xl bg-[#FF0026] hover:bg-[#E00022] text-white font-condensed font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>{isRtl ? 'إنهاء التمرين وحفظه' : 'End & Save Workout'}</span>
          </button>
        )}
      </div>

      {/* 4. 3 Dedicated 7-Day Charts (02:02 – 02:13 in Video) */}
      <div className="space-y-4">
        {/* Chart 1: STRAIN Bright Blue Vertical Bars */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('strain7Days')}</span>
            <span className="text-[10px] text-[#0093E9] font-mono">{isRtl ? `المتوسط: ${avgStrain}` : `AVG: ${avgStrain}`}</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strain7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 21]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="strain" fill="#0093E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: AVERAGE HR Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('avgHr')}</span>
            <span className="text-[10px] text-[#0093E9] font-mono">{isRtl ? `المتوسط: ${avgHrVal}` : `AVG: ${avgHrVal}`}</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={avgHr7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[60, 95]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="hr" stroke="#0093E9" strokeWidth={2.5} dot={{ r: 3, fill: '#0093E9' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: CALORIES Bar Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('calories7Days')}</span>
            <span className="text-[10px] text-[#0093E9] font-mono">{isRtl ? `المتوسط: ${avgCalVal}` : `AVG: ${avgCalVal}`}</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calories7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="cal" fill="#0093E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
