import React from 'react';
import { LayoutDashboard, Dumbbell, Cpu, Timer } from 'lucide-react';

export type TabType = 'dashboard' | 'activities' | 'lab';

interface NavigationTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  packetCount: number;
  sessionCount: number;
  onOpenRecoveryTest: () => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onChangeTab,
  packetCount,
  sessionCount,
  onOpenRecoveryTest,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-whoop-border/70 pb-3 mb-6 gap-2 overflow-x-auto">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-whoop-card text-white border border-whoop-border shadow-md shadow-black/40'
              : 'text-whoop-muted hover:text-white hover:bg-whoop-card/50'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-whoop-cyan' : ''}`} />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => onChangeTab('activities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'activities'
              ? 'bg-whoop-card text-white border border-whoop-border shadow-md shadow-black/40'
              : 'text-whoop-muted hover:text-white hover:bg-whoop-card/50'
          }`}
        >
          <Dumbbell className={`w-4 h-4 ${activeTab === 'activities' ? 'text-whoop-crimson' : ''}`} />
          <span>Workouts & Sleep</span>
          {sessionCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-whoop-surface text-slate-300">
              {sessionCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onChangeTab('lab')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'lab'
              ? 'bg-whoop-card text-white border border-whoop-border shadow-md shadow-black/40'
              : 'text-whoop-muted hover:text-white hover:bg-whoop-card/50'
          }`}
        >
          <Cpu className={`w-4 h-4 ${activeTab === 'lab' ? 'text-purple-400' : ''}`} />
          <span>BLE Lab & Sniffer</span>
          {packetCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {packetCount}
            </span>
          )}
        </button>
      </div>

      <button
        onClick={onOpenRecoveryTest}
        className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-whoop-card text-whoop-green border border-whoop-green/30"
      >
        <Timer className="w-3.5 h-3.5" />
        <span>3-Min Test</span>
      </button>
    </div>
  );
};
