import React, { useState } from 'react';
import type { LiveMetrics, UserSettings, DayHistoryRecord } from '../../types/whoop';
import { shareWhoopScorecard } from '../../utils/shareScorecard';
import {
  Activity,
  Heart,
  Share2,
  Wind,
  Moon,
  Info,
  Timer,
  CheckCircle2,
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
  Cell,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

import { useLanguage } from '../../i18n/LanguageContext';
import { hapticMedium } from '../../utils/haptics';
import { AnimatedRing } from '../motion/AnimatedRing';
import { biometricEngine } from '../../utils/biometricEngine';

interface RecoveryViewProps {
  metrics: LiveMetrics;
  settings: UserSettings;
  daysHistory?: DayHistoryRecord[];
  onOpenShareCard?: (type: 'recovery' | 'strain' | 'activity') => void;
}

export const getRecoveryColor = (score: number | null) => {
  if (score === null) return '#52525B';
  if (score >= 67) return '#16EC06';
  if (score >= 34) return '#FFDE00';
  return '#FF3344';
};

export const RecoveryView: React.FC<RecoveryViewProps> = ({
  metrics,
  settings,
  daysHistory,
  onOpenShareCard,
}) => {
  const { t, isRtl, dayNames } = useLanguage();
  const [shared, setShared] = useState(false);
  const recoveryScore = metrics.recoveryScore;
  const recoveryColor = getRecoveryColor(recoveryScore);
  const baseline = biometricEngine.getPersonalBaseline();
  const displayHrv = metrics.lockedHrv ?? metrics.currentHrv;

  const handleShare = async () => {
    hapticMedium();
    if (onOpenShareCard) {
      onOpenShareCard('recovery');
      return;
    }
    const success = await shareWhoopScorecard(
      {
        recoveryScore: metrics.recoveryScore,
        recoveryCategory: metrics.recoveryCategory,
        dailyStrain: metrics.dailyStrain,
        sleepPerformance: metrics.sleepPerformance,
        currentHrv: displayHrv,
        restingHr: metrics.restingHr,
      },
      isRtl
    );
    if (success) {
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const size = 180;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = recoveryScore !== null ? circ - (recoveryScore / 100) * circ : circ;

  const recentDays = (daysHistory || []).slice(0, 7).reverse();

  // 7-day data derived strictly from real persisted records (Zero Mock Data)
  const recovery7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      score: d.offset === 0 ? metrics.recoveryScore : d.recoveryScore,
    };
  });

  const hrv7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      hrv: d.offset === 0 ? displayHrv : d.hrv,
    };
  });

  const rhr7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      rhr: d.offset === 0 ? metrics.restingHr : d.rhr,
    };
  });

  const resp7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      resp: d.offset === 0 ? metrics.respiratoryRate : null,
    };
  });

  const validRec = recovery7Day.filter((r) => r.score !== null && r.score !== undefined);
  const avgRec = validRec.length > 0 ? `${Math.round(validRec.reduce((a, b) => a + (b.score || 0), 0) / validRec.length)}%` : '--';

  const validResp = resp7Day.filter((r) => r.resp !== null && r.resp !== undefined);
  const avgResp = validResp.length > 0 ? `${(validResp.reduce((a, b) => a + (b.resp || 0), 0) / validResp.length).toFixed(1)} ${t('rpm')}` : '--';

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. Large Circular Recovery Gauge + Share (01:35 in Video) */}
      <div className="p-6 rounded-[24px] bg-[#12151A] border border-white/5 flex flex-col items-center justify-center text-center">
        <div className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider font-condensed text-zinc-400 mb-2">
          <span>{t('recoveryScore')}</span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-[#00F0FF] hover:underline active:scale-95 transition-transform"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shared ? (isRtl ? 'تم النسخ!' : 'COPIED!') : (isRtl ? 'مشاركة' : 'SHARE')}</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center my-3">
          <AnimatedRing
            radius={76}
            strokeWidth={12}
            progress={recoveryScore !== null ? Math.min(1, Math.max(0, recoveryScore / 100)) : 0}
            strokeColor={recoveryColor}
            glow
            glowColor={
              recoveryScore !== null
                ? recoveryScore >= 67
                  ? 'rgba(22, 236, 6, 0.45)'
                  : recoveryScore >= 34
                  ? 'rgba(255, 222, 0, 0.45)'
                  : 'rgba(255, 51, 68, 0.45)'
                : undefined
            }
          >
            <div className="flex flex-col items-center justify-center">
              <span
                className="text-5xl font-black font-condensed tracking-tight tabular-nums transition-colors"
                style={{ color: recoveryColor }}
              >
                {recoveryScore !== null ? `${recoveryScore}%` : '--'}
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 font-condensed mt-1">
                {recoveryScore !== null
                  ? recoveryScore >= 67
                    ? (isRtl ? 'أخضر (جاهزية عالية)' : 'GREEN')
                    : recoveryScore >= 34
                    ? (isRtl ? 'أصفر (متوازن)' : 'YELLOW')
                    : (isRtl ? 'أحمر (يحتاج راحة)' : 'RED')
                  : t('calibrating')}
              </span>
              {metrics.dailyRecoveryLock && (
                <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5 text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16EC06]" />
                  <span>
                    {metrics.dailyRecoveryLock.source === 'sleep'
                      ? (isRtl ? 'مقفل من النوم' : 'LOCKED (SLEEP)')
                      : metrics.dailyRecoveryLock.source === 'morning_test'
                      ? (isRtl ? 'مقفل من الاختبار' : 'LOCKED (TEST)')
                      : (isRtl ? 'مقفل لليوم' : 'LOCKED TODAY')}
                  </span>
                </div>
              )}
            </div>
          </AnimatedRing>
        </div>

        {/* Dynamic Insight Box */}
        <div className="mt-5 w-full p-3.5 rounded-2xl bg-[#0D1612] border border-[#16EC06]/20 text-xs text-zinc-300 leading-relaxed text-start flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#16EC06] flex-shrink-0 mt-0.5" />
          <p>
            {recoveryScore !== null ? (
              isRtl ? (
                <>
                  جاهزية جهازك العصبي المستقل مقفلة لليوم وفق معايير WHOOP الرسمية. نبض الراحة{' '}
                  {metrics.restingHr ?? '--'} ن/د وتقلب النبض الأساسي {displayHrv ?? '--'} ms يوضحان قدرتك البدنية لليوم كاملاً.
                </>
              ) : (
                <>
                  Your autonomic recovery is locked for the calendar day per official WHOOP standards. Resting heart rate of{' '}
                  {metrics.restingHr ?? '--'} bpm and baseline HRV of {displayHrv ?? '--'} ms indicate your current autonomic capacity.
                </>
              )
            ) : (
              isRtl
                ? 'اربط سوارك الفعلي WHOOP 4.0 لبدء قياس نبض القلب وحساب مؤشر التعافي وتقلب النبض الفعلي.'
                : 'Connect your physical WHOOP 4.0 strap to record live heart rate and calculate your daily Recovery Score and HRV metrics.'
            )}
          </p>
        </div>
      </div>

      {/* 2. RECOVERY STATISTICS Rows */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
          {isRtl ? 'إحصائيات التعافي الفسيولوجي' : 'Recovery Statistics'}
        </h3>

        <div className="divide-y divide-white/5">
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Activity className="w-3.5 h-3.5 text-zinc-300" />
              <span className="uppercase">{t('hrv')}</span>
            </div>
            <span className="text-white font-mono font-bold">
              {displayHrv !== null ? `${displayHrv} ms` : '--'}
            </span>
            {metrics.dailyRecoveryLock && (
              <span className="text-[9px] font-mono text-[#16EC06] ml-1">
                ({metrics.dailyRecoveryLock.source === 'sleep' ? 'Sleep' : 'Locked'})
              </span>
            )}
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Heart className="w-3.5 h-3.5 text-zinc-300" />
              <span className="uppercase">{t('rhr')}</span>
            </div>
            <span className="text-white font-mono font-bold">
              {metrics.restingHr !== null ? `${metrics.restingHr} ${t('bpm')}` : '--'}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Wind className="w-3.5 h-3.5 text-zinc-300" />
              <span className="uppercase">{t('respiratoryRate')}</span>
            </div>
            <span className="text-white font-mono font-bold">
              {metrics.respiratoryRate !== null ? `${metrics.respiratoryRate} rpm` : '--'}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Moon className="w-3.5 h-3.5 text-zinc-300" />
              <span className="uppercase">{t('sleepPerformance')}</span>
            </div>
            <span className="text-white font-mono font-bold">
              {metrics.sleepPerformance !== null ? `${metrics.sleepPerformance}%` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. 4 Dedicated 7-Day Charts (01:42 – 01:54 in Video) */}
      <div className="space-y-4">
        {/* Chart 1: RECOVERY Vertical Bars */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('recovery7Days')}</span>
            <span className="text-[10px] text-[#16EC06] font-mono">{t('average')}: {avgRec}</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recovery7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {recovery7Day.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRecoveryColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: HEART RATE VARIABILITY Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('hrv7Days')}</span>
            <span className="text-[10px] text-[#16EC06] font-mono">{t('baseline')}: {baseline.hrvBaseline} ms</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hrv7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <ReferenceArea
                  y1={baseline.hrvBandLo}
                  y2={baseline.hrvBandHi}
                  fill="#16EC06"
                  fillOpacity={0.08}
                  strokeOpacity={0}
                />
                <ReferenceLine
                  y={baseline.hrvBandMid}
                  stroke="#16EC06"
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                />
                <Line type="monotone" dataKey="hrv" stroke="#16EC06" strokeWidth={2.5} dot={{ r: 3, fill: '#16EC06' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: RESTING HEART RATE Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('restingHeartRate')}</span>
            <span className="text-[10px] text-zinc-400 font-mono">{t('typicalRange')}: {baseline.rhrBaseline} {t('bpm')}</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rhr7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <ReferenceArea
                  y1={baseline.rhrBandLo}
                  y2={baseline.rhrBandHi}
                  fill="#FF3344"
                  fillOpacity={0.08}
                  strokeOpacity={0}
                />
                <ReferenceLine
                  y={baseline.rhrBaseline}
                  stroke="#FF3344"
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                />
                <Line type="monotone" dataKey="rhr" stroke="#FF3344" strokeWidth={2.5} dot={{ r: 3, fill: '#FF3344' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: RESPIRATORY RATE Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('respiratoryRate')}</span>
            <span className="text-[10px] text-[#7293B2] font-mono">{t('average')}: {avgResp}</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resp7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[12, 17]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="resp" stroke="#7293B2" strokeWidth={2.5} dot={{ r: 3, fill: '#7293B2' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
