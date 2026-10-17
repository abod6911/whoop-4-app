import React, { useState, useEffect } from 'react';
import { X, Check, TrendingUp, TrendingDown, BookOpen, Sparkles, Activity } from 'lucide-react';
import type { LiveMetrics, HabitCorrelationStat } from '../types/whoop';
import { journalEngine, WHOOP_STANDARD_HABITS } from '../services/journalEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';

interface DailyJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
}

const HABIT_ICONS: Record<string, string> = {
  alcohol: '🍺',
  caffeine_late: '☕',
  late_meal: '🍕',
  hydration_met: '💧',
  magnesium: '💊',
  screen_in_bed: '📱',
  breathwork: '🧘',
  cold_exposure: '❄️',
  outdoor_sunlight: '☀️',
  sleep_mask: '🥽',
};

export const DailyJournalModal: React.FC<DailyJournalModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  const { t, isRtl } = useLanguage();
  const [habitsMap, setHabitsMap] = useState<Record<string, boolean>>({});
  const [correlations, setCorrelations] = useState<HabitCorrelationStat[]>([]);
  const [activeTab, setActiveTab] = useState<'log' | 'impact'>('log');
  const [isSaving, setIsSaving] = useState(false);

  const todayKey = journalEngine.getTodayKey();

  useEffect(() => {
    if (!isOpen) return;

    // Load today's logged habits
    journalEngine.getEntry(todayKey).then((entry) => {
      if (entry && entry.habits) {
        const booleanMap: Record<string, boolean> = {};
        Object.entries(entry.habits).forEach(([k, v]) => {
          booleanMap[k] = Boolean(v);
        });
        setHabitsMap(booleanMap);
      } else {
        setHabitsMap({});
      }
    });

    // Compute live statistical recovery correlations
    journalEngine.computeCorrelations().then((stats) => {
      setCorrelations(stats);
    });
  }, [isOpen, todayKey]);

  if (!isOpen) return null;

  const toggleHabit = async (habitId: string) => {
    const updated = {
      ...habitsMap,
      [habitId]: !habitsMap[habitId],
    };
    setHabitsMap(updated);

    setIsSaving(true);
    await journalEngine.saveEntry(todayKey, updated);
    setIsSaving(false);

    // Refresh correlations dynamically
    const updatedCorrs = await journalEngine.computeCorrelations();
    setCorrelations(updatedCorrs);
  };

  const selectedCount = Object.values(habitsMap).filter(Boolean).length;

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#16EC06]/15 border border-[#16EC06]/30 flex items-center justify-center text-[#16EC06]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black font-condensed uppercase tracking-wider text-white">
                {isRtl ? 'يوميات WHOOP والسلوكيات' : 'WHOOP Daily Journal'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {selectedCount} {isRtl ? 'سلوكيات مسجلة اليوم' : 'Behaviors Tracked Today'}
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

        {/* Tab Toggle: Log Behaviors vs Recovery Impact Analysis */}
        <div className="flex border-b border-white/5 bg-[#12151A]">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-3 text-xs font-black font-condensed uppercase tracking-wider transition-colors relative ${
              activeTab === 'log' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>{isRtl ? 'تسجيل العادات' : 'Log Behaviors'}</span>
            {activeTab === 'log' && (
              <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#16EC06] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('impact')}
            className={`flex-1 py-3 text-xs font-black font-condensed uppercase tracking-wider transition-colors relative ${
              activeTab === 'impact' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>{isRtl ? 'تحليل تأثير التعافي' : 'Recovery Impact'}</span>
            {activeTab === 'impact' && (
              <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#16EC06] rounded-full" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'log' ? (
            <>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isRtl
                  ? 'سجّل عاداتك اليومية لمعايرة نموذج الارتباط الذاتي بين سلوكياتك ودرجة تعافيك صباح الغد.'
                  : 'Track your habits to calibrate your personalized biometric model of how behaviors impact your next-morning recovery.'}
              </p>

              <div className="space-y-2">
                {WHOOP_STANDARD_HABITS.map((habit) => {
                  const isChecked = Boolean(habitsMap[habit.id]);
                  const icon = HABIT_ICONS[habit.id] || '⚡';
                  const title = isRtl ? habit.titleAr : habit.titleEn;

                  return (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-start active:scale-[0.98] ${
                        isChecked
                          ? 'bg-[#16EC06]/10 border-[#16EC06]/40 text-white'
                          : 'bg-[#12151A] border-white/5 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <div>
                          <span className="text-xs font-bold font-sans block text-white">
                            {title}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-condensed uppercase">
                            {habit.category}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-[#16EC06] text-black font-black'
                            : 'bg-[#16191E] border border-white/10 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Statistical Correlation Engine Outputs */}
              <div className="bg-[#12151A] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#16EC06]" />
                  <h4 className="text-xs font-bold text-white uppercase font-sans tracking-wide">
                    {isRtl ? 'نموذج الارتباط الذاتي المتقدم' : 'Autonomic Correlation Model'}
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {isRtl
                    ? 'بناءً على سجلاتك الفسيولوجية، يوضح هذا الجدول متوسط الزيادة أو النقصان في درجة التعافي عند ممارسة كل سلوك:'
                    : 'Derived from your longitudinal WHOOP recovery records, here is how each logged habit shifts your next-morning recovery score:'}
                </p>

                <div className="space-y-2 pt-2">
                  {correlations
                    .sort((a, b) => b.impactPercent - a.impactPercent)
                    .map((item) => {
                      const isPositive = item.impactPercent > 0;
                      const habitDef = WHOOP_STANDARD_HABITS.find((h) => h.id === item.habitId);
                      const icon = HABIT_ICONS[item.habitId] || '⚡';
                      const title = isRtl && habitDef ? habitDef.titleAr : item.title;

                      return (
                        <div
                          key={item.habitId}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#16191E] border border-white/5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg">{icon}</span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white font-sans block truncate">
                                {title}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {isRtl
                                  ? `${item.withCount} أيام مسجلة`
                                  : `${item.withCount} days logged`}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`flex items-center gap-1 font-condensed font-black text-xs tabular-nums px-2.5 py-1 rounded-full ${
                              isPositive
                                ? 'bg-[#16EC06]/15 text-[#16EC06] border border-[#16EC06]/30'
                                : 'bg-[#FF3344]/15 text-[#FF3344] border border-[#FF3344]/30'
                            }`}
                            dir="ltr"
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            <span>{isPositive ? `+${item.impactPercent}%` : `${item.impactPercent}%`}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/5 bg-[#0B0D10] flex items-center justify-between text-xs font-condensed">
          <span className="text-zinc-500 font-mono">
            {isRtl ? 'محفوظ محلياً في Dexie DB' : 'Persisted locally in Dexie DB'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-wider active:scale-95 transition-transform"
          >
            {isRtl ? 'حفظ وإغلاق' : 'Save & Close'}
          </button>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
