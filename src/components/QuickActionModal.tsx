import React from 'react';
import { Dumbbell, Moon, Timer, X, BookOpen, Clock, Activity, Zap, Wind, Vibrate } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { hapticMedium, hapticLight } from '../utils/haptics';

export type QuickActionType =
  | 'strength'
  | 'activity'
  | 'journal'
  | 'sleep_planner'
  | 'alarm'
  | 'sleep'
  | 'recovery_test'
  | 'breathe';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: QuickActionType) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const { t, isRtl } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-[430px] p-5 rounded-[28px] bg-[#16191E] border border-white/10 shadow-2xl space-y-3 animate-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            {isRtl ? 'الإجراءات السريعة والتمارين' : 'Quick Actions & Workouts'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-[#222730] text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 font-condensed">
          {/* 1. Strength Trainer (Muscular Load) */}
          <button
            onClick={() => {
              onClose();
              onSelectAction('strength');
            }}
            className="w-full p-3 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0093E9]/20 text-[#0093E9] flex items-center justify-center border border-[#0093E9]/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="text-sm font-black uppercase text-white">
                  {isRtl ? 'مدرب القوة والجهد العضلي' : 'Strength Trainer & Muscular Load'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {isRtl ? 'تسجيل التكرارات والأوزان والجهد العضلي' : 'Log Reps, Weight & Combined Muscular Strain'}
                </div>
              </div>
            </div>
          </button>

          {/* 2. Cardio Workout & HIIT Strain Coach */}
          <button
            onClick={() => {
              onClose();
              onSelectAction('activity');
            }}
            className="w-full p-3 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center border border-[#00F0FF]/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="text-sm font-black uppercase text-white">
                  {isRtl ? 'تمرين الكارديو ومدرب الجهد' : 'Cardio Workout & Strain Coach'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {isRtl ? 'نبض مباشر، 5 نطاقات قلبية ومستهدف الجهد' : 'Live Heart Rate, 5 HR Zones & Target Bracket'}
                </div>
              </div>
            </div>
          </button>

          {/* 3. Daily Journal */}
          <button
            onClick={() => {
              onClose();
              onSelectAction('journal');
            }}
            className="w-full p-3 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#16EC06]/20 text-[#16EC06] flex items-center justify-center border border-[#16EC06]/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="text-sm font-black uppercase text-white">
                  {isRtl ? 'سجل WHOOP اليومي' : 'WHOOP Daily Journal'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {isRtl ? 'تسجيل 15+ سلوك يومي وتأثيرها على التعافي' : 'Log 15+ Daily Behaviors & Recovery Impact'}
                </div>
              </div>
            </div>
          </button>

          {/* 4. Sleep Planner & Smart Alarm */}
          <button
            onClick={() => {
              hapticMedium();
              onClose();
              onSelectAction('sleep_planner');
            }}
            className="w-full p-3 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7395B7]/20 text-[#7395B7] flex items-center justify-center border border-[#7395B7]/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="text-sm font-black uppercase text-white">
                  {isRtl ? 'مخطط النوم والمنبه الذكي' : 'Sleep Planner & Smart Alarm'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {isRtl ? 'حاسبة وقت النوم والاستيقاظ في النوم الخفيف' : 'Target Bedtime Calculator & Light Sleep Wake'}
                </div>
              </div>
            </div>
          </button>

          {/* 4b. Physical Haptic Alarm */}
          <button
            onClick={() => {
              hapticMedium();
              onClose();
              onSelectAction('alarm');
            }}
            className="w-full p-3 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0093E9]/20 text-[#0093E9] flex items-center justify-center border border-[#0093E9]/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <Vibrate className="w-5 h-5" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="text-sm font-black uppercase text-white">
                  {isRtl ? 'منبه اهتزاز السوار الصامت' : 'Silent Strap Haptic Alarm'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {isRtl ? 'وقت محدد، هدف النوم، أو التعافي الأخضر' : 'Exact Time, Sleep Need %, or Recovery Target'}
                </div>
              </div>
            </div>
          </button>

          {/* 5. OLED Night Lock */}
          <button
            onClick={() => {
              onClose();
              onSelectAction('sleep');
            }}
            className="w-full p-3 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7293B2]/20 text-[#7293B2] flex items-center justify-center border border-[#7293B2]/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="text-sm font-black uppercase text-white">
                  {isRtl ? 'قفل النوم الليلي OLED الشديد السواد' : 'OLED Pitch-Black Sleep Lock'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {isRtl ? 'شاشة مانعة للإغلاق لتتبع النوم الليلي بدقة' : 'WakeLock Screen for Nighttime Tracking'}
                </div>
              </div>
            </div>
          </button>

          {/* 6. Measure Morning Recovery */}
          <button
            onClick={() => {
              onClose();
              onSelectAction('recovery_test');
            }}
            className="w-full p-3 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFDE00]/20 text-[#FFDE00] flex items-center justify-center border border-[#FFDE00]/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="text-sm font-black uppercase text-white">
                  {isRtl ? 'قياس تعافي الصباح' : 'Measure Morning Recovery'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {isRtl ? 'معايرة تقلب نبضات القلب (HRV) لـ 3 دقائق' : '3-Minute Resonant Paced HRV Calibration'}
                </div>
              </div>
            </div>
          </button>

          {/* 7. HRV Resonance Breathe Pacer */}
          <button
            onClick={() => {
              onClose();
              onSelectAction('breathe');
            }}
            className="w-full p-3 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center border border-[#00F0FF]/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <Wind className="w-5 h-5" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="text-sm font-black uppercase text-white">
                  {isRtl ? 'جلسة تنفس الرنين (HRV Coherence)' : 'HRV Resonance Breathe Pacer'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {isRtl ? 'تنفس هادئ بتردد 0.1 هرتز لخفض التوتر الفوري' : '0.1 Hz Guided Breathing to Down-Regulate Stress'}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
