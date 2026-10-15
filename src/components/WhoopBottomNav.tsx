import React from 'react';
import type { MainTabType } from '../types/whoop';
import {
  Home,
  Compass,
  Plus,
  Radio,
  MoreHorizontal,
} from 'lucide-react';

interface WhoopBottomNavProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  onOpenQuickAction: () => void;
  packetCount: number;
}

export const WhoopBottomNav: React.FC<WhoopBottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenQuickAction,
  packetCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-t border-whoop-border/70 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[430px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Tab 1: Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            activeTab === 'home' ? 'text-white' : 'text-whoop-muted hover:text-whoop-gray'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            Home
          </span>
        </button>

        {/* Tab 2: Coaching */}
        <button
          onClick={() => onChangeTab('coaching')}
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            activeTab === 'coaching' ? 'text-white' : 'text-whoop-muted hover:text-whoop-gray'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            Coaching
          </span>
        </button>

        {/* Tab 3: Center Glowing Action Button */}
        <div className="flex items-center justify-center flex-1 -mt-4">
          <button
            onClick={onOpenQuickAction}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-whoop-blue via-[#00B4D8] to-whoop-green p-[2px] shadow-lg shadow-cyan-500/25 active:scale-95 transition-transform"
          >
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center hover:bg-whoop-surface transition-colors">
              <Plus className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* Tab 4: Strap / BLE Lab */}
        <button
          onClick={() => onChangeTab('strap')}
          className={`flex flex-col items-center justify-center flex-1 relative transition-colors ${
            activeTab === 'strap' ? 'text-white' : 'text-whoop-muted hover:text-whoop-gray'
          }`}
        >
          <Radio className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            Strap / Lab
          </span>
          {packetCount > 0 && (
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-whoop-green animate-ping" />
          )}
        </button>

        {/* Tab 5: More */}
        <button
          onClick={() => onChangeTab('more')}
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            activeTab === 'more' ? 'text-white' : 'text-whoop-muted hover:text-whoop-gray'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-wider font-condensed mt-1">
            More
          </span>
        </button>
      </div>
    </nav>
  );
};
