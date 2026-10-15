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
      <div className="relative w-full max-w-[430px] p-5 rounded-[24px] bg-[#16191E] border border-white/10 shadow-2xl space-y-3 animate-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Quick Actions
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-[#222730] text-zinc-400 hover:text-white"
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
            className="w-full p-3.5 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0093E9]/20 text-[#0093E9] flex items-center justify-center border border-[#0093E9]/30 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase text-white">Start Live Activity (Strain Coach)</div>
                <div className="text-[11px] text-zinc-400">Live Heart Rate, Zones & Session Strain</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectAction('sleep');
            }}
            className="w-full p-3.5 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7293B2]/20 text-[#7293B2] flex items-center justify-center border border-[#7293B2]/30 group-hover:scale-105 transition-transform">
                <Moon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase text-white">Start Sleep (OLED Night Lock)</div>
                <div className="text-[11px] text-zinc-400">Pure Black WakeLock Screen for Sleep Tracking</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectAction('recovery_test');
            }}
            className="w-full p-3.5 rounded-2xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#16EC06]/20 text-[#16EC06] flex items-center justify-center border border-[#16EC06]/30 group-hover:scale-105 transition-transform">
                <Timer className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase text-white">Measure Morning Recovery</div>
                <div className="text-[11px] text-zinc-400">3-Minute Resonant Paced HRV Assessment</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
