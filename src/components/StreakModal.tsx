import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Trophy,
  Calendar,
  Zap,
  Award,
  Share2,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  PartyPopper,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import { streakEngine, type StreakSummary, type StreakMilestone, type DayStreakItem } from '../services/streakEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { hapticMedium, hapticSuccess, hapticLight } from '../utils/haptics';

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

  const triggerConfetti = () => {
    hapticSuccess();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6A00', '#FFB700', '#16EC06', '#00A3FF', '#FFFFFF'],
      });
    } catch {}
  };

  const handleShare = () => {
    hapticMedium();
    const shareText = isRtl
      ? `🔥 التزامي مع سوار WHOOP 4.0: ${streakData.currentStreak} يوم متواصل! نسبة الانتظام: ${streakData.consistencyRate}% | إجمالي الأيام: ${streakData.totalDays} يوم.`
      : `🔥 My WHOOP 4.0 Streak: ${streakData.currentStreak} consecutive days! Consistency: ${streakData.consistencyRate}% | Total days tracked: ${streakData.totalDays}.`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      triggerConfetti();
      setTimeout(() => setCopiedShare(false), 3000);
    }
  };

  const getTierColors = (tier: StreakMilestone['tier']) => {
    switch (tier) {
      case 'diamond':
        return {
          border: 'border-cyan-400/40 bg-cyan-950/20 text-cyan-300',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
          glow: 'from-cyan-500/20 to-blue-500/20',
        };
      case 'platinum':
        return {
          border: 'border-indigo-400/40 bg-indigo-950/20 text-indigo-300',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
          glow: 'from-indigo-500/20 to-purple-500/20',
        };
      case 'gold':
        return {
          border: 'border-amber-400/40 bg-amber-950/20 text-amber-300',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
          glow: 'from-amber-500/20 to-orange-500/20',
        };
      case 'silver':
        return {
          border: 'border-slate-300/40 bg-slate-900/30 text-slate-200',
          badge: 'bg-slate-400/20 text-slate-200 border-slate-300/30',
          glow: 'from-slate-400/20 to-zinc-500/20',
        };
      default:
        return {
          border: 'border-amber-700/40 bg-amber-950/20 text-amber-400',
          badge: 'bg-amber-700/20 text-amber-400 border-amber-600/30',
          glow: 'from-amber-700/20 to-yellow-800/20',
        };
    }
  };

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel
        onClose={onClose}
        className="h-[92vh] max-h-[92vh] bg-gradient-to-b from-[#181C23] via-[#0E1217] to-[#07090C] flex flex-col p-0 overflow-hidden border-t border-white/10 select-none"
      >
        {/* Top Header */}
        <div className="pt-5 px-6 pb-3 flex items-center justify-between flex-shrink-0 border-b border-white/5 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6A00]/15 border border-[#FF6A00]/30 flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FF7A00] fill-[#FF7A00] animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-white font-condensed">
                {isRtl ? 'مسيرة الالتزام والستريك' : 'WHOOP WEAR STREAK'}
              </div>
              <div className="text-[10px] text-zinc-400 font-sans">
                {isRtl ? 'انضباط رصد المؤشرات الحيوية' : 'Biometric Tracking Consistency'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="py-1.5 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-condensed font-bold flex items-center gap-1.5 active:scale-95 transition-all"
              title="Share Streak"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? (isRtl ? 'تم النسخ!' : 'Copied!') : isRtl ? 'مشاركة' : 'Share'}</span>
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* HERO ANIMATED CIRCULAR STREAK STAGE */}
          <div className="relative py-6 px-4 rounded-3xl bg-gradient-to-b from-[#1E242E]/70 via-[#141920]/60 to-[#0B0D11] border border-white/10 flex flex-col items-center justify-center text-center overflow-hidden shadow-2xl">
            {/* Ambient Radial Flame Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-[#FF5100]/25 via-[#FF8800]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Circular Progress Ring */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="transparent"
                  stroke="#262B34"
                  strokeWidth="8"
                  strokeLinecap="round"
                />

                {/* Animated Glowing Foreground Stroke */}
                <motion.circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="transparent"
                  stroke="url(#streakFlameGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={427}
                  initial={{ strokeDashoffset: 427 }}
                  animate={{
                    strokeDashoffset:
                      427 -
                      (427 *
                        Math.min(
                          100,
                          streakData.nextMilestone
                            ? Math.round(
                                (streakData.currentStreak / streakData.nextMilestone.days) * 100
                              )
                            : 100
                        )) /
                        100,
                  }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                />

                <defs>
                  <linearGradient id="streakFlameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF3B00" />
                    <stop offset="50%" stopColor="#FF8800" />
                    <stop offset="100%" stopColor="#FFC800" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-9 h-9 rounded-full bg-[#FF6A00]/20 border border-[#FF6A00]/40 flex items-center justify-center mb-1 shadow-lg shadow-[#FF6A00]/20"
                >
                  <Flame className="w-5 h-5 text-[#FF7A00] fill-[#FF7A00] animate-bounce" />
                </motion.div>

                <div className="flex items-baseline leading-none">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-5xl font-black font-condensed tracking-tight text-white tabular-nums drop-shadow-md"
                  >
                    {streakData.currentStreak}
                  </motion.span>
                </div>

                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#FF9E00] font-condensed mt-1">
                  {isRtl ? 'أيام متتالية' : streakData.currentStreak === 1 ? 'DAY STREAK' : 'DAYS STREAK'}
                </span>
              </div>
            </div>

            {/* Motivation Badge & Celebration Pill */}
            <div className="mt-4 flex flex-col items-center gap-2 z-10">
              <div className="px-3.5 py-1.5 rounded-full bg-[#FF7A00]/10 border border-[#FF7A00]/25 text-xs font-condensed font-bold text-[#FFB700] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#FFB700]" />
                <span>
                  {streakData.nextMilestone
                    ? isRtl
                      ? `باقي ${streakData.nextMilestone.daysRemaining} يوم للوصول إلى: ${streakData.nextMilestone.titleAr}`
                      : `${streakData.nextMilestone.daysRemaining} days away from ${streakData.nextMilestone.title}`
                    : isRtl
                    ? 'أنت في أعلى مستويات الالتزام الفسيولوجي!'
                    : 'You reached the ultimate WHOOP mastery!'}
                </span>
              </div>

              <button
                onClick={triggerConfetti}
                className="text-[11px] font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all mt-1"
              >
                <PartyPopper className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span>{isRtl ? 'احتفل بإنجازك اليوم 🎉' : 'Celebrate Streak 🎉'}</span>
              </button>
            </div>
          </div>

          {/* BENTO STATS GRID (4 CARDS) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Current Streak */}
            <div className="p-3.5 rounded-2xl bg-[#12151B] border border-white/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-black uppercase tracking-wider font-condensed">
                  {isRtl ? 'الالتزام الحالي' : 'CURRENT STREAK'}
                </span>
                <Flame className="w-4 h-4 text-[#FF7A00]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-condensed text-white tabular-nums">
                  {streakData.currentStreak}
                </span>
                <span className="text-[11px] font-bold text-zinc-500 uppercase font-condensed">
                  {isRtl ? 'أيام' : 'days'}
                </span>
              </div>
            </div>

            {/* Card 2: Longest Streak */}
            <div className="p-3.5 rounded-2xl bg-[#12151B] border border-white/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-black uppercase tracking-wider font-condensed">
                  {isRtl ? 'الرقم القياسي' : 'BEST RECORD'}
                </span>
                <Trophy className="w-4 h-4 text-[#FFD700]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-condensed text-white tabular-nums">
                  {streakData.longestStreak}
                </span>
                <span className="text-[11px] font-bold text-zinc-500 uppercase font-condensed">
                  {isRtl ? 'أيام' : 'days'}
                </span>
              </div>
            </div>

            {/* Card 3: Total Tracked Days */}
            <div className="p-3.5 rounded-2xl bg-[#12151B] border border-white/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-black uppercase tracking-wider font-condensed">
                  {isRtl ? 'إجمالي الأيام' : 'TOTAL DAYS'}
                </span>
                <Calendar className="w-4 h-4 text-[#00A3FF]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-condensed text-white tabular-nums">
                  {streakData.totalDays}
                </span>
                <span className="text-[11px] font-bold text-zinc-500 uppercase font-condensed">
                  {isRtl ? 'يوم' : 'days'}
                </span>
              </div>
            </div>

            {/* Card 4: 30-Day Consistency */}
            <div className="p-3.5 rounded-2xl bg-[#12151B] border border-white/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-black uppercase tracking-wider font-condensed">
                  {isRtl ? 'نسبة الانتظام (30يوم)' : '30D CONSISTENCY'}
                </span>
                <TrendingUp className="w-4 h-4 text-[#16EC06]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-condensed text-[#16EC06] tabular-nums">
                  {streakData.consistencyRate}%
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase font-condensed">
                  {streakData.consistencyRate >= 80 ? 'EXCELLENT' : 'TRACKING'}
                </span>
              </div>
            </div>
          </div>

          {/* 30-DAY ACTIVITY HEATMAP MATRIX */}
          <div className="p-4 rounded-2xl bg-[#12151B] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                  {isRtl ? 'مصفوفة التتبع الحيوية (آخر 30 يوماً)' : '30-DAY WEAR MATRIX'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {streakData.last30Days.filter((d) => d.status === 'active').length} / 30 {isRtl ? 'يوم نشط' : 'active'}
              </span>
            </div>

            {/* Matrix Grid: 6 columns x 5 rows */}
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
                    className={`relative p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-white scale-105 bg-[#252C38]'
                        : isActive
                        ? 'bg-[#16EC06]/10 border border-[#16EC06]/30 hover:bg-[#16EC06]/20'
                        : isToday
                        ? 'bg-[#FF7A00]/15 border border-[#FF7A00]/40'
                        : 'bg-[#181C23] border border-white/5 opacity-50'
                    }`}
                    title={`${item.date} - ${item.status}`}
                  >
                    <span className="text-[9px] font-bold text-zinc-400 uppercase font-condensed">
                      {isRtl ? item.dayLabelAr : item.dayLabel}
                    </span>
                    <span
                      className={`text-xs font-black font-condensed tabular-nums mt-0.5 ${
                        isActive
                          ? 'text-[#16EC06]'
                          : isToday
                          ? 'text-[#FF9E00]'
                          : 'text-zinc-500'
                      }`}
                    >
                      {item.dayNum}
                    </span>

                    {/* Indicator Dot */}
                    <div className="mt-1 flex items-center justify-center">
                      {isActive ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#16EC06] shadow-sm shadow-[#16EC06]" />
                      ) : isToday ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-pulse shadow-sm shadow-[#FF7A00]" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
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
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 rounded-xl bg-[#181D26] border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{selectedDay.date}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-condensed uppercase ${
                        selectedDay.status === 'active'
                          ? 'bg-[#16EC06]/20 text-[#16EC06]'
                          : selectedDay.isToday
                          ? 'bg-[#FF7A00]/20 text-[#FF7A00]'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {selectedDay.status === 'active'
                        ? isRtl
                          ? 'تم رصد اليوم بنجاح'
                          : 'Tracked with WHOOP'
                        : selectedDay.isToday
                        ? isRtl
                          ? 'اليوم الحالي (قيد التتبع)'
                          : 'Today (In Progress)'
                        : isRtl
                        ? 'لم يتم تسجيل بيانات'
                        : 'No Data Recorded'}
                    </span>
                  </div>

                  {selectedDay.strain !== undefined && (
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-[#00A3FF]">Strain: {selectedDay.strain.toFixed(1)}</span>
                      {selectedDay.recovery !== undefined && (
                        <span className="text-[#16EC06]">Rec: {selectedDay.recovery}%</span>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* WHOOP MILESTONES & CLUB BADGES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#FFD700]" />
                <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                  {isRtl ? 'أندية الإنجاز وأوسمة الاستمرارية' : 'WHOOP MILESTONES & CLUBS'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {streakData.milestones.filter((m) => m.unlocked).length} / {streakData.milestones.length}{' '}
                {isRtl ? 'مفتوح' : 'unlocked'}
              </span>
            </div>

            <div className="space-y-2.5">
              {streakData.milestones.map((m) => {
                const style = getTierColors(m.tier);

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      m.unlocked
                        ? `${style.border} shadow-lg shadow-black/40`
                        : 'bg-[#12151B] border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Badge Icon */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                          m.unlocked
                            ? style.badge
                            : 'bg-zinc-800/60 border-zinc-700/40 text-zinc-500'
                        }`}
                      >
                        {m.unlocked ? (
                          <CheckCircle2 className="w-5 h-5 text-[#16EC06]" />
                        ) : (
                          <Lock className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wide text-white font-condensed">
                            {isRtl ? m.titleAr : m.title}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 font-bold">
                            ({m.days} {isRtl ? 'يوم' : 'Days'})
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-sans leading-tight mt-0.5">
                          {isRtl ? m.descAr : m.desc}
                        </p>
                      </div>
                    </div>

                    {/* Progress / Status */}
                    <div className="flex flex-col items-end flex-shrink-0 min-w-[70px]">
                      {m.unlocked ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#16EC06]/15 border border-[#16EC06]/30 text-[#16EC06] text-[10px] font-black font-condensed uppercase tracking-wider">
                          {isRtl ? 'تم الإنجاز' : 'UNLOCKED'}
                        </span>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-[#FF9E00] font-bold">
                            {isRtl ? `باقي ${m.daysRemaining}ي` : `${m.daysRemaining}d left`}
                          </span>
                          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-gradient-to-r from-[#FF6A00] to-[#FFB700] rounded-full transition-all"
                              style={{ width: `${Math.round(m.progress * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SHARE BRANDED STREAK STORY BUTTON */}
          <div className="pt-2">
            <button
              onClick={handleShare}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF6A00] via-[#FF5100] to-[#FF8800] hover:brightness-110 text-white font-condensed font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-[#FF5100]/25 active:scale-98 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>
                {copiedShare
                  ? isRtl
                    ? '✓ تم نسخ إحصائيات الستريك بنجاح!'
                    : '✓ STREAK STATS COPIED TO CLIPBOARD!'
                  : isRtl
                  ? 'مشاركة إنجاز الستريك على التواصل الاجتماعي'
                  : 'SHARE WHOOP STREAK TO SOCIALS'}
              </span>
            </button>
          </div>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
