import React, { useState, useId } from 'react';
import {
  Moon,
  Clock,
  X,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Watch,
  Info,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { sleepEngine } from '../services/sleepEngine';

interface AdjustSleepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (bedtime: string, wakeTime: string) => void;
  onResetComplete?: () => void;
}

interface SleepPreset {
  label: string;
  labelAr: string;
  hours: number;
  bed: string;
  wake: string;
}

const PRESETS: SleepPreset[] = [
  { label: '9.0h (10:30 PM - 07:30 AM)', labelAr: '9.0 ساعات (10:30 م - 07:30 ص)', hours: 9.0, bed: '22:30', wake: '07:30' },
  { label: '9.0h Shift (05:00 AM - 02:00 PM)', labelAr: '9.0 ساعات وردية (05:00 ص - 02:00 م)', hours: 9.0, bed: '05:00', wake: '14:00' },
  { label: '8.5h (11:00 PM - 07:30 AM)', labelAr: '8.5 ساعات (11:00 م - 07:30 ص)', hours: 8.5, bed: '23:00', wake: '07:30' },
  { label: '8.0h (11:00 PM - 07:00 AM)', labelAr: '8.0 ساعات (11:00 م - 07:00 ص)', hours: 8.0, bed: '23:00', wake: '07:00' },
  { label: '7.5h (11:30 PM - 07:00 AM)', labelAr: '7.5 ساعات (11:30 م - 07:00 ص)', hours: 7.5, bed: '23:30', wake: '07:00' },
  { label: '9.5h (10:00 PM - 07:30 AM)', labelAr: '9.5 ساعات (10:00 م - 07:30 ص)', hours: 9.5, bed: '22:00', wake: '07:30' },
];

export const AdjustSleepModal: React.FC<AdjustSleepModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onResetComplete,
}) => {
  const { isRtl } = useLanguage();
  const [bedtime, setBedtime] = useState('22:30'); // 10:30 PM
  const [wakeTime, setWakeTime] = useState('07:30'); // 07:30 AM
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const bedtimeId = useId();
  const wakeTimeId = useId();

  if (!isOpen) return null;

  // Calculate dynamic duration between bedtime and wakeTime
  const calculateDuration = (bStr: string, wStr: string) => {
    const [bH, bM] = bStr.split(':').map((s) => parseInt(s, 10));
    const [wH, wM] = wStr.split(':').map((s) => parseInt(s, 10));
    if (isNaN(bH) || isNaN(bM) || isNaN(wH) || isNaN(wM)) return { totalMinutes: 0, hours: 0, minutes: 0 };

    let startTotal = bH * 60 + bM;
    let endTotal = wH * 60 + wM;

    if (endTotal <= startTotal) {
      endTotal += 24 * 60; // Spans past midnight
    }

    const diff = endTotal - startTotal;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return { totalMinutes: diff, hours: h, minutes: m };
  };

  const duration = calculateDuration(bedtime, wakeTime);
  const decimalHours = Number((duration.totalMinutes / 60).toFixed(2));
  const expectedAsleepHours = Number((decimalHours * 0.92).toFixed(1));

  const handleApplyPreset = (preset: SleepPreset) => {
    setBedtime(preset.bed);
    setWakeTime(preset.wake);
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    try {
      if (onConfirm) {
        onConfirm(bedtime, wakeTime);
      } else {
        sleepEngine.recordManualSleepWindow({
          bedtime,
          wakeTime,
        });
      }
      onClose();
    } catch (e) {
      console.error('[AdjustSleepModal] Failed to record sleep window:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSession = () => {
    sleepEngine.resetSleepSession();
    setResetSuccess(true);
    if (onResetComplete) onResetComplete();
    setTimeout(() => {
      setResetSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 rounded-t-[32px] sm:rounded-3xl bg-[#0E131C] border-t sm:border border-[#A855F7]/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] space-y-4 max-h-[85vh] overflow-y-auto overscroll-contain"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto sm:hidden mb-2 -mt-1 cursor-grab" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#A855F7]/20 border border-[#A855F7]/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Moon className="w-5 h-5 text-[#C084FC]" />
            </div>
            <div>
              <h3 className="text-base font-black font-condensed uppercase tracking-wider text-white">
                {isRtl ? 'تسجيل وتعديل أوقات النوم الفعلي' : 'Adjust Sleep Window'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                {isRtl
                  ? 'سجل مواعيد نومك بدقة (Xiaomi Band 10 / Apple Watch / إدخال يدوي)'
                  : 'Record exact bedtime & wake time from secondary reference or manual input'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center active:scale-95 transition-all"
            aria-label={isRtl ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Secondary Tracker Note */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-[#A855F7]/15 via-[#38BDF8]/10 to-transparent border border-[#A855F7]/25 flex items-start gap-2.5">
          <Watch className="w-4 h-4 text-[#C084FC] flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-zinc-300 leading-relaxed font-sans">
            {isRtl ? (
              <span>
                إذا كنت ترتدي سواراً أو ساعة أخرى (مثل <b>Xiaomi Band 10</b> أو <b>Apple Watch</b>)، يمكنك نقل وقت النوم والاستيقاظ المسجل هناك بدقة لتوليد مراحل النوم (عميق، REM، خفيف) بدقة 100%.
              </span>
            ) : (
              <span>
                If you track sleep with a secondary wearable (e.g. <b>Xiaomi Band 10</b> or <b>Apple Watch</b>), enter those exact times here to generate clinical ultradian sleep stages.
              </span>
            )}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
            {isRtl ? 'فترات نوم سريعة:' : 'Quick Presets:'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const isActive = bedtime === p.bed && wakeTime === p.wake;
              return (
                <button
                  key={p.label}
                  onClick={() => handleApplyPreset(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-condensed font-bold transition-all border active:scale-95 ${
                    isActive
                      ? 'bg-[#A855F7] text-white border-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                      : 'bg-white/5 text-zinc-300 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {isRtl ? p.labelAr : p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Pickers (Bedtime & Wake time) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Bedtime */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <label htmlFor={bedtimeId} className="flex items-center gap-1.5 text-xs font-black uppercase text-zinc-300 font-condensed">
              <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>{isRtl ? 'وقت الخلود للنوم (Bedtime):' : 'Bedtime:'}</span>
            </label>
            <input
              id={bedtimeId}
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full bg-[#161B26] border border-white/15 rounded-xl px-3 py-2 text-base font-mono text-white text-center focus:outline-none focus:border-[#A855F7] transition-colors"
            />
          </div>

          {/* Wake time */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <label htmlFor={wakeTimeId} className="flex items-center gap-1.5 text-xs font-black uppercase text-zinc-300 font-condensed">
              <Clock className="w-3.5 h-3.5 text-[#FFDE00]" />
              <span>{isRtl ? 'وقت الاستيقاظ (Wake Time):' : 'Wake Time:'}</span>
            </label>
            <input
              id={wakeTimeId}
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full bg-[#161B26] border border-white/15 rounded-xl px-3 py-2 text-base font-mono text-white text-center focus:outline-none focus:border-[#A855F7] transition-colors"
            />
          </div>
        </div>

        {/* Dynamic Calculated Duration Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#141A26] to-[#121620] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-zinc-400 font-condensed">
              {isRtl ? 'إجمالي الوقت بالسرير (In Bed):' : 'Total Time in Bed:'}
            </span>
            <span className="text-lg font-black font-condensed text-white">
              {isRtl ? `${duration.hours} س ${duration.minutes} د (${decimalHours}h)` : `${duration.hours}h ${duration.minutes}m (${decimalHours}h)`}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-sans text-zinc-400 border-t border-white/5 pt-2">
            <span>{isRtl ? 'النوم الفعلي المتوقع (Asleep ~92% كفاءة):' : 'Expected Asleep Duration (~92% eff):'}</span>
            <span className="font-bold text-[#16EC06]">
              {expectedAsleepHours} {isRtl ? 'ساعات' : 'hours'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || decimalHours <= 0}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#A855F7] via-[#9333EA] to-[#38BDF8] text-white font-black text-sm font-condensed uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:brightness-110 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span>
              {isRtl
                ? `اعتماد وحساب بيانات النوم (${decimalHours} ساعات)`
                : `Confirm & Calculate Sleep (${decimalHours} Hours)`}
            </span>
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleResetSession}
              className="text-[11px] font-condensed text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
              title={isRtl ? 'تصفير بيانات نوم اليوم للبدء من جديد' : 'Clear today sleep session'}
            >
              <RotateCcw className="w-3 h-3 text-red-400" />
              <span>{resetSuccess ? (isRtl ? 'تم التصفير بنجاح ✓' : 'Reset ✓') : (isRtl ? 'تصفير بيانات اليوم (Reset)' : 'Reset Sleep')}</span>
            </button>

            <button
              onClick={onClose}
              className="text-[11px] font-condensed text-zinc-400 hover:text-white px-2 py-1"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
