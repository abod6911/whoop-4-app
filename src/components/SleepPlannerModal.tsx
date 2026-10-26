import React, { useState } from 'react';
import type { LiveMetrics, UserSettings } from '../types/whoop';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import { useLanguage } from '../i18n/LanguageContext';
import { notificationEngine } from '../services/notificationEngine';
import { alarmEngine, type AlarmMode } from '../services/alarmEngine';
import { Moon, Sun, Clock, Zap, Vibrate, CheckCircle2, Sparkles, Play, X } from 'lucide-react';

interface SleepPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  onLaunchOledNightLock: () => void;
  settings?: UserSettings;
  onSaveWakeTime?: (wake: string) => void;
}

export const SleepPlannerModal: React.FC<SleepPlannerModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onLaunchOledNightLock,
  settings,
  onSaveWakeTime,
}) => {
  const { t, isRtl } = useLanguage();
  const [goal, setGoal] = useState<'peak' | 'perform' | 'get_by'>('peak');

  // Alarm Engine Integration
  const [initialAlarm] = useState(() => alarmEngine.getSettings());
  const [wakeTime, setWakeTime] = useState(initialAlarm.exactTime || settings?.wakeTime || '07:00');
  const [alarmEnabled, setAlarmEnabled] = useState(initialAlarm.enabled);
  const [alarmMode, setAlarmMode] = useState<AlarmMode>(initialAlarm.mode === 'sleep_goal' ? 'sleep_goal' : 'exact_time');
  const [isTestingBuzz, setIsTestingBuzz] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // Real Sleep Need Math based on WHOOP Physiology
  const baselineHours = settings?.sleepNeedHours ?? 7.9;
  const strainDebtHours = Math.round((metrics.dailyStrain / 21.0) * 1.4 * 10) / 10;
  const sleepDebtHours = 0;

  const totalNeedHours = baselineHours + strainDebtHours + sleepDebtHours;

  const targetHours =
    goal === 'peak'
      ? totalNeedHours // 100% Peak
      : goal === 'perform'
      ? totalNeedHours * 0.85 // 85% Perform
      : totalNeedHours * 0.70; // 70% Get By

  // Calculate Target Bedtime
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);
  const wakeTotalMin = (isNaN(wakeH) ? 7 : wakeH) * 60 + (isNaN(wakeM) ? 0 : wakeM);
  const targetTotalMin = Math.round(targetHours * 60);
  let bedTotalMin = wakeTotalMin - targetTotalMin;
  if (bedTotalMin < 0) bedTotalMin += 24 * 60;
  const bedH = Math.floor(bedTotalMin / 60);
  const bedM = bedTotalMin % 60;
  const targetBedtimeStr = `${bedH.toString().padStart(2, '0')}:${bedM.toString().padStart(2, '0')}`;

  const handleTestVibration = async () => {
    setIsTestingBuzz(true);
    setTestSuccess(false);
    try {
      await alarmEngine.testStrapVibration('alarm');
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } finally {
      setIsTestingBuzz(false);
    }
  };

  const handleSetAlarm = () => {
    onSaveWakeTime?.(wakeTime);
    alarmEngine.saveSettings({
      enabled: alarmEnabled,
      mode: alarmMode,
      exactTime: wakeTime,
      sleepGoalPercent: goal === 'peak' ? 100 : goal === 'perform' ? 85 : 70,
    });

    notificationEngine.dispatch({
      type: 'sleep',
      title: isRtl ? '⏰ تم ضبط منبه الاستيقاظ الذكي للسوار' : '⏰ Smart Haptic Alarm Armed',
      message: alarmEnabled
        ? (isRtl
            ? `المنبه مفعل على سوار WHOOP (${alarmMode === 'exact_time' ? `الوقت المحدد: ${wakeTime}` : 'عند اكتمال هدف النوم'}). موعد النوم المقترح: ${targetBedtimeStr}`
            : `Haptic motor armed on WHOOP strap (${alarmMode === 'exact_time' ? `Exact Time: ${wakeTime}` : 'In the Green / Goal Met'}). Bedtime: ${targetBedtimeStr}`)
        : (isRtl
            ? `تم حفظ وقت الاستيقاظ ${wakeTime}. موعد النوم المقترح: ${targetBedtimeStr}`
            : `Wake target saved: ${wakeTime}. Recommended bedtime: ${targetBedtimeStr}`),
    });
    onClose();
  };

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7395B7]/15 border border-[#7395B7]/30 flex items-center justify-center text-[#7395B7]">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-white">
                {isRtl ? 'مخطط النوم والمنبه الذكي' : 'Sleep Planner & Smart Alarm'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-condensed">
                {isRtl ? 'محرك الحساب الفسيولوجي المباشر' : 'Live Sleep Need Math Engine'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Goal Selector */}
          <div className="grid grid-cols-3 gap-2 bg-[#12151A] p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setGoal('peak')}
              className={`py-2.5 px-2 rounded-xl text-xs font-black font-condensed uppercase tracking-wider transition-all ${
                goal === 'peak'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div>{isRtl ? 'ذروة 100%' : '100% Peak'}</div>
              <div className="text-[9px] opacity-75 font-mono">{isRtl ? 'أفضل أداء' : 'Peak Energy'}</div>
            </button>
            <button
              onClick={() => setGoal('perform')}
              className={`py-2.5 px-2 rounded-xl text-xs font-black font-condensed uppercase tracking-wider transition-all ${
                goal === 'perform'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div>{isRtl ? 'أداء 85%' : '85% Perform'}</div>
              <div className="text-[9px] opacity-75 font-mono">{isRtl ? 'توازن مثالي' : 'Optimal Balance'}</div>
            </button>
            <button
              onClick={() => setGoal('get_by')}
              className={`py-2.5 px-2 rounded-xl text-xs font-black font-condensed uppercase tracking-wider transition-all ${
                goal === 'get_by'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div>{isRtl ? 'كفاية 70%' : '70% Get By'}</div>
              <div className="text-[9px] opacity-75 font-mono">{isRtl ? 'الحد الأدنى' : 'Minimum Need'}</div>
            </button>
          </div>

          {/* Target Bedtime Hero Card */}
          <div className="bg-[#12151A] border border-white/5 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              {isRtl ? 'موعد النوم المقترح' : 'Recommended Bedtime'}
            </span>
            <div className="text-4xl font-black font-condensed text-white tabular-nums" dir="ltr">
              {targetBedtimeStr}
            </div>
            <p className="text-xs text-zinc-400 font-sans pt-1">
              {isRtl ? (
                <>لتحقيق <strong className="text-white font-bold" dir="ltr">{Math.floor(targetHours)}h {Math.round((targetHours % 1) * 60)}m</strong> من النوم التعويضي قبل <strong className="text-white" dir="ltr">{wakeTime}</strong>.</>
              ) : (
                <>To achieve <strong className="text-white font-bold">{Math.floor(targetHours)}h {Math.round((targetHours % 1) * 60)}m</strong> of restorative sleep before <strong className="text-white">{wakeTime}</strong>.</>
              )}
            </p>
          </div>

          {/* Smart Haptic Wake Alarm Section (Requirement 4) */}
          <div className="bg-[#12151A] border border-[#FFDE00]/25 rounded-2xl p-4 space-y-3.5 shadow-[0_0_20px_rgba(255,222,0,0.06)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FFDE00]/15 border border-[#FFDE00]/30 flex items-center justify-center text-[#FFDE00]">
                  <Vibrate className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold font-sans text-white uppercase block">
                    {isRtl ? 'منبه السوار الصامت (Smart Haptic Alarm)' : 'Smart Haptic Alarm'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-condensed block">
                    {isRtl ? 'اهتزاز ميكانيكي للسوار لإيقاظك بهدوء دون إزعاج' : 'Silent physical WHOOP 4.0 motor vibration'}
                  </span>
                </div>
              </div>

              {/* Master Alarm Toggle Switch */}
              <button
                type="button"
                onClick={() => setAlarmEnabled(!alarmEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  alarmEnabled ? 'bg-[#FFDE00]' : 'bg-zinc-800 border border-white/10'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                    alarmEnabled ? (isRtl ? '-translate-x-6' : 'translate-x-6') : (isRtl ? '-translate-x-1' : 'translate-x-1')
                  }`}
                />
              </button>
            </div>

            {/* Alarm Mode Selector */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAlarmMode('exact_time')}
                className={`p-2.5 rounded-xl border text-start transition-all ${
                  alarmMode === 'exact_time'
                    ? 'bg-[#181E26] border-[#FFDE00] text-white shadow-sm'
                    : 'bg-[#16191E] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold font-condensed">
                  <Clock className="w-3.5 h-3.5 text-[#FFDE00]" />
                  <span>{isRtl ? 'الوقت المحدد' : 'Exact Time'}</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-sans block mt-0.5">
                  {isRtl ? 'اهتزاز فوري عند الوقت المضبوط' : 'Buzzes precisely at wake time'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAlarmMode('sleep_goal')}
                className={`p-2.5 rounded-xl border text-start transition-all ${
                  alarmMode === 'sleep_goal'
                    ? 'bg-[#181E26] border-[#16EC06] text-white shadow-sm'
                    : 'bg-[#16191E] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold font-condensed">
                  <Sparkles className="w-3.5 h-3.5 text-[#16EC06]" />
                  <span>{isRtl ? 'عند اكتمال الهدف' : 'In the Green'}</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-sans block mt-0.5">
                  {isRtl ? 'اهتزاز عند بلوغ هدف النوم' : 'Wakes when sleep need met'}
                </span>
              </button>
            </div>

            {/* Wake Time Input & Test Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#FFDE00]" />
                <span className="text-xs font-bold font-sans text-white uppercase">
                  {isRtl ? 'وقت الاستيقاظ' : 'Wake Target'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="bg-[#16191E] border border-white/10 rounded-lg px-2.5 py-1 text-sm font-bold font-condensed text-white outline-none"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleTestVibration}
                  disabled={isTestingBuzz}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-condensed font-bold text-zinc-300 hover:text-white flex items-center gap-1 active:scale-95 transition-all"
                  title={isRtl ? 'اختبار اهتزاز السوار' : 'Test Strap Vibration'}
                >
                  <Play className={`w-3 h-3 ${isTestingBuzz ? 'animate-spin' : ''}`} />
                  <span>{testSuccess ? (isRtl ? 'تم الاهتزاز!' : 'Buzzed!') : (isRtl ? 'تجربة' : 'Test')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sleep Need Breakdown */}
          <div className="bg-[#12151A] border border-white/5 rounded-2xl p-4 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider font-condensed text-zinc-400 block mb-1">
              {isRtl ? 'تفصيل الاحتياج الفسيولوجي للنوم' : 'Physiological Sleep Need Breakdown'}
            </span>

            <div className="flex items-center justify-between text-xs font-condensed">
              <span className="text-zinc-400">{isRtl ? 'الاحتياج الأساسي للبالغ' : 'Baseline Adult Requirement'}</span>
              <span className="font-bold text-white" dir="ltr">{baselineHours.toFixed(1)}h</span>
            </div>

            <div className="flex items-center justify-between text-xs font-condensed">
              <span className="text-zinc-400">{isRtl ? `طلب الإجهاد (من ${metrics.dailyStrain.toFixed(1)} إجهاد)` : `Strain Debt (From ${metrics.dailyStrain.toFixed(1)} Strain)`}</span>
              <span className="font-bold text-[#0093E9]" dir="ltr">+{strainDebtHours.toFixed(1)}h</span>
            </div>

            <div className="flex items-center justify-between text-xs font-condensed">
              <span className="text-zinc-400">{isRtl ? 'عجز النوم المتراكم مؤخراً' : 'Recent Sleep Debt'}</span>
              <span className="font-bold text-[#FFDE00]" dir="ltr">+{sleepDebtHours.toFixed(1)}h</span>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-condensed font-black">
              <span className="text-white uppercase tracking-wider">{isRtl ? 'إجمالي الاحتياج للنوم' : 'Total Sleep Need'}</span>
              <span className="text-sm text-[#16EC06]" dir="ltr">{totalNeedHours.toFixed(1)}h</span>
            </div>
          </div>

          {/* Night Lock Quick Launcher */}
          <div className="bg-[#16191E] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">
                {isRtl ? 'قفل النوم الأسود OLED' : 'OLED Pitch-Black Sleep Lock'}
              </span>
              <span className="text-[10px] text-zinc-400 font-condensed block">
                {isRtl ? 'يبقي الشاشة متصلة مع سواد تام وساعة رقمية خافتة' : 'Keeps screen awake with zero OLED pixel glow & live clock'}
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onLaunchOledNightLock();
              }}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-condensed font-bold text-xs uppercase tracking-wider"
            >
              {isRtl ? 'تشغيل القفل' : 'Launch Lock'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-[#0B0D10] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-condensed font-bold text-zinc-400 hover:text-white uppercase"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSetAlarm}
            className="px-6 py-2 rounded-full bg-white text-black font-condensed font-black text-xs uppercase tracking-wider active:scale-95 transition-transform shadow-lg"
          >
            {isRtl ? 'حفظ المنبه وموعد النوم' : 'Save Alarm & Sleep Plan'}
          </button>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
