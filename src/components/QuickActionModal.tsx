import React from 'react';
import { Dumbbell, Moon, Timer, X } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'activity' | 'sleep' | 'recovery_test') => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-[430px] p-5 rounded-3xl bg-whoop-card border border-whoop-border shadow-2xl space-y-3 animate-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Quick Actions
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-whoop-surface text-whoop-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 font-condensed">
          <button
            onClick={() => {
              onClose();
              onSelectAction('activity');
            }}
            className="w-full p-3.5 rounded-2xl bg-whoop-surface hover:bg-whoop-border border border-whoop-border/80 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-whoop-blue/20 text-whoop-blue flex items-center justify-center border border-whoop-blue/30 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase text-white">Start Live Workout</div>
                <div className="text-[11px] text-whoop-gray">Live Strain Coach & Heart Rate Zones</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectAction('sleep');
            }}
            className="w-full p-3.5 rounded-2xl bg-whoop-surface hover:bg-whoop-border border border-whoop-border/80 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7395B7]/20 text-[#7395B7] flex items-center justify-center border border-[#7395B7]/30 group-hover:scale-105 transition-transform">
                <Moon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase text-white">Start Sleep + OLED Lock</div>
                <div className="text-[11px] text-whoop-gray">Nocturnal HRV & WakeLock Protection</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectAction('recovery_test');
            }}
            className="w-full p-3.5 rounded-2xl bg-whoop-surface hover:bg-whoop-border border border-whoop-border/80 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-whoop-green/20 text-whoop-green flex items-center justify-center border border-whoop-green/30 group-hover:scale-105 transition-transform">
                <Timer className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase text-white">Measure Morning Recovery</div>
                <div className="text-[11px] text-whoop-gray">3-Minute Resonant Paced HRV Assessment</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
