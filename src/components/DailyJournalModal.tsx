import React, { useState, useEffect } from 'react';
import { X, Check, TrendingUp, TrendingDown, BookOpen, Sparkles } from 'lucide-react';
import type { LiveMetrics } from '../types/whoop';

interface DailyJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
}

interface BehaviorItem {
  id: string;
  name: string;
  category: 'nutrition' | 'recovery' | 'lifestyle';
  icon: string;
  impactPct: number; // e.g. +8% or -12% on recovery
  selected: boolean;
}

const DEFAULT_BEHAVIORS: BehaviorItem[] = [
  { id: 'sunlight', name: 'Morning Sunlight (15m)', category: 'lifestyle', icon: '☀️', impactPct: 6, selected: false },
  { id: 'hydration', name: 'Hydration Target (3L+)', category: 'nutrition', icon: '💧', impactPct: 5, selected: false },
  { id: 'magnesium', name: 'Magnesium L-Threonate', category: 'nutrition', icon: '💊', impactPct: 8, selected: false },
  { id: 'creatine', name: 'Creatine Monohydrate', category: 'nutrition', icon: '⚡', impactPct: 3, selected: false },
  { id: 'stretching', name: 'Mobility & Stretching', category: 'recovery', icon: '🧘', impactPct: 7, selected: false },
  { id: 'sauna', name: 'Sauna Session (20m)', category: 'recovery', icon: '🧖', impactPct: 9, selected: false },
  { id: 'cold_shower', name: 'Cold Plunge / Shower', category: 'recovery', icon: '❄️', impactPct: 4, selected: false },
  { id: 'meditation', name: 'Mindfulness Breathwork', category: 'recovery', icon: '🧠', impactPct: 8, selected: false },
  { id: 'reading', name: 'Reading in Bed (No Phone)', category: 'lifestyle', icon: '📖', impactPct: 7, selected: false },
  { id: 'melatonin', name: 'Melatonin / Tart Cherry', category: 'nutrition', icon: '🍒', impactPct: 4, selected: false },
  { id: 'caffeine_late', name: 'Caffeine after 2 PM', category: 'nutrition', icon: '☕', impactPct: -11, selected: false },
  { id: 'late_meal', name: 'Late Meal (<2h to bed)', category: 'nutrition', icon: '🍕', impactPct: -9, selected: false },
  { id: 'alcohol', name: 'Alcohol Consumption', category: 'nutrition', icon: '🍺', impactPct: -24, selected: false },
  { id: 'screen_bed', name: 'Screen Time in Bed', category: 'lifestyle', icon: '📱', impactPct: -13, selected: false },
  { id: 'shared_bed', name: 'Shared Bed / Disturbance', category: 'lifestyle', icon: '🛏️', impactPct: -5, selected: false },
];

export const DailyJournalModal: React.FC<DailyJournalModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  const [behaviors, setBehaviors] = useState<BehaviorItem[]>(DEFAULT_BEHAVIORS);
  const [activeTab, setActiveTab] = useState<'log' | 'impact'>('log');

  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`whoop_journal_${todayStr}`);
      if (saved) {
        const selectedIds: string[] = JSON.parse(saved);
        setBehaviors((prev) =>
          prev.map((b) => ({ ...b, selected: selectedIds.includes(b.id) }))
        );
      }
    } catch {
      // Ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleBehavior = (id: string) => {
    const updated = behaviors.map((b) => (b.id === id ? { ...b, selected: !b.selected } : b));
    setBehaviors(updated);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const selectedIds = updated.filter((b) => b.selected).map((b) => b.id);
      localStorage.setItem(`whoop_journal_${todayStr}`, JSON.stringify(selectedIds));
    } catch {
      // Ignore
    }
  };

  const selectedCount = behaviors.filter((b) => b.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-[#0B0D10] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] flex flex-col overflow-hidden text-white shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#16EC06]/15 border border-[#16EC06]/30 flex items-center justify-center text-[#16EC06]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-white">
                WHOOP Daily Journal
              </h3>
              <p className="text-[11px] text-zinc-400 font-condensed">
                {selectedCount} Behaviors Tracked Today
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

        {/* View Mode Toggle */}
        <div className="flex border-b border-white/5 bg-[#12151A]">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-3 text-xs font-black font-condensed uppercase tracking-wider transition-colors relative ${
              activeTab === 'log' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>Log Behaviors</span>
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
            <span>Recovery Impact Analysis</span>
            {activeTab === 'impact' && (
              <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#16EC06] rounded-full" />
            )}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'log' ? (
            <>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Select your behaviors from today to calibrate your personal autonomic recovery impact model.
              </p>

              <div className="space-y-2">
                {behaviors.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleBehavior(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left active:scale-[0.98] ${
                      item.selected
                        ? 'bg-[#16EC06]/10 border-[#16EC06]/40 text-white'
                        : 'bg-[#12151A] border-white/5 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <span className="text-xs font-bold font-sans block text-white">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-condensed uppercase">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        item.selected
                          ? 'bg-[#16EC06] text-black font-black'
                          : 'bg-[#16191E] border border-white/10 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Recovery Impact Analysis Chart */}
              <div className="bg-[#12151A] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#16EC06]" />
                  <h4 className="text-xs font-bold text-white uppercase font-sans tracking-wide">
                    Autonomic Correlation Model
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Based on your longitudinal WHOOP recovery records, here is how each logged behavior influences your next-day Recovery score:
                </p>

                <div className="space-y-2.5 pt-2">
                  {behaviors
                    .sort((a, b) => b.impactPct - a.impactPct)
                    .map((item) => {
                      const isPositive = item.impactPct > 0;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191E] border border-white/5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base">{item.icon}</span>
                            <span className="text-xs font-bold text-white font-sans truncate">
                              {item.name}
                            </span>
                          </div>

                          <div
                            className={`flex items-center gap-1 font-condensed font-black text-xs tabular-nums px-2 py-0.5 rounded-full ${
                              isPositive
                                ? 'bg-[#16EC06]/15 text-[#16EC06]'
                                : 'bg-[#FF0026]/15 text-[#FF0026]'
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{isPositive ? `+${item.impactPct}%` : `${item.impactPct}%`}</span>
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
        <div className="p-3 border-t border-white/5 bg-[#0B0D10] flex items-center justify-between text-xs font-condensed">
          <span className="text-zinc-500">
            Recorded against live recovery baseline
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-full bg-white text-black font-black uppercase tracking-wider active:scale-95 transition-transform"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
