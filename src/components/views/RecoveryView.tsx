import React from 'react';
import type { LiveMetrics, UserSettings, DayHistoryRecord } from '../../types/whoop';
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
} from 'recharts';

interface RecoveryViewProps {
  metrics: LiveMetrics;
  settings: UserSettings;
  daysHistory?: DayHistoryRecord[];
  onOpenRecoveryTest: () => void;
}

export const getRecoveryColor = (score: number | null) => {
  if (score === null) return '#52525B';
  if (score >= 67) return '#16EC06';
  if (score >= 34) return '#FFDE00';
  return '#FF0026';
};

import { useLanguage } from '../../i18n/LanguageContext';

export const RecoveryView: React.FC<RecoveryViewProps> = ({
  metrics,
  settings,
  daysHistory,
  onOpenRecoveryTest,
}) => {
  const { t, isRtl, dayNames } = useLanguage();
  const recoveryScore = metrics.recoveryScore;
  const recoveryColor = getRecoveryColor(recoveryScore);

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
      hrv: d.offset === 0 ? metrics.currentHrv : d.hrv,
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
          <button className="flex items-center gap-1 text-[#00F0FF] hover:underline">
            <Share2 className="w-3.5 h-3.5" />
            <span>{isRtl ? 'مشاركة' : 'SHARE'}</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1E2522"
              strokeWidth={stroke}
              fill="transparent"
            />
            {recoveryScore !== null && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={recoveryColor}
                strokeWidth={stroke}
                fill="transparent"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-6xl font-black font-condensed tracking-tight tabular-nums transition-colors"
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
          </div>
        </div>

        {/* Dynamic Insight Box */}
        <div className="mt-5 w-full p-3.5 rounded-2xl bg-[#0D1612] border border-[#16EC06]/20 text-xs text-zinc-300 leading-relaxed text-start flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#16EC06] flex-shrink-0 mt-0.5" />
          <p>
            {recoveryScore !== null ? (
              isRtl ? (
                <>
                  جاهزية جهازك العصبي المستقل محسوبة من بيانات سوار WHOOP 4.0 الحقيقية. نبض الراحة{' '}
                  {metrics.restingHr ?? '--'} ن/د وتقلب النبض HRV بمقدار {metrics.currentHrv ?? '--'} ms يوضحان قدرتك البدنية والذهنية اليوم.
                </>
              ) : (
                <>
                  Your autonomic nervous system readiness is calculated from real WHOOP 4.0 telemetry. Resting heart rate of{' '}
                  {metrics.restingHr ?? '--'} bpm and HRV of {metrics.currentHrv ?? '--'} ms indicate your current autonomic capacity.
                </>
              )
            ) : (
              isRtl
                ? 'اربط سوارك الفعلي WHOOP 4.0 لبدء قياس نبض القلب وحساب مؤشر التعافي وتقلب النبض الفعلي.'
                : 'Connect your physical WHOOP 4.0 strap to record live heart rate and calculate your daily Recovery Score and HRV metrics.'
            )}
          </p>
        </div>

        {/* 3-Min HRV Test Launcher */}
        <button
          onClick={onOpenRecoveryTest}
          className="mt-3 w-full py-3 px-4 rounded-xl bg-[#0B0D10] hover:bg-[#16191E] border border-white/10 text-white font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Timer className="w-4 h-4 text-[#16EC06]" />
          <span>{isRtl ? 'قياس التعافي الصباحي (اختبار HRV لمدة 3 دقائق)' : 'Measure Morning Recovery (3-Min HRV Test)'}</span>
        </button>
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
              {metrics.currentHrv ?? settings.hrvBaseline} ms
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Heart className="w-3.5 h-3.5 text-zinc-300" />
              <span className="uppercase">{t('rhr')}</span>
            </div>
            <span className="text-white font-mono font-bold">
              {metrics.restingHr ?? settings.restingHrBaseline} {t('bpm')}
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
            <span className="text-[10px] text-[#16EC06] font-mono">{t('baseline')}: {settings.hrvBaseline} ms</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hrv7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[40, 90]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="hrv" stroke="#16EC06" strokeWidth={2.5} dot={{ r: 3, fill: '#16EC06' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: RESTING HEART RATE Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('restingHeartRate')}</span>
            <span className="text-[10px] text-zinc-400 font-mono">{t('typicalRange')}: {settings.restingHrBaseline} {t('bpm')}</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rhr7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[45, 65]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="rhr" stroke="#FF0026" strokeWidth={2.5} dot={{ r: 3, fill: '#FF0026' }} />
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
