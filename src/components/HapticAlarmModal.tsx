import React, { useState, useEffect } from 'react';
import { alarmEngine, type AlarmSettings, type AlarmMode } from '../services/alarmEngine';
import { whoopBleEngine } from '../services/whoopBleEngine';
import {
  Bell,
  X,
  Clock,
  Moon,
  HeartPulse,
  Vibrate,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  VolumeX,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from '../utils/haptics';

interface HapticAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HapticAlarmModal: React.FC<HapticAlarmModalProps> = ({ isOpen, onClose }) => {
  const { t, isRtl } = useLanguage();
  const [settings, setSettings] = useState<AlarmSettings>(() => alarmEngine.getSettings());
  const [isRinging, setIsRinging] = useState<boolean>(() => alarmEngine.isRinging());
  const [testingBuzz, setTestingBuzz] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    return alarmEngine.subscribe(() => {
      setSettings(alarmEngine.getSettings());
      setIsRinging(alarmEngine.isRinging());
    });
  }, []);

  const handleToggle = () => {
    hapticMedium();
    const updated = alarmEngine.saveSettings({ enabled: !settings.enabled });
    setSettings(updated);
  };

  const handleModeChange = (mode: AlarmMode) => {
    hapticLight();
    const updated = alarmEngine.saveSettings({ mode });
    setSettings(updated);
  };

  const handleTimeChange = (time: string) => {
    hapticLight();
    const updated = alarmEngine.saveSettings({ exactTime: time });
    setSettings(updated);
  };

  const handlePatternChange = (pattern: 'gentle' | 'pulse' | 'alarm') => {
    hapticLight();
    const updated = alarmEngine.saveSettings({ vibrationPattern: pattern });
    setSettings(updated);
  };

  const handleSleepGoalChange = (pct: number) => {
    hapticLight();
    const updated = alarmEngine.saveSettings({ sleepGoalPercent: pct });
    setSettings(updated);
  };

  const handleTestStrap = async () => {
    hapticMedium();
    setTestingBuzz(true);
    setTestSuccess(false);
    try {
      await alarmEngine.testStrapVibration(settings.vibrationPattern);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } catch {
      hapticWarning();
    } finally {
      setTestingBuzz(false);
    }
  };

  const handleStopAlarm = () => {
    hapticMedium();
    alarmEngine.stopAlarm();
    setIsRinging(false);
  };

  const isConnected = whoopBleEngine.getMetadata().connected;

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="p-5 max-h-[90vh] overflow-y-auto space-y-4 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00A3FF]/20 text-[#00A3FF] flex items-center justify-center border border-[#00A3FF]/30">
              <Vibrate className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white font-condensed">
                {isRtl ? 'منبه الاهتزاز الصامت WHOOP' : 'WHOOP Silent Haptic Alarm'}
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">
                {isRtl ? 'محرك الاهتزاز المدمج في السوار' : 'On-Strap Haptic Motor Control'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              hapticLight();
              onClose();
            }}
            className="p-1.5 rounded-full bg-[#222730] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ringing Alert Banner if Active */}
        {isRinging && (
          <div className="p-4 rounded-2xl bg-[#FF3344]/20 border border-[#FF3344] text-center space-y-2 animate-bounce">
            <div className="flex items-center justify-center gap-2 text-[#FF3344]">
              <Vibrate className="w-6 h-6 animate-spin" />
              <span className="text-sm font-black uppercase tracking-wider font-condensed">
                {isRtl ? 'المنبه يرن الآن على السوار!' : 'ALARM ACTIVE ON STRAP!'}
              </span>
            </div>
            <p className="text-xs text-white/90">
              {settings.lastTriggerReason || (isRtl ? 'استيقظ بلطف مع الاهتزاز الصامت' : 'Wake up gently with silent haptics')}
            </p>
            <button
              onClick={handleStopAlarm}
              className="w-full py-2.5 rounded-xl bg-[#FF3344] text-white font-black uppercase tracking-wider font-condensed active:scale-98 transition-transform"
            >
              {isRtl ? 'إيقاف المنبه' : 'STOP ALARM'}
            </button>
          </div>
        )}

        {/* Master ON/OFF Switch Card */}
        <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'تفعيل منبه السوار' : 'Enable Strap Alarm'}
            </div>
            <div className="text-[11px] text-zinc-400 font-sans">
              {settings.enabled
                ? (isRtl ? 'المنبه مفعّل وجاهز للاستيقاظ' : 'Alarm is armed and active')
                : (isRtl ? 'المنبه معطل حالياً' : 'Alarm is turned off')}
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`w-14 h-8 rounded-full p-1 transition-colors relative flex items-center ${
              settings.enabled ? 'bg-[#16EC06]' : 'bg-[#222730]'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-black shadow-md transition-transform transform ${
                settings.enabled ? (isRtl ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Alarm Modes Segmented Picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
            {isRtl ? 'وضع الاستيقاظ الذكي' : 'Smart Wake Mode'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Mode 1: Exact Time */}
            <button
              onClick={() => handleModeChange('exact_time')}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                settings.mode === 'exact_time'
                  ? 'bg-[#00A3FF]/15 border-[#00A3FF] text-white shadow-lg shadow-[#00A3FF]/10'
                  : 'bg-[#0B0D10] border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Clock className={`w-4 h-4 ${settings.mode === 'exact_time' ? 'text-[#00A3FF]' : ''}`} />
              <span className="text-[11px] font-black uppercase font-condensed">
                {isRtl ? 'وقت محدد' : 'Exact Time'}
              </span>
            </button>

            {/* Mode 2: Sleep Goal */}
            <button
              onClick={() => handleModeChange('sleep_goal')}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                settings.mode === 'sleep_goal'
                  ? 'bg-[#7293B2]/20 border-[#7293B2] text-white shadow-lg shadow-[#7293B2]/10'
                  : 'bg-[#0B0D10] border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Moon className={`w-4 h-4 ${settings.mode === 'sleep_goal' ? 'text-[#7293B2]' : ''}`} />
              <span className="text-[11px] font-black uppercase font-condensed">
                {isRtl ? 'هدف النوم' : 'Sleep Goal'}
              </span>
            </button>

            {/* Mode 3: Recovery Green */}
            <button
              onClick={() => handleModeChange('recovery')}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                settings.mode === 'recovery'
                  ? 'bg-[#16EC06]/15 border-[#16EC06] text-white shadow-lg shadow-[#16EC06]/10'
                  : 'bg-[#0B0D10] border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <HeartPulse className={`w-4 h-4 ${settings.mode === 'recovery' ? 'text-[#16EC06]' : ''}`} />
              <span className="text-[11px] font-black uppercase font-condensed">
                {isRtl ? 'التعافي الأخضر' : 'In the Green'}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Mode Settings */}
        {settings.mode === 'exact_time' && (
          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-zinc-300 font-condensed">
                {isRtl ? 'وقت التنبيه (24 ساعة)' : 'Wake Up Time (24h)'}
              </span>
              <input
                type="time"
                value={settings.exactTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="bg-[#16191E] text-white border border-white/10 rounded-xl px-3 py-1.5 text-base font-mono font-bold focus:border-[#00A3FF] focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              {isRtl
                ? `سيهتز سوار WHOOP 4.0 بدقة عند الساعة ${settings.exactTime}.`
                : `Your WHOOP 4.0 strap will vibrate precisely at ${settings.exactTime}.`}
            </p>
          </div>
        )}

        {settings.mode === 'sleep_goal' && (
          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-3">
            <span className="text-xs font-black uppercase text-zinc-300 font-condensed">
              {isRtl ? 'نسبة إكمال حاجة النوم' : 'Target Sleep Need Satisfaction'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSleepGoalChange(100)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.sleepGoalPercent === 100
                    ? 'bg-[#7293B2]/20 border-[#7293B2] text-white font-black'
                    : 'bg-[#16191E] border-white/5 text-zinc-400'
                }`}
              >
                <div className="text-sm font-condensed">100% {isRtl ? 'الأداء الأمثل' : 'Peak Performance'}</div>
                <div className="text-[10px] text-zinc-400 font-sans">{isRtl ? 'تلبية كامل الحاجة' : '100% of Sleep Need'}</div>
              </button>
              <button
                onClick={() => handleSleepGoalChange(85)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.sleepGoalPercent === 85
                    ? 'bg-[#7293B2]/20 border-[#7293B2] text-white font-black'
                    : 'bg-[#16191E] border-white/5 text-zinc-400'
                }`}
              >
                <div className="text-sm font-condensed">85% {isRtl ? 'الكفاية المقبولة' : 'Perform'}</div>
                <div className="text-[10px] text-zinc-400 font-sans">{isRtl ? 'كافٍ ليوم جيد' : '85% of Sleep Need'}</div>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              {isRtl
                ? 'يهتز السوار تلقائياً بمجرد إكمال عدد ساعات النوم المحسوبة بيولوجياً الليلة.'
                : 'Strap automatically buzzes once your bio-calculated sleep need is fulfilled.'}
            </p>
          </div>
        )}

        {settings.mode === 'recovery' && (
          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16EC06] shadow-sm shadow-[#16EC06]" />
              <span className="text-xs font-black uppercase text-zinc-300 font-condensed">
                {isRtl ? 'الاستيقاظ عند التعافي الأخضر (≥67%)' : 'Wake in Green Zone (≥67%)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              {isRtl
                ? 'سيقوم السوار بمراقبة تعافيك العصبي (HRV و RHR) وإيقاظك عندما يصل جهازك العصبي المستقل إلى الجاهزية الكاملة.'
                : 'WHOOP monitors your autonomic recovery and wakes you as soon as your recovery transitions into the Green Zone.'}
            </p>
          </div>
        )}

        {/* Haptic Vibration Pattern Picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
            {isRtl ? 'نمط الاهتزاز الميكانيكي' : 'Haptic Vibration Pattern'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['gentle', 'pulse', 'alarm'] as const).map((pat) => (
              <button
                key={pat}
                onClick={() => handlePatternChange(pat)}
                className={`py-2 px-1 rounded-xl border text-center transition-all ${
                  settings.vibrationPattern === pat
                    ? 'bg-white/10 border-white text-white font-black'
                    : 'bg-[#0B0D10] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-condensed uppercase">
                  {pat === 'gentle'
                    ? (isRtl ? 'لطيف' : 'Gentle')
                    : pat === 'pulse'
                    ? (isRtl ? 'نبضات' : 'Pulse')
                    : (isRtl ? 'تنبيه قوي' : 'Alarm')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Test Strap Vibration Button */}
        <div className="pt-2">
          <button
            onClick={handleTestStrap}
            disabled={testingBuzz}
            className={`w-full py-3 rounded-2xl border flex items-center justify-center gap-2 font-condensed font-black text-xs uppercase tracking-wider transition-all active:scale-98 ${
              testSuccess
                ? 'bg-[#16EC06]/20 border-[#16EC06] text-[#16EC06]'
                : isConnected
                ? 'bg-[#16191E] border-white/10 text-white hover:border-[#00A3FF]'
                : 'bg-[#16191E]/60 border-white/5 text-zinc-500'
            }`}
          >
            <Vibrate className={`w-4 h-4 ${testingBuzz ? 'animate-bounce text-[#00A3FF]' : ''}`} />
            <span>
              {testingBuzz
                ? (isRtl ? 'جارٍ إرسال أمر الاهتزاز...' : 'Sending Buzz Command...')
                : testSuccess
                ? (isRtl ? '✓ تم إرسال الاهتزاز للسوار بنجاح!' : '✓ Strap Buzz Dispatched!')
                : (isRtl ? 'تجربة اهتزاز السوار الآن' : 'Test Strap Vibration Now')}
            </span>
          </button>
          {!isConnected && (
            <p className="text-[10px] text-zinc-500 font-sans text-center mt-1.5">
              {isRtl
                ? 'ملاحظة: السوار غير متصل حالياً عبر البلوتوث. سيتم اختبار اهتزاز الهاتف فقط.'
                : 'Note: WHOOP strap is not connected via BLE. Vibration will test on phone only.'}
            </p>
          )}
        </div>

      </SheetPanel>
    </SheetBackdrop>
  );
};
