import React from 'react';
import type { LiveMetrics, UserSettings, DeviceMetadata } from '../types/whoop';
import { WhoopLogo } from './WhoopLogo';
import { Sparkles, X, Sun, Heart, Activity, Flame, Battery } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface DailyOutlookModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  settings: UserSettings;
  metadata: DeviceMetadata;
}

export const DailyOutlookModal: React.FC<DailyOutlookModalProps> = ({
  isOpen,
  onClose,
  metrics,
  settings,
  metadata,
}) => {
  const { t, isRtl } = useLanguage();
  if (!isOpen) return null;

  const recovery = metrics.recoveryScore;
  const isGreen = metrics.recoveryCategory === 'green';
  const isYellow = metrics.recoveryCategory === 'yellow';
  const isRed = metrics.recoveryCategory === 'red';

  let outlookText = '';
  let recommendation = '';

  if (recovery === null) {
    outlookText = isRtl
      ? 'سوار WHOOP 4.0 يرسل بيانات الحساسات الحية بشكل نشط. مع تسجيل المزيد من نبضات الراحة وتقلب ضربات القلب، سيتم احتساب نسبة الاستشفاء والجهد المستهدف بدقة.'
      : 'Your WHOOP 4.0 strap is actively streaming sensor data. As more resting intervals and heart rate variability beats are recorded today, your autonomic baseline will establish a precise Recovery and Day Strain target.';
    recommendation = isRtl
      ? 'حافظ على تثبيت السوار بإحكام على معصمك (عرض إصبع واحد فوق عظمة المعصم) لضمان دقة القراءات الضوئية.'
      : 'Keep the strap snug on your wrist (one finger width above your wrist bone) to ensure clean optical PPG telemetry.';
  } else if (isGreen) {
    outlookText = isRtl
      ? `مع نسبة استشفاء ${recovery}%، يهيمن الجهاز العصبي اللاودي (Parasympathetic) على نشاطك. معدل تقلب نبضات القلب مرتفع عند ${metrics.currentHrv} مللي ثانية، مما يدل على جاهزية قلبية مثالية لتحمل أعلى مستويات الإجهاد.`
      : `With a ${recovery}% Recovery, your autonomic nervous system is dominated by parasympathetic tone. Your HRV is elevated at ${metrics.currentHrv} ms, indicating optimal cardiovascular capacity to absorb high exertion.`;
    recommendation = isRtl
      ? `استهدف جهداً يومياً حتى ${metrics.optimalStrainTarget.max}. يوم مثالي للتمارين المكثفة (HIIT)، رفع الأثقال الثقيلة، أو المنافسات الرياضية.`
      : `Target up to ${metrics.optimalStrainTarget.max} Day Strain today. Great day for interval sprints, heavy strength training, or competitive sports.`;
  } else if (isYellow) {
    outlookText = isRtl
      ? `تعكس نسبة الاستشفاء ${recovery}% استقراراً قلبياً متوازناً. جسمك يحافظ على التوازن الداخلي دون إجهاد عصبي ملحوظ.`
      : `Your ${recovery}% Recovery reflects steady cardiovascular equilibrium. Your body is maintaining homeostasis without significant sympathetic distress.`;
    recommendation = isRtl
      ? `استهدف جهداً معتدلاً (${metrics.optimalStrainTarget.min} - ${metrics.optimalStrainTarget.max}). ركز على بناء القاعدة الهوائية والترطيب الجيد.`
      : `Aim for moderate Day Strain (${metrics.optimalStrainTarget.min} - ${metrics.optimalStrainTarget.max}). Focus on aerobic base building and consistent hydration.`;
  } else {
    outlookText = isRtl
      ? `عند نسبة استشفاء ${recovery}%، يعاني جهازك العصبي من الإرهاق مع غلبة النشاط الودي، مما يحد من القدرة على التعافي السريع.`
      : `At ${recovery}% Recovery, your autonomic system is fatigued. Sympathetic tone is dominant and cardiovascular recovery is suppressed.`;
    recommendation = isRtl
      ? `تجنب الإجهاد القلبي العالي. امنح الأولوية للاستشفاء الإيجابي، تمارين الإطالة، والنوم المبكر الليلة.`
      : `Limit high-intensity cardiovascular load. Prioritize restorative active recovery, mobility, and early sleep tonight.`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-[400px] p-5 rounded-[24px] bg-[#16191E] border border-white/10 shadow-2xl space-y-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌅</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                {isRtl ? 'الرؤية اليومية الحيوية' : 'Daily Biometric Outlook'}
              </h3>
              <p className="text-[10px] text-zinc-400 font-sans">
                {isRtl ? 'تحليل فسيولوجي مباشر' : 'Real-Time Physiological Synthesis'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#222730] text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Stats Snapshot */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-[#0B0D10] border border-white/5">
            <div className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">{t('hrv')}</div>
            <div className="text-lg font-black font-condensed text-white tabular-nums mt-0.5" dir="ltr">
              {metrics.currentHrv !== null ? `${metrics.currentHrv} ms` : '--'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0B0D10] border border-white/5">
            <div className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">{t('rhr')}</div>
            <div className="text-lg font-black font-condensed text-white tabular-nums mt-0.5" dir="ltr">
              {metrics.restingHr !== null ? `${metrics.restingHr} bpm` : '--'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0B0D10] border border-white/5">
            <div className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">{t('dayStrain')}</div>
            <div className="text-lg font-black font-condensed text-[#0093E9] tabular-nums mt-0.5" dir="ltr">
              {metrics.dailyStrain.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Synthesis Text */}
        <div className="p-3.5 rounded-xl bg-[#0B0D10] border border-white/5 text-xs space-y-2 leading-relaxed">
          <p className="text-zinc-300 font-sans text-start">{outlookText}</p>
          <div className="pt-2 border-t border-white/5 text-zinc-400 font-sans text-start">
            <b className="text-white font-condensed uppercase tracking-wider block mb-1">
              {isRtl ? 'توجيه المدرب الرياضي:' : 'Coach Recommendation:'}
            </b>
            {recommendation}
          </div>
        </div>

        {/* Battery & Hardware Status Note */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
          <span>{isRtl ? 'السوار:' : 'Strap:'} {metadata.name}</span>
          <span className={metadata.batteryLevel && metadata.batteryLevel < 15 ? 'text-[#FF0026]' : 'text-zinc-300'}>
            {t('battery')}: {metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : '--'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#222730] hover:bg-[#2C323D] text-white font-black text-xs uppercase tracking-wider font-condensed transition-all"
        >
          {isRtl ? 'حسناً' : 'Got It'}
        </button>
      </div>
    </div>
  );
};
