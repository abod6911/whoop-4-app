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
                {isRtl ? 'Ù…Ø­Ø±Ùƒ Ø§Ù„Ø§Ù‡ØªØ²Ø§Ø² Ø§Ù„Ù…Ø¯Ù…Ø¬ ÙÙŠ Ø§Ù„Ø³ÙˆØ§Ø±' : 'On-Strap Haptic Motor Control'}
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
              {settings.lastTriggerReason || (isRtl ? 'Ø§Ø³ØªÙŠÙ‚Ø¸ Ø¨Ù„Ø·Ù Ù…Ø¹ Ø§Ù„Ø§Ù‡ØªØ²Ø§Ø² Ø§Ù„ØµØ§Ù…Øª' : 'Wake up gently with silent haptics')}
            </p>
            <button
              onClick={handleStopAlarm}
              className="w-full py-2.5 rounded-xl bg-[#FF3344] text-white font-black uppercase tracking-wider font-condensed active:scale-98 transition-transform"
            >
              {isRtl ? 'Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„Ù…Ù†Ø¨Ù‡' : 'STOP ALARM'}
            </button>
          </div>
        )}

        {/* Master ON/OFF Switch Card */}
        <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'ØªÙØ¹ÙŠÙ„ Ù…Ù†Ø¨Ù‡ Ø§Ù„Ø³ÙˆØ§Ø±' : 'Enable Strap Alarm'}
            </div>
            <div className="text-[11px] text-zinc-400 font-sans">
              {settings.enabled
                ? (isRtl ? 'Ø§Ù„Ù…Ù†Ø¨Ù‡ Ù…ÙØ¹Ù„ ÙˆØ¬Ø§Ù‡Ø² Ù„Ù„Ø§Ø³ØªÙŠÙ‚Ø§Ø¸' : 'Alarm is armed and active')
                : (isRtl ? 'Ø§Ù„Ù…Ù†Ø¨Ù‡ Ù…Ø¹Ø·Ù„ Ø­Ø§Ù„ÙŠØ§Ù‹' : 'Alarm is turned off')}
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
            {isRtl ? 'ÙˆØ¶Ø¹ Ø§Ù„Ø§Ø³ØªÙŠÙ‚Ø§Ø¸ Ø§Ù„Ø°ÙƒÙŠ' : 'Smart Wake Mode'}
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
                {isRtl ? 'ÙˆÙ‚Øª Ù…Ø­Ø¯Ø¯' : 'Exact Time'}
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
                {isRtl ? 'Ù‡Ø¯Ù Ø§Ù„Ù†ÙˆÙ…' : 'Sleep Goal'}
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
                {isRtl ? 'Ø§Ù„ØªØ¹Ø§ÙÙŠ Ø§Ù„Ø£Ø®Ø¶Ø±' : 'In the Green'}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Mode Settings */}
        {settings.mode === 'exact_time' && (
          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-zinc-300 font-condensed">
                {isRtl ? 'ÙˆÙ‚Øª Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡ (24 Ø³Ø§Ø¹Ø©)' : 'Wake Up Time (24h)'}
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
                ? `Ø³ÙŠÙ‡ØªØ² Ø³ÙˆØ§Ø± WHOOP 4.0 Ø¨Ø¯Ù‚Ø© Ø¹Ù†Ø¯ Ø§Ù„Ø³Ø§Ø¹Ø© ${settings.exactTime}.`
                : `Your WHOOP 4.0 strap will vibrate precisely at ${settings.exactTime}.`}
            </p>
          </div>
        )}

        {settings.mode === 'sleep_goal' && (
          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-3">
            <span className="text-xs font-black uppercase text-zinc-300 font-condensed">
              {isRtl ? 'Ù†Ø³Ø¨Ø© Ø¥ÙƒÙ…Ø§Ù„ Ø­Ø§Ø¬Ø© Ø§Ù„Ù†ÙˆÙ…' : 'Target Sleep Need Satisfaction'}
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
                <div className="text-sm font-condensed">100% {isRtl ? 'Ø§Ù„Ø£Ø¯Ø§Ø¡ Ø§Ù„Ø£Ù…Ø«Ù„' : 'Peak Performance'}</div>
                <div className="text-[10px] text-zinc-400 font-sans">{isRtl ? 'ØªÙ„Ø¨ÙŠØ© ÙƒØ§Ù…Ù„ Ø§Ù„Ø­Ø§Ø¬Ø©' : '100% of Sleep Need'}</div>
              </button>
              <button
                onClick={() => handleSleepGoalChange(85)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.sleepGoalPercent === 85
                    ? 'bg-[#7293B2]/20 border-[#7293B2] text-white font-black'
                    : 'bg-[#16191E] border-white/5 text-zinc-400'
                }`}
              >
                <div className="text-sm font-condensed">85% {isRtl ? 'Ø§Ù„ÙƒÙØ§ÙŠØ© Ø§Ù„Ù…Ù‚Ø¨ÙˆÙ„Ø©' : 'Perform'}</div>
                <div className="text-[10px] text-zinc-400 font-sans">{isRtl ? 'ÙƒØ§ÙÙ Ù„ÙŠÙˆÙ… Ø¬ÙŠØ¯' : '85% of Sleep Need'}</div>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              {isRtl
                ? 'ÙŠÙ‡ØªØ² Ø§Ù„Ø³ÙˆØ§Ø± ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¨Ù…Ø¬Ø±Ø¯ Ø¥ÙƒÙ…Ø§Ù„ Ø¹Ø¯Ø¯ Ø³Ø§Ø¹Ø§Øª Ø§Ù„Ù†ÙˆÙ… Ø§Ù„Ù…Ø­Ø³ÙˆØ¨Ø© Ø¨ÙŠÙˆÙ„ÙˆØ¬ÙŠØ§Ù‹ Ø§Ù„Ù„ÙŠÙ„Ø©.'
                : 'Strap automatically buzzes once your bio-calculated sleep need is fulfilled.'}
            </p>
          </div>
        )}

        {settings.mode === 'recovery' && (
          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16EC06] shadow-sm shadow-[#16EC06]" />
              <span className="text-xs font-black uppercase text-zinc-300 font-condensed">
                {isRtl ? 'Ø§Ù„Ø§Ø³ØªÙŠÙ‚Ø§Ø¸ Ø¹Ù†Ø¯ Ø§Ù„ØªØ¹Ø§ÙÙŠ Ø§Ù„Ø£Ø®Ø¶Ø± (â‰¥67%)' : 'Wake in Green Zone (â‰¥67%)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              {isRtl
                ? 'Ø³ÙŠÙ‚ÙˆÙ… Ø§Ù„Ø³ÙˆØ§Ø± Ø¨Ù…Ø±Ø§Ù‚Ø¨Ø© ØªØ¹Ø§ÙÙŠÙƒ Ø§Ù„Ø¹ØµØ¨ÙŠ (HRV Ùˆ RHR) ÙˆØ¥ÙŠÙ‚Ø§Ø¸Ùƒ Ø¹Ù†Ø¯Ù…Ø§ ÙŠØµÙ„ Ø¬Ù‡Ø§Ø²Ùƒ Ø§Ù„Ø¹ØµØ¨ÙŠ Ø§Ù„Ù…Ø³ØªÙ‚Ù„ Ø¥Ù„Ù‰ Ø§Ù„Ø¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„ÙƒØ§Ù…Ù„Ø©.'
                : 'WHOOP monitors your autonomic recovery and wakes you as soon as your recovery transitions into the Green Zone.'}
            </p>
          </div>
        )}

        {/* Haptic Vibration Pattern Picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
            {isRtl ? 'Ù†Ù…Ø· Ø§Ù„Ø§Ù‡ØªØ²Ø§Ø² Ø§Ù„Ù…ÙŠÙƒØ§Ù†ÙŠÙƒÙŠ' : 'Haptic Vibration Pattern'}
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
                    ? (isRtl ? 'Ù„Ø·ÙŠÙ' : 'Gentle')
                    : pat === 'pulse'
                    ? (isRtl ? 'Ù†Ø¨Ø¶Ø§Øª' : 'Pulse')
                    : (isRtl ? 'ØªÙ†Ø¨ÙŠÙ‡ Ù‚ÙˆÙŠ' : 'Alarm')}
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
                ? (isRtl ? 'Ø¬Ø§Ø±Ù Ø¥Ø±Ø³Ø§Ù„ Ø£Ù…Ø± Ø§Ù„Ø§Ù‡ØªØ²Ø§Ø²...' : 'Sending Buzz Command...')
                : testSuccess
                ? (isRtl ? 'âœ“ ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø§Ù‡ØªØ²Ø§Ø² Ù„Ù„Ø³ÙˆØ§Ø± Ø¨Ù†Ø¬Ø§Ø­!' : 'âœ“ Strap Buzz Dispatched!')
                : (isRtl ? 'ØªØ¬Ø±Ø¨Ø© Ø§Ù‡ØªØ²Ø§Ø² Ø§Ù„Ø³ÙˆØ§Ø± Ø§Ù„Ø¢Ù†' : 'Test Strap Vibration Now')}
            </span>
          </button>
          {!isConnected && (
            <p className="text-[10px] text-zinc-500 font-sans text-center mt-1.5">
              {isRtl
                ? 'Ù…Ù„Ø§Ø­Ø¸Ø©: Ø§Ù„Ø³ÙˆØ§Ø± ØºÙŠØ± Ù…ØªØµÙ„ Ø­Ø§Ù„ÙŠØ§Ù‹ Ø¹Ø¨Ø± Ø§Ù„Ø¨Ù„ÙˆØªÙˆØ«. Ø³ÙŠØªÙ… Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù‡ØªØ²Ø§Ø² Ø§Ù„Ù‡Ø§ØªÙ ÙÙ‚Ø·.'
                : 'Note: WHOOP strap is not connected via BLE. Vibration will test on phone only.'}
            </p>
          )}
        </div>

      </SheetPanel>
    </SheetBackdrop>
  );
};
