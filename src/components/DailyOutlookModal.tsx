import React from 'react';
import type { LiveMetrics, UserSettings, DeviceMetadata } from '../types/whoop';
import { WhoopLogo } from './WhoopLogo';
import { Sparkles, X, Sun, Heart, Activity, Flame, Battery } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';

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
  const recovery = metrics.recoveryScore;
  const isGreen = metrics.recoveryCategory === 'green';
  const isYellow = metrics.recoveryCategory === 'yellow';
  const isRed = metrics.recoveryCategory === 'red';

  let outlookText = '';
  let recommendation = '';

  if (recovery === null) {
    outlookText = isRtl
      ? 'Ø³ÙˆØ§Ø± WHOOP 4.0 ÙŠØ±Ø³Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø§Øª Ø§Ù„Ø­ÙŠØ© Ø¨Ø´ÙƒÙ„ Ù†Ø´Ø·. Ù…Ø¹ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ù…Ø²ÙŠØ¯ Ù…Ù† Ù†Ø¨Ø¶Ø§Øª Ø§Ù„Ø±Ø§Ø­Ø© ÙˆØªÙ‚Ù„Ø¨ Ø¶Ø±Ø¨Ø§Øª Ø§Ù„Ù‚Ù„Ø¨ØŒ Ø³ÙŠØªÙ… Ø§Ø­ØªØ³Ø§Ø¨ Ù†Ø³Ø¨Ø© Ø§Ù„Ø§Ø³ØªØ´ÙØ§Ø¡ ÙˆØ§Ù„Ø¬Ù‡Ø¯ Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù Ø¨Ø¯Ù‚Ø©.'
      : 'Your WHOOP 4.0 strap is actively streaming sensor data. As more resting intervals and heart rate variability beats are recorded today, your autonomic baseline will establish a precise Recovery and Day Strain target.';
    recommendation = isRtl
      ? 'Ø­Ø§ÙØ¸ Ø¹Ù„Ù‰ ØªØ«Ø¨ÙŠØª Ø§Ù„Ø³ÙˆØ§Ø± Ø¨Ø¥Ø­ÙƒØ§Ù… Ø¹Ù„Ù‰ Ù…Ø¹ØµÙ…Ùƒ (Ø¹Ø±Ø¶ Ø¥ØµØ¨Ø¹ ÙˆØ§Ø­Ø¯ ÙÙˆÙ‚ Ø¹Ø¸Ù…Ø© Ø§Ù„Ù…Ø¹ØµÙ…) Ù„Ø¶Ù…Ø§Ù† Ø¯Ù‚Ø© Ø§Ù„Ù‚Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ø¶ÙˆØ¦ÙŠØ©.'
      : 'Keep the strap snug on your wrist (one finger width above your wrist bone) to ensure clean optical PPG telemetry.';
  } else if (isGreen) {
    outlookText = isRtl
      ? `Ù…Ø¹ Ù†Ø³Ø¨Ø© Ø§Ø³ØªØ´ÙØ§Ø¡ ${recovery}%ØŒ ÙŠÙ‡ÙŠÙ…Ù† Ø§Ù„Ø¬Ù‡Ø§Ø² Ø§Ù„Ø¹ØµØ¨ÙŠ Ø§Ù„Ù„Ø§ÙˆØ¯ÙŠ (Parasympathetic) Ø¹Ù„Ù‰ Ù†Ø´Ø§Ø·Ùƒ. Ù…Ø¹Ø¯Ù„ ØªÙ‚Ù„Ø¨ Ù†Ø¨Ø¶Ø§Øª Ø§Ù„Ù‚Ù„Ø¨ Ù…Ø±ØªÙØ¹ Ø¹Ù†Ø¯ ${metrics.currentHrv} Ù…Ù„Ù„ÙŠ Ø«Ø§Ù†ÙŠØ©ØŒ Ù…Ù…Ø§ ÙŠØ¯Ù„ Ø¹Ù„Ù‰ Ø¬Ø§Ù‡Ø²ÙŠØ© Ù‚Ù„Ø¨ÙŠØ© Ù…Ø«Ø§Ù„ÙŠØ© Ù„ØªØ­Ù…Ù„ Ø£Ø¹Ù„Ù‰ Ù…Ø³ØªÙˆÙŠØ§Øª Ø§Ù„Ø¥Ø¬Ù‡Ø§Ø¯.`
      : `With a ${recovery}% Recovery, your autonomic nervous system is dominated by parasympathetic tone. Your HRV is elevated at ${metrics.currentHrv} ms, indicating optimal cardiovascular capacity to absorb high exertion.`;
    recommendation = isRtl
      ? `Ø§Ø³ØªÙ‡Ø¯Ù Ø¬Ù‡Ø¯Ø§Ù‹ ÙŠÙˆÙ…ÙŠØ§Ù‹ Ø­ØªÙ‰ ${metrics.optimalStrainTarget.max}. ÙŠÙˆÙ… Ù…Ø«Ø§Ù„ÙŠ Ù„Ù„ØªÙ…Ø§Ø±ÙŠÙ† Ø§Ù„Ù…ÙƒØ«ÙØ© (HIIT)ØŒ Ø±ÙØ¹ Ø§Ù„Ø£Ø«Ù‚Ø§Ù„ Ø§Ù„Ø«Ù‚ÙŠÙ„Ø©ØŒ Ø£Ùˆ Ø§Ù„Ù…Ù†Ø§ÙØ³Ø§Øª Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ©.`
      : `Target up to ${metrics.optimalStrainTarget.max} Day Strain today. Great day for interval sprints, heavy strength training, or competitive sports.`;
  } else if (isYellow) {
    outlookText = isRtl
      ? `ØªØ¹ÙƒØ³ Ù†Ø³Ø¨Ø© Ø§Ù„Ø§Ø³ØªØ´ÙØ§Ø¡ ${recovery}% Ø§Ø³ØªÙ‚Ø±Ø§Ø±Ø§Ù‹ Ù‚Ù„Ø¨ÙŠØ§Ù‹ Ù…ØªÙˆØ§Ø²Ù†Ø§Ù‹. Ø¬Ø³Ù…Ùƒ ÙŠØ­Ø§ÙØ¸ Ø¹Ù„Ù‰ Ø§Ù„ØªÙˆØ§Ø²Ù† Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ Ø¯ÙˆÙ† Ø¥Ø¬Ù‡Ø§Ø¯ Ø¹ØµØ¨ÙŠ Ù…Ù„Ø­ÙˆØ¸.`
      : `Your ${recovery}% Recovery reflects steady cardiovascular equilibrium. Your body is maintaining homeostasis without significant sympathetic distress.`;
    recommendation = isRtl
      ? `Ø§Ø³ØªÙ‡Ø¯Ù Ø¬Ù‡Ø¯Ø§Ù‹ Ù…Ø¹ØªØ¯Ù„Ø§Ù‹ (${metrics.optimalStrainTarget.min} - ${metrics.optimalStrainTarget.max}). Ø±ÙƒØ² Ø¹Ù„Ù‰ Ø¨Ù†Ø§Ø¡ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ù‡ÙˆØ§Ø¦ÙŠØ© ÙˆØ§Ù„ØªØ±Ø·ÙŠØ¨ Ø§Ù„Ø¬ÙŠØ¯.`
      : `Aim for moderate Day Strain (${metrics.optimalStrainTarget.min} - ${metrics.optimalStrainTarget.max}). Focus on aerobic base building and consistent hydration.`;
  } else {
    outlookText = isRtl
      ? `Ø¹Ù†Ø¯ Ù†Ø³Ø¨Ø© Ø§Ø³ØªØ´ÙØ§Ø¡ ${recovery}%ØŒ ÙŠØ¹Ø§Ù†ÙŠ Ø¬Ù‡Ø§Ø²Ùƒ Ø§Ù„Ø¹ØµØ¨ÙŠ Ù…Ù† Ø§Ù„Ø¥Ø±Ù‡Ø§Ù‚ Ù…Ø¹ ØºÙ„Ø¨Ø© Ø§Ù„Ù†Ø´Ø§Ø· Ø§Ù„ÙˆØ¯ÙŠØŒ Ù…Ù…Ø§ ÙŠØ­Ø¯ Ù…Ù† Ø§Ù„Ù‚Ø¯Ø±Ø© Ø¹Ù„Ù‰ Ø§Ù„ØªØ¹Ø§ÙÙŠ Ø§Ù„Ø³Ø±ÙŠØ¹.`
      : `At ${recovery}% Recovery, your autonomic system is fatigued. Sympathetic tone is dominant and cardiovascular recovery is suppressed.`;
    recommendation = isRtl
      ? `ØªØ¬Ù†Ø¨ Ø§Ù„Ø¥Ø¬Ù‡Ø§Ø¯ Ø§Ù„Ù‚Ù„Ø¨ÙŠ Ø§Ù„Ø¹Ø§Ù„ÙŠ. Ø§Ù…Ù†Ø­ Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ© Ù„Ù„Ø§Ø³ØªØ´ÙØ§Ø¡ Ø§Ù„Ø¥ÙŠØ¬Ø§Ø¨ÙŠØŒ ØªÙ…Ø§Ø±ÙŠÙ† Ø§Ù„Ø¥Ø·Ø§Ù„Ø©ØŒ ÙˆØ§Ù„Ù†ÙˆÙ… Ø§Ù„Ù…Ø¨ÙƒØ± Ø§Ù„Ù„ÙŠÙ„Ø©.`
      : `Limit high-intensity cardiovascular load. Prioritize restorative active recovery, mobility, and early sleep tonight.`;
  }

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="p-5 max-h-[85vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">ðŸŒ…</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                {isRtl ? 'الرؤية اليومية الحيوية' : 'Daily Biometric Outlook'}
              </h3>
              <p className="text-[10px] text-zinc-400 font-sans">
                {isRtl ? 'ØªØ­Ù„ÙŠÙ„ ÙØ³ÙŠÙˆÙ„ÙˆØ¬ÙŠ Ù…Ø¨Ø§Ø´Ø±' : 'Real-Time Physiological Synthesis'}
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
              {isRtl ? 'ØªÙˆØ¬ÙŠÙ‡ Ø§Ù„Ù…Ø¯Ø±Ø¨ Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠ:' : 'Coach Recommendation:'}
            </b>
            {recommendation}
          </div>
        </div>

        {/* Battery & Hardware Status Note */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
          <span>{isRtl ? 'السوار:' : 'Strap:'} {metadata.name}</span>
          <span className={metadata.batteryLevel && metadata.batteryLevel < 15 ? 'text-[#FF3344]' : 'text-zinc-300'}>
            {t('battery')}: {metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : '--'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#222730] hover:bg-[#2C323D] text-white font-black text-xs uppercase tracking-wider font-condensed transition-all"
        >
          {isRtl ? 'حسناً' : 'Got It'}
        </button>
      </SheetPanel>
    </SheetBackdrop>
  );
};
