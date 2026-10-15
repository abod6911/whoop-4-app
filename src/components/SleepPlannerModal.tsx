import React, { useState } from 'react';
import { X, Moon, Bell, Shield, Sparkles, Clock, BedDouble, Sun } from 'lucide-react';
import type { LiveMetrics } from '../types/whoop';
import { notificationEngine } from '../services/notificationEngine';

interface SleepPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  onLaunchOledNightLock: () => void;
}

export const SleepPlannerModal: React.FC<SleepPlannerModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onLaunchOledNightLock,
}) => {
  const [goal, setGoal] = useState<'peak' | 'perform' | 'get_by'>('peak');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [smartAlarmEnabled, setSmartAlarmEnabled] = useState(true);

  if (!isOpen) return null;

  // Real Sleep Need Math based on WHOOP Physiology
  const baselineHours = 7.6; // Baseline adult requirement
  const strainDebtHours = Math.round((metrics.dailyStrain / 21.0) * 1.2 * 10) / 10; // Extra strain debt
  const sleepDebtHours = 0.5; // Recent accumulated debt

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
      title: smartAlarmEnabled ? '⏰ Smart Wake Alarm Set' : '⏰ Alarm Set',
      message: `Alarm set for ${wakeTime} (${smartAlarmEnabled ? 'Smart Wake window: 20 mins prior' : 'Exact time'}). Target bedtime: ${targetBedtimeStr}.`,
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
                WHOOP Sleep Planner
              </h3>
              <p className="text-[11px] text-zinc-400 font-condensed">
                Circadian Need & Smart Wake Alarm
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
              RECOMMENDED BEDTIME TONIGHT
            </span>
            <div className="text-5xl font-black font-condensed text-white tabular-nums my-1">
              {targetBedtimeStr}
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              To achieve <strong className="text-white font-bold">{Math.floor(targetHours)}h {Math.round((targetHours % 1) * 60)}m</strong> of restorative sleep before <strong className="text-white">{wakeTime}</strong>.
            </p>
          </div>

          {/* Goal Selector */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider font-condensed text-zinc-400 block mb-2">
              Select Sleep Goal
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'peak', label: '100% PEAK', desc: 'Max Recovery', color: 'border-[#16EC06]' },
                { id: 'perform', label: '85% PERFORM', desc: 'Active Day', color: 'border-[#0093E9]' },
                { id: 'get_by', label: '70% GET BY', desc: 'Minimum', color: 'border-[#FFDE00]' },
              ].map((g) => {
                const isSelected = goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
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
              Physiological Sleep Need Breakdown
            </span>

            <div className="flex items-center justify-between text-xs font-condensed">
              <span className="text-zinc-400">Baseline Adult Requirement</span>
              <span className="font-bold text-white">{baselineHours.toFixed(1)}h</span>
            </div>

            <div className="flex items-center justify-between text-xs font-condensed">
              <span className="text-zinc-400">Strain Debt (From {metrics.dailyStrain.toFixed(1)} Strain)</span>
              <span className="font-bold text-[#0093E9]">+{strainDebtHours.toFixed(1)}h</span>
            </div>

            <div className="flex items-center justify-between text-xs font-condensed">
              <span className="text-zinc-400">Recent Sleep Debt</span>
              <span className="font-bold text-[#FFDE00]">+{sleepDebtHours.toFixed(1)}h</span>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-condensed font-black">
              <span className="text-white uppercase tracking-wider">Total Sleep Need</span>
              <span className="text-sm text-[#16EC06]">{totalNeedHours.toFixed(1)}h</span>
            </div>
          </div>

          {/* Wake Time & Smart Alarm Toggle */}
          <div className="bg-[#12151A] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#FFDE00]" />
                <span className="text-xs font-bold font-sans text-white uppercase">
                  Target Wake Time
                </span>
              </div>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="bg-[#16191E] border border-white/10 rounded-lg px-2.5 py-1 text-sm font-bold font-condensed text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <span className="text-xs font-bold font-sans text-white block">
                  Smart Wake Alarm
                </span>
                <span className="text-[10px] text-zinc-400 font-condensed block">
                  Wakes you in light sleep up to 20m before {wakeTime}
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
                OLED Pitch-Black Sleep Lock
              </span>
              <span className="text-[10px] text-zinc-400 font-condensed block">
                Keeps screen awake with zero OLED pixel glow & live clock
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onLaunchOledNightLock();
              }}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-condensed font-bold text-xs uppercase tracking-wider"
            >
              Launch Lock
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-[#0B0D10] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-condensed font-bold text-zinc-400 hover:text-white uppercase"
          >
            Cancel
          </button>
          <button
            onClick={handleSetAlarm}
            className="px-6 py-2 rounded-full bg-white text-black font-condensed font-black text-xs uppercase tracking-wider active:scale-95 transition-transform shadow-lg"
          >
            Set Alarm & Bedtime
          </button>
        </div>
      </div>
    </div>
  );
};
