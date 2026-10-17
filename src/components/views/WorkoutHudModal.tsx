import React from 'react';
import type { LiveMetrics, HrZoneInfo, UserSettings } from '../../types/whoop';
import {
  Activity,
  Flame,
  Clock,
  Square,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { banisterTrimpIncrement, calculateStrainFromTrimp } from '../../utils/strainModel';
import { hapticSuccess, hapticLight } from '../../utils/haptics';

interface WorkoutHudModalProps {
  isOpen: boolean;
  onClose: () => void;
  sport: string;
  elapsedSec: number;
  currentHr: number | null;
  activeCalories: number;
  metrics: LiveMetrics;
  zones: HrZoneInfo[];
  settings: UserSettings;
  onEndAndSave: () => void;
}

export const WorkoutHudModal: React.FC<WorkoutHudModalProps> = ({
  isOpen,
  onClose,
  sport,
  elapsedSec,
  currentHr,
  activeCalories,
  metrics,
  zones,
  settings,
  onEndAndSave,
}) => {
  const { t, isRtl } = useLanguage();
  if (!isOpen) return null;

  const sportsMap: Record<string, string> = {
    Running: isRtl ? 'الجري' : 'Running',
    Weightlifting: isRtl ? 'رفع الأثقال' : 'Weightlifting',
    Cycling: isRtl ? 'الدراجة' : 'Cycling',
    'Functional Fitness': isRtl ? 'اللياقة الوظيفية' : 'Functional Fitness',
    HIIT: 'HIIT',
    Walking: isRtl ? 'المشي' : 'Walking',
    Swimming: isRtl ? 'السباحة' : 'Swimming',
    Rowing: isRtl ? 'التجديف' : 'Rowing',
    Yoga: isRtl ? 'اليوغا' : 'Yoga',
  };

  const formatSec = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Activity-specific strain calculation for live HUD using Banister TRIMP on HRR
  const validHr = currentHr || settings.restingHrBaseline;
  const female = settings.gender === 'female';
  const sessionTrimp = banisterTrimpIncrement(validHr, settings.restingHrBaseline, settings.maxHr, female, elapsedSec);
  const liveSessionStrain = calculateStrainFromTrimp(sessionTrimp);

  // Pulse animation duration
  const pulseDuration = currentHr && currentHr > 0 ? (60 / currentHr).toFixed(2) : '1.0';

  return (
    <div className="fixed inset-0 z-50 bg-black flex justify-center animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] min-h-dvh flex flex-col justify-between p-5 bg-black text-white relative">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0093E9] animate-ping" />
            <span className="text-xs font-black uppercase tracking-widest text-[#00B4D8] font-condensed">
              {isRtl ? 'نشاط مباشر' : 'LIVE ACTIVITY'}
            </span>
          </div>

          <div className="text-sm font-black uppercase tracking-wider text-white font-condensed">
            {sportsMap[sport] || sport}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white"
            title={isRtl ? 'تصغير' : 'Minimize HUD'}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Center Live Metrics Display */}
        <div className="space-y-6 my-auto py-4">
          {/* Main Activity Strain Meter */}
          <div className="text-center space-y-1">
            <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400 font-condensed">
              {t('activityStrain')}
            </div>
            <div className="text-7xl font-black font-condensed text-[#0093E9] tracking-tight tabular-nums" dir="ltr">
              {liveSessionStrain}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono" dir="ltr">
              {isRtl ? 'إجمالي اليوم: ' : 'DAY TOTAL: '}{(metrics.dailyStrain + liveSessionStrain * 0.4).toFixed(1)} / 21.0
            </div>
          </div>

          {/* Key Metrics Grid: Heart Rate, Elapsed, Calories */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Heart Rate */}
            <div className="p-3.5 rounded-2xl bg-[#16191E] border border-white/5 space-y-1">
              <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase text-zinc-400 font-condensed">
                <div
                  style={{
                    animation: currentHr && currentHr > 0 ? `heartbeat ${pulseDuration}s ease-in-out infinite` : 'none',
                  }}
                >
                  <Activity className="w-3.5 h-3.5 text-[#FF3344] fill-[#FF3344]" />
                </div>
                <span>{t('heartRate')}</span>
              </div>
              <div className="text-3xl font-black font-condensed text-white tabular-nums" dir="ltr">
                {currentHr !== null ? currentHr : '--'}
              </div>
              <div className="text-[10px] font-mono text-zinc-500">{t('bpm')}</div>
            </div>

            {/* Elapsed Time */}
            <div className="p-3.5 rounded-2xl bg-[#16191E] border border-white/5 space-y-1">
              <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase text-zinc-400 font-condensed">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t('duration')}</span>
              </div>
              <div className="text-2xl font-black font-mono text-white tabular-nums pt-1" dir="ltr">
                {formatSec(elapsedSec)}
              </div>
              <div className="text-[10px] font-mono text-zinc-500">{isRtl ? 'الوقت' : 'TIME'}</div>
            </div>

            {/* Active Calories */}
            <div className="p-3.5 rounded-2xl bg-[#16191E] border border-white/5 space-y-1">
              <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase text-zinc-400 font-condensed">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                <span>{t('calories')}</span>
              </div>
              <div className="text-3xl font-black font-condensed text-white tabular-nums" dir="ltr">
                {Math.round(activeCalories + (elapsedSec * 0.12))}
              </div>
              <div className="text-[10px] font-mono text-zinc-500">{isRtl ? 'سعرة' : 'KCAL'}</div>
            </div>
          </div>

          {/* Heart Rate Intensity Zone Bar */}
          <div className="p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-condensed">
              <span className="font-bold text-zinc-400 uppercase tracking-wider">
                {isRtl ? 'نطاق الشدة الحالي' : 'Current Intensity Zone'}
              </span>
              <span className="font-black text-[#0093E9] uppercase" dir="ltr">
                Zone {metrics.currentZone}: {zones.find((z) => z.zone === metrics.currentZone)?.name || (isRtl ? 'راحة' : 'Rest')}
              </span>
            </div>

            {/* Segmented Zone Progress */}
            <div className="grid grid-cols-5 gap-1.5 h-3">
              {zones.slice(1, 6).map((z) => {
                const isActive = metrics.currentZone >= z.zone;
                return (
                  <div
                    key={z.zone}
                    className="rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: isActive ? z.color : '#222730',
                      opacity: isActive ? 1 : 0.35,
                    }}
                  />
                );
              })}
            </div>

            <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-1" dir="ltr">
              <span>50%</span>
              <span>60%</span>
              <span>70%</span>
              <span>80%</span>
              <span>90-100%</span>
            </div>
          </div>
        </div>

        {/* Bottom End & Save Action */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <button
            onClick={() => {
              hapticSuccess();
              onEndAndSave();
            }}
            className="w-full py-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-[#FF3344] font-black text-sm uppercase tracking-widest font-condensed flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg shadow-rose-950/40"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>{isRtl ? 'إنهاء وحفظ التمرين' : 'End & Save Workout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
