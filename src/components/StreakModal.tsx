import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  Calendar,
  Activity,
  Award,
  Share2,
  Lock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import {
  streakEngine,
  type StreakSummary,
  type StreakMilestone,
  type DayStreakItem,
} from '../services/streakEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { hapticLight, hapticMedium } from '../utils/haptics';
import { BlazingFlame } from './motion/BlazingFlame';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({ isOpen, onClose }) => {
  const { isRtl } = useLanguage();
  const [streakData, setStreakData] = useState<StreakSummary>(() =>
    streakEngine.getStreakSummary()
  );
  const [selectedDay, setSelectedDay] = useState<DayStreakItem | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStreakData(streakEngine.getStreakSummary());
    }
    return streakEngine.subscribe(setStreakData);
  }, [isOpen]);

  const handleShare = () => {
    hapticMedium();
    const shareText = isRtl
      ? `سلسلة بيانات WHOOP: ${streakData.currentStreak} يوماً متتالياً من الرصد الفسيولوجي المباشر. معدل الانتظام: ${streakData.consistencyRate}% • إجمالي الدورات: ${streakData.totalDays}.`
      : `WHOOP Data Streak: ${streakData.currentStreak} consecutive days of continuous physiological telemetry. Consistency: ${streakData.consistencyRate}% • Total Cycles: ${streakData.totalDays}.`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel
        onClose={onClose}
        className="h-[92vh] max-h-[92vh] bg-gradient-to-b from-[#161B22] via-[#0F1318] to-[#080A0D] flex flex-col p-0 overflow-hidden border-t border-white/10 select-none"
      >
        {/* Top Header */}
        <div className="pt-6 px-6 pb-3 flex items-center justify-between flex-shrink-0 border-b border-white/5 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#FF8800]/15 flex items-center justify-center flex-shrink-0">
              <BlazingFlame size={20} showSparks={false} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-white font-condensed truncate">
                {isRtl ? 'سلسلة البيانات المتصلة' : 'DATA STREAK'}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono truncate">
                {isRtl ? 'رصد المؤشرات الحيوية اليومية' : 'Continuous Wear & Telemetry'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-colors active:scale-95 relative"
              title={isRtl ? 'مشاركة السلسلة' : 'Share Streak Summary'}
              aria-label="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedShare && (
                <span className="absolute -bottom-6 right-0 bg-white text-black text-[9px] font-bold font-sans px-1.5 py-0.5 rounded shadow">
                  {isRtl ? 'تم!' : 'Copied!'}
                </span>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 1. Official WHOOP Hero Metric Stage with Blazing Animated Flame */}
          <div className="p-6 rounded-[28px] bg-gradient-to-b from-[#181D26] via-[#12151A] to-[#0A0D11] border border-amber-500/30 relative overflow-hidden text-center shadow-[0_0_35px_rgba(255,136,0,0.18)]">
            {/* Shimmering gradient backdrop highlight */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/[0.06] to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" />

            {/* Active telemetry indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-zinc-300 mb-3 relative z-10">
              <span className="w-2 h-2 rounded-full bg-[#16EC06] animate-pulse" />
              <span>{isRtl ? 'مزامنة حيوية متصلة' : 'CONTINUOUS TELEMETRY SYNC'}</span>
            </div>

            {/* Blazing Flame Graphic & Giant Bold Metric */}
            <div className="flex flex-col items-center justify-center py-2 relative z-10">
              <div className="mb-2">
                <BlazingFlame size={54} showSparks={true} />
              </div>
              <span className="text-7xl font-black font-condensed tracking-tight text-white tabular-nums leading-none drop-shadow-[0_4px_16px_rgba(255,136,0,0.35)]">
                {streakData.currentStreak}
              </span>
              <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400 font-condensed mt-2">
                {isRtl
                  ? streakData.currentStreak === 1
                    ? 'يوم متتالي على المعصم'
                    : 'أيام متتالية على المعصم'
                  : streakData.currentStreak === 1
                  ? 'CONSECUTIVE DAY COLLECTED'
                  : 'CONSECUTIVE DAYS COLLECTED'}
              </span>
            </div>

            {/* Sub-text / Next milestone countdown */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-sans">
              <span className="text-zinc-500 text-[10px] whitespace-nowrap">
                {isRtl ? 'بدء الرصد:' : 'Started:'}{' '}
                <strong className="text-zinc-300 font-mono font-normal" dir="ltr">{streakData.streakStartDate}</strong>
              </span>

              {streakData.nextMilestone && (
                <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 whitespace-nowrap">
                  <span className="text-zinc-500">{isRtl ? 'المحطة القادمة:' : 'Next:'}</span>{' '}
                  <strong className="text-white font-bold">{isRtl ? `${streakData.nextMilestone.daysRemaining} أيام` : `${streakData.nextMilestone.daysRemaining}d`}</strong>
                </span>
              )}
            </div>
          </div>

          {/* 2. Bento Stats Matrix (4 Clinical Cards) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current Streak */}
            <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                {isRtl ? 'السلسلة الحالية' : 'CURRENT STREAK'}
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl font-black font-condensed text-white tabular-nums">
                  {streakData.currentStreak}
                </span>
                <span className="text-xs font-bold text-zinc-500 font-condensed uppercase">
                  {isRtl ? (streakData.currentStreak === 1 ? 'يوم' : streakData.currentStreak <= 10 ? 'أيام' : 'يوماً') : (streakData.currentStreak === 1 ? 'day' : 'days')}
                </span>
              </div>
            </div>

            {/* All-Time Best */}
            <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                {isRtl ? 'أطول سلسلة' : 'ALL-TIME BEST'}
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl font-black font-condensed text-white tabular-nums">
                  {streakData.longestStreak}
                </span>
                <span className="text-xs font-bold text-zinc-500 font-condensed uppercase">
                  {isRtl ? (streakData.longestStreak === 1 ? 'يوم' : streakData.longestStreak <= 10 ? 'أيام' : 'يوماً') : (streakData.longestStreak === 1 ? 'day' : 'days')}
                </span>
              </div>
            </div>

            {/* Total Cycles */}
            <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                {isRtl ? 'إجمالي الدورات' : 'TOTAL CYCLES'}
              </div>
              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-2xl font-black font-condensed text-white tabular-nums">
                  {streakData.totalDays}
                </span>
                <span className="text-xs font-bold text-zinc-500 font-condensed uppercase">
                  {isRtl ? 'دورة' : 'cycles'}
                </span>
              </div>
            </div>

            {/* Sync Consistency */}
            <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                {isRtl ? 'دقة المزامنة' : 'SYNC ACCURACY'}
              </div>
              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-2xl font-black font-condensed text-[#16EC06] tabular-nums">
                  {streakData.consistencyRate}%
                </span>
                <span className="text-xs font-bold text-zinc-500 font-condensed uppercase">
                  {isRtl ? 'شهري' : '30d'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. 30-Day Activity Heatmap Matrix */}
          <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-zinc-300 font-condensed">
                {isRtl ? 'سجل الـ 30 يوماً الماضية' : 'LAST 30 DAYS WEAR RECORD'}
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {streakData.last30Days.filter((d) => d.status === 'active').length} / 30{' '}
                {isRtl ? 'دورة مكتملة' : 'cycles'}
              </span>
            </div>

            {/* 30-Day Dots Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 pt-1">
              {streakData.last30Days.map((item) => {
                const isActive = item.status === 'active';
                const isToday = item.isToday;
                const isSelected = selectedDay?.date === item.date;

                return (
                  <button
                    key={item.date}
                    onClick={() => {
                      hapticLight();
                      setSelectedDay(item);
                    }}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-white bg-[#222731]'
                        : isActive
                        ? 'bg-[#181C23] border border-[#16EC06]/30 hover:border-[#16EC06]'
                        : isToday
                        ? 'bg-[#181C23] border border-white/30'
                        : 'bg-[#0E1015] border border-white/5 opacity-40'
                    }`}
                    title={`${item.date} - ${item.status}`}
                  >
                    <span className="text-[9px] font-bold text-zinc-400 uppercase font-condensed">
                      {isRtl ? item.dayLabelAr : item.dayLabel}
                    </span>
                    <span
                      className={`text-xs font-black font-condensed tabular-nums mt-0.5 ${
                        isActive
                          ? 'text-white'
                          : isToday
                          ? 'text-[#00A3FF]'
                          : 'text-zinc-600'
                      }`}
                    >
                      {item.dayNum}
                    </span>

                    {/* Small Status Dot */}
                    <div className="mt-1 flex items-center justify-center">
                      {isActive ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#16EC06]" />
                      ) : isToday ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00A3FF] animate-pulse" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Quick Inspector */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="p-3 rounded-xl bg-[#181D26] border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{selectedDay.date}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-condensed uppercase ${
                        selectedDay.status === 'active'
                          ? 'bg-[#16EC06]/15 text-[#16EC06]'
                          : selectedDay.isToday
                          ? 'bg-[#00A3FF]/15 text-[#00A3FF]'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {selectedDay.status === 'active'
                        ? isRtl
                          ? 'دورة فسيولوجية مسجلة'
                          : 'Cycle Synced'
                        : selectedDay.isToday
                        ? isRtl
                          ? 'الدورة الحالية'
                          : 'Active Cycle'
                        : isRtl
                        ? 'لم تُسجل بيانات'
                        : 'No Data'}
                    </span>
                  </div>

                  {selectedDay.strain !== undefined && (
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-[#00A3FF]">Strain {selectedDay.strain.toFixed(1)}</span>
                      {selectedDay.recovery !== undefined && (
                        <span className="text-[#16EC06]">Rec {selectedDay.recovery}%</span>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. Cycle Milestones (Official WHOOP Benchmarks) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-zinc-300 font-condensed">
                {isRtl ? 'محطات الدورات الفسيولوجية' : 'CYCLE MILESTONES'}
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {streakData.milestones.filter((m) => m.unlocked).length} / {streakData.milestones.length}{' '}
                {isRtl ? 'مكتمل' : 'achieved'}
              </span>
            </div>

            <div className="space-y-2">
              {streakData.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    m.unlocked
                      ? 'bg-[#12151A] border-white/10'
                      : 'bg-[#0E1015] border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                        m.unlocked
                          ? 'bg-[#16EC06]/15 border-[#16EC06]/30 text-[#16EC06]'
                          : 'bg-zinc-800/40 border-white/5 text-zinc-500'
                      }`}
                    >
                      {m.unlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16EC06]" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-black uppercase tracking-wide text-white font-condensed">
                        {isRtl ? m.titleAr : m.title}
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-tight mt-0.5">
                        {isRtl ? m.descAr : m.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 min-w-[70px]">
                    {m.unlocked ? (
                      <span className="text-[10px] font-black font-condensed uppercase tracking-wider text-[#16EC06]">
                        {isRtl ? 'مكتمل' : 'COMPLETE'}
                      </span>
                    ) : (
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-zinc-400">
                          {isRtl ? `باقي ${m.daysRemaining}ي` : `${m.daysRemaining}d left`}
                        </span>
                        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${Math.round(m.progress * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
