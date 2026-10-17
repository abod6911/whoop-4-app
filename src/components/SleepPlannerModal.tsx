import React, { useState } from 'react';
import { X, Moon, Bell, Shield, Sparkles, Clock, BedDouble, Sun } from 'lucide-react';
import type { LiveMetrics, UserSettings } from '../types/whoop';
import { notificationEngine } from '../services/notificationEngine';
import { useLanguage } from '../i18n/LanguageContext';

interface SleepPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  onLaunchOledNightLock: () => void;
  settings?: UserSettings;
}

export const SleepPlannerModal: React.FC<SleepPlannerModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onLaunchOledNightLock,
  settings,
}) => {
  const { t, isRtl } = useLanguage();
  const [goal, setGoal] = useState<'peak' | 'perform' | 'get_by'>('peak');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [smartAlarmEnabled, setSmartAlarmEnabled] = useState(true);

  if (!isOpen) return null;

  // Real Sleep Need Math based on WHOOP Physiology
  const baselineHours = settings?.sleepNeedHours || 7.9; // User's personal baseline requirement
  const strainDebtHours = Math.round((metrics.dailyStrain / 21.0) * 1.2 * 10) / 10; // Extra strain debt
  const sleepDebtHours = 0; // Recent accumulated debt (starts at 0, no fake debt)

  const totalNeedHours = baselineHours + strainDebtHours + sleepDebtHours;

  const targetHours =
    goal === 'peak'
      ? totalNeedHours // 100% Peak
      : goal === 'perform'
      ? totalNeedHours * 0.85 // 85% Perform
      : totalNeedHours * 0.70; // 70% Get By

  // Calculate Target Bedtime
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);
  const wakeTotalMin = wakeH * 60 + wakeM;
  const targetTotalMin = Math.round(targetHours * 60);
  let bedTotalMin = wakeTotalMin - targetTotalMin;
  if (bedTotalMin < 0) bedTotalMin += 24 * 60;
  const bedH = Math.floor(bedTotalMin / 60);
  const bedM = bedTotalMin % 60;
  const targetBedtimeStr = `${bedH.toString().padStart(2, '0')}:${bedM.toString().padStart(2, '0')}`;

  const handleSetAlarm = () => {
    notificationEngine.dispatch({
      type: 'sleep',
      title: smartAlarmEnabled ? (isRtl ? '⏰ تم ضبط منبه الاستيقاظ الذكي' : '⏰ Smart Wake Alarm Set') : (isRtl ? '⏰ تم ضبط المنبه' : '⏰ Alarm Set'),
      message: isRtl
        ? `تم ضبط المنبه على ${wakeTime} (${smartAlarmEnabled ? 'نافذة الاستيقاظ الذكي: 20 دقيقة قبل' : 'الوقت المحدد'}). موعد النوم المقترح: ${targetBedtimeStr}.`
        : `Alarm set for ${wakeTime} (${smartAlarmEnabled ? 'Smart Wake window: 20 mins prior' : 'Exact time'}). Target bedtime: ${targetBedtimeStr}.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-[#0B0D10] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7395B7]/15 border border-[#7395B7]/30 flex items-center justify-center text-[#7395B7]">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-white">
                {isRtl ? 'مخطط النوم WHOOP' : 'WHOOP Sleep Planner'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-condensed">
                {isRtl ? 'الاحتياج اليومي ومنبه الاستيقاظ الذكي' : 'Circadian Need & Smart Wake Alarm'}
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
          {/* Target Bedtime Hero Card */}
          <div className="bg-gradient-to-b from-[#161C24] to-[#12151A] border border-white/10 rounded-3xl p-5 text-center">
            <span className="text-[11px] font-black uppercase tracking-widest font-condensed text-[#7395B7]">
              {isRtl ? 'وقت النوم المقترح الليلة' : 'RECOMMENDED BEDTIME TONIGHT'}
            </span>
            <div className="text-5xl font-black font-condensed text-white tabular-nums my-1" dir="ltr">
              {targetBedtimeStr}
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              {isRtl ? (
                <>لتحقيق <strong className="text-white font-bold" dir="ltr">{Math.floor(targetHours)}h {Math.round((targetHours % 1) * 60)}m</strong> من النوم التعويضي قبل <strong className="text-white" dir="ltr">{wakeTime}</strong>.</>
              ) : (
                <>To achieve <strong className="text-white font-bold">{Math.floor(targetHours)}h {Math.round((targetHours % 1) * 60)}m</strong> of restorative sleep before <strong className="text-white">{wakeTime}</strong>.</>
              )}
            </p>
          </div>

          {/* Goal Selector */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider font-condensed text-zinc-400 block mb-2">
              {isRtl ? 'حدد هدف النوم' : 'Select Sleep Goal'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'peak', label: isRtl ? '100% ذروة' : '100% PEAK', desc: isRtl ? 'أقصى استشفاء' : 'Max Recovery', color: 'border-[#16EC06]' },
                { id: 'perform', label: isRtl ? '85% أداء' : '85% PERFORM', desc: isRtl ? 'يوم نشط' : 'Active Day', color: 'border-[#0093E9]' },
                { id: 'get_by', label: isRtl ? '70% حد أدنى' : '70% GET BY', desc: isRtl ? 'الحد الأدنى' : 'Minimum', color: 'border-[#FFDE00]' },
              ].map((g) => {
                const isSelected = goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id as any)}
                    className={`p-3 rounded-2xl border text-start transition-all ${
                      isSelected
                        ? `bg-white/10 ${g.color} text-white`
                        : 'bg-[#12151A] border-white/5 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-black font-condensed block">
                      {g.label}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-condensed block mt-0.5">
                      {g.desc}
                    </span>
                  </button>
                );
              })}
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

          {/* Wake Time & Smart Alarm Toggle */}
          <div className="bg-[#12151A] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#FFDE00]" />
                <span className="text-xs font-bold font-sans text-white uppercase">
                  {isRtl ? 'وقت الاستيقاظ المستهدف' : 'Target Wake Time'}
                </span>
              </div>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="bg-[#16191E] border border-white/10 rounded-lg px-2.5 py-1 text-sm font-bold font-condensed text-white outline-none"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <span className="text-xs font-bold font-sans text-white block">
                  {isRtl ? 'منبه الاستيقاظ الذكي' : 'Smart Wake Alarm'}
                </span>
                <span className="text-[10px] text-zinc-400 font-condensed block">
                  {isRtl ? `يوقظك في مرحلة النوم الخفيف حتى 20 دقيقة قبل ${wakeTime}` : `Wakes you in light sleep up to 20m before ${wakeTime}`}
                </span>
              </div>
              <button
                onClick={() => setSmartAlarmEnabled(!smartAlarmEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  smartAlarmEnabled ? 'bg-[#16EC06]' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    smartAlarmEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
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
            {isRtl ? 'تفعيل المنبه ووقت النوم' : 'Set Alarm & Bedtime'}
          </button>
        </div>
      </div>
    </div>
  );
};
